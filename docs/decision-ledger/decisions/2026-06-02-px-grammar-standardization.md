# ADR: Praxis (.px) Grammar Standardization — Hybrid Syntax

**Status:** Accepted  
**Date:** 2026-06-02  
**Author:** kbristol + mswork  
**Supersedes:** All prior implicit grammar decisions

## Context

The .px grammar evolved organically across multiple streams and has accumulated inconsistent syntax patterns:

- `end` markers (Ruby) AND `:` block openers (Python) — pick one
- `$` variable sigils (Perl/shell) in an otherwise Rust-like expression evaluator
- `{}` used for both map literals AND block bodies (ambiguous)
- YAML-style indented declarations mixed with brace-delimited logic
- No semicolons → unclear statement boundaries in complex expressions

This inconsistency makes .px harder to learn, harder to parse, and harder for both humans and AI to generate correctly. wind-chess.px (the reference game physics file) cannot even parse because the author (an LLM) guessed the wrong syntax from context — proof that the grammar isn't predictable.

## Decision

Adopt a **hybrid syntax** with two clearly separated modes:

### 1. Declarative mode (entities, configs, constraints, triggers)
- YAML-inspired indented key-value syntax
- No braces, no semicolons
- Colons as key-value separators
- Natural language-friendly for non-programmer audiences

### 2. Procedural mode (procedure bodies)
- **Rust-style braces** for all blocks (`if`, `for`, `match`, procedure bodies)
- **Semicolons** as statement terminators
- **`let`** for new bindings, bare assignment for mutation
- **No `$` sigils** — variables are just names (like Rust)
- **No `end` markers** — braces handle it
- **Expression-based `if`** — `let x = if cond { a } else { b };`
- **Function call syntax** for actions — `write_state("key", value);`

### 3. Boundary rule
- Everything inside `procedure name(...) { ... }` is Rust-style
- Everything outside (entity, config, constraint, trigger declarations) is declarative
- The `{` after procedure params is the mode switch

## Design Principles

1. **Trigger is metadata, not logic.** Lives outside `{}`, like CI/CD pipeline triggers.
2. **Both `//` and `#` comments are valid everywhere.** Convention: `//` inside procedures, `#` in declarations. Parser accepts both.
3. **`let` exists only inside procedure bodies.** Declarative blocks define data/structure — they never compute or assign.
4. **Declarative blocks are pure data.** No assignments, no intermediate state, no `let`. If you need a computed value, write a procedure that computes it.
5. **Expressions in declarative predicates are allowed** (e.g., `require: ship.energy >= 0`) but they are *assertions about state*, not *mutations of state*.

## Grammar Sketch

```
// ═══ DECLARATIVE (outside procedures) ═══

# Entity definitions — pure schema
entity ship:
  prefix: "game:ship:"
  fields:
    id: String
    x: f64
    y: f64
    vx: f64

# Config — static data, no computation
config ship_classes:
  gnat:
    thrust: 600
    drag: 12.0

# Constraints — predicate expressions only
constraint energy_never_negative:
  when: ship_update
  require: ship.energy >= 0
  severity: error
  message: "Ship energy cannot go negative."

// ═══ PROCEDURAL (inside procedures) ═══
// Trigger lives OUTSIDE the body block — it's metadata about when, not what.

procedure tick_ship:
  params: [ship, wind, dt, arena]
{
    let cfg = config.ship_classes[ship.class];
    let thrust_mag = sqrt(ship.thrust_x^2 + ship.thrust_y^2);

    if thrust_mag > 0.0 {
        let cost = cfg.thrust_cost * thrust_mag * dt;
        ship.energy -= cost;
        if ship.energy < 0.0 {
            ship.energy = 0.0;
            ship.thrust_x = 0.0;
        }
    }

    let regen_mul = if thrust_mag > 0.0 { 0.3 } else { 1.0 };
    ship.energy = min(cfg.energy_max, ship.energy + cfg.energy_regen * regen_mul * dt);

    write_state("game:ship:" + ship.id, ship);
}

procedure physics_tick:
  trigger: periodic { interval: "33ms" }
{
    let arena = read_state("game:arena:current");
    if arena.state != "running" { return; }

    let ships = query_all("game:ship:");
    for ship in ships {
        if ship.alive {
            tick_ship(ship, wind, dt, arena);
        }
    }
}
```

## The Boundary Rule

| Context | What's allowed | What's NOT allowed |
|---------|---------------|-------------------|
| Declarative (entity, config, constraint, rule) | Key-value pairs, predicate expressions, static data | `let`, assignments, mutations, procedure calls |
| Procedure body `{ ... }` | `let`, assignment, mutation, control flow, calls | — (full imperative) |
| Trigger clause (before `{`) | Declarative metadata about scheduling/events | Logic, assignments |

## Migration Scope

| Category | Count | Action |
|----------|-------|--------|
| .px files (praxis repo) | 1 | Rewrite |
| .px files (pares-radix) | 23 | Rewrite |
| .px files (inner-space) | 7 | Rewrite |
| .px files (total) | 35* | Rewrite all |
| Grammar (grammar.pest) | 1 | Rewrite procedural rules |
| Parser/Builder (builder.rs) | 1 | Update to emit new AST |
| Compiler (compiler.rs) | 1 | Minimal changes (compiled output unchanged) |
| Executor (executor.rs) | 1 | No change (operates on compiled JSON) |
| Docs (px-language-guide.md) | 1 | Full rewrite |
| Docs (tutorials, examples) | ~10 | Update code samples |
| Tests | ~50+ | Update source strings |

*Some .px files may not have procedural logic and only need minor formatting.

## Consequences

- **Breaking change** to all existing .px files
- Parser becomes simpler — handles syntax only (structure + code blocks)
- Schema definition handles semantics (valid keys, types, required fields)
- Schema is self-documenting: humans and AI read it to know what's valid
- Adding new keywords = schema update, not parser rewrite
- Compiled output format is unchanged → executor needs zero changes
- All downstream consumers (pares-radix, inner-space) must update their .px files
- LLMs will generate correct .px more reliably (schema as reference + Rust syntax in training data)

## Schema-Driven Validation

The .px format is validated against a **schema definition** — not just parsed by a grammar.

### Why

1. **Evolvability** — Add a keyword or option → update the schema. Old files stay valid.
2. **Discoverability** — The schema IS the docs. "What goes under trigger:?" → read the schema.
3. **Tooling** — Autocomplete, linting, hover docs, AI generation all derive from one schema.
4. **Error quality** — "Unknown key 'triggr' under procedure. Did you mean 'trigger'?" vs "parse error at line 5."

### Architecture

```
.px file  →  Parser (syntax: YAML-like structure + fn code blocks)
          →  Schema Validation (semantics: valid keys, types, required fields, descriptions)
          →  Compiler (transform validated AST → executable PluresDB records)
```

The parser doesn't know what `trigger: periodic` means. It produces a generic tree.
The schema says: "under a procedure node, `trigger` is optional; if present, must be one of
[periodic, on_write, on_event, startup, cron]; if periodic, requires `interval` (duration string)."

### Schema Format (TBD)

The schema itself should be:
- Human-readable (not raw JSON Schema verbosity)
- Self-documenting (descriptions on every field)
- Versionable (schema version in .px files enables forward compat)
- Expressible in .px itself (dogfooding) or a simple format like TOML/YAML

Analogies:
- Kubernetes CRDs (YAML validated against OpenAPI schema)
- GitHub Actions schema (editor knows what `on:` accepts)
- Terraform provider schemas (resource attributes are schema-defined)
- Azure Pipelines (trigger/pool/steps all schema-validated)

## Non-Negotiables

1. The boundary between declarative and procedural is always explicit (the `{`)
2. No mixing: you cannot use YAML-style inside a procedure body or braces in declarations
3. All .px files must parse with the new grammar before this ships
4. `cargo test --workspace` passes with zero failures after migration
