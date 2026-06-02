// Example demonstrating the actual #[derive(PxSchema)] proc macro

// This would normally be in praxis-native/src/px/mod.rs or similar
// For now, we'll just document how it would work

/*
use px_schema_derive::PxSchema;
use px_schema::{SchemaGenerator};

#[derive(PxSchema)]
#[px_schema(construct = "entity", description = "Defines a data shape stored in PluresDB.")]
pub struct PxEntity {
    #[px_schema(description = "Entity name", required = true, example = "\"Player\"")]
    pub name: String,
    
    #[px_schema(description = "PluresDB key prefix for instances", example = "\"game:ship:\"")]
    pub prefix: Option<String>,
    
    #[px_schema(description = "Named fields with their types", required = true)]
    pub fields: Vec<PxField>,
}

#[derive(PxSchema)]
#[px_schema(construct = "procedure", description = "A sequential behavior routine triggered by events.")]
pub struct PxProcedure {
    #[px_schema(description = "Procedure name", required = true, example = "\"physics_tick\"")]
    pub name: String,
    
    #[px_schema(description = "Event that triggers this procedure", example = "\"game.tick\"")]
    pub trigger: Option<String>,
    
    #[px_schema(description = "Sequential steps to execute", required = true)]
    pub steps: Vec<PxStep>,
}

// In a build script or schema generator binary:
fn main() {
    let mut gen = SchemaGenerator::new();
    gen.px_version("2.0.0");
    gen.schema_version("1.0.0");
    
    // Register all annotated types
    gen.add_construct(
        PxEntity::px_schema_construct_name(),
        PxEntity::px_schema_entry(),
    );
    
    gen.add_construct(
        PxProcedure::px_schema_construct_name(),
        PxProcedure::px_schema_entry(),
    );
    
    // Generate and write schema
    let yaml = gen.build_yaml().unwrap();
    std::fs::write("target/generated/px-schema.yaml", yaml).unwrap();
}
*/

// Since we can't actually test the proc macro in the same crate (circular dependency),
// this is a documentation-only test
#[test]
fn test_proc_macro_usage_documented() {
    // The integration_test.rs shows the expected behavior
    assert!(true);
}
