/**
 * Praxis Rules Factory — Types
 *
 * Configuration types for predefined rule module factories.
 */

// ─── Input Rules ────────────────────────────────────────────────────────────

/** The kind of sanitization to apply to user input. */
export type SanitizationType = 'sql-injection' | 'xss' | 'path-traversal' | 'command-injection';

/** Configuration for the pre-built input validation rule module. */
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

/** Configuration for the pre-built toast notification rule module. */
export interface ToastRulesConfig {
  /** Only show toast if there's a meaningful diff */
  requireDiff?: boolean;
  /** Auto-dismiss after N milliseconds (0 = no auto-dismiss) */
  autoDismissMs?: number;
  /** Prevent duplicate toasts with same message */
  deduplicate?: boolean;
}

// ─── Form Rules ─────────────────────────────────────────────────────────────

/** Configuration for the pre-built form validation and submission rule module. */
export interface FormRulesConfig {
  /** Validate fields on blur */
  validateOnBlur?: boolean;
  /** Gate form submission on validation passing */
  submitGate?: boolean;
  /** Custom form name for namespacing facts */
  formName?: string;
}

// ─── Navigation Rules ───────────────────────────────────────────────────────

/** Configuration for the pre-built navigation guard rule module. */
export interface NavigationRulesConfig {
  /** Warn/block navigation when form has unsaved changes */
  dirtyGuard?: boolean;
  /** Require authentication for navigation */
  authRequired?: boolean;
}

// ─── Data Rules ─────────────────────────────────────────────────────────────

/** Configuration for the pre-built data-loading and cache rule module. */
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
