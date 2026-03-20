/**
 * Praxis MCP Server
 *
 * Exposes Praxis engine operations as MCP tools for AI assistants.
 * Supports both stdio transport (CLI usage) and library import.
 *
 * Tools:
 * - praxis.inspect — list all registered rules, constraints, contracts
 * - praxis.evaluate — run a rule against given events
 * - praxis.audit — run completeness audit against a manifest
 * - praxis.suggest — suggest rules/constraints for a gap
 * - praxis.facts — get current fact state
 * - praxis.step — step the engine with events
 * - praxis.contracts — list all contracts with coverage status
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LogicEngine } from '../core/engine.js';
import { RuleResult } from '../core/rule-result.js';
import { auditCompleteness, formatReport } from '../core/completeness.js';
import { getContractFromDescriptor } from '../decision-ledger/types.js';
import type {
  PraxisMcpServerOptions,
  InspectOutput,
  EvaluateOutput,
  StepOutput,
  FactsOutput,
  ContractsOutput,
  AuditOutput,
  SuggestOutput,
  RuleInfo,
  ConstraintInfo,
} from './types.js';

/**
 * Create a Praxis MCP server with all tools registered.
 *
 * @example
 * ```ts
 * import { createPraxisMcpServer } from '@plures/praxis/mcp';
 * import { PraxisRegistry } from '@plures/praxis';
 *
 * const registry = new PraxisRegistry();
 * // ... register rules ...
 *
 * const server = createPraxisMcpServer({
 *   initialContext: {},
 *   registry,
 * });
 *
 * // Start via stdio for CLI usage
 * await server.start();
 *
 * // Or use the McpServer instance directly
 * const mcpServer = server.mcpServer;
 * ```
 */
export function createPraxisMcpServer<TContext = unknown>(
  options: PraxisMcpServerOptions<TContext>,
) {
  const {
    name = '@plures/praxis',
    version = '1.0.0',
    initialContext,
    registry,
    initialFacts,
  } = options;

  // Create the engine that backs all operations
  const engine = new LogicEngine<TContext>({
    initialContext,
    registry,
    initialFacts,
  });

  // Create MCP server
  const server = new McpServer({
    name,
    version,
  });

  // ── praxis.inspect ──────────────────────────────────────────────────────

  server.tool(
    'praxis.inspect',
    'List all registered rules, constraints, and their contracts',
    {
      filter: z.string().optional().describe('Filter rule/constraint IDs by pattern (substring match)'),
      includeContracts: z.boolean().optional().describe('Include full contract details (default: false)'),
    },
    async (params): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
      const filter = params.filter;
      const includeContracts = params.includeContracts ?? false;

      let rules = registry.getAllRules();
      let constraints = registry.getAllConstraints();

      if (filter) {
        rules = rules.filter(r => r.id.includes(filter));
        constraints = constraints.filter(c => c.id.includes(filter));
      }

      const ruleInfos: RuleInfo[] = rules.map(r => {
        const contract = getContractFromDescriptor(r);
        return {
          id: r.id,
          description: r.description,
          eventTypes: r.eventTypes,
          hasContract: !!contract,
          contract: includeContracts ? contract : undefined,
          meta: r.meta,
        };
      });

      const constraintInfos: ConstraintInfo[] = constraints.map(c => {
        const contract = getContractFromDescriptor(c);
        return {
          id: c.id,
          description: c.description,
          hasContract: !!contract,
          contract: includeContracts ? contract : undefined,
          meta: c.meta,
        };
      });

      const output: InspectOutput = {
        rules: ruleInfos,
        constraints: constraintInfos,
        summary: {
          totalRules: ruleInfos.length,
          totalConstraints: constraintInfos.length,
          rulesWithContracts: ruleInfos.filter(r => r.hasContract).length,
          constraintsWithContracts: constraintInfos.filter(c => c.hasContract).length,
        },
      };

      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    },
  );

  // ── praxis.evaluate ─────────────────────────────────────────────────────

  server.tool(
    'praxis.evaluate',
    'Run a specific rule against given events and return the result',
    {
      ruleId: z.string().describe('The rule ID to evaluate'),
      events: z.array(z.object({
        tag: z.string(),
        payload: z.unknown(),
      })).describe('Events to process through the rule'),
    },
    async (params): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
      const rule = registry.getRule(params.ruleId);
      if (!rule) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Rule "${params.ruleId}" not found` }) }],
        };
      }

      const state = engine.getState();
      const stateWithEvents = { ...state, events: params.events };

      try {
        const rawResult = rule.impl(stateWithEvents as Parameters<typeof rule.impl>[0], params.events);

        let output: EvaluateOutput;
        if (rawResult instanceof RuleResult) {
          output = {
            ruleId: params.ruleId,
            resultKind: rawResult.kind,
            facts: rawResult.facts,
            retractedTags: rawResult.retractTags,
            reason: rawResult.reason,
            diagnostics: [],
          };
        } else if (Array.isArray(rawResult)) {
          output = {
            ruleId: params.ruleId,
            resultKind: 'emit',
            facts: rawResult,
            retractedTags: [],
            diagnostics: [],
          };
        } else {
          output = {
            ruleId: params.ruleId,
            resultKind: 'noop',
            facts: [],
            retractedTags: [],
            diagnostics: [],
          };
        }

        return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Rule evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
              ruleId: params.ruleId,
            }),
          }],
        };
      }
    },
  );

  // ── praxis.audit ────────────────────────────────────────────────────────

  server.tool(
    'praxis.audit',
    'Run completeness audit against a manifest and return the report',
    {
      branches: z.array(z.object({
        location: z.string(),
        condition: z.string(),
        kind: z.enum(['domain', 'invariant', 'ui', 'transport', 'wiring', 'transform']),
        coveredBy: z.string().nullable(),
        note: z.string().optional(),
      })).describe('Logic branches to audit'),
      stateFields: z.array(z.object({
        source: z.string(),
        field: z.string(),
        inContext: z.boolean(),
        usedByRule: z.boolean(),
      })).describe('State fields to check context coverage'),
      transitions: z.array(z.object({
        description: z.string(),
        eventTag: z.string().nullable(),
        location: z.string(),
      })).describe('State transitions to check event coverage'),
      rulesNeedingContracts: z.array(z.string()).describe('Rule IDs that should have contracts'),
      threshold: z.number().optional().describe('Minimum passing score (default: 90)'),
    },
    async (params): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
      const rulesWithContracts = registry.getAllRules()
        .filter(r => getContractFromDescriptor(r))
        .map(r => r.id);

      const report = auditCompleteness(
        {
          branches: params.branches,
          stateFields: params.stateFields,
          transitions: params.transitions,
          rulesNeedingContracts: params.rulesNeedingContracts,
        },
        registry.getRuleIds(),
        registry.getConstraintIds(),
        rulesWithContracts,
        { threshold: params.threshold },
      );

      const output: AuditOutput = {
        report,
        formatted: formatReport(report),
      };

      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    },
  );

  // ── praxis.suggest ──────────────────────────────────────────────────────

  server.tool(
    'praxis.suggest',
    'Given a gap or description, suggest rules/constraints to add',
    {
      gap: z.string().describe('Description of the gap or failing expectation'),
      context: z.record(z.string(), z.unknown()).optional().describe('Current context for suggestions'),
    },
    async (params): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
      const existingRules = registry.getAllRules();
      const _constraints = registry.getAllConstraints();
      void _constraints; // used for future constraint-aware suggestions
      const suggestions: SuggestOutput['suggestions'] = [];

      // Analyze gap description against existing rules
      const gapLower = params.gap.toLowerCase();

      // Check if any existing rule partially covers this
      const relatedRules = existingRules.filter(r =>
        r.description.toLowerCase().includes(gapLower) ||
        gapLower.includes(r.id.toLowerCase()),
      );

      if (relatedRules.length > 0) {
        // Suggest adding a constraint to complement existing rules
        for (const rule of relatedRules) {
          suggestions.push({
            type: 'constraint',
            id: `${rule.id}/guard`,
            description: `Add a constraint to guard the behavior described by rule "${rule.id}"`,
            rationale: `Rule "${rule.id}" (${rule.description}) exists but may not fully cover: ${params.gap}`,
          });
        }
      }

      // If gap mentions validation/invariant-like terms, suggest constraint
      const invariantTerms = ['must', 'never', 'always', 'require', 'valid', 'invalid', 'prevent'];
      if (invariantTerms.some(t => gapLower.includes(t))) {
        suggestions.push({
          type: 'constraint',
          id: suggestId(params.gap, 'constraint'),
          description: `Constraint: ${params.gap}`,
          rationale: 'Gap description contains invariant language — a constraint would encode this guarantee',
        });
      }

      // If gap mentions behavior/action terms, suggest rule
      const ruleTerms = ['when', 'if', 'show', 'emit', 'trigger', 'display', 'update'];
      if (ruleTerms.some(t => gapLower.includes(t))) {
        suggestions.push({
          type: 'rule',
          id: suggestId(params.gap, 'rule'),
          description: `Rule: ${params.gap}`,
          rationale: 'Gap description contains conditional behavior — a rule would implement this logic',
        });
      }

      // Check if relevant rules lack contracts
      const contractGaps = registry.getContractGaps();
      if (contractGaps.length > 0) {
        const relatedGaps = contractGaps.filter(g =>
          gapLower.includes(g.ruleId.toLowerCase()),
        );
        for (const g of relatedGaps) {
          suggestions.push({
            type: 'contract',
            id: g.ruleId,
            description: `Add contract for "${g.ruleId}" — missing: ${g.missing.join(', ')}`,
            rationale: `Related rule "${g.ruleId}" lacks a contract, which could prevent this gap`,
          });
        }
      }

      // Suggest an event if the gap describes a state transition
      const eventTerms = ['transition', 'change', 'happen', 'occur', 'fire', 'dispatch'];
      if (eventTerms.some(t => gapLower.includes(t))) {
        suggestions.push({
          type: 'event',
          id: suggestId(params.gap, 'event'),
          description: `Event for: ${params.gap}`,
          rationale: 'Gap description suggests a state transition — an event would make it observable',
        });
      }

      // Fallback: always suggest at least a rule
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'rule',
          id: suggestId(params.gap, 'rule'),
          description: `Rule: ${params.gap}`,
          rationale: 'No existing rules or constraints cover this gap — a new rule is recommended',
        });
      }

      const output: SuggestOutput = { suggestions };
      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    },
  );

  // ── praxis.facts ────────────────────────────────────────────────────────

  server.tool(
    'praxis.facts',
    'Get the current fact state of the engine',
    {},
    async (): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
      const facts = engine.getFacts();
      const output: FactsOutput = {
        facts,
        count: facts.length,
      };
      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    },
  );

  // ── praxis.step ─────────────────────────────────────────────────────────

  server.tool(
    'praxis.step',
    'Step the engine with events and return the new state',
    {
      events: z.array(z.object({
        tag: z.string(),
        payload: z.unknown(),
      })).describe('Events to process'),
    },
    async (params): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
      const result = engine.step(params.events);
      const output: StepOutput = {
        facts: result.state.facts,
        diagnostics: result.diagnostics,
        factCount: result.state.facts.length,
      };
      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    },
  );

  // ── praxis.contracts ────────────────────────────────────────────────────

  server.tool(
    'praxis.contracts',
    'List all contracts with their coverage status',
    {
      filter: z.string().optional().describe('Filter by rule/constraint ID (substring match)'),
    },
    async (params): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
      const rules = registry.getAllRules();
      const constraints = registry.getAllConstraints();

      type LocalContractInfo = {
        ruleId: string;
        hasContract: boolean;
        contract?: import('../decision-ledger/types.js').Contract;
        type: 'rule' | 'constraint';
      };

      let contracts: LocalContractInfo[] = [
        ...rules.map(r => ({
          ruleId: r.id,
          hasContract: !!getContractFromDescriptor(r),
          contract: getContractFromDescriptor(r),
          type: 'rule' as const,
        })),
        ...constraints.map(c => ({
          ruleId: c.id,
          hasContract: !!getContractFromDescriptor(c),
          contract: getContractFromDescriptor(c),
          type: 'constraint' as const,
        })),
      ];

      if (params.filter) {
        contracts = contracts.filter(c => c.ruleId.includes(params.filter!));
      }

      const total = contracts.length;
      const withContracts = contracts.filter(c => c.hasContract).length;

      const output: ContractsOutput = {
        contracts,
        coverage: {
          total,
          withContracts,
          percentage: total > 0 ? Math.round((withContracts / total) * 100) : 100,
        },
      };

      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    },
  );

  // ── Public API ──────────────────────────────────────────────────────────

  return {
    /** The underlying MCP server instance */
    mcpServer: server,
    /** The underlying Praxis engine */
    engine,
    /** Start the server on stdio transport */
    async start(): Promise<void> {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    },
  };
}

/**
 * Generate a suggested ID from a gap description and type.
 */
function suggestId(description: string, type: string): string {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('-');
  return `suggested/${type}/${slug}`;
}
