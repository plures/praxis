/**
 * Experiments Module for Praxis
 * 
 * Sandboxed experimentation framework that enables Praxis to:
 * 1. Test hypotheses about its own domain (fact verification)
 * 2. Test rule modifications in isolation (self-improvement)
 * 3. Test model behavior changes (LLM calibration)
 * 4. Run A/B comparisons of rule strategies
 * 
 * All experiments run in a sandbox — they cannot modify production state.
 * Results flow back as evidence for the uncertainty module.
 * 
 * Key principle: An experiment that disproves a hypothesis is MORE valuable
 * than one that confirms it. We want to know what's wrong, not feel good.
 * 
 * Adapted from design-dojo's lab pattern but extended for logic systems.
 * 
 * @module @plures/praxis/experiments
 */

import { PraxisRegistry } from '../core/rules.js';
import type { RuleDescriptor } from '../core/rules.js';
import { LogicEngine } from '../core/engine.js';
import type { PraxisFact, PraxisEvent } from '../core/protocol.js';

// Safe process shim for cross-env memory tracking
declare const process:
  | { memoryUsage?: () => { heapUsed: number } }
  | undefined;

function getHeapUsed(): number {
  if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

/**
 * Clone a registry into a new isolated instance with compliance checks disabled.
 * The cloned registry shares rule/constraint descriptors by reference (read-only use).
 */
function cloneRegistry<TContext>(source: PraxisRegistry<TContext>): PraxisRegistry<TContext> {
  const clone = new PraxisRegistry<TContext>({ compliance: { enabled: false } });
  for (const rule of source.getAllRules()) {
    clone.registerRule(rule);
  }
  for (const constraint of source.getAllConstraints()) {
    clone.registerConstraint(constraint);
  }
  return clone;
}

/**
 * Clone a registry and replace one rule with a patch descriptor.
 * Used by the sandbox runner when a modify-rule step is executed.
 */
function cloneRegistryWithPatch<TContext>(
  source: PraxisRegistry<TContext>,
  ruleId: string,
  patch: RuleDescriptor<TContext>,
): PraxisRegistry<TContext> {
  const clone = new PraxisRegistry<TContext>({ compliance: { enabled: false } });
  for (const rule of source.getAllRules()) {
    clone.registerRule(rule.id === ruleId ? patch : rule);
  }
  for (const constraint of source.getAllConstraints()) {
    clone.registerConstraint(constraint);
  }
  return clone;
}

// ── Types ──────────────────────────────────────────────────────────────────

/** Lifecycle status of an experiment from drafting through archiving. */
export type ExperimentStatus = 'draft' | 'approved' | 'running' | 'completed' | 'failed' | 'archived';
/** Category of experiment — what aspect of the system is being tested. */
export type ExperimentKind = 
  | 'fact-verification'    // Test whether a fact is still true
  | 'rule-modification'    // Test a rule change in isolation
  | 'model-calibration'    // Test LLM behavior/accuracy
  | 'ab-comparison'        // Compare two strategies
  | 'anomaly-investigation' // Investigate a detected anomaly
  | 'prediction-test'      // Make a prediction and track outcome
  | 'chaos'                // Deliberately break things to test resilience
  ;

/** A sandboxed experiment definition with hypothesis, design, and results. */
export interface Experiment {
  id: string;
  name: string;
  kind: ExperimentKind;
  status: ExperimentStatus;
  /** Research question this experiment addresses */
  researchQuestionId?: string;
  /** What we're testing */
  hypothesis: {
    claim: string;
    confidence: number;
    nullHypothesis: string;  // what would disprove it
  };
  /** Experimental design */
  design: ExperimentDesign;
  /** Sandbox configuration */
  sandbox: SandboxConfig;
  /** Results (populated after completion) */
  results?: ExperimentResults;
  /** Who/what created this */
  author: string;
  /** Approval required before running? */
  requiresApproval: boolean;
  /** Human-readable constraints on what this experiment can do */
  constraints: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  tags: string[];
}

/** Steps, metrics, and resource budget for running an experiment. */
export interface ExperimentDesign {
  /** Steps to execute */
  steps: ExperimentStep[];
  /** What to measure */
  metrics: string[];
  /** How long to run (ms) */
  maxDurationMs: number;
  /** Max resource budget (abstract units) */
  maxResourceBudget: number;
  /** Number of trials for statistical significance */
  trials: number;
  /** Control group configuration (for A/B) */
  control?: {
    description: string;
    steps: ExperimentStep[];
  };
}

/** A single step in an experiment — inject, run, observe, assert, or wait. */
export type ExperimentStep =
  | { kind: 'inject-facts'; facts: Array<{ claim: string; confidence: number }> }
  | { kind: 'inject-events'; events: Array<{ tag: string; payload: Record<string, unknown> }> }
  | { kind: 'run-engine'; maxSteps: number }
  | { kind: 'modify-rule'; ruleId: string; modification: string }
  | { kind: 'observe'; metric: string; description: string }
  | { kind: 'assert'; condition: string; expected: unknown }
  | { kind: 'wait'; durationMs: number }
  | { kind: 'external-query'; source: string; query: string; timeout: number }
  | { kind: 'model-prompt'; prompt: string; expectedPattern?: string; temperature?: number }
  ;

/** Isolation and resource limits for the experiment sandbox. */
export interface SandboxConfig {
  /** Isolation level */
  isolation: 'full' | 'shared-read' | 'none';
  /** Allow network access? */
  networkAccess: boolean;
  /** Allow file system writes? */
  fileSystemWrites: boolean;
  /** Max memory (bytes) */
  maxMemoryBytes: number;
  /** Max execution time (ms) */
  maxExecutionMs: number;
  /** Snapshot production state for the sandbox? */
  snapshotProductionState: boolean;
}

/** Outcomes, observations, and resource usage produced by a completed experiment. */
export interface ExperimentResults {
  /** Did the hypothesis hold? */
  hypothesisSupported: boolean | null;  // null = inconclusive
  /** Statistical confidence in the result */
  confidence: number;
  /** Raw observations */
  observations: Array<{
    metric: string;
    value: unknown;
    timestamp: string;
  }>;
  /** Derived conclusions */
  conclusions: string[];
  /** Facts to update based on results */
  factUpdates: Array<{
    factId: string;
    action: 'create' | 'update-confidence' | 'add-evidence' | 'challenge';
    details: Record<string, unknown>;
  }>;
  /** New research questions generated */
  newQuestions: string[];
  /** Error if the experiment itself failed */
  error?: string;
  /** Resource usage */
  resourceUsage: {
    durationMs: number;
    memoryPeakBytes: number;
    apiCalls: number;
    tokensUsed: number;
  };
}

// ── Experiment Registry ────────────────────────────────────────────────────

/** In-memory registry for tracking and querying experiments by status or kind. */
export class ExperimentRegistry {
  private experiments: Map<string, Experiment> = new Map();

  register(experiment: Experiment): void {
    if (this.experiments.has(experiment.id)) {
      throw new Error(`Experiment "${experiment.id}" already registered`);
    }
    this.experiments.set(experiment.id, experiment);
  }

  get(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  list(filter?: { status?: ExperimentStatus; kind?: ExperimentKind; tag?: string }): Experiment[] {
    let results = Array.from(this.experiments.values());
    if (filter?.status) results = results.filter(e => e.status === filter.status);
    if (filter?.kind) results = results.filter(e => e.kind === filter.kind);
    if (filter?.tag) {
      const tag = filter.tag;
      results = results.filter(e => e.tags.includes(tag));
    }
    return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  updateStatus(id: string, status: ExperimentStatus): void {
    const exp = this.experiments.get(id);
    if (!exp) throw new Error(`Experiment "${id}" not found`);
    exp.status = status;
    if (status === 'running') exp.startedAt = new Date().toISOString();
    if (status === 'completed' || status === 'failed') exp.completedAt = new Date().toISOString();
  }

  setResults(id: string, results: ExperimentResults): void {
    const exp = this.experiments.get(id);
    if (!exp) throw new Error(`Experiment "${id}" not found`);
    exp.results = results;
    exp.status = results.error ? 'failed' : 'completed';
    exp.completedAt = new Date().toISOString();
  }
}

// ── Sandbox Runner ─────────────────────────────────────────────────────────

/** Interface for a sandbox runner that executes experiments in isolation. */
export interface SandboxRunner {
  /**
   * Execute an experiment in a sandboxed environment.
   * The sandbox guarantees:
   * - No mutation of production fact store
   * - No side effects beyond the sandbox
   * - Resource limits enforced
   * - Timeout enforced
   */
  run(experiment: Experiment): Promise<ExperimentResults>;
}

/**
 * Create a sandbox runner with given constraints.
 *
 * The runner clones the production registry and engine state into an isolated
 * sandbox, then executes the experiment steps (inject-facts → run-engine →
 * observe → assert) without touching production state.
 *
 * @param config.productionRegistry  Optional registry to clone into the sandbox.
 * @param config.productionEngine    Optional engine whose state (context + facts)
 *                                   seeds the sandbox.
 * @param config.rulePatches         Map of ruleId → patched descriptor applied when
 *                                   a `modify-rule` step targets that rule.
 * @param config.productionFacts     Legacy: Map-based fact seed (used when no
 *                                   productionEngine is provided).
 * @param config.productionRules     Legacy: Map-based rule seed (unused in current
 *                                   implementation, reserved for future use).
 * @param config.onResourceExceeded  Optional callback fired when memory or time
 *                                   limits are breached.
 */
export function createSandboxRunner(config: {
  productionFacts?: Map<string, unknown>;
  productionRules?: Map<string, unknown>;
  productionRegistry?: PraxisRegistry;
  productionEngine?: LogicEngine;
  rulePatches?: Map<string, RuleDescriptor<unknown>>;
  onResourceExceeded?: (metric: string, value: number, limit: number) => void;
}): SandboxRunner {
  return {
    async run(experiment: Experiment): Promise<ExperimentResults> {
      const startTime = Date.now();
      const memoryBaseline = getHeapUsed();
      const observations: ExperimentResults['observations'] = [];
      let apiCalls = 0;
      const tokensUsed = 0;
      let memoryPeakBytes = 0;

      // Assertion tracking for hypothesis evaluation
      const assertionResults: Array<{ condition: string; passed: boolean }> = [];

      try {
        // ── Sandbox state ──────────────────────────────────────────────────
        // Clone the production registry (if provided) so rule modifications
        // in the sandbox never touch the production instance.
        let sandboxRegistry: PraxisRegistry<unknown> = config.productionRegistry
          ? cloneRegistry(config.productionRegistry as PraxisRegistry<unknown>)
          : new PraxisRegistry<unknown>({ compliance: { enabled: false } });

        // Seed sandbox facts from the production engine state (or fallback map).
        const seedFacts: PraxisFact[] = config.productionEngine
          ? [...config.productionEngine.getFacts()]
          : config.productionFacts
            ? Array.from(config.productionFacts.entries()).map(([key, val]) => ({
                tag: key,
                payload: val,
              }))
            : [];

        const seedContext: unknown = config.productionEngine
          ? config.productionEngine.getContext()
          : {};

        // Current sandbox engine — rebuilt when rules are patched mid-experiment
        let sandboxEngine: LogicEngine<unknown> | null = null;

        // Accumulated state between steps
        let pendingFacts: PraxisFact[] = [...seedFacts];
        let pendingEvents: PraxisEvent[] = [];

        // ── Step execution ────────────────────────────────────────────────
        for (const step of experiment.design.steps) {
          // Enforce timeout
          const elapsed = Date.now() - startTime;
          if (elapsed > experiment.sandbox.maxExecutionMs) {
            config.onResourceExceeded?.('timeout', elapsed, experiment.sandbox.maxExecutionMs);
            throw new Error(`Experiment timed out after ${experiment.sandbox.maxExecutionMs}ms`);
          }

          // Track peak memory
          const currentMem = getHeapUsed();
          const usedMem = currentMem - memoryBaseline;
          if (usedMem > memoryPeakBytes) memoryPeakBytes = usedMem;
          if (
            experiment.sandbox.maxMemoryBytes > 0 &&
            usedMem > experiment.sandbox.maxMemoryBytes
          ) {
            config.onResourceExceeded?.('memory', usedMem, experiment.sandbox.maxMemoryBytes);
            throw new Error(
              `Sandbox memory limit exceeded: ${usedMem} > ${experiment.sandbox.maxMemoryBytes} bytes`,
            );
          }

          switch (step.kind) {
            case 'inject-facts': {
              for (const fact of step.facts) {
                const praxisFact: PraxisFact = {
                  tag: fact.claim,
                  payload: { claim: fact.claim, confidence: fact.confidence },
                };
                pendingFacts.push(praxisFact);
                observations.push({
                  metric: 'fact-injected',
                  value: fact.claim,
                  timestamp: new Date().toISOString(),
                });
              }
              break;
            }

            case 'inject-events': {
              for (const evt of step.events) {
                const praxisEvent: PraxisEvent = {
                  tag: evt.tag,
                  payload: evt.payload,
                };
                pendingEvents.push(praxisEvent);
              }
              observations.push({
                metric: 'events-injected',
                value: step.events.map(e => e.tag),
                timestamp: new Date().toISOString(),
              });
              break;
            }

            case 'run-engine': {
              // Build a fresh engine seeded with pending facts
              const initialContext: unknown = sandboxEngine ? sandboxEngine.getContext() : seedContext;
              const initialFacts: PraxisFact[] = [
                ...(sandboxEngine ? sandboxEngine.getFacts() : []),
                ...pendingFacts,
              ];
              const runEngine: LogicEngine<unknown> = new LogicEngine<unknown>({
                initialContext,
                initialFacts,
                registry: sandboxRegistry,
                factDedup: 'last-write-wins',
              });
              pendingFacts = [];

              // Run up to maxSteps, processing all collected events in one step
              const eventsToProcess = [...pendingEvents];
              pendingEvents = [];

              let stepsRun = 0;
              const effectiveMaxSteps = Math.max(1, step.maxSteps);
              const batchSize = Math.max(1, Math.ceil(eventsToProcess.length / effectiveMaxSteps));
              let offset = 0;
              while (offset < eventsToProcess.length && stepsRun < effectiveMaxSteps) {
                const batch = eventsToProcess.slice(offset, offset + batchSize);
                runEngine.step(batch);
                offset += batchSize;
                stepsRun++;

                // Re-check timeout inside engine loop
                if (Date.now() - startTime > experiment.sandbox.maxExecutionMs) {
                  throw new Error(
                    `Experiment timed out after ${experiment.sandbox.maxExecutionMs}ms`,
                  );
                }
              }

              // If no events were pending, still run once to process existing state
              if (eventsToProcess.length === 0) {
                runEngine.step([]);
              }

              sandboxEngine = runEngine;

              const finalFactCount: number = sandboxEngine.getFacts().length;
              observations.push({
                metric: 'engine-ran',
                value: { steps: stepsRun || 1, factCount: finalFactCount },
                timestamp: new Date().toISOString(),
              });
              break;
            }

            case 'modify-rule': {
              // Look for a pre-defined patch in the config
              const patch = config.rulePatches?.get(step.ruleId) as
                | RuleDescriptor<unknown>
                | undefined;

              if (patch) {
                // Rebuild sandbox registry with patched rule — production unaffected
                sandboxRegistry = cloneRegistryWithPatch(sandboxRegistry, step.ruleId, patch);

                // If an engine already ran, rebuild it with the new registry
                if (sandboxEngine) {
                  const prevFacts: PraxisFact[] = sandboxEngine.getFacts();
                  const prevCtx: unknown = sandboxEngine.getContext();
                  sandboxEngine = new LogicEngine<unknown>({
                    initialContext: prevCtx,
                    initialFacts: prevFacts,
                    registry: sandboxRegistry,
                    factDedup: 'last-write-wins',
                  });
                }
              }

              observations.push({
                metric: 'rule-modified',
                value: {
                  ruleId: step.ruleId,
                  modification: step.modification,
                  applied: !!patch,
                },
                timestamp: new Date().toISOString(),
              });
              break;
            }

            case 'observe': {
              const engineFacts = sandboxEngine?.getFacts() ?? [];
              observations.push({
                metric: step.metric,
                value: {
                  description: step.description,
                  factCount: engineFacts.length,
                  facts: engineFacts,
                },
                timestamp: new Date().toISOString(),
              });
              break;
            }

            case 'assert': {
              let passed = false;
              let actual: unknown = undefined;

              if (sandboxEngine) {
                const facts = sandboxEngine.getFacts();
                const factExists = facts.some(f => f.tag === step.condition);

                if (typeof step.expected === 'boolean') {
                  // Condition is a fact tag — check presence
                  actual = factExists;
                  passed = factExists === step.expected;
                } else {
                  // Check last observation matching the condition metric.
                  // NOTE: uses JSON.stringify for deep equality — property order matters
                  // and circular references are not supported. Use primitive or simple
                  // object `expected` values for reliable comparisons.
                  const lastObs = [...observations]
                    .reverse()
                    .find(o => o.metric === step.condition);
                  actual = lastObs?.value;
                  passed = JSON.stringify(actual) === JSON.stringify(step.expected);
                }
              } else {
                // No engine: compare against observations.
                // NOTE: uses JSON.stringify for deep equality — see note above.
                const lastObs = [...observations]
                  .reverse()
                  .find(o => o.metric === step.condition);
                actual = lastObs?.value;
                passed = JSON.stringify(actual) === JSON.stringify(step.expected);
              }

              assertionResults.push({ condition: step.condition, passed });
              observations.push({
                metric: passed ? 'assertion-passed' : 'assertion-failed',
                value: { condition: step.condition, expected: step.expected, actual },
                timestamp: new Date().toISOString(),
              });
              break;
            }

            case 'wait': {
              const waitMs = Math.min(step.durationMs, 5000);
              const remainingMs = experiment.sandbox.maxExecutionMs - (Date.now() - startTime);

              if (remainingMs <= 0) {
                const elapsed = Date.now() - startTime;
                config.onResourceExceeded?.('timeout', elapsed, experiment.sandbox.maxExecutionMs);
                throw new Error(
                  `Experiment timed out after ${experiment.sandbox.maxExecutionMs}ms`,
                );
              }

              // Race the wait against the remaining execution budget
              await Promise.race([
                new Promise<void>(resolve => setTimeout(resolve, waitMs)),
                new Promise<never>((_, reject) =>
                  setTimeout(() => {
                    const elapsed = Date.now() - startTime;
                    config.onResourceExceeded?.(
                      'timeout',
                      elapsed,
                      experiment.sandbox.maxExecutionMs,
                    );
                    reject(
                      new Error(
                        `Experiment timed out after ${experiment.sandbox.maxExecutionMs}ms`,
                      ),
                    );
                  }, remainingMs),
                ),
              ]);
              break;
            }

            case 'model-prompt':
              apiCalls++;
              // Model prompts are executed by the caller's LLM integration
              observations.push({
                metric: 'model-prompt-queued',
                value: step.prompt.slice(0, 200),
                timestamp: new Date().toISOString(),
              });
              break;

            case 'external-query':
              apiCalls++;
              observations.push({
                metric: 'external-query-queued',
                value: { source: step.source, query: step.query },
                timestamp: new Date().toISOString(),
              });
              break;

            default:
              observations.push({
                metric: 'step-skipped',
                value: (step as ExperimentStep).kind,
                timestamp: new Date().toISOString(),
              });
          }
        }

        const durationMs = Date.now() - startTime;

        // Derive hypothesis support from assertion results
        let hypothesisSupported: boolean | null = null;
        if (assertionResults.length > 0) {
          hypothesisSupported = assertionResults.every(a => a.passed);
        }

        const failedAssertions = assertionResults.filter(a => !a.passed).length;
        const confidence =
          assertionResults.length > 0
            ? (assertionResults.length - failedAssertions) / assertionResults.length
            : 0;

        return {
          hypothesisSupported,
          confidence,
          observations,
          conclusions: hypothesisSupported === true
            ? ['All assertions passed — hypothesis supported']
            : hypothesisSupported === false
              ? [`${failedAssertions} assertion(s) failed — hypothesis not supported`]
              : [],
          factUpdates: [],
          newQuestions: [],
          resourceUsage: { durationMs, memoryPeakBytes, apiCalls, tokensUsed },
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        return {
          hypothesisSupported: null,
          confidence: 0,
          observations,
          conclusions: [],
          factUpdates: [],
          newQuestions: [],
          error,
          resourceUsage: {
            durationMs: Date.now() - startTime,
            memoryPeakBytes,
            apiCalls,
            tokensUsed,
          },
        };
      }
    },
  };
}

// ── Experiment Factories ───────────────────────────────────────────────────

/**
 * Create a fact verification experiment from a research question.
 */
export function createFactVerification(opts: {
  factId: string;
  claim: string;
  currentConfidence: number;
  verificationSteps: ExperimentStep[];
  researchQuestionId?: string;
}): Experiment {
  return {
    id: `exp.verify.${opts.factId}.${Date.now()}`,
    name: `Verify: ${opts.claim}`,
    kind: 'fact-verification',
    status: 'draft',
    researchQuestionId: opts.researchQuestionId,
    hypothesis: {
      claim: opts.claim,
      confidence: opts.currentConfidence,
      nullHypothesis: `"${opts.claim}" is no longer true or was never true`,
    },
    design: {
      steps: opts.verificationSteps,
      metrics: ['verification-result', 'evidence-strength'],
      maxDurationMs: 60_000,
      maxResourceBudget: 100,
      trials: 1,
    },
    sandbox: {
      isolation: 'shared-read',
      networkAccess: true,   // may need to query APIs
      fileSystemWrites: false,
      maxMemoryBytes: 50 * 1024 * 1024,
      maxExecutionMs: 60_000,
      snapshotProductionState: true,
    },
    author: 'praxis-research',
    requiresApproval: false,
    constraints: ['Read-only access to production state', 'No side effects'],
    createdAt: new Date().toISOString(),
    tags: ['auto-generated', 'fact-verification'],
  };
}

/**
 * Create a rule modification experiment.
 * Tests a proposed rule change in isolation before applying to production.
 */
export function createRuleExperiment(opts: {
  ruleId: string;
  modification: string;
  testCases: Array<{ input: ExperimentStep[]; expectedOutcome: string }>;
}): Experiment {
  const steps: ExperimentStep[] = [];
  for (const tc of opts.testCases) {
    steps.push(...tc.input);
    steps.push({ kind: 'run-engine', maxSteps: 10 });
    steps.push({ kind: 'observe', metric: 'rule-output', description: tc.expectedOutcome });
  }

  return {
    id: `exp.rule.${opts.ruleId}.${Date.now()}`,
    name: `Test rule modification: ${opts.ruleId}`,
    kind: 'rule-modification',
    status: 'draft',
    hypothesis: {
      claim: `Modifying "${opts.ruleId}" (${opts.modification}) improves behavior`,
      confidence: 0.5,
      nullHypothesis: 'The modification has no effect or causes regressions',
    },
    design: {
      steps,
      metrics: ['rule-fires', 'rule-output-quality', 'regressions'],
      maxDurationMs: 120_000,
      maxResourceBudget: 200,
      trials: opts.testCases.length,
    },
    sandbox: {
      isolation: 'full',
      networkAccess: false,
      fileSystemWrites: false,
      maxMemoryBytes: 100 * 1024 * 1024,
      maxExecutionMs: 120_000,
      snapshotProductionState: true,
    },
    author: 'praxis-research',
    requiresApproval: true,
    constraints: ['Full isolation — no production access', 'Rule changes are sandbox-only'],
    createdAt: new Date().toISOString(),
    tags: ['auto-generated', 'rule-modification', 'self-improvement'],
  };
}

/**
 * Create a model calibration experiment.
 * Tests whether the assigned LLM produces expected outputs for known inputs.
 * This is how Praxis can help improve its own model.
 */
export function createModelCalibration(opts: {
  modelId: string;
  testPrompts: Array<{
    prompt: string;
    expectedPattern: string;
    category: string;
  }>;
  temperature?: number;
}): Experiment {
  const steps: ExperimentStep[] = opts.testPrompts.map(tp => ({
    kind: 'model-prompt' as const,
    prompt: tp.prompt,
    expectedPattern: tp.expectedPattern,
    temperature: opts.temperature ?? 0,
  }));

  return {
    id: `exp.model.${opts.modelId}.${Date.now()}`,
    name: `Calibrate model: ${opts.modelId}`,
    kind: 'model-calibration',
    status: 'draft',
    hypothesis: {
      claim: `Model "${opts.modelId}" produces accurate outputs for ${opts.testPrompts.length} test cases`,
      confidence: 0.7,
      nullHypothesis: `Model fails on ≥20% of test cases`,
    },
    design: {
      steps,
      metrics: ['accuracy', 'latency', 'consistency', 'hallucination-rate'],
      maxDurationMs: 300_000,
      maxResourceBudget: 500,
      trials: opts.testPrompts.length,
    },
    sandbox: {
      isolation: 'full',
      networkAccess: true,  // needs model API
      fileSystemWrites: false,
      maxMemoryBytes: 50 * 1024 * 1024,
      maxExecutionMs: 300_000,
      snapshotProductionState: false,
    },
    author: 'praxis-research',
    requiresApproval: true,
    constraints: [
      'API calls only — no side effects',
      'Budget-capped: max 500 resource units',
      'Results logged but never applied automatically',
    ],
    createdAt: new Date().toISOString(),
    tags: ['auto-generated', 'model-calibration', 'self-improvement'],
  };
}

/**
 * Create an A/B comparison experiment.
 * Runs two rule strategies against the same inputs and compares outcomes.
 */
export function createABComparison(opts: {
  name: string;
  strategyA: { label: string; steps: ExperimentStep[] };
  strategyB: { label: string; steps: ExperimentStep[] };
  comparisonMetrics: string[];
  inputSteps: ExperimentStep[];
}): Experiment {
  return {
    id: `exp.ab.${opts.name.replace(/\s+/g, '-').toLowerCase()}.${Date.now()}`,
    name: `A/B: ${opts.strategyA.label} vs ${opts.strategyB.label}`,
    kind: 'ab-comparison',
    status: 'draft',
    hypothesis: {
      claim: `"${opts.strategyA.label}" outperforms "${opts.strategyB.label}" on ${opts.comparisonMetrics.join(', ')}`,
      confidence: 0.5,
      nullHypothesis: 'No significant difference between strategies',
    },
    design: {
      steps: [...opts.inputSteps, ...opts.strategyA.steps],
      metrics: opts.comparisonMetrics,
      maxDurationMs: 120_000,
      maxResourceBudget: 300,
      trials: 2,
      control: {
        description: opts.strategyB.label,
        steps: [...opts.inputSteps, ...opts.strategyB.steps],
      },
    },
    sandbox: {
      isolation: 'full',
      networkAccess: false,
      fileSystemWrites: false,
      maxMemoryBytes: 100 * 1024 * 1024,
      maxExecutionMs: 120_000,
      snapshotProductionState: true,
    },
    author: 'praxis-research',
    requiresApproval: true,
    constraints: ['Both strategies run in full isolation', 'Same inputs, different processing'],
    createdAt: new Date().toISOString(),
    tags: ['auto-generated', 'ab-comparison'],
  };
}
