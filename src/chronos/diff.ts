/**
 * Behavioral Diff Engine
 *
 * Compares registry snapshots, contract coverage, and expectation status
 * to produce human-readable deltas and conventional commit messages.
 *
 * This is the foundation for "commit from state" — describing WHAT changed
 * in behavioral terms rather than file terms.
 */

import type { RuleDescriptor, ConstraintDescriptor } from '../core/rules.js';
import type { PraxisDiff } from '../project/types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Snapshot of a registry's state (used for before/after comparison). */
export interface RegistrySnapshot {
  rules: Map<string, RuleDescriptor> | Array<RuleDescriptor>;
  constraints: Map<string, ConstraintDescriptor> | Array<ConstraintDescriptor>;
}

/** Diff result for registries. */
export interface RegistryDiff {
  rulesAdded: string[];
  rulesRemoved: string[];
  rulesModified: string[];
  constraintsAdded: string[];
  constraintsRemoved: string[];
  constraintsModified: string[];
}

/** Contract coverage snapshot. */
export interface ContractCoverage {
  /** rule id → has contract */
  coverage: Map<string, boolean> | Record<string, boolean>;
}

/** Diff result for contract coverage. */
export interface ContractDiff {
  contractsAdded: string[];
  contractsRemoved: string[];
  coverageBefore: number;
  coverageAfter: number;
}

/** Expectation satisfaction snapshot. */
export interface ExpectationSnapshot {
  /** expectation name → satisfied */
  expectations: Map<string, boolean> | Record<string, boolean>;
}

/** Diff result for expectations. */
export interface ExpectationDiff {
  newlySatisfied: string[];
  newlyViolated: string[];
  unchanged: string[];
}

/** Full behavioral diff combining all dimensions. */
export interface FullBehavioralDiff {
  registry: RegistryDiff;
  contracts: ContractDiff;
  expectations: ExpectationDiff;
}

// ─── Registry Diff ──────────────────────────────────────────────────────────

/**
 * Compare two registry snapshots.
 *
 * Detects rules/constraints that were added, removed, or modified
 * (description or contract changed).
 */
export function diffRegistries(before: RegistrySnapshot, after: RegistrySnapshot): RegistryDiff {
  const beforeRules = toIdMap(before.rules);
  const afterRules = toIdMap(after.rules);
  const beforeConstraints = toIdMap(before.constraints);
  const afterConstraints = toIdMap(after.constraints);

  return {
    rulesAdded: setDiff(afterRules, beforeRules),
    rulesRemoved: setDiff(beforeRules, afterRules),
    rulesModified: findModified(beforeRules, afterRules),
    constraintsAdded: setDiff(afterConstraints, beforeConstraints),
    constraintsRemoved: setDiff(beforeConstraints, afterConstraints),
    constraintsModified: findModified(beforeConstraints, afterConstraints),
  };
}

// ─── Contract Diff ──────────────────────────────────────────────────────────

/**
 * Compare contract coverage between two snapshots.
 */
export function diffContracts(before: ContractCoverage, after: ContractCoverage): ContractDiff {
  const beforeMap = toRecord(before.coverage);
  const afterMap = toRecord(after.coverage);

  const contractsAdded: string[] = [];
  const contractsRemoved: string[] = [];

  // Check for newly added contracts
  for (const [id, has] of Object.entries(afterMap)) {
    if (has && !beforeMap[id]) {
      contractsAdded.push(id);
    }
  }

  // Check for removed contracts
  for (const [id, had] of Object.entries(beforeMap)) {
    if (had && !afterMap[id]) {
      contractsRemoved.push(id);
    }
  }

  const countTrue = (r: Record<string, boolean>) =>
    Object.values(r).filter(Boolean).length;
  const totalBefore = Object.keys(beforeMap).length;
  const totalAfter = Object.keys(afterMap).length;

  return {
    contractsAdded,
    contractsRemoved,
    coverageBefore: totalBefore > 0 ? countTrue(beforeMap) / totalBefore : 0,
    coverageAfter: totalAfter > 0 ? countTrue(afterMap) / totalAfter : 0,
  };
}

// ─── Expectation Diff ───────────────────────────────────────────────────────

/**
 * Compare expectation satisfaction between two snapshots.
 */
export function diffExpectations(
  before: ExpectationSnapshot,
  after: ExpectationSnapshot,
): ExpectationDiff {
  const beforeMap = toRecord(before.expectations);
  const afterMap = toRecord(after.expectations);
  const allKeys = new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]);

  const newlySatisfied: string[] = [];
  const newlyViolated: string[] = [];
  const unchanged: string[] = [];

  for (const key of allKeys) {
    const was = beforeMap[key] ?? false;
    const is = afterMap[key] ?? false;
    if (!was && is) {
      newlySatisfied.push(key);
    } else if (was && !is) {
      newlyViolated.push(key);
    } else {
      unchanged.push(key);
    }
  }

  return { newlySatisfied, newlyViolated, unchanged };
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format a RegistryDiff as a human-readable delta string.
 */
export function formatDelta(diff: RegistryDiff): string {
  const lines: string[] = [];

  if (diff.rulesAdded.length > 0)
    lines.push(`+ Rules added: ${diff.rulesAdded.join(', ')}`);
  if (diff.rulesRemoved.length > 0)
    lines.push(`- Rules removed: ${diff.rulesRemoved.join(', ')}`);
  if (diff.rulesModified.length > 0)
    lines.push(`~ Rules modified: ${diff.rulesModified.join(', ')}`);
  if (diff.constraintsAdded.length > 0)
    lines.push(`+ Constraints added: ${diff.constraintsAdded.join(', ')}`);
  if (diff.constraintsRemoved.length > 0)
    lines.push(`- Constraints removed: ${diff.constraintsRemoved.join(', ')}`);
  if (diff.constraintsModified.length > 0)
    lines.push(`~ Constraints modified: ${diff.constraintsModified.join(', ')}`);

  return lines.length > 0 ? lines.join('\n') : 'No behavioral changes.';
}

/**
 * Generate a conventional commit message from a registry diff.
 *
 * Uses the same logic as `commitFromState` in `project/` but works
 * directly from a RegistryDiff.
 */
export function formatCommitMessage(diff: RegistryDiff): string {
  const praxisDiff: PraxisDiff = {
    rulesAdded: diff.rulesAdded,
    rulesRemoved: diff.rulesRemoved,
    rulesModified: diff.rulesModified,
    contractsAdded: [],
    contractsRemoved: [],
    expectationsAdded: diff.constraintsAdded,
    expectationsRemoved: diff.constraintsRemoved,
    gateChanges: [],
  };

  return commitFromDiff(praxisDiff);
}

/**
 * Aggregate multiple diffs into release notes.
 */
export function formatReleaseNotes(diffs: RegistryDiff[]): string {
  const sections: string[] = [];
  const allAdded: string[] = [];
  const allRemoved: string[] = [];
  const allModified: string[] = [];

  for (const diff of diffs) {
    allAdded.push(...diff.rulesAdded, ...diff.constraintsAdded);
    allRemoved.push(...diff.rulesRemoved, ...diff.constraintsRemoved);
    allModified.push(...diff.rulesModified, ...diff.constraintsModified);
  }

  // Deduplicate
  const added = [...new Set(allAdded)];
  const removed = [...new Set(allRemoved)];
  const modified = [...new Set(allModified)];

  if (added.length > 0) {
    sections.push(`### Added\n${added.map(id => `- ${id}`).join('\n')}`);
  }
  if (modified.length > 0) {
    sections.push(`### Changed\n${modified.map(id => `- ${id}`).join('\n')}`);
  }
  if (removed.length > 0) {
    sections.push(`### Removed\n${removed.map(id => `- ${id}`).join('\n')}`);
  }

  if (sections.length === 0) return 'No behavioral changes in this release.';
  return `## Release Notes\n\n${sections.join('\n\n')}`;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function toIdMap(
  input: Map<string, { id: string; description: string }> | Array<{ id: string; description: string }>,
): Map<string, { id: string; description: string }> {
  if (input instanceof Map) return input;
  const map = new Map<string, { id: string; description: string }>();
  for (const item of input) map.set(item.id, item);
  return map;
}

function setDiff(a: Map<string, unknown>, b: Map<string, unknown>): string[] {
  const result: string[] = [];
  for (const key of a.keys()) {
    if (!b.has(key)) result.push(key);
  }
  return result;
}

function findModified(
  before: Map<string, { id: string; description: string }>,
  after: Map<string, { id: string; description: string }>,
): string[] {
  const result: string[] = [];
  for (const [key, beforeVal] of before) {
    const afterVal = after.get(key);
    if (afterVal && beforeVal.description !== afterVal.description) {
      result.push(key);
    }
  }
  return result;
}

function toRecord(input: Map<string, boolean> | Record<string, boolean>): Record<string, boolean> {
  if (input instanceof Map) {
    const result: Record<string, boolean> = {};
    for (const [k, v] of input) result[k] = v;
    return result;
  }
  return input;
}

// ── Inline commit message generation (mirrors project/project.ts logic) ──

function commitFromDiff(diff: PraxisDiff): string {
  const parts: string[] = [];
  const bodyParts: string[] = [];

  const totalAdded = diff.rulesAdded.length + diff.contractsAdded.length + diff.expectationsAdded.length;
  const totalRemoved = diff.rulesRemoved.length + diff.contractsRemoved.length + diff.expectationsRemoved.length;
  const totalModified = diff.rulesModified.length;

  if (totalAdded > 0 && totalRemoved === 0 && totalModified === 0) {
    if (diff.rulesAdded.length > 0) {
      const scope = inferScope(diff.rulesAdded);
      parts.push(`feat(${scope}): add ${fmtIds(diff.rulesAdded)}`);
    } else if (diff.contractsAdded.length > 0) {
      parts.push(`feat(contracts): add contracts for ${fmtIds(diff.contractsAdded)}`);
    } else {
      parts.push(`feat(expectations): add ${fmtIds(diff.expectationsAdded)}`);
    }
  } else if (totalRemoved > 0 && totalAdded === 0) {
    if (diff.rulesRemoved.length > 0) {
      const scope = inferScope(diff.rulesRemoved);
      parts.push(`refactor(${scope}): remove ${fmtIds(diff.rulesRemoved)}`);
    } else {
      parts.push(`refactor: remove ${totalRemoved} item(s)`);
    }
  } else if (totalModified > 0) {
    const scope = inferScope(diff.rulesModified);
    parts.push(`refactor(${scope}): update ${fmtIds(diff.rulesModified)}`);
  } else {
    parts.push('chore: behavioral state update');
  }

  if (diff.rulesAdded.length > 0) bodyParts.push(`Rules added: ${diff.rulesAdded.join(', ')}`);
  if (diff.rulesRemoved.length > 0) bodyParts.push(`Rules removed: ${diff.rulesRemoved.join(', ')}`);
  if (diff.rulesModified.length > 0) bodyParts.push(`Rules modified: ${diff.rulesModified.join(', ')}`);

  const subject = parts[0] || 'chore: update';
  return bodyParts.length > 0 ? `${subject}\n\n${bodyParts.join('\n')}` : subject;
}

function inferScope(ids: string[]): string {
  if (ids.length === 0) return 'rules';
  const prefixes = ids.map(id => {
    const slash = id.indexOf('/');
    return slash > 0 ? id.slice(0, slash) : id;
  });
  const unique = new Set(prefixes);
  return unique.size === 1 ? prefixes[0] : 'rules';
}

function fmtIds(ids: string[]): string {
  if (ids.length <= 3) return ids.join(', ');
  return `${ids.slice(0, 2).join(', ')} (+${ids.length - 2} more)`;
}
