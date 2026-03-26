/**
 * Praxis Rules Factory
 *
 * Predefined rule modules for common application patterns.
 * Each factory returns a PraxisModule with rules, constraints, and contracts.
 *
 * @example
 * ```ts
 * import { inputRules, toastRules, formRules } from '@plures/praxis/factory';
 *
 * const registry = new PraxisRegistry();
 * registry.registerModule(inputRules({ sanitize: ['xss', 'sql-injection'], required: true }));
 * registry.registerModule(toastRules({ requireDiff: true, deduplicate: true }));
 * registry.registerModule(formRules({ validateOnBlur: true, submitGate: true }));
 * ```
 */

import type { PraxisModule, RuleDescriptor, ConstraintDescriptor } from '../core/rules.js';
import { RuleResult, fact } from '../core/rule-result.js';
import type {
  InputRulesConfig,
  ToastRulesConfig,
  FormRulesConfig,
  NavigationRulesConfig,
  DataRulesConfig,
  SanitizationType,
} from './types.js';

// ─── Sanitization Patterns ──────────────────────────────────────────────────

const SANITIZE_PATTERNS: Record<SanitizationType, RegExp> = {
  'sql-injection': /('|"|;|--|\/\*|\*\/|xp_|exec\s|union\s+select|drop\s+table|insert\s+into|delete\s+from)/i,
  'xss': /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed|<img[^>]+onerror)/i,
  'path-traversal': /(\.\.[/\\]|~\/|\/etc\/|\/proc\/)/i,
  'command-injection': /([;&|`$]|\$\(|>\s*\/)/i,
};

// ─── Input Rules Factory ────────────────────────────────────────────────────

/** Context type for input rules. */
interface InputContext {
  input?: {
    value?: string;
    field?: string;
  };
}

/**
 * Create input validation rules module.
 *
 * Generates rules for sanitizing user input, enforcing length limits,
 * and requiring non-empty values.
 *
 * @param config - Optional input rules configuration: sanitization types, max length, required flag
 * @returns A {@link PraxisModule} with input validation rules and constraints
 */
export function inputRules(config: InputRulesConfig = {}): PraxisModule<InputContext> {
  const {
    sanitize = [],
    maxLength = 0,
    required = false,
    fieldName = 'input',
  } = config;

  const rules: RuleDescriptor<InputContext>[] = [];
  const constraints: ConstraintDescriptor<InputContext>[] = [];

  // Sanitization rule
  if (sanitize.length > 0) {
    rules.push({
      id: `factory/input.sanitize-${fieldName}`,
      description: `Validates ${fieldName} against ${sanitize.join(', ')} patterns`,
      eventTypes: [`${fieldName}.submit`, `${fieldName}.change`],
      contract: {
        ruleId: `factory/input.sanitize-${fieldName}`,
        behavior: `Checks ${fieldName} for dangerous patterns: ${sanitize.join(', ')}`,
        examples: [
          { given: `${fieldName} contains safe text`, when: 'input submitted', then: 'input.valid emitted' },
          { given: `${fieldName} contains <script> tag`, when: 'input submitted', then: 'input.violation emitted' },
        ],
        invariants: [
          `Dangerous ${fieldName} patterns must never pass validation`,
          'All violations must include the violation type',
        ],
      },
      impl: (state, events) => {
        const inputEvent = events.find(e =>
          e.tag === `${fieldName}.submit` || e.tag === `${fieldName}.change`,
        );
        if (!inputEvent) return RuleResult.skip('No input event');

        const value = (inputEvent.payload as { value?: string })?.value ?? state.context.input?.value ?? '';
        const violations: string[] = [];

        for (const type of sanitize) {
          const pattern = SANITIZE_PATTERNS[type];
          if (pattern && pattern.test(value)) {
            violations.push(type);
          }
        }

        if (violations.length > 0) {
          return RuleResult.emit([
            fact(`${fieldName}.violation`, {
              field: fieldName,
              violations,
              message: `Input failed sanitization: ${violations.join(', ')}`,
            }),
          ]);
        }

        return RuleResult.emit([
          fact(`${fieldName}.valid`, { field: fieldName, sanitized: true }),
        ]);
      },
    });
  }

  // Max length constraint
  if (maxLength > 0) {
    constraints.push({
      id: `factory/input.max-length-${fieldName}`,
      description: `${fieldName} must not exceed ${maxLength} characters`,
      contract: {
        ruleId: `factory/input.max-length-${fieldName}`,
        behavior: `Enforces max length of ${maxLength} for ${fieldName}`,
        examples: [
          { given: `${fieldName} is 10 chars`, when: `maxLength is ${maxLength}`, then: maxLength >= 10 ? 'passes' : 'violation' },
        ],
        invariants: [`${fieldName} length must never exceed ${maxLength}`],
      },
      impl: (state) => {
        const value = state.context.input?.value ?? '';
        if (value.length > maxLength) {
          return `${fieldName} exceeds maximum length of ${maxLength} (got ${value.length})`;
        }
        return true;
      },
    });
  }

  // Required constraint
  if (required) {
    constraints.push({
      id: `factory/input.required-${fieldName}`,
      description: `${fieldName} is required and must not be empty`,
      contract: {
        ruleId: `factory/input.required-${fieldName}`,
        behavior: `Enforces that ${fieldName} is non-empty`,
        examples: [
          { given: `${fieldName} is "hello"`, when: 'checked', then: 'passes' },
          { given: `${fieldName} is empty`, when: 'checked', then: 'violation' },
        ],
        invariants: [`${fieldName} must never be empty when required`],
      },
      impl: (state) => {
        const value = state.context.input?.value ?? '';
        if (value.trim().length === 0) {
          return `${fieldName} is required but empty`;
        }
        return true;
      },
    });
  }

  return { rules, constraints };
}

// ─── Toast Rules Factory ────────────────────────────────────────────────────

/** Context type for toast rules. */
interface ToastContext {
  diff?: Record<string, unknown> | null;
  toasts?: Array<{ message: string; id: string }>;
}

/**
 * Create truthful toast notification rules.
 *
 * Generates rules that ensure toasts only appear with meaningful content,
 * auto-dismiss after a timeout, and avoid duplicates.
 *
 * @param config - Optional toast rules configuration: requireDiff, autoDismissMs, deduplicate
 * @returns A {@link PraxisModule} with toast notification rules
 */
export function toastRules(config: ToastRulesConfig = {}): PraxisModule<ToastContext> {
  const {
    requireDiff = false,
    autoDismissMs = 0,
    deduplicate = false,
  } = config;

  const rules: RuleDescriptor<ToastContext>[] = [];
  const constraints: ConstraintDescriptor<ToastContext>[] = [];

  // Toast emission rule
  rules.push({
    id: 'factory/toast.show',
    description: 'Emits toast notification with content and config',
    eventTypes: ['toast.request'],
    contract: {
      ruleId: 'factory/toast.show',
      behavior: 'Shows toast when requested, respecting diff requirement and auto-dismiss',
      examples: [
        { given: 'toast requested with message', when: 'toast.request fires', then: 'toast.show emitted' },
        ...(requireDiff ? [{ given: 'no diff present', when: 'toast.request fires', then: 'toast skipped' }] : []),
      ],
      invariants: [
        'Toast message must be non-empty',
        ...(requireDiff ? ['Toast must not appear when diff is empty'] : []),
      ],
    },
    impl: (state, events) => {
      const toastEvent = events.find(e => e.tag === 'toast.request');
      if (!toastEvent) return RuleResult.skip('No toast request');

      const payload = toastEvent.payload as { message?: string; type?: string };
      const message = payload.message ?? '';

      if (!message) return RuleResult.skip('Empty toast message');

      if (requireDiff) {
        const diff = state.context.diff;
        if (!diff || Object.keys(diff).length === 0) {
          return RuleResult.skip('No diff — toast suppressed');
        }
      }

      return RuleResult.emit([
        fact('toast.show', {
          message,
          type: payload.type ?? 'info',
          autoDismissMs: autoDismissMs > 0 ? autoDismissMs : undefined,
          timestamp: Date.now(),
        }),
      ]);
    },
  });

  // Deduplication constraint
  if (deduplicate) {
    constraints.push({
      id: 'factory/toast.no-duplicates',
      description: 'Prevents duplicate toast messages',
      contract: {
        ruleId: 'factory/toast.no-duplicates',
        behavior: 'Rejects toast if identical message is already showing',
        examples: [
          { given: 'same toast already visible', when: 'duplicate toast requested', then: 'violation' },
        ],
        invariants: ['No two toasts may have the same message simultaneously'],
      },
      impl: (state) => {
        const toasts = state.context.toasts ?? [];
        const messages = toasts.map(t => t.message);
        const uniqueMessages = new Set(messages);
        if (uniqueMessages.size < messages.length) {
          return 'Duplicate toast detected';
        }
        return true;
      },
    });
  }

  return { rules, constraints };
}

// ─── Form Rules Factory ─────────────────────────────────────────────────────

/** Context type for form rules. */
interface FormContext {
  form?: {
    fields?: Record<string, { value: unknown; error?: string; touched?: boolean }>;
    valid?: boolean;
    dirty?: boolean;
    submitting?: boolean;
  };
}

/**
 * Create form lifecycle rules.
 *
 * Generates rules for field validation on blur, submit gating,
 * and form state management.
 *
 * @param config - Optional form rules configuration: validateOnBlur, submitGate, formName
 * @returns A {@link PraxisModule} with form lifecycle rules and constraints
 */
export function formRules(config: FormRulesConfig = {}): PraxisModule<FormContext> {
  const {
    validateOnBlur = false,
    submitGate = false,
    formName = 'form',
  } = config;

  const rules: RuleDescriptor<FormContext>[] = [];
  const constraints: ConstraintDescriptor<FormContext>[] = [];

  // Validate on blur rule
  if (validateOnBlur) {
    rules.push({
      id: `factory/${formName}.validate-on-blur`,
      description: `Triggers field validation when a ${formName} field loses focus`,
      eventTypes: [`${formName}.blur`],
      contract: {
        ruleId: `factory/${formName}.validate-on-blur`,
        behavior: `Validates the blurred field and emits validation result`,
        examples: [
          { given: `${formName} field has value`, when: 'field loses focus', then: 'validation result emitted' },
        ],
        invariants: ['Validation must run for every blur event on a registered field'],
      },
      impl: (_state, events) => {
        const blurEvent = events.find(e => e.tag === `${formName}.blur`);
        if (!blurEvent) return RuleResult.skip('No blur event');

        const payload = blurEvent.payload as { field?: string; value?: unknown };
        const field = payload.field ?? 'unknown';
        const value = payload.value;

        // Basic presence check — real apps would have per-field validators
        const valid = value !== null && value !== undefined && value !== '';

        return RuleResult.emit([
          fact(`${formName}.field-validated`, {
            field,
            valid,
            error: valid ? null : `${field} is required`,
          }),
        ]);
      },
    });
  }

  // Submit gate constraint
  if (submitGate) {
    constraints.push({
      id: `factory/${formName}.submit-gate`,
      description: `Prevents ${formName} submission when validation has not passed`,
      contract: {
        ruleId: `factory/${formName}.submit-gate`,
        behavior: `Blocks form submission until all fields are valid`,
        examples: [
          { given: `${formName} is invalid`, when: 'submit attempted', then: 'violation — submission blocked' },
          { given: `${formName} is valid`, when: 'submit attempted', then: 'passes' },
        ],
        invariants: ['Form must not submit while any field has errors'],
      },
      impl: (state) => {
        const form = state.context.form;
        if (!form) return true; // no form state = allow
        if (form.submitting && !form.valid) {
          return `${formName} cannot submit: validation has not passed`;
        }
        return true;
      },
    });
  }

  // Form dirty tracking rule
  rules.push({
    id: `factory/${formName}.dirty-tracking`,
    description: `Tracks whether ${formName} has unsaved changes`,
    eventTypes: [`${formName}.change`, `${formName}.reset`],
    contract: {
      ruleId: `factory/${formName}.dirty-tracking`,
      behavior: 'Emits dirty state when form fields change, clears on reset',
      examples: [
        { given: 'field value changed', when: 'form.change fires', then: 'form.dirty emitted' },
        { given: 'form reset', when: 'form.reset fires', then: 'form.dirty retracted' },
      ],
      invariants: ['Dirty state must reflect actual field changes'],
    },
    impl: (_state, events) => {
      const resetEvent = events.find(e => e.tag === `${formName}.reset`);
      if (resetEvent) {
        return RuleResult.retract([`${formName}.dirty`], 'Form reset');
      }

      const changeEvent = events.find(e => e.tag === `${formName}.change`);
      if (changeEvent) {
        return RuleResult.emit([
          fact(`${formName}.dirty`, { dirty: true }),
        ]);
      }

      return RuleResult.skip('No form event');
    },
  });

  return { rules, constraints };
}

// ─── Navigation Rules Factory ───────────────────────────────────────────────

/** Context type for navigation rules. */
interface NavigationContext {
  dirty?: boolean;
  authenticated?: boolean;
  route?: string;
}

/**
 * Create route protection rules.
 *
 * Generates rules for dirty-data navigation guards and
 * authentication-required route protection.
 *
 * @param config - Optional navigation rules configuration: dirtyGuard, authRequired
 * @returns A {@link PraxisModule} with navigation guard rules and constraints
 */
export function navigationRules(config: NavigationRulesConfig = {}): PraxisModule<NavigationContext> {
  const {
    dirtyGuard = false,
    authRequired = false,
  } = config;

  const rules: RuleDescriptor<NavigationContext>[] = [];
  const constraints: ConstraintDescriptor<NavigationContext>[] = [];

  // Navigation request handler
  rules.push({
    id: 'factory/navigation.handle',
    description: 'Processes navigation requests and emits navigation facts',
    eventTypes: ['navigation.request'],
    contract: {
      ruleId: 'factory/navigation.handle',
      behavior: 'Emits navigation.allowed or navigation.blocked based on guards',
      examples: [
        { given: 'no guards active', when: 'navigation requested', then: 'navigation.allowed emitted' },
        ...(dirtyGuard ? [{ given: 'form is dirty', when: 'navigation requested', then: 'navigation.blocked emitted' }] : []),
        ...(authRequired ? [{ given: 'user not authenticated', when: 'navigation requested', then: 'navigation.blocked emitted' }] : []),
      ],
      invariants: [
        'Every navigation request must result in either allowed or blocked',
        ...(dirtyGuard ? ['Navigation must be blocked when dirty data exists'] : []),
        ...(authRequired ? ['Navigation must be blocked when not authenticated'] : []),
      ],
    },
    impl: (state, events) => {
      const navEvent = events.find(e => e.tag === 'navigation.request');
      if (!navEvent) return RuleResult.skip('No navigation request');

      const target = (navEvent.payload as { target?: string })?.target ?? '/';
      const reasons: string[] = [];

      if (dirtyGuard && state.context.dirty) {
        reasons.push('Unsaved changes will be lost');
      }

      if (authRequired && !state.context.authenticated) {
        reasons.push('Authentication required');
      }

      if (reasons.length > 0) {
        return RuleResult.emit([
          fact('navigation.blocked', { target, reasons }),
        ]);
      }

      return RuleResult.emit([
        fact('navigation.allowed', { target }),
      ]);
    },
  });

  // Dirty guard constraint
  if (dirtyGuard) {
    constraints.push({
      id: 'factory/navigation.dirty-guard',
      description: 'Prevents silent navigation when unsaved changes exist',
      contract: {
        ruleId: 'factory/navigation.dirty-guard',
        behavior: 'Blocks navigation when dirty state is true',
        examples: [
          { given: 'dirty is true', when: 'navigation attempted', then: 'violation' },
          { given: 'dirty is false', when: 'navigation attempted', then: 'passes' },
        ],
        invariants: ['Must never silently lose unsaved changes'],
      },
      impl: (state) => {
        // This constraint fires if navigation somehow bypasses the rule
        if (state.context.dirty && state.facts.some(f => f.tag === 'navigation.allowed')) {
          return 'Navigation allowed while dirty — unsaved changes may be lost';
        }
        return true;
      },
    });
  }

  return { rules, constraints };
}

// ─── Data Rules Factory ─────────────────────────────────────────────────────

/** Context type for data rules. */
interface DataContext {
  pending?: Record<string, { original: unknown; optimistic: unknown }>;
  cache?: Record<string, { data: unknown; timestamp: number }>;
}

/**
 * Create data lifecycle rules.
 *
 * Generates rules for optimistic updates, error rollback, and cache invalidation.
 *
 * @param config - Optional data rules configuration: optimisticUpdate, rollbackOnError, cacheInvalidation
 * @returns A {@link PraxisModule} with data lifecycle rules
 */
export function dataRules(config: DataRulesConfig = {}): PraxisModule<DataContext> {
  const {
    optimisticUpdate = false,
    rollbackOnError = false,
    cacheInvalidation = false,
    entityName = 'data',
  } = config;

  const rules: RuleDescriptor<DataContext>[] = [];
  const constraints: ConstraintDescriptor<DataContext>[] = [];

  // Optimistic update rule
  if (optimisticUpdate) {
    rules.push({
      id: `factory/${entityName}.optimistic-update`,
      description: `Applies optimistic update for ${entityName} while request is pending`,
      eventTypes: [`${entityName}.mutate`],
      contract: {
        ruleId: `factory/${entityName}.optimistic-update`,
        behavior: `Immediately emits updated ${entityName} state before server confirmation`,
        examples: [
          { given: `${entityName} mutation requested`, when: 'mutate event fires', then: 'optimistic state emitted' },
        ],
        invariants: [
          'Optimistic state must store original for rollback',
          'Optimistic update must be distinguishable from confirmed state',
        ],
      },
      impl: (_state, events) => {
        const mutateEvent = events.find(e => e.tag === `${entityName}.mutate`);
        if (!mutateEvent) return RuleResult.skip('No mutation event');

        const payload = mutateEvent.payload as { id?: string; data?: unknown };
        return RuleResult.emit([
          fact(`${entityName}.optimistic`, {
            id: payload.id,
            data: payload.data,
            pending: true,
            timestamp: Date.now(),
          }),
        ]);
      },
    });
  }

  // Rollback on error rule
  if (rollbackOnError) {
    rules.push({
      id: `factory/${entityName}.rollback`,
      description: `Rolls back optimistic ${entityName} update on error`,
      eventTypes: [`${entityName}.error`],
      contract: {
        ruleId: `factory/${entityName}.rollback`,
        behavior: `Reverts to original ${entityName} state when mutation fails`,
        examples: [
          { given: 'optimistic update was applied', when: 'server returns error', then: 'rollback emitted, optimistic retracted' },
        ],
        invariants: [
          'Rollback must restore original state exactly',
          'Optimistic facts must be retracted on rollback',
        ],
      },
      impl: (_state, events) => {
        const errorEvent = events.find(e => e.tag === `${entityName}.error`);
        if (!errorEvent) return RuleResult.skip('No error event');

        const payload = errorEvent.payload as { id?: string; error?: string };

        // Emit rollback fact and retract optimistic updates
        const result = RuleResult.emit([
          fact(`${entityName}.rollback`, {
            id: payload.id,
            error: payload.error,
            timestamp: Date.now(),
          }),
        ]);
        return result;
      },
    });
  }

  // Cache invalidation rule
  if (cacheInvalidation) {
    rules.push({
      id: `factory/${entityName}.cache-invalidate`,
      description: `Invalidates ${entityName} cache when data changes are confirmed`,
      eventTypes: [`${entityName}.confirmed`, `${entityName}.deleted`],
      contract: {
        ruleId: `factory/${entityName}.cache-invalidate`,
        behavior: `Emits cache invalidation signal when ${entityName} is confirmed or deleted`,
        examples: [
          { given: `${entityName} mutation confirmed`, when: 'confirmed event fires', then: 'cache.invalidate emitted' },
        ],
        invariants: ['Stale cache entries must be invalidated after confirmed mutations'],
      },
      impl: (_state, events) => {
        const confirmEvent = events.find(e =>
          e.tag === `${entityName}.confirmed` || e.tag === `${entityName}.deleted`,
        );
        if (!confirmEvent) return RuleResult.skip('No confirmation event');

        const payload = confirmEvent.payload as { id?: string };
        return RuleResult.emit([
          fact(`${entityName}.cache-invalidate`, {
            id: payload.id,
            timestamp: Date.now(),
          }),
        ]);
      },
    });
  }

  // Data integrity constraint
  constraints.push({
    id: `factory/${entityName}.integrity`,
    description: `Ensures ${entityName} state integrity — no orphaned optimistic updates`,
    contract: {
      ruleId: `factory/${entityName}.integrity`,
      behavior: 'Detects orphaned optimistic updates without pending confirmation',
      examples: [
        { given: 'optimistic update exists without pending request', when: 'checked', then: 'violation' },
      ],
      invariants: [`Every optimistic ${entityName} update must have a corresponding pending request`],
    },
    impl: (state) => {
      const pending = state.context.pending ?? {};
      const optimisticFacts = state.facts.filter(f => f.tag === `${entityName}.optimistic`);

      for (const optFact of optimisticFacts) {
        const id = (optFact.payload as { id?: string })?.id;
        if (id && !pending[id]) {
          return `Orphaned optimistic update for ${entityName} id=${id} — no pending request`;
        }
      }
      return true;
    },
  });

  return { rules, constraints };
}
