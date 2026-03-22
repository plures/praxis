/**
 * Praxis Lifecycle Engine — QA + Review + Release + Maintenance Tests (Phases 4-7)
 */

import { describe, it, expect, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  // QA (Phase 4)
  generateTestCases,
  formatTestCasesAsCode,
  createTestMatrix,
  expandMatrix,
  writeTestCases,
  writeQARunResult,
  loadQARunResults,
  summarizeQA,
  formatQASummary,
  // Review (Phase 5)
  review,
  // Release (Phase 6)
  releasePipeline,
  // Maintenance (Phase 7)
  maintenance,
  vulnerabilityToExpectation,
  customerReportToExpectation,
  incidentToExpectation,
  // Shared
  defineExpectation,
  createEventBus,
  defineLifecycle,
  defineTriggers,
} from '../lifecycle/index.js';
import type { QARunResult, LifecycleEvent, TriggerContext, Vulnerability, CustomerReport, Incident } from '../lifecycle/index.js';

// ─── QA: Test Case Generation ───────────────────────────────────────────────

describe('qa/test-cases', () => {
  const exps = [
    defineExpectation({
      id: 'auth',
      type: 'feature',
      title: 'OAuth Login',
      description: 'OAuth flow',
      priority: 'high',
      acceptance: [
        'Given a valid token, when login is attempted, then session is created',
        'Given an expired token, when login is attempted, then refresh is triggered',
        'Error shown for invalid tokens',
      ],
    }),
    defineExpectation({
      id: 'dark-mode',
      type: 'feature',
      title: 'Dark Mode',
      description: 'Theme toggle',
      priority: 'medium',
      acceptance: ['Toggle switches theme'],
    }),
  ];

  it('generates test cases from acceptance criteria', () => {
    const cases = generateTestCases(exps);
    expect(cases).toHaveLength(4);
    expect(cases[0].expectationId).toBe('auth');
    expect(cases[3].expectationId).toBe('dark-mode');
  });

  it('parses Given/When/Then into steps', () => {
    const cases = generateTestCases(exps);
    expect(cases[0].steps).toBeDefined();
    expect(cases[0].steps!.given).toBe('a valid token');
    expect(cases[0].steps!.when).toBe('login is attempted');
    expect(cases[0].steps!.then).toBe('session is created');
  });

  it('handles non-GWT criteria', () => {
    const cases = generateTestCases(exps);
    expect(cases[2].steps).toBeUndefined();
    expect(cases[2].description).toBe('Error shown for invalid tokens');
  });

  it('formats as test code', () => {
    const cases = generateTestCases(exps);
    const code = formatTestCasesAsCode(cases);
    expect(code).toContain("describe('auth'");
    expect(code).toContain("describe('dark-mode'");
    expect(code).toContain('// Given: a valid token');
    expect(code).toContain('// When: login is attempted');
    expect(code).toContain('// Then: session is created');
    expect(code).toContain('expect(true).toBe(true)');
  });
});

// ─── QA: Test Matrix ────────────────────────────────────────────────────────

describe('qa/matrix', () => {
  it('creates matrix with correct combinations', () => {
    const matrix = createTestMatrix('CI', {
      os: ['linux', 'macos'],
      node: ['18', '20', '22'],
    }, ['tc-1', 'tc-2']);

    expect(matrix.totalCombinations).toBe(6); // 2 × 3
    expect(matrix.testCaseIds).toEqual(['tc-1', 'tc-2']);
  });

  it('expands matrix into all combinations', () => {
    const matrix = createTestMatrix('CI', {
      os: ['linux', 'macos'],
      node: ['18', '20'],
    }, []);

    const combos = expandMatrix(matrix);
    expect(combos).toHaveLength(4);
    expect(combos).toContainEqual({ os: 'linux', node: '18' });
    expect(combos).toContainEqual({ os: 'macos', node: '20' });
  });

  it('handles empty matrix', () => {
    const matrix = createTestMatrix('empty', {}, []);
    expect(expandMatrix(matrix)).toEqual([{}]);
  });
});

// ─── QA: Artifacts & Summary ────────────────────────────────────────────────

describe('qa/artifacts', () => {
  const tmpDir = join('/tmp', 'praxis-qa-test-' + Date.now());
  const qaConfig = { branchPrefix: 'qa/', artifactsDir: 'qa/results' };

  it('writes test cases', () => {
    const cases = generateTestCases([
      defineExpectation({ id: 'x', type: 'feature', title: 'X', description: 'D', priority: 'medium', acceptance: ['It works'] }),
    ]);
    const artifacts = writeTestCases(tmpDir, qaConfig, cases);
    expect(artifacts).toHaveLength(2);
    expect(artifacts[0].type).toBe('test-cases');
  });

  it('writes and loads run results', () => {
    const result: QARunResult = {
      id: 'run-1',
      version: '1.0.0-rc.1',
      timestamp: Date.now(),
      passed: false,
      results: [
        { testId: 'tc-1', title: 'Test 1', status: 'passed', duration: 100 },
        { testId: 'tc-2', title: 'Test 2', status: 'failed', duration: 200, error: 'Expected true' },
      ],
      summary: { total: 2, passed: 1, failed: 1, skipped: 0, duration: 300 },
    };

    writeQARunResult(tmpDir, qaConfig, result);
    const loaded = loadQARunResults(tmpDir, qaConfig);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('run-1');
  });

  it('summarizes QA results', () => {
    const results: QARunResult[] = [{
      id: 'r1', version: '1.0.0-rc.1', timestamp: Date.now(), passed: false,
      results: [
        { testId: 'tc-1', title: 'T1', status: 'passed', duration: 50 },
        { testId: 'tc-2', title: 'T2', status: 'failed', duration: 100, error: 'boom' },
      ],
      summary: { total: 2, passed: 1, failed: 1, skipped: 0, duration: 150 },
    }];

    const summary = summarizeQA(results, '1.0.0-rc.1');
    expect(summary.overallPassed).toBe(false);
    expect(summary.totalFailed).toBe(1);
    expect(summary.failedTests).toHaveLength(1);
    expect(summary.failedTests[0].error).toBe('boom');
  });

  it('formats summary as markdown', () => {
    const summary = summarizeQA([{
      id: 'r1', version: '2.0.0', timestamp: Date.now(), passed: true,
      results: [{ testId: 'tc-1', title: 'T1', status: 'passed', duration: 50 }],
      summary: { total: 1, passed: 1, failed: 0, skipped: 0, duration: 50 },
    }]);

    const md = formatQASummary(summary);
    expect(md).toContain('✅');
    expect(md).toContain('1/1 passed');
  });

  it('cleanup', () => {
    rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ─── Review Automation (Phase 5) ────────────────────────────────────────────

describe('review', () => {
  const mockEvent = (data: Record<string, unknown>): LifecycleEvent => ({
    name: 'lifecycle/review/review.completed',
    timestamp: Date.now(),
    data,
    source: 'test',
  });

  it('requireCI blocks when CI fails', async () => {
    const result = await review.requireCI().execute(mockEvent({ ciPassed: false }), {} as TriggerContext);
    expect(result.success).toBe(false);
  });

  it('requireCI passes when CI passes', async () => {
    const result = await review.requireCI().execute(mockEvent({ ciPassed: true }), {} as TriggerContext);
    expect(result.success).toBe(true);
  });

  it('autoApply approves when no required changes', async () => {
    const emitted: any[] = [];
    const ctx = { emit: (name: string, data: any) => emitted.push({ name, data }) } as any;

    const result = await review.autoApplyRecommendations().execute(
      mockEvent({ comments: [{ body: 'Nice!', severity: 'praise' }] }),
      ctx,
    );

    expect(result.success).toBe(true);
    expect(emitted.some(e => e.name === 'lifecycle/review/review.approved')).toBe(true);
  });

  it('autoApply requests changes for required comments', async () => {
    const emitted: any[] = [];
    const ctx = { emit: (name: string, data: any) => emitted.push({ name, data }) } as any;

    const result = await review.autoApplyRecommendations().execute(
      mockEvent({ comments: [{ body: 'Fix this', severity: 'required' }], round: 1 }),
      ctx,
    );

    expect(result.data?.requiredChanges).toBe(1);
    expect(emitted.some(e => e.name === 'lifecycle/review/review.changes-requested')).toBe(true);
  });

  it('autoApply stops after max rounds', async () => {
    const emitted: any[] = [];
    const ctx = { emit: (name: string, data: any) => emitted.push({ name, data }) } as any;

    const result = await review.autoApplyRecommendations({ maxRounds: 2 }).execute(
      mockEvent({ round: 3, comments: [{ body: 'Fix', severity: 'required' }] }),
      ctx,
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('exceeded');
  });

  it('mergeGate blocks on failures', async () => {
    const result = await review.mergeGate().execute(
      mockEvent({ reviewApproved: false, ciPassed: true }),
      {} as TriggerContext,
    );

    expect(result.success).toBe(false);
    expect(result.data?.failures).toContain('Review not approved');
  });

  it('mergeGate passes when all conditions met', async () => {
    const result = await review.mergeGate().execute(
      mockEvent({ reviewApproved: true, ciPassed: true, hasConflicts: false }),
      {} as TriggerContext,
    );

    expect(result.success).toBe(true);
  });
});

// ─── Release Pipeline (Phase 6) ─────────────────────────────────────────────

describe('release', () => {
  it('qaGate blocks without QA results', async () => {
    const result = await releasePipeline.qaGate().execute(
      { name: 'lifecycle/release/release.requested', timestamp: Date.now(), data: {}, source: 'test' },
      {} as TriggerContext,
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('no QA results');
  });

  it('qaGate blocks on QA failure', async () => {
    const result = await releasePipeline.qaGate().execute(
      {
        name: 'lifecycle/release/release.requested', timestamp: Date.now(), source: 'test',
        data: {
          qaPassed: false,
          qaSummary: { overallPassed: false, totalTests: 10, totalPassed: 8, totalFailed: 2, failedTests: [{ testId: 't1', title: 'T', runId: 'r1' }] },
        },
      },
      {} as TriggerContext,
    );
    expect(result.success).toBe(false);
  });

  it('qaGate passes on QA success', async () => {
    const result = await releasePipeline.qaGate().execute(
      {
        name: 'lifecycle/release/release.requested', timestamp: Date.now(), source: 'test',
        data: {
          qaPassed: true,
          qaSummary: { overallPassed: true, totalTests: 10, totalPassed: 10, totalFailed: 0, failedTests: [] },
        },
      },
      {} as TriggerContext,
    );
    expect(result.success).toBe(true);
  });

  it('notify logs release', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await releasePipeline.notify().execute(
      { name: 'lifecycle/release/release.published', timestamp: Date.now(), data: { version: '2.0.0' }, source: 'test' },
      {} as TriggerContext,
    );
    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('2.0.0'));
    spy.mockRestore();
  });
});

// ─── Maintenance (Phase 7) ──────────────────────────────────────────────────

describe('maintenance', () => {
  it('converts vulnerability to expectation', () => {
    const vuln: Vulnerability = {
      id: 'CVE-2026-1234',
      package: 'lodash',
      severity: 'critical',
      description: 'Prototype pollution',
      fixedIn: '4.17.22',
      cvss: 9.8,
    };

    const exp = vulnerabilityToExpectation(vuln);
    expect(exp.type).toBe('security');
    expect(exp.priority).toBe('critical');
    expect(exp.title).toContain('CVE-2026-1234');
    expect(exp.labels).toContain('security');
  });

  it('converts customer report to expectation', () => {
    const report: CustomerReport = {
      id: 'CR-42',
      reporter: 'alice@corp.com',
      title: 'Login page blank on Safari',
      description: 'Safari 17 shows blank page',
      severity: 'high',
      reproSteps: ['Open Safari 17', 'Navigate to /login', 'See blank page'],
    };

    const exp = customerReportToExpectation(report);
    expect(exp.type).toBe('fix');
    expect(exp.priority).toBe('high');
    expect(exp.labels).toContain('customer-reported');
    expect(exp.acceptance[0]).toContain('Safari 17');
  });

  it('converts incident to hotfix expectation', () => {
    const incident: Incident = {
      id: 'INC-99',
      title: 'Database connection pool exhausted',
      severity: 'sev1',
      description: 'Connection pool at 100%, all queries timing out',
      affectedServices: ['api-gateway', 'auth-service'],
    };

    const exp = incidentToExpectation(incident);
    expect(exp.type).toBe('fix');
    expect(exp.priority).toBe('critical');
    expect(exp.title).toContain('HOTFIX');
    expect(exp.labels).toContain('incident');
    expect(exp.acceptance).toHaveLength(3); // 2 services + root cause
  });

  it('processCustomerReport creates expectation and emits event', async () => {
    const emitted: any[] = [];
    const expectations = new Map();

    const ctx = {
      addExpectation: (exp: any) => expectations.set(exp.id, exp),
      getAllExpectations: () => Array.from(expectations.values()),
      emit: (name: string, data: any) => emitted.push({ name, data }),
      expectations,
      config: {} as any,
    } as TriggerContext;

    const result = await maintenance.processCustomerReport().execute(
      {
        name: 'lifecycle/maintain/customer.reported', timestamp: Date.now(), source: 'test',
        data: {
          report: {
            id: 'CR-1',
            reporter: 'bob',
            title: 'Button not clickable',
            description: 'Submit button unresponsive',
            severity: 'medium',
          },
        },
      },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(expectations.size).toBe(1);
    expect(emitted.some(e => e.name === 'lifecycle/design/expectation.submitted')).toBe(true);
  });

  it('processIncident creates hotfix and emits classified event', async () => {
    const emitted: any[] = [];
    const expectations = new Map();

    const ctx = {
      addExpectation: (exp: any) => expectations.set(exp.id, exp),
      getAllExpectations: () => Array.from(expectations.values()),
      emit: (name: string, data: any) => emitted.push({ name, data }),
      expectations,
      config: {} as any,
    } as TriggerContext;

    const result = await maintenance.processIncident().execute(
      {
        name: 'lifecycle/maintain/incident.triggered', timestamp: Date.now(), source: 'test',
        data: {
          incident: {
            id: 'INC-1',
            title: 'API down',
            severity: 'sev0',
            description: 'Total outage',
            affectedServices: ['api'],
          },
        },
      },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(expectations.size).toBe(1);
    expect(emitted.some(e => e.name === 'lifecycle/design/expectation.classified' && e.data.fastPath)).toBe(true);
  });
});

// ─── Full Integration: End-to-End Lifecycle ─────────────────────────────────

describe('lifecycle/e2e', () => {
  it('full flow: expectation → version → QA → release decision', async () => {
    const log: string[] = [];

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'e2e-test',
        triggers: defineTriggers({
          'lifecycle/design/expectation.classified': {
            id: 'log-classified',
            execute: async (_e, ctx) => {
              log.push(`Classified: ${ctx.expectation?.type}`);
              return { success: true, message: 'ok' };
            },
          },
          'lifecycle/version/prerelease.tagged': {
            id: 'log-tag',
            execute: async (e) => {
              log.push(`Tagged: ${e.data.tag}`);
              return { success: true, message: 'ok' };
            },
          },
          'lifecycle/qa/qa.passed': {
            id: 'log-qa',
            execute: async () => {
              log.push('QA passed!');
              return { success: true, message: 'ok' };
            },
          },
          'lifecycle/release/release.published': [
            releasePipeline.notify(),
          ],
        }),
      }),
      expectations: [
        defineExpectation({
          id: 'dark-mode',
          type: 'feature',
          title: 'Dark Mode',
          description: 'Add dark mode',
          priority: 'medium',
          acceptance: ['Toggle works'],
        }),
      ],
      onEvent: (e) => log.push(`EVENT: ${e.name}`),
    });

    // 1. Design phase
    await bus.emit('lifecycle/design/expectation.classified', {
      expectationId: 'dark-mode',
      type: 'feature',
    });

    // 2. Version phase
    await bus.emit('lifecycle/version/prerelease.tagged', {
      tag: 'v1.1.0-rc.1',
    });

    // 3. QA phase
    await bus.emit('lifecycle/qa/qa.passed', {
      version: '1.1.0-rc.1',
    });

    // 4. Release
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await bus.emit('lifecycle/release/release.published', {
      version: '1.1.0',
    });
    spy.mockRestore();

    expect(bus.getHistory()).toHaveLength(4);
    expect(log).toContain('Classified: feature');
    expect(log).toContain('Tagged: v1.1.0-rc.1');
    expect(log).toContain('QA passed!');

    bus.destroy();
  });
});
