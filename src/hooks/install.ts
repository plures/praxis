/**
 * Praxis Git Hooks — Installer
 *
 * `praxis hooks install` writes thin shell scripts into .git/hooks/
 * that delegate to the Praxis CLI. The shell scripts are minimal —
 * they just call `npx praxis hooks run <hook-name>` with the right args.
 *
 * Supports coexisting with husky, lefthook, etc. by chaining.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import type { GitHookName, PraxisHooksConfig } from './types.js';

/** All supported git hooks */
export const ALL_HOOKS: GitHookName[] = [
  'pre-commit',
  'commit-msg',
  'post-commit',
  'pre-push',
  'post-merge',
  'post-checkout',
];

const DEFAULT_CONFIG: PraxisHooksConfig = {
  hooks: ['pre-commit', 'commit-msg', 'post-commit'],
  autoPush: false,
  autoPushRemote: 'origin',
  meaningfulPaths: ['src/', 'lib/', 'research/', 'docs/'],
  meaningfulThreshold: 10,
};

/**
 * Generate the shell script content for a git hook.
 * The script is thin — it delegates to `praxis hooks run`.
 */
function generateHookScript(hookName: GitHookName): string {
  return `#!/bin/sh
# Praxis reactive hook — installed by \`praxis hooks install\`
# This hook delegates to the Praxis engine for evaluation.
# Do not edit — re-run \`praxis hooks install\` to update.

# Chain: if a previous hook script exists (renamed to .pre-praxis), run it first
if [ -f "$(dirname "$0")/${hookName}.pre-praxis" ]; then
  "$(dirname "$0")/${hookName}.pre-praxis" "$@"
  PREV_EXIT=$?
  if [ $PREV_EXIT -ne 0 ]; then
    exit $PREV_EXIT
  fi
fi

# Run Praxis evaluation
npx --yes praxis hooks run ${hookName} "$@"
`;
}

/**
 * Find the .git/hooks directory for the current repo.
 */
function findHooksDir(repoRoot?: string): string {
  const root = repoRoot || execSync('git rev-parse --show-toplevel', {
    encoding: 'utf-8',
    timeout: 5000,
  }).trim();

  // Support core.hooksPath
  try {
    const customPath = execSync('git config core.hooksPath', {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    if (customPath) return resolve(root, customPath);
  } catch { /* no custom hooks path */ }

  return join(root, '.git', 'hooks');
}

/**
 * Install Praxis hook scripts into .git/hooks/.
 *
 * If existing hooks are found, they're renamed to <hook>.pre-praxis
 * and the Praxis hook chains to them.
 */
export function installHooks(
  config: Partial<PraxisHooksConfig> = {},
  options: { repoRoot?: string; force?: boolean; verbose?: boolean } = {},
): { installed: GitHookName[]; skipped: GitHookName[]; chained: GitHookName[] } {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const hooksDir = findHooksDir(options.repoRoot);
  const installed: GitHookName[] = [];
  const skipped: GitHookName[] = [];
  const chained: GitHookName[] = [];

  // Ensure hooks directory exists
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }

  for (const hookName of mergedConfig.hooks) {
    const hookPath = join(hooksDir, hookName);
    const backupPath = join(hooksDir, `${hookName}.pre-praxis`);

    // Check for existing hook
    if (existsSync(hookPath)) {
      const existing = readFileSync(hookPath, 'utf-8');

      // Already a Praxis hook?
      if (existing.includes('praxis hooks run')) {
        if (options.force) {
          // Overwrite
          writeFileSync(hookPath, generateHookScript(hookName));
          installed.push(hookName);
          if (options.verbose) console.log(`  ♻️  ${hookName} — updated (force)`);
        } else {
          skipped.push(hookName);
          if (options.verbose) console.log(`  ⏭️  ${hookName} — already installed (skip)`);
        }
        continue;
      }

      // Existing non-Praxis hook — chain it
      if (!existsSync(backupPath)) {
        writeFileSync(backupPath, existing);
        chmodSync(backupPath, 0o755);
        chained.push(hookName);
        if (options.verbose) console.log(`  🔗 ${hookName} — existing hook backed up to ${hookName}.pre-praxis`);
      }
    }

    // Write the Praxis hook
    writeFileSync(hookPath, generateHookScript(hookName));
    chmodSync(hookPath, 0o755);
    installed.push(hookName);
    if (options.verbose) console.log(`  ✅ ${hookName} — installed`);
  }

  return { installed, skipped, chained };
}

/**
 * Uninstall Praxis hooks — removes the scripts and restores backups.
 */
export function uninstallHooks(
  config: Partial<PraxisHooksConfig> = {},
  options: { repoRoot?: string; verbose?: boolean } = {},
): { removed: GitHookName[]; restored: GitHookName[] } {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const hooksDir = findHooksDir(options.repoRoot);
  const removed: GitHookName[] = [];
  const restored: GitHookName[] = [];

  for (const hookName of mergedConfig.hooks) {
    const hookPath = join(hooksDir, hookName);
    const backupPath = join(hooksDir, `${hookName}.pre-praxis`);

    if (!existsSync(hookPath)) continue;

    const content = readFileSync(hookPath, 'utf-8');
    if (!content.includes('praxis hooks run')) continue;

    // Restore backup if it exists
    if (existsSync(backupPath)) {
      const backup = readFileSync(backupPath, 'utf-8');
      writeFileSync(hookPath, backup);
      chmodSync(hookPath, 0o755);
      // Clean up backup
      const { unlinkSync } = require('node:fs');
      unlinkSync(backupPath);
      restored.push(hookName);
      if (options.verbose) console.log(`  ♻️  ${hookName} — restored from backup`);
    } else {
      const { unlinkSync } = require('node:fs');
      unlinkSync(hookPath);
      removed.push(hookName);
      if (options.verbose) console.log(`  🗑️  ${hookName} — removed`);
    }
  }

  return { removed, restored };
}

/**
 * Write a default .praxis.hooks.json config file.
 */
export function initConfig(repoRoot?: string): string {
  const root = repoRoot || execSync('git rev-parse --show-toplevel', {
    encoding: 'utf-8',
    timeout: 5000,
  }).trim();

  const configPath = join(root, '.praxis.hooks.json');

  if (existsSync(configPath)) {
    return configPath; // Don't overwrite
  }

  const config: PraxisHooksConfig = {
    hooks: ['pre-commit', 'commit-msg', 'post-commit'],
    autoPush: true,
    autoPushRemote: 'origin',
    meaningfulPaths: ['src/', 'lib/', 'research/', 'docs/'],
    meaningfulThreshold: 10,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  return configPath;
}

/**
 * Load config from .praxis.hooks.json (or return defaults).
 */
export function loadConfig(repoRoot?: string): PraxisHooksConfig {
  const root = repoRoot || execSync('git rev-parse --show-toplevel', {
    encoding: 'utf-8',
    timeout: 5000,
  }).trim();

  const configPath = join(root, '.praxis.hooks.json');

  if (!existsSync(configPath)) return DEFAULT_CONFIG;

  try {
    const raw = readFileSync(configPath, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}
