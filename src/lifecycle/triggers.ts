/**
 * Praxis Lifecycle Engine — Trigger Adapters
 *
 * Pluggable backends for lifecycle triggers. Each adapter converts
 * lifecycle events into platform-specific actions.
 *
 * Built-in adapters: GitHub, console (logging), custom function.
 * Teams add their own: GitLab, Jira, Linear, Pares Agens, etc.
 */

import type {
  LifecycleEvent,
  TriggerAction,
  TriggerContext,
  TriggerResult,
  GitHubTriggerOptions,
  RegistryPublishOptions,
} from './types.js';

// ─── Console Adapter (logging, always available) ────────────────────────────

/** Log the event to console — useful for debugging and dry runs */
export function consoleLog(prefix?: string): TriggerAction {
  return {
    id: 'console.log',
    description: `Log event to console${prefix ? ` with prefix "${prefix}"` : ''}`,
    execute: async (event) => {
      const msg = `${prefix ?? '📋'} [${event.name}] ${JSON.stringify(event.data)}`;
      console.log(msg);
      return { success: true, message: msg };
    },
  };
}

// ─── Custom Function Adapter ────────────────────────────────────────────────

/** Execute an arbitrary async function */
export function custom(
  id: string,
  fn: (event: LifecycleEvent, ctx: TriggerContext) => Promise<TriggerResult>,
): TriggerAction {
  return {
    id,
    description: `Custom trigger: ${id}`,
    execute: fn,
  };
}

// ─── GitHub Adapter ─────────────────────────────────────────────────────────

/** GitHub trigger adapter for creating issues, branches, and requesting reviews via the GitHub API. */
export const github = {
  /** Create a GitHub issue from an expectation */
  createIssue(options: GitHubTriggerOptions & { assignee?: string; labels?: string[] }): TriggerAction {
    return {
      id: 'github.create-issue',
      description: `Create GitHub issue on ${options.owner}/${options.repo}`,
      execute: async (event, ctx) => {
        const exp = ctx.expectation;
        if (!exp) {
          return { success: false, message: 'No expectation in context', error: 'Missing expectation' };
        }

        const title = exp.title;
        const body = formatIssueBody(exp, event);
        const labels = [...(options.labels ?? []), ...(exp.labels ?? [])];
        const assignee = options.assignee;

        try {
          const { execSync } = await import('node:child_process');
          const labelArgs = labels.map(l => `--label "${l}"`).join(' ');
          const assigneeArg = assignee ? `--assignee "${assignee}"` : '';
          const cmd = `gh issue create --repo ${options.owner}/${options.repo} --title "${title}" --body "${body.replace(/"/g, '\\"')}" ${labelArgs} ${assigneeArg}`;

          const output = execSync(cmd, { encoding: 'utf-8', timeout: 30_000 }).trim();
          const issueUrl = output.split('\n').pop() ?? output;

          return {
            success: true,
            message: `Created issue: ${issueUrl}`,
            data: { issueUrl, title, labels },
          };
        } catch (err) {
          return {
            success: false,
            message: `Failed to create GitHub issue`,
            error: (err as Error).message,
          };
        }
      },
    };
  },

  /** Create a branch for development work */
  createBranch(options: GitHubTriggerOptions & { prefix?: string; from?: string }): TriggerAction {
    return {
      id: 'github.create-branch',
      description: `Create branch on ${options.owner}/${options.repo}`,
      execute: async (event, ctx) => {
        const exp = ctx.expectation;
        const prefix = options.prefix ?? (exp?.type === 'fix' ? 'fix' : 'feat');
        const name = exp?.id ?? event.data.branchName ?? 'unnamed';
        const branchName = `${prefix}/${name}`;
        const from = options.from ?? 'main';

        try {
          const { execSync } = await import('node:child_process');
          execSync(`git checkout ${from} && git pull && git checkout -b ${branchName}`, {
            encoding: 'utf-8',
            timeout: 30_000,
          });

          return {
            success: true,
            message: `Created branch: ${branchName} from ${from}`,
            data: { branchName, from },
          };
        } catch (err) {
          return {
            success: false,
            message: `Failed to create branch`,
            error: (err as Error).message,
          };
        }
      },
    };
  },

  /** Request a review on a PR */
  requestReview(options: GitHubTriggerOptions & { reviewer?: string }): TriggerAction {
    return {
      id: 'github.request-review',
      description: `Request review from ${options.reviewer ?? 'copilot'}`,
      execute: async (event) => {
        const prNumber = event.data.prNumber;
        if (!prNumber) {
          return { success: false, message: 'No PR number in event data', error: 'Missing prNumber' };
        }

        try {
          const { execSync } = await import('node:child_process');
          const reviewer = options.reviewer ?? 'copilot';
          const cmd = `gh pr edit ${prNumber} --repo ${options.owner}/${options.repo} --add-reviewer ${reviewer}`;
          execSync(cmd, { encoding: 'utf-8', timeout: 30_000 });

          return {
            success: true,
            message: `Requested review from ${reviewer} on PR #${prNumber}`,
            data: { prNumber, reviewer },
          };
        } catch (err) {
          return {
            success: false,
            message: `Failed to request review`,
            error: (err as Error).message,
          };
        }
      },
    };
  },
};

// ─── Version Adapter ────────────────────────────────────────────────────────

/** Version trigger adapter for calculating semver bumps and syncing version strings across project files. */
export const version = {
  /** Calculate and bump semver based on expectations */
  bumpSemver(options?: { strategy?: 'conventional' | 'expectation-driven' }): TriggerAction {
    return {
      id: 'version.bump-semver',
      description: `Bump semver (${options?.strategy ?? 'expectation-driven'})`,
      execute: async (_event, ctx) => {
        const expectations = ctx.getAllExpectations();

        // Determine bump type from expectations
        let bump: 'major' | 'minor' | 'patch' = 'patch';

        for (const exp of expectations) {
          if (exp.breaking) { bump = 'major'; break; }
          if (exp.type === 'feature') bump = 'minor';
        }

        return {
          success: true,
          message: `Calculated semver bump: ${bump}`,
          data: { bump, strategy: options?.strategy ?? 'expectation-driven' },
        };
      },
    };
  },

  /** Sync version across multiple files */
  syncFiles(files?: string[]): TriggerAction {
    return {
      id: 'version.sync-files',
      description: `Sync version across ${files?.join(', ') ?? 'configured files'}`,
      execute: async (_event, ctx) => {
        const targetFiles = files ?? ctx.config.versioning?.versionFiles ?? ['package.json'];
        return {
          success: true,
          message: `Version sync targets: ${targetFiles.join(', ')}`,
          data: { files: targetFiles },
        };
      },
    };
  },
};

// ─── Release Adapter ────────────────────────────────────────────────────────

/** Release trigger adapter for creating prerelease and stable git tags and promoting releases through the pipeline. */
export const release = {
  /** Tag a prerelease */
  tagPrerelease(options?: { tag?: string }): TriggerAction {
    return {
      id: 'release.tag-prerelease',
      description: 'Create prerelease tag',
      execute: async (event) => {
        const version = event.data.version as string;
        const tag = options?.tag ?? 'rc';
        const tagName = `v${version}-${tag}.1`;

        return {
          success: true,
          message: `Would tag prerelease: ${tagName}`,
          data: { tagName, version, prereleaseTag: tag },
        };
      },
    };
  },

  /** Promote prerelease to stable */
  promoteToStable(): TriggerAction {
    return {
      id: 'release.promote-to-stable',
      description: 'Promote prerelease to stable release',
      execute: async (event) => {
        const version = event.data.version as string;
        return {
          success: true,
          message: `Would promote to stable: v${version}`,
          data: { version, stable: true },
        };
      },
    };
  },
};

// ─── Registry Adapter ───────────────────────────────────────────────────────

/** Registry trigger adapter for publishing prerelease and stable packages to npm or other registries. */
export const registry = {
  /** Publish to package registries */
  publishPrerelease(options: RegistryPublishOptions): TriggerAction {
    return {
      id: 'registry.publish-prerelease',
      description: `Publish prerelease to ${options.registries.join(', ')}`,
      execute: async (event) => {
        return {
          success: true,
          message: `Would publish prerelease to: ${options.registries.join(', ')}`,
          data: { registries: options.registries, tag: 'next', version: event.data.version },
        };
      },
    };
  },

  /** Publish stable to package registries */
  publishStable(options: RegistryPublishOptions): TriggerAction {
    return {
      id: 'registry.publish-stable',
      description: `Publish stable to ${options.registries.join(', ')}`,
      execute: async (event) => {
        return {
          success: true,
          message: `Would publish stable to: ${options.registries.join(', ')}`,
          data: { registries: options.registries, tag: 'latest', version: event.data.version },
        };
      },
    };
  },
};

// ─── Expectation Adapter ────────────────────────────────────────────────────

/** Expectations trigger adapter for creating new lifecycle expectations derived from QA results or other sources. */
export const expectations = {
  /** Create new expectations from QA results */
  createFromQAResults(): TriggerAction {
    return {
      id: 'expectations.from-qa',
      description: 'Create expectations from QA failure results',
      execute: async (event, ctx) => {
        const failures = event.data.failures as Array<{ test: string; error: string }> | undefined;
        if (!failures || failures.length === 0) {
          return { success: true, message: 'No QA failures to convert' };
        }

        const newExpectations = failures.map(f => ({
          id: `qa-fix-${f.test.replace(/\s+/g, '-').toLowerCase()}`,
          type: 'fix' as const,
          title: `Fix: ${f.test}`,
          description: `QA failure: ${f.error}`,
          priority: 'high' as const,
          acceptance: [`${f.test} passes without errors`],
          labels: ['qa-generated', 'fix'],
          related: event.expectationId ? [event.expectationId] : [],
        }));

        for (const exp of newExpectations) {
          ctx.addExpectation(exp);
        }

        ctx.emit('lifecycle/design/expectation.submitted', {
          expectations: newExpectations.map(e => e.id),
          source: 'qa',
        });

        return {
          success: true,
          message: `Created ${newExpectations.length} fix expectations from QA failures`,
          data: { created: newExpectations.map(e => e.id) },
        };
      },
    };
  },
};

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatIssueBody(exp: { title: string; description: string; acceptance: string[]; type: string; priority: string }, event: LifecycleEvent): string {
  const lines = [
    `## ${exp.title}`,
    '',
    exp.description,
    '',
    '### Acceptance Criteria',
    ...exp.acceptance.map(a => `- [ ] ${a}`),
    '',
    `**Type:** ${exp.type}`,
    `**Priority:** ${exp.priority}`,
    '',
    `_Generated by Praxis Lifecycle Engine from event \`${event.name}\`_`,
  ];
  return lines.join('\n');
}

// ─── Namespace Export ───────────────────────────────────────────────────────

/** All built-in trigger adapters */
export const triggers = {
  github,
  version,
  release,
  registry,
  expectations,
  consoleLog,
  custom,
};
