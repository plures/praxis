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

// ── Types ──────────────────────────────────────────────────────────────────

export type ExperimentStatus = 'draft' | 'approved' | 'running' | 'completed' | 'failed' | 'archived';
export type ExperimentKind = 
  | 'fact-verification'    // Test whether a fact is still true
  | 'rule-modification'    // Test a rule change in isolation
  | 'model-calibration'    // Test LLM behavior/accuracy
  | 'ab-comparison'        // Compare two strategies
  | 'anomaly-investigation' // Investigate a detected anomaly
  | 'prediction-test'      // Make a prediction and track outcome
  | 'chaos'                // Deliberately break things to test resilience
  ;

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
 * The runner clones the production state and runs the experiment
 * in isolation, then returns results without modifying anything.
 */
export function createSandboxRunner(config: {
  productionFacts?: Map<string, unknown>;
  productionRules?: Map<string, unknown>;
  onResourceExceeded?: (metric: string, value: number, limit: number) => void;
}): SandboxRunner {
  return {
    async run(experiment: Experiment): Promise<ExperimentResults> {
      const startTime = Date.now();
      const observations: ExperimentResults['observations'] = [];
      let apiCalls = 0;
      let tokensUsed = 0;

      try {
        // Clone production state into sandbox
        const sandboxFacts = config.productionFacts
          ? new Map(config.productionFacts)
          : new Map();

        // Execute steps
        for (const step of experiment.design.steps) {
          // Check timeout
          if (Date.now() - startTime > experiment.sandbox.maxExecutionMs) {
            throw new Error(`Experiment timed out after ${experiment.sandbox.maxExecutionMs}ms`);
          }

          switch (step.kind) {
            case 'inject-facts':
              for (const fact of step.facts) {
                sandboxFacts.set(`sandbox.${fact.claim}`, fact);
                observations.push({
                  metric: 'fact-injected',
                  value: fact.claim,
                  timestamp: new Date().toISOString(),
                });
              }
              break;

            case 'observe':
              observations.push({
                metric: step.metric,
                value: step.description,
                timestamp: new Date().toISOString(),
              });
              break;

            case 'wait':
              await new Promise(resolve => setTimeout(resolve, Math.min(step.durationMs, 5000)));
              break;

            case 'model-prompt':
              apiCalls++;
              // Model prompts would be executed by the caller's LLM integration
              observations.push({
                metric: 'model-prompt-queued',
                value: step.prompt.slice(0, 200),
                timestamp: new Date().toISOString(),
              });
              break;

            // Other steps would be implemented by specific sandbox providers
            default:
              observations.push({
                metric: 'step-skipped',
                value: step.kind,
                timestamp: new Date().toISOString(),
              });
          }
        }

        const durationMs = Date.now() - startTime;

        return {
          hypothesisSupported: null, // needs evaluation
          confidence: 0,
          observations,
          conclusions: [],
          factUpdates: [],
          newQuestions: [],
          resourceUsage: { durationMs, memoryPeakBytes: 0, apiCalls, tokensUsed },
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
            memoryPeakBytes: 0,
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
