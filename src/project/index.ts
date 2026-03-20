/**
 * Praxis Project Logic
 *
 * Public API for developer workflow rules.
 *
 * @example
 * ```ts
 * import { defineGate, commitFromState, branchRules } from '@plures/praxis/project';
 * ```
 */

export {
  defineGate,
  semverContract,
  commitFromState,
  branchRules,
  lintGate,
  formatGate,
  expectationGate,
} from './project.js';

export type {
  GateConfig,
  GateState,
  GateStatus,
  SemverContractConfig,
  SemverReport,
  PraxisDiff,
  BranchRulesConfig,
  PredefinedGateConfig,
} from './types.js';
