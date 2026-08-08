# Performance Optimizations

## Rule Execution Engine

### Optimizations Implemented

#### 1. Event-Type Index (`PraxisRegistry.getRuleIdsForEvents`)

The registry now maintains a pre-built index mapping event tags to rule IDs. When `engine.step(events)` is called, only rules matching the incoming event tags are evaluated — avoiding a linear scan of all registered rules.

**Impact**: For rulesets where most rules use `eventTypes` filters, execution time scales with matched rules rather than total rules. A 500-rule registry with 10% matching achieves **~1.8x** speedup over evaluating all rules.

#### 2. Cached ID Lists

`getRuleIds()` and `getConstraintIds()` now return cached arrays, invalidated only on new registrations. This eliminates repeated `Array.from(Map.keys())` allocations during `step()`.

#### 3. Skip Redundant Filtering

When `step()` uses the indexed path, the per-rule `eventTypes` check is bypassed since rules are already pre-filtered by the index.

### Benchmark Results (representative)

| Scenario | ops/sec |
|----------|---------|
| 100 catch-all rules, noop | ~25,600 |
| 100 event-filtered rules (10% match) | ~46,200 |
| 500 catch-all rules, noop | ~5,200 |
| 500 event-filtered rules (10% match) | ~9,000 |
| 500 rules, 100 mixed events | ~6,400 |

### CI Integration

Benchmarks run on every PR and push to `main` via `.github/workflows/benchmarks.yml`.

The workflow writes a machine-readable report (`pnpm bench:json`) and then enforces
baseline thresholds (`pnpm bench:check`). `scripts/check-benchmarks.mjs` compares each
scenario listed in `benchmarks/baseline.json` against its recorded ops/sec and fails the
job when throughput drops below `baseline × (1 - tolerance)` (default tolerance: 50%, to
absorb shared-runner variance) or when a tracked scenario disappears from the report.
Update `benchmarks/baseline.json` when an intentional performance change lands.

### Recommendations for Maximum Performance

1. **Use `eventTypes` on rules** — rules with event-type filters benefit from indexed lookup
2. **Prefer `last-write-wins` dedup** — avoids unbounded fact array growth
3. **Keep rule implementations simple** — avoid allocations in hot `impl` functions
