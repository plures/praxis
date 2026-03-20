/**
 * Praxis UI Rules
 *
 * Lightweight, predefined UI-specific rules and constraints.
 * These govern UI behavior without muddying business logic rules.
 *
 * UI rules are separated from domain rules by convention:
 * - Domain rules: business decisions, data invariants, workflow logic
 * - UI rules: visibility, loading states, error display, navigation guards
 *
 * Ship predefined rules that apps can opt into. Every `if` in the UI
 * can be governed by Praxis — business rules stay clean, UI rules stay separate.
 */

import type { PraxisEvent } from './protocol.js';
import type { PraxisModule, RuleDescriptor, ConstraintDescriptor } from './rules.js';
import { RuleResult, fact } from './rule-result.js';

// ─── UI Rule Tag Prefix ─────────────────────────────────────────────────────
// All UI facts are prefixed with 'ui.' to distinguish from domain facts.

/**
 * Standard UI state fields that UI rules can read from context.
 * Apps extend their context with these fields to enable UI rules.
 */
export interface UIContext {
  /** Whether the app is currently loading data */
  loading?: boolean;
  /** Current error message, if any */
  error?: string | null;
  /** Whether the app is in offline mode */
  offline?: boolean;
  /** Whether there are unsaved changes */
  dirty?: boolean;
  /** Current route/view name */
  route?: string;
  /** Whether the app has completed initialization */
  initialized?: boolean;
  /** Screen width category: 'mobile' | 'tablet' | 'desktop' */
  viewport?: 'mobile' | 'tablet' | 'desktop';
  /** Whether a modal/dialog is currently open */
  modalOpen?: boolean;
  /** Active panel/tab name */
  activePanel?: string | null;
}

// ─── Predefined UI Rules ────────────────────────────────────────────────────

/**
 * Loading gate: emits ui.loading-gate when data is loading.
 * UI components can subscribe to this fact to show loading indicators.
 */
export const loadingGateRule: RuleDescriptor<UIContext> = {
  id: 'ui/loading-gate',
  description: 'Signals when the app is in a loading state',
  eventTypes: ['ui.state-change', 'app.init'],
  impl: (state) => {
    const ctx = state.context;
    if (ctx.loading) {
      return RuleResult.emit([fact('ui.loading-gate', { active: true })]);
    }
    return RuleResult.retract(['ui.loading-gate'], 'Not loading');
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Emits ui.loading-gate when context.loading is true, retracts when false',
    examples: [
      { given: 'loading is true', when: 'ui state changes', then: 'ui.loading-gate emitted' },
      { given: 'loading is false', when: 'ui state changes', then: 'ui.loading-gate retracted' },
    ],
    invariants: ['Loading gate must reflect context.loading exactly'],
  },
};

/**
 * Error display: emits ui.error-display with the error message.
 * Retracts when error clears.
 */
export const errorDisplayRule: RuleDescriptor<UIContext> = {
  id: 'ui/error-display',
  description: 'Signals when an error should be displayed to the user',
  eventTypes: ['ui.state-change', 'app.error'],
  impl: (state) => {
    const ctx = state.context;
    if (ctx.error) {
      return RuleResult.emit([fact('ui.error-display', { message: ctx.error, severity: 'error' })]);
    }
    return RuleResult.retract(['ui.error-display'], 'Error cleared');
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Emits ui.error-display when context.error is non-null, retracts when cleared',
    examples: [
      { given: 'error is set', when: 'ui state changes', then: 'ui.error-display emitted with message' },
      { given: 'error is null', when: 'ui state changes', then: 'ui.error-display retracted' },
    ],
    invariants: ['Error display must clear when error is null'],
  },
};

/**
 * Offline indicator: emits ui.offline-indicator when the app detects offline state.
 */
export const offlineIndicatorRule: RuleDescriptor<UIContext> = {
  id: 'ui/offline-indicator',
  description: 'Signals when the app is offline',
  eventTypes: ['ui.state-change', 'network.change'],
  impl: (state) => {
    if (state.context.offline) {
      return RuleResult.emit([fact('ui.offline', { message: 'You are offline. Changes will sync when reconnected.' })]);
    }
    return RuleResult.retract(['ui.offline'], 'Back online');
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Emits ui.offline when context.offline is true, retracts when back online',
    examples: [
      { given: 'offline is true', when: 'network changes', then: 'ui.offline emitted' },
      { given: 'offline is false', when: 'network changes', then: 'ui.offline retracted' },
    ],
    invariants: ['Offline indicator must match actual connectivity'],
  },
};

/**
 * Dirty guard: emits ui.unsaved-warning when there are unsaved changes.
 * Can be used to block navigation or show save prompts.
 */
export const dirtyGuardRule: RuleDescriptor<UIContext> = {
  id: 'ui/dirty-guard',
  description: 'Warns when there are unsaved changes',
  eventTypes: ['ui.state-change', 'navigation.request'],
  impl: (state) => {
    if (state.context.dirty) {
      return RuleResult.emit([fact('ui.unsaved-warning', {
        message: 'You have unsaved changes',
        blocking: true,
      })]);
    }
    return RuleResult.retract(['ui.unsaved-warning'], 'No unsaved changes');
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Emits ui.unsaved-warning when context.dirty is true, retracts when saved',
    examples: [
      { given: 'dirty is true', when: 'ui state changes', then: 'ui.unsaved-warning emitted with blocking=true' },
      { given: 'dirty is false', when: 'ui state changes', then: 'ui.unsaved-warning retracted' },
    ],
    invariants: ['Dirty guard must clear after save'],
  },
};

/**
 * Init gate: blocks UI interactions until app is initialized.
 */
export const initGateRule: RuleDescriptor<UIContext> = {
  id: 'ui/init-gate',
  description: 'Signals whether the app has completed initialization',
  eventTypes: ['ui.state-change', 'app.init'],
  impl: (state) => {
    if (!state.context.initialized) {
      return RuleResult.emit([fact('ui.init-pending', {
        message: 'App is initializing...',
      })]);
    }
    return RuleResult.retract(['ui.init-pending'], 'App initialized');
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Emits ui.init-pending until context.initialized is true',
    examples: [
      { given: 'initialized is false', when: 'app starts', then: 'ui.init-pending emitted' },
      { given: 'initialized is true', when: 'init completes', then: 'ui.init-pending retracted' },
    ],
    invariants: ['Init gate must clear exactly once, when initialization completes'],
  },
};

/**
 * Viewport-responsive: emits ui.viewport-class based on screen size.
 */
export const viewportRule: RuleDescriptor<UIContext> = {
  id: 'ui/viewport-class',
  description: 'Classifies viewport size for responsive layout decisions',
  eventTypes: ['ui.state-change', 'ui.resize'],
  impl: (state) => {
    const vp = state.context.viewport;
    if (!vp) return RuleResult.skip('No viewport data');
    return RuleResult.emit([fact('ui.viewport-class', {
      viewport: vp,
      compact: vp === 'mobile',
      showSidebar: vp !== 'mobile',
    })]);
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Classifies viewport into responsive layout hints',
    examples: [
      { given: 'viewport is mobile', when: 'resize event', then: 'compact=true, showSidebar=false' },
      { given: 'viewport is desktop', when: 'resize event', then: 'compact=false, showSidebar=true' },
    ],
    invariants: ['Viewport class must update on every resize event'],
  },
};

// ─── UI Constraints ─────────────────────────────────────────────────────────

/**
 * No interaction while loading: constraint that fails if actions are taken during loading.
 */
export const noInteractionWhileLoadingConstraint: ConstraintDescriptor<UIContext> = {
  id: 'ui/no-interaction-while-loading',
  description: 'Prevents data mutations while a load operation is in progress',
  impl: (state) => {
    // This constraint is advisory — apps can use checkConstraints() before mutations
    if (state.context.loading) {
      return 'Cannot perform action while data is loading';
    }
    return true;
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Fails when context.loading is true',
    examples: [
      { given: 'loading is true', when: 'action attempted', then: 'violation' },
      { given: 'loading is false', when: 'action attempted', then: 'pass' },
    ],
    invariants: ['Must always fail during loading'],
  },
};

/**
 * Must be initialized: constraint that fails if app hasn't completed init.
 */
export const mustBeInitializedConstraint: ConstraintDescriptor<UIContext> = {
  id: 'ui/must-be-initialized',
  description: 'Requires app initialization before user interactions',
  impl: (state) => {
    if (!state.context.initialized) {
      return 'App must be initialized before performing this action';
    }
    return true;
  },
  contract: {
    ruleId: 'RULE_ID_PLACEHOLDER',
    behavior: 'Fails when context.initialized is false',
    examples: [
      { given: 'initialized is false', when: 'action attempted', then: 'violation' },
      { given: 'initialized is true', when: 'action attempted', then: 'pass' },
    ],
    invariants: ['Must always fail before init completes'],
  },
};

// ─── Module Bundle ──────────────────────────────────────────────────────────

/**
 * The complete UI rules module.
 * Register this to get all predefined UI rules and constraints.
 *
 * @example
 * import { uiModule } from '@plures/praxis';
 * registry.registerModule(uiModule);
 */
export const uiModule: PraxisModule<UIContext> = {
  rules: [
    loadingGateRule,
    errorDisplayRule,
    offlineIndicatorRule,
    dirtyGuardRule,
    initGateRule,
    viewportRule,
  ],
  constraints: [
    noInteractionWhileLoadingConstraint,
    mustBeInitializedConstraint,
  ],
  meta: {
    name: 'praxis-ui',
    version: '1.0.0',
    description: 'Predefined UI rules and constraints — separate from business logic',
  },
};

/**
 * Create a customized UI module with only the rules you need.
 *
 * @example
 * const myUI = createUIModule({
 *   rules: ['ui/loading-gate', 'ui/dirty-guard'],
 *   constraints: ['ui/must-be-initialized'],
 * });
 * registry.registerModule(myUI);
 */
export function createUIModule<TContext extends UIContext>(options: {
  rules?: string[];
  constraints?: string[];
  extraRules?: RuleDescriptor<TContext>[];
  extraConstraints?: ConstraintDescriptor<TContext>[];
}): PraxisModule<TContext> {
  const allRules = uiModule.rules as RuleDescriptor<TContext>[];
  const allConstraints = uiModule.constraints as ConstraintDescriptor<TContext>[];

  const selectedRules = options.rules
    ? allRules.filter(r => options.rules!.includes(r.id))
    : allRules;

  const selectedConstraints = options.constraints
    ? allConstraints.filter(c => options.constraints!.includes(c.id))
    : allConstraints;

  return {
    rules: [...selectedRules, ...(options.extraRules ?? [])],
    constraints: [...selectedConstraints, ...(options.extraConstraints ?? [])],
    meta: { ...uiModule.meta, customized: true },
  };
}

// ─── UI Event Helpers ───────────────────────────────────────────────────────

/**
 * Create a UI state change event. Fire this when UIContext fields change.
 */
export function uiStateChanged(changes?: Record<string, unknown>): PraxisEvent {
  return { tag: 'ui.state-change', payload: changes ?? {} };
}

/**
 * Create a navigation request event. Used with dirty guard.
 */
export function navigationRequest(to: string): PraxisEvent {
  return { tag: 'navigation.request', payload: { to } };
}

/**
 * Create a resize event. Used with viewport rule.
 */
export function resizeEvent(width: number, height: number): PraxisEvent {
  return { tag: 'ui.resize', payload: { width, height } };
}
