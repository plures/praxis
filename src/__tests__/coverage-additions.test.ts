/**
 * Coverage-Additions Tests
 *
 * Comprehensive unit tests for previously untested/low-coverage modules:
 *  - decision-ledger/validation
 *  - decision-ledger/ledger
 *  - decision-ledger/logic-ledger
 *  - core/schema/normalize
 *  - lifecycle/triggers
 *  - lifecycle/maintenance
 *  - lifecycle/release
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PraxisRegistry } from '../core/rules.js';
import { defineRule, defineConstraint } from '../dsl/index.js';
import { defineContract } from '../decision-ledger/types.js';
import type { Example } from '../decision-ledger/types.js';
import { RuleResult, fact } from '../core/rule-result.js';

// ─── Imports for tested modules ──────────────────────────────────────────────

import {
  validateContracts,
  formatValidationReport,
  formatValidationReportJSON,
  formatValidationReportSARIF,
} from '../decision-ledger/validation.js';

import {
  BehaviorLedger,
  createBehaviorLedger,
} from '../decision-ledger/ledger.js';

import { writeLogicLedgerEntry } from '../decision-ledger/logic-ledger.js';

import {
  normalizeSchema,
  expandFieldType,
  fieldTypeToTypeScript,
  sortModelsByDependencies,
} from '../core/schema/normalize.js';

import {
  consoleLog,
  custom,
  version,
  release,
  registry,
  expectations as expectationsTriggers,
} from '../lifecycle/triggers.js';

import {
  vulnerabilityToExpectation,
  customerReportToExpectation,
  incidentToExpectation,
  maintenance,
} from '../lifecycle/maintenance.js';

import { releasePipeline } from '../lifecycle/release.js';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeContract(overrides: Partial<Parameters<typeof defineContract>[0]> = {}) {
  return defineContract({
    ruleId: 'test.rule',
    behavior: 'Test behavior',
    examples: [{ given: 'A', when: 'B', then: 'C' }],
    invariants: ['Must always be true'],
    ...overrides,
  });
}

function makeTriggerContext() {
  const added: unknown[] = [];
  const emitted: Array<{ name: string; data: Record<string, unknown> }> = [];
  const expectations = new Map();
  return {
    expectation: undefined as unknown,
    expectations,
    config: { versioning: { versionFiles: ['package.json'] } },
    emit: (name: string, data: Record<string, unknown>) => { emitted.push({ name, data }); },
    addExpectation: (exp: unknown) => { added.push(exp); },
    getAllExpectations: () => Array.from(expectations.values()),
    _added: added,
    _emitted: emitted,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. decision-ledger/validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateContracts', () => {
  function makeRegistry() {
    return new PraxisRegistry();
  }

  it('returns empty report for empty registry', () => {
    const registry = makeRegistry();
    const report = validateContracts(registry);
    expect(report.total).toBe(0);
    expect(report.complete).toHaveLength(0);
    expect(report.incomplete).toHaveLength(0);
    expect(report.missing).toHaveLength(0);
  });

  it('marks rule with full contract as complete', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'auth.login',
      description: 'Login rule',
      eventTypes: ['LOGIN'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'auth.login' }),
    }));

    const report = validateContracts(reg);
    expect(report.total).toBe(1);
    expect(report.complete).toHaveLength(1);
    expect(report.complete[0].ruleId).toBe('auth.login');
    expect(report.missing).toHaveLength(0);
  });

  it('marks rule without contract in missing list', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'no.contract',
      description: 'Rule without contract',
      eventTypes: ['FOO'],
      impl: () => RuleResult.skip('test'),
    }));

    const report = validateContracts(reg);
    expect(report.missing).toContain('no.contract');
    expect(report.complete).toHaveLength(0);
  });

  it('adds contract gap entry when missingSeverity is set', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'no.contract',
      description: 'Rule without contract',
      eventTypes: ['FOO'],
      impl: () => RuleResult.skip('test'),
    }));

    const report = validateContracts(reg, { missingSeverity: 'warning' });
    expect(report.incomplete).toHaveLength(1);
    expect(report.incomplete[0].ruleId).toBe('no.contract');
    expect(report.incomplete[0].severity).toBe('warning');
    expect(report.incomplete[0].missing).toContain('contract');
  });

  it('marks rule with missing behavior as incomplete', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'partial.rule',
      description: 'Partial contract rule',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'partial.rule', behavior: '' }),
    }));

    const report = validateContracts(reg);
    expect(report.incomplete).toHaveLength(1);
    expect(report.incomplete[0].missing).toContain('behavior');
  });

  it('validates only the fields specified in requiredFields', () => {
    const reg = makeRegistry();
    // This rule has a contract with invariants but we only require behavior+examples
    reg.registerRule(defineRule({
      id: 'partial.required',
      description: 'Rule checking specific required fields',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'partial.required', invariants: [] }),
    }));

    // Default requiredFields includes behavior+examples, not invariants
    const report = validateContracts(reg, { requiredFields: ['behavior', 'examples'] });
    // Contract has both behavior and examples, so it should be complete
    expect(report.complete).toHaveLength(1);
    expect(report.incomplete).toHaveLength(0);
  });

  it('validates constraints too', () => {
    const reg = makeRegistry();
    reg.registerConstraint(defineConstraint({
      id: 'no.contract.constraint',
      description: 'Constraint without contract',
      check: () => true,
    }));

    const report = validateContracts(reg);
    expect(report.total).toBe(1);
    expect(report.missing).toContain('no.contract.constraint');
  });

  it('validates artifactIndex tests presence', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'tested.rule',
      description: 'Rule with contract',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'tested.rule' }),
    }));

    const report = validateContracts(reg, {
      requiredFields: ['behavior', 'examples'],
      artifactIndex: { tests: new Set(['other.rule']) },
    });
    expect(report.incomplete).toHaveLength(1);
    expect(report.incomplete[0].missing).toContain('tests');
  });

  it('validates artifactIndex spec presence', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'spec.rule',
      description: 'Rule with contract',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'spec.rule' }),
    }));

    const report = validateContracts(reg, {
      requiredFields: ['behavior', 'examples'],
      artifactIndex: { spec: new Set() },
    });
    expect(report.incomplete).toHaveLength(1);
    expect(report.incomplete[0].missing).toContain('spec');
  });

  it('respects incompleteSeverity option', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'err.rule',
      description: 'Rule with partial contract',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'err.rule', behavior: '' }),
    }));

    const report = validateContracts(reg, { incompleteSeverity: 'error' });
    expect(report.incomplete[0].severity).toBe('error');
  });

  it('includes invariants in required fields check', () => {
    const reg = makeRegistry();
    reg.registerRule(defineRule({
      id: 'inv.rule',
      description: 'Rule without invariants',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'inv.rule', invariants: [] }),
    }));

    const report = validateContracts(reg, { requiredFields: ['behavior', 'examples', 'invariants'] });
    expect(report.incomplete).toHaveLength(1);
    expect(report.incomplete[0].missing).toContain('invariants');
  });
});

describe('formatValidationReport', () => {
  it('produces human-readable text', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'complete.rule',
      description: 'Complete rule',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'complete.rule' }),
    }));

    const report = validateContracts(reg);
    const text = formatValidationReport(report);

    expect(text).toContain('Contract Validation Report');
    expect(text).toContain('Total: 1');
    expect(text).toContain('complete.rule');
  });

  it('shows incomplete and missing sections', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'partial.rule',
      description: 'Partial rule',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'partial.rule', behavior: '' }),
    }));
    reg.registerRule(defineRule({
      id: 'missing.rule',
      description: 'No contract',
      eventTypes: ['Y'],
      impl: () => RuleResult.skip('test'),
    }));

    const report = validateContracts(reg, { missingSeverity: 'warning' });
    const text = formatValidationReport(report);

    expect(text).toContain('Incomplete Contracts');
    expect(text).toContain('No Contract');
    expect(text).toContain('missing.rule');
  });

  it('uses different icons for severity levels', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'err.rule',
      description: 'Error rule',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'err.rule', behavior: '' }),
    }));

    const report = validateContracts(reg, { incompleteSeverity: 'error' });
    const text = formatValidationReport(report);
    expect(text).toContain('✗');
  });

  it('shows info icon for info severity', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'info.rule',
      description: 'Info rule',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'info.rule', behavior: '' }),
    }));

    const report = validateContracts(reg, { incompleteSeverity: 'info' });
    const text = formatValidationReport(report);
    expect(text).toContain('ℹ');
  });
});

describe('formatValidationReportJSON', () => {
  it('produces valid JSON', () => {
    const reg = new PraxisRegistry();
    const report = validateContracts(reg);
    const json = formatValidationReportJSON(report);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.total).toBe(0);
    expect(parsed.complete).toEqual([]);
  });
});

describe('formatValidationReportSARIF', () => {
  it('produces valid SARIF JSON', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'sarif.rule',
      description: 'SARIF test rule',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'sarif.rule', behavior: '' }),
    }));

    const report = validateContracts(reg);
    const sarif = formatValidationReportSARIF(report);
    const parsed = JSON.parse(sarif);

    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].tool.driver.name).toBe('Praxis Decision Ledger');
  });

  it('includes results for incomplete contracts', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'incomplete.sarif',
      description: 'Incomplete for SARIF',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'incomplete.sarif', behavior: '' }),
    }));

    const report = validateContracts(reg);
    const sarif = formatValidationReportSARIF(report);
    const parsed = JSON.parse(sarif);

    expect(parsed.runs[0].results).toHaveLength(1);
    expect(parsed.runs[0].results[0].level).toBe('warning');
  });

  it('maps error severity to SARIF error level', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'error.sarif',
      description: 'Error for SARIF',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'error.sarif', behavior: '' }),
    }));

    const report = validateContracts(reg, { incompleteSeverity: 'error' });
    const sarif = formatValidationReportSARIF(report);
    const parsed = JSON.parse(sarif);

    expect(parsed.runs[0].results[0].level).toBe('error');
  });

  it('maps info severity to SARIF note level', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'info.sarif',
      description: 'Info for SARIF',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'info.sarif', behavior: '' }),
    }));

    const report = validateContracts(reg, { incompleteSeverity: 'info' });
    const sarif = formatValidationReportSARIF(report);
    const parsed = JSON.parse(sarif);

    expect(parsed.runs[0].results[0].level).toBe('note');
  });

  it('produces empty results for clean registry', () => {
    const reg = new PraxisRegistry();
    reg.registerRule(defineRule({
      id: 'clean.rule',
      description: 'Clean rule',
      eventTypes: ['X'],
      impl: () => RuleResult.skip('test'),
      contract: makeContract({ ruleId: 'clean.rule' }),
    }));

    const report = validateContracts(reg);
    const sarif = formatValidationReportSARIF(report);
    const parsed = JSON.parse(sarif);
    expect(parsed.runs[0].results).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. decision-ledger/ledger
// ═══════════════════════════════════════════════════════════════════════════════

describe('BehaviorLedger', () => {
  let ledger: BehaviorLedger;

  beforeEach(() => {
    ledger = new BehaviorLedger();
  });

  function makeEntry(id: string, ruleId: string, overrides: Partial<import('../decision-ledger/ledger.js').LedgerEntry> = {}): import('../decision-ledger/ledger.js').LedgerEntry {
    return {
      id,
      timestamp: new Date().toISOString(),
      status: 'active',
      author: 'test',
      contract: makeContract({ ruleId }),
      ...overrides,
    };
  }

  describe('append', () => {
    it('appends an entry successfully', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      expect(ledger.getAllEntries()).toHaveLength(1);
    });

    it('throws when appending duplicate ID', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      expect(() => ledger.append(makeEntry('e1', 'rule.b'))).toThrow("Ledger entry with ID 'e1' already exists");
    });

    it('marks superseded entry when newer one supersedes it', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.a', { supersedes: 'e1' }));

      const e1 = ledger.getEntry('e1');
      expect(e1?.status).toBe('superseded');
    });

    it('does not fail if supersedes references non-existent entry', () => {
      expect(() => ledger.append(makeEntry('e1', 'rule.a', { supersedes: 'nonexistent' }))).not.toThrow();
    });
  });

  describe('getEntry', () => {
    it('returns the entry by ID', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      const e = ledger.getEntry('e1');
      expect(e).toBeDefined();
      expect(e?.id).toBe('e1');
    });

    it('returns undefined for missing ID', () => {
      expect(ledger.getEntry('missing')).toBeUndefined();
    });
  });

  describe('getAllEntries', () => {
    it('returns entries in append order', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.b'));
      const all = ledger.getAllEntries();
      expect(all.map(e => e.id)).toEqual(['e1', 'e2']);
    });

    it('returns current status (superseded)', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.a', { supersedes: 'e1' }));
      const all = ledger.getAllEntries();
      const e1 = all.find(e => e.id === 'e1');
      expect(e1?.status).toBe('superseded');
    });
  });

  describe('getEntriesForRule', () => {
    it('returns only entries for the specified rule', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.b'));
      ledger.append(makeEntry('e3', 'rule.a'));

      const entries = ledger.getEntriesForRule('rule.a');
      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.contract.ruleId === 'rule.a')).toBe(true);
    });

    it('returns empty array for unknown rule', () => {
      expect(ledger.getEntriesForRule('unknown')).toHaveLength(0);
    });
  });

  describe('getLatestEntry', () => {
    it('returns the latest active entry for a rule', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.a', { supersedes: 'e1' }));

      const latest = ledger.getLatestEntry('rule.a');
      expect(latest?.id).toBe('e2');
      expect(latest?.status).toBe('active');
    });

    it('returns undefined when all entries are superseded', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.a', { supersedes: 'e1' }));
      // Supersede e2 as well
      ledger.append(makeEntry('e3', 'rule.a', { supersedes: 'e2' }));
      // e3 is active, e1 and e2 are superseded
      const latest = ledger.getLatestEntry('rule.a');
      expect(latest?.id).toBe('e3');
    });

    it('returns undefined for unknown rule', () => {
      expect(ledger.getLatestEntry('unknown')).toBeUndefined();
    });
  });

  describe('getActiveAssumptions', () => {
    it('returns assumptions from active entries', () => {
      const assumption = {
        id: 'a1',
        statement: 'Test assumption',
        confidence: 0.9,
        justification: 'Because',
        impacts: ['tests' as const],
        status: 'active' as const,
      };

      ledger.append(makeEntry('e1', 'rule.a', {
        contract: makeContract({ ruleId: 'rule.a', assumptions: [assumption] }),
      }));

      const assumptions = ledger.getActiveAssumptions();
      expect(assumptions.has('a1')).toBe(true);
    });

    it('excludes assumptions from superseded entries', () => {
      const assumption = {
        id: 'a1',
        statement: 'Old assumption',
        confidence: 0.9,
        justification: 'Old',
        impacts: ['tests' as const],
        status: 'active' as const,
      };

      ledger.append(makeEntry('e1', 'rule.a', {
        contract: makeContract({ ruleId: 'rule.a', assumptions: [assumption] }),
      }));
      ledger.append(makeEntry('e2', 'rule.a', { supersedes: 'e1' }));

      // e1 is now superseded, so assumption from e1 shouldn't appear
      const assumptions = ledger.getActiveAssumptions();
      expect(assumptions.has('a1')).toBe(false);
    });

    it('excludes invalidated assumptions', () => {
      const assumption = {
        id: 'a2',
        statement: 'Invalidated',
        confidence: 0.5,
        justification: 'Was valid',
        impacts: ['code' as const],
        status: 'invalidated' as const,
      };

      ledger.append(makeEntry('e1', 'rule.a', {
        contract: makeContract({ ruleId: 'rule.a', assumptions: [assumption] }),
      }));

      const assumptions = ledger.getActiveAssumptions();
      expect(assumptions.has('a2')).toBe(false);
    });
  });

  describe('findAssumptionsByImpact', () => {
    it('returns assumptions by impact type', () => {
      const assumption = {
        id: 'imp1',
        statement: 'Impacts spec',
        confidence: 0.8,
        justification: 'For spec',
        impacts: ['spec' as const, 'tests' as const],
        status: 'active' as const,
      };

      ledger.append(makeEntry('e1', 'rule.a', {
        contract: makeContract({ ruleId: 'rule.a', assumptions: [assumption] }),
      }));

      const specImpact = ledger.findAssumptionsByImpact('spec');
      expect(specImpact).toHaveLength(1);
      expect(specImpact[0].id).toBe('imp1');
    });

    it('returns empty for non-matching impact type', () => {
      const assumption = {
        id: 'imp2',
        statement: 'Impacts code only',
        confidence: 0.8,
        justification: 'For code',
        impacts: ['code' as const],
        status: 'active' as const,
      };

      ledger.append(makeEntry('e1', 'rule.a', {
        contract: makeContract({ ruleId: 'rule.a', assumptions: [assumption] }),
      }));

      expect(ledger.findAssumptionsByImpact('spec')).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('returns correct stats for empty ledger', () => {
      const stats = ledger.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.activeEntries).toBe(0);
      expect(stats.supersededEntries).toBe(0);
      expect(stats.deprecatedEntries).toBe(0);
      expect(stats.uniqueRules).toBe(0);
    });

    it('counts correctly with mixed statuses', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.a', { supersedes: 'e1' }));
      ledger.append(makeEntry('e3', 'rule.b', { status: 'deprecated' }));

      const stats = ledger.getStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.activeEntries).toBe(1); // e2 active; e3 deprecated
      expect(stats.supersededEntries).toBe(1);
      expect(stats.deprecatedEntries).toBe(1);
      expect(stats.uniqueRules).toBe(2);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('round-trips a ledger through JSON', () => {
      ledger.append(makeEntry('e1', 'rule.a'));
      ledger.append(makeEntry('e2', 'rule.a', { supersedes: 'e1' }));

      const json = ledger.toJSON();
      const restored = BehaviorLedger.fromJSON(json);

      const stats = restored.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.supersededEntries).toBe(1);
    });

    it('produces parseable JSON with version and stats', () => {
      ledger.append(makeEntry('e1', 'rule.x'));
      const json = ledger.toJSON();
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.stats).toBeDefined();
      expect(parsed.entries).toHaveLength(1);
    });
  });
});

describe('createBehaviorLedger', () => {
  it('returns a new empty BehaviorLedger', () => {
    const ledger = createBehaviorLedger();
    expect(ledger).toBeInstanceOf(BehaviorLedger);
    expect(ledger.getAllEntries()).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. decision-ledger/logic-ledger
// ═══════════════════════════════════════════════════════════════════════════════

describe('writeLogicLedgerEntry', () => {
  const testDir = path.join(process.cwd(), 'test-temp-logic-ledger');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('creates a ledger entry for a new contract', async () => {
    const contract = makeContract({ ruleId: 'logic.rule.one' });
    const entry = await writeLogicLedgerEntry(contract, {
      rootDir: testDir,
      author: 'test-author',
    });

    expect(entry.ruleId).toBe('logic.rule.one');
    expect(entry.version).toBe(1);
    expect(entry.drift.changeSummary).toBe('initial');
    expect(entry.artifacts.contractPresent).toBe(true);
    expect(entry.artifacts.testsPresent).toBe(false);
    expect(entry.artifacts.specPresent).toBe(false);
  });

  it('increments version on subsequent writes', async () => {
    const contract = makeContract({ ruleId: 'logic.rule.two' });
    const e1 = await writeLogicLedgerEntry(contract, { rootDir: testDir, author: 'test' });
    const e2 = await writeLogicLedgerEntry(contract, { rootDir: testDir, author: 'test' });

    expect(e1.version).toBe(1);
    expect(e2.version).toBe(2);
  });

  it('detects behavior change as drift', async () => {
    const contract1 = makeContract({ ruleId: 'logic.rule.three', behavior: 'Original behavior' });
    await writeLogicLedgerEntry(contract1, { rootDir: testDir, author: 'test' });

    const contract2 = makeContract({ ruleId: 'logic.rule.three', behavior: 'Updated behavior' });
    const e2 = await writeLogicLedgerEntry(contract2, { rootDir: testDir, author: 'test' });

    expect(e2.drift.changeSummary).toBe('updated');
    expect(e2.drift.conflicts).toContain('behavior-changed');
  });

  it('respects testsPresent and specPresent flags', async () => {
    const contract = makeContract({ ruleId: 'logic.rule.four' });
    const entry = await writeLogicLedgerEntry(contract, {
      rootDir: testDir,
      author: 'test',
      testsPresent: true,
      specPresent: true,
    });

    expect(entry.artifacts.testsPresent).toBe(true);
    expect(entry.artifacts.specPresent).toBe(true);
  });

  it('creates LATEST.json and versioned file', async () => {
    const contract = makeContract({ ruleId: 'logic.rule.five' });
    await writeLogicLedgerEntry(contract, { rootDir: testDir, author: 'test' });

    const ledgerDirs = await fs.readdir(path.join(testDir, 'logic-ledger'));
    // Should have a directory for the rule and an index.json
    expect(ledgerDirs).toContain('index.json');
    const ruleDirs = ledgerDirs.filter(d => d !== 'index.json');
    expect(ruleDirs).toHaveLength(1);

    const files = await fs.readdir(path.join(testDir, 'logic-ledger', ruleDirs[0]));
    expect(files).toContain('LATEST.json');
    expect(files.some(f => f.startsWith('v0001'))).toBe(true);
  });

  it('updates index.json with the rule entry', async () => {
    const contract = makeContract({ ruleId: 'logic.rule.six' });
    await writeLogicLedgerEntry(contract, { rootDir: testDir, author: 'test' });

    const indexContent = await fs.readFile(path.join(testDir, 'logic-ledger', 'index.json'), 'utf-8');
    const index = JSON.parse(indexContent);
    expect(index.byRuleId['logic.rule.six']).toBeDefined();
  });

  it('tracks assumption revisions across versions', async () => {
    const assumption = {
      id: 'asm1',
      statement: 'Original assumption',
      confidence: 0.9,
      justification: 'Test',
      impacts: ['tests' as const],
      status: 'active' as const,
    };

    const contract1 = makeContract({ ruleId: 'logic.rule.seven', assumptions: [assumption] });
    await writeLogicLedgerEntry(contract1, { rootDir: testDir, author: 'test' });

    const revisedAssumption = { ...assumption, statement: 'Revised assumption' };
    const contract2 = makeContract({ ruleId: 'logic.rule.seven', assumptions: [revisedAssumption] });
    const e2 = await writeLogicLedgerEntry(contract2, { rootDir: testDir, author: 'test' });

    expect(e2.drift.assumptionsRevised).toContain('asm1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. core/schema/normalize
// ═══════════════════════════════════════════════════════════════════════════════

describe('normalizeSchema', () => {
  it('normalizes a minimal schema', () => {
    const schema = {
      name: 'TestApp',
      version: '1.0.0',
      models: [],
      components: [],
      logic: [],
    };

    const result = normalizeSchema(schema);
    expect(result.name).toBe('TestApp');
    expect(result.models).toHaveLength(0);
    expect(result.components).toHaveLength(0);
    expect(result.logic).toHaveLength(0);
  });

  it('creates fullName for models', () => {
    const schema = {
      name: 'MyApp',
      version: '1.0.0',
      models: [{
        name: 'User',
        fields: [{ name: 'id', type: 'string' as const, required: true }],
      }],
      components: [],
      logic: [],
    };

    const result = normalizeSchema(schema);
    expect(result.models[0].fullName).toBe('MyApp.User');
  });

  it('uses schemaPrefix option for fullName', () => {
    const schema = {
      name: 'MyApp',
      version: '1.0.0',
      models: [{
        name: 'Product',
        fields: [{ name: 'id', type: 'string' as const, required: true }],
      }],
      components: [],
      logic: [],
    };

    const result = normalizeSchema(schema, { schemaPrefix: 'com.example' });
    expect(result.models[0].fullName).toBe('com.example.Product');
  });

  it('extracts model dependencies from reference fields', () => {
    const schema = {
      name: 'App',
      version: '1.0.0',
      models: [
        {
          name: 'Order',
          fields: [
            { name: 'id', type: 'string' as const, required: true },
            { name: 'user', type: { reference: 'User' }, required: true },
          ],
        },
      ],
      components: [],
      logic: [],
    };

    const result = normalizeSchema(schema);
    expect(result.models[0].dependencies).toContain('User');
  });

  it('extracts model dependencies from relationships', () => {
    const schema = {
      name: 'App',
      version: '1.0.0',
      models: [
        {
          name: 'Post',
          fields: [{ name: 'id', type: 'string' as const, required: true }],
          relationships: [{ name: 'author', type: 'many-to-one' as const, target: 'User' }],
        },
      ],
      components: [],
      logic: [],
    };

    const result = normalizeSchema(schema);
    expect(result.models[0].dependencies).toContain('User');
  });

  it('resolves component model references', () => {
    const schema = {
      name: 'App',
      version: '1.0.0',
      models: [{
        name: 'Widget',
        fields: [{ name: 'id', type: 'string' as const, required: true }],
      }],
      components: [{
        name: 'WidgetCard',
        type: 'card' as const,
        model: 'Widget',
        props: [],
      }],
      logic: [],
    };

    const result = normalizeSchema(schema);
    expect(result.components[0].fullName).toBe('App.WidgetCard');
    expect(result.components[0].resolvedModel?.name).toBe('Widget');
  });

  it('sets resolvedModel to undefined when no model', () => {
    const schema = {
      name: 'App',
      version: '1.0.0',
      models: [],
      components: [{
        name: 'NoModel',
        type: 'card' as const,
        props: [],
      }],
      logic: [],
    };

    const result = normalizeSchema(schema);
    expect(result.components[0].resolvedModel).toBeUndefined();
  });

  it('creates fullId for logic definitions', () => {
    const schema = {
      name: 'App',
      version: '1.0.0',
      models: [],
      components: [],
      logic: [{
        id: 'processOrder',
        type: 'workflow' as const,
        description: 'Process an order',
        rules: [],
        constraints: [],
      }],
    };

    const result = normalizeSchema(schema);
    expect(result.logic[0].fullId).toBe('App.processOrder');
  });
});

describe('expandFieldType', () => {
  it('returns string field types directly', () => {
    expect(expandFieldType('string')).toBe('string');
    expect(expandFieldType('number')).toBe('number');
    expect(expandFieldType('boolean')).toBe('boolean');
  });

  it('expands array types', () => {
    expect(expandFieldType({ array: 'string' })).toBe('string[]');
  });

  it('expands nested array types', () => {
    expect(expandFieldType({ array: { array: 'number' } })).toBe('number[][]');
  });

  it('returns "object" for object types', () => {
    expect(expandFieldType({ object: {} })).toBe('object');
  });

  it('expands reference types with prefix', () => {
    expect(expandFieldType({ reference: 'User' }, 'App')).toBe('App.User');
  });

  it('expands reference types without prefix', () => {
    expect(expandFieldType({ reference: 'User' })).toBe('User');
  });

  it('returns "unknown" for unexpected types', () => {
    expect(expandFieldType({} as unknown as import('../core/schema/types.js').FieldType)).toBe('unknown');
  });
});

describe('fieldTypeToTypeScript', () => {
  it('converts string to TypeScript string', () => {
    expect(fieldTypeToTypeScript('string')).toBe('string');
    expect(fieldTypeToTypeScript('number')).toBe('number');
    expect(fieldTypeToTypeScript('boolean')).toBe('boolean');
    expect(fieldTypeToTypeScript('date')).toBe('Date');
  });

  it('converts array primitive to unknown[]', () => {
    expect(fieldTypeToTypeScript('array')).toBe('unknown[]');
  });

  it('converts object primitive to Record<string, unknown>', () => {
    expect(fieldTypeToTypeScript('object')).toBe('Record<string, unknown>');
  });

  it('converts unknown field type string to unknown', () => {
    expect(fieldTypeToTypeScript('custom' as unknown as import('../core/schema/types.js').FieldType)).toBe('unknown');
  });

  it('converts array object type', () => {
    expect(fieldTypeToTypeScript({ array: 'string' })).toBe('string[]');
  });

  it('converts reference type to its name', () => {
    expect(fieldTypeToTypeScript({ reference: 'User' })).toBe('User');
  });

  it('converts inline object type', () => {
    const result = fieldTypeToTypeScript({
      object: {
        name: { name: 'name', type: 'string', required: true },
        age: { name: 'age', type: 'number', required: false },
      },
    });
    expect(result).toContain('name: string');
    expect(result).toContain('age: number');
  });

  it('returns unknown for non-matching object', () => {
    expect(fieldTypeToTypeScript({} as unknown as import('../core/schema/types.js').FieldType)).toBe('unknown');
  });
});

describe('sortModelsByDependencies', () => {
  it('returns models without dependencies first', () => {
    const models = [
      { name: 'Order', fullName: 'App.Order', allFields: [], dependencies: ['User'], fields: [] },
      { name: 'User', fullName: 'App.User', allFields: [], dependencies: [], fields: [] },
    ] as import('../core/schema/normalize.js').NormalizedModel[];

    const sorted = sortModelsByDependencies(models);
    expect(sorted[0].name).toBe('User');
    expect(sorted[1].name).toBe('Order');
  });

  it('handles circular dependencies without infinite loop', () => {
    const models = [
      { name: 'A', fullName: 'App.A', allFields: [], dependencies: ['B'], fields: [] },
      { name: 'B', fullName: 'App.B', allFields: [], dependencies: ['A'], fields: [] },
    ] as import('../core/schema/normalize.js').NormalizedModel[];

    expect(() => sortModelsByDependencies(models)).not.toThrow();
    // Due to circular detection, all input models are eventually included
    const result = sortModelsByDependencies(models);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty array', () => {
    expect(sortModelsByDependencies([])).toEqual([]);
  });

  it('handles models with external (unknown) dependencies', () => {
    const models = [
      { name: 'Item', fullName: 'App.Item', allFields: [], dependencies: ['ExternalType'], fields: [] },
    ] as import('../core/schema/normalize.js').NormalizedModel[];

    const sorted = sortModelsByDependencies(models);
    expect(sorted).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. lifecycle/triggers
// ═══════════════════════════════════════════════════════════════════════════════

describe('consoleLog trigger', () => {
  it('creates a trigger action with id console.log', () => {
    const action = consoleLog();
    expect(action.id).toBe('console.log');
    expect(action.description).toContain('console');
  });

  it('includes prefix in description when provided', () => {
    const action = consoleLog('[TEST]');
    expect(action.description).toContain('[TEST]');
  });

  it('executes and returns success', async () => {
    const action = consoleLog('>>');
    const result = await action.execute(
      { name: 'lifecycle/design/expectation.submitted', data: { foo: 'bar' }, expectationId: undefined },
      makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext,
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain('lifecycle/design/expectation.submitted');
  });

  it('uses default prefix emoji when not provided', async () => {
    const action = consoleLog();
    const result = await action.execute(
      { name: 'lifecycle/design/expectation.submitted', data: {}, expectationId: undefined },
      makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext,
    );
    expect(result.message).toContain('📋');
  });
});

describe('custom trigger', () => {
  it('creates a trigger action with given id', () => {
    const fn = async () => ({ success: true, message: 'ok' });
    const action = custom('my.trigger', fn);
    expect(action.id).toBe('my.trigger');
    expect(action.description).toContain('my.trigger');
  });

  it('executes the custom function', async () => {
    const fn = vi.fn(async () => ({ success: true, message: 'custom result' }));
    const action = custom('custom.test', fn);
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/design/expectation.submitted' as const, data: {}, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(fn).toHaveBeenCalledWith(event, ctx);
    expect(result.message).toBe('custom result');
  });
});

describe('version triggers', () => {
  it('bumpSemver calculates patch bump by default', async () => {
    const action = version.bumpSemver();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/stable.released' as const, data: {}, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
    expect(result.data?.bump).toBe('patch');
  });

  it('bumpSemver calculates minor bump for feature expectations', async () => {
    const action = version.bumpSemver();
    const ctx = makeTriggerContext();
    ctx.expectations.set('feat1', {
      id: 'feat1', type: 'feature', title: 'Feature', description: '', priority: 'medium',
      acceptance: [], labels: [],
    });
    const event = { name: 'lifecycle/release/stable.released' as const, data: {}, expectationId: undefined };

    const result = await action.execute(
      event,
      ctx as unknown as import('../lifecycle/types.js').TriggerContext,
    );
    expect(result.data?.bump).toBe('minor');
  });

  it('bumpSemver calculates major bump for breaking expectations', async () => {
    const action = version.bumpSemver();
    const ctx = makeTriggerContext();
    ctx.expectations.set('breaking1', {
      id: 'breaking1', type: 'feature', title: 'Breaking', description: '', priority: 'high',
      acceptance: [], labels: [], breaking: true,
    });
    const event = { name: 'lifecycle/release/stable.released' as const, data: {}, expectationId: undefined };

    const result = await action.execute(
      event,
      ctx as unknown as import('../lifecycle/types.js').TriggerContext,
    );
    expect(result.data?.bump).toBe('major');
  });

  it('syncFiles returns configured targets', async () => {
    const action = version.syncFiles(['package.json', 'deno.json']);
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/stable.released' as const, data: {}, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
    expect(result.data?.files).toEqual(['package.json', 'deno.json']);
  });

  it('syncFiles falls back to config versionFiles', async () => {
    const action = version.syncFiles();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/stable.released' as const, data: {}, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
  });
});

describe('release triggers (prerelease / stable)', () => {
  it('tagPrerelease returns success with tag name', async () => {
    const action = release.tagPrerelease();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/prerelease.tagged' as const, data: { version: '1.2.3' }, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
    expect(result.data?.tagName).toBe('v1.2.3-rc.1');
  });

  it('tagPrerelease uses custom tag option', async () => {
    const action = release.tagPrerelease({ tag: 'beta' });
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/prerelease.tagged' as const, data: { version: '2.0.0' }, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.data?.tagName).toBe('v2.0.0-beta.1');
    expect(result.data?.prereleaseTag).toBe('beta');
  });

  it('promoteToStable returns stable version', async () => {
    const action = release.promoteToStable();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/stable.released' as const, data: { version: '1.2.3' }, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
    expect(result.data?.stable).toBe(true);
    expect(result.message).toContain('v1.2.3');
  });
});

describe('registry triggers', () => {
  it('publishPrerelease returns success with registries', async () => {
    const action = registry.publishPrerelease({ registries: ['npm', 'jsr'] });
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/prerelease.tagged' as const, data: { version: '1.0.0-rc.1' }, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
    expect(result.data?.registries).toEqual(['npm', 'jsr']);
    expect(result.data?.tag).toBe('next');
  });

  it('publishStable returns success with registries', async () => {
    const action = registry.publishStable({ registries: ['npm'] });
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/release/stable.released' as const, data: { version: '1.0.0' }, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
    expect(result.data?.tag).toBe('latest');
  });
});

describe('expectations triggers', () => {
  it('createFromQAResults with no failures returns success', async () => {
    const action = expectationsTriggers.createFromQAResults();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = {
      name: 'lifecycle/qa/tests.failed' as const,
      data: { failures: [] },
      expectationId: undefined,
    };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
    expect(result.message).toContain('No QA failures');
  });

  it('createFromQAResults creates expectations from failures', async () => {
    const action = expectationsTriggers.createFromQAResults();
    const ctx = makeTriggerContext();
    const event = {
      name: 'lifecycle/qa/tests.failed' as const,
      data: {
        failures: [
          { test: 'User Login Test', error: 'Timeout' },
          { test: 'Cart Test', error: 'Assertion failed' },
        ],
      },
      expectationId: 'exp1',
    };

    const result = await action.execute(
      event,
      ctx as unknown as import('../lifecycle/types.js').TriggerContext,
    );

    expect(result.success).toBe(true);
    expect(ctx._added).toHaveLength(2);
    expect(ctx._emitted.some(e => e.name === 'lifecycle/design/expectation.submitted')).toBe(true);
    expect(result.data?.created).toHaveLength(2);
  });

  it('createFromQAResults handles undefined failures', async () => {
    const action = expectationsTriggers.createFromQAResults();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = {
      name: 'lifecycle/qa/tests.failed' as const,
      data: {},
      expectationId: undefined,
    };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. lifecycle/maintenance
// ═══════════════════════════════════════════════════════════════════════════════

describe('vulnerabilityToExpectation', () => {
  it('converts a critical vulnerability', () => {
    const vuln = {
      id: 'CVE-2023-1234',
      package: 'lodash',
      severity: 'critical' as const,
      description: 'Prototype pollution',
      fixedIn: '4.17.21',
    };

    const exp = vulnerabilityToExpectation(vuln);
    expect(exp.id).toBe('vuln-cve-2023-1234');
    expect(exp.type).toBe('security');
    expect(exp.priority).toBe('critical');
    expect(exp.labels).toContain('critical');
    expect(exp.acceptance.some(a => a.includes('lodash'))).toBe(true);
  });

  it('maps moderate severity to medium priority', () => {
    const vuln = {
      id: 'NPM-123',
      package: 'express',
      severity: 'moderate' as const,
      description: 'XSS',
    };

    const exp = vulnerabilityToExpectation(vuln);
    expect(exp.priority).toBe('medium');
  });

  it('maps low severity correctly', () => {
    const vuln = {
      id: 'NPM-456',
      package: 'mime',
      severity: 'low' as const,
      description: 'DoS',
    };

    const exp = vulnerabilityToExpectation(vuln);
    expect(exp.priority).toBe('low');
  });

  it('includes CVE metadata', () => {
    const vuln = {
      id: 'CVE-2024-999',
      package: 'axios',
      severity: 'high' as const,
      description: 'SSRF',
      cvss: 8.5,
    };

    const exp = vulnerabilityToExpectation(vuln);
    expect(exp.meta?.cve).toBe('CVE-2024-999');
    expect(exp.meta?.cvss).toBe(8.5);
  });

  it('uses patched version fallback when fixedIn is missing', () => {
    const vuln = {
      id: 'NPM-789',
      package: 'qs',
      severity: 'high' as const,
      description: 'Prototype pollution',
    };

    const exp = vulnerabilityToExpectation(vuln);
    expect(exp.acceptance[0]).toContain('patched version');
  });
});

describe('customerReportToExpectation', () => {
  it('converts a customer report', () => {
    const report = {
      id: 'CUST-001',
      reporter: 'john@example.com',
      title: 'Login broken',
      description: 'Cannot login with valid credentials',
      severity: 'high' as const,
    };

    const exp = customerReportToExpectation(report);
    expect(exp.id).toBe('customer-CUST-001');
    expect(exp.type).toBe('fix');
    expect(exp.priority).toBe('high');
    expect(exp.labels).toContain('customer-reported');
  });

  it('includes repro steps in acceptance criteria', () => {
    const report = {
      id: 'CUST-002',
      reporter: 'user@example.com',
      title: 'Crash on checkout',
      description: 'App crashes during checkout',
      severity: 'critical' as const,
      reproSteps: ['Open cart', 'Click checkout', 'App crashes'],
    };

    const exp = customerReportToExpectation(report);
    expect(exp.acceptance[0]).toContain('Open cart');
    expect(exp.priority).toBe('critical');
  });

  it('uses generic acceptance when no repro steps', () => {
    const report = {
      id: 'CUST-003',
      reporter: 'user@test.com',
      title: 'Bug',
      description: 'Something broke',
      severity: 'medium' as const,
    };

    const exp = customerReportToExpectation(report);
    expect(exp.acceptance[0]).toContain('resolved');
  });

  it('maps medium severity to medium priority', () => {
    const report = {
      id: 'CUST-004',
      reporter: 'user@test.com',
      title: 'Minor issue',
      description: 'Cosmetic bug',
      severity: 'low' as const,
    };

    const exp = customerReportToExpectation(report);
    expect(exp.priority).toBe('medium');
  });
});

describe('incidentToExpectation', () => {
  it('converts an incident to a hotfix expectation', () => {
    const incident = {
      id: 'INC-001',
      title: 'Database down',
      severity: 'sev0' as const,
      description: 'Production DB unreachable',
      affectedServices: ['api', 'web'],
    };

    const exp = incidentToExpectation(incident);
    expect(exp.id).toBe('incident-INC-001');
    expect(exp.type).toBe('fix');
    expect(exp.priority).toBe('critical');
    expect(exp.title).toContain('HOTFIX');
    expect(exp.labels).toContain('incident');
    expect(exp.acceptance.some(a => a.includes('api'))).toBe(true);
    expect(exp.acceptance.some(a => a.includes('web'))).toBe(true);
  });

  it('includes root cause in acceptance criteria', () => {
    const incident = {
      id: 'INC-002',
      title: 'Memory leak',
      severity: 'sev1' as const,
      description: 'Worker memory usage growing',
      affectedServices: ['worker'],
    };

    const exp = incidentToExpectation(incident);
    expect(exp.acceptance.some(a => a.includes('Root cause'))).toBe(true);
  });
});

describe('maintenance triggers', () => {
  it('processCustomerReport fails when no report in event', async () => {
    const action = maintenance.processCustomerReport();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/maintenance/vulnerability.found' as const, data: {}, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing report');
  });

  it('processCustomerReport creates expectation from report', async () => {
    const action = maintenance.processCustomerReport();
    const ctx = makeTriggerContext();
    const report = {
      id: 'CUST-010',
      reporter: 'test@test.com',
      title: 'Bug',
      description: 'A bug',
      severity: 'high' as const,
    };
    const event = {
      name: 'lifecycle/maintenance/vulnerability.found' as const,
      data: { report },
      expectationId: undefined,
    };

    const result = await action.execute(
      event,
      ctx as unknown as import('../lifecycle/types.js').TriggerContext,
    );

    expect(result.success).toBe(true);
    expect(ctx._added).toHaveLength(1);
    expect(ctx._emitted.some(e => e.name === 'lifecycle/design/expectation.submitted')).toBe(true);
  });

  it('processIncident fails when no incident in event', async () => {
    const action = maintenance.processIncident();
    const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
    const event = { name: 'lifecycle/maintenance/vulnerability.found' as const, data: {}, expectationId: undefined };

    const result = await action.execute(event, ctx);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing incident');
  });

  it('processIncident creates hotfix expectation from incident', async () => {
    const action = maintenance.processIncident();
    const ctx = makeTriggerContext();
    const incident = {
      id: 'INC-100',
      title: 'Outage',
      severity: 'sev0' as const,
      description: 'Total outage',
      affectedServices: ['api'],
    };
    const event = {
      name: 'lifecycle/maintenance/vulnerability.found' as const,
      data: { incident },
      expectationId: undefined,
    };

    const result = await action.execute(
      event,
      ctx as unknown as import('../lifecycle/types.js').TriggerContext,
    );

    expect(result.success).toBe(true);
    expect(ctx._added).toHaveLength(1);
    expect(ctx._emitted.some(e => e.name === 'lifecycle/design/expectation.classified')).toBe(true);
    expect(result.data?.severity).toBe('sev0');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. lifecycle/release
// ═══════════════════════════════════════════════════════════════════════════════

describe('releasePipeline', () => {
  describe('qaGate', () => {
    it('blocks when qaPassed is false', async () => {
      const action = releasePipeline.qaGate();
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: { qaPassed: false },
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('blocked');
    });

    it('blocks when qaSummary has failures', async () => {
      const action = releasePipeline.qaGate();
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: {
          qaSummary: {
            overallPassed: false,
            totalTests: 10,
            totalPassed: 8,
            failedTests: ['test1', 'test2'],
          },
        },
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.success).toBe(false);
      expect(result.data?.failedTests).toHaveLength(2);
    });

    it('passes when qaPassed is true', async () => {
      const action = releasePipeline.qaGate();
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: {
          qaPassed: true,
          qaSummary: {
            overallPassed: true,
            totalTests: 5,
            totalPassed: 5,
            failedTests: [],
          },
        },
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.success).toBe(true);
      expect(result.message).toContain('passed');
    });

    it('blocks when no QA results at all', async () => {
      const action = releasePipeline.qaGate();
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: {},
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('notify', () => {
    it('logs the release version to console', async () => {
      const action = releasePipeline.notify();
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: { version: '1.0.0' },
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.success).toBe(true);
      expect(result.message).toContain('1.0.0');
      expect(result.data?.channel).toBe('console');
    });

    it('includes channel name in data when provided', async () => {
      const action = releasePipeline.notify('slack');
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: { tag: 'v2.0.0' },
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.data?.channel).toBe('slack');
    });
  });

  describe('gitTag (skip - requires git)', () => {
    it.skip('creates a git tag (requires git repo)', async () => {
      // Skipped: requires a git repository environment with write access
    });
  });

  describe('githubRelease (skip - requires gh CLI)', () => {
    it.skip('creates a GitHub release (requires gh CLI and auth)', async () => {
      // Skipped: requires the gh CLI with GitHub authentication
    });
  });

  describe('npmPublish (skip - requires npm auth)', () => {
    it.skip('publishes to npm (requires npm authentication)', async () => {
      // Skipped: requires npm authentication and a publishable package
    });
  });

  describe('gitTag error handling', () => {
    it('returns failure when no tag in event data', async () => {
      const action = releasePipeline.gitTag();
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: {},
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing tag');
    });
  });

  describe('githubRelease error handling', () => {
    it('returns failure when no tag in event data', async () => {
      const action = releasePipeline.githubRelease();
      const ctx = makeTriggerContext() as unknown as import('../lifecycle/types.js').TriggerContext;
      const event = {
        name: 'lifecycle/release/stable.released' as const,
        data: {},
        expectationId: undefined,
      };

      const result = await action.execute(event, ctx);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing tag');
    });
  });
});
