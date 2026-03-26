/**
 * Praxis Git Hooks — Evaluator
 *
 * Loads .praxis.hooks.json config, creates a Praxis unified app, and evaluates
 * rules against the git hook context. This is the core reactive loop:
 *
 *   git hook fires → context built → rules evaluate → actions returned
 *
 * No watchers. No daemons. Pure reactive evaluation.
 */

import { execSync } from 'node:child_process';
import { createApp } from '../unified/core.js';
import { RuleResult, fact } from '../core/rule-result.js';
import type { UnifiedRule } from '../unified/types.js';
import type { GitHookContext, HookEvalResult, HookAction, PraxisHooksConfig } from './types.js';

// ─── Built-in Rules (Unified v2 API) ────────────────────────────────────────

function meaningfulWorkRule(config: PraxisHooksConfig): UnifiedRule {
  const threshold = config.meaningfulThreshold ?? 10;
  const paths = config.meaningfulPaths ?? ['src/', 'lib/', 'research/', 'docs/'];

  return {
    id: 'hooks/meaningful-work',
    description: `Detects meaningful work (≥${threshold} lines in ${paths.join(', ')})`,
    watch: ['hook'],
    evaluate: (values) => {
      const ctx = values.hook as GitHookContext | null;
      if (!ctx || ctx.hook !== 'post-commit') return RuleResult.skip('Not a post-commit');

      const meaningfulFiles = ctx.diffStats.filter(d =>
        paths.some(p => d.file.startsWith(p))
      );
      const meaningfulLines = meaningfulFiles.reduce((s, d) => s + d.added + d.removed, 0);

      if (meaningfulLines >= threshold) {
        return RuleResult.emit([
          fact('hooks.meaningful-work', {
            files: meaningfulFiles.map(d => d.file),
            linesChanged: meaningfulLines,
            commitSha: ctx.commitSha,
          }),
        ]);
      }

      return RuleResult.skip('Below meaningful threshold');
    },
  };
}

function autoPushRule(config: PraxisHooksConfig): UnifiedRule {
  const remote = config.autoPushRemote ?? 'origin';

  return {
    id: 'hooks/auto-push',
    description: `Auto-push to ${remote} after meaningful commits`,
    watch: ['hook'],
    evaluate: (values) => {
      if (!config.autoPush) return RuleResult.skip('Auto-push disabled');

      const ctx = values.hook as GitHookContext | null;
      if (!ctx || ctx.hook !== 'post-commit') return RuleResult.skip('Not a post-commit');

      const paths = config.meaningfulPaths ?? ['src/', 'lib/', 'research/', 'docs/'];
      const threshold = config.meaningfulThreshold ?? 10;
      const meaningfulFiles = ctx.diffStats.filter(d =>
        paths.some(p => d.file.startsWith(p))
      );
      const meaningfulLines = meaningfulFiles.reduce((s, d) => s + d.added + d.removed, 0);

      if (meaningfulLines < threshold) return RuleResult.skip('Not meaningful enough to auto-push');

      return RuleResult.emit([
        fact('hooks.auto-push', {
          remote,
          branch: ctx.branch,
          commitSha: ctx.commitSha,
        }),
      ]);
    },
  };
}

function commitMessageRule(config: PraxisHooksConfig): UnifiedRule {
  const pattern = config.commitPattern ?? '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?: .{1,72}';

  return {
    id: 'hooks/commit-message',
    description: `Validates commit message matches: ${pattern}`,
    watch: ['hook'],
    evaluate: (values) => {
      const ctx = values.hook as GitHookContext | null;
      if (!ctx || ctx.hook !== 'commit-msg') return RuleResult.skip('Not a commit-msg hook');
      if (!ctx.commitMessage) return RuleResult.skip('No commit message');

      const firstLine = ctx.commitMessage.split('\n')[0];
      const regex = new RegExp(pattern);

      if (regex.test(firstLine)) {
        return RuleResult.emit([fact('hooks.commit-msg.valid', { message: firstLine })]);
      }

      return RuleResult.emit([
        fact('hooks.commit-msg.invalid', {
          message: firstLine,
          pattern,
          hint: 'Use conventional commits: type(scope): description',
        }),
      ]);
    },
  };
}

// ─── Evaluator ──────────────────────────────────────────────────────────────

/**
 * Evaluate Praxis rules against a git hook context.
 *
 * This is the core function — called by hook scripts when git fires an event.
 * Returns actions the hook script should take (block, allow, push, etc.).
 *
 * @param context - The git hook context built by {@link buildHookContext}
 * @param config - Praxis hooks configuration loaded from `.praxis.hooks.json`
 * @returns A {@link HookEvalResult} with `proceed` flag, `actions`, and an optional summary message
 */
export async function evaluateHook(
  context: GitHookContext,
  config: PraxisHooksConfig,
): Promise<HookEvalResult> {
  // Build rules
  const rules: UnifiedRule[] = [
    meaningfulWorkRule(config),
    autoPushRule(config),
    commitMessageRule(config),
  ];

  // In the unified layer, constraints reject mutations. For hooks, we want
  // rules to evaluate first, then decide blocking from facts.
  // So we don't pass constraints to createApp — instead we check facts.
  const enforceCommitMessage = config.commitPattern !== undefined;

  // Create a Praxis unified app
  const app = createApp({
    name: `praxis-hooks-${context.hook}`,
    schema: [
      { path: 'hook', initial: null as unknown },
    ],
    rules,
    constraints: [], // Blocking is determined from facts, not constraints
  });

  // Set the hook context — this triggers reactive evaluation
  app.mutate('hook', context);

  // Read facts
  const facts = app.facts();
  const actions: HookAction[] = [];

  // Determine actions from facts
  let proceed = true;

  for (const f of facts) {
    switch (f.tag) {
      case 'hooks.commit-msg.invalid':
        if (enforceCommitMessage) {
          proceed = false;
          actions.push({
            type: 'block',
            reason: `Invalid commit message: ${(f.payload as { hint?: string })?.hint || 'format error'}`,
          });
        } else {
          actions.push({
            type: 'log',
            message: `⚠️  Commit message doesn't follow conventional format`,
          });
        }
        break;

      case 'hooks.auto-push': {
        const pushInfo = f.payload as { remote: string; branch: string };
        actions.push({
          type: 'push',
          remote: pushInfo.remote,
          branch: pushInfo.branch,
        });
        break;
      }

      case 'hooks.meaningful-work':
        actions.push({
          type: 'log',
          message: `✓ Meaningful work: ${(f.payload as { linesChanged: number }).linesChanged} lines across ${(f.payload as { files: string[] }).files.length} file(s)`,
        });
        break;
    }
  }

  if (proceed && actions.length === 0) {
    actions.push({ type: 'allow' });
  }

  // Build summary
  const summary = actions.map(a => {
    switch (a.type) {
      case 'block': return `🚫 ${a.reason}`;
      case 'allow': return '✅ Allowed';
      case 'push': return `📤 Auto-push → ${a.remote}/${a.branch}`;
      case 'log': return a.message;
      case 'rewrite-commit-msg': return `✏️  Commit message rewritten`;
    }
  }).join('\n');

  app.destroy();

  return {
    proceed,
    actions,
    facts: facts.map(f => ({ tag: f.tag, payload: f.payload })),
    gates: {},
    summary,
  };
}

// ─── Action Executor ────────────────────────────────────────────────────────

/**
 * Execute the actions returned by evaluateHook.
 * Called by the hook handler after evaluation.
 *
 * @param result - The hook evaluation result from {@link evaluateHook}
 */
export function executeActions(result: HookEvalResult): void {
  for (const action of result.actions) {
    switch (action.type) {
      case 'push':
        try {
          const remote = action.remote || 'origin';
          const branch = action.branch || '';
          const cmd = branch ? `git push ${remote} ${branch}` : `git push ${remote}`;
          console.log(`📤 Praxis: auto-pushing to ${remote}${branch ? `/${branch}` : ''}...`);
          execSync(cmd, { stdio: 'inherit', timeout: 30_000 });
          console.log('✅ Praxis: push complete');
        } catch (err) {
          console.error('❌ Praxis: auto-push failed:', (err as Error).message);
        }
        break;

      case 'log':
        console.log(action.message);
        break;

      case 'block':
        console.error(`🚫 Praxis: ${action.reason}`);
        break;

      case 'rewrite-commit-msg':
      case 'allow':
        break;
    }
  }
}
