/**
 * Decision Ledger — Contract Verification
 *
 * Goes beyond simple contract existence checking to actually run rules
 * against their contract examples, verify invariants, and cross-reference
 * fact dependencies between contracts.
 */

import type { PraxisRegistry, RuleDescriptor } from '../core/rules.js';
import type { PraxisState, PraxisEvent, PraxisFact } from '../core/protocol.js';
import { RuleResult } from '../core/rule-result.js';
import type { Contract } from './types.js';
import type {
  ContractVerificationResult,
  ExampleVerification,
  InvariantCheck,
  ContractCoverageGap,
  CrossReference,
} from './analyzer-types.js';
import { analyzeDependencyGraph } from './analyzer.js';

/**
 * Actually run a rule's implementation against each contract example's
 * `given` state and verify the output matches `then`.
 *
 * This is deeper than contract existence checking — it executes the rule.
 *
 * @param rule - The rule descriptor to verify
 * @param contract - The contract with Given/When/Then examples to run against the rule
 * @returns A {@link ContractVerificationResult} with per-example pass/fail status
 */
export function verifyContractExamples<TContext = unknown>(
  rule: RuleDescriptor<TContext>,
  contract: Contract,
): ContractVerificationResult {
  const examples: ExampleVerification[] = [];

  for (let i = 0; i < contract.examples.length; i++) {
    const example = contract.examples[i];

    try {
      // Build synthetic state from `given`
      const state = buildStateFromDescription<TContext>(example.given);

      // Build events from `when`
      const events = buildEventsFromDescription(example.when, rule.eventTypes);

      // Add events to state so rules can access state.events
      const stateWithEvents = { ...state, events };

      // Execute the rule
      const result = rule.impl(stateWithEvents, events);

      // Check if output matches `then`
      const verification = verifyOutput(result, example.then, rule.id);

      examples.push({
        index: i,
        given: example.given,
        when: example.when,
        expectedThen: example.then,
        passed: verification.passed,
        actualOutput: verification.actualOutput,
        error: verification.error,
      });
    } catch (error) {
      examples.push({
        index: i,
        given: example.given,
        when: example.when,
        expectedThen: example.then,
        passed: false,
        error: `Execution error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const passCount = examples.filter(e => e.passed).length;
  const failCount = examples.filter(e => !e.passed).length;

  return {
    ruleId: rule.id,
    examples,
    allPassed: failCount === 0,
    passCount,
    failCount,
  };
}

/**
 * Check that stated invariants hold across all rules.
 *
 * For each rule with a contract, check if the invariants are consistent
 * with the rule's behavior description and examples.
 *
 * @param registry - The Praxis registry containing all rules with contracts
 * @returns Array of {@link InvariantCheck} objects, one per invariant per rule
 */
export function verifyInvariants<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
): InvariantCheck[] {
  const checks: InvariantCheck[] = [];
  const rules = registry.getAllRules();

  for (const rule of rules) {
    if (!rule.contract) continue;

    for (const invariant of rule.contract.invariants) {
      // Check if the invariant is consistent with examples
      const consistent = rule.contract.examples.every(example => {
        return isConsistentWithInvariant(example, invariant);
      });

      checks.push({
        invariant,
        ruleId: rule.id,
        holds: consistent,
        explanation: consistent
          ? `Invariant "${invariant}" is consistent with all ${rule.contract.examples.length} examples`
          : `Invariant "${invariant}" may be violated by one or more examples`,
      });
    }
  }

  return checks;
}

/**
 * Find rules with contracts that don't cover all code paths.
 *
 * Analyzes contract examples to find:
 * - Rules with only happy-path examples (no error cases)
 * - Rules with no boundary condition examples
 * - Rules that handle multiple event types but only have examples for some
 *
 * @param registry - The Praxis registry containing all rules with contracts
 * @returns Array of {@link ContractCoverageGap} objects for insufficiently covered contracts
 */
export function findContractGaps<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
): ContractCoverageGap[] {
  const gaps: ContractCoverageGap[] = [];
  const rules = registry.getAllRules();

  for (const rule of rules) {
    if (!rule.contract) continue;

    const examples = rule.contract.examples;

    // Check: no error/failure examples
    const hasErrorExamples = examples.some(
      ex =>
        ex.then.toLowerCase().includes('error') ||
        ex.then.toLowerCase().includes('fail') ||
        ex.then.toLowerCase().includes('skip') ||
        ex.then.toLowerCase().includes('noop') ||
        ex.then.toLowerCase().includes('retract') ||
        ex.then.toLowerCase().includes('violation'),
    );

    if (!hasErrorExamples && examples.length > 0) {
      gaps.push({
        ruleId: rule.id,
        description: `No error/failure path examples. All ${examples.length} examples show happy paths`,
        type: 'missing-error-path',
      });
    }

    // Check: multiple event types but not all covered in examples
    if (rule.eventTypes) {
      const eventTypes = Array.isArray(rule.eventTypes) ? rule.eventTypes : [rule.eventTypes];
      if (eventTypes.length > 1) {
        const coveredTypes = new Set<string>();
        for (const ex of examples) {
          for (const et of eventTypes) {
            if (
              ex.when.toLowerCase().includes(et.toLowerCase()) ||
              ex.when.toLowerCase().includes(et.replace('.', ' ').toLowerCase())
            ) {
              coveredTypes.add(et);
            }
          }
        }

        const uncovered = eventTypes.filter(et => !coveredTypes.has(et));
        if (uncovered.length > 0) {
          gaps.push({
            ruleId: rule.id,
            description: `Event types [${uncovered.join(', ')}] not covered by any example`,
            type: 'missing-edge-case',
          });
        }
      }
    }

    // Check: only one example (likely insufficient)
    if (examples.length === 1) {
      gaps.push({
        ruleId: rule.id,
        description: `Only 1 contract example — likely missing boundary conditions and edge cases`,
        type: 'missing-boundary',
      });
    }
  }

  return gaps;
}

/**
 * Find contracts that reference facts from other rules and verify
 * those producing rules actually exist.
 *
 * @param registry - The Praxis registry containing all rules with contracts
 * @returns Array of {@link CrossReference} objects describing inter-rule fact dependencies
 */
export function crossReferenceContracts<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
): CrossReference[] {
  const graph = analyzeDependencyGraph(registry);
  const references: CrossReference[] = [];
  const rules = registry.getAllRules();

  for (const rule of rules) {
    if (!rule.contract) continue;

    // Scan contract examples for references to fact tags
    for (const example of rule.contract.examples) {
      const referencedTags = extractReferencedFactTags(example.given + ' ' + example.when);

      for (const tag of referencedTags) {
        const factNode = graph.facts.get(tag);
        const producerRuleId = factNode?.producedBy[0] ?? null;
        const valid = factNode ? factNode.producedBy.length > 0 : false;

        // Don't self-reference
        if (producerRuleId === rule.id) continue;

        references.push({
          sourceRuleId: rule.id,
          referencedFactTag: tag,
          producerRuleId,
          valid,
        });
      }
    }
  }

  return references;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a minimal synthetic state from a "given" description.
 */
function buildStateFromDescription<TContext>(given: string): PraxisState & { context: TContext } {
  // Parse simple key-value patterns from given text
  const context = {} as TContext;
  const facts: PraxisFact[] = [];

  // Extract fact references from given (e.g., "fact 'user.loggedIn' exists")
  const factPattern = /fact\s+['"]([^'"]+)['"]/gi;
  let match;
  while ((match = factPattern.exec(given)) !== null) {
    facts.push({ tag: match[1], payload: {} });
  }

  // Also check for dotted identifiers that look like facts
  const dottedPattern = /['"]([a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9.]*)['"]/g;
  while ((match = dottedPattern.exec(given)) !== null) {
    const tag = match[1];
    if (!facts.some(f => f.tag === tag)) {
      facts.push({ tag, payload: {} });
    }
  }

  return {
    context,
    facts,
    meta: {},
    protocolVersion: '1.0.0',
  };
}

/**
 * Build synthetic events from a "when" description.
 */
function buildEventsFromDescription(
  when: string,
  eventTypes?: string | string[],
): PraxisEvent[] {
  const events: PraxisEvent[] = [];

  // Use rule's declared event types first
  if (eventTypes) {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    for (const type of types) {
      if (when.toLowerCase().includes(type.toLowerCase()) || when.toLowerCase().includes(type.replace('.', ' ').toLowerCase())) {
        events.push({ tag: type, payload: {} });
      }
    }
  }

  // If no events built from types, create one from the when description
  if (events.length === 0) {
    // Look for event tag patterns in the when text
    const eventPattern = /['"]([A-Z][A-Z0-9._-]+)['"]/g;
    let match;
    while ((match = eventPattern.exec(when)) !== null) {
      events.push({ tag: match[1], payload: {} });
    }
  }

  // Fallback: create a generic event
  if (events.length === 0) {
    const types = eventTypes
      ? (Array.isArray(eventTypes) ? eventTypes : [eventTypes])
      : ['__test__'];
    events.push({ tag: types[0], payload: {} });
  }

  return events;
}

/**
 * Verify rule output against expected "then" description.
 */
function verifyOutput(
  result: unknown,
  expectedThen: string,
  ruleId: string,
): { passed: boolean; actualOutput?: string; error?: string } {
  const thenLower = expectedThen.toLowerCase();

  if (result instanceof RuleResult) {
    switch (result.kind) {
      case 'emit': {
        // Check if the emitted facts match the expected output
        const factTags = result.facts.map(f => f.tag);
        const actualOutput = `Emitted: [${factTags.join(', ')}]`;

        // Check for specific fact tag mentions
        const emitExpected =
          thenLower.includes('emit') ||
          thenLower.includes('produce') ||
          thenLower.includes('fact');

        if (emitExpected) {
          // Check if any mentioned fact tags are in the output
          const expectedTags = extractReferencedFactTags(expectedThen);
          if (expectedTags.length > 0) {
            const allFound = expectedTags.every(tag =>
              factTags.some(ft => ft.toLowerCase() === tag.toLowerCase()),
            );
            return { passed: allFound, actualOutput };
          }
          return { passed: true, actualOutput };
        }

        return { passed: true, actualOutput };
      }
      case 'noop': {
        const expectNoop =
          thenLower.includes('noop') ||
          thenLower.includes('nothing') ||
          thenLower.includes('no fact') ||
          thenLower.includes('skip');
        return {
          passed: expectNoop,
          actualOutput: `Noop: ${result.reason ?? 'no reason'}`,
        };
      }
      case 'skip': {
        const expectSkip =
          thenLower.includes('skip') ||
          thenLower.includes('noop') ||
          thenLower.includes('not fire') ||
          thenLower.includes('nothing');
        return {
          passed: expectSkip,
          actualOutput: `Skip: ${result.reason ?? 'no reason'}`,
        };
      }
      case 'retract': {
        const expectRetract =
          thenLower.includes('retract') ||
          thenLower.includes('remove') ||
          thenLower.includes('clear');
        return {
          passed: expectRetract,
          actualOutput: `Retract: [${result.retractTags.join(', ')}]`,
        };
      }
    }
  } else if (Array.isArray(result)) {
    // Legacy PraxisFact[] return
    const factTags = (result as PraxisFact[]).map(f => f.tag);
    const actualOutput = `Facts: [${factTags.join(', ')}]`;
    return { passed: factTags.length > 0 || thenLower.includes('nothing'), actualOutput };
  }

  return { passed: false, error: `Unexpected result type from rule "${ruleId}"` };
}

/**
 * Check if a contract example is consistent with an invariant statement.
 */
function isConsistentWithInvariant(
  example: { given: string; when: string; then: string },
  invariant: string,
): boolean {
  const invLower = invariant.toLowerCase();
  const thenLower = example.then.toLowerCase();

  // Check for explicit contradictions
  // "must not" invariant vs "does" in then
  if (invLower.includes('must not') || invLower.includes('never')) {
    const keyword = invLower
      .replace(/must not|never|should not/g, '')
      .trim()
      .split(/\s+/)[0];
    if (keyword && thenLower.includes(keyword)) {
      return false; // Potential violation
    }
  }

  // "must" invariant — check the then doesn't contradict
  if (invLower.includes('must ') && !invLower.includes('must not')) {
    // Extract what must happen
    const mustPart = invLower.split('must ')[1]?.split(/[.,;]/)[0]?.trim();
    if (mustPart) {
      // If then explicitly contradicts
      const negations = ['no ', 'not ', 'never ', 'without '];
      for (const neg of negations) {
        if (thenLower.includes(neg + mustPart.split(/\s+/)[0])) {
          return false;
        }
      }
    }
  }

  return true; // No contradiction detected
}

/**
 * Extract fact tags referenced in text.
 */
function extractReferencedFactTags(text: string): string[] {
  const tags: string[] = [];

  // Match dotted identifiers that look like fact tags
  const patterns = [
    /['"]([a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9.]*)['"]/g,
    /fact\s+['"]?([a-zA-Z][a-zA-Z0-9._-]+)['"]?/gi,
    /(?:emit|produce|retract)\s+['"]?([a-zA-Z][a-zA-Z0-9._-]+)['"]?/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const tag = match[1];
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  return tags;
}
