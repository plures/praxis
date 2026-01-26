/**
 * Decision Ledger - Tests
 *
 * Tests for contract definition, validation, and ledger operations.
 *
 * These tests are derived from the behavior ledger examples and assumptions.
 */

import { describe, it, expect } from 'vitest';
import { PraxisRegistry } from '../core/rules.js';
import { defineRule } from '../dsl/index.js';
import {
  defineContract,
  getContract,
  isContract,
  validateContracts,
  formatValidationReport,
  ContractMissing,
  AcknowledgeContractGap,
  BehaviorLedger,
  createBehaviorLedger,
} from '../decision-ledger/index.js';

describe('Decision Ledger', () => {
  describe('Contract Definition', () => {
    // Example 1 from behavior ledger: Defining a Contract for a Rule
    it('should define a contract with behavior, examples, and invariants', () => {
      const loginContract = defineContract({
        ruleId: 'auth.login',
        behavior: 'Process login events and create user session facts',
        examples: [
          {
            given: 'User provides valid credentials',
            when: 'LOGIN event is received',
            then: 'UserSessionCreated fact is emitted',
          },
        ],
        invariants: ['Session must have unique ID', 'Session must have timestamp'],
        assumptions: [
          {
            id: 'assume-unique-username',
            statement: 'Usernames are unique across the system',
            confidence: 0.9,
            justification: 'Standard practice in authentication systems',
            impacts: ['spec', 'tests'],
            status: 'active',
          },
        ],
        references: [{ type: 'doc', url: 'https://docs.example.com/auth' }],
      });

      expect(loginContract.ruleId).toBe('auth.login');
      expect(loginContract.behavior).toBe('Process login events and create user session facts');
      expect(loginContract.examples).toHaveLength(1);
      expect(loginContract.examples[0].given).toBe('User provides valid credentials');
      expect(loginContract.invariants).toHaveLength(2);
      expect(loginContract.assumptions).toHaveLength(1);
      expect(loginContract.assumptions![0].id).toBe('assume-unique-username');
      expect(loginContract.references).toHaveLength(1);
    });

    it('should throw error if contract has no examples', () => {
      expect(() => {
        defineContract({
          ruleId: 'test.rule',
          behavior: 'Test behavior',
          examples: [],
          invariants: [],
        });
      }).toThrow('Contract must have at least one example');
    });

    it('should validate contract structure with type guard', () => {
      const validContract = {
        ruleId: 'test.rule',
        behavior: 'Test behavior',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: ['test'],
      };

      expect(isContract(validContract)).toBe(true);

      const invalidContract = {
        ruleId: 'test.rule',
        behavior: 'Test behavior',
        examples: [],
        invariants: [],
      };

      expect(isContract(invalidContract)).toBe(false);
    });

    it('should extract contract from rule metadata', () => {
      const contract = defineContract({
        ruleId: 'test.rule',
        behavior: 'Test behavior',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
      });

      const rule = defineRule({
        id: 'test.rule',
        description: 'Test rule',
        impl: () => [],
        meta: { contract },
      });

      const extracted = getContract(rule.meta);
      expect(extracted).toBeDefined();
      expect(extracted?.ruleId).toBe('test.rule');
    });
  });

  describe('Contract Validation', () => {
    // Example 2 from behavior ledger: Build-time Validation
    it('should validate registry and produce complete/incomplete report', () => {
      const registry = new PraxisRegistry();

      // Rule with complete contract
      const completeContract = defineContract({
        ruleId: 'auth.login',
        behavior: 'Process login events',
        examples: [{ given: 'valid creds', when: 'LOGIN', then: 'session created' }],
        invariants: ['unique session ID'],
      });

      registry.registerRule(
        defineRule({
          id: 'auth.login',
          description: 'Login rule',
          impl: () => [],
          meta: { contract: completeContract },
        })
      );

      // Rule without contract
      registry.registerRule(
        defineRule({
          id: 'cart.addItem',
          description: 'Add item to cart',
          impl: () => [],
        })
      );

      const report = validateContracts(registry);

      expect(report.total).toBe(2);
      expect(report.complete).toHaveLength(1);
      expect(report.complete[0].ruleId).toBe('auth.login');
      expect(report.missing).toHaveLength(1);
      expect(report.missing).toContain('cart.addItem');
      // Rules without contracts only appear in missing array, not incomplete
      expect(report.incomplete).toHaveLength(0);
    });

    it('should validate contract completeness', () => {
      const registry = new PraxisRegistry();

      // Contract missing behavior
      const incompleteContract = defineContract({
        ruleId: 'test.rule',
        behavior: '', // Empty behavior
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
      });

      registry.registerRule(
        defineRule({
          id: 'test.rule',
          description: 'Test',
          impl: () => [],
          meta: { contract: incompleteContract },
        })
      );

      const report = validateContracts(registry, {
        requiredFields: ['behavior', 'examples'],
      });

      expect(report.incomplete).toHaveLength(1);
      expect(report.incomplete[0].missing).toContain('behavior');
    });

    it('should format validation report as text', () => {
      const registry = new PraxisRegistry();

      registry.registerRule(
        defineRule({
          id: 'test.rule',
          description: 'Test',
          impl: () => [],
          meta: {
            contract: defineContract({
              ruleId: 'test.rule',
              behavior: 'Test',
              examples: [{ given: 'a', when: 'b', then: 'c' }],
              invariants: [],
            }),
          },
        })
      );

      const report = validateContracts(registry);
      const formatted = formatValidationReport(report);

      expect(formatted).toContain('Contract Validation Report');
      expect(formatted).toContain('✓ Complete Contracts:');
      expect(formatted).toContain('test.rule');
    });

    it('should support strict validation mode', () => {
      const registry = new PraxisRegistry();

      registry.registerRule(
        defineRule({
          id: 'missing.contract',
          description: 'No contract',
          impl: () => [],
        })
      );

      const report = validateContracts(registry, { strict: true });

      // Rules without contracts only appear in missing array, not incomplete
      expect(report.missing).toHaveLength(1);
      expect(report.missing).toContain('missing.contract');
      expect(report.incomplete).toHaveLength(0);
    });
  });

  describe('Facts and Events', () => {
    // Example 3 from behavior ledger: Runtime Validation
    it('should create ContractMissing fact', () => {
      const fact = ContractMissing.create({
        ruleId: 'test.rule',
        missing: ['behavior', 'examples'],
        severity: 'warning',
      });

      expect(fact.tag).toBe('ContractMissing');
      expect(fact.payload.ruleId).toBe('test.rule');
      expect(fact.payload.missing).toContain('behavior');
      expect(fact.payload.severity).toBe('warning');
    });

    // Example 4 from behavior ledger: Contract Gap Acknowledgment
    it('should create AcknowledgeContractGap event', () => {
      const event = AcknowledgeContractGap.create({
        ruleId: 'legacy.process',
        missing: ['spec', 'tests'],
        justification: 'Legacy rule to be deprecated in v2.0',
        expiresAt: '2025-12-31',
      });

      expect(event.tag).toBe('ACKNOWLEDGE_CONTRACT_GAP');
      expect(event.payload.ruleId).toBe('legacy.process');
      expect(event.payload.justification).toBe('Legacy rule to be deprecated in v2.0');
      expect(event.payload.expiresAt).toBe('2025-12-31');
    });

    it('should use type guards for facts and events', () => {
      const fact = ContractMissing.create({
        ruleId: 'test',
        missing: ['contract'],
        severity: 'warning',
      });

      expect(ContractMissing.is(fact)).toBe(true);

      const event = AcknowledgeContractGap.create({
        ruleId: 'test',
        missing: ['contract'],
        justification: 'test',
      });

      expect(AcknowledgeContractGap.is(event)).toBe(true);
    });
  });

  describe('Behavior Ledger', () => {
    // Invariant: Ledger Append-Only
    it('should maintain append-only ledger', () => {
      const ledger = createBehaviorLedger();

      const contract1 = defineContract({
        ruleId: 'test.rule',
        behavior: 'Version 1',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
      });

      ledger.append({
        id: 'entry-1',
        timestamp: new Date().toISOString(),
        status: 'active',
        author: 'system',
        contract: contract1,
      });

      expect(ledger.getAllEntries()).toHaveLength(1);

      // Cannot append entry with same ID
      expect(() => {
        ledger.append({
          id: 'entry-1',
          timestamp: new Date().toISOString(),
          status: 'active',
          author: 'system',
          contract: contract1,
        });
      }).toThrow('already exists');
    });

    // Invariant: Ledger Unique IDs
    it('should enforce unique entry IDs', () => {
      const ledger = createBehaviorLedger();

      const contract = defineContract({
        ruleId: 'test',
        behavior: 'test',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
      });

      ledger.append({
        id: 'unique-1',
        timestamp: new Date().toISOString(),
        status: 'active',
        author: 'system',
        contract,
      });

      expect(() => {
        ledger.append({
          id: 'unique-1',
          timestamp: new Date().toISOString(),
          status: 'active',
          author: 'system',
          contract,
        });
      }).toThrow();
    });

    it('should supersede previous entries', () => {
      const ledger = createBehaviorLedger();

      const contract1 = defineContract({
        ruleId: 'test.rule',
        behavior: 'Version 1',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
        version: '1.0.0',
      });

      ledger.append({
        id: 'entry-1',
        timestamp: '2025-01-01T00:00:00Z',
        status: 'active',
        author: 'system',
        contract: contract1,
      });

      const contract2 = defineContract({
        ruleId: 'test.rule',
        behavior: 'Version 2',
        examples: [{ given: 'x', when: 'y', then: 'z' }],
        invariants: [],
        version: '2.0.0',
      });

      ledger.append({
        id: 'entry-2',
        timestamp: '2025-01-02T00:00:00Z',
        status: 'active',
        author: 'system',
        contract: contract2,
        supersedes: 'entry-1',
      });

      const latest = ledger.getLatestEntry('test.rule');
      expect(latest?.id).toBe('entry-2');
      expect(latest?.contract.version).toBe('2.0.0');

      const entry1 = ledger.getEntry('entry-1');
      expect(entry1?.status).toBe('superseded');
    });

    it('should track assumptions', () => {
      const ledger = createBehaviorLedger();

      const contract = defineContract({
        ruleId: 'test.rule',
        behavior: 'Test',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
        assumptions: [
          {
            id: 'test-assumption',
            statement: 'Test assumption',
            confidence: 0.8,
            justification: 'For testing',
            impacts: ['tests'],
            status: 'active',
          },
        ],
      });

      ledger.append({
        id: 'entry-1',
        timestamp: new Date().toISOString(),
        status: 'active',
        author: 'system',
        contract,
      });

      const assumptions = ledger.getActiveAssumptions();
      expect(assumptions.size).toBe(1);
      expect(assumptions.get('test-assumption')?.statement).toBe('Test assumption');
    });

    it('should export and import ledger as JSON', () => {
      const ledger1 = createBehaviorLedger();

      const contract = defineContract({
        ruleId: 'test.rule',
        behavior: 'Test',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
      });

      ledger1.append({
        id: 'entry-1',
        timestamp: new Date().toISOString(),
        status: 'active',
        author: 'system',
        contract,
      });

      const json = ledger1.toJSON();
      const ledger2 = BehaviorLedger.fromJSON(json);

      expect(ledger2.getAllEntries()).toHaveLength(1);
      expect(ledger2.getEntry('entry-1')?.contract.ruleId).toBe('test.rule');
    });

    it('should provide ledger statistics', () => {
      const ledger = createBehaviorLedger();

      const contract1 = defineContract({
        ruleId: 'rule1',
        behavior: 'Rule 1',
        examples: [{ given: 'a', when: 'b', then: 'c' }],
        invariants: [],
      });

      const contract2 = defineContract({
        ruleId: 'rule2',
        behavior: 'Rule 2',
        examples: [{ given: 'x', when: 'y', then: 'z' }],
        invariants: [],
      });

      ledger.append({
        id: 'entry-1',
        timestamp: new Date().toISOString(),
        status: 'active',
        author: 'system',
        contract: contract1,
      });

      ledger.append({
        id: 'entry-2',
        timestamp: new Date().toISOString(),
        status: 'active',
        author: 'system',
        contract: contract2,
      });

      const stats = ledger.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.activeEntries).toBe(2);
      expect(stats.uniqueRules).toBe(2);
    });
  });
});
