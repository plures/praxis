/**
 * Tests for Rules Factory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { inputRules, toastRules, formRules, navigationRules, dataRules } from '../factory/factory.js';
import { PraxisRegistry } from '../core/rules.js';
import { LogicEngine } from '../core/engine.js';

// ─── Input Rules ────────────────────────────────────────────────────────────

describe('Rules Factory', () => {
  describe('inputRules', () => {
    it('should create a module with sanitization rules', () => {
      const mod = inputRules({ sanitize: ['xss', 'sql-injection'] });
      expect(mod.rules).toHaveLength(1);
      expect(mod.rules![0].id).toContain('sanitize');
    });

    it('should detect XSS in input', () => {
      const mod = inputRules({ sanitize: ['xss'] });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { input: { value: '<script>alert("xss")</script>' } },
        registry,
      });

      const result = engine.step([{ tag: 'input.submit', payload: { value: '<script>alert("xss")</script>' } }]);
      const violation = result.state.facts.find(f => f.tag === 'input.violation');
      expect(violation).toBeDefined();
      expect((violation!.payload as { violations: string[] }).violations).toContain('xss');
    });

    it('should pass clean input', () => {
      const mod = inputRules({ sanitize: ['xss', 'sql-injection'] });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { input: { value: 'Hello world' } },
        registry,
      });

      const result = engine.step([{ tag: 'input.submit', payload: { value: 'Hello world' } }]);
      const valid = result.state.facts.find(f => f.tag === 'input.valid');
      expect(valid).toBeDefined();
    });

    it('should detect SQL injection', () => {
      const mod = inputRules({ sanitize: ['sql-injection'] });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {},
        registry,
      });

      const result = engine.step([{ tag: 'input.submit', payload: { value: "'; DROP TABLE users; --" } }]);
      const violation = result.state.facts.find(f => f.tag === 'input.violation');
      expect(violation).toBeDefined();
    });

    it('should add max length constraint', () => {
      const mod = inputRules({ maxLength: 10 });
      expect(mod.constraints).toHaveLength(1);
      expect(mod.constraints![0].id).toContain('max-length');
    });

    it('should add required constraint', () => {
      const mod = inputRules({ required: true });
      expect(mod.constraints).toHaveLength(1);
      expect(mod.constraints![0].id).toContain('required');
    });

    it('should support custom field names', () => {
      const mod = inputRules({ sanitize: ['xss'], fieldName: 'search' });
      expect(mod.rules![0].id).toContain('search');
    });

    it('should include contracts on all rules', () => {
      const mod = inputRules({ sanitize: ['xss'], maxLength: 100, required: true });
      for (const rule of mod.rules ?? []) {
        expect(rule.contract).toBeDefined();
        expect(rule.contract!.behavior).toBeTruthy();
      }
      for (const constraint of mod.constraints ?? []) {
        expect(constraint.contract).toBeDefined();
      }
    });
  });

  // ─── Toast Rules ────────────────────────────────────────────────────────

  describe('toastRules', () => {
    it('should create toast show rule', () => {
      const mod = toastRules();
      expect(mod.rules).toHaveLength(1);
      expect(mod.rules![0].id).toBe('factory/toast.show');
    });

    it('should emit toast on request', () => {
      const mod = toastRules();
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {},
        registry,
      });

      const result = engine.step([{
        tag: 'toast.request',
        payload: { message: 'Settings saved!' },
      }]);

      const toast = result.state.facts.find(f => f.tag === 'toast.show');
      expect(toast).toBeDefined();
      expect((toast!.payload as { message: string }).message).toBe('Settings saved!');
    });

    it('should skip toast when requireDiff and no diff', () => {
      const mod = toastRules({ requireDiff: true });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { diff: null },
        registry,
      });

      const result = engine.step([{
        tag: 'toast.request',
        payload: { message: 'Settings saved!' },
      }]);

      const toast = result.state.facts.find(f => f.tag === 'toast.show');
      expect(toast).toBeUndefined();
    });

    it('should show toast when requireDiff and diff exists', () => {
      const mod = toastRules({ requireDiff: true });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { diff: { theme: 'dark' } },
        registry,
      });

      const result = engine.step([{
        tag: 'toast.request',
        payload: { message: 'Theme updated!' },
      }]);

      const toast = result.state.facts.find(f => f.tag === 'toast.show');
      expect(toast).toBeDefined();
    });

    it('should add deduplicate constraint', () => {
      const mod = toastRules({ deduplicate: true });
      expect(mod.constraints).toHaveLength(1);
      expect(mod.constraints![0].id).toBe('factory/toast.no-duplicates');
    });

    it('should include autoDismissMs in toast payload', () => {
      const mod = toastRules({ autoDismissMs: 3000 });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {},
        registry,
      });

      const result = engine.step([{
        tag: 'toast.request',
        payload: { message: 'Quick toast' },
      }]);

      const toast = result.state.facts.find(f => f.tag === 'toast.show');
      expect((toast!.payload as { autoDismissMs: number }).autoDismissMs).toBe(3000);
    });
  });

  // ─── Form Rules ─────────────────────────────────────────────────────────

  describe('formRules', () => {
    it('should always include dirty tracking rule', () => {
      const mod = formRules();
      expect(mod.rules!.some(r => r.id.includes('dirty-tracking'))).toBe(true);
    });

    it('should add validate-on-blur rule when configured', () => {
      const mod = formRules({ validateOnBlur: true });
      expect(mod.rules!.some(r => r.id.includes('validate-on-blur'))).toBe(true);
    });

    it('should add submit gate constraint when configured', () => {
      const mod = formRules({ submitGate: true });
      expect(mod.constraints!.some(c => c.id.includes('submit-gate'))).toBe(true);
    });

    it('should track dirty state on change events', () => {
      const mod = formRules();
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {},
        registry,
      });

      const result = engine.step([{
        tag: 'form.change',
        payload: { field: 'name', value: 'Alice' },
      }]);

      const dirty = result.state.facts.find(f => f.tag === 'form.dirty');
      expect(dirty).toBeDefined();
    });

    it('should clear dirty state on reset', () => {
      const mod = formRules();
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {},
        registry,
      });

      const result = engine.step([{ tag: 'form.reset', payload: {} }]);
      // Should retract form.dirty
      const dirty = result.state.facts.find(f => f.tag === 'form.dirty');
      expect(dirty).toBeUndefined();
    });

    it('should support custom form names', () => {
      const mod = formRules({ formName: 'signup' });
      expect(mod.rules![0].id).toContain('signup');
    });
  });

  // ─── Navigation Rules ─────────────────────────────────────────────────

  describe('navigationRules', () => {
    it('should create navigation handler rule', () => {
      const mod = navigationRules();
      expect(mod.rules!.some(r => r.id === 'factory/navigation.handle')).toBe(true);
    });

    it('should allow navigation when no guards active', () => {
      const mod = navigationRules();
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { dirty: false, authenticated: true },
        registry,
      });

      const result = engine.step([{
        tag: 'navigation.request',
        payload: { target: '/settings' },
      }]);

      expect(result.state.facts.some(f => f.tag === 'navigation.allowed')).toBe(true);
    });

    it('should block navigation when dirty and dirtyGuard enabled', () => {
      const mod = navigationRules({ dirtyGuard: true });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { dirty: true, authenticated: true },
        registry,
      });

      const result = engine.step([{
        tag: 'navigation.request',
        payload: { target: '/other' },
      }]);

      const blocked = result.state.facts.find(f => f.tag === 'navigation.blocked');
      expect(blocked).toBeDefined();
      expect((blocked!.payload as { reasons: string[] }).reasons).toContain('Unsaved changes will be lost');
    });

    it('should block navigation when not authenticated and authRequired', () => {
      const mod = navigationRules({ authRequired: true });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { dirty: false, authenticated: false },
        registry,
      });

      const result = engine.step([{
        tag: 'navigation.request',
        payload: { target: '/admin' },
      }]);

      const blocked = result.state.facts.find(f => f.tag === 'navigation.blocked');
      expect(blocked).toBeDefined();
      expect((blocked!.payload as { reasons: string[] }).reasons).toContain('Authentication required');
    });

    it('should add dirty guard constraint', () => {
      const mod = navigationRules({ dirtyGuard: true });
      expect(mod.constraints!.some(c => c.id === 'factory/navigation.dirty-guard')).toBe(true);
    });
  });

  // ─── Data Rules ─────────────────────────────────────────────────────────

  describe('dataRules', () => {
    it('should create optimistic update rule', () => {
      const mod = dataRules({ optimisticUpdate: true });
      expect(mod.rules!.some(r => r.id.includes('optimistic-update'))).toBe(true);
    });

    it('should emit optimistic update on mutate', () => {
      const mod = dataRules({ optimisticUpdate: true });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {},
        registry,
      });

      const result = engine.step([{
        tag: 'data.mutate',
        payload: { id: 'item-1', data: { name: 'Updated' } },
      }]);

      const optimistic = result.state.facts.find(f => f.tag === 'data.optimistic');
      expect(optimistic).toBeDefined();
      expect((optimistic!.payload as { pending: boolean }).pending).toBe(true);
    });

    it('should create rollback rule', () => {
      const mod = dataRules({ rollbackOnError: true });
      expect(mod.rules!.some(r => r.id.includes('rollback'))).toBe(true);
    });

    it('should create cache invalidation rule', () => {
      const mod = dataRules({ cacheInvalidation: true });
      expect(mod.rules!.some(r => r.id.includes('cache-invalidate'))).toBe(true);
    });

    it('should emit cache invalidation on confirmation', () => {
      const mod = dataRules({ cacheInvalidation: true });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {},
        registry,
      });

      const result = engine.step([{
        tag: 'data.confirmed',
        payload: { id: 'item-1' },
      }]);

      expect(result.state.facts.some(f => f.tag === 'data.cache-invalidate')).toBe(true);
    });

    it('should always include integrity constraint', () => {
      const mod = dataRules();
      expect(mod.constraints!.some(c => c.id.includes('integrity'))).toBe(true);
    });

    it('should support custom entity names', () => {
      const mod = dataRules({ entityName: 'products', optimisticUpdate: true });
      expect(mod.rules![0].id).toContain('products');
    });

    it('should include contracts on all rules and constraints', () => {
      const mod = dataRules({
        optimisticUpdate: true,
        rollbackOnError: true,
        cacheInvalidation: true,
      });
      for (const rule of mod.rules ?? []) {
        expect(rule.contract).toBeDefined();
        expect(rule.contract!.invariants.length).toBeGreaterThan(0);
      }
      for (const constraint of mod.constraints ?? []) {
        expect(constraint.contract).toBeDefined();
      }
    });
  });

  // ─── Integration ──────────────────────────────────────────────────────

  describe('integration', () => {
    it('should register multiple factory modules in one registry', () => {
      const registry = new PraxisRegistry({ compliance: { enabled: false } });

      registry.registerModule(inputRules({ sanitize: ['xss'], required: true }));
      registry.registerModule(toastRules({ requireDiff: true, deduplicate: true }));
      registry.registerModule(formRules({ validateOnBlur: true, submitGate: true }));
      registry.registerModule(navigationRules({ dirtyGuard: true, authRequired: true }));
      registry.registerModule(dataRules({ optimisticUpdate: true, rollbackOnError: true }));

      const ruleIds = registry.getRuleIds();
      expect(ruleIds.length).toBeGreaterThanOrEqual(5);

      const constraintIds = registry.getConstraintIds();
      expect(constraintIds.length).toBeGreaterThanOrEqual(3);

      // All should have contracts
      const rules = registry.getAllRules();
      for (const rule of rules) {
        expect(rule.contract).toBeDefined();
      }
    });
  });
});
