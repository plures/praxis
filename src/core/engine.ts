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
} from "./protocol.js";
import { PraxisRegistry } from "./rules.js";

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

  constructor(options: PraxisEngineOptions<TContext>) {
    this.registry = options.registry;
    this.state = {
      context: options.initialContext,
      facts: options.initialFacts ?? [],
      meta: options.initialMeta ?? {},
    };
  }

  /**
   * Get the current state (immutable copy)
   */
  getState(): Readonly<PraxisState & { context: TContext }> {
    return {
      context: structuredClone(this.state.context),
      facts: [...this.state.facts],
      meta: this.state.meta ? { ...this.state.meta } : undefined,
    };
  }

  /**
   * Get the current context
   */
  getContext(): TContext {
    return structuredClone(this.state.context);
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
  stepWithConfig(
    events: PraxisEvent[],
    config: PraxisStepConfig
  ): PraxisStepResult {
    const diagnostics: PraxisDiagnostics[] = [];
    let newState = { ...this.state };

    // Apply rules
    const newFacts: PraxisFact[] = [];
    for (const ruleId of config.ruleIds) {
      const rule = this.registry.getRule(ruleId);
      if (!rule) {
        diagnostics.push({
          kind: "rule-error",
          message: `Rule "${ruleId}" not found in registry`,
          data: { ruleId },
        });
        continue;
      }

      try {
        const ruleFacts = rule.impl(newState, events);
        newFacts.push(...ruleFacts);
      } catch (error) {
        diagnostics.push({
          kind: "rule-error",
          message: `Error executing rule "${ruleId}": ${error instanceof Error ? error.message : String(error)}`,
          data: { ruleId, error },
        });
      }
    }

    // Add new facts to state
    newState = {
      ...newState,
      facts: [...newState.facts, ...newFacts],
    };

    // Check constraints
    for (const constraintId of config.constraintIds) {
      const constraint = this.registry.getConstraint(constraintId);
      if (!constraint) {
        diagnostics.push({
          kind: "constraint-violation",
          message: `Constraint "${constraintId}" not found in registry`,
          data: { constraintId },
        });
        continue;
      }

      try {
        const result = constraint.impl(newState);
        if (result === false) {
          diagnostics.push({
            kind: "constraint-violation",
            message: `Constraint "${constraintId}" violated`,
            data: { constraintId, description: constraint.description },
          });
        } else if (typeof result === "string") {
          diagnostics.push({
            kind: "constraint-violation",
            message: result,
            data: { constraintId, description: constraint.description },
          });
        }
      } catch (error) {
        diagnostics.push({
          kind: "constraint-violation",
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
