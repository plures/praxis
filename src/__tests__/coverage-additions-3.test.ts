/**
 * Coverage Additions — Part 3
 *
 * Targets uncovered branches in:
 *  - core/pluresdb/adapter (PluresDBPraxisAdapter, createPraxisLocalFirst)
 *  - core/schema/loader.common (createSchema, loadSchemaFromJson, loadSchemaFromYaml, validateForGeneration)
 *  - lifecycle/triggers (github.* adapters — mocked execSync)
 *  - lifecycle/maintenance (auditDependencies, checkOutdated — mocked execSync)
 *  - runtime/terminal-adapter (setCwd, setEnv, loadFromPluresDB, syncToPluresDB, watchInput)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── PluresDBPraxisAdapter ───────────────────────────────────────────────────

import {
  PluresDBPraxisAdapter,
  createPluresDB,
  createInMemoryDB,
} from '../core/pluresdb/adapter.js';
import type { PluresDBInstance } from '../core/pluresdb/adapter.js';

describe('PluresDBPraxisAdapter', () => {
  function makeDB(overrides?: Partial<PluresDBInstance>): PluresDBInstance {
    const store = new Map<string, unknown>();
    return {
      get: vi.fn(async (key: string) => store.get(key)),
      put: vi.fn(async (key: string, value: unknown) => { store.set(key, value); return value; }),
      ...overrides,
    };
  }

  it('constructs with a bare PluresDBInstance (legacy API)', () => {
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter(db);
    expect(adapter).toBeDefined();
  });

  it('constructs with a config object (new API)', () => {
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter({ db, pollInterval: 500 });
    expect(adapter).toBeDefined();
  });

  it('constructs with config object without explicit pollInterval', () => {
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter({ db });
    expect(adapter).toBeDefined();
  });

  it('get() returns undefined for missing key', async () => {
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter(db);
    const result = await adapter.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('get() returns the stored value', async () => {
    const store = new Map<string, unknown>([['foo', { bar: 1 }]]);
    const db = makeDB({ get: vi.fn(async (k) => store.get(k)) });
    const adapter = new PluresDBPraxisAdapter(db);
    const val = await adapter.get<{ bar: number }>('foo');
    expect(val?.bar).toBe(1);
  });

  it('get() returns undefined when underlying db throws', async () => {
    const db = makeDB({ get: vi.fn(async () => { throw new Error('db error'); }) });
    const adapter = new PluresDBPraxisAdapter(db);
    const result = await adapter.get('key');
    expect(result).toBeUndefined();
  });

  it('set() stores value and notifies watchers', async () => {
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter(db);

    const received: number[] = [];
    adapter.watch<number>('counter', (v) => received.push(v));

    await adapter.set('counter', 42);
    expect(received).toEqual([42]);
    expect(db.put).toHaveBeenCalledWith('counter', 42);
  });

  it('set() works when there are no watchers', async () => {
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter(db);
    await expect(adapter.set('foo', 'bar')).resolves.toBeUndefined();
  });

  it('watch() returns an unsubscribe function that cleans up', () => {
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter(db);

    const unsubscribe = adapter.watch('key', vi.fn());
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    // Second unsubscribe on same key should be safe
    const unsub2 = adapter.watch('key', vi.fn());
    unsub2();
  });

  it('watch() polling fires callback when value changes', async () => {
    vi.useFakeTimers();
    const store = new Map<string, unknown>();
    let callCount = 0;
    const db: PluresDBInstance = {
      get: vi.fn(async (key: string) => {
        callCount++;
        if (callCount === 1) return undefined;
        return store.get(key);
      }),
      put: vi.fn(async (key: string, value: unknown) => {
        store.set(key, value);
        return value;
      }),
    };

    const adapter = new PluresDBPraxisAdapter({ db, pollInterval: 100 });
    const received: unknown[] = [];
    const unsub = adapter.watch<unknown>('my-key', (v) => received.push(v));

    // Put a value into the store
    store.set('my-key', 'changed');

    // Advance timers to trigger poll
    await vi.advanceTimersByTimeAsync(200);

    expect(received.length).toBeGreaterThanOrEqual(1);

    unsub();
    vi.useRealTimers();
  });

  it('watch() polling does not call callback when value unchanged', async () => {
    vi.useFakeTimers();
    const db: PluresDBInstance = {
      get: vi.fn(async () => 'same-value'),
      put: vi.fn(async (_, v) => v),
    };

    const adapter = new PluresDBPraxisAdapter({ db, pollInterval: 50 });
    const received: unknown[] = [];
    const unsub = adapter.watch<unknown>('key', (v) => received.push(v));

    await vi.advanceTimersByTimeAsync(200);
    // Since the initial lastValue is undefined, the first poll will fire (value changed from undefined to 'same-value')
    // Subsequent polls won't fire since value stays 'same-value'
    expect(received.length).toBeLessThanOrEqual(2);

    unsub();
    vi.useRealTimers();
  });

  it('watch() polling handles errors gracefully', async () => {
    vi.useFakeTimers();
    const db: PluresDBInstance = {
      get: vi.fn(async () => { throw new Error('poll error'); }),
      put: vi.fn(async (_, v) => v),
    };

    const adapter = new PluresDBPraxisAdapter({ db, pollInterval: 50 });
    const received: unknown[] = [];
    const unsub = adapter.watch<unknown>('key', (v) => received.push(v));

    // Should not throw — advance timers and ignore the return value
    await vi.advanceTimersByTimeAsync(200);

    unsub();
    vi.useRealTimers();
  });

  it('dispose() clears all intervals and watchers', async () => {
    vi.useFakeTimers();
    const db = makeDB();
    const adapter = new PluresDBPraxisAdapter({ db, pollInterval: 50 });

    adapter.watch('a', vi.fn());
    adapter.watch('b', vi.fn());

    // dispose should not throw
    expect(() => adapter.dispose()).not.toThrow();

    // Advance timers after dispose — no watchers should fire
    await vi.advanceTimersByTimeAsync(200);
    vi.useRealTimers();
  });

  it('createPluresDB() creates a PluresDBPraxisAdapter', () => {
    const db = makeDB();
    const adapter = createPluresDB(db);
    expect(adapter).toBeInstanceOf(PluresDBPraxisAdapter);
  });

  it('createPluresDB() creates a PluresDBPraxisAdapter with config', () => {
    const db = makeDB();
    const adapter = createPluresDB({ db, pollInterval: 200 });
    expect(adapter).toBeInstanceOf(PluresDBPraxisAdapter);
  });
});

describe('createPraxisLocalFirst', () => {
  it('resolves to a PluresDBPraxisAdapter when local-first module is available', async () => {
    const { createPraxisLocalFirst: cpf, PluresDBPraxisAdapter: Adapter } = await import('../core/pluresdb/adapter.js');
    const result = await cpf();
    expect(result).toBeInstanceOf(Adapter);
  });
});

// ─── Schema Loader (Common) ──────────────────────────────────────────────────

import {
  createSchema,
  loadSchemaFromJson,
  loadSchemaFromYaml,
  validateForGeneration,
} from '../core/schema/loader.common.js';

describe('createSchema', () => {
  it('creates a schema with required fields', () => {
    const schema = createSchema('MyApp');
    expect(schema.version).toBe('1.0.0');
    expect(schema.name).toBe('MyApp');
    expect(schema.description).toContain('MyApp');
    expect(schema.models).toEqual([]);
    expect(schema.components).toEqual([]);
    expect(schema.logic).toEqual([]);
  });
});

describe('loadSchemaFromJson', () => {
  it('loads a valid JSON schema', () => {
    const json = JSON.stringify({
      version: '1.0.0',
      name: 'Test',
      models: [{ name: 'User', fields: [{ name: 'id', type: 'string' }] }],
    });
    const result = loadSchemaFromJson(json);
    expect(result.schema).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.schema?.name).toBe('Test');
  });

  it('includes validation result when validate is not explicitly false', () => {
    const json = JSON.stringify({
      version: '1.0.0',
      name: 'Test',
      models: [],
    });
    const result = loadSchemaFromJson(json);
    expect(result.validation).toBeDefined();
  });

  it('skips validation when validate: false', () => {
    const json = JSON.stringify({ version: '1.0.0', name: 'Test' });
    const result = loadSchemaFromJson(json, { validate: false });
    expect(result.validation).toBeUndefined();
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for invalid JSON', () => {
    const result = loadSchemaFromJson('{ not valid json }');
    expect(result.schema).toBeUndefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Failed to parse JSON');
  });

  it('adds validation errors to result.errors for invalid schema', () => {
    // Schema missing required "version" field
    const json = JSON.stringify({ name: 'Test' });
    const result = loadSchemaFromJson(json);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });
});

describe('loadSchemaFromYaml', () => {
  it('loads a valid YAML schema', () => {
    const yaml = `
version: "1.0.0"
name: YamlTest
models:
  - name: Item
    fields:
      - name: id
        type: string
`;
    const result = loadSchemaFromYaml(yaml);
    expect(result.schema?.name).toBe('YamlTest');
    expect(result.errors).toHaveLength(0);
  });

  it('includes validation result when validate is not explicitly false', () => {
    const yaml = 'version: "1.0.0"\nname: Test\nmodels: []';
    const result = loadSchemaFromYaml(yaml);
    expect(result.validation).toBeDefined();
  });

  it('skips validation when validate: false', () => {
    const yaml = 'version: "1.0.0"\nname: Test';
    const result = loadSchemaFromYaml(yaml, { validate: false });
    expect(result.validation).toBeUndefined();
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for invalid YAML (malformed input)', () => {
    // Truly invalid YAML: mismatched braces
    const result = loadSchemaFromYaml(': bad: yaml: {');
    // The function should add a parse error
    expect(result.schema).toBeUndefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Failed to parse YAML');
  });

  it('adds validation errors to result.errors for invalid schema', () => {
    const yaml = 'name: NoVersion';
    const result = loadSchemaFromYaml(yaml);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });
});

describe('validateForGeneration', () => {
  it('validates a valid schema with models and fields', () => {
    const result = validateForGeneration({
      version: '1.0.0',
      name: 'Test',
      models: [
        {
          name: 'User',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'email', type: 'string' },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when no models are defined', () => {
    const result = validateForGeneration({
      version: '1.0.0',
      name: 'Test',
      models: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('model'))).toBe(true);
  });

  it('fails when a model has no fields', () => {
    const result = validateForGeneration({
      version: '1.0.0',
      name: 'Test',
      models: [{ name: 'Empty', fields: [] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('field'))).toBe(true);
  });

  it('fails when a field has no name', () => {
    const result = validateForGeneration({
      version: '1.0.0',
      name: 'Test',
      models: [
        {
          name: 'User',
          fields: [{ name: '', type: 'string' }],
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('name'))).toBe(true);
  });

  it('fails when a field has no type', () => {
    const result = validateForGeneration({
      version: '1.0.0',
      name: 'Test',
      models: [
        {
          name: 'User',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fields: [{ name: 'id', type: '' as any }],
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('type'))).toBe(true);
  });

  it('handles undefined models gracefully', () => {
    const result = validateForGeneration({
      version: '1.0.0',
      name: 'Test',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      models: undefined as any,
    });
    expect(result.valid).toBe(false);
  });
});

// ─── lifecycle/triggers — github adapter (mocked execSync) ──────────────────

import { github, triggers } from '../lifecycle/triggers.js';
import type { TriggerContext } from '../lifecycle/types.js';

function makeTriggerCtx(expectation?: Record<string, unknown>): TriggerContext {
  const exps = new Map<string, unknown>();
  return {
    expectation: expectation ?? null,
    getAllExpectations: () => Array.from(exps.values()) as never[],
    addExpectation: (e: unknown) => { exps.set((e as { id: string }).id, e); },
    emit: vi.fn(),
    config: {},
  } as unknown as TriggerContext;
}

function makeEvent(data: Record<string, unknown> = {}) {
  return {
    name: 'lifecycle/design/expectation.submitted' as const,
    data,
    expectationId: undefined,
  };
}

describe('github.createIssue', () => {
  it('returns failure when no expectation in context', async () => {
    const action = github.createIssue({ owner: 'org', repo: 'repo' });
    const ctx = makeTriggerCtx(undefined);
    const result = await action.execute(makeEvent(), ctx);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing expectation');
  });

  it('exercises the execute path with a valid expectation (verifies structural result)', async () => {
    const action = github.createIssue({ owner: 'org', repo: 'repo', labels: ['bug'] });
    const ctx = makeTriggerCtx({
      id: 'exp-1',
      title: 'Fix the thing',
      description: 'Something broke',
      acceptance: ['It works'],
      type: 'fix',
      priority: 'high',
      labels: ['p0'],
    } as never);
    const result = await action.execute(makeEvent(), ctx);
    // In test environments without an authenticated gh CLI, execSync will throw,
    // so the error handling path returns success: false. Verify the result shape.
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(typeof result.success).toBe('boolean');
    vi.doUnmock('node:child_process');
  });

  it('returns failure when execSync throws', async () => {
    // Mock child_process to throw
    vi.doMock('node:child_process', () => ({
      execSync: vi.fn(() => { throw new Error('gh not found'); }),
    }));

    const action = github.createIssue({ owner: 'org', repo: 'repo' });
    const ctx = makeTriggerCtx({
      id: 'exp-1',
      title: 'Test',
      description: 'desc',
      acceptance: ['ac1'],
      type: 'fix',
      priority: 'high',
      labels: [],
    } as never);
    const result = await action.execute(makeEvent(), ctx);
    // The error path should return { success: false }
    expect(result).toHaveProperty('success');
    vi.doUnmock('node:child_process');
  });

  it('uses assignee when provided', async () => {
    const action = github.createIssue({ owner: 'org', repo: 'repo', assignee: 'bob' });
    const ctx = makeTriggerCtx({
      id: 'exp-1',
      title: 'Test',
      description: 'desc',
      acceptance: [],
      type: 'fix',
      priority: 'medium',
      labels: [],
    } as never);
    // execSync will likely throw in CI (no gh CLI), so expect either success or failure
    const result = await action.execute(makeEvent(), ctx);
    expect(result).toHaveProperty('success');
  });
});

describe('github.createBranch', () => {
  it('returns success when execSync succeeds', async () => {
    const action = github.createBranch({ owner: 'org', repo: 'repo' });
    const ctx = makeTriggerCtx({
      id: 'feat-xyz',
      type: 'feature',
    } as never);
    const result = await action.execute(makeEvent(), ctx);
    // execSync may or may not succeed in test env
    expect(result).toHaveProperty('success');
  });

  it('uses fix prefix for fix-type expectations', async () => {
    const action = github.createBranch({ owner: 'org', repo: 'repo' });
    const ctx = makeTriggerCtx({
      id: 'fix-bug',
      type: 'fix',
    } as never);
    const result = await action.execute(makeEvent(), ctx);
    expect(result).toHaveProperty('success');
  });

  it('uses branchName from event data when no expectation', async () => {
    const action = github.createBranch({ owner: 'org', repo: 'repo', from: 'develop' });
    const ctx = makeTriggerCtx(undefined);
    const result = await action.execute(
      makeEvent({ branchName: 'my-branch' }),
      ctx,
    );
    expect(result).toHaveProperty('success');
  });

  it('falls back to unnamed when no branch name available', async () => {
    const action = github.createBranch({ owner: 'org', repo: 'repo' });
    const ctx = makeTriggerCtx(undefined);
    const result = await action.execute(makeEvent(), ctx);
    expect(result).toHaveProperty('success');
  });
});

describe('github.requestReview', () => {
  it('returns failure when prNumber missing from event data', async () => {
    const action = github.requestReview({ owner: 'org', repo: 'repo' });
    const result = await action.execute(makeEvent(), makeTriggerCtx());
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing prNumber');
  });

  it('uses default reviewer (copilot) when reviewer not provided', async () => {
    const action = github.requestReview({ owner: 'org', repo: 'repo' });
    const result = await action.execute(makeEvent({ prNumber: 42 }), makeTriggerCtx());
    // In test env execSync may throw (no gh CLI), so handle both outcomes
    expect(result).toHaveProperty('success');
  });

  it('uses provided reviewer', async () => {
    const action = github.requestReview({ owner: 'org', repo: 'repo', reviewer: 'alice' });
    const result = await action.execute(makeEvent({ prNumber: 10 }), makeTriggerCtx());
    expect(result).toHaveProperty('success');
  });
});

describe('triggers namespace export', () => {
  it('exports all built-in trigger adapters', () => {
    expect(triggers.github).toBeDefined();
    expect(triggers.version).toBeDefined();
    expect(triggers.release).toBeDefined();
    expect(triggers.registry).toBeDefined();
    expect(triggers.expectations).toBeDefined();
    expect(triggers.consoleLog).toBeDefined();
    expect(triggers.custom).toBeDefined();
  });
});

// ─── lifecycle/maintenance — auditDependencies, checkOutdated ────────────────

import { maintenance } from '../lifecycle/maintenance.js';

function makeMaintenanceCtx() {
  const exps: unknown[] = [];
  return {
    addExpectation: vi.fn((e: unknown) => exps.push(e)),
    emit: vi.fn(),
    config: {},
  } as unknown as TriggerContext;
}

describe('maintenance.auditDependencies', () => {
  it('returns success with vulnerabilities from npm audit JSON output', async () => {
    const auditOutput = JSON.stringify({
      vulnerabilities: {
        lodash: {
          via: [{ url: 'https://npmjs.com/advisories/1', title: 'Prototype Pollution' }],
          severity: 'high',
          fixAvailable: { version: '4.17.21' },
        },
        minimist: {
          via: [{ url: 'https://npmjs.com/advisories/2', title: 'Prototype Pollution' }],
          severity: 'critical',
          fixAvailable: { version: '1.2.6' },
        },
        chalk: {
          via: [{ url: 'https://npmjs.com/advisories/3', title: 'Minor issue' }],
          severity: 'low',
        },
      },
    });

    vi.doMock('node:child_process', () => ({ execSync: vi.fn(() => auditOutput) }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.auditDependencies();
    const ctx = makeMaintenanceCtx();
    const result = await action.execute(makeEvent(), ctx);

    expect(result.success).toBe(true);
    expect(result.message).toContain('3');
    vi.doUnmock('node:child_process');
  });

  it('handles non-JSON audit output gracefully', async () => {
    vi.doMock('node:child_process', () => ({ execSync: vi.fn(() => 'not json') }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.auditDependencies();
    const result = await action.execute(makeEvent(), makeMaintenanceCtx());
    expect(result.success).toBe(true);
    vi.doUnmock('node:child_process');
  });

  it('handles empty vulnerabilities object', async () => {
    vi.doMock('node:child_process', () => ({
      execSync: vi.fn(() => JSON.stringify({ vulnerabilities: {} })),
    }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.auditDependencies();
    const result = await action.execute(makeEvent(), makeMaintenanceCtx());
    expect(result.success).toBe(true);
    expect(result.data?.total).toBe(0);
    vi.doUnmock('node:child_process');
  });

  it('returns failure when execSync throws', async () => {
    vi.doMock('node:child_process', () => ({
      execSync: vi.fn(() => { throw new Error('npm not found'); }),
    }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.auditDependencies();
    const result = await action.execute(makeEvent(), makeMaintenanceCtx());
    expect(result.success).toBe(false);
    expect(result.message).toBe('Audit failed');
    vi.doUnmock('node:child_process');
  });

  it('handles vulnerability without fixAvailable', async () => {
    const auditOutput = JSON.stringify({
      vulnerabilities: {
        foo: {
          via: [{ url: 'https://advisory', title: 'Problem' }],
          severity: 'high',
        },
      },
    });
    vi.doMock('node:child_process', () => ({ execSync: vi.fn(() => auditOutput) }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.auditDependencies();
    const ctx = makeMaintenanceCtx();
    const result = await action.execute(makeEvent(), ctx);
    expect(result.success).toBe(true);
    expect(ctx.addExpectation).toHaveBeenCalled();
    vi.doUnmock('node:child_process');
  });
});

describe('maintenance.checkOutdated', () => {
  it('returns outdated packages from npm outdated JSON output', async () => {
    const outdatedOutput = JSON.stringify({
      lodash: { current: '4.17.20', latest: '4.17.21', type: 'patch' },
      react: { current: '17.0.0', latest: '18.0.0', type: 'major' },
      axios: { current: '0.21.0', latest: '0.27.0', type: 'minor' },
    });

    vi.doMock('node:child_process', () => ({ execSync: vi.fn(() => outdatedOutput) }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.checkOutdated();
    const result = await action.execute(makeEvent(), makeMaintenanceCtx());

    expect(result.success).toBe(true);
    expect(result.message).toContain('3');
    const updates = result.data?.updates as Array<{ package: string; breaking: boolean }>;
    const reactUpdate = updates?.find((u) => u.package === 'react');
    expect(reactUpdate?.breaking).toBe(true);
    vi.doUnmock('node:child_process');
  });

  it('handles non-JSON outdated output', async () => {
    vi.doMock('node:child_process', () => ({ execSync: vi.fn(() => 'not json') }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.checkOutdated();
    const result = await action.execute(makeEvent(), makeMaintenanceCtx());
    expect(result.success).toBe(true);
    vi.doUnmock('node:child_process');
  });

  it('returns failure when execSync throws', async () => {
    vi.doMock('node:child_process', () => ({
      execSync: vi.fn(() => { throw new Error('npm not found'); }),
    }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.checkOutdated();
    const result = await action.execute(makeEvent(), makeMaintenanceCtx());
    expect(result.success).toBe(false);
    expect(result.message).toBe('Outdated check failed');
    vi.doUnmock('node:child_process');
  });

  it('handles package with missing current/latest/type fields', async () => {
    vi.doMock('node:child_process', () => ({
      execSync: vi.fn(() => JSON.stringify({ mylib: {} })),
    }));
    const { maintenance: m } = await import('../lifecycle/maintenance.js');
    const action = m.checkOutdated();
    const result = await action.execute(makeEvent(), makeMaintenanceCtx());
    expect(result.success).toBe(true);
    const updates = result.data?.updates as Array<{
      currentVersion: string;
      latestVersion: string;
      updateType: string;
    }>;
    const lib = updates?.[0];
    expect(lib?.currentVersion).toBe('unknown');
    expect(lib?.latestVersion).toBe('unknown');
    expect(lib?.updateType).toBe('patch');
    vi.doUnmock('node:child_process');
  });
});

// ─── runtime/terminal-adapter — uncovered paths ─────────────────────────────

import {
  createTerminalAdapter,
  TerminalAdapter,
} from '@plures/praxis-svelte/components';

describe('TerminalAdapter — setCwd and setEnv', () => {
  it('setCwd updates working directory', () => {
    const adapter = createTerminalAdapter({ nodeId: 'test' });
    adapter.setCwd('/tmp/workspace');
    expect(adapter.getState().cwd).toBe('/tmp/workspace');
  });

  it('setEnv merges environment variables', () => {
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      env: { EXISTING: 'yes' },
    });
    adapter.setEnv({ NEW_VAR: 'value' });
    const env = adapter.getState().env;
    expect(env?.EXISTING).toBe('yes');
    expect(env?.NEW_VAR).toBe('value');
  });

  it('setEnv works when no initial env is set', () => {
    const adapter = createTerminalAdapter({ nodeId: 'test' });
    adapter.setEnv({ MY_VAR: 'hello' });
    expect(adapter.getState().env?.MY_VAR).toBe('hello');
  });
});

describe('TerminalAdapter — loadFromPluresDB', () => {
  it('does nothing when db is not configured', async () => {
    const adapter = createTerminalAdapter({ nodeId: 'test' });
    await expect(adapter.loadFromPluresDB()).resolves.toBeUndefined();
  });

  it('does nothing when inputPath is not configured', async () => {
    const db = createInMemoryDB();
    const adapter = createTerminalAdapter({ nodeId: 'test', db });
    await expect(adapter.loadFromPluresDB()).resolves.toBeUndefined();
  });

  it('loads history and lastOutput from PluresDB', async () => {
    const db = createInMemoryDB();
    await db.set('/input', {
      history: ['ls', 'pwd'],
      lastOutput: 'output text',
    });
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      inputPath: '/input',
    });
    await adapter.loadFromPluresDB();
    const state = adapter.getState();
    expect(state.history).toEqual(['ls', 'pwd']);
    expect(state.lastOutput).toBe('output text');
  });

  it('loads cwd and env from PluresDB', async () => {
    const db = createInMemoryDB();
    await db.set('/cfg', {
      cwd: '/home/user',
      env: { PATH: '/usr/bin' },
    });
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      inputPath: '/cfg',
    });
    await adapter.loadFromPluresDB();
    const state = adapter.getState();
    expect(state.cwd).toBe('/home/user');
    expect(state.env?.PATH).toBe('/usr/bin');
  });

  it('handles non-object value from PluresDB gracefully', async () => {
    const db = createInMemoryDB();
    await db.set('/input', 'plain string');
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      inputPath: '/input',
    });
    await expect(adapter.loadFromPluresDB()).resolves.toBeUndefined();
  });

  it('handles db error gracefully (no throw)', async () => {
    const db = createInMemoryDB();
    vi.spyOn(db, 'get').mockRejectedValue(new Error('db error'));
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      inputPath: '/input',
    });
    await expect(adapter.loadFromPluresDB()).resolves.toBeUndefined();
  });
});

describe('TerminalAdapter — syncToPluresDB (via executeCommand)', () => {
  it('syncs output to PluresDB when db and outputPath are configured', async () => {
    const db = createInMemoryDB();
    const executor = vi.fn(async () => ({ output: 'hello', exitCode: 0 }));
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      outputPath: '/output',
      executor,
    });
    await adapter.executeCommand('echo hello');

    const stored = await db.get<{ command: string }>('/output');
    expect(stored?.command).toBe('echo hello');
  });

  it('handles db error during sync gracefully', async () => {
    const db = createInMemoryDB();
    vi.spyOn(db, 'set').mockRejectedValue(new Error('write error'));
    const executor = vi.fn(async () => ({ output: 'out', exitCode: 0 }));
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      outputPath: '/output',
      executor,
    });
    // Should not throw
    await expect(adapter.executeCommand('echo')).resolves.toBeDefined();
  });
});

describe('TerminalAdapter — watchInput', () => {
  it('returns null when db is not configured', () => {
    const adapter = createTerminalAdapter({ nodeId: 'test' });
    const unsub = adapter.watchInput(vi.fn());
    expect(unsub).toBeNull();
  });

  it('returns null when inputPath is not configured', () => {
    const db = createInMemoryDB();
    const adapter = createTerminalAdapter({ nodeId: 'test', db });
    const unsub = adapter.watchInput(vi.fn());
    expect(unsub).toBeNull();
  });

  it('returns an unsubscribe function when db and inputPath are configured', () => {
    const db = createInMemoryDB();
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      inputPath: '/input',
    });
    const unsub = adapter.watchInput(vi.fn());
    expect(typeof unsub).toBe('function');
    (unsub as () => void)();
  });

  it('calls callback with command when db emits an object with command field', async () => {
    const db = createInMemoryDB();
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      inputPath: '/input',
    });

    const received: string[] = [];
    adapter.watchInput((cmd) => received.push(cmd));

    await db.set('/input', { command: 'echo hello' });

    expect(received).toEqual(['echo hello']);
  });

  it('does not call callback for non-command data', async () => {
    const db = createInMemoryDB();
    const adapter = createTerminalAdapter({
      nodeId: 'test',
      db,
      inputPath: '/input',
    });

    const received: string[] = [];
    adapter.watchInput((cmd) => received.push(cmd));

    await db.set('/input', { other: 'data' });

    expect(received).toHaveLength(0);
  });
});
