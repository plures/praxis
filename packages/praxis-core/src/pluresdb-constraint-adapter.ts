/**
 * PluresDB Constraint Adapter (ADR-0028)
 *
 * Opt-in bridge that lets {@link LogicEngine.step}'s constraint loop delegate
 * **declarative** constraints to the canonical Rust constraint engine
 * (`pluresdb-px`) via the already-published `pluresdb-node` NAPI surface
 * (`pxOnAction` / `pxEvaluate`), per ADR-0028 §1–2.
 *
 * Design constraints (ADR-0028 + house rules):
 * - **ADDITIVE / opt-in only.** When no adapter is configured on the engine,
 *   `step()` behaves byte-identically to before (closure constraints only).
 * - **Only declarative constraints route to Rust.** A constraint opts in by
 *   carrying `meta.declarative === true` plus a `meta.action` ctx. TS-closure
 *   constraints/rules and the Facts/Events derivation engine stay in TS.
 * - **`pxOnAction` throws on an error-severity block.** This adapter catches
 *   that throw and translates it into the existing praxis `constraint-violation`
 *   diagnostic shape (it never lets the block escape as an uncaught throw).
 * - **C-NOSTUB-001.** This module ships NO stub/mocks. The Rust binding is
 *   injected as a typed seam ({@link PluresDbConstraintBinding}); the real
 *   `PluresDatabase` NAPI object satisfies it structurally. No re-implementation
 *   of declarative evaluation happens here — TS only marshals the ctx and
 *   translates the Rust verdict/throw.
 */

import type { PraxisDiagnostics } from './protocol.js';
import type { ConstraintDescriptor } from './rules.js';

/**
 * The pre-action context handed to the Rust constraint engine. Mirrors the
 * `AgentContext` that `pxOnAction` / `pxEvaluate` deserialize
 * (`{ action_type, target, session_type, metadata }`).
 */
export interface PluresDbActionContext {
  /** Action being attempted, e.g. `"write_file"`. */
  action_type: string;
  /** Action target, e.g. a path or resource id. */
  target: string;
  /** Calling session kind, e.g. `"main"`. Defaults to `"main"` when omitted. */
  session_type?: string;
  /** Free-form metadata the declarative constraints may inspect. */
  metadata?: Record<string, unknown>;
}

/**
 * A single violation as returned by the Rust engine
 * (`pxEvaluate` array entry / the `violations` array from `pxOnAction`).
 */
export interface PluresDbViolation {
  /** Constraint id/name that fired. */
  constraint?: string;
  /** Human-readable violation message. */
  message?: string;
  /** Any additional fields the Rust engine attaches (forward-compatible). */
  [key: string]: unknown;
}

/**
 * The minimal NAPI surface this adapter consumes. The real
 * `PluresDatabase` from `@plures/pluresdb` / `pluresdb-node` satisfies this
 * structurally, so the runtime caller passes the genuine database object —
 * this interface is a typed seam, **not** a stand-in implementation.
 */
export interface PluresDbConstraintBinding {
  /**
   * Pre-action hook. Returns `{ violations }` (warning-only, possibly empty)
   * on a permitted action; **throws** when an error-severity constraint blocks.
   */
  pxOnAction(ctx: PluresDbActionContext): { violations?: PluresDbViolation[] } | unknown;
  /**
   * Non-throwing evaluation. Returns every violated constraint as an array of
   * {@link PluresDbViolation}. Used as a fallback when `pxOnAction` is absent.
   */
  pxEvaluate?(ctx: PluresDbActionContext): PluresDbViolation[] | unknown;
}

/**
 * Declarative-constraint marker carried on a {@link ConstraintDescriptor}'s
 * `meta`. A constraint participates in Rust delegation **only** when its `meta`
 * matches this shape; otherwise it stays a TS-closure constraint (additive).
 */
export interface DeclarativeConstraintMeta {
  /** Must be exactly `true` to opt this constraint into Rust delegation. */
  declarative: true;
  /**
   * The pre-action ctx to evaluate against the CrdtStore-persisted constraints.
   * `target` defaults to the constraint id and `session_type` to `"main"` when
   * not supplied.
   */
  action: PluresDbActionContext;
}

/**
 * Returns the {@link DeclarativeConstraintMeta} for a constraint when it is
 * marked declarative (per ADR-0028), or `undefined` when it is an ordinary
 * TS-closure constraint. Pure predicate — no side effects.
 */
export function getDeclarativeMeta<TContext = unknown>(
  constraint: ConstraintDescriptor<TContext>
): DeclarativeConstraintMeta | undefined {
  const meta = constraint.meta as Record<string, unknown> | undefined;
  if (!meta || meta.declarative !== true) {
    return undefined;
  }
  const action = meta.action as PluresDbActionContext | undefined;
  if (!action || typeof action.action_type !== 'string') {
    return undefined;
  }
  return { declarative: true, action };
}

/** Options for {@link PluresDbConstraintAdapter}. */
export interface PluresDbConstraintAdapterOptions {
  /**
   * The bound database / NAPI object exposing `pxOnAction` (and optionally
   * `pxEvaluate`). Required — without it there is nothing to delegate to.
   */
  binding: PluresDbConstraintBinding;
  /**
   * Default `session_type` for delegated actions when a constraint's
   * `meta.action.session_type` is not set. Defaults to `"main"`.
   */
  defaultSessionType?: string;
}

/**
 * Adapts the praxis declarative-constraint check to the canonical Rust engine.
 *
 * The engine constructs this only when an adapter is configured; it then calls
 * {@link checkDeclarativeConstraint} for each constraint that
 * {@link getDeclarativeMeta} recognizes. The return value is the set of praxis
 * `constraint-violation` diagnostics (empty ⇒ permitted, no warnings).
 */
export class PluresDbConstraintAdapter {
  private readonly binding: PluresDbConstraintBinding;
  private readonly defaultSessionType: string;

  constructor(options: PluresDbConstraintAdapterOptions) {
    if (!options || !options.binding || typeof options.binding.pxOnAction !== 'function') {
      // Fail loud at construction — a misconfigured adapter must not silently
      // degrade to "no enforcement". This is a real error, not a stub fallback.
      throw new Error(
        'PluresDbConstraintAdapter requires a binding exposing pxOnAction(ctx)'
      );
    }
    this.binding = options.binding;
    this.defaultSessionType = options.defaultSessionType ?? 'main';
  }

  /**
   * Whether the given constraint should be delegated to Rust (i.e. it is
   * marked declarative). Constraints that return `false` here are left to the
   * engine's existing TS-closure evaluation.
   */
  handles<TContext = unknown>(constraint: ConstraintDescriptor<TContext>): boolean {
    return getDeclarativeMeta(constraint) !== undefined;
  }

  /**
   * Evaluate a single declarative constraint via the Rust engine and translate
   * the result into praxis `constraint-violation` diagnostics.
   *
   * - A permitted action with no warnings ⇒ `[]`.
   * - A permitted action carrying warning-only `violations` ⇒ one
   *   `constraint-violation` diagnostic per warning (mirrors the existing
   *   "constraint returned a message" path).
   * - An error-severity **block** (`pxOnAction` throws) ⇒ a single
   *   `constraint-violation` diagnostic carrying the block message — the throw
   *   is fully contained here.
   *
   * @param constraint The declarative constraint descriptor.
   * @returns Diagnostics in the canonical praxis shape (never throws for a
   *   constraint block; only re-throws nothing — see below).
   */
  checkDeclarativeConstraint<TContext = unknown>(
    constraint: ConstraintDescriptor<TContext>
  ): PraxisDiagnostics[] {
    const declarative = getDeclarativeMeta(constraint);
    if (!declarative) {
      // Caller should gate on handles(); defensive no-op keeps this pure.
      return [];
    }

    const ctx: PluresDbActionContext = {
      action_type: declarative.action.action_type,
      target: declarative.action.target ?? constraint.id,
      session_type: declarative.action.session_type ?? this.defaultSessionType,
      metadata: declarative.action.metadata ?? {},
    };

    try {
      const result = this.binding.pxOnAction(ctx) as
        | { violations?: PluresDbViolation[] }
        | undefined;
      const warnings = result && Array.isArray(result.violations) ? result.violations : [];
      if (warnings.length === 0) {
        return [];
      }
      // Permitted but with warning-severity violations — surface each as a
      // constraint-violation diagnostic (warning path), preserving the
      // existing "impl returned a message" semantics.
      return warnings.map((v) => this.toDiagnostic(constraint, v, false));
    } catch (error) {
      // Error-severity block: pxOnAction threw an ActionBlocked. Translate it
      // into the canonical praxis constraint-violation diagnostic instead of
      // letting it escape as an uncaught throw.
      return [this.toBlockDiagnostic(constraint, error)];
    }
  }

  /** Build a diagnostic from a single warning-severity violation record. */
  private toDiagnostic<TContext = unknown>(
    constraint: ConstraintDescriptor<TContext>,
    violation: PluresDbViolation,
    blocked: boolean
  ): PraxisDiagnostics {
    const message =
      (typeof violation.message === 'string' && violation.message) ||
      `Constraint "${constraint.id}" violated`;
    return {
      kind: 'constraint-violation',
      message,
      data: {
        constraintId: constraint.id,
        description: constraint.description,
        source: 'pluresdb',
        blocked,
        violation,
      },
    };
  }

  /** Build a diagnostic from a `pxOnAction` throw-on-block. */
  private toBlockDiagnostic<TContext = unknown>(
    constraint: ConstraintDescriptor<TContext>,
    error: unknown
  ): PraxisDiagnostics {
    const message = error instanceof Error ? error.message : String(error);
    return {
      kind: 'constraint-violation',
      message,
      data: {
        constraintId: constraint.id,
        description: constraint.description,
        source: 'pluresdb',
        blocked: true,
        error,
      },
    };
  }
}

/**
 * Convenience constructor mirroring the `create*` factory style used elsewhere
 * in praxis-core.
 */
export function createPluresDbConstraintAdapter(
  options: PluresDbConstraintAdapterOptions
): PluresDbConstraintAdapter {
  return new PluresDbConstraintAdapter(options);
}
