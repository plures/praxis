/**
 * Praxis Logic Engine
 *
 * The logic engine manages state, processes events through rules,
 * checks constraints, and provides a strongly-typed API for application logic.
 */

import type {
  PraxisEvent,
  PraxisFact,
  PraxisState,
  PraxisStepConfig,
  PraxisStepResult,
  PraxisDiagnostics,
} from './protocol.js';
import { PRAXIS_PROTOCOL_VERSION } from './protocol.js';
import { PraxisRegistry } from './rules.js';
import { RuleResult } from './rule-result.js';

/**
 * Options for creating a Praxis engine
 */
export interface PraxisEngineOptions<TContext = unknown> {
  /** Initial context */
  initialContext: TContext;
  /** Registry of rules and constraints */
  registry: PraxisRegistry<TContext>;
  /** Initial facts (optional) */
  initialFacts?: PraxisFact[];
  /** Initial metadata (optional) */
  initialMeta?: Record<string, unknown>;
  /**
   * Fact deduplication strategy (default: 'last-write-wins').
   *
   * - 'none': facts accumulate without dedup (original behavior)
   * - 'last-write-wins': only keep the latest fact per tag (most common)
   * - 'append': keep all facts but cap at maxFacts
   */
  factDedup?: 'none' | 'last-write-wins' | 'append';
  /**
   * Maximum number of facts to retain (default: 1000).
   * When exceeded, oldest facts are evicted (FIFO).
   * Set to 0 for unlimited (not recommended).
   */
  maxFacts?: number;
}

/**
 * Clone helper that avoids structuredClone failures on non-cloneable values
 * (e.g., functions, timers). Falls back to a shallow copy when necessary.
 */
function safeClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Prefer structuredClone for deep, data-safe copies when available
  // (handles Map, Set, Date, etc.). Guard for environments that lack it.
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(value);
    } catch {
      // fall through to safer copies
    }
  }

  if (Array.isArray(value)) {
    return [...(value as unknown as unknown[])] as unknown as T;
  }

  // Shallow copy as a safe fallback for objects containing functions or
  // other non-structured-clone-able members.
  return { ...(value as Record<string, unknown>) } as unknown as T;
}

/**
 * The Praxis Logic Engine
 *
 * Manages application logic through facts, events, rules, and constraints.
 * The engine is strongly typed and functional - all state updates are immutable.
 */
export class LogicEngine<TContext = unknown> {
  private state: PraxisState & { context: TContext };
  private readonly registry: PraxisRegistry<TContext>;
  private readonly factDedup: 'none' | 'last-write-wins' | 'append';
  private readonly maxFacts: number;

  constructor(options: PraxisEngineOptions<TContext>) {
    this.registry = options.registry;
    this.factDedup = options.factDedup ?? 'last-write-wins';
    this.maxFacts = options.maxFacts ?? 1000;
    this.state = {
      context: options.initialContext,
      facts: options.initialFacts ?? [],
      meta: options.initialMeta ?? {},
      protocolVersion: PRAXIS_PROTOCOL_VERSION,
    };
  }

  /**
   * Get the current state (immutable copy)
   */
  getState(): Readonly<PraxisState & { context: TContext }> {
    return {
      context: safeClone(this.state.context),
      facts: [...this.state.facts],
      meta: this.state.meta ? safeClone(this.state.meta) : undefined,
      protocolVersion: this.state.protocolVersion,
    };
  }

  /**
   * Get the current context
   */
  getContext(): TContext {
    return safeClone(this.state.context);
  }

  /**
   * Get current facts
   */
  getFacts(): PraxisFact[] {
    return [...this.state.facts];
  }

  /**
   * Process events through the engine.
   * Applies all registered rules and checks all registered constraints.
   *
   * @param events Events to process
   * @returns Result with new state and diagnostics
   */
  step(events: PraxisEvent[]): PraxisStepResult {
    const config: PraxisStepConfig = {
      ruleIds: this.registry.getRuleIds(),
      constraintIds: this.registry.getConstraintIds(),
    };
    return this.stepWithConfig(events, config);
  }

  /**
   * Process events with specific rule and constraint configuration.
   *
   * @param events Events to process
   * @param config Step configuration
   * @returns Result with new state and diagnostics
   */
  stepWithConfig(events: PraxisEvent[], config: PraxisStepConfig): PraxisStepResult {
    const diagnostics: PraxisDiagnostics[] = [];
    let newState = { ...this.state };

    // ── Inject events into state so rules can access them via state.events ──
    const stateWithEvents = {
      ...newState,
      events, // current batch — rules can read state.events
    };

    // Apply rules
    const newFacts: PraxisFact[] = [];
    const retractions: string[] = [];
    const eventTags = new Set(events.map(e => e.tag));
    for (const ruleId of config.ruleIds) {
      const rule = this.registry.getRule(ruleId);
      if (!rule) {
        diagnostics.push({
          kind: 'rule-error',
          message: `Rule "${ruleId}" not found in registry`,
          data: { ruleId },
        });
        continue;
      }

      // Event type filtering: if rule declares eventTypes, skip unless
      // at least one event in the batch matches.
      if (rule.eventTypes) {
        const filterTags = Array.isArray(rule.eventTypes) ? rule.eventTypes : [rule.eventTypes];
        if (!filterTags.some(t => eventTags.has(t))) {
          continue; // No matching events — skip this rule
        }
      }

      try {
        const rawResult = rule.impl(stateWithEvents, events);

        // Support both legacy PraxisFact[] return and new RuleResult return
        if (rawResult instanceof RuleResult) {
          rawResult.ruleId = ruleId;

          switch (rawResult.kind) {
            case 'emit':
              newFacts.push(...rawResult.facts);
              break;
            case 'retract':
              retractions.push(...rawResult.retractTags);
              break;
            case 'noop':
            case 'skip':
              // Traceable no-ops — store in diagnostics for introspection
              if (rawResult.reason) {
                diagnostics.push({
                  kind: 'rule-error', // reused kind — could add 'rule-trace' in protocol v2
                  message: `[${rawResult.kind}] ${ruleId}: ${rawResult.reason}`,
                  data: { ruleId, resultKind: rawResult.kind, reason: rawResult.reason },
                });
              }
              break;
          }
        } else if (Array.isArray(rawResult)) {
          // Legacy: PraxisFact[] — backward compatible
          newFacts.push(...rawResult);
        }
      } catch (error) {
        diagnostics.push({
          kind: 'rule-error',
          message: `Error executing rule "${ruleId}": ${error instanceof Error ? error.message : String(error)}`,
          data: { ruleId, error },
        });
      }
    }

    // ── Apply retractions ──
    let existingFacts = newState.facts;
    if (retractions.length > 0) {
      const retractSet = new Set(retractions);
      existingFacts = existingFacts.filter(f => !retractSet.has(f.tag));
    }

    // Merge new facts with deduplication
    let mergedFacts: PraxisFact[];
    switch (this.factDedup) {
      case 'last-write-wins': {
        // Build a map keyed by tag — new facts overwrite old ones with same tag
        const factMap = new Map<string, PraxisFact>();
        for (const f of existingFacts) factMap.set(f.tag, f);
        for (const f of newFacts) factMap.set(f.tag, f);
        mergedFacts = Array.from(factMap.values());
        break;
      }
      case 'append':
        mergedFacts = [...existingFacts, ...newFacts];
        break;
      case 'none':
      default:
        mergedFacts = [...existingFacts, ...newFacts];
        break;
    }

    // Enforce maxFacts limit (evict oldest first)
    if (this.maxFacts > 0 && mergedFacts.length > this.maxFacts) {
      mergedFacts = mergedFacts.slice(mergedFacts.length - this.maxFacts);
    }

    // Add new facts to state
    newState = {
      ...newState,
      facts: mergedFacts,
    };

    // Check constraints
    for (const constraintId of config.constraintIds) {
      const constraint = this.registry.getConstraint(constraintId);
      if (!constraint) {
        diagnostics.push({
          kind: 'constraint-violation',
          message: `Constraint "${constraintId}" not found in registry`,
          data: { constraintId },
        });
        continue;
      }

      try {
        const result = constraint.impl(newState);
        if (result === false) {
          diagnostics.push({
            kind: 'constraint-violation',
            message: `Constraint "${constraintId}" violated`,
            data: { constraintId, description: constraint.description },
          });
        } else if (typeof result === 'string') {
          diagnostics.push({
            kind: 'constraint-violation',
            message: result,
            data: { constraintId, description: constraint.description },
          });
        }
      } catch (error) {
        diagnostics.push({
          kind: 'constraint-violation',
          message: `Error checking constraint "${constraintId}": ${error instanceof Error ? error.message : String(error)}`,
          data: { constraintId, error },
        });
      }
    }

    // Update internal state
    this.state = newState;

    return {
      state: newState,
      diagnostics,
    };
  }

  /**
   * Update the context directly (for exceptional cases).
   * Generally, context should be updated through rules.
   *
   * @param updater Function that produces new context from old context
   */
  updateContext(updater: (context: TContext) => TContext): void {
    this.state = {
      ...this.state,
      context: updater(this.state.context),
    };
  }

  /**
   * Atomically update context AND process events in a single call.
   *
   * This avoids the fragile pattern of calling updateContext() then step()
   * separately, where rules could see stale context if the ordering is wrong.
   *
   * @param updater Function that produces new context from old context
   * @param events Events to process after context is updated
   * @returns Result with new state and diagnostics
   *
   * @example
   * engine.stepWithContext(
   *   ctx => ({ ...ctx, sprintName: sprint.name, items: sprint.items }),
   *   [{ tag: 'sprint.update', payload: { name: sprint.name } }]
   * );
   */
  stepWithContext(
    updater: (context: TContext) => TContext,
    events: PraxisEvent[]
  ): PraxisStepResult {
    // Update context first — rules see fresh data
    this.state = {
      ...this.state,
      context: updater(this.state.context),
    };
    // Then step with the now-current context
    return this.step(events);
  }

  /**
   * Add facts directly (for exceptional cases).
   * Generally, facts should be added through rules.
   *
   * @param facts Facts to add
   */
  addFacts(facts: PraxisFact[]): void {
    this.state = {
      ...this.state,
      facts: [...this.state.facts, ...facts],
    };
  }

  /**
   * Check all constraints without processing any events.
   *
   * Useful for validation-only scenarios (e.g., form validation,
   * pre-save checks) where you want constraint diagnostics without
   * triggering any rules.
   *
   * @returns Array of constraint violation diagnostics (empty = all passing)
   */
  checkConstraints(): PraxisDiagnostics[] {
    return this.stepWithConfig([], {
      ruleIds: [],
      constraintIds: this.registry.getConstraintIds(),
    }).diagnostics;
  }

  /**
   * Clear all facts
   */
  clearFacts(): void {
    this.state = {
      ...this.state,
      facts: [],
    };
  }

  /**
   * Reset the engine to initial state
   */
  reset(options: PraxisEngineOptions<TContext>): void {
    this.state = {
      context: options.initialContext,
      facts: options.initialFacts ?? [],
      meta: options.initialMeta ?? {},
      protocolVersion: PRAXIS_PROTOCOL_VERSION,
    };
  }
}

/**
 * Create a new Praxis logic engine.
 *
 * @param options Engine options
 * @returns New LogicEngine instance
 */
export function createPraxisEngine<TContext = unknown>(
  options: PraxisEngineOptions<TContext>
): LogicEngine<TContext> {
  return new LogicEngine(options);
}
