/**
 * Decision Ledger - Main Entry Point
 *
 * Contract-based validation and documentation for Praxis rules and constraints.
 */

export {
  type Assumption,
  type Reference,
  type Example,
  type Contract,
  type DefineContractOptions,
  type Severity,
  type MissingArtifact,
  type ContractGap,
  type ValidationReport,
  defineContract,
  getContract,
  getContractFromDescriptor,
  isContract,
} from './types.js';

export {
  ContractMissing,
  ContractValidated,
  AcknowledgeContractGap,
  ValidateContracts,
  ContractGapAcknowledged,
  ContractAdded,
  ContractUpdated,
  ContractGapEmitted,
} from './facts-events.js';

export {
  type ValidateOptions,
  type ArtifactIndex,
  validateContracts,
  formatValidationReport,
  formatValidationReportJSON,
  formatValidationReportSARIF,
} from './validation.js';

export {
  type LedgerEntry,
  type LedgerEntryStatus,
  BehaviorLedger,
  createBehaviorLedger,
} from './ledger.js';

export {
  type LogicLedgerEntry,
  type LogicLedgerWriteOptions,
  type LogicLedgerIndex,
  writeLogicLedgerEntry,
} from './logic-ledger.js';

export {
  type ScanOptions,
  type ScanResult,
  type DiscoveredArtifact,
  scanRepository,
  inferContractFromFile,
} from './scanner.js';

export {
  type AIProvider,
  type ReverseGenerationOptions,
  type GenerationResult,
  generateContractFromRule,
} from './reverse-generator.js';

// ─── Analyzer Engine ────────────────────────────────────────────────────────

export {
  type FactNode,
  type DependencyEdge,
  type DependencyGraph,
  type DerivationStep,
  type DerivationChain,
  type DeadRule,
  type UnreachableState,
  type ShadowedRule,
  type Contradiction,
  type Gap,
  type ImpactReport,
  type ExampleVerification,
  type ContractVerificationResult,
  type InvariantCheck,
  type ContractCoverageGap,
  type CrossReference,
  type FindingType,
  type Suggestion,
  type AnalysisReport,
  type LedgerDiffEntry,
  type LedgerDiff,
} from './analyzer-types.js';

export {
  analyzeDependencyGraph,
  findDeadRules,
  findUnreachableStates,
  findShadowedRules,
  findContradictions,
  findGaps,
} from './analyzer.js';

export {
  traceDerivation,
  traceImpact,
} from './derivation.js';

export {
  verifyContractExamples,
  verifyInvariants,
  findContractGaps,
  crossReferenceContracts,
} from './contract-verification.js';

export {
  suggest,
  suggestAll,
} from './suggestions.js';

export {
  generateLedger,
  formatLedger,
  formatBuildOutput,
  diffLedgers,
} from './report.js';
