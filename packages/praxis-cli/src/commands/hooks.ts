/**
 * Praxis CLI — Hooks Commands
 *
 * `praxis hooks install` — Install reactive git hooks
 * `praxis hooks uninstall` — Remove hooks
 * `praxis hooks init` — Create .praxis.hooks.json config
 * `praxis hooks run <hook>` — Execute hook evaluation (called by git)
 * `praxis hooks status` — Show installed hooks
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import type { GitHookName } from '@plures/praxis/hooks';

/**
 * Install Praxis reactive git hooks into the current repository.
 *
 * Creates a `.praxis.hooks.json` config (if one doesn't exist), then
 * installs the configured hooks into `.git/hooks/`. Existing hooks are
 * chained rather than overwritten unless `--force` is passed.
 *
 * @param options - Installation options
 * @param options.force - Overwrite existing hooks without chaining
 * @param options.verbose - Print detailed output for each hook action
 * @returns A promise that resolves when all hooks have been installed
 */
export async function hooksInstall(options: { force?: boolean; verbose?: boolean }) {
  const { installHooks, loadConfig, initConfig } = await import('@plures/praxis/hooks');

  // Ensure config exists
  const configPath = initConfig();
  const config = loadConfig();

  console.log('🔧 Praxis: Installing reactive git hooks...');
  console.log(`   Config: ${configPath}`);
  console.log('');

  const result = installHooks(config, {
    force: options.force,
    verbose: true,
  });

  console.log('');
  console.log(`   Installed: ${result.installed.length}`);
  if (result.chained.length > 0) {
    console.log(`   Chained:   ${result.chained.length} (existing hooks preserved)`);
  }
  if (result.skipped.length > 0) {
    console.log(`   Skipped:   ${result.skipped.length} (use --force to overwrite)`);
  }
  console.log('');
  console.log('✅ Praxis hooks ready. Git events will now flow through Praxis.');
}

/**
 * Remove Praxis reactive git hooks from the current repository.
 *
 * Removes installed hooks and restores any previously chained hooks that
 * existed before installation.
 *
 * @param _options - Uninstall options (currently unused, reserved for future use)
 * @returns A promise that resolves when all hooks have been removed
 */
export async function hooksUninstall(_options: { verbose?: boolean }) {
  const { uninstallHooks, loadConfig } = await import('@plures/praxis/hooks');

  const config = loadConfig();
  console.log('🔧 Praxis: Removing hooks...');

  const result = uninstallHooks(config, { verbose: true });

  console.log('');
  console.log(`   Removed:  ${result.removed.length}`);
  console.log(`   Restored: ${result.restored.length}`);
}

/**
 * Create the default `.praxis.hooks.json` configuration file.
 *
 * Writes a starter config to the repo root if one does not already exist.
 * Prints the path to the created file so developers can edit it.
 *
 * @returns A promise that resolves after the config file is created
 */
export async function hooksInit() {
  const { initConfig } = await import('@plures/praxis/hooks');

  const configPath = initConfig();
  console.log(`📝 Praxis: Config at ${configPath}`);
  console.log('   Edit this file to configure hooks, auto-push, patterns, etc.');
}

/**
 * Execute Praxis rule evaluation for a specific git hook event.
 *
 * This function is called automatically by the installed git hook scripts.
 * It loads the config, builds the hook context from the current git state,
 * evaluates all configured rules, and executes any resulting actions
 * (such as auto-push). Exits with code 1 if a blocking rule fires.
 *
 * @param hookName - The name of the git hook being fired (e.g. `"pre-commit"`)
 * @param args - Arguments passed by git to the hook script
 * @returns A promise that resolves when hook evaluation and all resulting actions complete
 */
export async function hooksRun(hookName: string, args: string[]) {
  const { buildHookContext } = await import('@plures/praxis/hooks');
  const { evaluateHook, executeActions } = await import('@plures/praxis/hooks');
  const { loadConfig } = await import('@plures/praxis/hooks');

  const config = loadConfig();
  const context = buildHookContext(hookName as GitHookName, args);
  const result = await evaluateHook(context, config);

  // Print summary (concise — hooks should be fast)
  if (result.summary) {
    for (const line of result.summary.split('\n')) {
      if (line.trim()) console.log(`  ${line}`);
    }
  }

  // Execute actions (push, etc.)
  executeActions(result);

  // Exit non-zero if blocked (for pre-commit, commit-msg, pre-push)
  if (!result.proceed) {
    process.exit(1);
  }
}

/**
 * Print a status table showing which git hooks are installed and configured.
 *
 * Reads the current `.praxis.hooks.json` config and checks `.git/hooks/`
 * to determine whether each hook is installed. Also reports auto-push
 * settings and meaningful-work thresholds.
 *
 * @returns A promise that resolves after the status table is printed
 */
export async function hooksStatus() {
  const { loadConfig } = await import('@plures/praxis/hooks');

  let repoRoot: string;
  try {
    repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    console.error('Not a git repository.');
    process.exit(1);
    return;
  }

  const config = loadConfig(repoRoot);
  const hooksDir = join(repoRoot, '.git', 'hooks');

  console.log('📊 Praxis Hooks Status');
  console.log(`   Repo: ${repoRoot}`);
  console.log('');

  const allHooks: GitHookName[] = ['pre-commit', 'commit-msg', 'post-commit', 'pre-push', 'post-merge', 'post-checkout'];

  for (const hook of allHooks) {
    const hookPath = join(hooksDir, hook);
    const configured = config.hooks.includes(hook);
    let installed = false;

    if (existsSync(hookPath)) {
      const content = readFileSync(hookPath, 'utf-8');
      installed = content.includes('praxis hooks run');
    }

    const status = installed ? '✅' : configured ? '⚪ (configured, not installed)' : '—';
    console.log(`   ${hook.padEnd(16)} ${status}`);
  }

  console.log('');
  console.log(`   Auto-push: ${config.autoPush ? `✅ → ${config.autoPushRemote}` : '❌'}`);
  console.log(`   Meaningful: ≥${config.meaningfulThreshold} lines in ${config.meaningfulPaths?.join(', ')}`);

  if (config.commitPattern) {
    console.log(`   Commit pattern: ${config.commitPattern}`);
  }
}
