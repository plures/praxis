/**
 * Praxis Git Hooks — Types
 *
 * Types for the reactive git hook integration.
 * Praxis never watches — git hooks fire, Praxis evaluates.
 */

// ─── Hook Events ────────────────────────────────────────────────────────────

export type GitHookName =
  | 'pre-commit'
  | 'commit-msg'
  | 'post-commit'
  | 'pre-push'
  | 'post-merge'
  | 'post-checkout';

/**
 * Context gathered from git state when a hook fires.
 * This is the "event" that Praxis reacts to.
 */
export interface GitHookContext {
  /** Which hook fired */
  hook: GitHookName;
  /** Current branch name */
  branch: string;
  /** Staged files (for pre-commit) */
  stagedFiles: string[];
  /** Changed files with diff stats */
  diffStats: DiffStat[];
  /** Total lines added */
  linesAdded: number;
  /** Total lines removed */
  linesRemoved: number;
  /** Commit message (for commit-msg, post-commit) */
  commitMessage?: string;
  /** Commit SHA (for post-commit) */
  commitSha?: string;
  /** Remote name (for pre-push) */
  remote?: string;
  /** Remote URL (for pre-push) */
  remoteUrl?: string;
  /** Previous HEAD (for post-checkout, post-merge) */
  previousHead?: string;
  /** New HEAD (for post-checkout) */
  newHead?: string;
  /** Whether checkout was branch switch (for post-checkout) */
  isBranchSwitch?: boolean;
  /** Repository root path */
  repoRoot: string;
  /** Timestamp when hook fired */
  timestamp: number;
}

export interface DiffStat {
  file: string;
  added: number;
  removed: number;
}

// ─── Hook Actions ───────────────────────────────────────────────────────────

export type HookAction =
  | { type: 'block'; reason: string }
  | { type: 'allow' }
  | { type: 'push'; remote?: string; branch?: string }
  | { type: 'log'; message: string }
  | { type: 'rewrite-commit-msg'; message: string };

/**
 * Result of evaluating Praxis rules against a hook event.
 */
export interface HookEvalResult {
  /** Whether the hook should proceed (true) or block (false) */
  proceed: boolean;
  /** Actions to take */
  actions: HookAction[];
  /** Facts emitted by rules */
  facts: Array<{ tag: string; payload: unknown }>;
  /** Gate states after evaluation */
  gates: Record<string, { status: string; unsatisfied: string[] }>;
  /** Human-readable summary */
  summary: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────

export interface PraxisHooksConfig {
  /** Which hooks to install */
  hooks: GitHookName[];
  /** Rules to evaluate (loaded from config) */
  rules?: string[];
  /** Auto-push after commit */
  autoPush?: boolean;
  /** Auto-push remote (default: 'origin') */
  autoPushRemote?: string;
  /** Commit message validation pattern */
  commitPattern?: string;
  /** Branch naming pattern */
  branchPattern?: string;
  /** Paths that trigger "meaningful work" detection */
  meaningfulPaths?: string[];
  /** Minimum lines changed to count as "meaningful" */
  meaningfulThreshold?: number;
}
