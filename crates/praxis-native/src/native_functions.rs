//! Native Function Registry — allows .px expressions to call Rust functions.
//!
//! This is the FFI boundary: .px orchestrates logic flow,
//! Rust implements hot math/physics at native speed.
//!
//! Usage: Register functions that .px expressions can call by name.
//! Example: sqrt, sin, cos, exp, abs, min, max, etc.

use serde_json::Value;
use std::collections::HashMap;

pub type NativeFunction = Box<dyn Fn(&[Value]) -> Result<Value, String> + Send + Sync>;

pub struct NativeFunctionRegistry {
    functions: HashMap<String, NativeFunction>,
}

impl NativeFunctionRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            functions: HashMap::new(),
        };
        registry.register_std();
        registry
    }

    pub fn register(&mut self, name: impl Into<String>, f: NativeFunction) {
        self.functions.insert(name.into(), f);
    }

    pub fn call(&self, name: &str, args: &[Value]) -> Result<Value, String> {
        match self.functions.get(name) {
            Some(f) => f(args),
            None => Err(format!("unknown native function: {name}")),
        }
    }

    /// Register the standard library (math, string, collection, type functions)
    fn register_std(&mut self) {
        // === MATH FUNCTIONS ===
        self.register("sqrt", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("sqrt: expected number")?;
            Ok(Value::from(x.sqrt()))
        }));
        self.register("sin", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("sin: expected number")?;
            Ok(Value::from(x.sin()))
        }));
        self.register("cos", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("cos: expected number")?;
            Ok(Value::from(x.cos()))
        }));
        self.register("exp", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("exp: expected number")?;
            Ok(Value::from(x.exp()))
        }));
        self.register("abs", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("abs: expected number")?;
            Ok(Value::from(x.abs()))
        }));
        self.register("min", Box::new(|args| {
            let a = args.first().and_then(|v| v.as_f64()).ok_or("min: expected number")?;
            let b = args.get(1).and_then(|v| v.as_f64()).ok_or("min: expected 2 numbers")?;
            Ok(Value::from(a.min(b)))
        }));
        self.register("max", Box::new(|args| {
            let a = args.first().and_then(|v| v.as_f64()).ok_or("max: expected number")?;
            let b = args.get(1).and_then(|v| v.as_f64()).ok_or("max: expected 2 numbers")?;
            Ok(Value::from(a.max(b)))
        }));
        self.register("pi", Box::new(|_args| {
            Ok(Value::from(std::f64::consts::PI))
        }));
        self.register("random", Box::new(|_args| {
            // Deterministic placeholder — real impl should use a seeded RNG
            Ok(Value::from(0.5))
        }));
        self.register("floor", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("floor: expected number")?;
            Ok(Value::from(x.floor() as i64))
        }));
        self.register("ceil", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("ceil: expected number")?;
            Ok(Value::from(x.ceil() as i64))
        }));
        self.register("round", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("round: expected number")?;
            Ok(Value::from(x.round() as i64))
        }));
        self.register("clamp", Box::new(|args| {
            let x = args.first().and_then(|v| v.as_f64()).ok_or("clamp: expected number")?;
            let min = args.get(1).and_then(|v| v.as_f64()).ok_or("clamp: expected min")?;
            let max = args.get(2).and_then(|v| v.as_f64()).ok_or("clamp: expected max")?;
            Ok(Value::from(x.clamp(min, max)))
        }));
        self.register("pow", Box::new(|args| {
            let base = args.first().and_then(|v| v.as_f64()).ok_or("pow: expected base")?;
            let exp = args.get(1).and_then(|v| v.as_f64()).ok_or("pow: expected exponent")?;
            Ok(Value::from(base.powf(exp)))
        }));

        // === STRING FUNCTIONS ===
        self.register("len", Box::new(|args| {
            match args.first() {
                Some(Value::String(s)) => Ok(Value::from(s.len() as i64)),
                Some(Value::Array(a)) => Ok(Value::from(a.len() as i64)),
                Some(Value::Object(o)) => Ok(Value::from(o.len() as i64)),
                _ => Err("len: requires string, array, or object".into()),
            }
        }));
        self.register("contains", Box::new(|args| {
            let haystack = args.first().and_then(|v| v.as_str()).ok_or("contains: expected string haystack")?;
            let needle = args.get(1).and_then(|v| v.as_str()).ok_or("contains: expected string needle")?;
            Ok(Value::from(haystack.contains(needle)))
        }));
        self.register("starts_with", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("starts_with: expected string")?;
            let prefix = args.get(1).and_then(|v| v.as_str()).ok_or("starts_with: expected prefix")?;
            Ok(Value::from(s.starts_with(prefix)))
        }));
        self.register("ends_with", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("ends_with: expected string")?;
            let suffix = args.get(1).and_then(|v| v.as_str()).ok_or("ends_with: expected suffix")?;
            Ok(Value::from(s.ends_with(suffix)))
        }));
        self.register("to_upper", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("to_upper: expected string")?;
            Ok(Value::from(s.to_uppercase()))
        }));
        self.register("to_lower", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("to_lower: expected string")?;
            Ok(Value::from(s.to_lowercase()))
        }));
        self.register("trim", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("trim: expected string")?;
            Ok(Value::from(s.trim()))
        }));
        self.register("split", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("split: expected string")?;
            let delim = args.get(1).and_then(|v| v.as_str()).ok_or("split: expected delimiter")?;
            let parts: Vec<Value> = s.split(delim).map(|p| Value::from(p)).collect();
            Ok(Value::Array(parts))
        }));
        self.register("join", Box::new(|args| {
            let arr = args.first().and_then(|v| v.as_array()).ok_or("join: expected array")?;
            let delim = args.get(1).and_then(|v| v.as_str()).ok_or("join: expected delimiter")?;
            let parts: Vec<String> = arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect();
            Ok(Value::from(parts.join(delim)))
        }));
        self.register("replace", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("replace: expected string")?;
            let from = args.get(1).and_then(|v| v.as_str()).ok_or("replace: expected from")?;
            let to = args.get(2).and_then(|v| v.as_str()).ok_or("replace: expected to")?;
            Ok(Value::from(s.replace(from, to)))
        }));
        self.register("substring", Box::new(|args| {
            let s = args.first().and_then(|v| v.as_str()).ok_or("substring: expected string")?;
            let start = args.get(1).and_then(|v| v.as_u64()).ok_or("substring: expected start")? as usize;
            let end = args.get(2).and_then(|v| v.as_u64()).map(|n| n as usize).unwrap_or(s.len());
            if start > s.len() || end > s.len() || start > end {
                return Err("substring: index out of bounds".into());
            }
            Ok(Value::from(&s[start..end]))
        }));

        // === COLLECTION FUNCTIONS ===
        self.register("push", Box::new(|args| {
            let arr = args.first().and_then(|v| v.as_array()).ok_or("push: expected array")?;
            let item = args.get(1).ok_or("push: expected item")?;
            let mut new_arr = arr.clone();
            new_arr.push(item.clone());
            Ok(Value::Array(new_arr))
        }));
        self.register("keys", Box::new(|args| {
            let obj = args.first().and_then(|v| v.as_object()).ok_or("keys: expected object")?;
            let keys: Vec<Value> = obj.keys().map(|k| Value::from(k.as_str())).collect();
            Ok(Value::Array(keys))
        }));
        self.register("values", Box::new(|args| {
            let obj = args.first().and_then(|v| v.as_object()).ok_or("values: expected object")?;
            let vals: Vec<Value> = obj.values().cloned().collect();
            Ok(Value::Array(vals))
        }));
        self.register("merge", Box::new(|args| {
            let obj1 = args.first().and_then(|v| v.as_object()).ok_or("merge: expected object1")?;
            let obj2 = args.get(1).and_then(|v| v.as_object()).ok_or("merge: expected object2")?;
            let mut merged = obj1.clone();
            for (k, v) in obj2 {
                merged.insert(k.clone(), v.clone());
            }
            Ok(Value::Object(merged))
        }));
        self.register("sort", Box::new(|args| {
            let arr = args.first().and_then(|v| v.as_array()).ok_or("sort: expected array")?;
            let mut sorted = arr.clone();
            sorted.sort_by(|a, b| {
                match (a, b) {
                    (Value::Number(n1), Value::Number(n2)) => {
                        let f1 = n1.as_f64().unwrap_or(0.0);
                        let f2 = n2.as_f64().unwrap_or(0.0);
                        f1.partial_cmp(&f2).unwrap_or(std::cmp::Ordering::Equal)
                    }
                    (Value::String(s1), Value::String(s2)) => s1.cmp(s2),
                    _ => std::cmp::Ordering::Equal,
                }
            });
            Ok(Value::Array(sorted))
        }));
        self.register("reverse", Box::new(|args| {
            let arr = args.first().and_then(|v| v.as_array()).ok_or("reverse: expected array")?;
            let mut reversed = arr.clone();
            reversed.reverse();
            Ok(Value::Array(reversed))
        }));
        self.register("range", Box::new(|args| {
            let n = args.first().and_then(|v| v.as_u64()).ok_or("range: expected number")? as usize;
            let arr: Vec<Value> = (0..n).map(|i| Value::from(i as i64)).collect();
            Ok(Value::Array(arr))
        }));
        self.register("flatten", Box::new(|args| {
            let arr = args.first().and_then(|v| v.as_array()).ok_or("flatten: expected array")?;
            let mut flat = Vec::new();
            for item in arr {
                if let Some(nested) = item.as_array() {
                    flat.extend(nested.clone());
                } else {
                    flat.push(item.clone());
                }
            }
            Ok(Value::Array(flat))
        }));
        self.register("unique", Box::new(|args| {
            let arr = args.first().and_then(|v| v.as_array()).ok_or("unique: expected array")?;
            let mut seen = std::collections::HashSet::new();
            let mut unique = Vec::new();
            for item in arr {
                let key = serde_json::to_string(item).unwrap_or_default();
                if seen.insert(key) {
                    unique.push(item.clone());
                }
            }
            Ok(Value::Array(unique))
        }));

        // === TYPE FUNCTIONS ===
        self.register("type_of", Box::new(|args| {
            let val = args.first().ok_or("type_of: expected value")?;
            let type_name = match val {
                Value::String(_) => "string",
                Value::Number(_) => "number",
                Value::Bool(_) => "boolean",
                Value::Array(_) => "array",
                Value::Object(_) => "object",
                Value::Null => "null",
            };
            Ok(Value::from(type_name))
        }));
        self.register("to_string", Box::new(|args| {
            let val = args.first().ok_or("to_string: expected value")?;
            let s = match val {
                Value::String(s) => s.clone(),
                Value::Number(n) => n.to_string(),
                Value::Bool(b) => b.to_string(),
                Value::Null => "null".to_string(),
                _ => serde_json::to_string(val).unwrap_or_default(),
            };
            Ok(Value::from(s))
        }));
        self.register("to_int", Box::new(|args| {
            let val = args.first().ok_or("to_int: expected value")?;
            let n = match val {
                Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        i
                    } else if let Some(f) = n.as_f64() {
                        f.trunc() as i64
                    } else {
                        return Err("to_int: number out of range".into());
                    }
                }
                Value::String(s) => s.parse::<i64>().map_err(|_| "to_int: parse error")?,
                _ => return Err("to_int: requires number or string".into()),
            };
            Ok(Value::from(n))
        }));
        self.register("to_float", Box::new(|args| {
            let val = args.first().ok_or("to_float: expected value")?;
            let f = match val {
                Value::Number(n) => n.as_f64().ok_or("to_float: number out of range")?,
                Value::String(s) => s.parse::<f64>().map_err(|_| "to_float: parse error")?,
                _ => return Err("to_float: requires number or string".into()),
            };
            Ok(Value::from(f))
        }));
        self.register("is_null", Box::new(|args| {
            let val = args.first().ok_or("is_null: expected value")?;
            Ok(Value::from(val.is_null()))
        }));
        self.register("is_array", Box::new(|args| {
            let val = args.first().ok_or("is_array: expected value")?;
            Ok(Value::from(val.is_array()))
        }));
        self.register("is_object", Box::new(|args| {
            let val = args.first().ok_or("is_object: expected value")?;
            Ok(Value::from(val.is_object()))
        }));
    }
}

impl Default for NativeFunctionRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn registry() -> NativeFunctionRegistry {
        NativeFunctionRegistry::new()
    }

    #[test]
    fn test_string_functions() {
        let reg = registry();

        // len
        assert_eq!(reg.call("len", &[json!("hello")]).unwrap(), json!(5));

        // contains
        assert_eq!(reg.call("contains", &[json!("hello world"), json!("world")]).unwrap(), json!(true));
        assert_eq!(reg.call("contains", &[json!("hello"), json!("xyz")]).unwrap(), json!(false));

        // starts_with
        assert_eq!(reg.call("starts_with", &[json!("hello"), json!("hel")]).unwrap(), json!(true));
        assert_eq!(reg.call("starts_with", &[json!("hello"), json!("xyz")]).unwrap(), json!(false));

        // ends_with
        assert_eq!(reg.call("ends_with", &[json!("hello"), json!("llo")]).unwrap(), json!(true));
        assert_eq!(reg.call("ends_with", &[json!("hello"), json!("xyz")]).unwrap(), json!(false));

        // to_upper
        assert_eq!(reg.call("to_upper", &[json!("hello")]).unwrap(), json!("HELLO"));

        // to_lower
        assert_eq!(reg.call("to_lower", &[json!("HELLO")]).unwrap(), json!("hello"));

        // trim
        assert_eq!(reg.call("trim", &[json!("  hello  ")]).unwrap(), json!("hello"));

        // split
        assert_eq!(
            reg.call("split", &[json!("a,b,c"), json!(",")]).unwrap(),
            json!(["a", "b", "c"])
        );

        // join
        assert_eq!(
            reg.call("join", &[json!(["a", "b", "c"]), json!(",")]).unwrap(),
            json!("a,b,c")
        );

        // replace
        assert_eq!(
            reg.call("replace", &[json!("hello world"), json!("world"), json!("rust")]).unwrap(),
            json!("hello rust")
        );

        // substring
        assert_eq!(reg.call("substring", &[json!("hello"), json!(1), json!(4)]).unwrap(), json!("ell"));
        assert_eq!(reg.call("substring", &[json!("hello"), json!(2)]).unwrap(), json!("llo"));
    }

    #[test]
    fn test_collection_functions() {
        let reg = registry();

        // push
        assert_eq!(
            reg.call("push", &[json!([1, 2]), json!(3)]).unwrap(),
            json!([1, 2, 3])
        );

        // keys
        let obj = json!({"a": 1, "b": 2});
        let keys = reg.call("keys", &[obj]).unwrap();
        let keys_arr = keys.as_array().unwrap();
        assert_eq!(keys_arr.len(), 2);
        assert!(keys_arr.contains(&json!("a")));
        assert!(keys_arr.contains(&json!("b")));

        // values
        let obj = json!({"a": 1, "b": 2});
        let vals = reg.call("values", &[obj]).unwrap();
        let vals_arr = vals.as_array().unwrap();
        assert_eq!(vals_arr.len(), 2);
        assert!(vals_arr.contains(&json!(1)));
        assert!(vals_arr.contains(&json!(2)));

        // merge
        assert_eq!(
            reg.call("merge", &[json!({"a": 1}), json!({"b": 2})]).unwrap(),
            json!({"a": 1, "b": 2})
        );
        // obj2 overrides obj1
        assert_eq!(
            reg.call("merge", &[json!({"a": 1}), json!({"a": 2})]).unwrap(),
            json!({"a": 2})
        );

        // sort numbers
        assert_eq!(
            reg.call("sort", &[json!([3, 1, 2])]).unwrap(),
            json!([1, 2, 3])
        );

        // sort strings
        assert_eq!(
            reg.call("sort", &[json!(["c", "a", "b"])]).unwrap(),
            json!(["a", "b", "c"])
        );

        // reverse
        assert_eq!(
            reg.call("reverse", &[json!([1, 2, 3])]).unwrap(),
            json!([3, 2, 1])
        );

        // range
        assert_eq!(
            reg.call("range", &[json!(5)]).unwrap(),
            json!([0, 1, 2, 3, 4])
        );

        // flatten
        assert_eq!(
            reg.call("flatten", &[json!([[1, 2], [3, 4], 5])]).unwrap(),
            json!([1, 2, 3, 4, 5])
        );

        // unique
        assert_eq!(
            reg.call("unique", &[json!([1, 2, 1, 3, 2])]).unwrap(),
            json!([1, 2, 3])
        );
    }

    #[test]
    fn test_math_utilities() {
        let reg = registry();

        // floor
        assert_eq!(reg.call("floor", &[json!(3.7)]).unwrap(), json!(3));
        assert_eq!(reg.call("floor", &[json!(-3.2)]).unwrap(), json!(-4));

        // ceil
        assert_eq!(reg.call("ceil", &[json!(3.2)]).unwrap(), json!(4));
        assert_eq!(reg.call("ceil", &[json!(-3.7)]).unwrap(), json!(-3));

        // round
        assert_eq!(reg.call("round", &[json!(3.5)]).unwrap(), json!(4));
        assert_eq!(reg.call("round", &[json!(3.4)]).unwrap(), json!(3));

        // clamp
        assert_eq!(reg.call("clamp", &[json!(5), json!(0), json!(10)]).unwrap(), json!(5.0));
        assert_eq!(reg.call("clamp", &[json!(-5), json!(0), json!(10)]).unwrap(), json!(0.0));
        assert_eq!(reg.call("clamp", &[json!(15), json!(0), json!(10)]).unwrap(), json!(10.0));

        // pow
        assert_eq!(reg.call("pow", &[json!(2), json!(3)]).unwrap(), json!(8.0));
        assert_eq!(reg.call("pow", &[json!(10), json!(2)]).unwrap(), json!(100.0));
    }

    #[test]
    fn test_type_functions() {
        let reg = registry();

        // type_of
        assert_eq!(reg.call("type_of", &[json!("hello")]).unwrap(), json!("string"));
        assert_eq!(reg.call("type_of", &[json!(42)]).unwrap(), json!("number"));
        assert_eq!(reg.call("type_of", &[json!(true)]).unwrap(), json!("boolean"));
        assert_eq!(reg.call("type_of", &[json!([1, 2])]).unwrap(), json!("array"));
        assert_eq!(reg.call("type_of", &[json!({"a": 1})]).unwrap(), json!("object"));
        assert_eq!(reg.call("type_of", &[json!(null)]).unwrap(), json!("null"));

        // to_string
        assert_eq!(reg.call("to_string", &[json!(42)]).unwrap(), json!("42"));
        assert_eq!(reg.call("to_string", &[json!(true)]).unwrap(), json!("true"));
        assert_eq!(reg.call("to_string", &[json!(null)]).unwrap(), json!("null"));

        // to_int
        let result = reg.call("to_int", &[json!(3.7)]).unwrap();
        assert_eq!(result.as_i64().unwrap(), 3);
        let result = reg.call("to_int", &[json!("42")]).unwrap();
        assert_eq!(result.as_i64().unwrap(), 42);
        assert!(reg.call("to_int", &[json!("not a number")]).is_err());

        // to_float
        assert_eq!(reg.call("to_float", &[json!(42)]).unwrap(), json!(42.0));
        assert_eq!(reg.call("to_float", &[json!("3.14")]).unwrap(), json!(3.14));

        // is_null
        assert_eq!(reg.call("is_null", &[json!(null)]).unwrap(), json!(true));
        assert_eq!(reg.call("is_null", &[json!(42)]).unwrap(), json!(false));

        // is_array
        assert_eq!(reg.call("is_array", &[json!([1, 2])]).unwrap(), json!(true));
        assert_eq!(reg.call("is_array", &[json!(42)]).unwrap(), json!(false));

        // is_object
        assert_eq!(reg.call("is_object", &[json!({"a": 1})]).unwrap(), json!(true));
        assert_eq!(reg.call("is_object", &[json!([1, 2])]).unwrap(), json!(false));
    }

    #[test]
    fn test_len_polymorphic() {
        let reg = registry();

        // string
        assert_eq!(reg.call("len", &[json!("hello")]).unwrap(), json!(5));

        // array
        assert_eq!(reg.call("len", &[json!([1, 2, 3])]).unwrap(), json!(3));

        // object
        assert_eq!(reg.call("len", &[json!({"a": 1, "b": 2})]).unwrap(), json!(2));

        // error on wrong type
        assert!(reg.call("len", &[json!(42)]).is_err());
    }

    #[test]
    fn test_existing_math_functions_still_work() {
        let reg = registry();

        assert_eq!(reg.call("sqrt", &[json!(16)]).unwrap(), json!(4.0));
        assert_eq!(reg.call("abs", &[json!(-5)]).unwrap(), json!(5.0));
        assert_eq!(reg.call("min", &[json!(3), json!(5)]).unwrap(), json!(3.0));
        assert_eq!(reg.call("max", &[json!(3), json!(5)]).unwrap(), json!(5.0));
        assert_eq!(reg.call("pi", &[]).unwrap(), json!(std::f64::consts::PI));
    }
}
