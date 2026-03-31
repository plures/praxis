/**
 * DSL Helpers
 *
 * Ergonomic TypeScript helpers for defining facts, events, rules, constraints, and flows.
 * These produce both strongly-typed APIs and serializable descriptors.
 */

import type { PraxisEvent, PraxisFact } from '../protocol.js';
import type {
  RuleDescriptor,
  ConstraintDescriptor,
  PraxisModule,
  RuleFn,
  ConstraintFn,
} from '../rules.js';
import type { Contract } from '../decision-ledger/types.js';

/**
 * Strongly typed fact definition
 */
export interface FactDefinition<TTag extends string, TPayload> {
  tag: TTag;
  create(payload: TPayload): PraxisFact & { tag: TTag; payload: TPayload };
  is(fact: PraxisFact): fact is PraxisFact & { tag: TTag; payload: TPayload };
}

/**
 * Define a typed fact
 *
 * @param tag - The fact type tag (e.g. `"UserLoggedIn"`) — must be a string literal type for full type safety
 * @returns A {@link FactDefinition} with `create()` and `is()` helpers
 *
 * @example
 * const UserLoggedIn = defineFact<"UserLoggedIn", { userId: string }>("UserLoggedIn");
 * const fact = UserLoggedIn.create({ userId: "123" });
 * if (UserLoggedIn.is(fact)) {
 *   console.log(fact.payload.userId); // Type-safe!
 * }
 */
export function defineFact<TTag extends string, TPayload>(
  tag: TTag
): FactDefinition<TTag, TPayload> {
  return {
    tag,
    create(payload: TPayload): PraxisFact & { tag: TTag; payload: TPayload } {
      return { tag, payload };
    },
    is(fact: PraxisFact): fact is PraxisFact & { tag: TTag; payload: TPayload } {
      return fact.tag === tag;
    },
  };
}

/**
 * Strongly typed event definition
 */
export interface EventDefinition<TTag extends string, TPayload> {
  tag: TTag;
  create(payload: TPayload): PraxisEvent & { tag: TTag; payload: TPayload };
  is(event: PraxisEvent): event is PraxisEvent & { tag: TTag; payload: TPayload };
}

/**
 * Define a typed event
 *
 * @param tag - The event type tag (e.g. `"LOGIN"`) — must be a string literal type for full type safety
 * @returns An {@link EventDefinition} with `create()` and `is()` helpers
 *
 * @example
 * const Login = defineEvent<"LOGIN", { username: string; password: string }>("LOGIN");
 * const event = Login.create({ username: "alice", password: "secret" });
 */
export function defineEvent<TTag extends string, TPayload>(
  tag: TTag
): EventDefinition<TTag, TPayload> {
  return {
    tag,
    create(payload: TPayload): PraxisEvent & { tag: TTag; payload: TPayload } {
      return { tag, payload };
    },
    is(event: PraxisEvent): event is PraxisEvent & { tag: TTag; payload: TPayload } {
      return event.tag === tag;
    },
  };
}

/**
 * Options for defining a rule
 */
export interface DefineRuleOptions<TContext = unknown> {
  id: string;
  description: string;
  impl: RuleFn<TContext>;
  /**
   * Optional event type filter — only evaluate this rule when at least one
   * event in the batch has a matching `tag`. Accepts a single tag or array.
   */
  eventTypes?: string | string[];
  contract?: Contract;
  meta?: Record<string, unknown>;
}

/**
 * Define a rule
 *
 * @example
 * const loginRule = defineRule({
 *   id: "auth.login",
 *   description: "Process login event",
 *   impl: (state, events) => {
 *     const loginEvent = events.find(Login.is);
 *     if (loginEvent) {
 *       return [UserLoggedIn.create({ userId: loginEvent.payload.username })];
 *     }
 *     return [];
 *   }
 * });
 *
 * @param options - Rule definition options: `id`, `description`, `impl`, optional `eventTypes`, `contract`, and `meta`
 * @returns A fully constructed {@link RuleDescriptor}
 */
export function defineRule<TContext = unknown>(
  options: DefineRuleOptions<TContext>
): RuleDescriptor<TContext> {
  const contract = options.contract ?? (options.meta?.contract as Contract | undefined);
  const meta = contract ? { ...(options.meta ?? {}), contract } : options.meta;

  return {
    id: options.id,
    description: options.description,
    impl: options.impl,
    eventTypes: options.eventTypes,
    contract,
    meta,
  };
}

/**
 * Options for defining a constraint
 */
export interface DefineConstraintOptions<TContext = unknown> {
  id: string;
  description: string;
  impl: ConstraintFn<TContext>;
  contract?: Contract;
  meta?: Record<string, unknown>;
}

/**
 * Define a constraint
 *
 * @example
 * const maxCartItems = defineConstraint({
 *   id: "cart.maxItems",
 *   description: "Cart cannot exceed 100 items",
 *   impl: (state) => {
 *     const itemCount = state.context.items?.length ?? 0;
 *     return itemCount <= 100 || `Cart has ${itemCount} items, maximum is 100`;
 *   }
 * });
 *
 * @param options - Constraint definition options: `id`, `description`, `impl`, optional `contract` and `meta`
 * @returns A fully constructed {@link ConstraintDescriptor}
 */
export function defineConstraint<TContext = unknown>(
  options: DefineConstraintOptions<TContext>
): ConstraintDescriptor<TContext> {
  const contract = options.contract ?? (options.meta?.contract as Contract | undefined);
  const meta = contract ? { ...(options.meta ?? {}), contract } : options.meta;

  return {
    id: options.id,
    description: options.description,
    impl: options.impl,
    contract,
    meta,
  };
}

/**
 * Options for defining a module
 */
export interface DefineModuleOptions<TContext = unknown> {
  rules?: RuleDescriptor<TContext>[];
  constraints?: ConstraintDescriptor<TContext>[];
  meta?: Record<string, unknown>;
}

/**
 * Define a module (bundle of rules and constraints)
 *
 * @example
 * const authModule = defineModule({
 *   rules: [loginRule, logoutRule],
 *   constraints: [maxSessionsConstraint],
 *   meta: { version: "1.0.0" }
 * });
 *
 * @param options - Module options: optional `rules`, `constraints`, and `meta`
 * @returns A {@link PraxisModule} with the given rules and constraints
 */
export function defineModule<TContext = unknown>(
  options: DefineModuleOptions<TContext>
): PraxisModule<TContext> {
  return {
    rules: options.rules ?? [],
    constraints: options.constraints ?? [],
    meta: options.meta,
  };
}

/**
 * Helper to filter events by definition
 *
 * @param events - Array of events to filter
 * @param definition - Typed event definition created by {@link defineEvent}
 * @returns All events in the array that match the given type definition
 */
export function filterEvents<TTag extends string, TPayload>(
  events: PraxisEvent[],
  definition: EventDefinition<TTag, TPayload>
): Array<PraxisEvent & { tag: TTag; payload: TPayload }> {
  return events.filter(definition.is);
}

/**
 * Helper to filter facts by definition
 *
 * @param facts - Array of facts to filter
 * @param definition - Typed fact definition created by {@link defineFact}
 * @returns All facts in the array that match the given type definition
 */
export function filterFacts<TTag extends string, TPayload>(
  facts: PraxisFact[],
  definition: FactDefinition<TTag, TPayload>
): Array<PraxisFact & { tag: TTag; payload: TPayload }> {
  return facts.filter(definition.is);
}

/**
 * Helper to find first event matching definition
 *
 * @param events - Array of events to search
 * @param definition - Typed event definition created by {@link defineEvent}
 * @returns The first matching event, or `undefined` if none found
 */
export function findEvent<TTag extends string, TPayload>(
  events: PraxisEvent[],
  definition: EventDefinition<TTag, TPayload>
): (PraxisEvent & { tag: TTag; payload: TPayload }) | undefined {
  return events.find(definition.is);
}

/**
 * Helper to find first fact matching definition
 *
 * @param facts - Array of facts to search
 * @param definition - Typed fact definition created by {@link defineFact}
 * @returns The first matching fact, or `undefined` if none found
 */
export function findFact<TTag extends string, TPayload>(
  facts: PraxisFact[],
  definition: FactDefinition<TTag, TPayload>
): (PraxisFact & { tag: TTag; payload: TPayload }) | undefined {
  return facts.find(definition.is);
}
