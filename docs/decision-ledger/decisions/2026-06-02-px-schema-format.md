# .px Schema Format — Design Draft

## Goals

1. **Human-readable** — anyone can open this and understand what's valid in a .px file
2. **Machine-parseable** — the validator reads this to check .px files
3. **Self-documenting** — descriptions explain *why*, not just *what*
4. **Versionable** — schema version in .px files enables forward compat
5. **Extensible** — adding a keyword = adding a node to the schema

## Format Decision

The schema is written in YAML. Why:
- The declarative layer of .px IS YAML-inspired — the schema should feel like what it validates
- YAML has mature tooling (editors, linters, parsers in every language)
- No bootstrapping problem (don't need a .px parser to read the schema)
- Familiar to the CI/CD audience

## Schema Structure

```yaml
# px-schema.yaml
# Version of the schema format itself
schema_version: "1.0"

# What .px version this schema describes
px_version: "2.0"

# Top-level constructs that can appear in a .px file
constructs:

  # ─── ENTITY ───────────────────────────────────────────────────
  entity:
    description: |
      Defines a data shape stored in PluresDB. Pure schema —
      no logic, no computation. Answers "what exists."
    required: [fields]
    fields:
      prefix:
        type: string
        description: PluresDB key prefix for instances of this entity
        example: '"game:ship:"'
      fields:
        type: map
        description: Named fields with their types
        value_type: type_expr
        required: true

  # ─── CONFIG ───────────────────────────────────────────────────
  config:
    description: |
      Static data constants. Flat or nested key-value maps.
      Referenced by procedures as config.<name>.<key>.
      No computation — just data.
    required: []
    fields:
      _entries:
        type: nested_map
        description: Arbitrary nested key-value structure
        value_type: scalar | nested_map

  # ─── CONSTRAINT ───────────────────────────────────────────────
  constraint:
    description: |
      An assertion about system state that must hold true.
      Predicate expressions only — no mutations.
    required: [severity]
    fields:
      when:
        type: expression
        description: Condition that activates this constraint (when to check)
        example: 'event.type == "ship_update"'
      require:
        type: expression
        description: What must be true when the constraint is active
        example: 'ship.energy >= 0'
      severity:
        type: enum [error, warning, info]
        description: How to treat violations
        required: true
      message:
        type: string
        description: Human-readable explanation of the violation
      scope:
        type: identifier
        description: Namespace scope for constraint evaluation
      phase:
        type: list[identifier]
        description: Lifecycle phases where this constraint applies
        example: '[pre-push, pre-release]'
      weight:
        type: float
        description: Relative importance (0.0 - 1.0) for scoring

  # ─── RULE ─────────────────────────────────────────────────────
  rule:
    description: |
      A condition → action mapping. When conditions are met,
      actions fire. Used for event-driven automation.
    required: [when, then]
    fields:
      priority:
        type: integer
        description: Evaluation order (lower = first)
        default: 100
      when:
        type: condition_list
        description: List of conditions that must ALL be true
        required: true
      let:
        type: map
        description: Named bindings computed from matched state
        value_type: expression
      then:
        type: action_list
        description: Actions to execute when conditions are met
        required: true
      capture:
        type: list[capture_entry]
        description: Facts to record when rule fires

  # ─── PROCEDURE ────────────────────────────────────────────────
  procedure:
    description: |
      Imperative logic block. Declarative header (trigger, params)
      followed by a Rust-style code body in braces.
      This is where computation happens.
    required: [body]
    fields:
      trigger:
        type: trigger_spec
        description: When this procedure executes (event, schedule, manual)
      params:
        type: list[identifier]
        description: Named parameters passed to the procedure
      given:
        type: string
        description: Human-readable description of intent
      body:
        type: code_block
        description: |
          Rust-style imperative code. Supports:
          - let bindings (new variables)
          - assignment (mutation)
          - if/else, for, match (control flow)
          - function calls (actions + built-in functions)
          - return, emit
        required: true

  # ─── SCENARIO ─────────────────────────────────────────────────
  scenario:
    description: |
      A test case. Given some setup, run a procedure,
      expect certain outcomes. Used for validation.
    required: [given, expect]
    fields:
      given:
        type: string
        description: Human-readable description of the scenario
        required: true
      setup:
        type: code_block
        description: Steps to set up initial state
      run:
        type: invocation
        description: Which procedure to execute with what params
      expect:
        type: expectation_list
        description: Assertions about the outcome
        required: true

# ─── TYPE DEFINITIONS ────────────────────────────────────────────

types:

  type_expr:
    description: A type annotation for entity fields
    one_of:
      - String
      - f64
      - u32
      - u64
      - i32
      - i64
      - bool
      - enum(value1, value2, ...)
      - list[type_expr]
      - optional[type_expr]

  trigger_spec:
    description: Defines when a procedure fires
    one_of:
      periodic:
        description: Runs on a fixed interval
        required: [interval]
        fields:
          interval:
            type: duration
            description: Time between executions
            example: '"33ms"'
      on_write:
        description: Fires when a PluresDB key matching pattern is written
        required: [pattern]
        fields:
          pattern:
            type: string
            description: Key glob pattern to watch
            example: '"game:ship:*"'
          when:
            type: expression
            description: Additional condition filter
      on_event:
        description: Fires on a named event emission
        required: [event]
        fields:
          event:
            type: string
            description: Event name to listen for
      startup:
        description: Fires once when the system starts
        fields: {}
      cron:
        description: Fires on a cron schedule
        fields:
          expr:
            type: string
            description: Cron expression
          tz:
            type: string
            description: IANA timezone
      manual:
        description: Only fires when explicitly invoked
        fields: {}

  expression:
    description: |
      A predicate or value expression. Supports:
      - Literals: 42, 3.14, "hello", true, false
      - References: ship.energy, config.ship_classes.gnat.thrust
      - Operators: +, -, *, /, ^, ==, !=, >, <, >=, <=, &&, ||
      - Functions: sqrt(), min(), max(), len(), contains()
      - Inline conditionals: if x > 0 { x } else { 0 }

  duration:
    description: A time duration string
    examples: ['"33ms"', '"1s"', '"5m"', '"1h"', '"24h"']

  code_block:
    description: |
      Rust-style imperative code delimited by { }.
      The opening { appears after the declarative header.
      Statements end with semicolons.
      Blocks use braces (if, for, match).
      Variables are plain identifiers (no $ sigil).
      New bindings use `let`. Mutations use bare assignment.

  scalar:
    one_of: [string, integer, float, boolean]

  identifier:
    description: A name — letters, digits, underscores. Starts with letter or underscore.
    pattern: '[a-zA-Z_][a-zA-Z0-9_]*'

# ─── SCHEMA METADATA ────────────────────────────────────────────

meta:
  comment_styles: ['#', '//']
  comment_note: |
    Both # and // are valid comment markers everywhere.
    Convention: # in declarative sections, // in code blocks.
    The parser treats both identically.

  file_header:
    description: |
      Optional schema version declaration at top of .px file.
      Enables forward compatibility — validator picks the right schema.
    syntax: '# px: version 2.0'
    required: false

  declarative_style:
    description: |
      Outside of code blocks, .px uses YAML-inspired indented
      key-value syntax. Colons separate keys from values.
      Nesting is indentation-based (2 spaces).

  procedural_style:
    description: |
      Inside code blocks (after fn: | or between { }),
      syntax is Rust-style: braces, semicolons, let bindings.

  templating:
    description: |
      Jinja2-style {{ variable }} interpolation is supported
      in string values within declarative sections.
      Environment variables: {{ env.VAR_NAME }}
      Config references: {{ config.section.key }}
    note: Templating is resolved at load time, before validation.
```

## How It's Used

### By humans (discoverability)
```
Q: "What can I put under a procedure's trigger?"
A: Look at types.trigger_spec — it lists periodic, on_write, on_event, startup, cron, manual.
   Each one shows required fields, descriptions, and examples.
```

### By AI (generation)
```
Prompt: "Write a .px procedure that runs every 5 seconds"
AI reads: constructs.procedure → fields.trigger → types.trigger_spec.periodic
AI writes:
  procedure heartbeat:
    trigger: periodic
      interval: "5s"
  {
      let status = read_state("system:health");
      emit("heartbeat", status);
  }
```

### By the validator (enforcement)
```
Input: .px file with `trigger: periodc` (typo)
Schema lookup: constructs.procedure.fields.trigger → type: trigger_spec
trigger_spec.one_of does not contain "periodc"
Error: Unknown trigger type "periodc". Valid types: periodic, on_write, on_event, startup, cron, manual
```

### By the editor (tooling)
```
User types "trigger: " → autocomplete offers: periodic, on_write, on_event, startup, cron, manual
User picks "periodic" → autocomplete offers: interval (required), and shows description
```

## Schema Generation — Build Pipeline Integration

The schema is **generated, not hand-maintained.** It's a build artifact derived from the source of truth (Rust types + grammar).

### Pipeline Steps

```
cargo build (praxis-native)
    ↓  build.rs or proc-macro extracts #[px_schema] annotations
    ↓  generates: target/px-schema.yaml
    ↓
cargo test
    ↓  schema validation tests: all .px files in repo validate against generated schema
    ↓  schema freshness test: generated schema matches committed schema (no drift)
    ↓
release
    ↓  schema ships alongside binary/npm package
    ↓  published to docs site for editor tooling / AI consumption
```

### Invariants (enforced by CI)

1. **Schema is always fresh** — `generate → diff` step fails if committed schema diverges from generated
2. **All .px files validate** — every .px in the workspace is checked against the schema during `cargo test`
3. **No undocumented constructs** — adding a grammar rule or compiler path without a `#[px_schema]` annotation fails the build
4. **No orphaned schema entries** — if the schema declares something the compiler can't handle, test catches it

### Implementation: Derive from Rust Types

```rust
#[derive(PxSchema)]
#[px_schema(construct = "procedure", description = "Imperative logic block...")]
pub struct PxProcedure {
    #[px_schema(description = "When this procedure fires", schema_type = "trigger_spec")]
    pub trigger: Option<PxTrigger>,

    #[px_schema(description = "Named parameters", required = false)]
    pub params: Vec<String>,

    #[px_schema(description = "Rust-style imperative code", required = true)]
    pub body: CodeBlock,
}
```

The `#[derive(PxSchema)]` macro generates schema YAML at build time. Adding a field to the struct = adding it to the schema = docs + validation + tooling all update automatically.

### Why Not Hand-Maintain

- Humans forget to update docs
- Schema drift is invisible until someone hits a confusing error
- "Impossible to forget because it happens every release" — the only way to guarantee this is generation, not discipline

## Resolved Questions

1. **Should the schema itself be a .px file?** No. YAML avoids the bootstrapping problem.
2. **Conditional requirements** — expressed via `one_of` variants, each with their own `required` fields.
3. **Schema extensibility** — **No custom constructs.** The schema is closed. A construct without a compiler backend is just validated YAML that goes nowhere. Users who want custom behavior use procedures — the imperative body is infinitely extensible via action handlers. New language primitives go through the standard path: propose → schema update → compiler wiring.
4. **Validation strictness** — Warn on unknown keys (enables forward compat where newer .px files partially validate against older schemas).
