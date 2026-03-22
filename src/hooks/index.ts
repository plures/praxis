/**
 * Praxis Git Hooks — Entry Point
 *
 * Re-exports all hook functionality.
 */

export { buildHookContext } from './context.js';
export { evaluateHook, executeActions } from './evaluate.js';
export { installHooks, uninstallHooks, initConfig, loadConfig } from './install.js';
export type {
  GitHookName,
  GitHookContext,
  DiffStat,
  HookAction,
  HookEvalResult,
  PraxisHooksConfig,
} from './types.js';
