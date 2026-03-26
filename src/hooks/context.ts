/**
 * Praxis Git Hooks — Context Builder
 *
 * Gathers git state to build the reactive context when a hook fires.
 * Pure functions — no watchers, no side effects beyond reading git state.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import type { GitHookContext, GitHookName, DiffStat } from './types.js';

function git(args: string, cwd?: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd,
      encoding: 'utf-8',
      timeout: 10_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

function getRepoRoot(): string {
  return git('rev-parse --show-toplevel') || process.cwd();
}

function getBranch(): string {
  return git('rev-parse --abbrev-ref HEAD') || 'unknown';
}

function getStagedFiles(): string[] {
  const output = git('diff --cached --name-only');
  return output ? output.split('\n').filter(Boolean) : [];
}

function getDiffStats(staged: boolean): DiffStat[] {
  const flag = staged ? '--cached' : 'HEAD~1..HEAD';
  const output = git(`diff ${flag} --numstat`);
  if (!output) return [];

  return output.split('\n').filter(Boolean).map(line => {
    const [added, removed, file] = line.split('\t');
    return {
      file: file || '',
      added: added === '-' ? 0 : parseInt(added, 10) || 0,
      removed: removed === '-' ? 0 : parseInt(removed, 10) || 0,
    };
  });
}

function getLastCommitSha(): string {
  return git('rev-parse HEAD');
}

function getLastCommitMessage(): string {
  return git('log -1 --format=%B');
}

/**
 * Build a GitHookContext from the current git state and hook arguments.
 *
 * Each hook type gathers slightly different context:
 * - pre-commit: staged files, diff stats
 * - commit-msg: staged files, commit message from file arg
 * - post-commit: committed files, commit SHA, commit message
 * - pre-push: remote info, commits being pushed
 * - post-merge: merged files
 * - post-checkout: old/new HEAD, branch switch flag
 *
 * @param hook - The git hook name (e.g. `'pre-commit'`, `'post-commit'`)
 * @param args - Arguments passed by git to the hook script (defaults to `[]`)
 * @returns A populated {@link GitHookContext} for the given hook and git state
 */
export function buildHookContext(
  hook: GitHookName,
  args: string[] = [],
): GitHookContext {
  const repoRoot = getRepoRoot();
  const branch = getBranch();
  const timestamp = Date.now();

  const base: GitHookContext = {
    hook,
    branch,
    stagedFiles: [],
    diffStats: [],
    linesAdded: 0,
    linesRemoved: 0,
    repoRoot,
    timestamp,
  };

  switch (hook) {
    case 'pre-commit': {
      const stagedFiles = getStagedFiles();
      const diffStats = getDiffStats(true);
      return {
        ...base,
        stagedFiles,
        diffStats,
        linesAdded: diffStats.reduce((s, d) => s + d.added, 0),
        linesRemoved: diffStats.reduce((s, d) => s + d.removed, 0),
      };
    }

    case 'commit-msg': {
      const msgFile = args[0];
      let commitMessage = '';
      if (msgFile) {
        try {
          commitMessage = readFileSync(msgFile, 'utf-8').trim();
        } catch { /* empty */ }
      }
      const stagedFiles = getStagedFiles();
      const diffStats = getDiffStats(true);
      return {
        ...base,
        stagedFiles,
        diffStats,
        linesAdded: diffStats.reduce((s, d) => s + d.added, 0),
        linesRemoved: diffStats.reduce((s, d) => s + d.removed, 0),
        commitMessage,
      };
    }

    case 'post-commit': {
      const diffStats = getDiffStats(false);
      return {
        ...base,
        diffStats,
        stagedFiles: diffStats.map(d => d.file),
        linesAdded: diffStats.reduce((s, d) => s + d.added, 0),
        linesRemoved: diffStats.reduce((s, d) => s + d.removed, 0),
        commitSha: getLastCommitSha(),
        commitMessage: getLastCommitMessage(),
      };
    }

    case 'pre-push': {
      return {
        ...base,
        remote: args[0] || 'origin',
        remoteUrl: args[1] || '',
      };
    }

    case 'post-merge': {
      const diffStats = getDiffStats(false);
      return {
        ...base,
        diffStats,
        stagedFiles: diffStats.map(d => d.file),
        linesAdded: diffStats.reduce((s, d) => s + d.added, 0),
        linesRemoved: diffStats.reduce((s, d) => s + d.removed, 0),
      };
    }

    case 'post-checkout': {
      return {
        ...base,
        previousHead: args[0] || '',
        newHead: args[1] || '',
        isBranchSwitch: args[2] === '1',
      };
    }

    default:
      return base;
  }
}
