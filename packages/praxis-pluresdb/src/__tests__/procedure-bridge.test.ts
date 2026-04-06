/**
 * Tests for procedure bridge step mapping.
 *
 * These test the TS→IR translation without requiring a native binary.
 * Integration tests with actual PluresDB NAPI would go in a separate suite.
 */

import { describe, it, expect } from 'vitest';
import { canExecuteNatively, type TsProcedureStep } from '../procedure-bridge.js';

describe('canExecuteNatively', () => {
  it('returns true for pure query pipelines', () => {
    const steps: TsProcedureStep[] = [
      { kind: 'search', params: { query: 'test', limit: 5 } },
      { kind: 'filter', params: { field: 'category', op: 'eq', value: 'decision' } },
      { kind: 'sort', params: { by: 'timestamp', dir: 'desc' } },
      { kind: 'limit', params: { n: 10 } },
    ];
    expect(canExecuteNatively(steps)).toBe(true);
  });

  it('returns false when store step is present', () => {
    const steps: TsProcedureStep[] = [
      { kind: 'search', params: { query: 'test' } },
      { kind: 'store', params: { data: { text: 'hello' } } },
    ];
    expect(canExecuteNatively(steps)).toBe(false);
  });

  it('returns false for merge/parallel/cue', () => {
    expect(canExecuteNatively([{ kind: 'merge', params: {} }])).toBe(false);
    expect(canExecuteNatively([{ kind: 'parallel', params: {} }])).toBe(false);
    expect(canExecuteNatively([{ kind: 'cue', params: {} }])).toBe(false);
  });

  it('returns true for transform + emit pipeline', () => {
    const steps: TsProcedureStep[] = [
      { kind: 'search', params: { query: 'context' } },
      { kind: 'transform', params: { format: 'fused' } },
      { kind: 'emit', params: { label: 'output' } },
    ];
    expect(canExecuteNatively(steps)).toBe(true);
  });

  it('returns true for conditional pipelines', () => {
    const steps: TsProcedureStep[] = [
      { kind: 'conditional', params: {
        condition: { field: 'count', op: 'gt', value: 0 },
        then_steps: [{ kind: 'limit', params: { n: 5 } }],
        else_steps: [{ kind: 'search', params: { query: 'fallback' } }],
      }},
    ];
    expect(canExecuteNatively(steps)).toBe(true);
  });
});
