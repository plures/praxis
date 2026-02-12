/**
 * Decision Ledger - Reverse Generator Tests
 *
 * Tests for reverse contract generation from existing code.
 */

import { describe, it, expect } from 'vitest';
import { generateContractFromRule } from '../decision-ledger/reverse-generator.js';
import type { RuleDescriptor } from '../core/rules.js';

describe('Reverse Contract Generator', () => {
  describe('generateContractFromRule', () => {
    it('should generate contract with default values when no files provided', async () => {
      const rule: RuleDescriptor = {
        id: 'test.rule',
        description: 'Test rule description',
        impl: () => [],
      };

      const result = await generateContractFromRule(rule, {
        aiProvider: 'none',
      });

      expect(result.contract.ruleId).toBe('test.rule');
      expect(result.contract.behavior).toContain('Test rule description');
      expect(result.contract.examples.length).toBeGreaterThan(0);
      expect(result.contract.invariants.length).toBeGreaterThan(0);
      expect(result.method).toBe('heuristic');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should generate assumptions when requested', async () => {
      const rule: RuleDescriptor = {
        id: 'auth.login',
        description: 'Process login events',
        impl: () => [],
      };

      const result = await generateContractFromRule(rule, {
        aiProvider: 'none',
        includeAssumptions: true,
      });

      expect(result.contract.assumptions).toBeDefined();
      expect(result.contract.assumptions!.length).toBeGreaterThan(0);
      
      const assumption = result.contract.assumptions![0];
      expect(assumption.id).toBeDefined();
      expect(assumption.statement).toBeDefined();
      expect(assumption.confidence).toBeGreaterThanOrEqual(0);
      expect(assumption.confidence).toBeLessThanOrEqual(1);
      expect(assumption.status).toBe('active');
    });

    it('should not generate assumptions when not requested', async () => {
      const rule: RuleDescriptor = {
        id: 'test.rule',
        description: 'Test rule',
        impl: () => [],
      };

      const result = await generateContractFromRule(rule, {
        aiProvider: 'none',
        includeAssumptions: false,
      });

      expect(result.contract.assumptions).toBeDefined();
      expect(result.contract.assumptions!.length).toBe(0);
    });

    it('should increase confidence when artifacts are provided', async () => {
      const rule: RuleDescriptor = {
        id: 'test.rule',
        description: 'Test rule',
        impl: () => [],
      };

      // Baseline: no artifacts
      const resultBaseline = await generateContractFromRule(rule, {
        aiProvider: 'none',
      });

      // With test files (should increase confidence)
      const resultWithTests = await generateContractFromRule(rule, {
        aiProvider: 'none',
        testFiles: ['/path/to/test1.ts', '/path/to/test2.ts'],
      });

      // With spec files (should increase confidence)
      const resultWithSpecs = await generateContractFromRule(rule, {
        aiProvider: 'none',
        specFiles: ['/path/to/spec.tla'],
      });

      // Confidence should increase with more artifacts
      expect(resultWithTests.confidence).toBeGreaterThan(resultBaseline.confidence);
      expect(resultWithSpecs.confidence).toBeGreaterThan(resultBaseline.confidence);
    });

    it('should include warnings for missing information', async () => {
      const rule: RuleDescriptor = {
        id: 'test.rule',
        description: 'Test rule',
        impl: () => [],
      };

      const result = await generateContractFromRule(rule, {
        aiProvider: 'none',
        generateExamples: true,
      });

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      
      // Should warn about missing test files
      const hasTestWarning = result.warnings.some((w) => 
        w.includes('test') || w.includes('example')
      );
      expect(hasTestWarning).toBe(true);
    });

    it('should use rule description as behavior if no other source', async () => {
      const rule: RuleDescriptor = {
        id: 'custom.rule',
        description: 'Custom rule that does something specific',
        impl: () => [],
      };

      const result = await generateContractFromRule(rule, {
        aiProvider: 'none',
      });

      expect(result.contract.behavior).toContain('Custom rule that does something specific');
    });

    it('should generate default examples when no tests provided', async () => {
      const rule: RuleDescriptor = {
        id: 'test.rule',
        description: 'Test rule',
        impl: () => [],
      };

      const result = await generateContractFromRule(rule, {
        aiProvider: 'none',
        generateExamples: true,
      });

      expect(result.contract.examples.length).toBeGreaterThan(0);
      
      const example = result.contract.examples[0];
      expect(example.given).toBeDefined();
      expect(example.when).toBeDefined();
      expect(example.then).toBeDefined();
    });

    it('should handle constraint descriptors', async () => {
      const constraint = {
        id: 'test.constraint',
        description: 'Test constraint',
        impl: () => true,
      };

      const result = await generateContractFromRule(constraint, {
        aiProvider: 'none',
      });

      expect(result.contract.ruleId).toBe('test.constraint');
      expect(result.contract.behavior).toContain('Test constraint');
    });

    it('should cap confidence at reasonable level for heuristic method', async () => {
      const rule: RuleDescriptor = {
        id: 'test.rule',
        description: 'Test rule',
        impl: () => [],
      };

      const result = await generateContractFromRule(rule, {
        aiProvider: 'none',
        sourceFile: '/path/to/rule.ts',
        testFiles: ['/path/to/test1.ts', '/path/to/test2.ts'],
        specFiles: ['/path/to/spec.tla'],
      });

      // Heuristic should not claim perfect confidence
      expect(result.confidence).toBeLessThan(1.0);
    });
  });
});
