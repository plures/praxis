/**
 * Expectations DSL — Core
 *
 * Behavioral declarations for Praxis rules. Instead of writing test
 * assertions, you declare what behaviors you expect from your system.
 *
 * @example
 * ```ts
 * import { expectBehavior, ExpectationSet, verify } from '@plures/praxis/expectations';
 *
 * const expectations = new ExpectationSet({ name: 'settings' });
 *
 * expectations.add(
 *   expectBehavior('settings-saved-toast')
 *     .onlyWhen('settings.diff is non-empty')
 *     .never('when settings panel opens without changes')
 *     .never('when save fails')
 *     .always('includes which settings changed')
 * );
 *
 * const report = verify(registry, expectations);
 * ```
 */

import type {
  ExpectationCondition,
  ConditionResult,
  ExpectationResult,
  VerificationReport,
  ExpectationSetOptions,
  VerifiableRegistry,
  VerifiableDescriptor,
} from './types.js';

// ─── Expectation Class ──────────────────────────────────────────────────────

/**
 * A behavioral expectation declaration.
 *
 * Chainable API for declaring conditions under which a behavior
 * should or should not occur.
 */
export class Expectation {
  readonly name: string;
  private _conditions: ExpectationCondition[] = [];

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Declare that this behavior should ONLY occur when a condition is true.
   * If the condition is false, the behavior should NOT occur.
   */
  onlyWhen(condition: string): this {
    this._conditions.push({ description: condition, type: 'onlyWhen' });
    return this;
  }

  /**
   * Declare that this behavior should NEVER occur under a given condition.
   */
  never(condition: string): this {
    this._conditions.push({ description: condition, type: 'never' });
    return this;
  }

  /**
   * Declare that this behavior should ALWAYS have a certain property.
   */
  always(condition: string): this {
    this._conditions.push({ description: condition, type: 'always' });
    return this;
  }

  /** Get all declared conditions. */
  get conditions(): ReadonlyArray<ExpectationCondition> {
    return this._conditions;
  }
}

// ─── ExpectationSet ─────────────────────────────────────────────────────────

/**
 * A collection of expectations for a specific domain.
 */
export class ExpectationSet {
  readonly name: string;
  readonly description: string;
  private _expectations: Expectation[] = [];

  constructor(options: ExpectationSetOptions) {
    this.name = options.name;
    this.description = options.description ?? '';
  }

  /** Add an expectation to the set. */
  add(expectation: Expectation): this {
    this._expectations.push(expectation);
    return this;
  }

  /** Get all expectations in this set. */
  get expectations(): ReadonlyArray<Expectation> {
    return this._expectations;
  }

  /** Number of expectations. */
  get size(): number {
    return this._expectations.length;
  }
}

// ─── Builder Function ───────────────────────────────────────────────────────

/**
 * Create a new behavioral expectation.
 *
 * @example
 * ```ts
 * expectBehavior('settings-saved-toast')
 *   .onlyWhen('settings.diff is non-empty')
 *   .never('when save fails')
 *   .always('includes which settings changed');
 * ```
 */
export function expectBehavior(name: string): Expectation {
  return new Expectation(name);
}

// ─── Verification Engine ────────────────────────────────────────────────────

/**
 * Verify expectations against a rule registry.
 *
 * Walks the rule graph to determine if expectations are satisfied,
 * violated, or unverifiable given the registered rules and contracts.
 */
export function verify(
  registry: VerifiableRegistry,
  expectations: ExpectationSet,
): VerificationReport {
  const rules = registry.getAllRules();
  const constraints = registry.getAllConstraints();
  const ruleIds = registry.getRuleIds();
  const constraintIds = registry.getConstraintIds();

  const allDescriptors: VerifiableDescriptor[] = [...rules, ...constraints];

  const expectationResults: ExpectationResult[] = [];

  for (const exp of expectations.expectations) {
    const result = verifyExpectation(exp, allDescriptors, ruleIds, constraintIds);
    expectationResults.push(result);
  }

  const satisfied = expectationResults.filter(r => r.status === 'satisfied').length;
  const violated = expectationResults.filter(r => r.status === 'violated').length;
  const partial = expectationResults.filter(r => r.status === 'partial').length;

  const allEdgeCases = expectationResults.flatMap(r => r.edgeCases);
  const allMitigations = expectationResults.flatMap(r => r.mitigations);

  return {
    setName: expectations.name,
    timestamp: new Date().toISOString(),
    status: violated > 0 ? 'violated' : partial > 0 ? 'partial' : 'satisfied',
    expectations: expectationResults,
    summary: {
      total: expectationResults.length,
      satisfied,
      violated,
      partial,
    },
    allEdgeCases,
    allMitigations,
  };
}

// ─── Internal Verification Logic ────────────────────────────────────────────

function verifyExpectation(
  expectation: Expectation,
  descriptors: VerifiableDescriptor[],
  ruleIds: string[],
  _constraintIds: string[],
): ExpectationResult {
  const conditionResults: ConditionResult[] = [];
  const edgeCases: string[] = [];
  const mitigations: string[] = [];

  // Find rules/constraints that might be related to this expectation
  const related = findRelatedDescriptors(expectation.name, descriptors);

  for (const condition of expectation.conditions) {
    const result = verifyCondition(condition, expectation.name, related, ruleIds);
    conditionResults.push(result);

    // Discover edge cases
    if (result.status === 'unverifiable') {
      edgeCases.push(`Cannot verify "${condition.description}" for "${expectation.name}" — no covering rule/contract found`);
      mitigations.push(`Add a rule or constraint that explicitly covers: ${condition.description}`);
    } else if (result.status === 'violated') {
      edgeCases.push(`"${expectation.name}" may fire incorrectly: ${condition.description}`);
      mitigations.push(`Review rule logic for "${expectation.name}" regarding: ${condition.description}`);
    }
  }

  const satisfiedCount = conditionResults.filter(r => r.status === 'satisfied').length;
  const violatedCount = conditionResults.filter(r => r.status === 'violated').length;
  const total = conditionResults.length;

  let status: 'satisfied' | 'violated' | 'partial';
  if (total === 0) {
    status = 'satisfied'; // no conditions = vacuously true
  } else if (violatedCount > 0) {
    status = 'violated';
  } else if (satisfiedCount === total) {
    status = 'satisfied';
  } else {
    status = 'partial';
  }

  return {
    name: expectation.name,
    status,
    conditions: conditionResults,
    edgeCases,
    mitigations,
  };
}

/**
 * Check if two text strings share enough semantic overlap.
 * Extracts significant words and checks overlap ratio.
 */
function textOverlaps(a: string, b: string): boolean {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
    'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'when',
    'that', 'this', 'it', 'its', 'and', 'or', 'but', 'not', 'no', 'if', 'then',
    'than', 'so', 'up', 'out', 'about', 'just', 'must']);

  const wordsA = a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const wordsB = b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  if (wordsA.length === 0 || wordsB.length === 0) return false;

  // Check for stem overlap (simple: one word starts with the other's prefix)
  const matches = wordsA.filter(wa =>
    wordsB.some(wb => wa.startsWith(wb.slice(0, 4)) || wb.startsWith(wa.slice(0, 4)))
  );

  const minWords = Math.min(wordsA.length, wordsB.length);
  return matches.length >= Math.max(1, Math.ceil(minWords * 0.5));
}

function verifyCondition(
  condition: ExpectationCondition,
  expectationName: string,
  relatedDescriptors: VerifiableDescriptor[],
  _ruleIds: string[],
): ConditionResult {
  if (relatedDescriptors.length === 0) {
    return {
      condition,
      status: 'unverifiable',
      explanation: `No rules or constraints found related to "${expectationName}"`,
      relatedRules: [],
    };
  }

  const relatedIds = relatedDescriptors.map(d => d.id);
  const condLower = condition.description.toLowerCase();

  /** Check if text matches against a target string (includes or fuzzy overlap). */
  const matches = (target: string): boolean =>
    target.toLowerCase().includes(condLower) ||
    condLower.includes(target.toLowerCase()) ||
    textOverlaps(condLower, target);

  switch (condition.type) {
    case 'onlyWhen': {
      // Check if any related rule's contract mentions this precondition
      const coveringRule = relatedDescriptors.find(d =>
        d.contract?.examples.some(ex =>
          matches(ex.given) || matches(ex.when),
        ) ||
        d.contract?.invariants.some(inv => matches(inv)),
      );

      if (coveringRule) {
        return {
          condition,
          status: 'satisfied',
          explanation: `Rule "${coveringRule.id}" contract covers precondition: ${condition.description}`,
          relatedRules: relatedIds,
        };
      }

      // Check description match
      const descMatch = relatedDescriptors.find(d => matches(d.description));
      if (descMatch) {
        return {
          condition,
          status: 'satisfied',
          explanation: `Rule "${descMatch.id}" description addresses: ${condition.description}`,
          relatedRules: relatedIds,
        };
      }

      return {
        condition,
        status: 'unverifiable',
        explanation: `No rule contract explicitly covers the precondition: ${condition.description}`,
        relatedRules: relatedIds,
      };
    }

    case 'never': {
      // Check if any constraint/rule prevents this condition via invariants or negative examples
      const preventingDescriptor = relatedDescriptors.find(d =>
        d.contract?.invariants.some(inv => matches(inv)) ||
        d.contract?.examples.some(ex =>
          (matches(ex.given) || matches(ex.when)) &&
          (ex.then.toLowerCase().includes('retract') ||
           ex.then.toLowerCase().includes('fail') ||
           ex.then.toLowerCase().includes('violation') ||
           ex.then.toLowerCase().includes('skip') ||
           ex.then.toLowerCase().includes('block') ||
           ex.then.toLowerCase().includes('no ')),
        ) ||
        d.contract?.behavior.toLowerCase().includes('block') ||
        d.contract?.behavior.toLowerCase().includes('prevent'),
      );

      if (preventingDescriptor) {
        return {
          condition,
          status: 'satisfied',
          explanation: `Constraint/rule "${preventingDescriptor.id}" prevents: ${condition.description}`,
          relatedRules: relatedIds,
        };
      }

      return {
        condition,
        status: 'unverifiable',
        explanation: `No rule or constraint explicitly prevents: ${condition.description}`,
        relatedRules: relatedIds,
      };
    }

    case 'always': {
      // Check if any rule's contract guarantees this property
      const guaranteeing = relatedDescriptors.find(d =>
        d.contract?.invariants.some(inv => matches(inv)) ||
        d.contract?.behavior && matches(d.contract.behavior),
      );

      if (guaranteeing) {
        return {
          condition,
          status: 'satisfied',
          explanation: `Rule "${guaranteeing.id}" guarantees: ${condition.description}`,
          relatedRules: relatedIds,
        };
      }

      // Check examples for the guarantee
      const exampleMatch = relatedDescriptors.find(d =>
        d.contract?.examples.some(ex => matches(ex.then)),
      );

      if (exampleMatch) {
        return {
          condition,
          status: 'satisfied',
          explanation: `Rule "${exampleMatch.id}" example demonstrates: ${condition.description}`,
          relatedRules: relatedIds,
        };
      }

      return {
        condition,
        status: 'unverifiable',
        explanation: `No rule contract guarantees: ${condition.description}`,
        relatedRules: relatedIds,
      };
    }
  }
}

/**
 * Find descriptors related to an expectation by name matching.
 * Uses fuzzy matching against rule IDs, descriptions, contracts, and event types.
 */
function findRelatedDescriptors(
  expectationName: string,
  descriptors: VerifiableDescriptor[],
): VerifiableDescriptor[] {
  const nameLower = expectationName.toLowerCase();
  const nameParts = nameLower.split(/[-_./\s]+/);

  return descriptors.filter(d => {
    const idLower = d.id.toLowerCase();
    const descLower = d.description.toLowerCase();
    const behaviorLower = d.contract?.behavior?.toLowerCase() ?? '';

    // Direct match
    if (idLower.includes(nameLower) || nameLower.includes(idLower)) return true;
    if (descLower.includes(nameLower)) return true;
    if (behaviorLower.includes(nameLower)) return true;

    // Part-based match (at least 2 parts must match for multi-part names)
    const minParts = Math.min(2, nameParts.length);
    const matchingParts = nameParts.filter(part =>
      part.length > 2 && (idLower.includes(part) || descLower.includes(part) || behaviorLower.includes(part)),
    );
    if (matchingParts.length >= minParts) return true;

    // Event type match
    if (d.eventTypes) {
      const eventStr = Array.isArray(d.eventTypes) ? d.eventTypes.join(' ') : d.eventTypes;
      if (eventStr.toLowerCase().includes(nameLower)) return true;
    }

    return false;
  });
}

/**
 * Format a verification report as human-readable text.
 */
export function formatVerificationReport(report: VerificationReport): string {
  const lines: string[] = [];
  const icon = report.status === 'satisfied' ? '✅' : report.status === 'partial' ? '🟡' : '🔴';

  lines.push(`${icon} Expectations: ${report.setName} — ${report.status.toUpperCase()}`);
  lines.push(`   ${report.summary.satisfied}/${report.summary.total} satisfied, ${report.summary.violated} violated, ${report.summary.partial} partial`);
  lines.push('');

  for (const exp of report.expectations) {
    const expIcon = exp.status === 'satisfied' ? '✅' : exp.status === 'partial' ? '🟡' : '🔴';
    lines.push(`${expIcon} ${exp.name}`);

    for (const cond of exp.conditions) {
      const condIcon = cond.status === 'satisfied' ? '  ✓' : cond.status === 'violated' ? '  ✗' : '  ?';
      lines.push(`${condIcon} [${cond.condition.type}] ${cond.condition.description}`);
      lines.push(`      ${cond.explanation}`);
    }

    if (exp.edgeCases.length > 0) {
      lines.push('  Edge cases:');
      for (const ec of exp.edgeCases) {
        lines.push(`    ⚠️ ${ec}`);
      }
    }
    lines.push('');
  }

  if (report.allMitigations.length > 0) {
    lines.push('Suggested mitigations:');
    for (const m of report.allMitigations) {
      lines.push(`  💡 ${m}`);
    }
  }

  return lines.join('\n');
}
