/**
 * Praxis Project Logic
 *
 * Developer workflow rules: gates, semver contracts, commit message
 * generation from behavioral deltas, and branch management.
 *
 * @example
 * ```ts
 * import { defineGate, semverContract, commitFromState } from '@plures/praxis/project';
 *
 * const testGate = defineGate('test', {
 *   expects: ['all-tests-pass', 'no-type-errors'],
 *   onSatisfied: 'merge-allowed',
 *   onViolation: 'merge-blocked',
 * });
 *
 * const diff = { rulesAdded: ['auth/login'], ... };
 * const message = commitFromState(diff);
 * // → "feat(rules): add auth/login rule"
 * ```
 */

import type { PraxisModule, RuleDescriptor, ConstraintDescriptor } from '../core/rules.js';
import { RuleResult, fact } from '../core/rule-result.js';
import type {
  GateConfig,
  GateState,
  GateStatus,
  SemverContractConfig,
  SemverReport,
  PraxisDiff,
  BranchRulesConfig,
  PredefinedGateConfig,
} from './types.js';

// ─── Gate System ────────────────────────────────────────────────────────────

/**
 * Context type for gates. Apps extend their context with gate state.
 */
interface GateContext {
  gates?: Record<string, GateState>;
  expectations?: Record<string, boolean>;
}

/**
 * Define a feature gate — a condition that must be satisfied before
 * proceeding with a workflow step (deploy, merge, release, etc.).
 *
 * @example
 * ```ts
 * const testGate = defineGate('test', {
 *   expects: ['all-tests-pass', 'no-type-errors'],
 *   onSatisfied: 'deploy-allowed',
 *   onViolation: 'deploy-blocked',
 * });
 * registry.registerModule(testGate);
 * ```
 */
export function defineGate(name: string, config: GateConfig): PraxisModule<GateContext> {
  const { expects, onSatisfied, onViolation } = config;

  const rule: RuleDescriptor<GateContext> = {
    id: `gate/${name}`,
    description: `Feature gate: ${name} — requires: ${expects.join(', ')}`,
    eventTypes: ['gate.check', `gate.${name}.check`],
    contract: {
      ruleId: `gate/${name}`,
      behavior: `Opens gate "${name}" when all expectations are met: ${expects.join(', ')}`,
      examples: [
        {
          given: `all expectations satisfied: ${expects.join(', ')}`,
          when: 'gate checked',
          then: `gate.${name}.open emitted${onSatisfied ? ` → ${onSatisfied}` : ''}`,
        },
        {
          given: 'one or more expectations unsatisfied',
          when: 'gate checked',
          then: `gate.${name}.blocked emitted${onViolation ? ` → ${onViolation}` : ''}`,
        },
      ],
      invariants: [
        `Gate "${name}" must never open with unsatisfied expectations`,
        'Gate status must reflect current expectation state exactly',
      ],
    },
    impl: (state, events) => {
      const gateEvent = events.find(e =>
        e.tag === 'gate.check' || e.tag === `gate.${name}.check`,
      );
      if (!gateEvent) return RuleResult.skip('No gate check event');

      const expectationState = state.context.expectations ?? {};
      const satisfied: string[] = [];
      const unsatisfied: string[] = [];

      for (const exp of expects) {
        if (expectationState[exp]) {
          satisfied.push(exp);
        } else {
          unsatisfied.push(exp);
        }
      }

      const status: GateStatus = unsatisfied.length === 0 ? 'open' : 'blocked';
      const gateState: GateState = {
        name,
        status,
        satisfied,
        unsatisfied,
        lastChanged: Date.now(),
      };

      const facts = [fact(`gate.${name}.status`, gateState)];

      if (status === 'open' && onSatisfied) {
        facts.push(fact(`gate.${name}.action`, { action: onSatisfied }));
      } else if (status === 'blocked' && onViolation) {
        facts.push(fact(`gate.${name}.action`, { action: onViolation }));
      }

      return RuleResult.emit(facts);
    },
  };

  const constraint: ConstraintDescriptor<GateContext> = {
    id: `gate/${name}/integrity`,
    description: `Ensures gate "${name}" status matches expectation reality`,
    contract: {
      ruleId: `gate/${name}/integrity`,
      behavior: `Validates that gate "${name}" is not open when expectations are unmet`,
      examples: [
        {
          given: `gate ${name} is open but expectations unmet`,
          when: 'constraint checked',
          then: 'violation',
        },
      ],
      invariants: [`Gate "${name}" must never report open when expectations are unsatisfied`],
    },
    impl: (state) => {
      const gateState = state.context.gates?.[name];
      if (!gateState) return true; // gate not yet evaluated
      if (gateState.status === 'open' && gateState.unsatisfied.length > 0) {
        return `Gate "${name}" is open but has unsatisfied expectations: ${gateState.unsatisfied.join(', ')}`;
      }
      return true;
    },
  };

  return { rules: [rule], constraints: [constraint] };
}

// ─── Semver Contract ────────────────────────────────────────────────────────

/**
 * Create a semver contract module that checks version consistency
 * across multiple sources (package.json, Cargo.toml, etc.).
 *
 * @example
 * ```ts
 * const version = semverContract({
 *   sources: ['package.json', 'src/version.ts', 'README.md'],
 *   invariants: ['All sources must have the same version'],
 * });
 * ```
 */
export function semverContract(config: SemverContractConfig): PraxisModule {
  const { sources, invariants } = config;

  const rule: RuleDescriptor = {
    id: 'project/semver-check',
    description: `Checks version consistency across: ${sources.join(', ')}`,
    eventTypes: ['project.version-check'],
    contract: {
      ruleId: 'project/semver-check',
      behavior: `Verifies version consistency across ${sources.length} sources`,
      examples: [
        {
          given: 'all sources have version 1.2.3',
          when: 'version check runs',
          then: 'semver.consistent emitted',
        },
        {
          given: 'package.json has 1.2.3 but README has 1.2.2',
          when: 'version check runs',
          then: 'semver.inconsistent emitted with diff',
        },
      ],
      invariants: invariants.length > 0
        ? invariants
        : ['All version sources must report the same semver string'],
    },
    impl: (_state, events) => {
      const checkEvent = events.find(e => e.tag === 'project.version-check');
      if (!checkEvent) return RuleResult.skip('No version check event');

      const versions = (checkEvent.payload as { versions?: Record<string, string> })?.versions ?? {};
      const versionValues = Object.values(versions);
      const unique = new Set(versionValues);

      if (unique.size <= 1) {
        return RuleResult.emit([
          fact('semver.consistent', {
            version: versionValues[0] ?? 'unknown',
            sources: Object.keys(versions),
          }),
        ]);
      }

      const report: SemverReport = {
        consistent: false,
        versions,
        violations: [`Version mismatch: ${JSON.stringify(versions)}`],
      };

      return RuleResult.emit([fact('semver.inconsistent', report)]);
    },
  };

  return { rules: [rule], constraints: [] };
}

// ─── Commit Message Generation ──────────────────────────────────────────────

/**
 * Generate a conventional commit message from a behavioral delta.
 *
 * Unlike file-based commit messages, this describes WHAT behavioral
 * changes occurred — rule additions, contract changes, expectation shifts.
 *
 * @example
 * ```ts
 * const msg = commitFromState({
 *   rulesAdded: ['auth/login', 'auth/logout'],
 *   contractsAdded: ['auth/login'],
 *   ...empty
 * });
 * // → "feat(rules): add auth/login, auth/logout\n\nContracts added: auth/login"
 * ```
 */
export function commitFromState(diff: PraxisDiff): string {
  const parts: string[] = [];
  const bodyParts: string[] = [];

  // Determine type from the dominant change
  const totalAdded = diff.rulesAdded.length + diff.contractsAdded.length + diff.expectationsAdded.length;
  const totalRemoved = diff.rulesRemoved.length + diff.contractsRemoved.length + diff.expectationsRemoved.length;
  const totalModified = diff.rulesModified.length;
  const hasGateChanges = diff.gateChanges.length > 0;

  // Build subject line
  if (totalAdded > 0 && totalRemoved === 0 && totalModified === 0) {
    // Pure addition
    if (diff.rulesAdded.length > 0) {
      const scope = inferScope(diff.rulesAdded);
      parts.push(`feat(${scope}): add ${formatIds(diff.rulesAdded)}`);
    } else if (diff.contractsAdded.length > 0) {
      parts.push(`feat(contracts): add contracts for ${formatIds(diff.contractsAdded)}`);
    } else {
      parts.push(`feat(expectations): add ${formatIds(diff.expectationsAdded)}`);
    }
  } else if (totalRemoved > 0 && totalAdded === 0) {
    // Pure removal
    if (diff.rulesRemoved.length > 0) {
      const scope = inferScope(diff.rulesRemoved);
      parts.push(`refactor(${scope}): remove ${formatIds(diff.rulesRemoved)}`);
    } else {
      parts.push(`refactor: remove ${totalRemoved} item(s)`);
    }
  } else if (totalModified > 0) {
    // Modification
    const scope = inferScope(diff.rulesModified);
    parts.push(`refactor(${scope}): update ${formatIds(diff.rulesModified)}`);
  } else if (hasGateChanges) {
    const gateNames = diff.gateChanges.map(g => g.gate);
    parts.push(`chore(gates): ${formatIds(gateNames)} state changed`);
  } else {
    parts.push('chore: behavioral state update');
  }

  // Build body
  if (diff.rulesAdded.length > 0) bodyParts.push(`Rules added: ${diff.rulesAdded.join(', ')}`);
  if (diff.rulesRemoved.length > 0) bodyParts.push(`Rules removed: ${diff.rulesRemoved.join(', ')}`);
  if (diff.rulesModified.length > 0) bodyParts.push(`Rules modified: ${diff.rulesModified.join(', ')}`);
  if (diff.contractsAdded.length > 0) bodyParts.push(`Contracts added: ${diff.contractsAdded.join(', ')}`);
  if (diff.contractsRemoved.length > 0) bodyParts.push(`Contracts removed: ${diff.contractsRemoved.join(', ')}`);
  if (diff.expectationsAdded.length > 0) bodyParts.push(`Expectations added: ${diff.expectationsAdded.join(', ')}`);
  if (diff.expectationsRemoved.length > 0) bodyParts.push(`Expectations removed: ${diff.expectationsRemoved.join(', ')}`);
  for (const gc of diff.gateChanges) {
    bodyParts.push(`Gate "${gc.gate}": ${gc.from} → ${gc.to}`);
  }

  const subject = parts[0] || 'chore: update';
  return bodyParts.length > 0 ? `${subject}\n\n${bodyParts.join('\n')}` : subject;
}

function inferScope(ids: string[]): string {
  // Extract common prefix as scope
  if (ids.length === 0) return 'rules';
  const prefixes = ids.map(id => {
    const slash = id.indexOf('/');
    return slash > 0 ? id.slice(0, slash) : id;
  });
  const unique = new Set(prefixes);
  return unique.size === 1 ? prefixes[0] : 'rules';
}

function formatIds(ids: string[]): string {
  if (ids.length <= 3) return ids.join(', ');
  return `${ids.slice(0, 2).join(', ')} (+${ids.length - 2} more)`;
}

// ─── Branch Rules ───────────────────────────────────────────────────────────

/**
 * Create branch management rules.
 *
 * @example
 * ```ts
 * const branches = branchRules({
 *   naming: 'feat/{name}',
 *   mergeConditions: ['tests-pass', 'review-approved'],
 * });
 * ```
 */
export function branchRules(config: BranchRulesConfig): PraxisModule {
  const { naming, mergeConditions } = config;

  const namePattern = naming.replace('{name}', '(.+)').replace('{issue}', '(\\d+)');
  const nameRegex = new RegExp(`^${namePattern}$`);

  const rule: RuleDescriptor = {
    id: 'project/branch-check',
    description: `Validates branch naming (${naming}) and merge conditions`,
    eventTypes: ['project.branch-check'],
    contract: {
      ruleId: 'project/branch-check',
      behavior: `Ensures branch follows "${naming}" pattern and merge conditions are met`,
      examples: [
        {
          given: `branch named "${naming.replace('{name}', 'my-feature')}"`,
          when: 'branch checked',
          then: 'branch.valid emitted',
        },
        {
          given: 'branch named "random-name"',
          when: 'branch checked',
          then: 'branch.invalid emitted',
        },
      ],
      invariants: [
        `Branch names must follow pattern: ${naming}`,
        `Merge requires: ${mergeConditions.join(', ')}`,
      ],
    },
    impl: (_state, events) => {
      const checkEvent = events.find(e => e.tag === 'project.branch-check');
      if (!checkEvent) return RuleResult.skip('No branch check event');

      const payload = checkEvent.payload as { branch?: string; conditions?: Record<string, boolean> };
      const branch = payload.branch ?? '';
      const conditions = payload.conditions ?? {};

      const validName = nameRegex.test(branch);
      const unmetConditions = mergeConditions.filter(c => !conditions[c]);

      if (validName && unmetConditions.length === 0) {
        return RuleResult.emit([
          fact('branch.valid', { branch, mergeReady: true }),
        ]);
      }

      const reasons: string[] = [];
      if (!validName) reasons.push(`Branch name "${branch}" doesn't match pattern "${naming}"`);
      if (unmetConditions.length > 0) reasons.push(`Unmet merge conditions: ${unmetConditions.join(', ')}`);

      return RuleResult.emit([
        fact('branch.invalid', { branch, reasons, mergeReady: false }),
      ]);
    },
  };

  return { rules: [rule], constraints: [] };
}

// ─── Predefined Gates ───────────────────────────────────────────────────────

/**
 * Create a lint gate — blocks workflow until linting passes.
 */
export function lintGate(config: PredefinedGateConfig = {}): PraxisModule<GateContext> {
  const expects = ['lint-passes', ...(config.additionalExpects ?? [])];
  return defineGate('lint', {
    expects,
    onSatisfied: 'lint-passed',
    onViolation: 'lint-failed',
  });
}

/**
 * Create a format gate — blocks workflow until formatting is correct.
 */
export function formatGate(config: PredefinedGateConfig = {}): PraxisModule<GateContext> {
  const expects = ['format-passes', ...(config.additionalExpects ?? [])];
  return defineGate('format', {
    expects,
    onSatisfied: 'format-passed',
    onViolation: 'format-failed',
  });
}

/**
 * Create an expectation gate — blocks workflow until expectations are verified.
 */
export function expectationGate(config: PredefinedGateConfig = {}): PraxisModule<GateContext> {
  const expects = ['expectations-verified', ...(config.additionalExpects ?? [])];
  return defineGate('expectations', {
    expects,
    onSatisfied: 'expectations-passed',
    onViolation: 'expectations-failed',
  });
}
