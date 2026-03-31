/**
 * Typed Rule Results
 *
 * Rules must always return a RuleResult — never an empty array.
 * A rule that has nothing to say returns RuleResult.noop().
 * This makes every rule evaluation traceable and eliminates
 * the ambiguity of "did the rule run but produce nothing,
 * or did it not run at all?"
 */

import type { PraxisFact } from './protocol.js';

/**
 * The result of evaluating a rule. Every rule MUST return one of:
 * - `RuleResult.emit(facts)` — rule produced facts
 * - `RuleResult.noop(reason?)` — rule evaluated but had nothing to say
 * - `RuleResult.skip(reason?)` — rule decided to skip (preconditions not met)
 * - `RuleResult.retract(tags)` — rule retracts previously emitted facts
 */
export class RuleResult {
  /** The kind of result */
  readonly kind: 'emit' | 'noop' | 'skip' | 'retract';
  /** Facts produced (only for 'emit') */
  readonly facts: PraxisFact[];
  /** Fact tags to retract (only for 'retract') */
  readonly retractTags: string[];
  /** Optional reason (for noop/skip/retract — useful for debugging) */
  readonly reason?: string;
  /** The rule ID that produced this result (set by engine) */
  ruleId?: string;

  private constructor(
    kind: 'emit' | 'noop' | 'skip' | 'retract',
    facts: PraxisFact[],
    retractTags: string[],
    reason?: string,
  ) {
    this.kind = kind;
    this.facts = facts;
    this.retractTags = retractTags;
    this.reason = reason;
  }

  /**
   * Rule produced facts.
   *
   * @example
   * return RuleResult.emit([
   *   { tag: 'sprint.behind', payload: { deficit: 5 } }
   * ]);
   */
  static emit(facts: PraxisFact[]): RuleResult {
    if (facts.length === 0) {
      throw new Error(
        'RuleResult.emit() requires at least one fact. ' +
        'Use RuleResult.noop() or RuleResult.skip() when a rule has nothing to say.'
      );
    }
    return new RuleResult('emit', facts, []);
  }

  /**
   * Rule evaluated but had nothing to report.
   * Unlike returning [], this is explicit and traceable.
   *
   * @example
   * if (ctx.completedHours >= expectedHours) {
   *   return RuleResult.noop('Sprint is on pace');
   * }
   */
  static noop(reason?: string): RuleResult {
    return new RuleResult('noop', [], [], reason);
  }

  /**
   * Rule decided to skip because preconditions were not met.
   * Distinct from noop: skip means "I can't evaluate", noop means "I evaluated and found nothing".
   *
   * @example
   * if (!ctx.sprintName) {
   *   return RuleResult.skip('No active sprint');
   * }
   */
  static skip(reason?: string): RuleResult {
    return new RuleResult('skip', [], [], reason);
  }

  /**
   * Rule retracts previously emitted facts by tag.
   * Used when a condition that previously produced facts is no longer true.
   *
   * @example
   * // Sprint was behind, but caught up
   * if (ctx.completedHours >= expectedHours) {
   *   return RuleResult.retract(['sprint.behind'], 'Sprint caught up');
   * }
   */
  static retract(tags: string[], reason?: string): RuleResult {
    if (tags.length === 0) {
      throw new Error('RuleResult.retract() requires at least one tag.');
    }
    return new RuleResult('retract', [], tags, reason);
  }

  /** Whether this result produced facts */
  get hasFacts(): boolean {
    return this.facts.length > 0;
  }

  /** Whether this result retracts facts */
  get hasRetractions(): boolean {
    return this.retractTags.length > 0;
  }
}

/**
 * A rule function that returns a typed RuleResult.
 * New API — replaces the old PraxisFact[] return type.
 */
export type TypedRuleFn<TContext = unknown> = (
  state: import('./protocol.js').PraxisState & { context: TContext; events: import('./protocol.js').PraxisEvent[] },
  events: import('./protocol.js').PraxisEvent[]
) => RuleResult;

/**
 * Convenience helper to create a typed fact object.
 *
 * Shorthand for `{ tag, payload }` used inside `RuleResult.emit()` calls.
 *
 * @param tag - The fact type tag (e.g. `'sprint.behind'`)
 * @param payload - The fact payload data
 * @returns A {@link PraxisFact} with the given tag and payload
 *
 * @example
 * return RuleResult.emit([fact('sprint.behind', { deficit: 3 })]);
 */
export function fact(tag: string, payload: unknown): PraxisFact {
  return { tag, payload };
}
