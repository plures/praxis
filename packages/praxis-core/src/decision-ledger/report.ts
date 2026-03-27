/**
 * Decision Ledger — Report Generation
 *
 * Generates the full analysis report, human-readable markdown,
 * CI-friendly output, and diffs between analysis runs.
 */

import type { PraxisRegistry } from '../rules.js';
import type { LogicEngine } from '../engine.js';

interface ExpectationCondition {
  description: string;
  type: string;
}
interface Expectation {
  name: string;
  conditions: ReadonlyArray<ExpectationCondition>;
}
interface ExpectationSet {
  expectations: ReadonlyArray<Expectation>;
}
import type {
  AnalysisReport,
  LedgerDiff,
  LedgerDiffEntry,
} from './analyzer-types.js';
import {
  findDeadRules,
  findUnreachableStates,
  findShadowedRules,
  findContradictions,
  findGaps,
} from './analyzer.js';
import { traceDerivation } from './derivation.js';
import { suggestAll } from './suggestions.js';
import { findContractGaps } from './contract-verification.js';

/**
 * Generate the full analysis report.
 *
 * This is the main entry point for the Decision Ledger analyzer.
 * It runs all analyses and produces a comprehensive report.
 *
 * @param registry - The Praxis registry containing all rules and constraints
 * @param engine - The logic engine instance to analyze current state
 * @param expectations - Optional expectation set to check coverage against
 * @returns A comprehensive {@link AnalysisReport} with dead rules, contradictions, gaps, and health score
 */
export function generateLedger<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
  engine: LogicEngine<TContext>,
  expectations?: ExpectationSet,
): AnalysisReport {
  // Collect all known event types from rules
  const allEventTypes = new Set<string>();
  for (const rule of registry.getAllRules()) {
    if (rule.eventTypes) {
      const types = Array.isArray(rule.eventTypes) ? rule.eventTypes : [rule.eventTypes];
      for (const t of types) allEventTypes.add(t);
    }
  }

  // Run analyses
  const deadRules = findDeadRules(registry, [...allEventTypes]);
  const unreachableStates = findUnreachableStates(registry);
  const shadowedRules = findShadowedRules(registry);
  const contradictions = findContradictions(registry);
  const contractGaps = findContractGaps(registry);
  const gaps = expectations ? findGaps(registry, expectations) : [];

  // Build derivation chains for current facts
  const currentFacts = engine.getFacts();
  const factDerivationChains = currentFacts.map(fact =>
    traceDerivation(fact.tag, engine, registry),
  );

  // Generate suggestions
  const suggestions = suggestAll({
    deadRules,
    gaps,
    contradictions,
    unreachableStates,
    shadowedRules,
    contractGaps,
  });

  // Calculate health score
  const totalRules = registry.getRuleIds().length;
  const totalConstraints = registry.getConstraintIds().length;
  const totalIssues =
    deadRules.length +
    unreachableStates.length +
    shadowedRules.length +
    contradictions.length +
    gaps.length;

  const maxIssues = Math.max(totalRules + totalConstraints, 1);
  const healthScore = Math.max(0, Math.round(100 - (totalIssues / maxIssues) * 100));

  return {
    timestamp: new Date().toISOString(),
    factDerivationChains,
    deadRules,
    unreachableStates,
    shadowedRules,
    contradictions,
    gaps,
    suggestions,
    summary: {
      totalRules,
      totalConstraints,
      deadRuleCount: deadRules.length,
      unreachableStateCount: unreachableStates.length,
      shadowedRuleCount: shadowedRules.length,
      contradictionCount: contradictions.length,
      gapCount: gaps.length,
      suggestionCount: suggestions.length,
      healthScore,
    },
  };
}

/**
 * Format an analysis report as human-readable markdown.
 *
 * @param report - The analysis report from {@link generateLedger}
 * @returns A markdown-formatted string suitable for display in docs or CLI output
 */
export function formatLedger(report: AnalysisReport): string {
  const lines: string[] = [];

  // Header
  const icon = report.summary.healthScore >= 90 ? '✅' : report.summary.healthScore >= 70 ? '🟡' : '🔴';
  lines.push(`# ${icon} Decision Ledger Analysis`);
  lines.push('');
  lines.push(`**Health Score:** ${report.summary.healthScore}/100`);
  lines.push(`**Timestamp:** ${report.timestamp}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Rules | ${report.summary.totalRules} |`);
  lines.push(`| Constraints | ${report.summary.totalConstraints} |`);
  lines.push(`| Dead Rules | ${report.summary.deadRuleCount} |`);
  lines.push(`| Unreachable States | ${report.summary.unreachableStateCount} |`);
  lines.push(`| Shadowed Rules | ${report.summary.shadowedRuleCount} |`);
  lines.push(`| Contradictions | ${report.summary.contradictionCount} |`);
  lines.push(`| Gaps | ${report.summary.gapCount} |`);
  lines.push(`| Suggestions | ${report.summary.suggestionCount} |`);
  lines.push('');

  // Dead Rules
  if (report.deadRules.length > 0) {
    lines.push('## 💀 Dead Rules');
    lines.push('');
    for (const dr of report.deadRules) {
      lines.push(`- **${dr.ruleId}**: ${dr.reason}`);
    }
    lines.push('');
  }

  // Unreachable States
  if (report.unreachableStates.length > 0) {
    lines.push('## 🚫 Unreachable States');
    lines.push('');
    for (const us of report.unreachableStates) {
      lines.push(`- **[${us.factTags.join(', ')}]**: ${us.reason}`);
    }
    lines.push('');
  }

  // Shadowed Rules
  if (report.shadowedRules.length > 0) {
    lines.push('## 👻 Shadowed Rules');
    lines.push('');
    for (const sr of report.shadowedRules) {
      lines.push(`- **${sr.ruleId}** shadowed by **${sr.shadowedBy}**: ${sr.reason}`);
    }
    lines.push('');
  }

  // Contradictions
  if (report.contradictions.length > 0) {
    lines.push('## ⚡ Contradictions');
    lines.push('');
    for (const c of report.contradictions) {
      lines.push(`- **${c.ruleA}** ↔ **${c.ruleB}** on \`${c.conflictingTag}\`: ${c.reason}`);
    }
    lines.push('');
  }

  // Gaps
  if (report.gaps.length > 0) {
    lines.push('## 🕳️ Gaps');
    lines.push('');
    for (const g of report.gaps) {
      lines.push(`- **${g.expectationName}** (${g.type}): ${g.description}`);
    }
    lines.push('');
  }

  // Derivation Chains
  if (report.factDerivationChains.length > 0) {
    lines.push('## 🔗 Fact Derivation Chains');
    lines.push('');
    for (const chain of report.factDerivationChains) {
      if (chain.steps.length === 0) continue;
      lines.push(`### \`${chain.targetFact}\` (depth: ${chain.depth})`);
      for (const step of chain.steps) {
        const icon = step.type === 'event' ? '⚡' : step.type === 'rule-fired' ? '⚙️' : step.type === 'fact-produced' ? '📦' : '📖';
        lines.push(`  ${icon} ${step.description}`);
      }
      lines.push('');
    }
  }

  // Suggestions
  if (report.suggestions.length > 0) {
    lines.push('## 💡 Suggestions');
    lines.push('');
    for (const s of report.suggestions) {
      const priorityIcon = s.priority >= 8 ? '🔴' : s.priority >= 5 ? '🟡' : '🟢';
      lines.push(`${priorityIcon} **[${s.findingType}]** ${s.message}`);
      if (s.skeleton) {
        lines.push('```typescript');
        lines.push(s.skeleton);
        lines.push('```');
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format report as CI-friendly output with warnings and errors.
 *
 * Produces GitHub Actions annotation syntax (`::error::`, `::warning::`) so
 * problems are surfaced inline in CI log output.
 *
 * @param report - The analysis report from {@link generateLedger}
 * @returns A multi-line string with GitHub Actions annotation commands
 */
export function formatBuildOutput(report: AnalysisReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`::group::Decision Ledger Analysis (Score: ${report.summary.healthScore}/100)`);

  // Errors (contradictions, high-priority gaps)
  for (const c of report.contradictions) {
    lines.push(`::error title=Contradiction::Rules "${c.ruleA}" and "${c.ruleB}" both produce "${c.conflictingTag}"`);
  }

  for (const g of report.gaps) {
    if (g.type === 'no-rule') {
      lines.push(`::error title=Missing Rule::No rule covers expectation "${g.expectationName}"`);
    }
  }

  // Warnings
  for (const dr of report.deadRules) {
    lines.push(`::warning title=Dead Rule::Rule "${dr.ruleId}" can never fire (requires [${dr.requiredEventTypes.join(', ')}])`);
  }

  for (const sr of report.shadowedRules) {
    lines.push(`::warning title=Shadowed Rule::Rule "${sr.ruleId}" is always superseded by "${sr.shadowedBy}"`);
  }

  for (const us of report.unreachableStates) {
    lines.push(`::warning title=Unreachable State::Facts [${us.factTags.join(', ')}] cannot be produced together`);
  }

  for (const g of report.gaps) {
    if (g.type === 'partial-coverage') {
      lines.push(`::warning title=Partial Coverage::Expectation "${g.expectationName}" is only partially covered`);
    } else if (g.type === 'no-contract') {
      lines.push(`::warning title=Missing Contract::Rules for "${g.expectationName}" lack contracts`);
    }
  }

  // Summary
  lines.push('');
  lines.push(`Rules: ${report.summary.totalRules} | Constraints: ${report.summary.totalConstraints} | Health: ${report.summary.healthScore}/100`);
  lines.push(`Dead: ${report.summary.deadRuleCount} | Unreachable: ${report.summary.unreachableStateCount} | Shadowed: ${report.summary.shadowedRuleCount} | Contradictions: ${report.summary.contradictionCount} | Gaps: ${report.summary.gapCount}`);

  lines.push('::endgroup::');

  return lines.join('\n');
}

/**
 * Diff two analysis reports to find what changed between them.
 *
 * @param before - The earlier analysis report (baseline)
 * @param after - The later analysis report (current state)
 * @returns A {@link LedgerDiff} listing changes in findings between the two reports
 */
export function diffLedgers(before: AnalysisReport, after: AnalysisReport): LedgerDiff {
  const changes: LedgerDiffEntry[] = [];

  // Dead rules diff
  diffItems(
    before.deadRules,
    after.deadRules,
    dr => dr.ruleId,
    dr => `Dead rule: ${dr.ruleId} — ${dr.reason}`,
    'dead-rule',
    changes,
  );

  // Unreachable states diff
  diffItems(
    before.unreachableStates,
    after.unreachableStates,
    us => us.factTags.join('+'),
    us => `Unreachable state: [${us.factTags.join(', ')}]`,
    'unreachable-state',
    changes,
  );

  // Shadowed rules diff
  diffItems(
    before.shadowedRules,
    after.shadowedRules,
    sr => sr.ruleId,
    sr => `Shadowed rule: ${sr.ruleId} by ${sr.shadowedBy}`,
    'shadowed-rule',
    changes,
  );

  // Contradictions diff
  diffItems(
    before.contradictions,
    after.contradictions,
    c => `${c.ruleA}↔${c.ruleB}`,
    c => `Contradiction: ${c.ruleA} ↔ ${c.ruleB} on ${c.conflictingTag}`,
    'contradiction',
    changes,
  );

  // Gaps diff
  diffItems(
    before.gaps,
    after.gaps,
    g => g.expectationName,
    g => `Gap: ${g.expectationName} (${g.type})`,
    'gap',
    changes,
  );

  const scoreDelta = after.summary.healthScore - before.summary.healthScore;
  const scoreDirection = scoreDelta > 0 ? 'improved' : scoreDelta < 0 ? 'degraded' : 'unchanged';

  return {
    timestamp: new Date().toISOString(),
    beforeTimestamp: before.timestamp,
    afterTimestamp: after.timestamp,
    changes,
    scoreDelta,
    summary: `Score ${scoreDirection} by ${Math.abs(scoreDelta)} points (${before.summary.healthScore} → ${after.summary.healthScore}). ${changes.length} changes: ${changes.filter(c => c.type === 'added').length} added, ${changes.filter(c => c.type === 'removed').length} removed, ${changes.filter(c => c.type === 'changed').length} changed.`,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function diffItems<T>(
  before: T[],
  after: T[],
  getKey: (item: T) => string,
  describe: (item: T) => string,
  category: LedgerDiffEntry['category'],
  changes: LedgerDiffEntry[],
): void {
  const beforeKeys = new Set(before.map(getKey));
  const afterKeys = new Set(after.map(getKey));

  // Added
  for (const item of after) {
    const key = getKey(item);
    if (!beforeKeys.has(key)) {
      changes.push({
        type: 'added',
        category,
        description: describe(item),
        entityId: key,
      });
    }
  }

  // Removed
  for (const item of before) {
    const key = getKey(item);
    if (!afterKeys.has(key)) {
      changes.push({
        type: 'removed',
        category,
        description: describe(item),
        entityId: key,
      });
    }
  }
}
