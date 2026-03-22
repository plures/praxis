/**
 * Praxis Git Hooks — Tests
 *
 * Tests the reactive hook evaluation without actually installing git hooks.
 * Uses mock contexts to verify rule behavior.
 */

import { describe, it, expect } from 'vitest';
import { buildHookContext } from '../hooks/context.js';
import { evaluateHook } from '../hooks/evaluate.js';
import type { GitHookContext, PraxisHooksConfig } from '../hooks/types.js';

// ─── Mock Context Builder ───────────────────────────────────────────────────

function mockContext(overrides: Partial<GitHookContext>): GitHookContext {
  return {
    hook: 'post-commit',
    branch: 'main',
    stagedFiles: [],
    diffStats: [],
    linesAdded: 0,
    linesRemoved: 0,
    repoRoot: '/tmp/test-repo',
    timestamp: Date.now(),
    ...overrides,
  };
}

const defaultConfig: PraxisHooksConfig = {
  hooks: ['pre-commit', 'commit-msg', 'post-commit'],
  autoPush: false,
  autoPushRemote: 'origin',
  meaningfulPaths: ['src/', 'lib/', 'research/', 'docs/'],
  meaningfulThreshold: 10,
};

// ─── Meaningful Work Detection ──────────────────────────────────────────────

describe('hooks/meaningful-work', () => {
  it('detects meaningful work above threshold', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      diffStats: [
        { file: 'src/index.ts', added: 50, removed: 10 },
        { file: 'src/utils.ts', added: 20, removed: 5 },
      ],
      linesAdded: 70,
      linesRemoved: 15,
      commitSha: 'abc123',
    });

    const result = await evaluateHook(ctx, defaultConfig);
    const meaningfulFact = result.facts.find(f => f.tag === 'hooks.meaningful-work');

    expect(meaningfulFact).toBeDefined();
    expect((meaningfulFact!.payload as any).linesChanged).toBe(85);
    expect((meaningfulFact!.payload as any).files).toHaveLength(2);
  });

  it('skips trivial changes below threshold', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      diffStats: [
        { file: 'src/index.ts', added: 2, removed: 1 },
      ],
      linesAdded: 2,
      linesRemoved: 1,
    });

    const result = await evaluateHook(ctx, defaultConfig);
    const meaningfulFact = result.facts.find(f => f.tag === 'hooks.meaningful-work');

    expect(meaningfulFact).toBeUndefined();
  });

  it('ignores files outside meaningful paths', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      diffStats: [
        { file: '.gitignore', added: 50, removed: 0 },
        { file: 'package.json', added: 30, removed: 10 },
      ],
      linesAdded: 80,
      linesRemoved: 10,
    });

    const result = await evaluateHook(ctx, defaultConfig);
    const meaningfulFact = result.facts.find(f => f.tag === 'hooks.meaningful-work');

    expect(meaningfulFact).toBeUndefined();
  });

  it('counts research/ as meaningful', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      diffStats: [
        { file: 'research/bitnet.md', added: 100, removed: 0 },
      ],
      linesAdded: 100,
      linesRemoved: 0,
      commitSha: 'def456',
    });

    const result = await evaluateHook(ctx, defaultConfig);
    const meaningfulFact = result.facts.find(f => f.tag === 'hooks.meaningful-work');

    expect(meaningfulFact).toBeDefined();
    expect((meaningfulFact!.payload as any).linesChanged).toBe(100);
  });
});

// ─── Auto-Push ──────────────────────────────────────────────────────────────

describe('hooks/auto-push', () => {
  it('triggers auto-push when enabled and work is meaningful', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      branch: 'main',
      diffStats: [
        { file: 'src/hooks/evaluate.ts', added: 200, removed: 50 },
      ],
      linesAdded: 200,
      linesRemoved: 50,
      commitSha: 'abc123',
    });

    const config = { ...defaultConfig, autoPush: true };
    const result = await evaluateHook(ctx, config);

    const pushFact = result.facts.find(f => f.tag === 'hooks.auto-push');
    expect(pushFact).toBeDefined();
    expect((pushFact!.payload as any).remote).toBe('origin');
    expect((pushFact!.payload as any).branch).toBe('main');

    const pushAction = result.actions.find(a => a.type === 'push');
    expect(pushAction).toBeDefined();
  });

  it('does not auto-push when disabled', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      diffStats: [
        { file: 'src/index.ts', added: 200, removed: 50 },
      ],
      linesAdded: 200,
      linesRemoved: 50,
    });

    const result = await evaluateHook(ctx, defaultConfig);
    const pushFact = result.facts.find(f => f.tag === 'hooks.auto-push');

    expect(pushFact).toBeUndefined();
  });

  it('does not auto-push for trivial changes', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      diffStats: [
        { file: 'src/index.ts', added: 1, removed: 0 },
      ],
      linesAdded: 1,
      linesRemoved: 0,
    });

    const config = { ...defaultConfig, autoPush: true };
    const result = await evaluateHook(ctx, config);

    const pushFact = result.facts.find(f => f.tag === 'hooks.auto-push');
    expect(pushFact).toBeUndefined();
  });
});

// ─── Commit Message Validation ──────────────────────────────────────────────

describe('hooks/commit-message', () => {
  it('validates conventional commit messages', async () => {
    const ctx = mockContext({
      hook: 'commit-msg',
      commitMessage: 'feat(hooks): add reactive git hook integration',
    });

    const result = await evaluateHook(ctx, defaultConfig);
    const validFact = result.facts.find(f => f.tag === 'hooks.commit-msg.valid');

    expect(validFact).toBeDefined();
    expect(result.proceed).toBe(true);
  });

  it('reports invalid commit messages (non-blocking by default)', async () => {
    const ctx = mockContext({
      hook: 'commit-msg',
      commitMessage: 'fixed stuff',
    });

    const result = await evaluateHook(ctx, defaultConfig);
    const invalidFact = result.facts.find(f => f.tag === 'hooks.commit-msg.invalid');

    expect(invalidFact).toBeDefined();
    // Non-blocking by default (no commitPattern in config = just report)
    expect(result.proceed).toBe(true);
  });

  it('blocks invalid messages when commitPattern is set (constraint mode)', async () => {
    const ctx = mockContext({
      hook: 'commit-msg',
      commitMessage: 'wip',
    });

    const config: PraxisHooksConfig = {
      ...defaultConfig,
      commitPattern: '^(feat|fix|docs|chore)(\\(.+\\))?: .+',
    };

    const result = await evaluateHook(ctx, config);
    expect(result.proceed).toBe(false);
    expect(result.actions.some(a => a.type === 'block')).toBe(true);
  });

  it('allows valid messages in constraint mode', async () => {
    const ctx = mockContext({
      hook: 'commit-msg',
      commitMessage: 'feat(hooks): reactive git integration',
    });

    const config: PraxisHooksConfig = {
      ...defaultConfig,
      commitPattern: '^(feat|fix|docs|chore)(\\(.+\\))?: .+',
    };

    const result = await evaluateHook(ctx, config);
    expect(result.proceed).toBe(true);
  });
});

// ─── Hook Type Routing ──────────────────────────────────────────────────────

describe('hooks/routing', () => {
  it('pre-commit produces allow action with no violations', async () => {
    const ctx = mockContext({
      hook: 'pre-commit',
      stagedFiles: ['src/index.ts'],
      diffStats: [{ file: 'src/index.ts', added: 5, removed: 2 }],
    });

    const result = await evaluateHook(ctx, defaultConfig);
    expect(result.proceed).toBe(true);
    expect(result.actions.some(a => a.type === 'allow')).toBe(true);
  });

  it('post-checkout produces allow action', async () => {
    const ctx = mockContext({
      hook: 'post-checkout',
      previousHead: 'abc123',
      newHead: 'def456',
      isBranchSwitch: true,
    });

    const result = await evaluateHook(ctx, defaultConfig);
    expect(result.proceed).toBe(true);
  });
});

// ─── Summary Generation ─────────────────────────────────────────────────────

describe('hooks/summary', () => {
  it('generates meaningful summary for auto-push', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      branch: 'main',
      diffStats: [
        { file: 'src/hooks/evaluate.ts', added: 200, removed: 50 },
      ],
      commitSha: 'abc123',
    });

    const config = { ...defaultConfig, autoPush: true };
    const result = await evaluateHook(ctx, config);

    expect(result.summary).toContain('Auto-push');
    expect(result.summary).toContain('Meaningful work');
  });

  it('generates clean summary for trivial commits', async () => {
    const ctx = mockContext({
      hook: 'post-commit',
      diffStats: [{ file: '.gitignore', added: 1, removed: 0 }],
    });

    const result = await evaluateHook(ctx, defaultConfig);
    expect(result.summary).toContain('Allowed');
  });
});
