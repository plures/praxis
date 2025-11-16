/**
 * Svelte v5 Integration
 * 
 * Provides reactive bindings for Praxis logic engines in Svelte v5 applications.
 * Converts a LogicEngine into Svelte stores and runes-compatible reactive bindings.
 */

import type { LogicEngine } from "../core/engine.js";
import type { PraxisEvent, PraxisState } from "../core/protocol.js";

/**
 * Writable store interface (Svelte-compatible)
 */
export interface Writable<T> {
  subscribe(run: (value: T) => void): () => void;
  set(value: T): void;
  update(updater: (value: T) => T): void;
}

/**
 * Readable store interface (Svelte-compatible)
 */
export interface Readable<T> {
  subscribe(run: (value: T) => void): () => void;
}

/**
 * Create a reactive Svelte store from a Praxis engine.
 * 
 * The store tracks the engine's state and provides methods to dispatch events.
 * 
 * @example
 * const engine = createPraxisEngine({ ... });
 * const store = createPraxisStore(engine);
 * 
 * // In Svelte component:
 * $: state = $store;
 * 
 * // Dispatch events:
 * store.dispatch([Login.create({ username: "alice", password: "secret" })]);
 */
export function createPraxisStore<TContext = unknown>(
  engine: LogicEngine<TContext>
): Readable<Readonly<PraxisState & { context: TContext }>> & {
  dispatch: (events: PraxisEvent[]) => void;
} {
  let currentState = engine.getState();
  const subscribers = new Set<(value: Readonly<PraxisState & { context: TContext }>) => void>();

  const notify = () => {
    currentState = engine.getState();
    subscribers.forEach((sub) => sub(currentState));
  };

  return {
    subscribe(run: (value: Readonly<PraxisState & { context: TContext }>) => void) {
      subscribers.add(run);
      run(currentState); // Call immediately with current value
      return () => {
        subscribers.delete(run);
      };
    },
    dispatch(events: PraxisEvent[]) {
      engine.step(events);
      notify();
    },
  };
}

/**
 * Create a derived store that extracts the context from the engine state.
 * 
 * @example
 * const engine = createPraxisEngine({ ... });
 * const contextStore = createContextStore(engine);
 * 
 * // In Svelte component:
 * $: context = $contextStore;
 */
export function createContextStore<TContext = unknown>(
  engine: LogicEngine<TContext>
): Readable<TContext> & {
  dispatch: (events: PraxisEvent[]) => void;
} {
  let currentContext = engine.getContext();
  const subscribers = new Set<(value: TContext) => void>();

  const notify = () => {
    currentContext = engine.getContext();
    subscribers.forEach((sub) => sub(currentContext));
  };

  return {
    subscribe(run: (value: TContext) => void) {
      subscribers.add(run);
      run(currentContext); // Call immediately with current value
      return () => {
        subscribers.delete(run);
      };
    },
    dispatch(events: PraxisEvent[]) {
      engine.step(events);
      notify();
    },
  };
}

/**
 * Create a derived store that extracts specific data from the context.
 * 
 * @example
 * const engine = createPraxisEngine<{ count: number }>({ ... });
 * const countStore = createDerivedStore(engine, (ctx) => ctx.count);
 * 
 * // In Svelte component:
 * $: count = $countStore;
 */
export function createDerivedStore<TContext = unknown, TDerived = unknown>(
  engine: LogicEngine<TContext>,
  selector: (context: TContext) => TDerived
): Readable<TDerived> & {
  dispatch: (events: PraxisEvent[]) => void;
} {
  let currentValue = selector(engine.getContext());
  const subscribers = new Set<(value: TDerived) => void>();

  const notify = () => {
    const newValue = selector(engine.getContext());
    if (newValue !== currentValue) {
      currentValue = newValue;
      subscribers.forEach((sub) => sub(currentValue));
    }
  };

  return {
    subscribe(run: (value: TDerived) => void) {
      subscribers.add(run);
      run(currentValue); // Call immediately with current value
      return () => {
        subscribers.delete(run);
      };
    },
    dispatch(events: PraxisEvent[]) {
      engine.step(events);
      notify();
    },
  };
}
