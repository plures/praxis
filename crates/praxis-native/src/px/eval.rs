//! Unified expression evaluator for .px expressions.
//!
//! Evaluates arbitrary .px expressions against a variable context using the
//! pest grammar's `expr` rule. Handles literals, variable references, dotted
//! access, bracket access, arithmetic, comparison, logic, string concatenation,
//! function calls (via NativeFunctionRegistry), inline conditionals, and more.
//!
//! # Usage
//!
//! ```ignore
//! use std::collections::HashMap;
//! use serde_json::{json, Value};
//! use praxis_native::px::eval::evaluate;
//!
//! let mut vars = HashMap::new();
//! vars.insert("x".to_string(), json!(10));
//! vars.insert("y".to_string(), json!(20));
//!
//! let result = evaluate("$x + $y", &vars).unwrap();
//! assert_eq!(result, json!(30));
//! ```

use std::collections::HashMap;

use pest::Parser;
use serde_json::Value;

use super::{PxParser, Rule};
use crate::native_functions::NativeFunctionRegistry;

// ── Error Type ────────────────────────────────────────────────────────────────

/// Errors that can occur during expression evaluation.
#[derive(Debug, Clone, PartialEq)]
pub enum EvalError {
    /// Expression failed to parse.
    ParseError(String),
    /// Division by zero.
    DivisionByZero,
    /// Unknown function was called.
    UnknownFunction(String),
    /// Function call failed.
    FunctionError(String),
    /// Type error in operation.
    TypeError(String),
}

impl std::fmt::Display for EvalError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EvalError::ParseError(msg) => write!(f, "parse error: {msg}"),
            EvalError::DivisionByZero => write!(f, "division by zero"),
            EvalError::UnknownFunction(name) => write!(f, "unknown function: {name}"),
            EvalError::FunctionError(msg) => write!(f, "function error: {msg}"),
            EvalError::TypeError(msg) => write!(f, "type error: {msg}"),
        }
    }
}

impl std::error::Error for EvalError {}

// ── Public API ────────────────────────────────────────────────────────────────

/// Evaluate a .px expression string against a variable context.
///
/// Uses the pest grammar's `expr` rule for parsing, then walks the parse tree
/// to produce a `serde_json::Value` result.
///
/// # Variable Resolution
/// - `$name` → lookup in vars map
/// - `$name.field` → nested JSON access
/// - `$arr[0]` → array index access
/// - `$map["key"]` → object key access
///
/// # Null Propagation
/// Accessing a missing field or variable returns `Value::Null` (not an error).
///
/// # Errors
/// - `EvalError::ParseError` if the expression doesn't parse
/// - `EvalError::DivisionByZero` for `x / 0`
/// - `EvalError::UnknownFunction` for unregistered function calls
pub fn evaluate(expr: &str, vars: &HashMap<String, Value>) -> Result<Value, EvalError> {
    let registry = NativeFunctionRegistry::new();
    evaluate_with_registry(expr, vars, &registry)
}

/// Evaluate with a custom function registry.
pub fn evaluate_with_registry(
    expr: &str,
    vars: &HashMap<String, Value>,
    registry: &NativeFunctionRegistry,
) -> Result<Value, EvalError> {
    let expr = expr.trim();
    if expr.is_empty() {
        return Ok(Value::Null);
    }

    // Pre-process: strip `$` prefix from variable references so the grammar's
    // `dotted_ident` rule can handle `$var.field` and `$var[idx]` patterns.
    let preprocessed = preprocess_expr(expr);

    let pairs = PxParser::parse(Rule::expr, &preprocessed)
        .map_err(|e| EvalError::ParseError(format!("{e}")))?;

    let pair = pairs
        .into_iter()
        .next()
        .ok_or_else(|| EvalError::ParseError("empty parse result".into()))?;

    eval_expr(pair, vars, registry)
}

// ── Pre-processing ────────────────────────────────────────────────────────────

/// Prefix used to mark variable references in preprocessed expressions.
/// After preprocessing, `$var` becomes `_V_var` so we can distinguish
/// variable lookups (return Null if missing) from bare identifiers
/// (return as String if not in vars).
const VAR_PREFIX: &str = "_V_";

/// Replace `$varname` with `_V_varname` outside of string literals.
/// This preserves the ability for the grammar's `dotted_ident` rule to
/// handle `_V_ship.x` and `_V_arr[0]` patterns, while letting us
/// distinguish var refs from bare idents during evaluation.
fn preprocess_expr(expr: &str) -> String {
    let mut result = String::with_capacity(expr.len() + 16);
    let chars: Vec<char> = expr.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        match chars[i] {
            // Skip string contents
            '"' => {
                result.push('"');
                i += 1;
                while i < chars.len() && chars[i] != '"' {
                    result.push(chars[i]);
                    i += 1;
                }
                if i < chars.len() {
                    result.push('"');
                    i += 1;
                }
            }
            '\'' => {
                result.push('\'');
                i += 1;
                while i < chars.len() && chars[i] != '\'' {
                    result.push(chars[i]);
                    i += 1;
                }
                if i < chars.len() {
                    result.push('\'');
                    i += 1;
                }
            }
            // Replace $var with _V_var
            '$' => {
                if i + 1 < chars.len() && (chars[i + 1].is_ascii_alphabetic() || chars[i + 1] == '_') {
                    result.push_str(VAR_PREFIX);
                    i += 1; // skip the $
                } else {
                    result.push('$');
                    i += 1;
                }
            }
            c => {
                result.push(c);
                i += 1;
            }
        }
    }

    result
}

// ── Internal Evaluation ───────────────────────────────────────────────────────

type Pair<'a> = pest::iterators::Pair<'a, Rule>;

fn eval_expr(pair: Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<Value, EvalError> {
    match pair.as_rule() {
        Rule::expr => {
            let mut inner = pair.into_inner().peekable();

            // Check for inline_if first
            if let Some(first) = inner.peek() {
                if first.as_rule() == Rule::inline_if {
                    let inline_if = inner.next().unwrap();
                    return eval_inline_if(inline_if, vars, registry);
                }
            }

            // Otherwise: comparison (logic_op comparison)*
            let first = inner.next().ok_or_else(|| EvalError::ParseError("empty expr".into()))?;
            let mut result = eval_expr(first, vars, registry)?;

            while let Some(op_pair) = inner.next() {
                let op = op_pair.as_str().trim().to_lowercase();
                let right_pair = inner.next().ok_or_else(|| EvalError::ParseError("missing right operand for logic op".into()))?;
                let right = eval_expr(right_pair, vars, registry)?;

                result = match op.as_str() {
                    "and" | "&&" => Value::Bool(is_truthy(&result) && is_truthy(&right)),
                    "or" | "||" => Value::Bool(is_truthy(&result) || is_truthy(&right)),
                    _ => return Err(EvalError::ParseError(format!("unknown logic op: {op}"))),
                };
            }

            Ok(result)
        }

        Rule::inline_if => eval_inline_if(pair, vars, registry),

        Rule::comparison => {
            let mut inner = pair.into_inner();
            let left_pair = inner.next().ok_or_else(|| EvalError::ParseError("empty comparison".into()))?;
            let left = eval_expr(left_pair, vars, registry)?;

            if let Some(op_pair) = inner.next() {
                let op = op_pair.as_str();
                let right_pair = inner.next().ok_or_else(|| EvalError::ParseError("missing right operand".into()))?;
                let right = eval_expr(right_pair, vars, registry)?;
                Ok(Value::Bool(compare_values(&left, op, &right)))
            } else {
                Ok(left)
            }
        }

        Rule::additive => {
            let mut inner = pair.into_inner();
            let first = inner.next().ok_or_else(|| EvalError::ParseError("empty additive".into()))?;
            let mut result = eval_expr(first, vars, registry)?;

            while let Some(op_pair) = inner.next() {
                let op = op_pair.as_str().trim();
                let right_pair = inner.next().ok_or_else(|| EvalError::ParseError("missing right operand".into()))?;
                let right = eval_expr(right_pair, vars, registry)?;

                result = eval_add_op(&result, op, &right)?;
            }

            Ok(result)
        }

        Rule::multiplicative => {
            let mut inner = pair.into_inner();
            let first = inner.next().ok_or_else(|| EvalError::ParseError("empty multiplicative".into()))?;
            let mut result = eval_expr(first, vars, registry)?;

            while let Some(op_pair) = inner.next() {
                let op = op_pair.as_str().trim();
                let right_pair = inner.next().ok_or_else(|| EvalError::ParseError("missing right operand".into()))?;
                let right = eval_expr(right_pair, vars, registry)?;

                result = eval_mul_op(&result, op, &right)?;
            }

            Ok(result)
        }

        Rule::power => {
            let mut inner = pair.into_inner();
            let first = inner.next().ok_or_else(|| EvalError::ParseError("empty power".into()))?;
            let mut result = eval_expr(first, vars, registry)?;

            // Power is right-associative, but we process left-to-right for simple cases
            for right_pair in inner {
                let right = eval_expr(right_pair, vars, registry)?;
                let base = to_f64(&result).ok_or_else(|| EvalError::TypeError("power base must be numeric".into()))?;
                let exp = to_f64(&right).ok_or_else(|| EvalError::TypeError("power exponent must be numeric".into()))?;
                result = f64_to_value(base.powf(exp));
            }

            Ok(result)
        }

        Rule::unary => {
            let mut inner = pair.into_inner();
            let child = inner.next().ok_or_else(|| EvalError::ParseError("empty unary".into()))?;
            eval_expr(child, vars, registry)
        }

        Rule::neg_expr => {
            let mut inner = pair.into_inner();
            let operand = inner.next().ok_or_else(|| EvalError::ParseError("empty neg_expr".into()))?;
            let val = eval_expr(operand, vars, registry)?;
            let n = to_f64(&val).ok_or_else(|| EvalError::TypeError("negation requires numeric operand".into()))?;
            Ok(f64_to_value(-n))
        }

        Rule::not_expr => {
            let mut inner = pair.into_inner();
            let operand = inner.next().ok_or_else(|| EvalError::ParseError("empty not_expr".into()))?;
            let val = eval_expr(operand, vars, registry)?;
            Ok(Value::Bool(!is_truthy(&val)))
        }

        Rule::atom => {
            let inner = pair.into_inner().next().ok_or_else(|| EvalError::ParseError("empty atom".into()))?;
            eval_expr(inner, vars, registry)
        }

        Rule::call_expr => eval_call_expr(pair, vars, registry),

        Rule::match_expr => eval_match_expr(pair, vars, registry),

        Rule::dotted_ident => eval_dotted_ident(pair.as_str(), vars),

        Rule::value => {
            let inner = pair.into_inner().next().ok_or_else(|| EvalError::ParseError("empty value".into()))?;
            eval_expr(inner, vars, registry)
        }

        Rule::var_ref => {
            // After preprocessing, this shouldn't normally be reached, but handle it anyway
            let name = pair.as_str().strip_prefix('$').unwrap_or(pair.as_str());
            Ok(vars.get(name).cloned().unwrap_or(Value::Null))
        }

        Rule::string => {
            let raw = pair.as_str();
            // Strip surrounding quotes
            let inner = if (raw.starts_with('"') && raw.ends_with('"'))
                || (raw.starts_with('\'') && raw.ends_with('\''))
            {
                &raw[1..raw.len() - 1]
            } else {
                raw
            };
            Ok(Value::String(inner.to_string()))
        }

        Rule::integer => {
            let s = pair.as_str();
            let n: i64 = s.parse().map_err(|e| EvalError::ParseError(format!("invalid integer: {e}")))?;
            Ok(Value::Number(serde_json::Number::from(n)))
        }

        Rule::float => {
            let s = pair.as_str();
            let n: f64 = s.parse().map_err(|e| EvalError::ParseError(format!("invalid float: {e}")))?;
            Ok(f64_to_value(n))
        }

        Rule::boolean => {
            let s = pair.as_str();
            Ok(Value::Bool(s == "true"))
        }

        Rule::list_val => {
            let items: Result<Vec<Value>, EvalError> = pair
                .into_inner()
                .map(|p| eval_expr(p, vars, registry))
                .collect();
            Ok(Value::Array(items?))
        }

        Rule::map_val => eval_map_val(pair, vars, registry),

        Rule::ident => {
            // A bare identifier — could be an enum value like "green"
            // or a variable name with _V_ prefix (after preprocessing).
            let name = pair.as_str();
            // Handle boolean keywords
            match name {
                "true" => Ok(Value::Bool(true)),
                "false" => Ok(Value::Bool(false)),
                "null" => Ok(Value::Null),
                _ => {
                    // Check if it's a preprocessed variable reference
                    if let Some(var_name) = name.strip_prefix(VAR_PREFIX) {
                        Ok(vars.get(var_name).cloned().unwrap_or(Value::Null))
                    } else if let Some(val) = vars.get(name) {
                        Ok(val.clone())
                    } else {
                        Ok(Value::String(name.to_string()))
                    }
                }
            }
        }

        // For anything else that wraps a single child, recurse
        _ => {
            let mut inner = pair.into_inner();
            if let Some(child) = inner.next() {
                eval_expr(child, vars, registry)
            } else {
                Err(EvalError::ParseError("unexpected rule in eval".to_string()))
            }
        }
    }
}

// ── Inline If ─────────────────────────────────────────────────────────────────

fn eval_inline_if(pair: Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<Value, EvalError> {
    let mut inner = pair.into_inner();
    let condition = inner.next().ok_or_else(|| EvalError::ParseError("inline_if: missing condition".into()))?;
    let then_expr = inner.next().ok_or_else(|| EvalError::ParseError("inline_if: missing then".into()))?;
    let else_expr = inner.next().ok_or_else(|| EvalError::ParseError("inline_if: missing else".into()))?;

    let cond_val = eval_expr(condition, vars, registry)?;
    if is_truthy(&cond_val) {
        eval_expr(then_expr, vars, registry)
    } else {
        eval_expr(else_expr, vars, registry)
    }
}

// ── Function Calls ────────────────────────────────────────────────────────────

fn eval_call_expr(pair: Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<Value, EvalError> {
    let mut inner = pair.into_inner();
    let name_pair = inner.next().ok_or_else(|| EvalError::ParseError("call_expr: missing function name".into()))?;
    let func_name = name_pair.as_str();

    // Evaluate arguments
    let mut args: Vec<Value> = Vec::new();
    for arg_pair in inner {
        args.push(eval_expr(arg_pair, vars, registry)?);
    }

    // Built-in functions not in the registry
    match func_name {
        "len" | "length" => {
            let arg = args.first().unwrap_or(&Value::Null);
            return Ok(match arg {
                Value::Array(arr) => Value::Number(serde_json::Number::from(arr.len())),
                Value::String(s) => Value::Number(serde_json::Number::from(s.len())),
                Value::Object(obj) => Value::Number(serde_json::Number::from(obj.len())),
                _ => Value::Number(serde_json::Number::from(0)),
            });
        }
        "str" | "string" => {
            let arg = args.first().unwrap_or(&Value::Null);
            return Ok(Value::String(value_to_string(arg)));
        }
        "int" => {
            let arg = args.first().unwrap_or(&Value::Null);
            let n = to_f64(arg).unwrap_or(0.0) as i64;
            return Ok(Value::Number(serde_json::Number::from(n)));
        }
        "float" => {
            let arg = args.first().unwrap_or(&Value::Null);
            let n = to_f64(arg).unwrap_or(0.0);
            return Ok(f64_to_value(n));
        }
        _ => {}
    }

    // Delegate to registry and normalize the result
    let result = registry.call(func_name, &args).map_err(EvalError::UnknownFunction)?;

    // Normalize: if the function returns a float that's a whole number, convert to int
    Ok(normalize_numeric(result))
}

// ── Match Expression ──────────────────────────────────────────────────────────

fn eval_match_expr(pair: Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<Value, EvalError> {
    let mut inner = pair.into_inner();

    // match_subject
    let subject_pair = inner.next().ok_or_else(|| EvalError::ParseError("match_expr: missing subject".into()))?;
    let subject = eval_match_subject(subject_pair, vars, registry)?;

    // match_expr_arm_list
    let arm_list = inner.next().ok_or_else(|| EvalError::ParseError("match_expr: missing arm list".into()))?;

    for arm in arm_list.into_inner() {
        if arm.as_rule() != Rule::match_expr_arm {
            continue;
        }
        let mut arm_inner = arm.into_inner();
        let pattern = arm_inner.next().ok_or_else(|| EvalError::ParseError("match arm: missing pattern".into()))?;
        let result = arm_inner.next().ok_or_else(|| EvalError::ParseError("match arm: missing result".into()))?;

        if match_pattern_matches(&subject, &pattern, vars, registry)? {
            return eval_match_result(result, vars, registry);
        }
    }

    // No arm matched — return null
    Ok(Value::Null)
}

fn eval_match_subject(pair: Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<Value, EvalError> {
    let inner = pair.into_inner().next().ok_or_else(|| EvalError::ParseError("empty match subject".into()))?;
    eval_expr(inner, vars, registry)
}

fn match_pattern_matches(subject: &Value, pattern: &Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<bool, EvalError> {
    match pattern.as_rule() {
        Rule::match_pattern => {
            let inner = pattern.clone().into_inner().next();
            match inner {
                None => Ok(true), // wildcard `_`
                Some(p) => {
                    let pat_str = p.as_str().trim();
                    if pat_str == "_" {
                        return Ok(true);
                    }
                    // multi_pattern: val1 | val2 | val3
                    if p.as_rule() == Rule::multi_pattern {
                        for single in p.into_inner() {
                            let val = eval_expr(single, vars, registry)?;
                            if values_equal(subject, &val) {
                                return Ok(true);
                            }
                        }
                        return Ok(false);
                    }
                    let val = eval_expr(p, vars, registry)?;
                    Ok(values_equal(subject, &val))
                }
            }
        }
        _ => {
            let pat_str = pattern.as_str().trim();
            if pat_str == "_" {
                return Ok(true);
            }
            Ok(false)
        }
    }
}

fn eval_match_result(pair: Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<Value, EvalError> {
    let inner = pair.into_inner().next();
    match inner {
        Some(p) => eval_expr(p, vars, registry),
        None => Ok(Value::Null),
    }
}

// ── Map Value ─────────────────────────────────────────────────────────────────

fn eval_map_val(pair: Pair, vars: &HashMap<String, Value>, registry: &NativeFunctionRegistry) -> Result<Value, EvalError> {
    let mut map = serde_json::Map::new();
    let mut inner = pair.into_inner();

    while let Some(key_pair) = inner.next() {
        let key = key_pair.as_str().to_string();
        let val_pair = inner.next().ok_or_else(|| EvalError::ParseError("map: missing value".into()))?;
        let val = eval_expr(val_pair, vars, registry)?;
        map.insert(key, val);
    }

    Ok(Value::Object(map))
}

// ── Dotted Ident / Bracket Access ─────────────────────────────────────────────

fn eval_dotted_ident(raw: &str, vars: &HashMap<String, Value>) -> Result<Value, EvalError> {
    let raw = raw.trim();

    // Handle boolean/null keywords that dotted_ident may have captured
    // (since dotted_ident is tried before value.boolean in the atom rule)
    match raw {
        "true" => return Ok(Value::Bool(true)),
        "false" => return Ok(Value::Bool(false)),
        "null" => return Ok(Value::Null),
        _ => {}
    }

    // Check if this came from a $variable reference (marked with _V_ prefix)
    let is_var_ref = raw.starts_with(VAR_PREFIX);
    let effective_raw = if is_var_ref {
        &raw[VAR_PREFIX.len()..]
    } else {
        raw
    };

    // Split into base name and access path
    let (base_name, access_path) = split_base_and_path(effective_raw);

    // Resolve base from vars
    match vars.get(base_name) {
        Some(base_val) => {
            if access_path.is_empty() {
                Ok(base_val.clone())
            } else {
                Ok(resolve_path(base_val, &access_path))
            }
        }
        None => {
            if is_var_ref {
                // Was a $var reference — missing var returns Null
                Ok(Value::Null)
            } else if access_path.is_empty() {
                // Bare identifier not in vars — return as string (enum value, etc.)
                Ok(Value::String(base_name.to_string()))
            } else {
                // Dotted path on unknown base — return Null
                Ok(Value::Null)
            }
        }
    }
}

/// Split "foo.bar[0].baz" into ("foo", vec!["bar", "[0]", "baz"])
fn split_base_and_path(s: &str) -> (&str, Vec<&str>) {
    // Find the first dot or bracket
    let first_sep = s.find(['.', '[']);
    match first_sep {
        None => (s, Vec::new()),
        Some(idx) => {
            let base = &s[..idx];
            let rest = &s[idx..];
            let segments = parse_access_segments(rest);
            (base, segments)
        }
    }
}

/// Parse ".field[0][\"key\"].other" into vec!["field", "[0]", "[\"key\"]", "other"]
fn parse_access_segments(s: &str) -> Vec<&str> {
    let mut segments = Vec::new();
    let mut i = 0;
    let bytes = s.as_bytes();

    while i < bytes.len() {
        if bytes[i] == b'.' {
            // Dot access — consume everything until next dot or bracket
            i += 1; // skip the dot
            let start = i;
            while i < bytes.len() && bytes[i] != b'.' && bytes[i] != b'[' {
                i += 1;
            }
            if i > start {
                segments.push(&s[start..i]);
            }
        } else if bytes[i] == b'[' {
            // Bracket access — find matching ]
            let start = i;
            i += 1;
            while i < bytes.len() && bytes[i] != b']' {
                i += 1;
            }
            if i < bytes.len() {
                i += 1; // skip ]
            }
            segments.push(&s[start..i]);
        } else {
            i += 1;
        }
    }

    segments
}

/// Resolve a path of segments against a JSON value
fn resolve_path(val: &Value, segments: &[&str]) -> Value {
    let mut current = val.clone();

    for &seg in segments {
        if seg.starts_with('[') && seg.ends_with(']') {
            let inner = &seg[1..seg.len() - 1];
            // Try numeric index
            if let Ok(idx) = inner.parse::<usize>() {
                current = current.get(idx).cloned().unwrap_or(Value::Null);
            } else {
                // String key — strip quotes
                let key = inner.trim_matches('"').trim_matches('\'');
                current = current.get(key).cloned().unwrap_or(Value::Null);
            }
        } else {
            // Dot field access
            current = current.get(seg).cloned().unwrap_or(Value::Null);
        }
    }

    current
}

// ── Arithmetic Helpers ────────────────────────────────────────────────────────

fn eval_add_op(left: &Value, op: &str, right: &Value) -> Result<Value, EvalError> {
    match op {
        "+" => {
            // String concatenation if either side is a string (and not purely numeric)
            if is_string_concat(left, right) {
                let l = value_to_string(left);
                let r = value_to_string(right);
                return Ok(Value::String(format!("{l}{r}")));
            }
            // Numeric addition
            let a = to_f64(left).ok_or_else(|| EvalError::TypeError(format!("cannot add non-numeric: {:?}", left)))?;
            let b = to_f64(right).ok_or_else(|| EvalError::TypeError(format!("cannot add non-numeric: {:?}", right)))?;
            Ok(f64_to_value(a + b))
        }
        "-" => {
            let a = to_f64(left).ok_or_else(|| EvalError::TypeError("subtraction requires numeric".into()))?;
            let b = to_f64(right).ok_or_else(|| EvalError::TypeError("subtraction requires numeric".into()))?;
            Ok(f64_to_value(a - b))
        }
        _ => Err(EvalError::ParseError(format!("unknown add op: {op}"))),
    }
}

fn eval_mul_op(left: &Value, op: &str, right: &Value) -> Result<Value, EvalError> {
    let a = to_f64(left).ok_or_else(|| EvalError::TypeError(format!("multiplication requires numeric, got: {:?}", left)))?;
    let b = to_f64(right).ok_or_else(|| EvalError::TypeError(format!("multiplication requires numeric, got: {:?}", right)))?;

    match op {
        "*" => Ok(f64_to_value(a * b)),
        "/" => {
            if b == 0.0 {
                return Err(EvalError::DivisionByZero);
            }
            Ok(f64_to_value(a / b))
        }
        _ => Err(EvalError::ParseError(format!("unknown mul op: {op}"))),
    }
}

// ── Comparison Helpers ────────────────────────────────────────────────────────

fn compare_values(left: &Value, op: &str, right: &Value) -> bool {
    match op {
        "==" => values_equal(left, right),
        "!=" => !values_equal(left, right),
        ">=" | "<=" | ">" | "<" => compare_ordered(left, op, right),
        _ => false,
    }
}

fn values_equal(left: &Value, right: &Value) -> bool {
    // Direct JSON equality
    if left == right {
        return true;
    }

    // Cross-type number comparison: 42 (int) == 42.0 (float)
    if let (Some(a), Some(b)) = (to_f64(left), to_f64(right)) {
        if both_numeric(left, right) {
            return (a - b).abs() < f64::EPSILON;
        }
    }

    // String comparison — one might be a string representation of the other
    let l_str = value_to_compare_string(left);
    let r_str = value_to_compare_string(right);
    l_str == r_str
}

fn both_numeric(left: &Value, right: &Value) -> bool {
    matches!(left, Value::Number(_)) && matches!(right, Value::Number(_))
}

fn compare_ordered(left: &Value, op: &str, right: &Value) -> bool {
    // Numeric comparison
    if let (Some(a), Some(b)) = (to_f64(left), to_f64(right)) {
        return match op {
            ">=" => a >= b,
            "<=" => a <= b,
            ">" => a > b,
            "<" => a < b,
            _ => false,
        };
    }

    // String comparison
    let l = value_to_compare_string(left);
    let r = value_to_compare_string(right);
    match op {
        ">=" => l >= r,
        "<=" => l <= r,
        ">" => l > r,
        "<" => l < r,
        _ => false,
    }
}

// ── Value Helpers ─────────────────────────────────────────────────────────────

fn is_truthy(val: &Value) -> bool {
    match val {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|v| v != 0.0),
        Value::String(s) => !s.is_empty() && s != "false",
        Value::Array(arr) => !arr.is_empty(),
        Value::Object(obj) => !obj.is_empty(),
    }
}

fn to_f64(val: &Value) -> Option<f64> {
    match val {
        Value::Number(n) => n.as_f64(),
        Value::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
        Value::String(s) => s.parse::<f64>().ok(),
        _ => None,
    }
}

fn f64_to_value(n: f64) -> Value {
    // Return integer if it's a whole number
    if n.fract() == 0.0 && n.abs() < i64::MAX as f64 {
        Value::Number(serde_json::Number::from(n as i64))
    } else {
        serde_json::Number::from_f64(n)
            .map(Value::Number)
            .unwrap_or(Value::Null)
    }
}

/// Normalize a numeric Value: if it's a float that equals an integer, return the integer form.
fn normalize_numeric(val: Value) -> Value {
    match &val {
        Value::Number(n) => {
            if let Some(f) = n.as_f64() {
                f64_to_value(f)
            } else {
                val
            }
        }
        _ => val,
    }
}

fn value_to_string(val: &Value) -> String {
    match val {
        Value::String(s) => s.clone(),
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        Value::Array(_) | Value::Object(_) => serde_json::to_string(val).unwrap_or_default(),
    }
}

fn value_to_compare_string(val: &Value) -> String {
    match val {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => "null".to_string(),
        _ => serde_json::to_string(val).unwrap_or_default(),
    }
}

/// Determine if a + operation should be string concatenation.
/// Returns true if either operand is a non-numeric string.
fn is_string_concat(left: &Value, right: &Value) -> bool {
    match (left, right) {
        (Value::String(s), _) => s.parse::<f64>().is_err(),
        (_, Value::String(s)) => s.parse::<f64>().is_err(),
        _ => false,
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn vars(entries: &[(&str, Value)]) -> HashMap<String, Value> {
        entries.iter().map(|(k, v)| (k.to_string(), v.clone())).collect()
    }

    #[test]
    fn test_eval_literal_int() {
        let v = vars(&[]);
        assert_eq!(evaluate("42", &v).unwrap(), json!(42));
        assert_eq!(evaluate("0", &v).unwrap(), json!(0));
        assert_eq!(evaluate("12345", &v).unwrap(), json!(12345));
    }

    #[test]
    fn test_eval_literal_string() {
        let v = vars(&[]);
        assert_eq!(evaluate("\"hello\"", &v).unwrap(), json!("hello"));
        assert_eq!(evaluate("'world'", &v).unwrap(), json!("world"));
    }

    #[test]
    fn test_eval_literal_bool() {
        let v = vars(&[]);
        assert_eq!(evaluate("true", &v).unwrap(), json!(true));
        assert_eq!(evaluate("false", &v).unwrap(), json!(false));
    }

    #[test]
    fn test_eval_literal_float() {
        let v = vars(&[]);
        let result = evaluate("3.14", &v).unwrap();
        let n = result.as_f64().unwrap();
        assert!((n - 3.14).abs() < f64::EPSILON);
    }

    #[test]
    fn test_eval_literal_list() {
        let v = vars(&[]);
        assert_eq!(evaluate("[1, 2, 3]", &v).unwrap(), json!([1, 2, 3]));
    }

    #[test]
    fn test_eval_literal_map() {
        let v = vars(&[]);
        let result = evaluate("{name: \"hello\"}", &v).unwrap();
        assert_eq!(result, json!({"name": "hello"}));
    }

    #[test]
    fn test_eval_variable_lookup() {
        let v = vars(&[("x", json!(10)), ("name", json!("alice"))]);
        assert_eq!(evaluate("$x", &v).unwrap(), json!(10));
        assert_eq!(evaluate("$name", &v).unwrap(), json!("alice"));
        assert_eq!(evaluate("$missing", &v).unwrap(), json!(null));
    }

    #[test]
    fn test_eval_dotted_access() {
        let v = vars(&[("ship", json!({"x": 100, "y": 200, "name": "Enterprise"}))]);
        assert_eq!(evaluate("$ship.x", &v).unwrap(), json!(100));
        assert_eq!(evaluate("$ship.y", &v).unwrap(), json!(200));
        assert_eq!(evaluate("$ship.name", &v).unwrap(), json!("Enterprise"));
    }

    #[test]
    fn test_eval_nested_dotted_access() {
        let v = vars(&[("config", json!({"model": {"name": "gpt-4", "temp": 0.7}}))]);
        assert_eq!(evaluate("$config.model.name", &v).unwrap(), json!("gpt-4"));
        let temp = evaluate("$config.model.temp", &v).unwrap();
        assert!((temp.as_f64().unwrap() - 0.7).abs() < f64::EPSILON);
    }

    #[test]
    fn test_eval_bracket_access_array() {
        let v = vars(&[("arr", json!([10, 20, 30]))]);
        assert_eq!(evaluate("$arr[0]", &v).unwrap(), json!(10));
        assert_eq!(evaluate("$arr[1]", &v).unwrap(), json!(20));
        assert_eq!(evaluate("$arr[2]", &v).unwrap(), json!(30));
    }

    #[test]
    fn test_eval_bracket_access_map() {
        let v = vars(&[("data", json!({"key1": "val1", "key2": "val2"}))]);
        assert_eq!(evaluate("$data[\"key1\"]", &v).unwrap(), json!("val1"));
        assert_eq!(evaluate("$data[\"key2\"]", &v).unwrap(), json!("val2"));
    }

    #[test]
    fn test_eval_arithmetic() {
        let v = vars(&[("a", json!(10)), ("b", json!(3))]);
        assert_eq!(evaluate("$a + $b", &v).unwrap(), json!(13));
        assert_eq!(evaluate("$a - $b", &v).unwrap(), json!(7));
        assert_eq!(evaluate("$a * $b", &v).unwrap(), json!(30));
        // Division
        let div = evaluate("$a / $b", &v).unwrap();
        assert!((div.as_f64().unwrap() - 10.0 / 3.0).abs() < f64::EPSILON);
        // Power
        assert_eq!(evaluate("$b ^ 2", &v).unwrap(), json!(9));
        // Mixed with literals
        assert_eq!(evaluate("$a + 5", &v).unwrap(), json!(15));
        let mul = evaluate("$a * 0.5", &v).unwrap();
        assert_eq!(mul, json!(5));
    }

    #[test]
    fn test_eval_comparison() {
        let v = vars(&[("x", json!(5)), ("y", json!(10))]);
        assert_eq!(evaluate("$x > 0", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$x < $y", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$x == 5", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$x != $y", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$x >= 5", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$x <= 5", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$x > $y", &v).unwrap(), json!(false));
    }

    #[test]
    fn test_eval_logic_operators() {
        let v = vars(&[("a", json!(true)), ("b", json!(false)), ("c", json!(true))]);
        assert_eq!(evaluate("$a and $c", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$a and $b", &v).unwrap(), json!(false));
        assert_eq!(evaluate("$a or $b", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$b or $b", &v).unwrap(), json!(false));
        assert_eq!(evaluate("NOT $b", &v).unwrap(), json!(true));
        assert_eq!(evaluate("NOT $a", &v).unwrap(), json!(false));
    }

    #[test]
    fn test_eval_string_concat() {
        let v = vars(&[("name", json!("world")), ("n", json!(42))]);
        assert_eq!(evaluate("\"hello \" + $name", &v).unwrap(), json!("hello world"));
        assert_eq!(evaluate("\"count: \" + $n", &v).unwrap(), json!("count: 42"));
    }

    #[test]
    fn test_eval_function_call() {
        let v = vars(&[("x", json!(9)), ("a", json!(3)), ("b", json!(7)), ("list", json!([1, 2, 3, 4]))]);
        // sqrt
        assert_eq!(evaluate("sqrt($x)", &v).unwrap(), json!(3));
        // min/max
        assert_eq!(evaluate("min($a, $b)", &v).unwrap(), json!(3));
        assert_eq!(evaluate("max($a, $b)", &v).unwrap(), json!(7));
        // len
        assert_eq!(evaluate("len($list)", &v).unwrap(), json!(4));
    }

    #[test]
    fn test_eval_inline_if() {
        let v = vars(&[("x", json!(10)), ("y", json!(-5))]);
        assert_eq!(evaluate("if $x > 0: $x else: 0", &v).unwrap(), json!(10));
        assert_eq!(evaluate("if $y > 0: $y else: 0", &v).unwrap(), json!(0));
    }

    #[test]
    fn test_eval_complex_expression() {
        // sqrt($ship.vx^2 + $ship.vy^2) — speed calculation
        let v = vars(&[("ship", json!({"vx": 3.0, "vy": 4.0}))]);
        let result = evaluate("sqrt($ship.vx ^ 2 + $ship.vy ^ 2)", &v).unwrap();
        assert!((result.as_f64().unwrap() - 5.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_eval_null_propagation() {
        let v = vars(&[("obj", json!({"a": 1}))]);
        // Missing field returns null, not error
        assert_eq!(evaluate("$obj.missing", &v).unwrap(), json!(null));
        assert_eq!(evaluate("$obj.deep.nested.field", &v).unwrap(), json!(null));
        // Missing variable returns null
        assert_eq!(evaluate("$nonexistent", &v).unwrap(), json!(null));
    }

    #[test]
    fn test_eval_division_by_zero() {
        let v = vars(&[("x", json!(10)), ("zero", json!(0))]);
        let result = evaluate("$x / $zero", &v);
        assert_eq!(result, Err(EvalError::DivisionByZero));
    }

    #[test]
    fn test_eval_unknown_function() {
        let v = vars(&[]);
        let result = evaluate("bogus_func(42)", &v);
        assert!(matches!(result, Err(EvalError::UnknownFunction(_))));
    }

    #[test]
    fn test_eval_unary_negation() {
        let v = vars(&[("x", json!(5))]);
        assert_eq!(evaluate("-$x", &v).unwrap(), json!(-5));
        assert_eq!(evaluate("-42", &v).unwrap(), json!(-42));
    }

    #[test]
    fn test_eval_parenthesized() {
        let v = vars(&[("a", json!(2)), ("b", json!(3)), ("c", json!(4))]);
        // Without parens: a + b * c = 2 + 12 = 14
        assert_eq!(evaluate("$a + $b * $c", &v).unwrap(), json!(14));
        // With parens: (a + b) * c = 5 * 4 = 20
        assert_eq!(evaluate("($a + $b) * $c", &v).unwrap(), json!(20));
    }

    #[test]
    fn test_eval_string_equality() {
        let v = vars(&[("name", json!("hello"))]);
        assert_eq!(evaluate("$name == \"hello\"", &v).unwrap(), json!(true));
        assert_eq!(evaluate("$name != \"world\"", &v).unwrap(), json!(true));
    }

    #[test]
    fn test_eval_nested_function_in_arithmetic() {
        let v = vars(&[("x", json!(16))]);
        // sqrt(16) + 1 = 5
        let result = evaluate("sqrt($x) + 1", &v).unwrap();
        assert_eq!(result, json!(5));
    }

    #[test]
    fn test_eval_match_expression() {
        let v = vars(&[("status", json!("active"))]);
        let result = evaluate("match $status { \"active\" => \"green\", _ => \"gray\" }", &v).unwrap();
        assert_eq!(result, json!("green"));

        let v2 = vars(&[("status", json!("paused"))]);
        let result2 = evaluate("match $status { \"active\" => \"green\", _ => \"gray\" }", &v2).unwrap();
        assert_eq!(result2, json!("gray"));
    }

    #[test]
    fn test_preprocess_preserves_strings() {
        // Ensure $ inside strings is not stripped
        assert_eq!(preprocess_expr("\"$var\""), "\"$var\"");
        assert_eq!(preprocess_expr("'$var'"), "'$var'");
        // Outside strings, $var becomes _V_var
        assert_eq!(preprocess_expr("$x + $y"), "_V_x + _V_y");
        assert_eq!(preprocess_expr("$ship.x"), "_V_ship.x");
        assert_eq!(preprocess_expr("$arr[0]"), "_V_arr[0]");
    }
}
