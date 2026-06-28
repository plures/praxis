/**
 * Tests for the ADR-0028 opt-in PluresDbConstraintAdapter.
 *
 * These exercise the TS adapter + engine wiring WITHOUT the native PluresDB
 * binary: the NAPI surface is injected at its typed seam
 * ({@link PluresDbConstraintBinding}) by a small in-test implementation. Per
 * house rules this is a documented test double used only to isolate the
 * dependency inside unit tests — never a shipped runtime stub. Integration
 * against the real `pluresdb-node` NAPI lives in a separate suite.
 */

import { describe, it, expect } from 'vitest';
import { LogicEngine } from '../engine.js';
import { PraxisRegistry } from '../rules.js';
import type { ConstraintDescriptor, RuleDescriptor } from '../rules.js';
import {
  PluresDbConstraintAdapter,
  getDeclarativeMeta,
  type PluresDbActionContext,
  type PluresDbConstraintBinding,
  type PluresDbViolation,
} from '../pluresdb-constraint-adapter.js';

/**
 * Minimal in-test binding implementing the real seam. `onAction` lets each
 * test drive the permit / warn / block behavior the Rust engine would exhibit.
 */
function makeBinding(
  onAction: (ctx: PluresDbActionContext) => { violations?: PluresDbViolation[] }
): PluresDbConstraintBinding & { calls: PluresDbActionContext[] } {
  const calls: PluresDbActionContext[] = [];
  return {
    calls,
    pxOnAction(ctx: PluresDbActionContext) {
      calls.push(ctx);
      return onAction(ctx);
    },
  };
}

const declarativeConstraint: ConstraintDescriptor = {
  id: 'C-WRITE-OWNER',
  description: 'write_file actions must declare a resource_owner',
  // When the adapter is OFF this closure is what runs — it must stay reachable
  // (additive guarantee). We make it pass so it is distinguishable from a Rust
  // block in the adapter-off regression test.
  impl: () => true,
  meta: {
    declarative: true,
    action: {
      action_type: 'write_file',
      target: 'config.toml',
      session_type: 'main',
      metadata: { resource_owner: '' },
    } satisfies PluresDbActionContext,
  },
};

function engineWith(
  constraints: ConstraintDescriptor[],
  rules: RuleDescriptor[],
  adapter?: PluresDbConstraintAdapter
) {
  // compliance off — these fixtures intentionally omit full contracts.
  const registry = new PraxisRegistry({ compliance: { enabled: false } });
  for (const r of rules) registry.registerRule(r);
  for (const c of constraints) registry.registerConstraint(c);
  return new LogicEngine({
    initialContext: {},
    registry,
    pluresDbConstraintAdapter: adapter,
  });
}

describe('getDeclarativeMeta', () => {
  it('recognizes a declarative constraint', () => {
    expect(getDeclarativeMeta(declarativeConstraint)).toEqual({
      declarative: true,
      action: declarativeConstraint.meta!.action,
    });
  });

  it('returns undefined for an ordinary closure constraint', () => {
    const c: ConstraintDescriptor = { id: 'C-PLAIN', description: 'plain', impl: () => true };
    expect(getDeclarativeMeta(c)).toBeUndefined();
  });
});

describe('PluresDbConstraintAdapter construction', () => {
  it('throws when binding lacks pxOnAction (fail loud, not silent no-op)', () => {
    expect(
      () => new PluresDbConstraintAdapter({ binding: {} as PluresDbConstraintBinding })
    ).toThrow(/pxOnAction/);
  });
});

describe('(a) declarative constraint blocks via pxOnAction throw', () => {
  it('surfaces a constraint-violation diagnostic, NOT an uncaught throw', () => {
    const binding = makeBinding(() => {
      // Rust pxOnAction throws on an error-severity block.
      throw new Error('ActionBlocked: C-WRITE-OWNER — resource_owner required');
    });
    const adapter = new PluresDbConstraintAdapter({ binding });
    const engine = engineWith([declarativeConstraint], [], adapter);

    let result!: ReturnType<LogicEngine['step']>;
    expect(() => {
      result = engine.step([{ tag: 'write', payload: {} }]);
    }).not.toThrow();

    const violations = result.diagnostics.filter((d) => d.kind === 'constraint-violation');
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toMatch(/resource_owner required/);
    const data = violations[0].data as Record<string, unknown>;
    expect(data.constraintId).toBe('C-WRITE-OWNER');
    expect(data.source).toBe('pluresdb');
    expect(data.blocked).toBe(true);
    // The Rust ctx was marshalled from meta.action.
    expect(binding.calls[0]).toMatchObject({ action_type: 'write_file', target: 'config.toml' });
  });

  it('permits silently when pxOnAction returns no violations', () => {
    const binding = makeBinding(() => ({ violations: [] }));
    const adapter = new PluresDbConstraintAdapter({ binding });
    const engine = engineWith([declarativeConstraint], [], adapter);

    const result = engine.step([{ tag: 'write', payload: {} }]);
    expect(result.diagnostics.filter((d) => d.kind === 'constraint-violation')).toHaveLength(0);
  });

  it('surfaces warning-only violations as constraint-violation diagnostics', () => {
    const binding = makeBinding(() => ({
      violations: [{ constraint: 'C-WRITE-OWNER', message: 'soft warning: prefer explicit owner' }],
    }));
    const adapter = new PluresDbConstraintAdapter({ binding });
    const engine = engineWith([declarativeConstraint], [], adapter);

    const result = engine.step([{ tag: 'write', payload: {} }]);
    const violations = result.diagnostics.filter((d) => d.kind === 'constraint-violation');
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toMatch(/soft warning/);
    expect((violations[0].data as Record<string, unknown>).blocked).toBe(false);
  });
});

describe('(b) adapter-off regression: step() behavior unchanged', () => {
  it('does not call any binding and runs the TS closure for a declarative-marked constraint', () => {
    // No adapter passed. The declarative constraint must fall back to its
    // closure impl (which returns true here → no violation), exactly as before.
    const engine = engineWith([declarativeConstraint], []);
    const result = engine.step([{ tag: 'write', payload: {} }]);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('still emits the existing constraint-violation shape for a failing closure', () => {
    const failing: ConstraintDescriptor = {
      id: 'C-FAIL',
      description: 'always fails',
      impl: () => false,
    };
    const stringFail: ConstraintDescriptor = {
      id: 'C-MSG',
      description: 'fails with message',
      impl: () => 'custom violation message',
    };
    const engine = engineWith([failing, stringFail], []);
    const result = engine.step([]);

    const byId = (id: string) =>
      result.diagnostics.find((d) => (d.data as { constraintId?: string })?.constraintId === id);

    const f = byId('C-FAIL')!;
    expect(f.kind).toBe('constraint-violation');
    expect(f.message).toBe('Constraint "C-FAIL" violated');
    expect(f.data).toEqual({ constraintId: 'C-FAIL', description: 'always fails' });

    const m = byId('C-MSG')!;
    expect(m.message).toBe('custom violation message');
    expect(m.data).toEqual({ constraintId: 'C-MSG', description: 'fails with message' });
  });
});

describe('(c) closure rules + closure constraints still run in TS when adapter is on', () => {
  it('evaluates TS-closure constraints and rules normally alongside delegated ones', () => {
    // Binding would BLOCK if consulted — proving the closure constraint below
    // is NOT routed to Rust (it has no declarative meta).
    const binding = makeBinding(() => {
      throw new Error('ActionBlocked: should not be called for closure constraint');
    });
    const adapter = new PluresDbConstraintAdapter({ binding });

    const closureConstraint: ConstraintDescriptor = {
      id: 'C-CLOSURE',
      description: 'pure TS closure constraint',
      impl: (state) => {
        // Violates only when a 'bad' fact is present.
        return !state.facts.some((f) => f.tag === 'bad');
      },
    };
    const emittingRule: RuleDescriptor = {
      id: 'R-EMIT',
      description: 'emits a fact on ping',
      eventTypes: 'ping',
      impl: () => [{ tag: 'pong', payload: { ok: true } }],
    };

    const engine = engineWith([closureConstraint], [emittingRule], adapter);
    const result = engine.step([{ tag: 'ping', payload: {} }]);

    // Rule ran in TS and emitted a fact.
    expect(result.state.facts.some((f) => f.tag === 'pong')).toBe(true);
    // Closure constraint ran in TS (passed) and the binding was never consulted.
    expect(result.diagnostics.filter((d) => d.kind === 'constraint-violation')).toHaveLength(0);
    expect(binding.calls).toHaveLength(0);
  });

  it('mixes a delegated declarative block with a passing closure constraint', () => {
    const binding = makeBinding(() => {
      throw new Error('ActionBlocked: C-WRITE-OWNER');
    });
    const adapter = new PluresDbConstraintAdapter({ binding });
    const closureOk: ConstraintDescriptor = {
      id: 'C-OK',
      description: 'closure ok',
      impl: () => true,
    };

    const engine = engineWith([declarativeConstraint, closureOk], [], adapter);
    const result = engine.step([{ tag: 'write', payload: {} }]);

    const violations = result.diagnostics.filter((d) => d.kind === 'constraint-violation');
    // Exactly one violation — from the delegated declarative constraint.
    expect(violations).toHaveLength(1);
    expect((violations[0].data as { constraintId?: string }).constraintId).toBe('C-WRITE-OWNER');
    // The declarative constraint was consulted via the binding exactly once.
    expect(binding.calls).toHaveLength(1);
  });
});
