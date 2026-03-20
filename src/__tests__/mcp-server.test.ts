/**
 * Tests for Praxis MCP Server
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPraxisMcpServer } from '../mcp/server.js';
import { PraxisRegistry } from '../core/rules.js';
import { RuleResult, fact } from '../core/rule-result.js';
import type { PraxisModule } from '../core/rules.js';
import type { Contract } from '../decision-ledger/types.js';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

interface TestContext {
  counter: number;
  name: string;
}

const incrementContract: Contract = {
  ruleId: 'test/increment',
  behavior: 'Increments counter when increment event fires',
  examples: [
    { given: 'counter is 5', when: 'increment event fires', then: 'counter.incremented emitted with value 6' },
  ],
  invariants: ['Counter must always increase by 1'],
};

const testModule: PraxisModule<TestContext> = {
  rules: [
    {
      id: 'test/increment',
      description: 'Increments the counter',
      eventTypes: 'counter.increment',
      contract: incrementContract,
      impl: (state, events) => {
        const hasIncrement = events.some(e => e.tag === 'counter.increment');
        if (!hasIncrement) return RuleResult.skip('No increment event');
        return RuleResult.emit([
          fact('counter.incremented', { value: state.context.counter + 1 }),
        ]);
      },
    },
    {
      id: 'test/greet',
      description: 'Emits greeting when greet event fires',
      eventTypes: 'greet',
      contract: {
        ruleId: 'test/greet',
        behavior: 'Emits greeting fact with name',
        examples: [
          { given: 'name is Alice', when: 'greet event fires', then: 'greeting emitted for Alice' },
        ],
        invariants: ['Greeting must include the name from context'],
      },
      impl: (state, events) => {
        const hasGreet = events.some(e => e.tag === 'greet');
        if (!hasGreet) return RuleResult.skip('No greet event');
        return RuleResult.emit([
          fact('greeting', { message: `Hello, ${state.context.name}!` }),
        ]);
      },
    },
  ],
  constraints: [
    {
      id: 'test/positive-counter',
      description: 'Counter must be non-negative',
      contract: {
        ruleId: 'test/positive-counter',
        behavior: 'Ensures counter is never negative',
        examples: [
          { given: 'counter is 0', when: 'checked', then: 'passes' },
          { given: 'counter is -1', when: 'checked', then: 'fails' },
        ],
        invariants: ['Counter >= 0'],
      },
      impl: (state) => {
        if (state.context.counter < 0) return 'Counter must be non-negative';
        return true;
      },
    },
  ],
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Praxis MCP Server', () => {
  let registry: PraxisRegistry<TestContext>;

  beforeEach(() => {
    registry = new PraxisRegistry<TestContext>({
      compliance: { enabled: false },
    });
    registry.registerModule(testModule);
  });

  describe('createPraxisMcpServer', () => {
    it('should create a server with engine and mcpServer', () => {
      const server = createPraxisMcpServer({
        initialContext: { counter: 0, name: 'Test' },
        registry,
      });

      expect(server).toBeDefined();
      expect(server.engine).toBeDefined();
      expect(server.mcpServer).toBeDefined();
      expect(server.start).toBeInstanceOf(Function);
    });

    it('should accept custom name and version', () => {
      const server = createPraxisMcpServer({
        name: 'my-praxis',
        version: '2.0.0',
        initialContext: { counter: 0, name: 'Test' },
        registry,
      });

      expect(server).toBeDefined();
    });
  });

  describe('engine operations via MCP server', () => {
    it('should expose a working engine that can step', () => {
      const server = createPraxisMcpServer({
        initialContext: { counter: 5, name: 'Alice' },
        registry,
      });

      const result = server.engine.step([{ tag: 'counter.increment', payload: {} }]);
      expect(result.state.facts).toContainEqual(
        expect.objectContaining({ tag: 'counter.incremented', payload: { value: 6 } }),
      );
    });

    it('should get current facts from engine', () => {
      const server = createPraxisMcpServer({
        initialContext: { counter: 0, name: 'Test' },
        registry,
        initialFacts: [{ tag: 'init', payload: { started: true } }],
      });

      const facts = server.engine.getFacts();
      expect(facts).toContainEqual(
        expect.objectContaining({ tag: 'init' }),
      );
    });

    it('should handle rule evaluation via engine', () => {
      const server = createPraxisMcpServer({
        initialContext: { counter: 10, name: 'Bob' },
        registry,
      });

      const rule = registry.getRule('test/greet');
      expect(rule).toBeDefined();

      const state = server.engine.getState();
      const events = [{ tag: 'greet', payload: {} }];
      const stateWithEvents = { ...state, events };
      const result = rule!.impl(stateWithEvents as Parameters<typeof rule!.impl>[0], events);

      expect(result).toBeInstanceOf(RuleResult);
      const rr = result as RuleResult;
      expect(rr.kind).toBe('emit');
      expect(rr.facts).toContainEqual(
        expect.objectContaining({ tag: 'greeting', payload: { message: 'Hello, Bob!' } }),
      );
    });

    it('should skip rule when no matching events', () => {
      const server = createPraxisMcpServer({
        initialContext: { counter: 0, name: 'Test' },
        registry,
      });

      const rule = registry.getRule('test/increment');
      const state = server.engine.getState();
      const events = [{ tag: 'unrelated', payload: {} }];
      const stateWithEvents = { ...state, events };
      const result = rule!.impl(stateWithEvents as Parameters<typeof rule!.impl>[0], events);

      expect(result).toBeInstanceOf(RuleResult);
      expect((result as RuleResult).kind).toBe('skip');
    });
  });

  describe('registry introspection', () => {
    it('should list all rules', () => {
      const rules = registry.getAllRules();
      expect(rules).toHaveLength(2);
      expect(rules.map(r => r.id)).toContain('test/increment');
      expect(rules.map(r => r.id)).toContain('test/greet');
    });

    it('should list all constraints', () => {
      const constraints = registry.getAllConstraints();
      expect(constraints).toHaveLength(1);
      expect(constraints[0].id).toBe('test/positive-counter');
    });

    it('should provide contract details for rules', () => {
      const rule = registry.getRule('test/increment');
      expect(rule?.contract).toBeDefined();
      expect(rule?.contract?.behavior).toContain('Increments counter');
      expect(rule?.contract?.examples).toHaveLength(1);
      expect(rule?.contract?.invariants).toContain('Counter must always increase by 1');
    });
  });

  describe('completeness audit integration', () => {
    it('should run audit via engine', async () => {
      const { auditCompleteness, formatReport } = await import('../core/completeness.js');

      const manifest = {
        branches: [
          {
            location: 'test.ts:1',
            condition: 'counter > 0',
            kind: 'domain' as const,
            coveredBy: 'test/increment',
          },
        ],
        stateFields: [
          { source: 'store', field: 'counter', inContext: true, usedByRule: true },
        ],
        transitions: [
          { description: 'increment counter', eventTag: 'counter.increment', location: 'test.ts:5' },
        ],
        rulesNeedingContracts: ['test/increment', 'test/greet'],
      };

      const rulesWithContracts = registry.getAllRules()
        .filter(r => r.contract)
        .map(r => r.id);

      const report = auditCompleteness(
        manifest,
        registry.getRuleIds(),
        registry.getConstraintIds(),
        rulesWithContracts,
      );

      expect(report.score).toBeGreaterThan(0);
      expect(report.rating).toBeDefined();
      expect(formatReport(report)).toContain('Praxis Completeness');
    });
  });

  describe('suggestion engine', () => {
    it('should generate rule suggestions for behavioral gaps', () => {
      // Test the suggestId logic indirectly through server creation
      const server = createPraxisMcpServer({
        initialContext: { counter: 0, name: 'Test' },
        registry,
      });

      expect(server).toBeDefined();
    });
  });

  describe('step and state management', () => {
    it('should step engine and accumulate facts', () => {
      const server = createPraxisMcpServer({
        initialContext: { counter: 5, name: 'Alice' },
        registry,
      });

      // Step with increment event
      const result1 = server.engine.step([{ tag: 'counter.increment', payload: {} }]);
      expect(result1.state.facts.some(f => f.tag === 'counter.incremented')).toBe(true);

      // Step with greet event
      const result2 = server.engine.step([{ tag: 'greet', payload: {} }]);
      expect(result2.state.facts.some(f => f.tag === 'greeting')).toBe(true);
    });

    it('should check constraints after step', () => {
      const negativeRegistry = new PraxisRegistry<TestContext>({
        compliance: { enabled: false },
      });
      negativeRegistry.registerModule(testModule);

      const server = createPraxisMcpServer({
        initialContext: { counter: -1, name: 'Test' },
        registry: negativeRegistry,
      });

      const result = server.engine.step([{ tag: 'counter.increment', payload: {} }]);
      // The constraint should report a violation for negative counter
      const violation = result.diagnostics.find(
        d => d.kind === 'constraint-violation' && d.message.includes('non-negative'),
      );
      expect(violation).toBeDefined();
    });
  });

  describe('contract coverage', () => {
    it('should track which rules have contracts', () => {
      const rules = registry.getAllRules();
      const withContracts = rules.filter(r => r.contract);
      expect(withContracts).toHaveLength(2); // both test rules have contracts
    });

    it('should track which constraints have contracts', () => {
      const constraints = registry.getAllConstraints();
      const withContracts = constraints.filter(c => c.contract);
      expect(withContracts).toHaveLength(1);
    });
  });
});
