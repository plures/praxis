/**
 * Tests for Project Logic
 */

import { describe, it, expect } from 'vitest';
import {
  defineGate,
  semverContract,
  commitFromState,
  branchRules,
  lintGate,
  formatGate,
  expectationGate,
} from '../project/project.js';
import { PraxisRegistry } from '../core/rules.js';
import { LogicEngine } from '../core/engine.js';
import type { PraxisDiff } from '../project/types.js';

// ─── Helper ─────────────────────────────────────────────────────────────────

const emptyDiff: PraxisDiff = {
  rulesAdded: [],
  rulesRemoved: [],
  rulesModified: [],
  contractsAdded: [],
  contractsRemoved: [],
  expectationsAdded: [],
  expectationsRemoved: [],
  gateChanges: [],
};

// ─── defineGate ─────────────────────────────────────────────────────────────

describe('Project Logic', () => {
  describe('defineGate', () => {
    it('should create a gate module with rule and constraint', () => {
      const mod = defineGate('deploy', {
        expects: ['tests-pass', 'lint-clean'],
        onSatisfied: 'deploy-allowed',
        onViolation: 'deploy-blocked',
      });

      expect(mod.rules).toHaveLength(1);
      expect(mod.constraints).toHaveLength(1);
      expect(mod.rules![0].id).toBe('gate/deploy');
    });

    it('should open gate when all expectations satisfied', () => {
      const mod = defineGate('deploy', {
        expects: ['tests-pass', 'lint-clean'],
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {
          expectations: { 'tests-pass': true, 'lint-clean': true },
        },
        registry,
      });

      const result = engine.step([{ tag: 'gate.check', payload: {} }]);
      const status = result.state.facts.find(f => f.tag === 'gate.deploy.status');
      expect(status).toBeDefined();
      expect((status!.payload as { status: string }).status).toBe('open');
    });

    it('should block gate when expectations not met', () => {
      const mod = defineGate('deploy', {
        expects: ['tests-pass', 'lint-clean'],
        onViolation: 'deploy-blocked',
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: {
          expectations: { 'tests-pass': true, 'lint-clean': false },
        },
        registry,
      });

      const result = engine.step([{ tag: 'gate.check', payload: {} }]);
      const status = result.state.facts.find(f => f.tag === 'gate.deploy.status');
      expect((status!.payload as { status: string }).status).toBe('blocked');
      expect((status!.payload as { unsatisfied: string[] }).unsatisfied).toContain('lint-clean');
    });

    it('should emit action fact on satisfied', () => {
      const mod = defineGate('deploy', {
        expects: ['ready'],
        onSatisfied: 'go-deploy',
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { expectations: { ready: true } },
        registry,
      });

      const result = engine.step([{ tag: 'gate.deploy.check', payload: {} }]);
      const action = result.state.facts.find(f => f.tag === 'gate.deploy.action');
      expect(action).toBeDefined();
      expect((action!.payload as { action: string }).action).toBe('go-deploy');
    });

    it('should emit action fact on violation', () => {
      const mod = defineGate('deploy', {
        expects: ['ready'],
        onViolation: 'block-deploy',
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({
        initialContext: { expectations: { ready: false } },
        registry,
      });

      const result = engine.step([{ tag: 'gate.check', payload: {} }]);
      const action = result.state.facts.find(f => f.tag === 'gate.deploy.action');
      expect((action!.payload as { action: string }).action).toBe('block-deploy');
    });

    it('should include contract with invariants', () => {
      const mod = defineGate('test', { expects: ['a', 'b'] });
      expect(mod.rules![0].contract).toBeDefined();
      expect(mod.rules![0].contract!.invariants.length).toBeGreaterThan(0);
      expect(mod.constraints![0].contract).toBeDefined();
    });
  });

  // ─── Predefined Gates ──────────────────────────────────────────────────

  describe('predefined gates', () => {
    it('lintGate creates a lint gate', () => {
      const mod = lintGate();
      expect(mod.rules![0].id).toBe('gate/lint');
    });

    it('formatGate creates a format gate', () => {
      const mod = formatGate();
      expect(mod.rules![0].id).toBe('gate/format');
    });

    it('expectationGate creates an expectations gate', () => {
      const mod = expectationGate();
      expect(mod.rules![0].id).toBe('gate/expectations');
    });

    it('predefined gates support additionalExpects', () => {
      const mod = lintGate({ additionalExpects: ['custom-check'] });
      expect(mod.rules![0].description).toContain('custom-check');
    });
  });

  // ─── semverContract ─────────────────────────────────────────────────────

  describe('semverContract', () => {
    it('should create a semver check rule', () => {
      const mod = semverContract({
        sources: ['package.json', 'version.ts'],
        invariants: ['All must match'],
      });
      expect(mod.rules![0].id).toBe('project/semver-check');
    });

    it('should emit consistent when versions match', () => {
      const mod = semverContract({
        sources: ['package.json', 'version.ts'],
        invariants: [],
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({ initialContext: {}, registry });

      const result = engine.step([{
        tag: 'project.version-check',
        payload: {
          versions: { 'package.json': '1.2.3', 'version.ts': '1.2.3' },
        },
      }]);

      const consistent = result.state.facts.find(f => f.tag === 'semver.consistent');
      expect(consistent).toBeDefined();
      expect((consistent!.payload as { version: string }).version).toBe('1.2.3');
    });

    it('should emit inconsistent when versions differ', () => {
      const mod = semverContract({
        sources: ['package.json', 'version.ts'],
        invariants: [],
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);

      const engine = new LogicEngine({ initialContext: {}, registry });

      const result = engine.step([{
        tag: 'project.version-check',
        payload: {
          versions: { 'package.json': '1.2.3', 'version.ts': '1.2.0' },
        },
      }]);

      const inconsistent = result.state.facts.find(f => f.tag === 'semver.inconsistent');
      expect(inconsistent).toBeDefined();
      expect((inconsistent!.payload as { consistent: boolean }).consistent).toBe(false);
    });
  });

  // ─── commitFromState ──────────────────────────────────────────────────

  describe('commitFromState', () => {
    it('should generate feat message for added rules', () => {
      const msg = commitFromState({
        ...emptyDiff,
        rulesAdded: ['auth/login', 'auth/logout'],
      });

      expect(msg).toContain('feat(auth)');
      expect(msg).toContain('auth/login');
      expect(msg).toContain('auth/logout');
    });

    it('should generate refactor message for removed rules', () => {
      const msg = commitFromState({
        ...emptyDiff,
        rulesRemoved: ['old/deprecated-rule'],
      });

      expect(msg).toContain('refactor');
      expect(msg).toContain('remove');
    });

    it('should generate refactor message for modified rules', () => {
      const msg = commitFromState({
        ...emptyDiff,
        rulesModified: ['auth/login'],
      });

      expect(msg).toContain('refactor(auth)');
      expect(msg).toContain('update');
    });

    it('should generate feat message for contract additions', () => {
      const msg = commitFromState({
        ...emptyDiff,
        contractsAdded: ['auth/login'],
      });

      expect(msg).toContain('feat(contracts)');
    });

    it('should generate feat message for expectation additions', () => {
      const msg = commitFromState({
        ...emptyDiff,
        expectationsAdded: ['toast-behavior'],
      });

      expect(msg).toContain('feat(expectations)');
    });

    it('should handle gate changes', () => {
      const msg = commitFromState({
        ...emptyDiff,
        gateChanges: [{ gate: 'deploy', from: 'blocked', to: 'open' }],
      });

      expect(msg).toContain('gate');
      expect(msg).toContain('deploy');
    });

    it('should include body with details', () => {
      const msg = commitFromState({
        ...emptyDiff,
        rulesAdded: ['ui/toast'],
        contractsAdded: ['ui/toast'],
      });

      expect(msg).toContain('\n\n');
      expect(msg).toContain('Rules added: ui/toast');
      expect(msg).toContain('Contracts added: ui/toast');
    });

    it('should truncate long rule lists', () => {
      const msg = commitFromState({
        ...emptyDiff,
        rulesAdded: ['a/1', 'a/2', 'a/3', 'a/4', 'a/5'],
      });

      expect(msg).toContain('+3 more');
    });

    it('should handle empty diff', () => {
      const msg = commitFromState(emptyDiff);
      expect(msg).toContain('chore');
    });

    it('should infer scope from common prefix', () => {
      const msg = commitFromState({
        ...emptyDiff,
        rulesAdded: ['ui/toast', 'ui/modal'],
      });
      expect(msg).toContain('feat(ui)');
    });

    it('should use "rules" scope for mixed prefixes', () => {
      const msg = commitFromState({
        ...emptyDiff,
        rulesAdded: ['ui/toast', 'auth/login'],
      });
      expect(msg).toContain('feat(rules)');
    });
  });

  // ─── branchRules ──────────────────────────────────────────────────────

  describe('branchRules', () => {
    it('should create a branch check rule', () => {
      const mod = branchRules({
        naming: 'feat/{name}',
        mergeConditions: ['tests-pass'],
      });
      expect(mod.rules![0].id).toBe('project/branch-check');
    });

    it('should validate correct branch name', () => {
      const mod = branchRules({
        naming: 'feat/{name}',
        mergeConditions: ['tests-pass'],
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);
      const engine = new LogicEngine({ initialContext: {}, registry });

      const result = engine.step([{
        tag: 'project.branch-check',
        payload: {
          branch: 'feat/my-feature',
          conditions: { 'tests-pass': true },
        },
      }]);

      const valid = result.state.facts.find(f => f.tag === 'branch.valid');
      expect(valid).toBeDefined();
      expect((valid!.payload as { mergeReady: boolean }).mergeReady).toBe(true);
    });

    it('should reject invalid branch name', () => {
      const mod = branchRules({
        naming: 'feat/{name}',
        mergeConditions: ['tests-pass'],
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);
      const engine = new LogicEngine({ initialContext: {}, registry });

      const result = engine.step([{
        tag: 'project.branch-check',
        payload: {
          branch: 'random-branch',
          conditions: { 'tests-pass': true },
        },
      }]);

      const invalid = result.state.facts.find(f => f.tag === 'branch.invalid');
      expect(invalid).toBeDefined();
      expect((invalid!.payload as { reasons: string[] }).reasons[0]).toContain('pattern');
    });

    it('should reject when merge conditions not met', () => {
      const mod = branchRules({
        naming: 'feat/{name}',
        mergeConditions: ['tests-pass', 'review-approved'],
      });
      const registry = new PraxisRegistry({ compliance: { enabled: false } });
      registry.registerModule(mod);
      const engine = new LogicEngine({ initialContext: {}, registry });

      const result = engine.step([{
        tag: 'project.branch-check',
        payload: {
          branch: 'feat/my-feature',
          conditions: { 'tests-pass': true, 'review-approved': false },
        },
      }]);

      const invalid = result.state.facts.find(f => f.tag === 'branch.invalid');
      expect(invalid).toBeDefined();
      expect((invalid!.payload as { reasons: string[] }).reasons[0]).toContain('review-approved');
    });
  });
});
