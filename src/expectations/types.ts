/**
 * Expectations DSL — Types
 *
 * Types for declaring behavioral expectations about rules.
 * Expectations replace traditional tests with behavioral declarations.
 */

// ─── Core Types ─────────────────────────────────────────────────────────────

/** A condition under which a behavior should or should not occur. */
export interface ExpectationCondition {
  /** Human-readable condition description */
  description: string;
  /** Type of expectation */
  type: 'onlyWhen' | 'never' | 'always';
}

/** Verification status for a single expectation condition. */
export type ConditionStatus = 'satisfied' | 'violated' | 'unverifiable';

/** Detailed result for a single condition check. */
export interface ConditionResult {
  condition: ExpectationCondition;
  status: ConditionStatus;
  /** Explanation of how the condition was verified or why it couldn't be */
  explanation: string;
  /** Related rule IDs that informed this check */
  relatedRules: string[];
}

/** Verification result for a single Expectation. */
export interface ExpectationResult {
  /** The expectation name/ID */
  name: string;
  /** Overall status: satisfied if ALL conditions pass */
  status: 'satisfied' | 'violated' | 'partial';
  /** Per-condition results */
  conditions: ConditionResult[];
  /** Edge cases discovered */
  edgeCases: string[];
  /** Suggested mitigations for violated/partial expectations */
  mitigations: string[];
}

/** Full verification report for an ExpectationSet. */
export interface VerificationReport {
  /** Set name */
  setName: string;
  /** Timestamp of verification */
  timestamp: string;
  /** Overall status: satisfied if ALL expectations are satisfied */
  status: 'satisfied' | 'violated' | 'partial';
  /** Per-expectation results */
  expectations: ExpectationResult[];
  /** Summary stats */
  summary: {
    total: number;
    satisfied: number;
    violated: number;
    partial: number;
  };
  /** All edge cases found across all expectations */
  allEdgeCases: string[];
  /** All mitigations suggested */
  allMitigations: string[];
}

/** Options for creating an ExpectationSet */
export interface ExpectationSetOptions {
  /** Name/domain for this set of expectations */
  name: string;
  /** Optional description */
  description?: string;
}

/** Interface describing a rule or constraint for verification */
export interface VerifiableDescriptor {
  id: string;
  description: string;
  eventTypes?: string | string[];
  contract?: {
    behavior: string;
    examples: Array<{ given: string; when: string; then: string }>;
    invariants: string[];
    ruleId: string;
  };
}

/** Registry-like interface for verification */
export interface VerifiableRegistry {
  getAllRules(): VerifiableDescriptor[];
  getAllConstraints(): VerifiableDescriptor[];
  getRuleIds(): string[];
  getConstraintIds(): string[];
}
