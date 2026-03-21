/**
 * Auto-Recording Hooks — wire ProjectChronicle into PraxisRegistry & LogicEngine
 *
 * Opt-in: call `enableProjectChronicle(registry, engine)` to start recording.
 * The hooks use Proxy wrapping to intercept method calls without modifying
 * the original classes.
 */

import type { PraxisRegistry, RuleDescriptor, PraxisModule } from '../core/rules.js';
import type { LogicEngine } from '../core/engine.js';
import type { PraxisEvent, PraxisStepResult, PraxisDiagnostics } from '../core/protocol.js';
import { ProjectChronicle, createProjectChronicle } from './project-chronicle.js';
import type { CompletenessReport } from '../core/completeness.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Handle returned by enableProjectChronicle for cleanup. */
export interface ChronicleHandle {
  /** The underlying chronicle being written to. */
  chronicle: ProjectChronicle;
  /** Disconnect all hooks (restores original methods). */
  disconnect: () => void;
}

/** Options for enabling project chronicle hooks. */
export interface EnableChronicleOptions {
  /** Provide an existing chronicle (otherwise a new one is created). */
  chronicle?: ProjectChronicle;
  /** Record engine step results (fact production/retraction). Default: true. */
  recordSteps?: boolean;
  /** Record constraint check results. Default: true. */
  recordConstraints?: boolean;
}

// ─── Hook Implementation ────────────────────────────────────────────────────

/**
 * Enable project-level chronicle recording.
 *
 * Wraps registry's `registerRule`, `registerModule` and engine's `step`,
 * `checkConstraints` methods to automatically record events.
 *
 * @returns A handle with the chronicle and a `disconnect()` to undo all hooks.
 *
 * @example
 * ```ts
 * const { chronicle, disconnect } = enableProjectChronicle(registry, engine);
 * registry.registerRule(myRule); // auto-recorded
 * engine.step(events);          // step results auto-recorded
 * console.log(chronicle.size);  // number of events recorded
 * disconnect();                 // stop recording
 * ```
 */
export function enableProjectChronicle<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
  engine: LogicEngine<TContext>,
  options: EnableChronicleOptions = {},
): ChronicleHandle {
  const chronicle = options.chronicle ?? createProjectChronicle();
  const recordSteps = options.recordSteps ?? true;
  const recordConstraints = options.recordConstraints ?? true;

  // Keep originals for cleanup
  const origRegisterRule = registry.registerRule.bind(registry);
  const origRegisterModule = registry.registerModule.bind(registry);
  const origStep = engine.step.bind(engine);
  const origCheckConstraints = engine.checkConstraints.bind(engine);

  // ── Hook: registerRule ──────────────────────────────────────────────────

  registry.registerRule = function hookedRegisterRule(
    descriptor: RuleDescriptor<TContext>,
  ): void {
    origRegisterRule(descriptor);
    chronicle.recordRuleRegistered(descriptor.id, {
      description: descriptor.description,
      hasContract: !!descriptor.contract,
      eventTypes: descriptor.eventTypes,
    });
    if (descriptor.contract) {
      chronicle.recordContractAdded(descriptor.id, {
        behavior: descriptor.contract.behavior,
        examplesCount: descriptor.contract.examples?.length ?? 0,
        invariantsCount: descriptor.contract.invariants?.length ?? 0,
      });
    }
  };

  // ── Hook: registerModule ────────────────────────────────────────────────

  registry.registerModule = function hookedRegisterModule(
    module: PraxisModule<TContext>,
  ): void {
    // Call original (which calls registerRule/registerConstraint internally)
    // But we need to unhook registerRule temporarily to avoid double recording.
    // Instead, record the module-level event and let the rules record individually.
    origRegisterModule(module);

    // Record a module-level event for each rule that was part of this module
    for (const rule of module.rules) {
      chronicle.recordRuleRegistered(rule.id, {
        description: rule.description,
        hasContract: !!rule.contract,
        eventTypes: rule.eventTypes,
        registeredVia: 'module',
      });
      if (rule.contract) {
        chronicle.recordContractAdded(rule.id, {
          behavior: rule.contract.behavior,
          examplesCount: rule.contract.examples?.length ?? 0,
          invariantsCount: rule.contract.invariants?.length ?? 0,
        });
      }
    }
  };

  // ── Hook: engine.step ───────────────────────────────────────────────────

  if (recordSteps) {
    engine.step = function hookedStep(events: PraxisEvent[]): PraxisStepResult {
      const result = origStep(events);

      // Record each fact that was produced
      const factTags = new Set<string>();
      for (const fact of result.state.facts) {
        factTags.add(fact.tag);
      }

      // Record step event
      chronicle.record({
        kind: 'build',
        action: 'step-complete',
        subject: 'engine',
        metadata: {
          eventsProcessed: events.length,
          eventTags: events.map(e => e.tag),
          factsAfter: result.state.facts.length,
          diagnosticsCount: result.diagnostics.length,
        },
      });

      // Record any rule errors or constraint violations
      for (const diag of result.diagnostics) {
        if (diag.kind === 'constraint-violation') {
          chronicle.record({
            kind: 'expectation',
            action: 'violated',
            subject: extractSubjectFromDiag(diag),
            metadata: { message: diag.message, data: diag.data },
          });
        }
      }

      return result;
    };
  }

  // ── Hook: engine.checkConstraints ───────────────────────────────────────

  if (recordConstraints) {
    engine.checkConstraints = function hookedCheckConstraints(): PraxisDiagnostics[] {
      const diagnostics = origCheckConstraints();

      chronicle.record({
        kind: 'build',
        action: 'constraints-checked',
        subject: 'engine',
        metadata: {
          violations: diagnostics.length,
        },
      });

      for (const diag of diagnostics) {
        chronicle.record({
          kind: 'expectation',
          action: 'violated',
          subject: extractSubjectFromDiag(diag),
          metadata: { message: diag.message },
        });
      }

      return diagnostics;
    };
  }

  // ── Disconnect ──────────────────────────────────────────────────────────

  function disconnect(): void {
    registry.registerRule = origRegisterRule;
    registry.registerModule = origRegisterModule;
    engine.step = origStep;
    engine.checkConstraints = origCheckConstraints;
  }

  return { chronicle, disconnect };
}

/**
 * Record a completeness audit result into the chronicle.
 *
 * Standalone utility — call after `auditCompleteness()`.
 */
export function recordAudit(
  chronicle: ProjectChronicle,
  report: CompletenessReport,
  previousScore?: number,
): void {
  const delta = previousScore != null ? report.score - previousScore : 0;
  chronicle.recordBuildAudit(report.score, delta, {
    rating: report.rating,
    rulesCovered: report.rules.covered,
    rulesTotal: report.rules.total,
    constraintsCovered: report.constraints.covered,
    constraintsTotal: report.constraints.total,
    contractsCovered: report.contracts.withContracts,
    contractsTotal: report.contracts.total,
  });
}

// ─── Internals ──────────────────────────────────────────────────────────────

function extractSubjectFromDiag(diag: PraxisDiagnostics): string {
  const data = diag.data as Record<string, unknown> | undefined;
  if (data?.constraintId && typeof data.constraintId === 'string') return data.constraintId;
  if (data?.ruleId && typeof data.ruleId === 'string') return data.ruleId;
  return 'unknown';
}
