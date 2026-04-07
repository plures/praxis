/**
 * PraxisDBEngine — PluresDB-backed LogicEngine
 *
 * Wraps @plures/praxis-core's LogicEngine with PluresDB persistence.
 * Every step() call persists facts and events to the CRDT store,
 * making the engine's state durable, syncable, and queryable.
 */

import {
  LogicEngine,
  type PraxisEngineOptions,
} from '@plures/praxis-core';
import type {
  PraxisEvent,
  PraxisFact,
  PraxisStepResult,
  PraxisDiagnostics,
} from '@plures/praxis-core';
import { PluresDBAdapter, type PluresDBAdapterOptions } from './adapter.js';

export interface PraxisDBEngineOptions<TContext = unknown>
  extends PraxisEngineOptions<TContext> {
  /** PluresDB adapter options */
  db: PluresDBAdapterOptions;
  /** Whether to load persisted facts on init (default: true) */
  restoreFacts?: boolean;
  /** Whether to emit Agens events on step (default: true) */
  emitAgensEvents?: boolean;
}

/**
 * A Praxis LogicEngine that automatically persists to PluresDB.
 *
 * ## Usage
 *
 * ```ts
 * import { PluresDatabase } from '@plures/pluresdb';
 * import { PraxisDBEngine } from '@plures/praxis-db';
 *
 * const db = new PluresDatabase('praxis', './data');
 * const engine = new PraxisDBEngine({
 *   initialContext: {},
 *   registry,
 *   db: { db },
 * });
 *
 * await engine.init();
 * const result = engine.step([{ tag: 'deploy', payload: {} }]);
 * // Facts + events automatically persisted to PluresDB
 * ```
 */
export class PraxisDBEngine<TContext = unknown> {
  private engine: LogicEngine<TContext>;
  private adapter: PluresDBAdapter;
  private emitAgensEvents: boolean;
  private restoreFacts: boolean;
  private initialized = false;

  constructor(options: PraxisDBEngineOptions<TContext>) {
    this.engine = new LogicEngine(options);
    this.adapter = new PluresDBAdapter(options.db);
    this.emitAgensEvents = options.emitAgensEvents ?? true;
    this.restoreFacts = options.restoreFacts ?? true;
  }

  /**
   * Initialize the engine — restore persisted facts from PluresDB.
   * Must be called before step().
   */
  async init(): Promise<void> {
    if (this.restoreFacts) {
      // Restore facts from PluresDB state
      const storedState = this.adapter.stateGet('praxis:engine:facts');
      if (storedState && Array.isArray(storedState)) {
        this.engine.addFacts(storedState as PraxisFact[]);
      }
    }
    this.initialized = true;
  }

  /**
   * Process events through the engine with automatic persistence.
   */
  step(events: PraxisEvent[]): PraxisStepResult {
    const result = this.engine.step(events);

    // Persist facts to PluresDB
    this.persistState(result);

    // Persist events (best-effort, non-blocking)
    for (const event of events) {
      try {
        this.adapter.appendEvent(event.tag, event.payload);
      } catch {
        // Event persistence is best-effort; do not surface errors to callers
      }
    }

    return result;
  }

  /**
   * Process events with context update and automatic persistence.
   */
  stepWithContext(
    updater: (context: TContext) => TContext,
    events: PraxisEvent[],
  ): PraxisStepResult {
    const result = this.engine.stepWithContext(updater, events);
    this.persistState(result);

    for (const event of events) {
      try {
        this.adapter.appendEvent(event.tag, event.payload);
      } catch {
        // Event persistence is best-effort; do not surface errors to callers
      }
    }

    return result;
  }

  /**
   * Check all constraints without processing events.
   */
  checkConstraints(): PraxisDiagnostics[] {
    return this.engine.checkConstraints();
  }

  /**
   * Get the current state (delegates to core engine).
   */
  getState() {
    return this.engine.getState();
  }

  /**
   * Get the current context.
   */
  getContext(): TContext {
    return this.engine.getContext();
  }

  /**
   * Get current facts.
   */
  getFacts(): PraxisFact[] {
    return this.engine.getFacts();
  }

  /**
   * Get the PluresDB adapter for direct access.
   */
  get db(): PluresDBAdapter {
    return this.adapter;
  }

  // -- Internal --

  private persistState(result: PraxisStepResult): void {
    // Persist current facts to Agens state table
    this.adapter.stateSet('praxis:engine:facts', result.state.facts);

    // Emit step result as Agens event for reactive consumers
    if (this.emitAgensEvents && result.diagnostics.length > 0) {
      const stepId = `step-${Date.now()}`;
      this.adapter.emitPraxisEvent({
        event_type: 'praxis_analysis_ready',
        id: `praxis-ready:${stepId}`,
        analysis_id: stepId,
        payload: {
          factsCount: result.state.facts.length,
          diagnostics: result.diagnostics,
        },
      });
    }
  }
}
