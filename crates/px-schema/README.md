# px-schema

Runtime library for Praxis schema generation, validation, and introspection.

## Purpose

This crate provides the core types and utilities for working with Praxis schemas:

- **Types**: `PxSchemaDocument`, `SchemaConstruct`, `SchemaField`, etc.
- **Generator**: Build schema documents programmatically
- **Validator**: Validate parsed `.px` documents against schemas

## Usage

### Building a Schema

```rust
use px_schema::{SchemaGenerator, SchemaConstruct, SchemaField};
use std::collections::HashMap;

let mut gen = SchemaGenerator::new();
gen.px_version("2.0.0");

let mut fields = HashMap::new();
fields.insert(
    "name".to_string(),
    SchemaField {
        description: "Entity name".to_string(),
        field_type: "string".to_string(),
        required: true,
        default: None,
        example: Some("\"Player\"".to_string()),
        one_of: None,
    },
);

gen.add_construct(
    "entity",
    SchemaConstruct {
        description: "Defines a data shape".to_string(),
        required: vec!["name".to_string()],
        fields,
    },
);

let yaml = gen.build_yaml().unwrap();
```

### Validating a Document

```rust
use px_schema::validate;

let doc = serde_json::json!({
    "entity": {
        "name": "Player",
        "health": 100
    }
});

let result = validate(&doc, &schema);

if !result.is_valid() {
    for error in &result.errors {
        eprintln!("{}: {}", error.path, error.message);
        if let Some(suggestion) = &error.suggestion {
            eprintln!("  Suggestion: {}", suggestion);
        }
    }
}

for warning in &result.warnings {
    println!("Warning at {}: {}", warning.path, warning.message);
}
```

## Design Decisions

### Unknown Keys are Warnings, Not Errors

Per the Praxis design philosophy, unknown keys in a `.px` document produce warnings but don't invalidate the document. This allows for:

- Forward compatibility (newer schemas can be parsed by older validators)
- Graceful handling of typos and experimental features
- User education without blocking execution

### Type System

The validator performs basic type checking:
- `string`, `number`, `boolean`, `array`, `object`, `any`
- Custom types can be defined but are not recursively validated by default
- `one_of` constraints for enumerated values

## Integration with px-schema-derive

This crate is meant to be used with `px-schema-derive`:

```rust
use px_schema_derive::PxSchema;
use px_schema::{SchemaGenerator};

#[derive(PxSchema)]
#[px_schema(construct = "entity", description = "...")]
struct PxEntity { /* ... */ }

let mut gen = SchemaGenerator::new();
gen.add_construct(
    PxEntity::px_schema_construct_name(),
    PxEntity::px_schema_entry()
);
```
