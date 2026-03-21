/**
 * Decision Ledger — Analyzer Types
 *
 * Types for the graph analysis engine that understands the entire rule graph
 * and finds what's missing, broken, or unreachable.
 */

// ─── Dependency Graph ───────────────────────────────────────────────────────

/** A node in the fact dependency graph */
export interface FactNode {
  /** The fact tag */
  tag: string;
  /** Rules that produce this fact */
  producedBy: string[];
  /** Rules that read/consume this fact */
  consumedBy: string[];
}

/** An edge in the dependency graph (rule → fact or fact → rule) */
export interface DependencyEdge {
  from: string;
  to: string;
  type: 'produces' | 'consumes';
}

/** The full dependency graph */
export interface DependencyGraph {
  /** Fact nodes keyed by tag */
  facts: Map<string, FactNode>;
  /** All edges */
  edges: DependencyEdge[];
  /** Rule IDs that produce facts */
  producers: Map<string, string[]>; // ruleId → fact tags produced
  /** Rule IDs that consume facts */
  consumers: Map<string, string[]>; // ruleId → fact tags consumed
}

// ─── Derivation Chains ──────────────────────────────────────────────────────

/** A single step in a derivation chain */
export interface DerivationStep {
  type: 'event' | 'rule-fired' | 'fact-produced' | 'fact-read';
  id: string; // event tag, rule id, or fact tag
  description: string;
}

/** A chain showing how a fact was derived */
export interface DerivationChain {
  /** The target fact tag */
  targetFact: string;
  /** Ordered steps from origin to target */
  steps: DerivationStep[];
  /** Depth of the chain */
  depth: number;
}

// ─── Dead Rules ─────────────────────────────────────────────────────────────

/** A rule that can never fire given known event types */
export interface DeadRule {
  ruleId: string;
  description: string;
  /** Event types the rule requires */
  requiredEventTypes: string[];
  /** Why it's dead */
  reason: string;
}

// ─── Unreachable States ─────────────────────────────────────────────────────

/** A fact combination that no rule sequence can produce */
export interface UnreachableState {
  /** The fact tags that can't be produced together */
  factTags: string[];
  /** Why it's unreachable */
  reason: string;
}

// ─── Shadowed Rules ─────────────────────────────────────────────────────────

/** A rule that always loses to another */
export interface ShadowedRule {
  /** The shadowed rule */
  ruleId: string;
  /** The rule that shadows it */
  shadowedBy: string;
  /** Shared event types */
  sharedEventTypes: string[];
  /** Why it's shadowed */
  reason: string;
}

// ─── Contradictions ─────────────────────────────────────────────────────────

/** Two rules that produce conflicting facts */
export interface Contradiction {
  /** First rule */
  ruleA: string;
  /** Second rule */
  ruleB: string;
  /** The conflicting fact tag */
  conflictingTag: string;
  /** Description of the conflict */
  reason: string;
}

// ─── Gaps ───────────────────────────────────────────────────────────────────

/** An expected behavior with no covering rule */
export interface Gap {
  /** The expectation name */
  expectationName: string;
  /** What's missing */
  description: string;
  /** Related rule IDs that partially cover */
  partialCoverage: string[];
  /** The type of gap */
  type: 'no-rule' | 'partial-coverage' | 'no-contract';
}

// ─── Impact Analysis ────────────────────────────────────────────────────────

/** Impact of removing a fact */
export interface ImpactReport {
  /** The fact being analyzed */
  factTag: string;
  /** Rules that would stop firing */
  affectedRules: string[];
  /** Facts that would disappear (transitively) */
  affectedFacts: string[];
  /** Total downstream impact depth */
  depth: number;
}

// ─── Contract Verification ──────────────────────────────────────────────────

/** Result of running a contract example against its rule */
export interface ExampleVerification {
  /** The example index */
  index: number;
  /** Given/When/Then description */
  given: string;
  when: string;
  expectedThen: string;
  /** Whether it passed */
  passed: boolean;
  /** Actual output if different */
  actualOutput?: string;
  /** Error if execution failed */
  error?: string;
}

/** Contract verification result for a single rule */
export interface ContractVerificationResult {
  ruleId: string;
  /** Example verification results */
  examples: ExampleVerification[];
  /** Whether all examples passed */
  allPassed: boolean;
  /** Number of passing examples */
  passCount: number;
  /** Number of failing examples */
  failCount: number;
}

/** Invariant check result */
export interface InvariantCheck {
  /** The invariant statement */
  invariant: string;
  /** The rule it belongs to */
  ruleId: string;
  /** Whether it holds */
  holds: boolean;
  /** Explanation */
  explanation: string;
}

/** Contract gap finding (deeper than registration-time) */
export interface ContractCoverageGap {
  ruleId: string;
  /** What's not covered */
  description: string;
  /** Type of gap */
  type: 'missing-edge-case' | 'missing-error-path' | 'missing-boundary' | 'cross-reference-broken';
}

/** Cross-reference result */
export interface CrossReference {
  /** Rule whose contract references another rule's facts */
  sourceRuleId: string;
  /** The referenced fact tag */
  referencedFactTag: string;
  /** The rule that produces the referenced fact (or null if missing) */
  producerRuleId: string | null;
  /** Whether the producer exists */
  valid: boolean;
}

// ─── Suggestions ────────────────────────────────────────────────────────────

/** Types of findings that can generate suggestions */
export type FindingType = 'dead-rule' | 'gap' | 'contradiction' | 'unreachable-state' | 'shadowed-rule' | 'contract-gap';

/** An actionable fix suggestion */
export interface Suggestion {
  /** What finding this addresses */
  findingType: FindingType;
  /** Related entity ID */
  entityId: string;
  /** Human-readable suggestion */
  message: string;
  /** Suggested action type */
  action: 'remove' | 'add-rule' | 'modify' | 'merge' | 'add-priority' | 'add-event-type' | 'add-contract';
  /** Priority (higher = more important) */
  priority: number;
  /** Optional code skeleton */
  skeleton?: string;
}

// ─── Full Analysis Report ───────────────────────────────────────────────────

/** The complete analysis report from the decision ledger analyzer */
export interface AnalysisReport {
  /** Timestamp of the analysis */
  timestamp: string;
  /** Fact derivation chains */
  factDerivationChains: DerivationChain[];
  /** Rules that can never fire */
  deadRules: DeadRule[];
  /** Fact combos no rule can produce */
  unreachableStates: UnreachableState[];
  /** Rules always overshadowed by another */
  shadowedRules: ShadowedRule[];
  /** Rules producing conflicting facts */
  contradictions: Contradiction[];
  /** Expected behaviors with no covering rule */
  gaps: Gap[];
  /** Actionable fix suggestions */
  suggestions: Suggestion[];
  /** Summary statistics */
  summary: {
    totalRules: number;
    totalConstraints: number;
    deadRuleCount: number;
    unreachableStateCount: number;
    shadowedRuleCount: number;
    contradictionCount: number;
    gapCount: number;
    suggestionCount: number;
    healthScore: number; // 0-100
  };
}

// ─── Ledger Diff ────────────────────────────────────────────────────────────

/** A change between two analysis runs */
export interface LedgerDiffEntry {
  type: 'added' | 'removed' | 'changed';
  category: 'dead-rule' | 'unreachable-state' | 'shadowed-rule' | 'contradiction' | 'gap' | 'suggestion';
  description: string;
  /** Entity ID (rule, state, etc.) */
  entityId: string;
}

/** Diff between two analysis reports */
export interface LedgerDiff {
  /** Timestamp of the diff */
  timestamp: string;
  /** Before report timestamp */
  beforeTimestamp: string;
  /** After report timestamp */
  afterTimestamp: string;
  /** Changes found */
  changes: LedgerDiffEntry[];
  /** Score change */
  scoreDelta: number;
  /** Summary */
  summary: string;
}
