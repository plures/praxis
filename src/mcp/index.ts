/**
 * Praxis MCP Module
 *
 * Public API for the MCP (Model Context Protocol) server.
 * Exposes Praxis engine operations as AI-consumable tools.
 *
 * @example
 * ```ts
 * import { createPraxisMcpServer } from '@plures/praxis/mcp';
 * ```
 */

export { createPraxisMcpServer } from './server.js';
export type {
  PraxisMcpServerOptions,
  InspectInput,
  InspectOutput,
  RuleInfo,
  ConstraintInfo,
  EvaluateInput,
  EvaluateOutput,
  AuditInput,
  AuditOutput,
  SuggestInput,
  SuggestOutput,
  StepInput,
  StepOutput,
  FactsOutput,
  ContractsInput,
  ContractsOutput,
  ContractInfo,
  GatesInput,
} from './types.js';
