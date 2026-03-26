/**
 * Praxis MCP Server — Types
 *
 * Types for the MCP (Model Context Protocol) server that exposes
 * Praxis engine operations as tools for AI assistants.
 */

import type { PraxisEvent, PraxisFact, PraxisDiagnostics } from '../core/protocol.js';
import type { CompletenessReport, LogicBranch, StateField, StateTransition } from '../core/completeness.js';
import type { Contract } from '../decision-ledger/types.js';

// ─── Tool Input Types ───────────────────────────────────────────────────────

/** Input for the `inspect` MCP tool — list rules and constraints in the registry. */
export interface InspectInput {
  /** Filter by rule/constraint ID pattern (glob-like) */
  filter?: string;
  /** Include contract details */
  includeContracts?: boolean;
}

/** Input for the `evaluate` MCP tool — run a single rule against provided events. */
export interface EvaluateInput {
  /** Rule ID to evaluate */
  ruleId: string;
  /** Events to process */
  events: PraxisEvent[];
}

/** Input for the `audit` MCP tool — check completeness against a manifest. */
export interface AuditInput {
  /** Completeness manifest */
  manifest: {
    branches: LogicBranch[];
    stateFields: StateField[];
    transitions: StateTransition[];
    rulesNeedingContracts: string[];
  };
  /** Minimum passing score (default: 90) */
  threshold?: number;
}

/** Input for the `check-expectations` MCP tool — verify declared expectations. */
export interface CheckExpectationsInput {
  /** Expectation set name to verify */
  setName?: string;
}

/** Input for the `suggest` MCP tool — generate rule/constraint/contract suggestions. */
export interface SuggestInput {
  /** Description of the gap or failing expectation */
  gap: string;
  /** Current context for suggestions */
  context?: Record<string, unknown>;
}

/** Input for the `step` MCP tool — advance the engine with a set of events. */
export interface StepInput {
  /** Events to step the engine with */
  events: PraxisEvent[];
}

/** Input for the `contracts` MCP tool — list contract coverage details. */
export interface ContractsInput {
  /** Filter by rule ID pattern */
  filter?: string;
}

/** Input for the `gates` MCP tool — query project gate states. */
export interface GatesInput {
  /** Filter by gate name */
  filter?: string;
}

// ─── Tool Output Types ──────────────────────────────────────────────────────

/** Summary information about a single rule exposed via MCP tools. */
export interface RuleInfo {
  id: string;
  description: string;
  eventTypes?: string | string[];
  hasContract: boolean;
  contract?: Contract;
  meta?: Record<string, unknown>;
}

/** Summary information about a single constraint exposed via MCP tools. */
export interface ConstraintInfo {
  id: string;
  description: string;
  hasContract: boolean;
  contract?: Contract;
  meta?: Record<string, unknown>;
}

/** Output of the `inspect` MCP tool — full registry snapshot. */
export interface InspectOutput {
  rules: RuleInfo[];
  constraints: ConstraintInfo[];
  summary: {
    totalRules: number;
    totalConstraints: number;
    rulesWithContracts: number;
    constraintsWithContracts: number;
  };
}

/** Output of the `evaluate` MCP tool — result of running a single rule. */
export interface EvaluateOutput {
  ruleId: string;
  resultKind: 'emit' | 'noop' | 'skip' | 'retract';
  facts: PraxisFact[];
  retractedTags: string[];
  reason?: string;
  diagnostics: PraxisDiagnostics[];
}

/** Output of the `audit` MCP tool — completeness report and formatted summary. */
export interface AuditOutput {
  report: CompletenessReport;
  formatted: string;
}

/** Output of the `suggest` MCP tool — list of generated rule/contract suggestions. */
export interface SuggestOutput {
  suggestions: Array<{
    type: 'rule' | 'constraint' | 'contract' | 'event';
    id: string;
    description: string;
    rationale: string;
  }>;
}

/** Output of the `step` MCP tool — facts and diagnostics after one engine step. */
export interface StepOutput {
  facts: PraxisFact[];
  diagnostics: PraxisDiagnostics[];
  factCount: number;
}

/** Contract coverage information for a single rule or constraint. */
export interface ContractInfo {
  ruleId: string;
  hasContract: boolean;
  contract?: Contract;
  type: 'rule' | 'constraint';
}

/** Output of the `contracts` MCP tool — contract coverage across the registry. */
export interface ContractsOutput {
  contracts: ContractInfo[];
  coverage: {
    total: number;
    withContracts: number;
    percentage: number;
  };
}

/** Output of the `facts` MCP tool — all current facts held by the engine. */
export interface FactsOutput {
  facts: PraxisFact[];
  count: number;
}

/**
 * Options for creating a Praxis MCP server.
 */
export interface PraxisMcpServerOptions<TContext = unknown> {
  /** Name for the MCP server */
  name?: string;
  /** Version string */
  version?: string;
  /** Initial context for the engine */
  initialContext: TContext;
  /** Pre-configured registry (rules + constraints already registered) */
  registry: import('../core/rules.js').PraxisRegistry<TContext>;
  /** Initial facts */
  initialFacts?: PraxisFact[];
}
