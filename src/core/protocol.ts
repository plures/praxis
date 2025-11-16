/**
 * Core Praxis Protocol
 * 
 * Language-neutral, JSON-friendly protocol that forms the foundation of Praxis.
 * This protocol is designed to be stable and portable across languages (TypeScript, C#, PowerShell, etc.)
 * 
 * The protocol defines the conceptual core of the engine:
 * - Pure, deterministic, data in → data out
 * - No side effects, no global state
 * - All higher-level TypeScript APIs are built on top of this protocol
 */

/**
 * A fact is a typed proposition about the domain.
 * Examples: UserLoggedIn, CartItem, NetworkOnline
 */
export interface PraxisFact {
  /** Tag identifying the fact type */
  tag: string;
  /** Payload containing the fact data */
  payload: unknown;
}

/**
 * An event is a temporally ordered fact meant to drive change.
 * Examples: LOGIN, LOGOUT, ADD_TO_CART
 */
export interface PraxisEvent {
  /** Tag identifying the event type */
  tag: string;
  /** Payload containing the event data */
  payload: unknown;
}

/**
 * The state of the Praxis engine at a point in time.
 */
export interface PraxisState {
  /** Application context (domain-specific data) */
  context: unknown;
  /** Current facts about the domain */
  facts: PraxisFact[];
  /** Optional metadata (timestamps, version, etc.) */
  meta?: Record<string, unknown>;
}

/**
 * Diagnostic information about constraint violations or rule errors.
 */
export interface PraxisDiagnostics {
  /** Kind of diagnostic */
  kind: "constraint-violation" | "rule-error";
  /** Human-readable message */
  message: string;
  /** Additional diagnostic data */
  data?: unknown;
}

/**
 * Configuration for a step execution.
 * Specifies which rules and constraints to apply.
 */
export interface PraxisStepConfig {
  /** IDs of rules to apply during this step */
  ruleIds: string[];
  /** IDs of constraints to check during this step */
  constraintIds: string[];
}

/**
 * Result of a step execution.
 */
export interface PraxisStepResult {
  /** New state after applying rules and checking constraints */
  state: PraxisState;
  /** Diagnostics from rule execution and constraint checking */
  diagnostics: PraxisDiagnostics[];
}

/**
 * The core step function of the Praxis engine.
 * 
 * This is the conceptual heart of the engine:
 * - Takes current state, events, and configuration
 * - Applies rules and checks constraints
 * - Returns new state and diagnostics
 * 
 * Pure, deterministic, data in → data out.
 * No side effects, no global state.
 */
export type PraxisStepFn = (
  state: PraxisState,
  events: PraxisEvent[],
  config: PraxisStepConfig
) => PraxisStepResult;
