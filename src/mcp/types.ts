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

export interface InspectInput {
  /** Filter by rule/constraint ID pattern (glob-like) */
  filter?: string;
  /** Include contract details */
  includeContracts?: boolean;
}

export interface EvaluateInput {
  /** Rule ID to evaluate */
  ruleId: string;
  /** Events to process */
  events: PraxisEvent[];
}

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

export interface CheckExpectationsInput {
  /** Expectation set name to verify */
  setName?: string;
}

export interface SuggestInput {
  /** Description of the gap or failing expectation */
  gap: string;
  /** Current context for suggestions */
  context?: Record<string, unknown>;
}

export interface StepInput {
  /** Events to step the engine with */
  events: PraxisEvent[];
}

export interface ContractsInput {
  /** Filter by rule ID pattern */
  filter?: string;
}

export interface GatesInput {
  /** Filter by gate name */
  filter?: string;
}

// ─── Tool Output Types ──────────────────────────────────────────────────────

export interface RuleInfo {
  id: string;
  description: string;
  eventTypes?: string | string[];
  hasContract: boolean;
  contract?: Contract;
  meta?: Record<string, unknown>;
}

export interface ConstraintInfo {
  id: string;
  description: string;
  hasContract: boolean;
  contract?: Contract;
  meta?: Record<string, unknown>;
}

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

export interface EvaluateOutput {
  ruleId: string;
  resultKind: 'emit' | 'noop' | 'skip' | 'retract';
  facts: PraxisFact[];
  retractedTags: string[];
  reason?: string;
  diagnostics: PraxisDiagnostics[];
}

export interface AuditOutput {
  report: CompletenessReport;
  formatted: string;
}

export interface SuggestOutput {
  suggestions: Array<{
    type: 'rule' | 'constraint' | 'contract' | 'event';
    id: string;
    description: string;
    rationale: string;
  }>;
}

export interface StepOutput {
  facts: PraxisFact[];
  diagnostics: PraxisDiagnostics[];
  factCount: number;
}

export interface ContractInfo {
  ruleId: string;
  hasContract: boolean;
  contract?: Contract;
  type: 'rule' | 'constraint';
}

export interface ContractsOutput {
  contracts: ContractInfo[];
  coverage: {
    total: number;
    withContracts: number;
    percentage: number;
  };
}

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
