/**
 * PraxisDB Store
 *
 * Connects Praxis Facts, Events, Rules, and Constraints to PluresDB.
 * Provides CRDT-backed storage for facts and append-only event streams.
 */

// Declare process for TypeScript in non-Node environments (e.g., Deno)
declare const process: { env: { [key: string]: string | undefined } } | undefined;

import type { PraxisDB, UnsubscribeFn } from './adapter.js';
import type { PraxisRegistry } from '../rules.js';
import type { PraxisFact, PraxisEvent, PraxisState } from '../protocol.js';
import type { Chronicle } from '../chronicle/chronicle.js';
import { ChronicleContext } from '../chronicle/context.js';

/**
 * Key paths for Praxis data in PluresDB
 */
export const PRAXIS_PATHS = {
  /** Base path for all Praxis data */
  BASE: '/_praxis',
  /** Path for facts storage */
  FACTS: '/_praxis/facts',
  /** Path for events storage */
  EVENTS: '/_praxis/events',
  /** Path for schema registry */
  SCHEMAS: '/_praxis/schemas',
} as const;

/**
 * Generate a fact key path
 * @param factTag The fact type tag
 * @param id Optional unique identifier for the fact instance
 */
export function getFactPath(factTag: string, id?: string): string {
  if (id) {
    return `${PRAXIS_PATHS.FACTS}/${factTag}/${id}`;
  }
  return `${PRAXIS_PATHS.FACTS}/${factTag}`;
}

/**
 * Generate an event stream key path
 * @param eventTag The event type tag
 */
export function getEventPath(eventTag: string): string {
  return `${PRAXIS_PATHS.EVENTS}/${eventTag}`;
}

/**
 * Generate a unique ID for facts or events
 * Uses timestamp and random string for uniqueness
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Event stream entry with timestamp
 */
export interface EventStreamEntry {
  /** The event data */
  event: PraxisEvent;
  /** Timestamp when the event was appended */
  timestamp: number;
  /** Optional sequence number */
  sequence?: number;
}

/**
 * Options for creating a PraxisDBStore
 */
export interface PraxisDBStoreOptions<TContext = unknown> {
  /** The PraxisDB instance to use */
  db: PraxisDB;
  /** The PraxisRegistry for rules and constraints */
  registry: PraxisRegistry<TContext>;
  /** Initial context for rule evaluation */
  initialContext?: TContext;
}

/**
 * PraxisDBStore
 *
 * Manages persistence and reactive updates for Praxis state in PluresDB.
 *
 * - Facts are stored as CRDT-backed documents under `/_praxis/facts/<factTag>/<id>`
 * - Events are stored as append-only streams under `/_praxis/events/<eventTag>`
 * - Rules are triggered automatically when watched keys change
 * - Constraints are run before writing mutated state
 */
/**
 * Error handler callback for rule execution errors
 */
export type RuleErrorHandler = (ruleId: string, error: unknown) => void;

/**
 * Default error handler that logs to console
 */
const defaultErrorHandler: RuleErrorHandler = (ruleId, error) => {
  // Default behavior: silent in production, can be overridden
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.error(`Error executing rule "${ruleId}":`, error);
  }
};

export class PraxisDBStore<TContext = unknown> {
  private db: PraxisDB;
  private registry: PraxisRegistry<TContext>;
  private context: TContext;
  private subscriptions: UnsubscribeFn[] = [];
  private factWatchers = new Map<string, Set<(facts: PraxisFact[]) => void>>();
  private onRuleError: RuleErrorHandler;
  private chronicle?: Chronicle;

  constructor(options: PraxisDBStoreOptions<TContext> & { onRuleError?: RuleErrorHandler }) {
    this.db = options.db;
    this.registry = options.registry;
    this.context = options.initialContext ?? ({} as TContext);
    this.onRuleError = options.onRuleError ?? defaultErrorHandler;
  }

  /**
   * Attach a Chronicle observer to this store.
   *
   * Every subsequent `storeFact` and `appendEvent` call will be recorded as a
   * causal graph node in PluresDB, enabling full observability for free.
   *
   * @param chronicle Chronicle implementation to attach
   * @returns `this` for fluent chaining
   *
   * @example
   * ```typescript
   * const store = createPraxisDBStore(db, registry)
   *   .withChronicle(createChronicle(db));
   * ```
   */
  withChronicle(chronicle: Chronicle): this {
    this.chronicle = chronicle;
    return this;
  }

  /**
   * Store a fact in PluresDB
   *
   * Facts are stored under `/_praxis/facts/<factTag>/<id>`
   * If no id is provided in the payload, a timestamp-based id is used.
   *
   * @param fact The fact to store
   * @returns Promise that resolves when the fact is stored
   */
  async storeFact(fact: PraxisFact): Promise<void> {
    // Run constraints before storing
    const constraintResult = await this.checkConstraints([fact]);
    if (!constraintResult.valid) {
      throw new Error(`Constraint violation: ${constraintResult.errors.join(', ')}`);
    }

    // Capture before state for Chronicle (best-effort; ignore errors)
    let before: unknown;
    if (this.chronicle) {
      const payload = fact.payload as Record<string, unknown> | undefined;
      const id = payload?.id as string | undefined;
      if (id) {
        before = await this.getFact(fact.tag, id);
      }
    }

    await this.persistFact(fact);

    // Record state transition in Chronicle
    if (this.chronicle) {
      const payload = fact.payload as Record<string, unknown> | undefined;
      const id = (payload?.id as string | undefined) ?? '';
      const span = ChronicleContext.current;
      try {
        await this.chronicle.record({
          path: getFactPath(fact.tag, id),
          before,
          after: fact,
          cause: span?.spanId,
          context: span?.contextId,
          metadata: { factTag: fact.tag, operation: 'storeFact' },
        });
      } catch {
        // Chronicle errors must never fail the primary operation
      }
    }

    // Trigger rule evaluation - facts stored directly may trigger derived computations
    await this.triggerRules([fact]);
  }

  /**
   * Store multiple facts in PluresDB
   *
   * @param facts The facts to store
   */
  async storeFacts(facts: PraxisFact[]): Promise<void> {
    // Run constraints before storing
    const constraintResult = await this.checkConstraints(facts);
    if (!constraintResult.valid) {
      throw new Error(`Constraint violation: ${constraintResult.errors.join(', ')}`);
    }

    for (const fact of facts) {
      // Capture before state for Chronicle (best-effort)
      let before: unknown;
      if (this.chronicle) {
        const payload = fact.payload as Record<string, unknown> | undefined;
        const id = payload?.id as string | undefined;
        if (id) {
          before = await this.getFact(fact.tag, id);
        }
      }

      await this.persistFact(fact);

      // Record state transition in Chronicle
      if (this.chronicle) {
        const payload = fact.payload as Record<string, unknown> | undefined;
        const id = (payload?.id as string | undefined) ?? '';
        const span = ChronicleContext.current;
        try {
          await this.chronicle.record({
            path: getFactPath(fact.tag, id),
            before,
            after: fact,
            cause: span?.spanId,
            context: span?.contextId,
            metadata: { factTag: fact.tag, operation: 'storeFacts' },
          });
        } catch {
          // Chronicle errors must never fail the primary operation
        }
      }
    }

    // Trigger rule evaluation
    await this.triggerRules(facts);
  }

  /**
   * Internal method to persist a fact without constraint checking
   * Used by both storeFact and derived fact storage
   */
  private async persistFact(fact: PraxisFact): Promise<void> {
    const payload = fact.payload as Record<string, unknown> | undefined;
    const id = (payload?.id as string) ?? generateId();
    const path = getFactPath(fact.tag, id);
    await this.db.set(path, fact);
  }

  /**
   * Get a fact by tag and id
   *
   * @param factTag The fact type tag
   * @param id The fact id
   * @returns The fact or undefined if not found
   */
  async getFact(factTag: string, id: string): Promise<PraxisFact | undefined> {
    const path = getFactPath(factTag, id);
    return this.db.get<PraxisFact>(path);
  }

  /**
   * Append an event to the event stream
   *
   * Events are stored as append-only streams under `/_praxis/events/<eventTag>`
   *
   * @param event The event to append
   */
  async appendEvent(event: PraxisEvent): Promise<void> {
    const path = getEventPath(event.tag);

    // Get existing events for this tag
    const existingEvents = (await this.db.get<EventStreamEntry[]>(path)) ?? [];

    // Create new entry
    const entry: EventStreamEntry = {
      event,
      timestamp: Date.now(),
      sequence: existingEvents.length,
    };

    // Append and store
    const newEvents = [...existingEvents, entry];
    await this.db.set(path, newEvents);

    // Record event in Chronicle and capture node ID so derived facts can link back to it
    let eventNodeId: string | undefined;
    if (this.chronicle) {
      const span = ChronicleContext.current;
      try {
        const node = await this.chronicle.record({
          path,
          before: existingEvents.length > 0 ? existingEvents[existingEvents.length - 1] : undefined,
          after: entry,
          cause: span?.spanId,
          context: span?.contextId,
          metadata: { eventTag: event.tag, sequence: String(entry.sequence), operation: 'appendEvent' },
        });
        eventNodeId = node.id;
      } catch {
        // Chronicle errors must never fail the primary operation
      }
    }

    // Trigger rules within a causal span attributed to this event node,
    // so any derived facts automatically link back to this event via 'causes' edges.
    const outerSpan = ChronicleContext.current;
    const ruleSpan = eventNodeId
      ? { spanId: eventNodeId, contextId: outerSpan?.contextId }
      : outerSpan;

    if (ruleSpan && this.chronicle) {
      await ChronicleContext.runAsync(ruleSpan, () => this.triggerRulesForEvents([event]));
    } else {
      await this.triggerRulesForEvents([event]);
    }
  }

  /**
   * Append multiple events to their respective streams
   *
   * @param events The events to append
   */
  async appendEvents(events: PraxisEvent[]): Promise<void> {
    // Group events by tag for efficient storage
    const eventsByTag = new Map<string, PraxisEvent[]>();
    for (const event of events) {
      const existing = eventsByTag.get(event.tag) ?? [];
      eventsByTag.set(event.tag, [...existing, event]);
    }

    // Append each group and collect the last recorded event node ID for causal linking
    let lastEventNodeId: string | undefined;
    for (const [tag, tagEvents] of eventsByTag) {
      const path = getEventPath(tag);
      const existingEvents = (await this.db.get<EventStreamEntry[]>(path)) ?? [];
      let sequence = existingEvents.length;

      const newEntries = tagEvents.map((event) => ({
        event,
        timestamp: Date.now(),
        sequence: sequence++,
      }));

      await this.db.set(path, [...existingEvents, ...newEntries]);

      // Record each appended event in Chronicle
      if (this.chronicle) {
        const span = ChronicleContext.current;
        for (const entry of newEntries) {
          try {
            const node = await this.chronicle.record({
              path,
              after: entry,
              cause: span?.spanId,
              context: span?.contextId,
              metadata: { eventTag: tag, sequence: String(entry.sequence), operation: 'appendEvents' },
            });
            lastEventNodeId = node.id;
          } catch {
            // Chronicle errors must never fail the primary operation
          }
        }
      }
    }

    // Trigger rules in a causal span attributed to the last event node
    const outerSpan = ChronicleContext.current;
    const ruleSpan = lastEventNodeId
      ? { spanId: lastEventNodeId, contextId: outerSpan?.contextId }
      : outerSpan;

    if (ruleSpan && this.chronicle) {
      await ChronicleContext.runAsync(ruleSpan, () => this.triggerRulesForEvents(events));
    } else {
      await this.triggerRulesForEvents(events);
    }
  }

  /**
   * Get events from a stream
   *
   * @param eventTag The event type tag
   * @param options Query options
   * @returns Array of event stream entries
   */
  async getEvents(
    eventTag: string,
    options?: { since?: number; limit?: number }
  ): Promise<EventStreamEntry[]> {
    const path = getEventPath(eventTag);
    const events = (await this.db.get<EventStreamEntry[]>(path)) ?? [];

    let result = events;

    if (options?.since !== undefined) {
      const sinceTimestamp = options.since;
      result = result.filter((e) => e.timestamp > sinceTimestamp);
    }

    if (options?.limit !== undefined) {
      result = result.slice(-options.limit);
    }

    return result;
  }

  /**
   * Watch a fact path for changes
   *
   * @param factTag The fact type tag to watch
   * @param callback Called when facts of this type change
   * @returns Unsubscribe function
   */
  watchFacts(factTag: string, callback: (facts: PraxisFact[]) => void): UnsubscribeFn {
    const path = getFactPath(factTag);

    // Register the callback
    if (!this.factWatchers.has(factTag)) {
      this.factWatchers.set(factTag, new Set());
    }
    const watchers = this.factWatchers.get(factTag);
    if (watchers) {
      watchers.add(callback);
    }

    // Watch the path in the DB
    const unsubscribe = this.db.watch<PraxisFact>(path, (fact) => {
      callback([fact]);
    });

    this.subscriptions.push(unsubscribe);

    return () => {
      unsubscribe();
      this.factWatchers.get(factTag)?.delete(callback);
    };
  }

  /**
   * Check constraints against the current state with new facts
   */
  private async checkConstraints(
    newFacts: PraxisFact[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const constraints = this.registry.getAllConstraints();
    const errors: string[] = [];

    // Build a minimal state for constraint checking
    const state: PraxisState & { context: TContext } = {
      context: this.context,
      facts: newFacts,
      meta: {},
    };

    for (const constraint of constraints) {
      try {
        const result = constraint.impl(state);
        if (result === false) {
          errors.push(`Constraint "${constraint.id}" violated`);
        } else if (typeof result === 'string') {
          errors.push(result);
        }
      } catch (error) {
        errors.push(
          `Error checking constraint "${constraint.id}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Trigger rules when new facts are added
   *
   * This method is called after facts are stored. It can be extended
   * for derived fact computation where rules generate new facts based
   * on existing facts. Currently implemented as a hook point for future
   * enhancements.
   *
   * @param _newFacts The newly stored facts (unused in current implementation)
   */
  private async triggerRules(_newFacts: PraxisFact[]): Promise<void> {
    // Rules are typically triggered by events, not facts
    // This method serves as a hook for derived fact computation
    // which can be implemented by subclasses or future enhancements
  }

  /**
   * Trigger rules when events are appended
   */
  private async triggerRulesForEvents(events: PraxisEvent[]): Promise<void> {
    const rules = this.registry.getAllRules();

    // Build state for rule evaluation
    const state: PraxisState & { context: TContext } = {
      context: this.context,
      facts: [],
      meta: {},
    };

    // Execute each rule
    const derivedFacts: PraxisFact[] = [];
    for (const rule of rules) {
      try {
        const facts = rule.impl(state, events);
        derivedFacts.push(...facts);
      } catch (error) {
        this.onRuleError(rule.id, error);
      }
    }

    // Store derived facts (without re-triggering rules to avoid infinite loops)
    if (derivedFacts.length > 0) {
      const constraintResult = await this.checkConstraints(derivedFacts);
      if (constraintResult.valid) {
        for (const fact of derivedFacts) {
          await this.persistFact(fact);

          // Record derived fact in Chronicle using the current causal span
          if (this.chronicle) {
            const payload = fact.payload as Record<string, unknown> | undefined;
            const id = (payload?.id as string | undefined) ?? '';
            const span = ChronicleContext.current;
            try {
              await this.chronicle.record({
                path: getFactPath(fact.tag, id),
                after: fact,
                cause: span?.spanId,
                context: span?.contextId,
                metadata: { factTag: fact.tag, operation: 'derivedFact' },
              });
            } catch {
              // Chronicle errors must never fail the primary operation
            }
          }
        }
      }
    }
  }

  /**
   * Update the context
   */
  updateContext(context: TContext): void {
    this.context = context;
  }

  /**
   * Get the current context
   */
  getContext(): TContext {
    return this.context;
  }

  /**
   * Dispose of all subscriptions
   */
  dispose(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions = [];
    this.factWatchers.clear();
  }
}

/**
 * Create a new PraxisDBStore
 *
 * @param db The PraxisDB instance to use
 * @param registry The PraxisRegistry for rules and constraints
 * @param initialContext Optional initial context
 * @param onRuleError Optional error handler for rule execution errors
 * @returns PraxisDBStore instance
 *
 * @example
 * ```typescript
 * const db = createInMemoryDB();
 * const registry = new PraxisRegistry();
 * const store = createPraxisDBStore(db, registry);
 *
 * await store.storeFact({ tag: "UserLoggedIn", payload: { userId: "alice" } });
 * await store.appendEvent({ tag: "LOGIN", payload: { username: "alice" } });
 * ```
 */
export function createPraxisDBStore<TContext = unknown>(
  db: PraxisDB,
  registry: PraxisRegistry<TContext>,
  initialContext?: TContext,
  onRuleError?: RuleErrorHandler
): PraxisDBStore<TContext> {
  return new PraxisDBStore({ db, registry, initialContext, onRuleError });
}
