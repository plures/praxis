/**
 * Praxis - Practical, Provable Application Logic
 * 
 * A typed, functional application logic engine built on strong types.
 * 
 * Core concepts:
 * - Facts: typed propositions about the domain
 * - Events: temporally ordered facts meant to drive change
 * - Rules: pure functions that derive new facts from context + events
 * - Constraints: invariants that must always hold
 * - Flows: orchestrated behaviors
 * - Actors: effectful units that perform side effects
 * 
 * @example
 * ```typescript
 * import { createPraxisEngine, PraxisRegistry, defineFact, defineEvent, defineRule } from "@plures/praxis";
 * 
 * // Define facts and events
 * const UserLoggedIn = defineFact<"UserLoggedIn", { userId: string }>("UserLoggedIn");
 * const Login = defineEvent<"LOGIN", { username: string }>("LOGIN");
 * 
 * // Define rules
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
 * // Create engine
 * const registry = new PraxisRegistry();
 * registry.registerRule(loginRule);
 * 
 * const engine = createPraxisEngine({
 *   initialContext: {},
 *   registry
 * });
 * 
 * // Dispatch events
 * const result = engine.step([Login.create({ username: "alice" })]);
 * console.log(result.state.facts); // [{ tag: "UserLoggedIn", payload: { userId: "alice" } }]
 * ```
 */

// Core protocol (language-neutral types)
export type {
  PraxisFact,
  PraxisEvent,
  PraxisState,
  PraxisDiagnostics,
  PraxisStepConfig,
  PraxisStepResult,
  PraxisStepFn,
} from "./core/protocol.js";
export { PRAXIS_PROTOCOL_VERSION } from "./core/protocol.js";

// Rules and constraints
export type {
  RuleId,
  ConstraintId,
  RuleFn,
  ConstraintFn,
  RuleDescriptor,
  ConstraintDescriptor,
  PraxisModule,
} from "./core/rules.js";
export { PraxisRegistry } from "./core/rules.js";

// Engine
export type { PraxisEngineOptions } from "./core/engine.js";
export { LogicEngine, createPraxisEngine } from "./core/engine.js";

// Actors
export type { Actor } from "./core/actors.js";
export { ActorManager, createTimerActor } from "./core/actors.js";

// Introspection
export type {
  RuleNode,
  ConstraintNode,
  GraphEdge,
  RegistryGraph,
  RuleSchema,
  ConstraintSchema,
  RegistrySchema,
  RegistryStats,
} from "./core/introspection.js";
export { RegistryIntrospector, createIntrospector } from "./core/introspection.js";

// DSL helpers
export {
  defineFact,
  defineEvent,
  defineRule,
  defineConstraint,
  defineModule,
  filterEvents,
  filterFacts,
  findEvent,
  findFact,
} from "./dsl/index.js";
export type {
  FactDefinition,
  EventDefinition,
  DefineRuleOptions,
  DefineConstraintOptions,
  DefineModuleOptions,
} from "./dsl/index.js";
