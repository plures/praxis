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
} from './core/protocol.js';
export { PRAXIS_PROTOCOL_VERSION } from './core/protocol.js';

// Rules and constraints
export type {
  RuleId,
  ConstraintId,
  RuleFn,
  ConstraintFn,
  RuleDescriptor,
  ConstraintDescriptor,
  PraxisModule,
} from './core/rules.js';
export { PraxisRegistry } from './core/rules.js';

// Engine
export type { PraxisEngineOptions } from './core/engine.js';
export { LogicEngine, createPraxisEngine } from './core/engine.js';
export * from './core/reactive-engine.svelte.js';

// Framework-agnostic Reactive Engine
export {
  ReactiveLogicEngine as FrameworkAgnosticReactiveEngine,
  createReactiveEngine as createFrameworkAgnosticReactiveEngine,
  type ReactiveEngineOptions as FrameworkAgnosticReactiveEngineOptions,
  type StateChangeCallback,
} from './core/reactive-engine.js';

// Actors
export type { Actor } from './core/actors.js';
export { ActorManager, createTimerActor } from './core/actors.js';

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
} from './core/introspection.js';
export { RegistryIntrospector, createIntrospector } from './core/introspection.js';

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
} from './dsl/index.js';
export type {
  FactDefinition,
  EventDefinition,
  DefineRuleOptions,
  DefineConstraintOptions,
  DefineModuleOptions,
} from './dsl/index.js';

// Decision Ledger (Contract-based validation)
export {
  defineContract,
  getContract,
  isContract,
  validateContracts,
  formatValidationReport,
  formatValidationReportJSON,
  formatValidationReportSARIF,
  ContractMissing,
  ContractValidated,
  AcknowledgeContractGap,
  ValidateContracts,
  ContractGapAcknowledged,
  ContractAdded,
  ContractUpdated,
  BehaviorLedger,
  createBehaviorLedger,
} from './decision-ledger/index.js';
export type {
  Assumption,
  Reference,
  Example,
  Contract,
  DefineContractOptions,
  Severity,
  MissingArtifact,
  ContractGap,
  ValidationReport,
  ValidateOptions,
  LedgerEntry,
  LedgerEntryStatus,
} from './decision-ledger/index.js';

// Decision Ledger — Analyzer Engine
export {
  analyzeDependencyGraph,
  findDeadRules,
  findUnreachableStates,
  findShadowedRules,
  findContradictions,
  findGaps,
  traceDerivation,
  traceImpact,
  verifyContractExamples,
  verifyInvariants,
  findContractGaps,
  crossReferenceContracts,
  suggest,
  suggestAll,
  generateLedger,
  formatLedger,
  formatBuildOutput,
  diffLedgers,
} from './decision-ledger/index.js';
export type {
  FactNode,
  DependencyEdge,
  DependencyGraph,
  DerivationStep,
  DerivationChain,
  DeadRule,
  UnreachableState,
  ShadowedRule,
  Contradiction,
  Gap,
  ImpactReport,
  ExampleVerification,
  ContractVerificationResult,
  InvariantCheck,
  ContractCoverageGap,
  CrossReference,
  FindingType,
  Suggestion,
  AnalysisReport,
  LedgerDiffEntry,
  LedgerDiff,
} from './decision-ledger/index.js';

// Terminal Node Runtime
export type {
  TerminalExecutionResult,
  TerminalNodeState,
  TerminalAdapterOptions,
  CommandExecutor,
} from './runtime/terminal-adapter.js';
export {
  TerminalAdapter,
  createTerminalAdapter,
  runTerminalCommand,
  createMockExecutor,
} from './runtime/terminal-adapter.js';

// Schema Types (including Terminal Node types)
export type {
  PraxisSchema,
  NodeDefinition,
  NodeBindings,
  TerminalNodeProps,
  OrchestrationDefinition,
  ValidationResult,
  ValidationError,
  ModelDefinition,
  ComponentDefinition,
  LogicDefinition,
} from './core/schema/types.js';
export { validateSchema, createSchemaTemplate } from './core/schema/types.js';

// Schema Loader (supports JSON, YAML, and TS)
export type { LoaderOptions, LoaderResult } from './core/schema/loader.js';
export {
  loadSchema,
  loadSchemaFromJson,
  loadSchemaFromYaml,
  loadSchemaFromFile,
  validateForGeneration,
} from './core/schema/loader.js';

// PluresDB Integration
export type {
  PraxisDB,
  UnsubscribeFn,
  PluresDBInstance,
  PluresDBAdapterConfig,
  PraxisLocalFirstOptions,
  EventStreamEntry,
  PraxisDBStoreOptions,
  StoredSchema,
  PluresDBGeneratorOptions,
  GeneratedPluresDBFile,
  PluresDBAdapter,
  PluresDBAdapterOptions,
  // Chronicle
  TraceDirection,
  EdgeType,
  ChronicleEvent,
  ChronicleNode,
  ChronicleEdge,
  Chronicle,
  ChronicleSpan,
  ChronosTraceParams,
  ChronosSearchParams,
  McpToolResult,
  ChronosMcpTools,
} from './integrations/pluresdb.js';
export {
  InMemoryPraxisDB,
  createInMemoryDB,
  PluresDBPraxisAdapter,
  createPluresDB,
  createPraxisLocalFirst,
  PraxisDBStore,
  createPraxisDBStore,
  PRAXIS_PATHS,
  getFactPath,
  getEventPath,
  generateId,
  PraxisSchemaRegistry,
  createSchemaRegistry,
  registerSchema,
  getSchemaPath,
  PluresDBGenerator,
  createPluresDBGenerator,
  createPluresDBAdapter,
  attachToEngine,
  // Chronicle
  ChronicleContext,
  PluresDbChronicle,
  createChronicle,
  CHRONICLE_PATHS,
  createChronosMcpTools,
} from './integrations/pluresdb.js';

// Unum Integration (Identity & Channels)
export type {
  UnumStore,
  UnumChannel,
  UnumMessage,
  UnumIdentity,
  UnumAdapterConfig,
  UnumAdapter,
} from './integrations/unum.js';
export { createUnumAdapter, attachUnumToEngine } from './integrations/unum.js';

// CodeCanvas Integration (Visual Schema Editor)
export type {
  CanvasNode,
  CanvasEdge,
  CanvasNodeStyle,
  CanvasEdgeStyle,
  CanvasDocument,
  LifecycleState,
  ActivityState,
  CanvasEditorConfig,
  GuardianResult,
  GuardianError,
  GuardianWarning,
} from './integrations/code-canvas.js';
export {
  schemaToCanvas,
  canvasToSchema,
  canvasToYaml,
  canvasToMermaid,
  validateWithGuardian,
  createCanvasEditor,
} from './integrations/code-canvas.js';

// State-Docs Integration (Documentation Generation)
export type {
  StateDocsConfig,
  GeneratedDoc,
  StateMachineDoc,
  StateDoc,
  TransitionDoc,
} from './integrations/state-docs.js';
export {
  StateDocsGenerator,
  createStateDocsGenerator,
  generateDocs,
} from './integrations/state-docs.js';

// Tauri Integration (Desktop Apps)
export type {
  TauriAppConfig,
  TauriWindowConfig,
  TauriSecurityConfig,
  TauriUpdateConfig,
  TauriPlugin,
  TauriCommand,
  TauriEvent,
  TauriFS,
  TauriFileEntry,
  TauriTray,
  TauriMenuItem,
  TauriNotification,
  TauriNotificationOptions,
  TauriBridge,
  TauriUpdateInfo,
  TauriPraxisAdapter,
} from './integrations/tauri.js';
export {
  createMockTauriBridge,
  createTauriPraxisAdapter,
  attachTauriToEngine,
  generateTauriConfig,
} from './integrations/tauri.js';

// Unified Integration Helpers
export type { UnifiedAppConfig, UnifiedApp } from './integrations/unified.js';
export { createUnifiedApp, attachAllIntegrations } from './integrations/unified.js';

// ── Rule Result (typed rule returns — no empty arrays) ──────────────────────
export { RuleResult, fact } from './core/rule-result.js';
export type { TypedRuleFn } from './core/rule-result.js';

// ── UI Rules (predefined, lightweight, separate from business logic) ────────
export {
  uiModule,
  createUIModule,
  loadingGateRule,
  errorDisplayRule,
  offlineIndicatorRule,
  dirtyGuardRule,
  initGateRule,
  viewportRule,
  noInteractionWhileLoadingConstraint,
  mustBeInitializedConstraint,
  uiStateChanged,
  navigationRequest,
  resizeEvent,
} from './core/ui-rules.js';
export type { UIContext } from './core/ui-rules.js';

// ── Completeness Analysis ───────────────────────────────────────────────────
export { auditCompleteness, formatReport } from './core/completeness.js';
export type { LogicBranch, StateField, StateTransition, CompletenessReport, CompletenessConfig } from './core/completeness.js';

// ── Analysis Module (introspection & health) ────────────────────────────────
export { analyze } from './analysis/index.js';
export type {
  // AnalysisReport is aliased to avoid clash with decision-ledger's AnalysisReport
  AnalysisReport as IntrospectionReport,
  ModuleAnalysis,
  CoverageReport,
  ConfidenceDistribution,
  RuleEffectivenessReport,
  DependencyHealthReport,
  PredictionAccuracyReport,
  Recommendation,
  AnalysisContext,
  Prediction,
} from './analysis/index.js';

// ── Experiments Module (sandboxed self-improvement) ────────────────────────
export {
  ExperimentRegistry,
  createSandboxRunner,
  createFactVerification,
  createRuleExperiment,
  createModelCalibration,
  createABComparison,
} from './experiments/index.js';
export type {
  ExperimentStatus,
  ExperimentKind,
  Experiment,
  ExperimentDesign,
  ExperimentStep,
  SandboxConfig,
  ExperimentResults,
  SandboxRunner,
} from './experiments/index.js';

export { generateResearchQuestions, buildAgenda } from './research/index.js';
export type {
  ResearchStatus,
  ResearchOrigin,
  ResearchQuestion,
  ResearchAgenda,
} from './research/index.js';

// ── Expectations DSL (behavioral declarations) ─────────────────────────────
export {
  Expectation,
  ExpectationSet,
  expectBehavior,
  verify,
  formatVerificationReport,
} from './expectations/index.js';
export type {
  ExpectationCondition,
  ConditionStatus,
  ConditionResult,
  ExpectationResult,
  VerificationReport,
  ExpectationSetOptions,
  VerifiableRegistry,
  VerifiableDescriptor,
} from './expectations/index.js';

// ── Rules Factory (predefined modules) ─────────────────────────────────────
export {
  inputRules,
  toastRules,
  formRules,
  navigationRules,
  dataRules,
} from './factory/index.js';
export type {
  InputRulesConfig,
  ToastRulesConfig,
  FormRulesConfig,
  NavigationRulesConfig,
  DataRulesConfig,
  SanitizationType,
} from './factory/index.js';

// ── Project Logic (developer workflow) ──────────────────────────────────────
export {
  defineGate,
  semverContract,
  commitFromState,
  branchRules,
  lintGate,
  formatGate,
  expectationGate,
} from './project/index.js';
export type {
  GateConfig,
  GateState,
  GateStatus,
  SemverContractConfig,
  SemverReport,
  PraxisDiff,
  BranchRulesConfig,
  PredefinedGateConfig,
} from './project/index.js';

// ── Chronos Project-Level Chronicle ─────────────────────────────────────────
export {
  ProjectChronicle,
  createProjectChronicle,
  Timeline,
  createTimeline,
  enableProjectChronicle,
  recordAudit,
  diffRegistries,
  diffContracts,
  diffExpectations,
  formatDelta,
  formatCommitMessage as formatBehavioralCommit,
  formatReleaseNotes,
} from './chronos/index.js';
export type {
  ProjectEvent,
  ProjectEventKind,
  ProjectChronicleOptions,
  TimelineFilter,
  BehavioralDelta,
  ChronicleHandle,
  EnableChronicleOptions,
  RegistrySnapshot,
  RegistryDiff,
  ContractCoverage,
  ContractDiff,
  ExpectationSnapshot,
  ExpectationDiff,
  FullBehavioralDiff,
} from './chronos/index.js';


// ── Unified Reactive Layer (v2.0) ───────────────────────────────────────────
// The zero-boilerplate API: createApp → query() + mutate()
export { createApp } from './unified/core.js';
export type { PraxisApp } from './unified/core.js';
export {
  definePath,
  defineRule as defineUnifiedRule,
  defineConstraint as defineUnifiedConstraint,
  defineModule as defineUnifiedModule,
} from './unified/index.js';
export type {
  PathSchema,
  QueryOptions,
  ReactiveRef,
  MutationResult,
  UnifiedRule,
  UnifiedConstraint,
  LivenessConfig,
  PraxisAppConfig,
} from './unified/types.js';

// ── Reactive Git Hooks ──────────────────────────────────────────────────────
// Git hooks fire → Praxis evaluates. No watchers, no daemons.
export {
  buildHookContext,
  evaluateHook,
  executeActions,
  installHooks,
  uninstallHooks,
  initConfig as initHooksConfig,
  loadConfig as loadHooksConfig,
} from './hooks/index.js';
export type {
  GitHookName,
  GitHookContext,
  DiffStat,
  HookAction,
  HookEvalResult,
  PraxisHooksConfig,
} from './hooks/index.js';

// ── Lifecycle Engine ────────────────────────────────────────────────────────
// Full software lifecycle automation. Expectations replace issues.
// Events fire, triggers execute. Pluggable for any team/toolchain.

export {
  // Core (Phase 2)
  createEventBus,
  expectation as lifecycleExpectation,
  defineExpectation,
  classifyExpectation,
  loadExpectations,
  ExpectationBuilder,
  defineTriggers,
  defineLifecycle,
  triggers,
  // Version Engine (Phase 3)
  parseSemver,
  formatSemver,
  calculateBump,
  applyBump,
  incrementPrerelease,
  promoteToStable,
  syncVersions,
  checkVersionConsistency,
  generateChangelogEntry,
  formatChangelog,
  orchestrateVersionBump,
  // QA (Phase 4)
  generateTestCases,
  formatTestCasesAsCode,
  createTestMatrix,
  expandMatrix,
  summarizeQA,
  formatQASummary,
  // Review (Phase 5)
  review,
  // Release (Phase 6)
  releasePipeline,
  // Maintenance (Phase 7)
  maintenance,
  vulnerabilityToExpectation,
  customerReportToExpectation,
  incidentToExpectation,
  // Technical Writer (Phase 8)
  docs,
  defaultTemplates,
  defaultDocsConfig,
  auditDocs,
  planDocsUpdate,
  validateAgainstTemplate,
} from './lifecycle/index.js';

export type {
  // Core types
  LifecycleExpectation,
  ExpectationType,
  ExpectationPriority,
  LifecycleEventName,
  LifecycleEvent,
  LifecycleConfig,
  TriggerAction,
  TriggerContext,
  TriggerResult,
  TriggerDefinition,
  ClassificationResult,
  VersioningConfig,
  QAConfig,
  EventBus,
  EventBusOptions,
  DispatchResult,
  TriggerMap,
  // Version types
  SemverVersion,
  BumpType,
  VersionBumpResult,
  VersionSyncResult,
  ChangelogEntry,
  // QA types
  TestCase,
  TestMatrix,
  QARunResult,
  TestResult,
  QASummary,
  // Review types
  ReviewRequest,
  ReviewResult,
  ReviewComment,
  ReviewCycleState,
  // Release types
  ReleaseState,
  // Maintenance types
  Vulnerability,
  DependencyUpdate,
  CustomerReport,
  Incident,
  // Technical Writer types
  TrackedDocument,
  DocumentType,
  DocumentTemplate,
  TemplateSection,
  DocsAuditResult,
  DocsConfig,
  CodeChange,
  DocsUpdatePlan,
  TemplateValidationResult,
} from './lifecycle/index.js';

// ── Integration Hub ─────────────────────────────────────────────────────────
// Self-improving feedback loop connecting analysis, research, experiments,
// uncertainty, and Chronos for temporal tracking.
export { createHub } from './integration/hub.js';
export type {
  PraxisHub,
  CycleResult,
  SystemHealth,
  HubConfig,
  CausalChainLink,
} from './integration/hub.js';
