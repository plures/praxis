# Praxis API

Public API for `@plures/praxis` as exported from `src/index.ts`.

> **Note**: Most APIs are strongly typed; generic parameters are shown where relevant.

## Core Protocol

**Types**
- `PraxisFact` — `{ tag: string; payload: unknown }`
- `PraxisEvent` — `{ tag: string; payload: unknown }`
- `PraxisState` — `{ facts: PraxisFact[]; meta?: Record<string, unknown>; protocolVersion: string }`
- `PraxisDiagnostics` — diagnostics emitted by rule/constraint evaluation
- `PraxisStepConfig` — `{ ruleIds: string[]; constraintIds: string[] }`
- `PraxisStepResult` — `{ state: PraxisState; diagnostics: PraxisDiagnostics[] }`
- `PraxisStepFn` — `(events: PraxisEvent[]) => PraxisStepResult`

**Constants**
- `PRAXIS_PROTOCOL_VERSION: string`

## Rules & Constraints

**Types**
- `RuleId`, `ConstraintId`
- `RuleFn<TContext>` — `(state, events) => PraxisFact[] | RuleResult`
- `ConstraintFn<TContext>` — `(state) => boolean | string`
- `RuleDescriptor<TContext>`
- `ConstraintDescriptor<TContext>`
- `PraxisModule<TContext>` — `{ rules: RuleDescriptor[]; constraints: ConstraintDescriptor[] }`

**Classes**
- `PraxisRegistry<TContext>` — register and query rules/constraints

## Engine

**Types**
- `PraxisEngineOptions<TContext>` — `initialContext`, `registry`, optional `initialFacts`, `initialMeta`, `factDedup`, `maxFacts`

**Classes**
- `LogicEngine<TContext>`
  - `getState(): Readonly<PraxisState & { context: TContext }>`
  - `getContext(): TContext`
  - `getFacts(): PraxisFact[]`
  - `step(events: PraxisEvent[]): PraxisStepResult`
  - `stepWithConfig(events: PraxisEvent[], config: PraxisStepConfig): PraxisStepResult`
  - `stepWithContext(updater: (ctx: TContext) => TContext, events: PraxisEvent[]): PraxisStepResult`
  - `updateContext(updater: (ctx: TContext) => TContext): void`
  - `addFacts(facts: PraxisFact[]): void`
  - `checkConstraints(): PraxisDiagnostics[]`
  - `clearFacts(): void`
  - `reset(options: PraxisEngineOptions<TContext>): void`

**Functions**
- `createPraxisEngine<TContext>(options: PraxisEngineOptions<TContext>): LogicEngine<TContext>`

## Reactive Engine (Framework-agnostic)

**Types**
- `FrameworkAgnosticReactiveEngineOptions`
- `StateChangeCallback`

**Functions / Classes**
- `FrameworkAgnosticReactiveEngine` (alias of `ReactiveLogicEngine`)
- `createFrameworkAgnosticReactiveEngine(options: ReactiveEngineOptions): ReactiveLogicEngine`

## Reactive Engine (Svelte)

- Re-exports from `core/reactive-engine.svelte.js` (Svelte store integration)

## Actors

**Types**
- `Actor`

**Classes / Functions**
- `ActorManager`
- `createTimerActor(): Actor`

## Introspection

**Types**
- `RuleNode`, `ConstraintNode`, `GraphEdge`, `RegistryGraph`
- `RuleSchema`, `ConstraintSchema`, `RegistrySchema`, `RegistryStats`

**Classes / Functions**
- `RegistryIntrospector`
- `createIntrospector(registry: PraxisRegistry): RegistryIntrospector`

## DSL Helpers

**Types**
- `FactDefinition<TTag, TPayload>`
- `EventDefinition<TTag, TPayload>`
- `DefineRuleOptions<TContext>`
- `DefineConstraintOptions<TContext>`
- `DefineModuleOptions<TContext>`

**Functions**
- `defineFact<TTag extends string, TPayload>(tag: TTag): FactDefinition<TTag, TPayload>`
- `defineEvent<TTag extends string, TPayload>(tag: TTag): EventDefinition<TTag, TPayload>`
- `defineRule<TContext>(options: DefineRuleOptions<TContext>): RuleDescriptor<TContext>`
- `defineConstraint<TContext>(options: DefineConstraintOptions<TContext>): ConstraintDescriptor<TContext>`
- `defineModule<TContext>(options: DefineModuleOptions<TContext>): PraxisModule<TContext>`
- `filterEvents<TTag, TPayload>(events: PraxisEvent[], def: EventDefinition<TTag, TPayload>): Array<PraxisEvent & { tag: TTag; payload: TPayload }>`
- `filterFacts<TTag, TPayload>(facts: PraxisFact[], def: FactDefinition<TTag, TPayload>): Array<PraxisFact & { tag: TTag; payload: TPayload }>`
- `findEvent<TTag, TPayload>(events: PraxisEvent[], def: EventDefinition<TTag, TPayload>): (PraxisEvent & { tag: TTag; payload: TPayload }) | undefined`
- `findFact<TTag, TPayload>(facts: PraxisFact[], def: FactDefinition<TTag, TPayload>): (PraxisFact & { tag: TTag; payload: TPayload }) | undefined`

## Decision Ledger (Contracts)

**Types**
- `Assumption`, `Reference`, `Example`, `Contract`, `DefineContractOptions`
- `Severity`, `MissingArtifact`, `ContractGap`, `ValidationReport`
- `ValidateOptions`, `LedgerEntry`, `LedgerEntryStatus`

**Functions / Classes**
- `defineContract(options: DefineContractOptions): Contract`
- `getContract(id: string): Contract | undefined`
- `isContract(value: unknown): value is Contract`
- `validateContracts(contracts: Contract[], options?: ValidateOptions): ValidationReport`
- `formatValidationReport(report: ValidationReport): string`
- `formatValidationReportJSON(report: ValidationReport): string`
- `formatValidationReportSARIF(report: ValidationReport): string`
- `BehaviorLedger` (class)
- `createBehaviorLedger(): BehaviorLedger`

**Events**
- `ContractMissing`, `ContractValidated`, `AcknowledgeContractGap`, `ValidateContracts`, `ContractGapAcknowledged`, `ContractAdded`, `ContractUpdated`

## Decision Ledger — Analyzer

**Types**
- `FactNode`, `DependencyEdge`, `DependencyGraph`, `DerivationStep`, `DerivationChain`
- `DeadRule`, `UnreachableState`, `ShadowedRule`, `Contradiction`, `Gap`
- `ImpactReport`, `ExampleVerification`, `ContractVerificationResult`, `InvariantCheck`
- `ContractCoverageGap`, `CrossReference`, `FindingType`, `Suggestion`, `AnalysisReport`
- `LedgerDiffEntry`, `LedgerDiff`

**Functions**
- `analyzeDependencyGraph(...)`
- `findDeadRules(...)`
- `findUnreachableStates(...)`
- `findShadowedRules(...)`
- `findContradictions(...)`
- `findGaps(...)`
- `traceDerivation(...)`
- `traceImpact(...)`
- `verifyContractExamples(...)`
- `verifyInvariants(...)`
- `findContractGaps(...)`
- `crossReferenceContracts(...)`
- `suggest(...)`
- `suggestAll(...)`
- `generateLedger(...)`
- `formatLedger(...)`
- `formatBuildOutput(...)`
- `diffLedgers(...)`

## Terminal Node Runtime

**Types**
- `TerminalExecutionResult`, `TerminalNodeState`, `TerminalAdapterOptions`, `CommandExecutor`

**Classes / Functions**
- `TerminalAdapter`
- `createTerminalAdapter(options: TerminalAdapterOptions): TerminalAdapter`
- `runTerminalCommand(command: string, options?: TerminalAdapterOptions): TerminalExecutionResult`
- `createMockExecutor(): CommandExecutor`

## Schema Types & Loader

**Types**
- `PraxisSchema`, `NodeDefinition`, `NodeBindings`, `TerminalNodeProps`
- `OrchestrationDefinition`, `ValidationResult`, `ValidationError`
- `ModelDefinition`, `ComponentDefinition`, `LogicDefinition`
- `LoaderOptions`, `LoaderResult`

**Functions**
- `validateSchema(schema: PraxisSchema): ValidationResult`
- `createSchemaTemplate(): PraxisSchema`
- `loadSchema(options: LoaderOptions): Promise<LoaderResult>`
- `loadSchemaFromJson(json: string): LoaderResult`
- `loadSchemaFromYaml(yaml: string): LoaderResult`
- `loadSchemaFromFile(path: string): Promise<LoaderResult>`
- `validateForGeneration(schema: PraxisSchema): ValidationResult`

## PluresDB Integration

**Types**
- `PraxisDB`, `UnsubscribeFn`, `PluresDBInstance`
- `PluresDBAdapterConfig`, `PraxisLocalFirstOptions`, `EventStreamEntry`
- `PraxisDBStoreOptions`, `StoredSchema`, `PluresDBGeneratorOptions`, `GeneratedPluresDBFile`
- `PluresDBAdapter`, `PluresDBAdapterOptions`
- Chronicle types: `TraceDirection`, `EdgeType`, `ChronicleEvent`, `ChronicleNode`, `ChronicleEdge`, `Chronicle`, `ChronicleSpan`, `ChronosTraceParams`, `ChronosSearchParams`, `McpToolResult`, `ChronosMcpTools`

**Constants**
- `PRAXIS_PATHS`, `CHRONICLE_PATHS`

**Classes / Functions**
- `InMemoryPraxisDB`
- `createInMemoryDB(): PraxisDB`
- `PluresDBPraxisAdapter`
- `createPluresDB(config: PluresDBAdapterConfig): PraxisDB`
- `createPraxisLocalFirst(options: PraxisLocalFirstOptions): PraxisDB`
- `PraxisDBStore`
- `createPraxisDBStore(options: PraxisDBStoreOptions): PraxisDBStore`
- `getFactPath(tag: string): string`
- `getEventPath(tag: string): string`
- `generateId(): string`
- `PraxisSchemaRegistry`
- `createSchemaRegistry(): PraxisSchemaRegistry`
- `registerSchema(registry: PraxisSchemaRegistry, schema: PraxisSchema): void`
- `getSchemaPath(schemaId: string): string`
- `PluresDBGenerator`
- `createPluresDBGenerator(options: PluresDBGeneratorOptions): PluresDBGenerator`
- `createPluresDBAdapter(options: PluresDBAdapterOptions): PluresDBAdapter`
- `attachToEngine(engine: LogicEngine, db: PraxisDB): UnsubscribeFn`
- Chronicle helpers: `ChronicleContext`, `PluresDbChronicle`, `createChronicle(...)`, `createChronosMcpTools(...)`

## Unum Integration

**Types**
- `UnumStore`, `UnumChannel`, `UnumMessage`, `UnumIdentity`
- `UnumAdapterConfig`, `UnumAdapter`

**Functions**
- `createUnumAdapter(config: UnumAdapterConfig): UnumAdapter`
- `attachUnumToEngine(engine: LogicEngine, adapter: UnumAdapter): UnsubscribeFn`

## CodeCanvas Integration

**Types**
- `CanvasNode`, `CanvasEdge`, `CanvasNodeStyle`, `CanvasEdgeStyle`, `CanvasDocument`
- `LifecycleState`, `ActivityState`, `CanvasEditorConfig`
- `GuardianResult`, `GuardianError`, `GuardianWarning`

**Functions**
- `schemaToCanvas(schema: PraxisSchema): CanvasDocument`
- `canvasToSchema(doc: CanvasDocument): PraxisSchema`
- `canvasToYaml(doc: CanvasDocument): string`
- `canvasToMermaid(doc: CanvasDocument): string`
- `validateWithGuardian(schema: PraxisSchema): GuardianResult`
- `createCanvasEditor(config: CanvasEditorConfig): unknown`

## State-Docs Integration

**Types**
- `StateDocsConfig`, `GeneratedDoc`, `StateMachineDoc`, `StateDoc`, `TransitionDoc`

**Classes / Functions**
- `StateDocsGenerator`
- `createStateDocsGenerator(config: StateDocsConfig): StateDocsGenerator`
- `generateDocs(config: StateDocsConfig): GeneratedDoc[]`

## Tauri Integration

**Types**
- `TauriAppConfig`, `TauriWindowConfig`, `TauriSecurityConfig`, `TauriUpdateConfig`
- `TauriPlugin`, `TauriCommand`, `TauriEvent`, `TauriFS`, `TauriFileEntry`
- `TauriTray`, `TauriMenuItem`, `TauriNotification`, `TauriNotificationOptions`
- `TauriBridge`, `TauriUpdateInfo`, `TauriPraxisAdapter`

**Functions / Classes**
- `createMockTauriBridge(): TauriBridge`
- `createTauriPraxisAdapter(config: TauriAppConfig): TauriPraxisAdapter`
- `attachTauriToEngine(engine: LogicEngine, adapter: TauriPraxisAdapter): UnsubscribeFn`
- `generateTauriConfig(config: TauriAppConfig): Record<string, unknown>`

## Unified Integration

**Types**
- `UnifiedAppConfig`, `UnifiedApp`, `PraxisApp`, `PraxisAppConfig`
- `PathSchema`, `QueryOptions`, `ReactiveRef`, `MutationResult`
- `UnifiedRule`, `UnifiedConstraint`, `LivenessConfig`

**Functions**
- `createUnifiedApp(config: UnifiedAppConfig): UnifiedApp`
- `attachAllIntegrations(app: UnifiedApp): void`
- `createApp(config: PraxisAppConfig): PraxisApp`
- `definePath(path: string, schema: PathSchema): PathSchema`
- `defineUnifiedRule(...)` (alias of `defineRule` in unified module)
- `defineUnifiedConstraint(...)` (alias of `defineConstraint` in unified module)
- `defineUnifiedModule(...)` (alias of `defineModule` in unified module)

## Rule Result Helpers

**Types**
- `TypedRuleFn<TContext>`

**Values**
- `RuleResult` (class)
- `fact<TTag extends string, TPayload>(tag: TTag, payload: TPayload): RuleResult`

## UI Rules

**Types**
- `UIContext`

**Functions**
- `uiModule()`
- `createUIModule(...)`
- `loadingGateRule(...)`
- `errorDisplayRule(...)`
- `offlineIndicatorRule(...)`
- `dirtyGuardRule(...)`
- `initGateRule(...)`
- `viewportRule(...)`
- `noInteractionWhileLoadingConstraint(...)`
- `mustBeInitializedConstraint(...)`
- `uiStateChanged(...)`
- `navigationRequest(...)`
- `resizeEvent(...)`

## Completeness Analysis

**Types**
- `LogicBranch`, `StateField`, `StateTransition`, `CompletenessReport`, `CompletenessConfig`

**Functions**
- `auditCompleteness(...)`
- `formatReport(report: CompletenessReport): string`

## Analysis Module

**Types**
- `IntrospectionReport` (alias)
- `ModuleAnalysis`, `CoverageReport`, `ConfidenceDistribution`
- `RuleEffectivenessReport`, `DependencyHealthReport`, `PredictionAccuracyReport`
- `Recommendation`, `AnalysisContext`, `Prediction`

**Functions**
- `analyze(context: AnalysisContext): IntrospectionReport`

## Experiments Module

**Types**
- `ExperimentStatus`, `ExperimentKind`, `Experiment`, `ExperimentDesign`, `ExperimentStep`
- `SandboxConfig`, `ExperimentResults`, `SandboxRunner`

**Classes / Functions**
- `ExperimentRegistry`
- `createSandboxRunner(config: SandboxConfig): SandboxRunner`
- `createFactVerification(...)`
- `createRuleExperiment(...)`
- `createModelCalibration(...)`
- `createABComparison(...)`

## Research Module

**Types**
- `ResearchStatus`, `ResearchOrigin`, `ResearchQuestion`, `ResearchAgenda`

**Functions**
- `generateResearchQuestions(...)`
- `buildAgenda(...)`

## Expectations DSL

**Types**
- `Expectation`, `ExpectationSet`, `ExpectationCondition`, `ConditionStatus`, `ConditionResult`
- `ExpectationResult`, `VerificationReport`, `ExpectationSetOptions`
- `VerifiableRegistry`, `VerifiableDescriptor`

**Functions**
- `expectBehavior(...)`
- `verify(...)`
- `formatVerificationReport(...)`

## Rules Factory

**Types**
- `InputRulesConfig`, `ToastRulesConfig`, `FormRulesConfig`, `NavigationRulesConfig`, `DataRulesConfig`, `SanitizationType`

**Functions**
- `inputRules(config: InputRulesConfig)`
- `toastRules(config: ToastRulesConfig)`
- `formRules(config: FormRulesConfig)`
- `navigationRules(config: NavigationRulesConfig)`
- `dataRules(config: DataRulesConfig)`

## Project Logic

**Types**
- `GateConfig`, `GateState`, `GateStatus`, `SemverContractConfig`, `SemverReport`
- `PraxisDiff`, `BranchRulesConfig`, `PredefinedGateConfig`

**Functions**
- `defineGate(...)`
- `semverContract(...)`
- `commitFromState(...)`
- `branchRules(...)`
- `lintGate(...)`
- `formatGate(...)`
- `expectationGate(...)`

## Chronos Project Chronicle

**Types**
- `ProjectEvent`, `ProjectEventKind`, `ProjectChronicleOptions`, `TimelineFilter`
- `BehavioralDelta`, `ChronicleHandle`, `EnableChronicleOptions`
- `RegistrySnapshot`, `RegistryDiff`, `ContractCoverage`, `ContractDiff`
- `ExpectationSnapshot`, `ExpectationDiff`, `FullBehavioralDiff`

**Functions / Classes**
- `ProjectChronicle`
- `createProjectChronicle(...)`
- `Timeline`
- `createTimeline(...)`
- `enableProjectChronicle(...)`
- `recordAudit(...)`
- `diffRegistries(...)`
- `diffContracts(...)`
- `diffExpectations(...)`
- `formatDelta(...)`
- `formatBehavioralCommit(...)`
- `formatReleaseNotes(...)`

## Lifecycle Engine

**Types**
- `LifecycleExpectation`, `ExpectationType`, `ExpectationPriority`
- `LifecycleEventName`, `LifecycleEvent`, `LifecycleConfig`
- `TriggerAction`, `TriggerContext`, `TriggerResult`, `TriggerDefinition`, `ClassificationResult`
- `VersioningConfig`, `QAConfig`, `EventBus`, `EventBusOptions`, `DispatchResult`, `TriggerMap`
- `SemverVersion`, `BumpType`, `VersionBumpResult`, `VersionSyncResult`, `ChangelogEntry`
- `TestCase`, `TestMatrix`, `QARunResult`, `TestResult`, `QASummary`
- `ReviewRequest`, `ReviewResult`, `ReviewComment`, `ReviewCycleState`
- `ReleaseState`, `Vulnerability`, `DependencyUpdate`, `CustomerReport`, `Incident`
- `TrackedDocument`, `DocumentType`, `DocumentTemplate`, `TemplateSection`
- `DocsAuditResult`, `DocsConfig`, `CodeChange`, `DocsUpdatePlan`, `TemplateValidationResult`

**Functions / Classes**
- `createEventBus(options?: EventBusOptions): EventBus`
- `lifecycleExpectation(...)` (alias `expectation`)
- `defineExpectation(...)`
- `classifyExpectation(...)`
- `loadExpectations(...)`
- `ExpectationBuilder`
- `defineTriggers(...)`
- `defineLifecycle(...)`
- `triggers`
- Versioning: `parseSemver(...)`, `formatSemver(...)`, `calculateBump(...)`, `applyBump(...)`, `incrementPrerelease(...)`, `promoteToStable(...)`, `syncVersions(...)`, `checkVersionConsistency(...)`, `generateChangelogEntry(...)`, `formatChangelog(...)`, `orchestrateVersionBump(...)`
- QA: `generateTestCases(...)`, `formatTestCasesAsCode(...)`, `createTestMatrix(...)`, `expandMatrix(...)`, `summarizeQA(...)`, `formatQASummary(...)`
- Review: `review(...)`
- Release: `releasePipeline(...)`
- Maintenance: `maintenance(...)`, `vulnerabilityToExpectation(...)`, `customerReportToExpectation(...)`, `incidentToExpectation(...)`
- Technical Writer: `docs(...)`, `defaultTemplates`, `defaultDocsConfig`, `auditDocs(...)`, `planDocsUpdate(...)`, `validateAgainstTemplate(...)`

## Integration Hub

**Types**
- `PraxisHub`, `CycleResult`, `SystemHealth`, `HubConfig`, `CausalChainLink`

**Functions**
- `createHub(config: HubConfig): PraxisHub`
