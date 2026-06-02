//! AST builder — walks pest parse pairs and produces typed PxDocument.

use pest::iterators::{Pair, Pairs};
use std::collections::HashMap;

use super::{
    FunctionMode, PxAction, PxCapture, PxConfig, PxConstraint, PxContract,
    PxDocument, PxEntity, PxExample, PxExpectation, PxFact, PxField, PxFunction, PxImport,
    PxMatchArm, PxParallelBranch, PxProcedure, PxProcedureTrigger, PxRule, PxScenario,
    PxScenarioRun, PxStep, PxTrigger, Rule,
};

/// Build a PxDocument from parsed pest pairs.
pub fn build(pairs: Pairs<'_, Rule>) -> PxDocument {
        let mut doc = PxDocument {
        imports: vec![],
        configs: vec![],
        entities: vec![],
        facts: vec![],
        rules: vec![],
        constraints: vec![],
        contracts: vec![],
        functions: vec![],
        triggers: vec![],
        procedures: vec![],
        scenarios: vec![],
    };

    for pair in pairs {
        push_pair_into_document(pair, &mut doc);
    }

    doc
}

fn push_pair_into_document(pair: Pair<'_, Rule>, doc: &mut PxDocument) {
    match pair.as_rule() {
        Rule::document => {
            for inner in pair.into_inner() {
                push_pair_into_document(inner, doc);
            }
        }
        Rule::statement => {
            for inner in pair.into_inner() {
                push_pair_into_document(inner, doc);
            }
        }
        Rule::import_decl => doc.imports.push(build_import(pair)),
        Rule::config_decl => doc.configs.push(build_config(pair)),
        Rule::entity_decl => doc.entities.push(build_entity(pair)),
        Rule::fact_decl => doc.facts.push(build_fact(pair)),
        Rule::rule_decl => doc.rules.push(build_rule(pair)),
        Rule::constraint_decl => doc.constraints.push(build_constraint(pair)),
        Rule::contract_decl => doc.contracts.push(build_contract(pair)),
        Rule::function_decl => doc.functions.push(build_function(pair)),
        Rule::trigger_decl => doc.triggers.push(build_trigger(pair)),
        Rule::procedure_decl => doc.procedures.push(build_procedure(pair)),
        Rule::scenario_decl => doc.scenarios.push(build_scenario(pair)),
        Rule::EOI => {}
        _ => {}
    }
}

fn build_import(pair: Pair<'_, Rule>) -> PxImport {
    let mut inner = pair.into_inner();
    let path = inner
        .next()
        .map(|p| p.as_str().to_string())
        .unwrap_or_default();
    let alias = inner.next().map(|p| p.as_str().to_string());
    PxImport { path, alias }
}

fn parse_config_value(pair: Pair<'_, Rule>) -> serde_json::Value {
    match pair.as_rule() {
        Rule::config_nested => {
            // Recursively parse nested config into a map
            let mut map = serde_json::Map::new();
            for kv in pair.into_inner() {
                if kv.as_rule() == Rule::config_kv {
                    let mut kvi = kv.into_inner();
                    let k = next_str(&mut kvi);
                    // Recursively handle nested values
                    let v = kvi.next().map(parse_config_value).unwrap_or(serde_json::Value::Null);
                    map.insert(k, v);
                }
            }
            serde_json::Value::Object(map)
        }
        _ => parse_value(pair),
    }
}

fn build_config(pair: Pair<'_, Rule>) -> PxConfig {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);
    let mut entries = vec![];

    let Some(config_body) = inner.find(|p| p.as_rule() == Rule::config_body) else {
        return PxConfig { name, entries };
    };

    for entry_pair in config_body.into_inner() {
        if entry_pair.as_rule() == Rule::config_entry {
            let mut ei = entry_pair.into_inner();
            let key = next_str(&mut ei);
            
            // Parse config_nested or config_value recursively
            if let Some(value_pair) = ei.next() {
                let value = parse_config_value(value_pair);
                entries.push(super::PxConfigEntry { key, value });
            }
        }
    }

    PxConfig { name, entries }
}

fn build_entity(pair: Pair<'_, Rule>) -> PxEntity {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);
    let mut prefix = None;
    let mut fields = vec![];

    let Some(entity_body) = inner.find(|p| p.as_rule() == Rule::entity_body) else {
        return PxEntity { name, prefix, fields };
    };

    for child in entity_body.into_inner() {
        match child.as_rule() {
            Rule::entity_prefix_clause => {
                prefix = child.into_inner().next().map(|p| unquote(p.as_str()));
            }
            Rule::entity_fields_clause => {
                if let Some(field_list) = child.into_inner().find(|p| p.as_rule() == Rule::entity_field_list) {
                    fields = field_list
                        .into_inner()
                        .filter(|p| p.as_rule() == Rule::entity_field)
                        .map(|ef| {
                            let mut efi = ef.into_inner();
                            let fname = next_str(&mut efi);
                            let ftype = efi.next().map(|p| p.as_str().to_string()).unwrap_or_default();
                            super::PxField { name: fname, type_expr: ftype }
                        })
                        .collect();
                }
            }
            _ => {}
        }
    }

    PxEntity { name, prefix, fields }
}

fn build_fact(pair: Pair<'_, Rule>) -> PxFact {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);
    let fields = inner
        .find(|p| p.as_rule() == Rule::field_list)
        .map(|field_list| {
            field_list
                .into_inner()
                .filter(|p| p.as_rule() == Rule::field)
                .map(build_field)
                .collect()
        })
        .unwrap_or_default();
    PxFact { name, fields }
}

fn build_field(pair: Pair<'_, Rule>) -> PxField {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);
    let type_expr = inner
        .next()
        .map(|p| p.as_str().to_string())
        .unwrap_or_default();
    PxField { name, type_expr }
}

fn build_rule(pair: Pair<'_, Rule>) -> PxRule {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);

    let mut priority = None;
    let mut conditions = vec![];
    let mut lets = vec![];
    let mut actions = vec![];
    let mut captures = vec![];

    let Some(rule_body) = inner.find(|p| p.as_rule() == Rule::rule_body) else {
        return PxRule {
            name,
            priority,
            conditions,
            lets,
            actions,
            captures,
        };
    };

    for child in rule_body.into_inner() {
        match child.as_rule() {
            Rule::priority_clause => {
                priority = child
                    .into_inner()
                    .next()
                    .and_then(|p| p.as_str().parse().ok());
            }
            Rule::when_clause => {
                if let Some(condition_list) = child
                    .into_inner()
                    .find(|p| p.as_rule() == Rule::condition_list)
                {
                    conditions = condition_list
                        .into_inner()
                        .filter(|p| p.as_rule() == Rule::expr)
                        .map(|p| p.as_str().to_string())
                        .collect();
                }
            }
            Rule::let_clause => {
                let mut lc = child.into_inner();
                let var = next_str(&mut lc);
                let expr = lc
                    .next()
                    .map(|p| p.as_str().to_string())
                    .unwrap_or_default();
                lets.push((var, expr));
            }
            Rule::action_list => {
                actions = child
                    .into_inner()
                    .filter(|p| p.as_rule() == Rule::action_stmt)
                    .map(build_action)
                    .collect();
            }
            Rule::then_clause => {
                if let Some(action_list) = child
                    .into_inner()
                    .find(|p| p.as_rule() == Rule::action_list)
                {
                    actions = action_list
                        .into_inner()
                        .filter(|p| p.as_rule() == Rule::action_stmt)
                        .map(build_action)
                        .collect();
                }
            }
            Rule::capture_clause => {
                captures = child
                    .into_inner()
                    .filter(|p| p.as_rule() == Rule::capture_entry)
                    .map(build_capture)
                    .collect();
            }
            _ => {}
        }
    }

    PxRule {
        name,
        priority,
        conditions,
        lets,
        actions,
        captures,
    }
}

fn build_action(pair: Pair<'_, Rule>) -> PxAction {
    let inner = pair.into_inner().next().unwrap();
    match inner.as_rule() {
        Rule::simple_action => {
            let mut parts = inner.into_inner();
            let kind = next_str(&mut parts);
            let params: HashMap<String, serde_json::Value> = parts
                .filter(|p| p.as_rule() == Rule::param_pair)
                .map(|p| {
                    let mut kv = p.into_inner();
                    let k = next_str(&mut kv);
                    let v = kv
                        .next()
                        .map(|p| parse_value(p))
                        .unwrap_or(serde_json::Value::Null);
                    (k, v)
                })
                .collect();
            PxAction {
                kind,
                params,
                condition: None,
            }
        }
        Rule::conditional_action => {
            let mut parts = inner.into_inner();
            let cond = parts.next().map(|p| p.as_str().to_string());
            let action_pair = parts.next().unwrap();
            let mut action = build_action_from_simple(action_pair);
            action.condition = cond;
            action
        }
        _ => PxAction {
            kind: "unknown".into(),
            params: HashMap::new(),
            condition: None,
        },
    }
}

fn build_action_from_simple(pair: Pair<'_, Rule>) -> PxAction {
    let mut parts = pair.into_inner();
    let kind = next_str(&mut parts);
    let params: HashMap<String, serde_json::Value> = parts
        .filter(|p| p.as_rule() == Rule::param_pair)
        .map(|p| {
            let mut kv = p.into_inner();
            let k = next_str(&mut kv);
            let v = kv
                .next()
                .map(|p| parse_value(p))
                .unwrap_or(serde_json::Value::Null);
            (k, v)
        })
        .collect();
    PxAction {
        kind,
        params,
        condition: None,
    }
}

fn build_capture(pair: Pair<'_, Rule>) -> PxCapture {
    let mut content = String::new();
    let mut category = None;
    let mut tags = vec![];

    for child in pair.into_inner() {
        match child.as_rule() {
            Rule::string if content.is_empty() => {
                content = unquote(child.as_str());
            }
            Rule::ident if category.is_none() => {
                category = Some(child.as_str().to_string());
            }
            Rule::list_val => {
                tags = child
                    .into_inner()
                    .map(parse_value)
                    .filter_map(|v| v.as_str().map(ToOwned::to_owned))
                    .collect();
            }
            _ => {}
        }
    }

    PxCapture {
        content,
        category,
        tags,
    }
}

fn build_constraint(pair: Pair<'_, Rule>) -> PxConstraint {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);

    let mut scope = None;
    let mut phases = vec![];
    let mut trait_category = None;
    let mut weight = None;
    let mut prompt_injection = None;
    let mut when_expr = None;
    let mut require_expr = None;
    let mut severity = "warning".to_string();
    let mut message = None;

    let Some(constraint_body) = inner.find(|p| p.as_rule() == Rule::constraint_body) else {
        return PxConstraint {
            name,
            scope,
            phases,
            trait_category,
            weight,
            prompt_injection,
            when_expr,
            require_expr,
            severity,
            message,
        };
    };

    for child in constraint_body.into_inner() {
        match child.as_rule() {
            Rule::scope_clause => scope = child.into_inner().next().map(|p| p.as_str().to_string()),
            Rule::phase_clause => {
                if let Some(csv) = child.into_inner().find(|p| p.as_rule() == Rule::ident_csv) {
                    phases = csv
                        .into_inner()
                        .filter(|p| p.as_rule() == Rule::ident)
                        .map(|p| p.as_str().to_string())
                        .collect();
                }
            }
            Rule::trait_clause => {
                trait_category = child.into_inner().next().map(|p| p.as_str().to_string())
            }
            Rule::weight_clause => {
                weight = child
                    .into_inner()
                    .next()
                    .and_then(|p| p.as_str().parse().ok())
            }
            Rule::prompt_clause => {
                prompt_injection = child.into_inner().next().map(|p| unquote(p.as_str()))
            }
            Rule::when_expr => {
                when_expr = child.into_inner().next().map(|p| p.as_str().to_string())
            }
            Rule::require_expr => {
                require_expr = child.into_inner().next().map(|p| p.as_str().to_string())
            }
            Rule::severity_clause => {
                severity = child
                    .into_inner()
                    .next()
                    .map(|p| p.as_str().to_string())
                    .unwrap_or_default()
            }
            Rule::message_clause => {
                message = child.into_inner().next().map(|p| unquote(p.as_str()))
            }
            _ => {}
        }
    }

    PxConstraint {
        name,
        scope,
        phases,
        trait_category,
        weight,
        prompt_injection,
        when_expr,
        require_expr,
        severity,
        message,
    }
}

fn build_contract(pair: Pair<'_, Rule>) -> PxContract {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);

    let mut given = None;
    let mut when_desc = None;
    let mut then_desc = None;
    let mut threshold = None;
    let mut examples = vec![];

    let Some(contract_body) = inner.find(|p| p.as_rule() == Rule::contract_body) else {
        return PxContract {
            name,
            given,
            when_desc,
            then_desc,
            threshold,
            examples,
        };
    };

    for child in contract_body.into_inner() {
        match child.as_rule() {
            Rule::given_clause => given = child.into_inner().next().map(|p| unquote(p.as_str())),
            Rule::when_desc => when_desc = child.into_inner().next().map(|p| unquote(p.as_str())),
            Rule::then_desc => then_desc = child.into_inner().next().map(|p| unquote(p.as_str())),
            Rule::threshold_clause => {
                threshold = child
                    .into_inner()
                    .next()
                    .and_then(|p| p.as_str().parse().ok())
            }
            Rule::example_list => {
                examples = child
                    .into_inner()
                    .filter(|p| p.as_rule() == Rule::example)
                    .map(build_example)
                    .collect();
            }
            _ => {}
        }
    }

    PxContract {
        name,
        given,
        when_desc,
        then_desc,
        threshold,
        examples,
    }
}

fn build_example(pair: Pair<'_, Rule>) -> PxExample {
    let mut inner = pair.into_inner();
    let input = inner
        .next()
        .map(|p| parse_value(p))
        .unwrap_or(serde_json::Value::Null);
    let expect = inner
        .next()
        .map(|p| parse_value(p))
        .unwrap_or(serde_json::Value::Null);
    let threshold = inner.next().and_then(|p| p.as_str().parse().ok());
    PxExample {
        input,
        expect,
        threshold,
    }
}

fn build_function(pair: Pair<'_, Rule>) -> PxFunction {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);

    let mut params = vec![];
    let mut return_type = String::new();
    let mut mode = FunctionMode::Deterministic;
    let mut docstring = String::new();

    for child in inner {
        match child.as_rule() {
            Rule::param_list => {
                params = child
                    .into_inner()
                    .filter(|p| p.as_rule() == Rule::param)
                    .map(build_field)
                    .collect();
            }
            Rule::type_expr => return_type = child.as_str().to_string(),
            Rule::function_body => {
                for body_part in child.into_inner() {
                    match body_part.as_rule() {
                        Rule::mode_clause => {
                            let mode_str = body_part
                                .into_inner()
                                .next()
                                .map(|p| p.as_str())
                                .unwrap_or("deterministic");
                            mode = match mode_str {
                                "probabilistic" => FunctionMode::Probabilistic,
                                "hybrid" => FunctionMode::Hybrid,
                                _ => FunctionMode::Deterministic,
                            };
                        }
                        Rule::docstring => {
                            docstring = body_part.as_str().trim_matches('"').to_string()
                        }
                        _ => {}
                    }
                }
            }
            Rule::docstring => docstring = child.as_str().trim_matches('"').to_string(),
            _ => {}
        }
    }

    PxFunction {
        name,
        params,
        return_type,
        mode,
        docstring,
    }
}

fn build_trigger(pair: Pair<'_, Rule>) -> PxTrigger {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);

    let mut on_event = String::new();
    let mut schedule = None;
    let mut run = String::new();

    let Some(trigger_body) = inner.find(|p| p.as_rule() == Rule::trigger_body) else {
        return PxTrigger {
            name,
            on_event,
            schedule,
            run,
        };
    };

    for child in trigger_body.into_inner() {
        match child.as_rule() {
            Rule::on_clause => {
                on_event = child
                    .into_inner()
                    .next()
                    .map(|p| p.as_str().to_string())
                    .unwrap_or_default()
            }
            Rule::schedule_clause => {
                schedule = child.into_inner().next().map(|p| unquote(p.as_str()))
            }
            Rule::run_clause => {
                run = child
                    .into_inner()
                    .next()
                    .map(|p| p.as_str().to_string())
                    .unwrap_or_default()
            }
            _ => {}
        }
    }

    PxTrigger {
        name,
        on_event,
        schedule,
        run,
    }
}

fn build_procedure(pair: Pair<'_, Rule>) -> PxProcedure {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);

    let mut trigger = None;
    let mut given = None;
    let mut steps = vec![];

    let Some(body) = inner.find(|p| p.as_rule() == Rule::procedure_body) else {
        return PxProcedure {
            name,
            trigger,
            given,
            steps,
        };
    };

    for child in body.into_inner() {
        match child.as_rule() {
            Rule::procedure_trigger_clause => {
                let clause_inner: Vec<_> = child.into_inner().collect();
                if let Some(kind_pair) = clause_inner.iter().find(|p| p.as_rule() == Rule::procedure_trigger_kind).cloned()
                {
                    let kind_text = kind_pair.as_str().to_string();
                    let ki = kind_pair.into_inner();
                    
                    // Extract the keyword (first part, before space or '(')
                    let kind_str = kind_text
                        .split(&['(', ' '][..])
                        .next()
                        .unwrap_or(&kind_text)
                        .to_string();
                    
                    let mut params_value = None;
                    
                    // Handle trigger-specific parameters
                    for part in ki {
                        match part.as_rule() {
                            Rule::trigger_pattern => {
                                // Extract the pattern string for on_write(pattern)
                                if let Some(pattern_str) = part.into_inner().next() {
                                    let pattern = unquote(pattern_str.as_str());
                                    let mut map = serde_json::Map::new();
                                    map.insert("pattern".to_string(), serde_json::Value::String(pattern));
                                    params_value = Some(serde_json::Value::Object(map));
                                }
                            }
                            Rule::string => {
                                // For on_event("event_name"), extract the event name
                                let event_name = unquote(part.as_str());
                                let mut map = serde_json::Map::new();
                                map.insert("event".to_string(), serde_json::Value::String(event_name));
                                params_value = Some(serde_json::Value::Object(map));
                            }
                            Rule::map_val => {
                                // For periodic {interval: "33ms"} or cron {schedule: "..."}
                                params_value = Some(parse_value(part));
                            }
                            _ => {}
                        }
                    }

                    // Handle v2-style trigger sub-keys (indented key: value lines)
                    if let Some(sub_keys_pair) = clause_inner.iter().find(|p| p.as_rule() == Rule::trigger_sub_keys).cloned() {
                        let map = params_value.get_or_insert_with(|| serde_json::Value::Object(serde_json::Map::new()));
                        if let Some(obj) = map.as_object_mut() {
                            for sub_key in sub_keys_pair.into_inner().filter(|p| p.as_rule() == Rule::trigger_sub_key) {
                                let mut ski = sub_key.into_inner();
                                let key = next_str(&mut ski);
                                let val_str = ski.next().map(|p| p.as_str().trim().to_string()).unwrap_or_default();
                                // Try to parse as JSON-compatible value, otherwise store as string
                                let val = if val_str.starts_with('"') || val_str.starts_with('\'') {
                                    serde_json::Value::String(unquote(&val_str))
                                } else if let Ok(n) = val_str.parse::<f64>() {
                                    serde_json::json!(n)
                                } else if val_str == "true" || val_str == "false" {
                                    serde_json::Value::Bool(val_str == "true")
                                } else {
                                    serde_json::Value::String(val_str)
                                };
                                obj.insert(key, val);
                            }
                        }
                    }
                    
                    trigger = Some(PxProcedureTrigger {
                        kind: kind_str,
                        params: params_value,
                    });
                }
            }
            Rule::given_clause => given = child.into_inner().next().map(|p| unquote(p.as_str())),
            Rule::step_list => {
                steps = child
                    .into_inner()
                    .filter(|p| p.as_rule() == Rule::step_decl)
                    .map(build_step)
                    .collect();
            }
            Rule::code_block => {
                steps = build_code_block(child);
            }
            _ => {}
        }
    }

    PxProcedure {
        name,
        trigger,
        given,
        steps,
    }
}

fn build_step(pair: Pair<'_, Rule>) -> PxStep {
    let inner = pair.into_inner().next().unwrap();
    match inner.as_rule() {
        Rule::step_call => {
            let mut parts = inner.into_inner();
            let name = next_str(&mut parts);
            let mut params = serde_json::Value::Object(serde_json::Map::new());
            let mut output_var = None;

            for p in parts {
                match p.as_rule() {
                    Rule::map_val => params = parse_value(p),
                    Rule::param_pair => {
                        let mut kv = p.into_inner();
                        let k = next_str(&mut kv);
                        let v = kv
                            .next()
                            .map(parse_value)
                            .unwrap_or(serde_json::Value::Null);
                        if let Some(obj) = params.as_object_mut() {
                            obj.insert(k, v);
                        }
                    }
                    Rule::ident => output_var = Some(p.as_str().to_string()),
                    _ => {}
                }
            }

            PxStep::Call {
                name,
                params,
                output_var,
            }
        }
        Rule::step_match => {
            let arms = inner
                .into_inner()
                .filter(|p| p.as_rule() == Rule::match_arm_list)
                .flat_map(|mal| mal.into_inner().filter(|p| p.as_rule() == Rule::match_arm))
                .map(|arm| {
                    let mut ai = arm.into_inner();
                    let condition = ai
                        .next()
                        .map(|p| p.as_str().to_string())
                        .unwrap_or_default();
                    let result = ai
                        .next()
                        .map(|p| p.as_str().to_string())
                        .unwrap_or_default();
                    PxMatchArm { condition, result }
                })
                .collect();
            PxStep::Match { arms }
        }
        Rule::step_when => {
            let mut wi = inner.into_inner();
            let condition = wi
                .next()
                .map(|p| p.as_str().to_string())
                .unwrap_or_default();
            let steps = wi
                .find(|p| p.as_rule() == Rule::block_step_list)
                .map(|sl| {
                    sl.into_inner()
                        .filter(|p| p.as_rule() == Rule::step_decl)
                        .map(build_step)
                        .collect()
                })
                .unwrap_or_default();
            PxStep::When { condition, steps }
        }
        Rule::step_loop => {
            let li = inner.into_inner();
            let mut over = None;
            let mut times = None;
            let mut item_var = "item".to_string();
            let mut key_var = None;
            let mut output_var = None;
            let mut steps = vec![];
            let mut ident_index = 0;

            for child in li {
                match child.as_rule() {
                    Rule::loop_source => {
                        let src_text = child.as_str();
                        let mut src_inner = child.into_inner();
                        if src_text.starts_with("over") {
                            over = src_inner
                                .find(|p| p.as_rule() == Rule::ident)
                                .map(|p| format!("${}", p.as_str()));
                        } else if src_text.starts_with("times") {
                            times = src_inner
                                .find(|p| p.as_rule() == Rule::integer)
                                .and_then(|p| p.as_str().parse().ok());
                        }
                    }
                    Rule::key_as_clause => {
                        key_var = child
                            .into_inner()
                            .find(|p| p.as_rule() == Rule::ident)
                            .map(|p| p.as_str().to_string());
                    }
                    Rule::ident => {
                        if ident_index == 0 {
                            item_var = child.as_str().to_string();
                        } else {
                            output_var = Some(child.as_str().to_string());
                        }
                        ident_index += 1;
                    }
                    Rule::block_step_list => {
                        steps = child
                            .into_inner()
                            .filter(|p| p.as_rule() == Rule::step_decl)
                            .map(build_step)
                            .collect();
                    }
                    _ => {}
                }
            }

            PxStep::Loop {
                over,
                times,
                item_var,
                key_var,
                steps,
                output_var,
            }
        }
        Rule::step_emit => {
            let mut event = serde_json::Value::Object(serde_json::Map::new());
            for child in inner.into_inner() {
                match child.as_rule() {
                    Rule::map_val => event = parse_value(child),
                    Rule::param_pair => {
                        let mut kv = child.into_inner();
                        let k = next_str(&mut kv);
                        let v = kv
                            .next()
                            .map(parse_value)
                            .unwrap_or(serde_json::Value::Null);
                        if let Some(obj) = event.as_object_mut() {
                            obj.insert(k, v);
                        }
                    }
                    _ => {}
                }
            }
            PxStep::Emit { event }
        }
        Rule::step_try => {
            let mut try_steps = vec![];
            let mut catch_steps = vec![];
            let mut retry: Option<u64> = None;
            let mut retry_delay_ms: Option<u64> = None;
            let mut retry_backoff: Option<String> = None;
            let mut retry_max_delay_ms: Option<u64> = None;
            let mut retry_jitter: Option<bool> = None;

            for child in inner.into_inner() {
                match child.as_rule() {
                    Rule::try_retry_clause => {
                        for rc in child.into_inner() {
                            match rc.as_rule() {
                                Rule::integer => {
                                    retry = Some(rc.as_str().parse().unwrap_or(0));
                                }
                                Rule::branch_retry_opt => {
                                    let opt = rc.into_inner().next().unwrap();
                                    match opt.as_rule() {
                                        Rule::retry_delay_opt => {
                                            let val = opt.into_inner().next().unwrap();
                                            retry_delay_ms = Some(val.as_str().parse().unwrap_or(0));
                                        }
                                        Rule::retry_backoff_opt => {
                                            let strategy = opt.into_inner().next().unwrap();
                                            retry_backoff = Some(strategy.as_str().to_string());
                                        }
                                        Rule::retry_max_delay_opt => {
                                            let val = opt.into_inner().next().unwrap();
                                            retry_max_delay_ms = Some(val.as_str().parse().unwrap_or(0));
                                        }
                                        Rule::retry_jitter_opt => {
                                            retry_jitter = Some(true);
                                        }
                                        _ => {}
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                    Rule::try_step_list => {
                        try_steps = child
                            .into_inner()
                            .filter(|p| p.as_rule() == Rule::step_decl)
                            .map(build_step)
                            .collect();
                    }
                    Rule::catch_clause => {
                        catch_steps = child
                            .into_inner()
                            .filter(|p| p.as_rule() == Rule::step_decl)
                            .map(build_step)
                            .collect();
                    }
                    _ => {}
                }
            }

            PxStep::Try {
                steps: try_steps,
                catch: catch_steps,
                retry,
                retry_delay_ms,
                retry_backoff,
                retry_max_delay_ms,
                retry_jitter,
            }
        }
        Rule::step_parallel => {
            let mut branches = vec![];
            let mut output_var = None;

            for child in inner.into_inner() {
                match child.as_rule() {
                    Rule::ident => {
                        output_var = Some(child.as_str().to_string());
                    }
                    Rule::parallel_branch_list => {
                        for branch_pair in child.into_inner() {
                            if branch_pair.as_rule() == Rule::parallel_branch {
                                let mut bi = branch_pair.into_inner();
                                let name = bi
                                    .next()
                                    .map(|p| p.as_str().to_string())
                                    .unwrap_or_default();

                                // Parse optional retry clause
                                let mut retry = None;
                                let mut retry_delay_ms = None;
                                let mut retry_backoff = None;
                                let mut retry_max_delay_ms = None;
                                let mut retry_jitter = None;
                                let mut steps = vec![];

                                for part in bi {
                                    match part.as_rule() {
                                        Rule::branch_retry_clause => {
                                            let mut rc = part.into_inner();
                                            if let Some(count_pair) = rc.next() {
                                                retry = count_pair.as_str().parse().ok();
                                            }
                                            for opt in rc {
                                                if opt.as_rule() == Rule::branch_retry_opt {
                                                    let inner_opt = opt.into_inner().next().unwrap();
                                                    match inner_opt.as_rule() {
                                                        Rule::retry_delay_opt => {
                                                            let val = inner_opt.into_inner().next().unwrap();
                                                            retry_delay_ms = val.as_str().parse().ok();
                                                        }
                                                        Rule::retry_backoff_opt => {
                                                            let val = inner_opt.into_inner().next().unwrap();
                                                            retry_backoff = Some(val.as_str().to_string());
                                                        }
                                                        Rule::retry_max_delay_opt => {
                                                            let val = inner_opt.into_inner().next().unwrap();
                                                            retry_max_delay_ms = val.as_str().parse().ok();
                                                        }
                                                        Rule::retry_jitter_opt => {
                                                            retry_jitter = Some(true);
                                                        }
                                                        _ => {}
                                                    }
                                                }
                                            }
                                        }
                                        Rule::block_step_list => {
                                            steps = part
                                                .into_inner()
                                                .filter(|p| p.as_rule() == Rule::step_decl)
                                                .map(build_step)
                                                .collect();
                                        }
                                        _ => {}
                                    }
                                }

                                branches.push(PxParallelBranch {
                                    name,
                                    steps,
                                    retry,
                                    retry_delay_ms,
                                    retry_backoff,
                                    retry_max_delay_ms,
                                    retry_jitter,
                                });
                            }
                        }
                    }
                    _ => {}
                }
            }

            PxStep::Parallel {
                branches,
                output_var,
            }
        }
        Rule::step_assign => {
            let mut parts = inner.into_inner();
            // var_ref is "$name" — strip the $ prefix
            let var_raw = next_str(&mut parts);
            let var = var_raw.strip_prefix('$').unwrap_or(&var_raw).to_string();
            // assign_value captures everything until newline as raw text
            let value = parts
                .next()
                .map(|p| p.as_str().trim().to_string())
                .unwrap_or_default();
            PxStep::Assign { var, value }
        }
        Rule::step_if => {
            let mut parts = inner.into_inner();
            let condition = parts
                .next()
                .map(|p| p.as_str().to_string())
                .unwrap_or_default();
            let then_steps = parts
                .find(|p| p.as_rule() == Rule::block_step_list)
                .map(|sl| {
                    sl.into_inner()
                        .filter(|p| p.as_rule() == Rule::step_decl)
                        .map(build_step)
                        .collect()
                })
                .unwrap_or_default();
            let else_steps = parts
                .find(|p| p.as_rule() == Rule::step_else)
                .map(|se| {
                    se.into_inner()
                        .find(|p| p.as_rule() == Rule::block_step_list)
                        .map(|sl| {
                            sl.into_inner()
                                .filter(|p| p.as_rule() == Rule::step_decl)
                                .map(build_step)
                                .collect()
                        })
                        .unwrap_or_default()
                })
                .unwrap_or_default();
            PxStep::If {
                condition,
                then_steps,
                else_steps,
            }
        }
        Rule::step_for => {
            let mut parts = inner.into_inner();
            // var_ref is "$name" — strip the $ prefix
            let var_raw = next_str(&mut parts);
            let var = var_raw.strip_prefix('$').unwrap_or(&var_raw).to_string();
            // iterable is a call_expr, var_ref, or dotted_ident
            let iterable = parts
                .next()
                .map(|p| p.as_str().to_string())
                .unwrap_or_default();
            let steps = parts
                .find(|p| p.as_rule() == Rule::block_step_list)
                .map(|sl| {
                    sl.into_inner()
                        .filter(|p| p.as_rule() == Rule::step_decl)
                        .map(build_step)
                        .collect()
                })
                .unwrap_or_default();
            PxStep::For {
                var,
                iterable,
                steps,
            }
        }
        Rule::step_return => {
            let value = inner.into_inner().next().map(|p| parse_value(p));
            PxStep::Return { value }
        }
        Rule::step_abort => {
            let value = inner.into_inner().next().map(|p| parse_value(p));
            PxStep::Abort { value }
        }
        _ => PxStep::Call {
            name: "unknown".into(),
            params: serde_json::Value::Null,
            output_var: None,
        },
    }
}
fn build_scenario(pair: Pair<'_, Rule>) -> PxScenario {
    let mut inner = pair.into_inner();
    let name = next_str(&mut inner);

    let mut given = String::new();
    let mut setup = vec![];
    let mut run = None;
    let mut expectations = vec![];

    let Some(scenario_body) = inner.find(|p| p.as_rule() == Rule::scenario_body) else {
        return PxScenario { name, given, setup, run, expectations };
    };

    for child in scenario_body.into_inner() {
        match child.as_rule() {
            Rule::given_clause => {
                given = child.into_inner().next().map(|p| unquote(p.as_str())).unwrap_or_default();
            }
            Rule::setup_clause => {
                if let Some(step_list) = child.into_inner().find(|p| p.as_rule() == Rule::step_list) {
                    setup = step_list.into_inner().filter(|p| p.as_rule() == Rule::step_decl).map(build_step).collect();
                }
            }
            Rule::scenario_run_clause => {
                let mut parts = child.into_inner();
                let procedure = next_str(&mut parts);
                let params = parts.find(|p| p.as_rule() == Rule::map_val).map(parse_value);
                run = Some(PxScenarioRun { procedure, params });
            }
            Rule::expect_clause => {
                if let Some(expectation_list) = child.into_inner().find(|p| p.as_rule() == Rule::expectation_list) {
                    expectations = expectation_list.into_inner().filter(|p| p.as_rule() == Rule::expectation).map(build_expectation).collect();
                }
            }
            _ => {}
        }
    }

    PxScenario { name, given, setup, run, expectations }
}

fn build_expectation(pair: Pair<'_, Rule>) -> PxExpectation {
    let inner = pair.into_inner().next().unwrap();
    match inner.as_rule() {
        Rule::not_expectation => {
            let positive = inner.into_inner().find(|p| p.as_rule() == Rule::positive_expectation).unwrap();
            let mut parts = positive.into_inner();
            let check = next_str(&mut parts);
            let params = parts.find(|p| p.as_rule() == Rule::map_val).map(parse_value);
            PxExpectation { negated: true, check, params }
        }
        Rule::positive_expectation => {
            let mut parts = inner.into_inner();
            let check = next_str(&mut parts);
            let params = parts.find(|p| p.as_rule() == Rule::map_val).map(parse_value);
            PxExpectation { negated: false, check, params }
        }
        _ => PxExpectation { negated: false, check: "unknown".into(), params: None },
    }
}


// === Helpers ===

fn next_str(pairs: &mut Pairs<'_, Rule>) -> String {
    pairs
        .next()
        .map(|p| p.as_str().to_string())
        .unwrap_or_default()
}

fn unquote(s: &str) -> String {
    s.trim_matches('"').trim_matches('\'').to_string()
}

fn parse_value(pair: Pair<'_, Rule>) -> serde_json::Value {
    match pair.as_rule() {
        Rule::string => serde_json::Value::String(unquote(pair.as_str())),
        Rule::integer => serde_json::json!(pair.as_str().parse::<i64>().unwrap_or(0)),
        Rule::float => serde_json::json!(pair.as_str().parse::<f64>().unwrap_or(0.0)),
        Rule::boolean => serde_json::json!(pair.as_str() == "true"),
        Rule::var_ref => serde_json::Value::String(pair.as_str().to_string()),
        Rule::list_val => {
            let items: Vec<serde_json::Value> = pair.into_inner().map(parse_value).collect();
            serde_json::Value::Array(items)
        }
        Rule::map_val => {
            let mut map = serde_json::Map::new();
            let mut inner = pair.into_inner();
            while let Some(key) = inner.next() {
                if let Some(val) = inner.next() {
                    map.insert(key.as_str().to_string(), parse_value(val));
                }
            }
            serde_json::Value::Object(map)
        }
        Rule::ident => serde_json::Value::String(pair.as_str().to_string()),
        _ => {
            // Try to parse inner value
            if let Some(inner) = pair.into_inner().next() {
                parse_value(inner)
            } else {
                serde_json::Value::Null
            }
        }
    }
}

// === V2 Code Block Builder ===

/// Build steps from a v2 code_block `{ stmts... }`
fn build_code_block(pair: Pair<'_, Rule>) -> Vec<PxStep> {
    pair.into_inner()
        .filter(|p| p.as_rule() == Rule::code_stmt)
        .map(build_code_stmt)
        .collect()
}

/// Build a single v2 statement into a PxStep
fn build_code_stmt(pair: Pair<'_, Rule>) -> PxStep {
    let inner = pair.into_inner().next().unwrap();
    match inner.as_rule() {
        Rule::code_let_stmt => {
            let mut parts = inner.into_inner();
            let var = next_str(&mut parts);
            let value = parts.next().map(|p| expr_to_string(p)).unwrap_or_default();
            PxStep::Assign { var, value }
        }
        Rule::code_assign_stmt => {
            let mut parts = inner.into_inner();
            let lvalue = next_str(&mut parts); // code_lvalue
            let _op = next_str(&mut parts); // code_assign_op (=, +=, -=)
            let expr_pair = parts.next().unwrap();
            let expr_str = expr_to_string(expr_pair);
            // For += and -=, expand to full expression
            let value = match _op.as_str() {
                "+=" => format!("{} + ({})", lvalue, expr_str),
                "-=" => format!("{} - ({})", lvalue, expr_str),
                _ => expr_str,
            };
            PxStep::Assign { var: lvalue, value }
        }
        Rule::code_if_stmt => build_code_if(inner),
        Rule::code_for_stmt => {
            let mut parts = inner.into_inner();
            let var = next_str(&mut parts);
            let iterable = parts.next().map(|p| expr_to_string(p)).unwrap_or_default();
            let steps = parts
                .find(|p| p.as_rule() == Rule::code_block)
                .map(build_code_block)
                .unwrap_or_default();
            PxStep::For { var, iterable, steps }
        }
        Rule::code_return_stmt => {
            let value = inner.into_inner().next().map(|p| {
                serde_json::Value::String(expr_to_string(p))
            });
            PxStep::Return { value }
        }
        Rule::code_emit_stmt => {
            let mut parts = inner.into_inner();
            let event_name = parts.next().map(|p| expr_to_string(p)).unwrap_or_default();
            let event_data = parts.next().map(|p| expr_to_string(p));
            let mut map = serde_json::Map::new();
            map.insert("event".to_string(), serde_json::Value::String(event_name));
            if let Some(data) = event_data {
                map.insert("data".to_string(), serde_json::Value::String(data));
            }
            PxStep::Emit { event: serde_json::Value::Object(map) }
        }
        Rule::code_expr_stmt => {
            // Expression statement — likely a function call like write_state("key", val);
            let expr_pair = inner.into_inner().next().unwrap();
            // Check if it's a call expression
            if expr_pair.as_rule() == Rule::code_expr {
                let inner_expr = find_deepest_call_or_expr(expr_pair.clone());
                if let Some(call) = inner_expr {
                    if call.as_rule() == Rule::code_call_expr {
                        return build_code_call(call, None);
                    }
                }
            }
            // Fallback: treat as a call with the text as name
            let text = expr_pair.as_str().to_string();
            PxStep::Call {
                name: text,
                params: serde_json::Value::Object(serde_json::Map::new()),
                output_var: None,
            }
        }
        Rule::code_match_stmt => {
            let mut parts = inner.into_inner();
            let _subject = parts.next().map(|p| expr_to_string(p)).unwrap_or_default();
            let mut arms = Vec::new();
            for arm_pair in parts {
                if arm_pair.as_rule() == Rule::code_match_arm {
                    let mut arm_parts = arm_pair.into_inner();
                    let pattern = arm_parts.next().map(|p| p.as_str().trim().to_string()).unwrap_or_default();
                    let result = arm_parts.next().map(|p| {
                        if p.as_rule() == Rule::code_block {
                            "__block__".to_string()
                        } else {
                            expr_to_string(p)
                        }
                    }).unwrap_or_default();
                    arms.push(PxMatchArm {
                        condition: pattern,
                        result,
                    });
                }
            }
            PxStep::Match { arms }
        }
        Rule::code_try_stmt => {
            let mut parts = inner.into_inner();
            let try_block = parts.next()
                .filter(|p| p.as_rule() == Rule::code_block)
                .map(build_code_block)
                .unwrap_or_default();
            let _catch_var = parts.next().filter(|p| p.as_rule() == Rule::ident).map(|p| p.as_str().to_string());
            let catch_block = parts.next()
                .filter(|p| p.as_rule() == Rule::code_block)
                .map(build_code_block)
                .unwrap_or_default();
            PxStep::Try {
                steps: try_block,
                catch: catch_block,
                retry: None,
                retry_delay_ms: None,
                retry_backoff: None,
                retry_max_delay_ms: None,
                retry_jitter: None,
            }
        }
        Rule::code_parallel_stmt => {
            let mut branches = Vec::new();
            for branch_pair in inner.into_inner() {
                if branch_pair.as_rule() == Rule::code_parallel_branch {
                    let mut bp = branch_pair.into_inner();
                    let branch_name = next_str(&mut bp);
                    let branch_steps = bp.next()
                        .filter(|p| p.as_rule() == Rule::code_block)
                        .map(build_code_block)
                        .unwrap_or_default();
                    branches.push(PxParallelBranch {
                        name: branch_name,
                        steps: branch_steps,
                        retry: None,
                        retry_delay_ms: None,
                        retry_backoff: None,
                        retry_max_delay_ms: None,
                        retry_jitter: None,
                    });
                }
            }
            PxStep::Parallel { branches, output_var: None }
        }
        _ => PxStep::Call {
            name: format!("__unknown_{:?}", inner.as_rule()),
            params: serde_json::Value::Object(serde_json::Map::new()),
            output_var: None,
        },
    }
}

fn build_code_if(pair: Pair<'_, Rule>) -> PxStep {
    let mut parts = pair.into_inner();
    let condition = parts.next().map(|p| expr_to_string(p)).unwrap_or_default();
    let then_block = parts.next();
    let then_steps = then_block
        .filter(|p| p.as_rule() == Rule::code_block)
        .map(build_code_block)
        .unwrap_or_default();
    
    let else_steps = if let Some(else_part) = parts.next() {
        match else_part.as_rule() {
            Rule::code_if_stmt => vec![build_code_if(else_part)],
            Rule::code_block => build_code_block(else_part),
            _ => vec![],
        }
    } else {
        vec![]
    };

    PxStep::If { condition, then_steps, else_steps }
}

fn build_code_call(pair: Pair<'_, Rule>, output_var: Option<String>) -> PxStep {
    let mut parts = pair.into_inner();
    let name = next_str(&mut parts);
    let args: Vec<String> = parts
        .filter(|p| p.as_rule() == Rule::code_expr)
        .map(|p| expr_to_string(p))
        .collect();
    
    let params = if args.is_empty() {
        serde_json::Value::Object(serde_json::Map::new())
    } else {
        serde_json::Value::Array(args.into_iter().map(serde_json::Value::String).collect())
    };

    PxStep::Call { name, params, output_var }
}

/// Find the deepest call expression inside a code_expr tree
fn find_deepest_call_or_expr(pair: Pair<'_, Rule>) -> Option<Pair<'_, Rule>> {
    if pair.as_rule() == Rule::code_call_expr {
        return Some(pair);
    }
    for child in pair.into_inner() {
        if child.as_rule() == Rule::code_call_expr {
            return Some(child);
        }
        if let Some(found) = find_deepest_call_or_expr(child) {
            return Some(found);
        }
    }
    None
}

/// Convert a code_expr parse tree back to a string representation
fn expr_to_string(pair: Pair<'_, Rule>) -> String {
    pair.as_str().trim().to_string()
}
