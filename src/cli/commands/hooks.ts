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
import type { GitHookName } from '../../hooks/types.js';

export async function hooksInstall(options: { force?: boolean; verbose?: boolean }) {
  const { installHooks, loadConfig, initConfig } = await import('../../hooks/install.js');

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

export async function hooksUninstall(_options: { verbose?: boolean }) {
  const { uninstallHooks, loadConfig } = await import('../../hooks/install.js');

  const config = loadConfig();
  console.log('🔧 Praxis: Removing hooks...');

  const result = uninstallHooks(config, { verbose: true });

  console.log('');
  console.log(`   Removed:  ${result.removed.length}`);
  console.log(`   Restored: ${result.restored.length}`);
}

export async function hooksInit() {
  const { initConfig } = await import('../../hooks/install.js');

  const configPath = initConfig();
  console.log(`📝 Praxis: Config at ${configPath}`);
  console.log('   Edit this file to configure hooks, auto-push, patterns, etc.');
}

export async function hooksRun(hookName: string, args: string[]) {
  const { buildHookContext } = await import('../../hooks/context.js');
  const { evaluateHook, executeActions } = await import('../../hooks/evaluate.js');
  const { loadConfig } = await import('../../hooks/install.js');

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

export async function hooksStatus() {
  const { loadConfig } = await import('../../hooks/install.js');

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
