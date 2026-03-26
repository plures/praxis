/**
 * Praxis Project Logic — Types
 *
 * Types for developer workflow rules: gates, semver contracts,
 * commit generation, and branch management.
 */

// ─── Gates ──────────────────────────────────────────────────────────────────

/** Lifecycle state of a project gate. */
export type GateStatus = 'open' | 'closed' | 'blocked';

/** Configuration for a project gate — what expectations must be met. */
export interface GateConfig {
  /** Expectations that must be satisfied for the gate to open */
  expects: string[];
  /** Action when gate is satisfied */
  onSatisfied?: string;
  /** Action when gate is violated */
  onViolation?: string;
}

/** Runtime state of a gate — which expectations are satisfied or pending. */
export interface GateState {
  name: string;
  status: GateStatus;
  /** Which expectations are satisfied */
  satisfied: string[];
  /** Which expectations are not satisfied */
  unsatisfied: string[];
  /** Timestamp of last status change */
  lastChanged: number;
}

// ─── Semver Contract ────────────────────────────────────────────────────────

/** Configuration for the semantic version consistency contract. */
export interface SemverContractConfig {
  /** Files/sources that contain version strings */
  sources: string[];
  /** Invariants about version consistency */
  invariants: string[];
}

/** Result of a semantic version consistency check. */
export interface SemverReport {
  /** Whether all sources have consistent versions */
  consistent: boolean;
  /** Version found in each source */
  versions: Record<string, string>;
  /** Invariant violations */
  violations: string[];
}

// ─── Commit Generation ──────────────────────────────────────────────────────

/** Diff of rules, contracts, and expectations since the last commit. */
export interface PraxisDiff {
  /** Rules added since last commit */
  rulesAdded: string[];
  /** Rules removed */
  rulesRemoved: string[];
  /** Rules modified */
  rulesModified: string[];
  /** Contracts added */
  contractsAdded: string[];
  /** Contracts removed */
  contractsRemoved: string[];
  /** Expectations added */
  expectationsAdded: string[];
  /** Expectations removed */
  expectationsRemoved: string[];
  /** Gate state changes */
  gateChanges: Array<{ gate: string; from: GateStatus; to: GateStatus }>;
}

// ─── Branch Rules ───────────────────────────────────────────────────────────

/** Naming and merge-condition rules for project branches. */
export interface BranchRulesConfig {
  /** Naming convention pattern (e.g., 'feat/{name}', 'fix/{issue}') */
  naming: string;
  /** Conditions required for merge */
  mergeConditions: string[];
}

// ─── Predefined Gate Configs ────────────────────────────────────────────────

/** Options for enabling and extending a predefined gate. */
export interface PredefinedGateConfig {
  /** Whether to enable this gate */
  enabled?: boolean;
  /** Custom expectations to add */
  additionalExpects?: string[];
}
