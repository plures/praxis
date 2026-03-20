/**
 * Praxis Rules Factory — Types
 *
 * Configuration types for predefined rule module factories.
 */

// ─── Input Rules ────────────────────────────────────────────────────────────

export type SanitizationType = 'sql-injection' | 'xss' | 'path-traversal' | 'command-injection';

export interface InputRulesConfig {
  /** Sanitization checks to apply */
  sanitize?: SanitizationType[];
  /** Maximum input length (0 = unlimited) */
  maxLength?: number;
  /** Whether the input is required (non-empty) */
  required?: boolean;
  /** Custom field name for facts/events (default: 'input') */
  fieldName?: string;
}

// ─── Toast Rules ────────────────────────────────────────────────────────────

export interface ToastRulesConfig {
  /** Only show toast if there's a meaningful diff */
  requireDiff?: boolean;
  /** Auto-dismiss after N milliseconds (0 = no auto-dismiss) */
  autoDismissMs?: number;
  /** Prevent duplicate toasts with same message */
  deduplicate?: boolean;
}

// ─── Form Rules ─────────────────────────────────────────────────────────────

export interface FormRulesConfig {
  /** Validate fields on blur */
  validateOnBlur?: boolean;
  /** Gate form submission on validation passing */
  submitGate?: boolean;
  /** Custom form name for namespacing facts */
  formName?: string;
}

// ─── Navigation Rules ───────────────────────────────────────────────────────

export interface NavigationRulesConfig {
  /** Warn/block navigation when form has unsaved changes */
  dirtyGuard?: boolean;
  /** Require authentication for navigation */
  authRequired?: boolean;
}

// ─── Data Rules ─────────────────────────────────────────────────────────────

export interface DataRulesConfig {
  /** Enable optimistic UI updates */
  optimisticUpdate?: boolean;
  /** Rollback optimistic updates on error */
  rollbackOnError?: boolean;
  /** Invalidate relevant caches on data change */
  cacheInvalidation?: boolean;
  /** Custom entity name for facts */
  entityName?: string;
}
