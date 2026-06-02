

#[cfg(test)]
mod trigger_and_config_expansion_tests {
    use crate::px::parse;

    // === New Trigger Kind Tests ===

    #[test]
    fn test_parse_trigger_periodic() {
        let source = r#"procedure tick:
  trigger: periodic {interval: "33ms"}
  noop {}
"#;
        let doc = parse(source).expect("failed to parse periodic trigger");
        assert_eq!(doc.procedures.len(), 1);
        let proc = &doc.procedures[0];
        assert_eq!(proc.name, "tick");
        assert!(proc.trigger.is_some());
        let trigger = proc.trigger.as_ref().unwrap();
        assert_eq!(trigger.kind, "periodic");
        assert!(trigger.params.is_some());
        let params = trigger.params.as_ref().unwrap();
        assert_eq!(params["interval"], "33ms");
    }

    #[test]
    fn test_parse_trigger_on_event() {
        let source = r#"procedure handler:
  trigger: on_event("wind_changed")
  handle_wind {}
"#;
        let doc = parse(source).expect("failed to parse on_event trigger");
        assert_eq!(doc.procedures.len(), 1);
        let proc = &doc.procedures[0];
        assert_eq!(proc.name, "handler");
        assert!(proc.trigger.is_some());
        let trigger = proc.trigger.as_ref().unwrap();
        assert_eq!(trigger.kind, "on_event");
        assert!(trigger.params.is_some());
        let params = trigger.params.as_ref().unwrap();
        assert_eq!(params["event"], "wind_changed");
    }

    #[test]
    fn test_parse_trigger_on_write_pattern() {
        let source = r#"procedure watcher:
  trigger: on_write("game:ship:*")
  log_change {}
"#;
        let doc = parse(source).expect("failed to parse on_write with pattern");
        assert_eq!(doc.procedures.len(), 1);
        let proc = &doc.procedures[0];
        assert_eq!(proc.name, "watcher");
        assert!(proc.trigger.is_some());
        let trigger = proc.trigger.as_ref().unwrap();
        assert_eq!(trigger.kind, "on_write");
        assert!(trigger.params.is_some());
        let params = trigger.params.as_ref().unwrap();
        assert_eq!(params["pattern"], "game:ship:*");
    }

    #[test]
    fn test_parse_trigger_startup() {
        let source = r#"procedure init:
  trigger: startup
  initialize_system {}
"#;
        let doc = parse(source).expect("failed to parse startup trigger");
        assert_eq!(doc.procedures.len(), 1);
        let proc = &doc.procedures[0];
        assert_eq!(proc.name, "init");
        assert!(proc.trigger.is_some());
        let trigger = proc.trigger.as_ref().unwrap();
        assert_eq!(trigger.kind, "startup");
        assert!(trigger.params.is_none());
    }

    // === Nested Config Tests ===

    #[test]
    fn test_parse_nested_config() {
        let source = r#"config ship_classes:
  gnat:
    thrust: 600
    drag: 12.0
  dragonfly:
    thrust: 500
    drag: 10.0
"#;
        let doc = parse(source).expect("failed to parse nested config");
        assert_eq!(doc.configs.len(), 1);
        let cfg = &doc.configs[0];
        assert_eq!(cfg.name, "ship_classes");
        assert_eq!(cfg.entries.len(), 2);
        
        // Check gnat entry
        let gnat_entry = cfg.entries.iter().find(|e| e.key == "gnat").unwrap();
        assert!(gnat_entry.value.is_object());
        let gnat_obj = gnat_entry.value.as_object().unwrap();
        assert_eq!(gnat_obj["thrust"], 600);
        assert_eq!(gnat_obj["drag"], 12.0);
        
        // Check dragonfly entry
        let dragonfly_entry = cfg.entries.iter().find(|e| e.key == "dragonfly").unwrap();
        assert!(dragonfly_entry.value.is_object());
        let dragonfly_obj = dragonfly_entry.value.as_object().unwrap();
        assert_eq!(dragonfly_obj["thrust"], 500);
        assert_eq!(dragonfly_obj["drag"], 10.0);
    }

    #[test]
    fn test_compile_nested_config() {
        use crate::px::compiler::compile;

        let source = r#"config ship_classes:
  gnat:
    thrust: 600
    drag: 12.0
"#;
        let doc = parse(source).expect("failed to parse nested config");
        let records = compile(&doc);
        
        // Verify compilation succeeds and produces records
        assert!(!records.is_empty());
        
        // Verify the parsed config has the expected nested structure
        assert_eq!(doc.configs.len(), 1);
        let cfg = &doc.configs[0];
        let gnat_entry = cfg.entries.iter().find(|e| e.key == "gnat").unwrap();
        assert!(gnat_entry.value.is_object());
        let gnat_obj = gnat_entry.value.as_object().unwrap();
        assert_eq!(gnat_obj["thrust"], 600);
        assert_eq!(gnat_obj["drag"], 12.0);
    }
}
