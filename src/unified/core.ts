/**
 * Praxis Unified Reactive Layer — Core
 *
 * createApp() → query() / mutate()
 *
 * The developer defines a schema + rules. Praxis handles:
 * - Reactive state (backed by Unum graph DB)
 * - Automatic rule evaluation on state changes
 * - Constraint enforcement on mutations
 * - Chronos logging for every state change
 * - Liveness monitoring (detect broken plumbing)
 * - Svelte-compatible store contract
 */

import type {
  PraxisAppConfig,
  PathSchema,
  QueryOptions,
  ReactiveRef,
  MutationResult,
  UnifiedRule,
  UnifiedConstraint,
} from './types.js';
import type { PraxisFact, PraxisDiagnostics } from '../core/protocol.js';
import { RuleResult } from '../core/rule-result.js';

// ── Internal State ──────────────────────────────────────────────────────────

interface PathState<T = unknown> {
  schema: PathSchema<T>;
  value: T;
  subscribers: Set<(value: T) => void>;
  lastUpdated: number;
  updateCount: number;
}

interface RuleState {
  rule: UnifiedRule;
  lastResult: RuleResult | null;
  /** Tags this rule has emitted — used for auto-retraction on skip/noop */
  emittedTags: Set<string>;
}

// ── Timeline Entry (Chronos-compatible) ─────────────────────────────────────

interface TimelineEntry {
  id: string;
  timestamp: number;
  path: string;
  kind: 'mutation' | 'rule-eval' | 'constraint-check' | 'liveness';
  data: Record<string, unknown>;
}

// ── Praxis App Instance ─────────────────────────────────────────────────────

export interface PraxisApp {
  /** Reactive query — returns a Svelte-compatible store */
  query: <T>(path: string, opts?: QueryOptions<T>) => ReactiveRef<T>;
  /** Write to the graph — validates through constraints first */
  mutate: (path: string, value: unknown) => MutationResult;
  /** Batch multiple mutations atomically */
  batch: (fn: (mutate: (path: string, value: unknown) => void) => void) => MutationResult;
  /** Current facts */
  facts: () => PraxisFact[];
  /** Current constraint violations */
  violations: () => PraxisDiagnostics[];
  /** Timeline (Chronos entries) */
  timeline: () => TimelineEntry[];
  /** Force re-evaluate all rules */
  evaluate: () => void;
  /** Cleanup */
  destroy: () => void;
  /** Liveness status — which paths are stale */
  liveness: () => Record<string, { stale: boolean; lastUpdated: number; elapsed: number }>;
}

// ── Implementation ──────────────────────────────────────────────────────────

let _idCounter = 0;
function nextId(): string {
  return `px:${Date.now()}-${++_idCounter}`;
}

/**
 * Create a Praxis application.
 *
 * This is the single entry point. It creates the reactive graph,
 * wires rules and constraints, starts Chronos logging, and returns
 * query() and mutate() — the only two functions a developer needs.
 *
 * @example
 * ```ts
 * import { createApp, definePath, defineRule } from '@plures/praxis';
 *
 * const Sprint = definePath<SprintInfo | null>('sprint/current', null);
 * const Loading = definePath<boolean>('sprint/loading', false);
 *
 * const app = createApp({
 *   name: 'sprint-log',
 *   schema: [Sprint, Loading],
 *   rules: [sprintBehindRule, capacityRule],
 *   constraints: [noCloseWithoutHoursConstraint],
 * });
 *
 * // In a Svelte component:
 * const sprint = app.query<SprintInfo | null>('sprint/current');
 * // $sprint is reactive — updates automatically
 *
 * // To write:
 * app.mutate('sprint/current', sprintData);
 * // Constraints validated, rules re-evaluated, Chronos logged — all automatic
 * ```
 */
export function createApp(config: PraxisAppConfig): PraxisApp {
  // ── Path Registry ──
  const paths = new Map<string, PathState>();
  for (const schema of config.schema) {
    paths.set(schema.path, {
      schema,
      value: schema.initial,
      subscribers: new Set(),
      lastUpdated: 0,
      updateCount: 0,
    });
  }

  // ── Facts ──
  let facts: PraxisFact[] = [];
  const factMap = new Map<string, PraxisFact>(); // tag → latest fact (LWW)

  // ── Timeline ──
  const timeline: TimelineEntry[] = [];
  const maxTimeline = 10000;

  function recordTimeline(path: string, kind: TimelineEntry['kind'], data: Record<string, unknown>) {
    const entry: TimelineEntry = {
      id: nextId(),
      timestamp: Date.now(),
      path,
      kind,
      data,
    };
    timeline.push(entry);
    if (timeline.length > maxTimeline) {
      timeline.splice(0, timeline.length - maxTimeline);
    }
  }

  // ── Rules ──
  const ruleStates: RuleState[] = (config.rules ?? []).map(rule => ({
    rule,
    lastResult: null,
    emittedTags: new Set<string>(),
  }));

  // ── Constraints ──
  const constraints: UnifiedConstraint[] = config.constraints ?? [];

  // ── Liveness ──
  const livenessConfig = config.liveness;
  const initTime = Date.now();
  let livenessTimer: ReturnType<typeof setTimeout> | null = null;

  if (livenessConfig) {
    const timeout = livenessConfig.timeoutMs ?? 5000;
    livenessTimer = setTimeout(() => {
      for (const expectedPath of livenessConfig.expect) {
        const state = paths.get(expectedPath);
        if (!state || state.updateCount === 0) {
          const elapsed = Date.now() - initTime;
          recordTimeline(expectedPath, 'liveness', {
            stale: true,
            elapsed,
            message: `Path "${expectedPath}" never updated after ${elapsed}ms`,
          });
          livenessConfig.onStale?.(expectedPath, elapsed);
        }
      }
    }, timeout);
  }

  // ── Helpers ──

  function getPathValues(watchPaths: string[]): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const p of watchPaths) {
      const state = paths.get(p);
      values[p] = state ? state.value : undefined;
    }
    return values;
  }

  function notify(path: string, value: unknown) {
    const state = paths.get(path);
    if (!state) return;
    for (const cb of state.subscribers) {
      try {
        cb(value as any);
      } catch (err) {
        console.error(`[praxis] Subscriber error for "${path}":`, err);
      }
    }
  }

  function checkConstraints(path: string, value: unknown): PraxisDiagnostics[] {
    const violations: PraxisDiagnostics[] = [];
    for (const c of constraints) {
      if (!c.watch.includes(path)) continue;
      // Build values with the proposed new value
      const values = getPathValues(c.watch);
      values[path] = value;
      try {
        const result = c.validate(values);
        if (result !== true) {
          violations.push({
            kind: 'constraint-violation',
            message: result,
            data: { constraintId: c.id, path, description: c.description },
          });
          recordTimeline(path, 'constraint-check', {
            constraintId: c.id,
            violated: true,
            message: result,
          });
        }
      } catch (err) {
        violations.push({
          kind: 'constraint-violation',
          message: `Constraint "${c.id}" threw: ${err instanceof Error ? err.message : String(err)}`,
          data: { constraintId: c.id, error: err },
        });
      }
    }
    return violations;
  }

  function evaluateRules() {
    const newFacts: PraxisFact[] = [];
    const retractions: string[] = [];

    for (const rs of ruleStates) {
      const values = getPathValues(rs.rule.watch);
      try {
        const result = rs.rule.evaluate(values, [...facts]);
        rs.lastResult = result;

        recordTimeline(rs.rule.watch[0] ?? '*', 'rule-eval', {
          ruleId: rs.rule.id,
          kind: result.kind,
          reason: result.reason,
        });

        switch (result.kind) {
          case 'emit':
            newFacts.push(...result.facts);
            // Track which tags this rule has emitted
            for (const f of result.facts) {
              rs.emittedTags.add(f.tag);
            }
            break;
          case 'retract':
            retractions.push(...result.retractTags);
            // Also clear tracked tags that are being retracted
            for (const tag of result.retractTags) {
              rs.emittedTags.delete(tag);
            }
            break;
          case 'noop':
          case 'skip':
            // Auto-retract: if a rule previously emitted facts and now
            // skips/noops, those facts should be cleaned up. Otherwise
            // stale facts persist when preconditions become unmet.
            if (rs.emittedTags.size > 0) {
              retractions.push(...rs.emittedTags);
              rs.emittedTags.clear();
            }
            break;
        }
      } catch (err) {
        console.error(`[praxis] Rule "${rs.rule.id}" error:`, err);
      }
    }

    // Apply retractions
    if (retractions.length > 0) {
      const retractSet = new Set(retractions);
      for (const tag of retractSet) {
        factMap.delete(tag);
      }
    }

    // Merge new facts (LWW)
    for (const f of newFacts) {
      factMap.set(f.tag, f);
    }

    facts = Array.from(factMap.values());
  }

  // ── Public API ──

  function query<T>(path: string, opts?: QueryOptions<T>): ReactiveRef<T> {
    // Ensure path exists
    let state = paths.get(path);
    if (!state) {
      // Auto-create with undefined initial — allows querying unschema'd paths
      state = {
        schema: { path, initial: undefined as T },
        value: undefined as T,
        subscribers: new Set(),
        lastUpdated: 0,
        updateCount: 0,
      };
      paths.set(path, state);
    }

    // Create a subscribable that filters/maps if opts provided
    const ref: ReactiveRef<T> = {
      get current() {
        const s = paths.get(path);
        return applyQueryOpts((s?.value ?? state!.schema.initial) as T, opts);
      },

      subscribe(cb: (value: T) => void): () => void {
        // Wrap callback to apply query opts
        const wrappedCb = (rawValue: unknown) => {
          const processed = applyQueryOpts(rawValue as T, opts);
          cb(processed);
        };
        const s = paths.get(path)!;
        s.subscribers.add(wrappedCb as any);

        // Immediate callback with current value (Svelte store contract)
        try {
          cb(ref.current);
        } catch (err) {
          console.error(`[praxis] query("${path}") subscriber init error:`, err);
        }

        return () => {
          s.subscribers.delete(wrappedCb as any);
        };
      },
    };

    return ref;
  }

  function applyQueryOpts<T>(value: T, opts?: QueryOptions<T>): T {
    if (!opts || !Array.isArray(value)) return value;
    let result: any[] = [...(value as any[])];
    if (opts.where) result = result.filter(opts.where as any);
    if (opts.sort) result.sort(opts.sort);
    if (opts.select) result = result.map(opts.select as any);
    if (opts.limit) result = result.slice(0, opts.limit);
    return result as unknown as T;
  }

  function mutateInternal(path: string, value: unknown): { violations: PraxisDiagnostics[]; emittedFacts: PraxisFact[] } {
    // 1. Check constraints
    const violations = checkConstraints(path, value);
    if (violations.length > 0) {
      return { violations, emittedFacts: [] };
    }

    // 2. Write to graph
    const state = paths.get(path);
    if (!state) {
      // Auto-create path
      paths.set(path, {
        schema: { path, initial: value },
        value,
        subscribers: new Set(),
        lastUpdated: Date.now(),
        updateCount: 1,
      });
    } else {
      const before = state.value;
      state.value = value;
      state.lastUpdated = Date.now();
      state.updateCount++;

      // 3. Log to timeline
      recordTimeline(path, 'mutation', {
        before: summarize(before),
        after: summarize(value),
      });
    }

    // 4. Notify subscribers
    notify(path, value);

    // 5. Re-evaluate rules
    const factsBefore = facts.length;
    evaluateRules();
    const emittedFacts = facts.slice(factsBefore);

    return { violations: [], emittedFacts };
  }

  function mutate(path: string, value: unknown): MutationResult {
    const { violations, emittedFacts } = mutateInternal(path, value);
    return {
      accepted: violations.length === 0,
      violations,
      facts: emittedFacts,
    };
  }

  function batchMutate(fn: (m: (path: string, value: unknown) => void) => void): MutationResult {
    const allViolations: PraxisDiagnostics[] = [];
    const pendingWrites: Array<{ path: string; value: unknown }> = [];

    // Collect all mutations
    fn((path, value) => {
      // Check constraints eagerly
      const violations = checkConstraints(path, value);
      if (violations.length > 0) {
        allViolations.push(...violations);
      } else {
        pendingWrites.push({ path, value });
      }
    });

    // If any constraint failed, reject the whole batch
    if (allViolations.length > 0) {
      return { accepted: false, violations: allViolations, facts: [] };
    }

    // Apply all writes
    for (const { path, value } of pendingWrites) {
      const state = paths.get(path);
      if (state) {
        const before = state.value;
        state.value = value;
        state.lastUpdated = Date.now();
        state.updateCount++;
        recordTimeline(path, 'mutation', {
          before: summarize(before),
          after: summarize(value),
        });
      } else {
        paths.set(path, {
          schema: { path, initial: value },
          value,
          subscribers: new Set(),
          lastUpdated: Date.now(),
          updateCount: 1,
        });
      }
    }

    // Notify all at once
    for (const { path, value } of pendingWrites) {
      notify(path, value);
    }

    // Single rule evaluation pass
    const factsBefore = facts.length;
    evaluateRules();

    return {
      accepted: true,
      violations: [],
      facts: facts.slice(factsBefore),
    };
  }

  function getLiveness(): Record<string, { stale: boolean; lastUpdated: number; elapsed: number }> {
    const result: Record<string, { stale: boolean; lastUpdated: number; elapsed: number }> = {};
    const now = Date.now();
    const watchPaths = livenessConfig?.expect ?? [];
    for (const p of watchPaths) {
      const state = paths.get(p);
      const lastUpdated = state?.lastUpdated ?? 0;
      const elapsed = lastUpdated > 0 ? now - lastUpdated : now - initTime;
      result[p] = {
        stale: !state || state.updateCount === 0,
        lastUpdated,
        elapsed,
      };
    }
    return result;
  }

  function destroy() {
    if (livenessTimer) clearTimeout(livenessTimer);
    for (const state of paths.values()) {
      state.subscribers.clear();
    }
    paths.clear();
    facts = [];
    factMap.clear();
    timeline.length = 0;
  }

  return {
    query,
    mutate,
    batch: batchMutate,
    facts: () => [...facts],
    violations: () => {
      const allViolations: PraxisDiagnostics[] = [];
      for (const c of constraints) {
        const values = getPathValues(c.watch);
        try {
          const result = c.validate(values);
          if (result !== true) {
            allViolations.push({
              kind: 'constraint-violation',
              message: result,
              data: { constraintId: c.id },
            });
          }
        } catch { /* skip */ }
      }
      return allViolations;
    },
    timeline: () => [...timeline],
    evaluate: evaluateRules,
    destroy,
    liveness: getLiveness,
  };
}

/** Summarize a value for timeline logging (avoid huge payloads) */
function summarize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return `[Array(${value.length})]`;
  const keys = Object.keys(value as object);
  if (keys.length > 10) return `{Object(${keys.length} keys)}`;
  return value;
}
