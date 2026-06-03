# px-schema-derive

Procedural macro for deriving Praxis schema metadata from Rust types.

## Purpose

This crate provides the `#[derive(PxSchema)]` macro that automatically generates schema information from annotated Rust structs. The generated schema describes valid `.px` constructs, their fields, types, and validation rules.

## Usage

```rust
use px_schema_derive::PxSchema;

#[derive(PxSchema)]
#[px_schema(construct = "entity", description = "Defines a data shape stored in PluresDB.")]
pub struct PxEntity {
    #[px_schema(description = "Entity name", required = true)]
    pub name: String,
    
    #[px_schema(description = "PluresDB key prefix for instances", example = "\"game:ship:\"")]
    pub prefix: Option<String>,
    
    #[px_schema(description = "Named fields with their types", required = true)]
    pub fields: Vec<PxField>,
}
```

## Attributes

### Struct-level attributes

- `construct = "name"` - The name of this construct in the schema (defaults to struct name lowercased)
- `description = "..."` - Human-readable description of the construct

### Field-level attributes

- `description = "..."` - Description of the field
- `required = true` - Whether the field is required (default: false)
- `schema_type = "..."` - Override the inferred type
- `example = "..."` - Example value for documentation

## Generated Methods

The macro generates two methods on your type:

- `px_schema_entry() -> SchemaConstruct` - Returns the schema metadata
- `px_schema_construct_name() -> &'static str` - Returns the construct name
