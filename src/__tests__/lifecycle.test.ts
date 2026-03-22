/**
 * Praxis Lifecycle Engine — Tests
 *
 * Tests the event bus, expectation DSL, classification, and trigger dispatch.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createEventBus,
  expectation,
  defineExpectation,
  classifyExpectation,
  defineTriggers,
  defineLifecycle,
  triggers,
} from '../lifecycle/index.js';
import type { LifecycleExpectation, LifecycleEvent, TriggerResult } from '../lifecycle/index.js';

// ─── Expectation DSL ────────────────────────────────────────────────────────

describe('lifecycle/expectation', () => {
  it('builds expectation with chainable API', () => {
    const exp = expectation('user-auth')
      .type('feature')
      .title('OAuth2 Authentication')
      .describe('Users authenticate via OAuth2')
      .priority('high')
      .accept('Session is created on valid token')
      .accept('Error shown for invalid token')
      .label('auth', 'frontend')
      .build();

    expect(exp.id).toBe('user-auth');
    expect(exp.type).toBe('feature');
    expect(exp.title).toBe('OAuth2 Authentication');
    expect(exp.priority).toBe('high');
    expect(exp.acceptance).toHaveLength(2);
    expect(exp.labels).toEqual(['auth', 'frontend']);
  });

  it('supports Given/When/Then syntax', () => {
    const exp = expectation('login-flow')
      .type('feature')
      .title('Login Flow')
      .describe('Standard login')
      .given('a valid token')
        .when('login is attempted')
        .then('session is created')
      .given('an invalid token')
        .when('login is attempted')
        .then('error is shown')
      .build();

    expect(exp.acceptance).toEqual([
      'Given a valid token, when login is attempted, then session is created',
      'Given an invalid token, when login is attempted, then error is shown',
    ]);
  });

  it('marks breaking changes', () => {
    const exp = expectation('api-v2')
      .type('feature')
      .title('API v2')
      .describe('New API version')
      .breaking()
      .build();

    expect(exp.breaking).toBe(true);
  });

  it('validates required fields', () => {
    expect(() => expectation('test').build()).toThrow('requires a type');
    expect(() => expectation('test').type('feature').build()).toThrow('requires a title');
    expect(() => expectation('test').type('feature').title('T').build()).toThrow('requires a description');
  });

  it('creates from plain object', () => {
    const exp = defineExpectation({
      id: 'quick-fix',
      type: 'fix',
      title: 'Fix redirect loop',
      description: 'Login redirect loop after OAuth',
      priority: 'critical',
      acceptance: ['No redirect loop'],
    });

    expect(exp.id).toBe('quick-fix');
    expect(exp.type).toBe('fix');
    expect(exp.labels).toEqual([]);
  });
});

// ─── Classification Engine ──────────────────────────────────────────────────

describe('lifecycle/classification', () => {
  it('classifies feature expectations', () => {
    const exp = defineExpectation({
      id: 'new-feature',
      type: 'feature',
      title: 'Add dark mode support',
      description: 'Implement dark mode toggle in settings',
      priority: 'medium',
      acceptance: ['Dark mode enables via toggle'],
    });

    const result = classifyExpectation(exp);
    expect(result.type).toBe('feature');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('classifies bug fixes', () => {
    const exp = defineExpectation({
      id: 'crash-fix',
      type: 'fix',
      title: 'Fix crash on startup',
      description: 'App crashes with null pointer error when opening settings',
      priority: 'high',
      acceptance: ['No crash on settings open'],
    });

    const result = classifyExpectation(exp);
    expect(result.type).toBe('fix');
  });

  it('classifies security issues', () => {
    const exp = defineExpectation({
      id: 'xss-vuln',
      type: 'security',
      title: 'Fix XSS vulnerability in comments',
      description: 'User input in comments not sanitized, allowing XSS injection',
      priority: 'critical',
      acceptance: ['All user input sanitized'],
    });

    const result = classifyExpectation(exp);
    expect(result.type).toBe('security');
    expect(result.suggestedPriority).toBe('high'); // Security minimum
  });

  it('suggests critical priority for security issues', () => {
    const exp = defineExpectation({
      id: 'auth-leak',
      type: 'security',
      title: 'Auth token exposure in logs',
      description: 'Critical security breach: auth tokens are logged in plaintext',
      priority: 'medium',
      acceptance: ['No tokens in logs'],
    });

    const result = classifyExpectation(exp);
    expect(result.suggestedPriority).toBe('critical');
  });

  it('suggests labels based on type', () => {
    const exp = defineExpectation({
      id: 'breaking-api',
      type: 'feature',
      title: 'New API endpoint',
      description: 'Add new REST API endpoint for users',
      priority: 'medium',
      acceptance: ['GET /api/users returns 200'],
      breaking: true,
    });

    const result = classifyExpectation(exp);
    expect(result.suggestedLabels).toContain('breaking-change');
  });
});

// ─── Event Bus ──────────────────────────────────────────────────────────────

describe('lifecycle/event-bus', () => {
  it('emits events and records history', async () => {
    const bus = createEventBus({
      config: defineLifecycle({ name: 'test', triggers: [] }),
    });

    await bus.emit('lifecycle/design/expectation.submitted', { id: 'test-1' });
    await bus.emit('lifecycle/develop/work.assigned', { id: 'test-1' });

    const history = bus.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].name).toBe('lifecycle/design/expectation.submitted');
    expect(history[1].name).toBe('lifecycle/develop/work.assigned');

    bus.destroy();
  });

  it('dispatches triggers on matching events', async () => {
    const handler = vi.fn(async () => ({ success: true, message: 'done' }));

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: defineTriggers({
          'lifecycle/design/expectation.submitted': {
            id: 'test-handler',
            execute: handler,
          },
        }),
      }),
    });

    await bus.emit('lifecycle/design/expectation.submitted', { id: 'exp-1' });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as LifecycleEvent;
    expect(event.data.id).toBe('exp-1');

    bus.destroy();
  });

  it('does not dispatch triggers for non-matching events', async () => {
    const handler = vi.fn(async () => ({ success: true, message: 'done' }));

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: defineTriggers({
          'lifecycle/design/expectation.submitted': {
            id: 'test-handler',
            execute: handler,
          },
        }),
      }),
    });

    await bus.emit('lifecycle/develop/work.assigned', { id: 'work-1' });

    expect(handler).not.toHaveBeenCalled();
    bus.destroy();
  });

  it('returns dispatch results with trigger outcomes', async () => {
    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: defineTriggers({
          'lifecycle/integrate/merge.executed': [
            triggers.consoleLog('🧪'),
          ],
        }),
      }),
    });

    const result = await bus.emit('lifecycle/integrate/merge.executed', { branch: 'main' });

    expect(result.triggerResults).toHaveLength(1);
    expect(result.triggerResults[0].result.success).toBe(true);

    bus.destroy();
  });

  it('handles trigger errors gracefully', async () => {
    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: defineTriggers({
          'lifecycle/design/expectation.submitted': {
            id: 'failing-handler',
            execute: async () => { throw new Error('boom'); },
          },
        }),
      }),
    });

    const result = await bus.emit('lifecycle/design/expectation.submitted', {});

    expect(result.triggerResults).toHaveLength(1);
    expect(result.triggerResults[0].result.success).toBe(false);
    expect(result.triggerResults[0].result.error).toBe('boom');

    bus.destroy();
  });

  it('manages expectations', async () => {
    const exp = defineExpectation({
      id: 'test-exp',
      type: 'feature',
      title: 'Test',
      description: 'Test expectation',
      priority: 'medium',
      acceptance: ['It works'],
    });

    const bus = createEventBus({
      config: defineLifecycle({ name: 'test', triggers: [] }),
      expectations: [exp],
    });

    expect(bus.getExpectation('test-exp')).toBeDefined();
    expect(bus.getAllExpectations()).toHaveLength(1);

    bus.addExpectation(defineExpectation({
      id: 'test-exp-2',
      type: 'fix',
      title: 'Fix',
      description: 'Fix something',
      priority: 'high',
      acceptance: ['Fixed'],
    }));

    expect(bus.getAllExpectations()).toHaveLength(2);
    bus.destroy();
  });

  it('provides expectation context to triggers', async () => {
    const exp = defineExpectation({
      id: 'auth-feature',
      type: 'feature',
      title: 'Auth',
      description: 'Authentication',
      priority: 'high',
      acceptance: ['Auth works'],
    });

    let receivedCtx: any;

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: defineTriggers({
          'lifecycle/design/expectation.classified': {
            id: 'ctx-checker',
            execute: async (_event, ctx) => {
              receivedCtx = ctx;
              return { success: true, message: 'checked' };
            },
          },
        }),
      }),
      expectations: [exp],
    });

    await bus.emit('lifecycle/design/expectation.classified', {
      expectationId: 'auth-feature',
      type: 'feature',
    });

    expect(receivedCtx.expectation).toBeDefined();
    expect(receivedCtx.expectation.id).toBe('auth-feature');
    expect(receivedCtx.expectations.size).toBe(1);

    bus.destroy();
  });

  it('fires onEvent callback', async () => {
    const events: LifecycleEvent[] = [];

    const bus = createEventBus({
      config: defineLifecycle({ name: 'test', triggers: [] }),
      onEvent: (e) => events.push(e),
    });

    await bus.emit('lifecycle/develop/commit.validated', { files: 3 });

    expect(events).toHaveLength(1);
    expect(events[0].data.files).toBe(3);

    bus.destroy();
  });

  it('fires onTrigger callback', async () => {
    const results: TriggerResult[] = [];

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: defineTriggers({
          'lifecycle/develop/commit.pushed': triggers.consoleLog('📤'),
        }),
      }),
      onTrigger: (_event, _id, result) => results.push(result),
    });

    await bus.emit('lifecycle/develop/commit.pushed', {});

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);

    bus.destroy();
  });

  it('supports conditional triggers with when()', async () => {
    const handler = vi.fn(async () => ({ success: true, message: 'executed' }));

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: [{
          on: 'lifecycle/design/expectation.classified',
          when: (event) => event.data.type === 'security',
          actions: [{ id: 'security-handler', execute: handler }],
        }],
      }),
    });

    // Should NOT fire — type is feature
    await bus.emit('lifecycle/design/expectation.classified', { type: 'feature' });
    expect(handler).not.toHaveBeenCalled();

    // SHOULD fire — type is security
    await bus.emit('lifecycle/design/expectation.classified', { type: 'security' });
    expect(handler).toHaveBeenCalledTimes(1);

    bus.destroy();
  });

  it('supports adding triggers at runtime', async () => {
    const handler = vi.fn(async () => ({ success: true, message: 'dynamic' }));

    const bus = createEventBus({
      config: defineLifecycle({ name: 'test', triggers: [] }),
    });

    bus.addTrigger({
      on: 'lifecycle/qa/qa.passed',
      actions: [{ id: 'dynamic-handler', execute: handler }],
    });

    await bus.emit('lifecycle/qa/qa.passed', {});
    expect(handler).toHaveBeenCalledTimes(1);

    bus.destroy();
  });

  it('supports removing triggers', async () => {
    const handler = vi.fn(async () => ({ success: true, message: 'removed' }));

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test',
        triggers: defineTriggers({
          'lifecycle/qa/qa.failed': { id: 'removable', execute: handler },
        }),
      }),
    });

    await bus.emit('lifecycle/qa/qa.failed', {});
    expect(handler).toHaveBeenCalledTimes(1);

    bus.removeTrigger('lifecycle/qa/qa.failed', 'removable');

    await bus.emit('lifecycle/qa/qa.failed', {});
    expect(handler).toHaveBeenCalledTimes(1); // Not called again

    bus.destroy();
  });

  it('throws on emit after destroy', async () => {
    const bus = createEventBus({
      config: defineLifecycle({ name: 'test', triggers: [] }),
    });

    bus.destroy();

    await expect(bus.emit('lifecycle/design/repo.created', {}))
      .rejects.toThrow('destroyed');
  });
});

// ─── Trigger Adapters ───────────────────────────────────────────────────────

describe('lifecycle/triggers', () => {
  it('consoleLog action logs events', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const action = triggers.consoleLog('🧪');
    const result = await action.execute(
      { name: 'lifecycle/develop/commit.pushed', timestamp: Date.now(), data: { sha: 'abc' }, source: 'test' },
      {} as any,
    );

    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('commit.pushed'));

    spy.mockRestore();
  });

  it('custom action executes function', async () => {
    const action = triggers.custom('my-action', async (event) => ({
      success: true,
      message: `Processed ${event.name}`,
    }));

    const result = await action.execute(
      { name: 'lifecycle/qa/qa.passed', timestamp: Date.now(), data: {}, source: 'test' },
      {} as any,
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('qa.passed');
  });

  it('version.bumpSemver calculates from expectations', async () => {
    const action = triggers.version.bumpSemver();

    // Feature expectations → minor bump
    const ctx = {
      getAllExpectations: () => [
        defineExpectation({ id: 'f1', type: 'feature', title: 'A', description: 'B', priority: 'medium', acceptance: [] }),
      ],
      expectations: new Map(),
      config: defineLifecycle({ name: 'test', triggers: [] }),
      emit: () => {},
    } as any;

    const result = await action.execute(
      { name: 'lifecycle/integrate/merge.executed', timestamp: Date.now(), data: {}, source: 'test' },
      ctx,
    );

    expect(result.data?.bump).toBe('minor');
  });

  it('version.bumpSemver detects breaking changes', async () => {
    const action = triggers.version.bumpSemver();

    const ctx = {
      getAllExpectations: () => [
        defineExpectation({ id: 'f1', type: 'feature', title: 'A', description: 'B', priority: 'medium', acceptance: [], breaking: true }),
      ],
      expectations: new Map(),
      config: defineLifecycle({ name: 'test', triggers: [] }),
      emit: () => {},
    } as any;

    const result = await action.execute(
      { name: 'lifecycle/integrate/merge.executed', timestamp: Date.now(), data: {}, source: 'test' },
      ctx,
    );

    expect(result.data?.bump).toBe('major');
  });
});

// ─── Config Helpers ─────────────────────────────────────────────────────────

describe('lifecycle/config', () => {
  it('defineTriggers converts map to definitions', () => {
    const defs = defineTriggers({
      'lifecycle/design/expectation.submitted': triggers.consoleLog(),
      'lifecycle/qa/qa.passed': [
        triggers.release.promoteToStable(),
        triggers.registry.publishStable({ registries: ['npm'] }),
      ],
    });

    expect(defs).toHaveLength(2);
    expect(defs[0].on).toBe('lifecycle/design/expectation.submitted');
    expect(defs[0].actions).toHaveLength(1);
    expect(defs[1].on).toBe('lifecycle/qa/qa.passed');
    expect(defs[1].actions).toHaveLength(2);
  });

  it('defineLifecycle fills defaults', () => {
    const config = defineLifecycle({ name: 'my-app', triggers: [] });

    expect(config.name).toBe('my-app');
    expect(config.versioning?.strategy).toBe('expectation-driven');
    expect(config.qa?.branchPrefix).toBe('qa/');
  });
});

// ─── Integration: Full Lifecycle Flow ───────────────────────────────────────

describe('lifecycle/integration', () => {
  it('expectation → classify → event bus → triggers', async () => {
    // 1. Create an expectation
    const exp = expectation('oauth-login')
      .type('feature')
      .title('OAuth2 Login')
      .describe('Add OAuth2 authentication support')
      .priority('high')
      .given('a valid Google OAuth token')
        .when('login is attempted')
        .then('session is created')
      .accept('Error shown for invalid tokens')
      .build();

    // 2. Classify it
    const classification = classifyExpectation(exp);
    expect(classification.type).toBe('feature');

    // 3. Set up event bus with triggers
    const triggerLog: string[] = [];

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test-app',
        triggers: defineTriggers({
          'lifecycle/design/expectation.classified': triggers.custom(
            'log-classification',
            async (event, ctx) => {
              triggerLog.push(`Classified: ${ctx.expectation?.title} as ${event.data.type}`);
              return { success: true, message: 'logged' };
            },
          ),
          'lifecycle/develop/work.assigned': triggers.custom(
            'log-assignment',
            async (event) => {
              triggerLog.push(`Work assigned: ${event.data.assignee}`);
              return { success: true, message: 'assigned' };
            },
          ),
        }),
      }),
      expectations: [exp],
    });

    // 4. Submit the expectation (emits classified event)
    await bus.emit('lifecycle/design/expectation.classified', {
      expectationId: 'oauth-login',
      type: classification.type,
      confidence: classification.confidence,
    });

    // 5. Assign work
    await bus.emit('lifecycle/develop/work.assigned', {
      expectationId: 'oauth-login',
      assignee: 'copilot',
    });

    expect(triggerLog).toEqual([
      'Classified: OAuth2 Login as feature',
      'Work assigned: copilot',
    ]);

    expect(bus.getHistory()).toHaveLength(2);

    bus.destroy();
  });

  it('full QA cycle: prerelease → qa fail → new expectations → fix', async () => {
    const triggerLog: string[] = [];

    const originalExp = defineExpectation({
      id: 'dark-mode',
      type: 'feature',
      title: 'Dark Mode',
      description: 'Add dark mode toggle',
      priority: 'medium',
      acceptance: ['Toggle switches theme', 'Preference persists'],
    });

    const bus = createEventBus({
      config: defineLifecycle({
        name: 'test-app',
        triggers: defineTriggers({
          'lifecycle/version/prerelease.tagged': triggers.custom(
            'log-tag',
            async (event) => {
              triggerLog.push(`Tagged: ${event.data.tag}`);
              return { success: true, message: 'tagged' };
            },
          ),
          'lifecycle/qa/qa.failed': [
            triggers.custom('log-failure', async () => {
              triggerLog.push('QA failed');
              return { success: true, message: 'logged' };
            }),
            triggers.expectations.createFromQAResults(),
          ],
        }),
      }),
      expectations: [originalExp],
    });

    // Tag prerelease
    await bus.emit('lifecycle/version/prerelease.tagged', {
      tag: 'v1.1.0-rc.1',
      expectationId: 'dark-mode',
    });

    // QA fails
    const qaResult = await bus.emit('lifecycle/qa/qa.failed', {
      expectationId: 'dark-mode',
      failures: [
        { test: 'Dark mode toggle', error: 'Toggle does not respond to click events' },
        { test: 'Theme persistence', error: 'LocalStorage key is never written' },
      ],
    });

    expect(triggerLog).toContain('QA failed');

    // The expectations adapter should have created new fix expectations
    const allExp = bus.getAllExpectations();
    expect(allExp.length).toBeGreaterThan(1);

    const fixExpectations = allExp.filter(e => e.type === 'fix');
    expect(fixExpectations).toHaveLength(2);
    expect(fixExpectations[0].title).toContain('Fix:');

    bus.destroy();
  });
});
