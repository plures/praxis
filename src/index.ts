/**
 * Praxis - TypeScript library for typed, functional application logic.
 * 
 * Logic-first: facts, events, rules, constraints, flows, actors.
 * FSMs are internal tools, not the main API.
 * 
 * Core is a pure, JSON-friendly step over PraxisState/PraxisEvent.
 */

// Core types
export type {
  PraxisEvent,
  PraxisState,
  StepResult,
  Effect,
  StepFunction,
} from './types.js';

// DSL for rules and constraints
export type {
  Condition,
  Action,
  Rule,
  Constraint,
  ConstraintViolation,
} from './dsl.js';

export {
  RuleBuilder,
  ConstraintBuilder,
  rule,
  constraint,
} from './dsl.js';

// Registry
export {
  Registry,
  createRegistry,
} from './registry.js';

// Step functions
export {
  createStepFunction,
  step,
  compose,
} from './step.js';
export type { StepOptions } from './step.js';

// Flows and actors
export type {
  Flow,
  FlowStep,
  Actor,
} from './flows.js';

export {
  createFlow,
  advanceFlow,
  isFlowWaitingFor,
  createActor,
  processActorEvent,
  ActorSystem,
  createActorSystem,
} from './flows.js';
