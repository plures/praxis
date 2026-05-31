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

    /// Register the standard math library
    fn register_std(&mut self) {
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
    }
}

impl Default for NativeFunctionRegistry {
    fn default() -> Self {
        Self::new()
    }
}
