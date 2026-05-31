#![deny(clippy::all)]

pub mod px;
pub mod native_functions;

#[cfg(test)]
mod e2e_tests;

#[cfg(feature = "napi-binding")]
mod napi_exports {
    use super::*;
    use napi_derive::napi;
    use serde_json::Value;

    /// Parse a .px file and return the AST as JSON
    #[napi]
    pub fn parse(source: String) -> napi::Result<String> {
        match px::parse(&source) {
            Ok(doc) => Ok(serde_json::to_string(&doc).map_err(|e| {
                napi::Error::from_reason(format!("JSON serialization error: {}", e))
            })?),
            Err(e) => Err(napi::Error::from_reason(format!("Parse error: {}", e))),
        }
    }

    /// Compile a .px file to PluresDB records (JSON)
    #[napi]
    pub fn compile(source: String) -> napi::Result<String> {
        let doc = px::parse(&source).map_err(|e| {
            napi::Error::from_reason(format!("Parse error: {}", e))
        })?;

        let result = px::compiler::compile_with_stats(&doc);
        let output = serde_json::json!({
            "records": result.records.iter().map(|r| serde_json::json!({
                "key": r.key,
                "data": r.data,
                "embed": r.embed,
            })).collect::<Vec<_>>(),
            "stats": {
                "imports": result.stats.imports,
                "facts": result.stats.facts,
                "rules": result.stats.rules,
                "constraints": result.stats.constraints,
                "contracts": result.stats.contracts,
                "functions": result.stats.functions,
                "triggers": result.stats.triggers,
                "procedures": result.stats.procedures,
                "scenarios": result.stats.scenarios,
                "total": result.stats.total,
            },
        });

        Ok(serde_json::to_string(&output).map_err(|e| {
            napi::Error::from_reason(format!("JSON serialization error: {}", e))
        })?)
    }

    /// Lint a .px file and return diagnostics as JSON
    #[napi]
    pub fn lint(source: String) -> napi::Result<String> {
        let doc = px::parse(&source).map_err(|e| {
            napi::Error::from_reason(format!("Parse error: {}", e))
        })?;

        let diagnostics = px::lint::lint(&doc);
        let output = serde_json::json!({
            "diagnostics": diagnostics.iter().map(|d| serde_json::json!({
                "code": d.code,
                "message": d.message,
                "severity": match d.severity {
                    px::lint::LintSeverity::Warning => "warning",
                    px::lint::LintSeverity::Error => "error",
                },
                "procedure": d.procedure,
                "step_index": d.step_index,
            })).collect::<Vec<_>>(),
        });

        Ok(serde_json::to_string(&output).map_err(|e| {
            napi::Error::from_reason(format!("JSON serialization error: {}", e))
        })?)
    }

    /// Execute a compiled procedure with the given context (JSON)
    #[napi]
    pub fn execute(compiled_json: String, context_json: String) -> napi::Result<String> {
        // TODO: Wire to px::executor
        let _ = (compiled_json, context_json);
        Ok(serde_json::to_string(&Value::Null).unwrap())
    }

    /// List all available native functions registered in the runtime
    #[napi]
    pub fn list_native_functions() -> napi::Result<String> {
        let _registry = native_functions::NativeFunctionRegistry::new();
        let functions = vec![
            "sqrt", "sin", "cos", "exp", "abs", "min", "max", "pi", "random",
        ];
        let output = serde_json::json!({
            "functions": functions,
        });
        Ok(serde_json::to_string(&output).unwrap())
    }

    /// Compile a .px file with lint diagnostics included
    #[napi]
    pub fn compile_with_lint(source: String) -> napi::Result<String> {
        let doc = px::parse(&source).map_err(|e| {
            napi::Error::from_reason(format!("Parse error: {}", e))
        })?;

        let result = px::compiler::compile_with_lint(&doc);
        let output = serde_json::json!({
            "records": result.records.iter().map(|r| serde_json::json!({
                "key": r.key,
                "data": r.data,
                "embed": r.embed,
            })).collect::<Vec<_>>(),
            "stats": {
                "imports": result.stats.imports,
                "facts": result.stats.facts,
                "rules": result.stats.rules,
                "constraints": result.stats.constraints,
                "contracts": result.stats.contracts,
                "functions": result.stats.functions,
                "triggers": result.stats.triggers,
                "procedures": result.stats.procedures,
                "scenarios": result.stats.scenarios,
                "total": result.stats.total,
            },
            "diagnostics": result.diagnostics.iter().map(|d| serde_json::json!({
                "code": d.code,
                "message": d.message,
                "severity": match d.severity {
                    px::lint::LintSeverity::Warning => "warning",
                    px::lint::LintSeverity::Error => "error",
                },
                "procedure": d.procedure,
                "step_index": d.step_index,
            })).collect::<Vec<_>>(),
        });

        Ok(serde_json::to_string(&output).map_err(|e| {
            napi::Error::from_reason(format!("JSON serialization error: {}", e))
        })?)
    }
}
