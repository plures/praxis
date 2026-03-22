/**
 * Praxis Lifecycle Engine — Event Bus
 *
 * Central event bus for lifecycle events. Events fire, triggers execute.
 * No polling, no watching — pure reactive dispatch.
 */

import type {
  LifecycleEvent,
  LifecycleEventName,
  LifecycleConfig,
  LifecycleExpectation,
  TriggerContext,
  TriggerResult,
  TriggerDefinition,
} from './types.js';

// ─── Event Bus ──────────────────────────────────────────────────────────────

export interface EventBusOptions {
  /** Lifecycle configuration */
  config: LifecycleConfig;
  /** Initial expectations */
  expectations?: LifecycleExpectation[];
  /** Called when a trigger executes */
  onTrigger?: (event: LifecycleEvent, triggerId: string, result: TriggerResult) => void;
  /** Called on any event (for logging/Chronos) */
  onEvent?: (event: LifecycleEvent) => void;
}

export interface EventBus {
  /** Emit a lifecycle event — triggers fire synchronously */
  emit: (name: LifecycleEventName, data?: Record<string, unknown>, source?: string) => Promise<DispatchResult>;
  /** Register additional triggers at runtime */
  addTrigger: (trigger: TriggerDefinition) => void;
  /** Remove a trigger by event name + action ID */
  removeTrigger: (eventName: LifecycleEventName, actionId: string) => void;
  /** Register an expectation */
  addExpectation: (expectation: LifecycleExpectation) => void;
  /** Get an expectation by ID */
  getExpectation: (id: string) => LifecycleExpectation | undefined;
  /** Get all expectations */
  getAllExpectations: () => LifecycleExpectation[];
  /** Get event history */
  getHistory: () => ReadonlyArray<LifecycleEvent>;
  /** Get triggers for a specific event */
  getTriggersFor: (name: LifecycleEventName) => ReadonlyArray<TriggerDefinition>;
  /** Destroy and clean up */
  destroy: () => void;
}

/** Result of dispatching an event through the bus */
export interface DispatchResult {
  /** The event that was dispatched */
  event: LifecycleEvent;
  /** Results from each trigger that fired */
  triggerResults: Array<{
    triggerId: string;
    actionId: string;
    result: TriggerResult;
  }>;
  /** Events emitted by triggers (cascade) */
  cascadedEvents: LifecycleEvent[];
}

// ─── Implementation ─────────────────────────────────────────────────────────

export function createEventBus(options: EventBusOptions): EventBus {
  const { config, onTrigger, onEvent } = options;

  // State
  const triggers = new Map<LifecycleEventName, TriggerDefinition[]>();
  const expectations = new Map<string, LifecycleExpectation>();
  const history: LifecycleEvent[] = [];
  let destroyed = false;

  // Initialize triggers from config
  for (const t of config.triggers) {
    const existing = triggers.get(t.on) ?? [];
    existing.push(t);
    triggers.set(t.on, existing);
  }

  // Initialize expectations
  if (options.expectations) {
    for (const e of options.expectations) {
      expectations.set(e.id, e);
    }
  }

  // ── Emit ────────────────────────────────────────────────────────────────

  async function emit(
    name: LifecycleEventName,
    data: Record<string, unknown> = {},
    source: string = 'praxis',
  ): Promise<DispatchResult> {
    if (destroyed) throw new Error('EventBus is destroyed');

    const event: LifecycleEvent = {
      name,
      timestamp: Date.now(),
      data,
      source,
      expectationId: data.expectationId as string | undefined,
    };

    history.push(event);
    onEvent?.(event);

    // Collect cascade events
    const cascadedEvents: LifecycleEvent[] = [];
    const cascadeEmit = (casName: LifecycleEventName, casData: Record<string, unknown>) => {
      cascadedEvents.push({
        name: casName,
        timestamp: Date.now(),
        data: casData,
        source: 'cascade',
        expectationId: casData.expectationId as string | undefined,
      });
    };

    // Build trigger context
    const ctx: TriggerContext = {
      expectation: event.expectationId ? expectations.get(event.expectationId) : undefined,
      expectations,
      config,
      emit: cascadeEmit,
      addExpectation: (exp) => expectations.set(exp.id, exp),
      getAllExpectations: () => Array.from(expectations.values()),
    };

    // Find and execute matching triggers
    const matchingTriggers = triggers.get(name) ?? [];
    const triggerResults: DispatchResult['triggerResults'] = [];

    for (const trigger of matchingTriggers) {
      // Check filter
      if (trigger.when && !trigger.when(event)) continue;

      for (const action of trigger.actions) {
        try {
          const result = await action.execute(event, ctx);
          triggerResults.push({
            triggerId: `${name}`,
            actionId: action.id,
            result,
          });
          onTrigger?.(event, action.id, result);
        } catch (err) {
          const errorResult: TriggerResult = {
            success: false,
            message: `Trigger ${action.id} failed`,
            error: (err as Error).message,
          };
          triggerResults.push({
            triggerId: `${name}`,
            actionId: action.id,
            result: errorResult,
          });
          onTrigger?.(event, action.id, errorResult);
        }
      }
    }

    // Process cascaded events
    for (const cascaded of cascadedEvents) {
      history.push(cascaded);
      onEvent?.(cascaded);
      // Don't recurse infinitely — cascade events are recorded but not re-dispatched
      // To chain events, triggers should call emit() explicitly
    }

    return { event, triggerResults, cascadedEvents };
  }

  // ── Trigger Management ──────────────────────────────────────────────────

  function addTrigger(trigger: TriggerDefinition): void {
    const existing = triggers.get(trigger.on) ?? [];
    existing.push(trigger);
    triggers.set(trigger.on, existing);
  }

  function removeTrigger(eventName: LifecycleEventName, actionId: string): void {
    const existing = triggers.get(eventName);
    if (!existing) return;
    const filtered = existing.map(t => ({
      ...t,
      actions: t.actions.filter(a => a.id !== actionId),
    })).filter(t => t.actions.length > 0);
    if (filtered.length === 0) {
      triggers.delete(eventName);
    } else {
      triggers.set(eventName, filtered);
    }
  }

  // ── Expectation Management ──────────────────────────────────────────────

  function addExpectation(expectation: LifecycleExpectation): void {
    expectations.set(expectation.id, expectation);
  }

  return {
    emit,
    addTrigger,
    removeTrigger,
    addExpectation,
    getExpectation: (id) => expectations.get(id),
    getAllExpectations: () => Array.from(expectations.values()),
    getHistory: () => history,
    getTriggersFor: (name) => triggers.get(name) ?? [],
    destroy: () => { destroyed = true; },
  };
}
