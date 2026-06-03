// Integration test demonstrating the full derive macro + schema generation workflow

use px_schema::{SchemaGenerator, SchemaConstruct, SchemaField};
use std::collections::HashMap;

// Mock what px-schema-derive would generate
struct PxEntity;

impl PxEntity {
    pub fn px_schema_entry() -> SchemaConstruct {
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
        
        fields.insert(
            "prefix".to_string(),
            SchemaField {
                description: "PluresDB key prefix for instances".to_string(),
                field_type: "string".to_string(),
                required: false,
                default: None,
                example: Some("\"game:ship:\"".to_string()),
                one_of: None,
            },
        );
        
        fields.insert(
            "fields".to_string(),
            SchemaField {
                description: "Named fields with their types".to_string(),
                field_type: "array".to_string(),
                required: true,
                default: None,
                example: None,
                one_of: None,
            },
        );
        
        SchemaConstruct {
            description: "Defines a data shape stored in PluresDB.".to_string(),
            required: vec!["name".to_string(), "fields".to_string()],
            fields,
        }
    }
    
    pub fn px_schema_construct_name() -> &'static str {
        "entity"
    }
}

struct PxProcedure;

impl PxProcedure {
    pub fn px_schema_entry() -> SchemaConstruct {
        let mut fields = HashMap::new();
        
        fields.insert(
            "name".to_string(),
            SchemaField {
                description: "Procedure name".to_string(),
                field_type: "string".to_string(),
                required: true,
                default: None,
                example: Some("\"physics_tick\"".to_string()),
                one_of: None,
            },
        );
        
        fields.insert(
            "trigger".to_string(),
            SchemaField {
                description: "Event that triggers this procedure".to_string(),
                field_type: "string".to_string(),
                required: false,
                default: None,
                example: Some("\"game.tick\"".to_string()),
                one_of: None,
            },
        );
        
        fields.insert(
            "steps".to_string(),
            SchemaField {
                description: "Sequential steps to execute".to_string(),
                field_type: "array".to_string(),
                required: true,
                default: None,
                example: None,
                one_of: None,
            },
        );
        
        SchemaConstruct {
            description: "A sequential behavior routine triggered by events.".to_string(),
            required: vec!["name".to_string(), "steps".to_string()],
            fields,
        }
    }
    
    pub fn px_schema_construct_name() -> &'static str {
        "procedure"
    }
}

#[test]
fn test_generate_sample_schema() {
    let mut gen = SchemaGenerator::new();
    gen.px_version("2.0.0");
    gen.schema_version("1.0.0");
    
    // Register constructs
    gen.add_construct(
        PxEntity::px_schema_construct_name(),
        PxEntity::px_schema_entry(),
    );
    
    gen.add_construct(
        PxProcedure::px_schema_construct_name(),
        PxProcedure::px_schema_entry(),
    );
    
    // Generate YAML
    let yaml = gen.build_yaml().expect("Failed to generate YAML");
    
    println!("Generated px-schema.yaml:\n{}", yaml);
    
    // Verify structure
    assert!(yaml.contains("schema_version: 1.0.0"));
    assert!(yaml.contains("px_version: 2.0.0"));
    assert!(yaml.contains("entity:"));
    assert!(yaml.contains("procedure:"));
    assert!(yaml.contains("Defines a data shape stored in PluresDB"));
    assert!(yaml.contains("A sequential behavior routine"));
    
    // Write to file for inspection
    std::fs::write(
        "/tmp/px-schema-sample.yaml",
        yaml,
    ).expect("Failed to write sample schema");
    
    println!("\nSample schema written to /tmp/px-schema-sample.yaml");
}

#[test]
fn test_validate_sample_document() {
    use px_schema::validate;
    
    // Build schema
    let mut gen = SchemaGenerator::new();
    gen.add_construct(
        PxEntity::px_schema_construct_name(),
        PxEntity::px_schema_entry(),
    );
    let schema = gen.build();
    
    // Valid document
    let valid_doc = serde_json::json!({
        "entity": {
            "name": "Player",
            "prefix": "game:player:",
            "fields": []
        }
    });
    
    let result = validate(&valid_doc, &schema);
    assert!(result.is_valid(), "Expected valid document");
    assert_eq!(result.errors.len(), 0);
    
    // Invalid document - missing required field
    let invalid_doc = serde_json::json!({
        "entity": {
            "prefix": "game:player:"
        }
    });
    
    let result = validate(&invalid_doc, &schema);
    assert!(!result.is_valid(), "Expected invalid document");
    assert!(result.errors.iter().any(|e| e.message.contains("Missing required field 'name'")));
    
    // Document with unknown field - should warn, not error
    let doc_with_unknown = serde_json::json!({
        "entity": {
            "name": "Player",
            "fields": [],
            "unknown_field": "this is ignored"
        }
    });
    
    let result = validate(&doc_with_unknown, &schema);
    assert!(result.is_valid(), "Unknown fields should not invalidate document");
    assert_eq!(result.warnings.len(), 1);
    assert!(result.warnings[0].message.contains("Unknown field 'unknown_field'"));
}
