/**
 * Tests for Expectations DSL
 */

import { describe, it, expect } from 'vitest';
import {
  Expectation,
  ExpectationSet,
  expectBehavior,
  verify,
  formatVerificationReport,
} from '../expectations/expectations.js';
import type { VerifiableRegistry, VerifiableDescriptor } from '../expectations/types.js';

// ─── Mock Registry ──────────────────────────────────────────────────────────

function createMockRegistry(
  rules: VerifiableDescriptor[] = [],
  constraints: VerifiableDescriptor[] = [],
): VerifiableRegistry {
  return {
    getAllRules: () => rules,
    getAllConstraints: () => constraints,
    getRuleIds: () => rules.map(r => r.id),
    getConstraintIds: () => constraints.map(c => c.id),
  };
}

const toastRule: VerifiableDescriptor = {
  id: 'ui/settings-saved-toast',
  description: 'Shows a toast when settings are saved successfully',
  eventTypes: ['settings.saved'],
  contract: {
    ruleId: 'ui/settings-saved-toast',
    behavior: 'Emits toast fact when settings diff is non-empty and save succeeds',
    examples: [
      {
        given: 'settings.diff is non-empty',
        when: 'save succeeds',
        then: 'toast emitted with changed settings list',
      },
      {
        given: 'settings.diff is empty',
        when: 'save attempted',
        then: 'no toast (skip)',
      },
    ],
    invariants: [
      'Toast must include which settings changed',
      'Toast must never appear when diff is empty',
    ],
  },
};

const errorConstraint: VerifiableDescriptor = {
  id: 'ui/no-toast-on-error',
  description: 'Prevents toast display during error state',
  contract: {
    ruleId: 'ui/no-toast-on-error',
    behavior: 'Blocks toast when save fails',
    examples: [
      {
        given: 'save fails',
        when: 'toast attempted',
        then: 'violation — save failure blocks toast',
      },
    ],
    invariants: ['Toast must never appear on save failure'],
  },
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Expectations DSL', () => {
  describe('Expectation class', () => {
    it('should create an expectation with a name', () => {
      const exp = new Expectation('my-behavior');
      expect(exp.name).toBe('my-behavior');
      expect(exp.conditions).toHaveLength(0);
    });

    it('should chain onlyWhen conditions', () => {
      const exp = new Expectation('toast')
        .onlyWhen('diff is non-empty')
        .onlyWhen('save succeeds');

      expect(exp.conditions).toHaveLength(2);
      expect(exp.conditions[0]).toEqual({ description: 'diff is non-empty', type: 'onlyWhen' });
      expect(exp.conditions[1]).toEqual({ description: 'save succeeds', type: 'onlyWhen' });
    });

    it('should chain never conditions', () => {
      const exp = new Expectation('toast')
        .never('when save fails')
        .never('when diff is empty');

      expect(exp.conditions).toHaveLength(2);
      expect(exp.conditions[0].type).toBe('never');
      expect(exp.conditions[1].type).toBe('never');
    });

    it('should chain always conditions', () => {
      const exp = new Expectation('toast')
        .always('includes changed settings');

      expect(exp.conditions).toHaveLength(1);
      expect(exp.conditions[0]).toEqual({ description: 'includes changed settings', type: 'always' });
    });

    it('should support mixed condition types', () => {
      const exp = new Expectation('settings-saved-toast')
        .onlyWhen('settings.diff is non-empty')
        .never('when save fails')
        .always('includes which settings changed');

      expect(exp.conditions).toHaveLength(3);
      expect(exp.conditions.map(c => c.type)).toEqual(['onlyWhen', 'never', 'always']);
    });
  });

  describe('expectBehavior builder', () => {
    it('should create an Expectation via builder', () => {
      const exp = expectBehavior('my-toast')
        .onlyWhen('data changed')
        .never('on error');

      expect(exp).toBeInstanceOf(Expectation);
      expect(exp.name).toBe('my-toast');
      expect(exp.conditions).toHaveLength(2);
    });
  });

  describe('ExpectationSet', () => {
    it('should create a named set', () => {
      const set = new ExpectationSet({ name: 'settings', description: 'Settings page expectations' });
      expect(set.name).toBe('settings');
      expect(set.description).toBe('Settings page expectations');
      expect(set.size).toBe(0);
    });

    it('should add expectations', () => {
      const set = new ExpectationSet({ name: 'ui' });
      set.add(expectBehavior('toast').onlyWhen('change detected'));
      set.add(expectBehavior('loading').always('shows spinner'));

      expect(set.size).toBe(2);
      expect(set.expectations[0].name).toBe('toast');
      expect(set.expectations[1].name).toBe('loading');
    });

    it('should support chained add', () => {
      const set = new ExpectationSet({ name: 'ui' })
        .add(expectBehavior('a'))
        .add(expectBehavior('b'));

      expect(set.size).toBe(2);
    });
  });

  describe('verify', () => {
    it('should return satisfied for expectations matching rule contracts', () => {
      const registry = createMockRegistry([toastRule], [errorConstraint]);

      const expectations = new ExpectationSet({ name: 'settings' });
      expectations.add(
        expectBehavior('settings-saved-toast')
          .onlyWhen('settings.diff is non-empty'),
      );

      const report = verify(registry, expectations);
      expect(report.status).toBe('satisfied');
      expect(report.summary.satisfied).toBe(1);
      expect(report.summary.violated).toBe(0);
    });

    it('should detect unverifiable conditions when no related rules exist', () => {
      const registry = createMockRegistry([], []);

      const expectations = new ExpectationSet({ name: 'ghost' });
      expectations.add(
        expectBehavior('nonexistent-feature')
          .onlyWhen('something happens'),
      );

      const report = verify(registry, expectations);
      expect(report.status).not.toBe('satisfied');
      expect(report.allEdgeCases.length).toBeGreaterThan(0);
    });

    it('should verify never conditions against constraints', () => {
      const registry = createMockRegistry([toastRule], [errorConstraint]);

      const expectations = new ExpectationSet({ name: 'toast-safety' });
      expectations.add(
        expectBehavior('settings-saved-toast')
          .never('when save fails'),
      );

      const report = verify(registry, expectations);
      // "save fails" should be caught by the constraint's invariants
      const condResult = report.expectations[0].conditions[0];
      expect(condResult.status).toBe('satisfied');
    });

    it('should verify always conditions against invariants', () => {
      const registry = createMockRegistry([toastRule], []);

      const expectations = new ExpectationSet({ name: 'toast-content' });
      expectations.add(
        expectBehavior('settings-saved-toast')
          .always('includes which settings changed'),
      );

      const report = verify(registry, expectations);
      const condResult = report.expectations[0].conditions[0];
      expect(condResult.status).toBe('satisfied');
    });

    it('should report partial when some conditions pass and others are unverifiable', () => {
      const registry = createMockRegistry([toastRule], []);

      const expectations = new ExpectationSet({ name: 'mixed' });
      expectations.add(
        expectBehavior('settings-saved-toast')
          .onlyWhen('settings.diff is non-empty')
          .always('includes confetti animation'), // not in any contract
      );

      const report = verify(registry, expectations);
      // First condition should be satisfied, second unverifiable => partial
      expect(report.expectations[0].status).toBe('partial');
    });

    it('should provide mitigations for unverifiable expectations', () => {
      const registry = createMockRegistry([], []);

      const expectations = new ExpectationSet({ name: 'gaps' });
      expectations.add(
        expectBehavior('missing-feature')
          .onlyWhen('user clicks button'),
      );

      const report = verify(registry, expectations);
      expect(report.allMitigations.length).toBeGreaterThan(0);
    });

    it('should handle empty expectation set', () => {
      const registry = createMockRegistry([toastRule]);
      const expectations = new ExpectationSet({ name: 'empty' });

      const report = verify(registry, expectations);
      expect(report.status).toBe('satisfied');
      expect(report.summary.total).toBe(0);
    });

    it('should handle expectation with no conditions', () => {
      const registry = createMockRegistry([toastRule]);
      const expectations = new ExpectationSet({ name: 'bare' });
      expectations.add(new Expectation('just-a-name'));

      const report = verify(registry, expectations);
      expect(report.expectations[0].status).toBe('satisfied'); // vacuously true
    });

    it('should include report timestamp', () => {
      const registry = createMockRegistry([]);
      const expectations = new ExpectationSet({ name: 'timed' });

      const report = verify(registry, expectations);
      expect(report.timestamp).toBeDefined();
      expect(new Date(report.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('formatVerificationReport', () => {
    it('should format a satisfied report', () => {
      const registry = createMockRegistry([toastRule], [errorConstraint]);
      const expectations = new ExpectationSet({ name: 'settings' });
      expectations.add(
        expectBehavior('settings-saved-toast')
          .onlyWhen('settings.diff is non-empty'),
      );

      const report = verify(registry, expectations);
      const formatted = formatVerificationReport(report);

      expect(formatted).toContain('settings');
      expect(formatted).toContain('SATISFIED');
    });

    it('should format a report with mitigations', () => {
      const registry = createMockRegistry([]);
      const expectations = new ExpectationSet({ name: 'gaps' });
      expectations.add(
        expectBehavior('missing')
          .onlyWhen('something'),
      );

      const report = verify(registry, expectations);
      const formatted = formatVerificationReport(report);

      expect(formatted).toContain('mitigation');
    });

    it('should include condition type labels', () => {
      const registry = createMockRegistry([toastRule]);
      const expectations = new ExpectationSet({ name: 'mixed' });
      expectations.add(
        expectBehavior('settings-saved-toast')
          .onlyWhen('settings.diff is non-empty')
          .never('on error')
          .always('shows details'),
      );

      const report = verify(registry, expectations);
      const formatted = formatVerificationReport(report);

      expect(formatted).toContain('onlyWhen');
      expect(formatted).toContain('never');
      expect(formatted).toContain('always');
    });
  });

  describe('integration with real PraxisRegistry', () => {
    it('should work with actual PraxisRegistry as VerifiableRegistry', async () => {
      const { PraxisRegistry } = await import('../core/rules.js');
      const { RuleResult, fact } = await import('../core/rule-result.js');

      const registry = new PraxisRegistry({
        compliance: { enabled: false },
      });

      registry.registerRule({
        id: 'auth/login',
        description: 'Process login and create session',
        eventTypes: 'auth.login',
        contract: {
          ruleId: 'auth/login',
          behavior: 'Creates session when valid credentials provided',
          examples: [
            { given: 'valid credentials', when: 'login event', then: 'session created' },
            { given: 'invalid credentials', when: 'login event', then: 'skip — no session' },
          ],
          invariants: ['Session must have unique ID', 'Invalid credentials must never create a session'],
        },
        impl: (_state, events) => {
          const loginEvt = events.find(e => e.tag === 'auth.login');
          if (!loginEvt) return RuleResult.skip('No login event');
          return RuleResult.emit([fact('auth.session', { userId: 'test' })]);
        },
      });

      const expectations = new ExpectationSet({ name: 'auth' });
      expectations.add(
        expectBehavior('auth/login')
          .onlyWhen('valid credentials')
          .never('invalid credentials'),
      );

      const report = verify(registry, expectations);
      expect(report.status).toBe('satisfied');
    });
  });
});
