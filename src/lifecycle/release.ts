/**
 * Praxis Lifecycle Engine — Release Pipeline
 *
 * Orchestrates the prerelease → QA → stable promotion flow.
 */

import { execSync } from 'node:child_process';
import type { TriggerAction } from './types.js';
import type { QASummary } from './qa.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Current state of a release as it moves through the prerelease → QA → stable → published pipeline. */
export interface ReleaseState {
  version: string;
  phase: 'prerelease' | 'qa' | 'stable' | 'published';
  prereleaseTag?: string;
  qaResult?: 'pending' | 'passed' | 'failed';
  publishedTo: string[];
  timestamp: number;
}

// ─── Release Triggers ───────────────────────────────────────────────────────

/** Shape of the release pipeline trigger adapter. */
interface ReleasePipelineTriggerAdapter {
  gitTag(opts?: { sign?: boolean; push?: boolean }): TriggerAction;
  githubRelease(opts?: { draft?: boolean; prerelease?: boolean; repo?: string }): TriggerAction;
  npmPublish(opts?: { tag?: string; access?: 'public' | 'restricted' }): TriggerAction;
  qaGate(): TriggerAction;
  notify(channel?: string): TriggerAction;
}

/** Built-in trigger actions for the release lifecycle phase (git tagging, QA gating, and stable promotion). */
export const releasePipeline: ReleasePipelineTriggerAdapter = {
  /**
   * Create a git tag for a release.
   */
  gitTag(opts?: { sign?: boolean; push?: boolean }): TriggerAction {
    return {
      id: 'release.git-tag',
      description: 'Create git tag for release',
      execute: async (event) => {
        const tag = event.data.tag as string;
        const message = event.data.message as string | undefined;
        if (!tag) return { success: false, message: 'No tag in event data', error: 'Missing tag' };

        try {
          const signFlag = opts?.sign ? '-s' : '-a';
          const msg = message ?? `Release ${tag}`;
          execSync(`git tag ${signFlag} "${tag}" -m "${msg}"`, { encoding: 'utf-8', timeout: 10_000 });

          if (opts?.push !== false) {
            execSync(`git push origin "${tag}"`, { encoding: 'utf-8', timeout: 30_000 });
          }

          return {
            success: true,
            message: `Tagged ${tag}${opts?.push !== false ? ' and pushed' : ''}`,
            data: { tag, pushed: opts?.push !== false },
          };
        } catch (err) {
          return { success: false, message: 'Git tag failed', error: (err as Error).message };
        }
      },
    };
  },

  /**
   * Create a GitHub release from a tag.
   */
  githubRelease(opts?: { draft?: boolean; prerelease?: boolean; repo?: string }): TriggerAction {
    return {
      id: 'release.github-release',
      description: 'Create GitHub release',
      execute: async (event) => {
        const tag = event.data.tag as string;
        const notes = event.data.notes as string | undefined;
        if (!tag) return { success: false, message: 'No tag in event data', error: 'Missing tag' };

        try {
          const flags = [
            opts?.draft ? '--draft' : '',
            opts?.prerelease ? '--prerelease' : '',
            opts?.repo ? `--repo ${opts.repo}` : '',
            notes ? `--notes "${notes.replace(/"/g, '\\"')}"` : '--generate-notes',
          ].filter(Boolean).join(' ');

          const output = execSync(`gh release create "${tag}" ${flags}`, {
            encoding: 'utf-8',
            timeout: 30_000,
          }).trim();

          return {
            success: true,
            message: `Created release: ${output}`,
            data: { tag, url: output, prerelease: opts?.prerelease ?? false },
          };
        } catch (err) {
          return { success: false, message: 'GitHub release failed', error: (err as Error).message };
        }
      },
    };
  },

  /**
   * Publish to npm registry.
   */
  npmPublish(opts?: { tag?: string; access?: 'public' | 'restricted' }): TriggerAction {
    return {
      id: 'release.npm-publish',
      description: `Publish to npm (tag: ${opts?.tag ?? 'latest'})`,
      execute: async (event) => {
        const tag = opts?.tag ?? (event.data.prerelease ? 'next' : 'latest');
        const access = opts?.access ?? 'public';

        try {
          execSync(`npm publish --tag ${tag} --access ${access}`, {
            encoding: 'utf-8',
            timeout: 60_000,
          });
          return {
            success: true,
            message: `Published to npm with tag "${tag}"`,
            data: { registry: 'npm', tag },
          };
        } catch (err) {
          return { success: false, message: 'npm publish failed', error: (err as Error).message };
        }
      },
    };
  },

  /**
   * QA gate — checks QA results before allowing stable release.
   */
  qaGate(): TriggerAction {
    return {
      id: 'release.qa-gate',
      description: 'Gate: QA must pass before stable release',
      execute: async (event) => {
        const qaPassed = event.data.qaPassed as boolean | undefined;
        const summary = event.data.qaSummary as QASummary | undefined;

        if (qaPassed === false || summary?.overallPassed === false) {
          const failed = summary?.failedTests.length ?? 0;
          return {
            success: false,
            message: `QA gate blocked: ${failed} test(s) failing`,
            data: { failedTests: summary?.failedTests ?? [] },
          };
        }

        if (qaPassed === undefined && !summary) {
          return {
            success: false,
            message: 'QA gate blocked: no QA results found',
            error: 'Run QA suite before requesting release',
          };
        }

        return {
          success: true,
          message: `QA gate passed: ${summary?.totalPassed ?? '?'}/${summary?.totalTests ?? '?'} tests`,
        };
      },
    };
  },

  /**
   * Notify on release (extensible — console by default).
   */
  notify(channel?: string): TriggerAction {
    return {
      id: 'release.notify',
      description: `Notify on release${channel ? ` (${channel})` : ''}`,
      execute: async (event) => {
        const version = event.data.version ?? event.data.tag;
        const message = `🚀 Released ${version}`;
        console.log(message);

        return {
          success: true,
          message,
          data: { channel: channel ?? 'console', version },
        };
      },
    };
  },
};
