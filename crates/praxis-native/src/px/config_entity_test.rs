//! Tests for config and entity parsing and compilation.

#[cfg(test)]
mod tests {
    use crate::px::{compiler::compile, parse};

    #[test]
    fn test_parse_config_block() {
        let source = r#"
config radix:
  channel: "telegram"
  model: "claude-sonnet-4.5"
  use_copilot: true
"#;
        let doc = parse(source).expect("parse failed");
        assert_eq!(doc.configs.len(), 1);
        assert_eq!(doc.configs[0].name, "radix");
        assert_eq!(doc.configs[0].entries.len(), 3);

        // Verify entries
        let channel = doc.configs[0]
            .entries
            .iter()
            .find(|e| e.key == "channel")
            .expect("channel entry not found");
        assert_eq!(channel.value, "telegram");

        let model = doc.configs[0]
            .entries
            .iter()
            .find(|e| e.key == "model")
            .expect("model entry not found");
        assert_eq!(model.value, "claude-sonnet-4.5");

        let use_copilot = doc.configs[0]
            .entries
            .iter()
            .find(|e| e.key == "use_copilot")
            .expect("use_copilot entry not found");
        assert_eq!(use_copilot.value, true);
    }

    #[test]
    fn test_compile_config_to_record() {
        let source = r#"
config radix:
  channel: "telegram"
  model: "claude-sonnet-4.5"
  use_copilot: true
"#;
        let doc = parse(source).expect("parse failed");
        let records = compile(&doc);
        assert_eq!(records.len(), 1);

        let record = &records[0];
        assert_eq!(record.key, "px:config/radix");
        assert_eq!(record.data["type"], "config");
        assert_eq!(record.data["name"], "radix");

        let entries = record.data["entries"].as_object().expect("entries not an object");
        assert_eq!(entries["channel"], "telegram");
        assert_eq!(entries["model"], "claude-sonnet-4.5");
        assert_eq!(entries["use_copilot"], true);
    }

    #[test]
    fn test_parse_entity_block() {
        let source = r#"
entity CacheEntry:
  prefix: "cache:entry:"
  fields:
    key: String
    value: String
    ttl_secs: u64
    created_at: u64
"#;
        let doc = parse(source).expect("parse failed");
        assert_eq!(doc.entities.len(), 1);
        assert_eq!(doc.entities[0].name, "CacheEntry");
        assert_eq!(doc.entities[0].prefix, Some("cache:entry:".to_string()));
        assert_eq!(doc.entities[0].fields.len(), 4);

        // Verify fields
        assert_eq!(doc.entities[0].fields[0].name, "key");
        assert_eq!(doc.entities[0].fields[0].type_expr, "String");
        assert_eq!(doc.entities[0].fields[1].name, "value");
        assert_eq!(doc.entities[0].fields[1].type_expr, "String");
        assert_eq!(doc.entities[0].fields[2].name, "ttl_secs");
        assert_eq!(doc.entities[0].fields[2].type_expr, "u64");
        assert_eq!(doc.entities[0].fields[3].name, "created_at");
        assert_eq!(doc.entities[0].fields[3].type_expr, "u64");
    }

    #[test]
    fn test_compile_entity_to_record() {
        let source = r#"
entity CacheEntry:
  prefix: "cache:entry:"
  fields:
    key: String
    value: String
    ttl_secs: u64
"#;
        let doc = parse(source).expect("parse failed");
        let records = compile(&doc);
        assert_eq!(records.len(), 1);

        let record = &records[0];
        assert_eq!(record.key, "px:entity/CacheEntry");
        assert_eq!(record.data["type"], "entity");
        assert_eq!(record.data["name"], "CacheEntry");
        assert_eq!(record.data["prefix"], "cache:entry:");

        let fields = record.data["fields"].as_array().expect("fields not an array");
        assert_eq!(fields.len(), 3);
        assert_eq!(fields[0]["name"], "key");
        assert_eq!(fields[0]["type"], "String");
        assert_eq!(fields[1]["name"], "value");
        assert_eq!(fields[1]["type"], "String");
        assert_eq!(fields[2]["name"], "ttl_secs");
        assert_eq!(fields[2]["type"], "u64");
    }

    #[test]
    fn test_parse_config_numeric_values() {
        let source = r#"
config system:
  port: 8080
  timeout: 30.5
  enabled: false
"#;
        let doc = parse(source).expect("parse failed");
        assert_eq!(doc.configs.len(), 1);
        assert_eq!(doc.configs[0].entries.len(), 3);

        let port = doc.configs[0]
            .entries
            .iter()
            .find(|e| e.key == "port")
            .expect("port not found");
        assert_eq!(port.value, 8080);

        let timeout = doc.configs[0]
            .entries
            .iter()
            .find(|e| e.key == "timeout")
            .expect("timeout not found");
        assert_eq!(timeout.value, 30.5);

        let enabled = doc.configs[0]
            .entries
            .iter()
            .find(|e| e.key == "enabled")
            .expect("enabled not found");
        assert_eq!(enabled.value, false);
    }

    #[test]
    fn test_document_with_config_and_entity() {
        let source = r#"
config app:
  name: "test-app"

entity User:
  fields:
    id: String
    name: String

constraint user_id_required:
  require: user.id != ""
  severity: error
"#;
        let doc = parse(source).expect("parse failed");
        assert_eq!(doc.configs.len(), 1);
        assert_eq!(doc.entities.len(), 1);
        assert_eq!(doc.constraints.len(), 1);

        let records = compile(&doc);
        assert_eq!(records.len(), 3);

        // Verify record keys
        let keys: Vec<&str> = records.iter().map(|r| r.key.as_str()).collect();
        assert!(keys.contains(&"px:config/app"));
        assert!(keys.contains(&"px:entity/User"));
        assert!(keys.contains(&"px:constraint/user_id_required"));
    }
}
