/**
 * Decision Ledger — Graph Analysis Engine
 *
 * Builds the fact dependency graph and analyzes the rule registry
 * for dead rules, unreachable states, shadowed rules, contradictions,
 * and gaps in behavioral expectations.
 */

import type { PraxisRegistry, RuleDescriptor } from '../rules.js';
import type { PraxisFact, PraxisEvent } from '../protocol.js';
import { RuleResult } from '../rule-result.js';
import type {
  DependencyGraph,
  FactNode,
  DependencyEdge,
  DeadRule,
  UnreachableState,
  ShadowedRule,
  Contradiction,
  Gap,
} from './analyzer-types.js';

interface ExpectationCondition {
  description: string;
  type: string;
}
interface Expectation {
  name: string;
  conditions: ReadonlyArray<ExpectationCondition>;
}
interface ExpectationSet {
  expectations: ReadonlyArray<Expectation>;
}

/**
 * Build the fact dependency graph from a registry.
 *
 * This runs each rule with synthetic probe events to discover which facts
 * it reads from state and which facts it produces. For static analysis we
 * inspect rule metadata, contracts, event types, and probe execution.
 *
 * @param registry - The Praxis registry containing all rules and constraints
 * @returns A {@link DependencyGraph} mapping facts, edges, producers, and consumers
 */
export function analyzeDependencyGraph<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
): DependencyGraph {
  const facts = new Map<string, FactNode>();
  const edges: DependencyEdge[] = [];
  const producers = new Map<string, string[]>(); // ruleId → fact tags
  const consumers = new Map<string, string[]>(); // ruleId → fact tags

  const rules = registry.getAllRules();

  for (const rule of rules) {
    const ruleId = rule.id;
    const produced: string[] = [];
    const consumed: string[] = [];

    // Strategy 1: Probe execution with synthetic state
    const probeFacts = probeRuleExecution(rule);
    for (const tag of probeFacts.produced) {
      produced.push(tag);
    }
    for (const tag of probeFacts.consumed) {
      consumed.push(tag);
    }

    // Strategy 2: Contract analysis — examples declare expected facts
    if (rule.contract) {
      for (const example of rule.contract.examples) {
        // Parse "then" for fact tags (convention: "emit factTag" or "produces factTag")
        const thenTags = extractFactTagsFromText(example.then);
        for (const tag of thenTags) {
          if (!produced.includes(tag)) produced.push(tag);
        }
        // Parse "given" for fact tags the rule reads
        const givenTags = extractFactTagsFromText(example.given);
        for (const tag of givenTags) {
          if (!consumed.includes(tag)) consumed.push(tag);
        }
      }
    }

    producers.set(ruleId, produced);
    consumers.set(ruleId, consumed);

    // Update fact nodes
    for (const tag of produced) {
      const node = getOrCreateFactNode(facts, tag);
      if (!node.producedBy.includes(ruleId)) {
        node.producedBy.push(ruleId);
      }
      edges.push({ from: ruleId, to: tag, type: 'produces' });
    }

    for (const tag of consumed) {
      const node = getOrCreateFactNode(facts, tag);
      if (!node.consumedBy.includes(ruleId)) {
        node.consumedBy.push(ruleId);
      }
      edges.push({ from: tag, to: ruleId, type: 'consumes' });
    }
  }

  return { facts, edges, producers, consumers };
}

/**
 * Find rules that can never fire given known event types.
 *
 * @param registry - The Praxis registry containing all rules
 * @param knownEventTypes - The complete set of event type tags the application can emit
 * @returns Array of {@link DeadRule} objects for rules whose required event types are not in the known set
 */
export function findDeadRules<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
  knownEventTypes: string[],
): DeadRule[] {
  const dead: DeadRule[] = [];
  const known = new Set(knownEventTypes);
  const rules = registry.getAllRules();

  for (const rule of rules) {
    if (!rule.eventTypes) continue; // catch-all rules are never dead

    const required = Array.isArray(rule.eventTypes) ? rule.eventTypes : [rule.eventTypes];
    const hasMatch = required.some(t => known.has(t));

    if (!hasMatch) {
      dead.push({
        ruleId: rule.id,
        description: rule.description,
        requiredEventTypes: required,
        reason: `Rule requires event types [${required.join(', ')}] but none are in the known event types [${knownEventTypes.join(', ')}]`,
      });
    }
  }

  return dead;
}

/**
 * Find fact combinations that no rule sequence can produce.
 *
 * This checks pairs of facts where each fact can be produced individually
 * but no single rule or chain produces both. This is conservative —
 * if two facts are produced by completely independent rules that never
 * fire together, they form an unreachable state pair.
 *
 * @param registry - The Praxis registry containing all rules
 * @returns Array of {@link UnreachableState} objects describing fact pairs that cannot co-exist
 */
export function findUnreachableStates<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
): UnreachableState[] {
  const graph = analyzeDependencyGraph(registry);
  const unreachable: UnreachableState[] = [];

  // Find facts that are consumed but never produced by any rule
  for (const [tag, node] of graph.facts) {
    if (node.producedBy.length === 0 && node.consumedBy.length > 0) {
      unreachable.push({
        factTags: [tag],
        reason: `Fact "${tag}" is consumed by rules [${node.consumedBy.join(', ')}] but never produced by any rule`,
      });
    }
  }

  // Find mutually exclusive fact pairs — produced by rules with
  // conflicting event types (one requires X, other requires Y, no rule handles both)
  const allProducedTags = Array.from(graph.facts.keys()).filter(
    tag => graph.facts.get(tag)!.producedBy.length > 0,
  );

  for (let i = 0; i < allProducedTags.length; i++) {
    for (let j = i + 1; j < allProducedTags.length; j++) {
      const tagA = allProducedTags[i];
      const tagB = allProducedTags[j];
      const producersA = graph.facts.get(tagA)!.producedBy;
      const producersB = graph.facts.get(tagB)!.producedBy;

      // Check if any single rule produces both
      const sharedProducer = producersA.find(p => producersB.includes(p));
      if (sharedProducer) continue; // reachable together

      // Check if producers share any event types (could fire in same batch)
      const rules = registry.getAllRules();
      const getEventTypes = (ruleId: string): string[] => {
        const rule = rules.find(r => r.id === ruleId);
        if (!rule?.eventTypes) return [];
        return Array.isArray(rule.eventTypes) ? rule.eventTypes : [rule.eventTypes];
      };

      const eventTypesA = new Set(producersA.flatMap(getEventTypes));
      const eventTypesB = new Set(producersB.flatMap(getEventTypes));

      // If both have event type filters and they don't overlap, these facts
      // can't be produced in the same event batch
      if (
        eventTypesA.size > 0 &&
        eventTypesB.size > 0 &&
        ![...eventTypesA].some(t => eventTypesB.has(t))
      ) {
        // Only flag if one of the fact's consumers also consumes the other
        const consumersA = graph.facts.get(tagA)!.consumedBy;
        const consumersB = graph.facts.get(tagB)!.consumedBy;
        const sharedConsumer = consumersA.find(c => consumersB.includes(c));

        if (sharedConsumer) {
          unreachable.push({
            factTags: [tagA, tagB],
            reason: `Facts "${tagA}" and "${tagB}" are both consumed by rule "${sharedConsumer}" but are produced by rules with non-overlapping event types`,
          });
        }
      }
    }
  }

  return unreachable;
}

/**
 * Find rules where another rule with same event types always produces
 * a superset of the facts.
 *
 * @param registry - The Praxis registry containing all rules
 * @returns Array of {@link ShadowedRule} objects describing rules made redundant by others
 */
export function findShadowedRules<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
): ShadowedRule[] {
  const shadowed: ShadowedRule[] = [];
  const graph = analyzeDependencyGraph(registry);
  const rules = registry.getAllRules();

  for (let i = 0; i < rules.length; i++) {
    for (let j = 0; j < rules.length; j++) {
      if (i === j) continue;

      const ruleA = rules[i];
      const ruleB = rules[j];

      // Both must have event types and they must overlap
      const typesA = normalizeEventTypes(ruleA.eventTypes);
      const typesB = normalizeEventTypes(ruleB.eventTypes);
      if (typesA.length === 0 || typesB.length === 0) continue;

      const shared = typesA.filter(t => typesB.includes(t));
      if (shared.length === 0) continue;

      // Check if ruleB's produced facts are a superset of ruleA's
      const producedA = graph.producers.get(ruleA.id) ?? [];
      const producedB = graph.producers.get(ruleB.id) ?? [];
      if (producedA.length === 0) continue;

      const isSuperset = producedA.every(tag => producedB.includes(tag));
      const isProperSuperset = isSuperset && producedB.length > producedA.length;

      if (isProperSuperset) {
        shadowed.push({
          ruleId: ruleA.id,
          shadowedBy: ruleB.id,
          sharedEventTypes: shared,
          reason: `Rule "${ruleB.id}" produces a superset of facts [${producedB.join(', ')}] compared to "${ruleA.id}" [${producedA.join(', ')}] for the same event types [${shared.join(', ')}]`,
        });
      }
    }
  }

  return shadowed;
}

/**
 * Find rules that produce facts with the same tag but potentially conflicting
 * payloads under the same event conditions.
 *
 * @param registry - The Praxis registry containing all rules
 * @returns Array of {@link Contradiction} objects describing rule pairs that could conflict
 */
export function findContradictions<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
): Contradiction[] {
  const contradictions: Contradiction[] = [];
  const graph = analyzeDependencyGraph(registry);
  const rules = registry.getAllRules();

  // Group facts by tag — find tags produced by multiple rules
  for (const [tag, node] of graph.facts) {
    if (node.producedBy.length < 2) continue;

    // Check pairs of producers
    for (let i = 0; i < node.producedBy.length; i++) {
      for (let j = i + 1; j < node.producedBy.length; j++) {
        const ruleIdA = node.producedBy[i];
        const ruleIdB = node.producedBy[j];

        const ruleA = rules.find(r => r.id === ruleIdA);
        const ruleB = rules.find(r => r.id === ruleIdB);
        if (!ruleA || !ruleB) continue;

        // If they respond to the same event types, they could both fire
        const typesA = normalizeEventTypes(ruleA.eventTypes);
        const typesB = normalizeEventTypes(ruleB.eventTypes);

        // Both catch-all, or shared event types → potential conflict
        const bothCatchAll = typesA.length === 0 && typesB.length === 0;
        const sharedTypes = typesA.filter(t => typesB.includes(t));
        const hasOverlap = sharedTypes.length > 0;

        if (bothCatchAll || hasOverlap) {
          // Check contract examples for conflicting payloads
          const conflictDetail = checkContractConflict(ruleA, ruleB, tag);
          if (conflictDetail || bothCatchAll || hasOverlap) {
            contradictions.push({
              ruleA: ruleIdA,
              ruleB: ruleIdB,
              conflictingTag: tag,
              reason: conflictDetail ??
                `Rules "${ruleIdA}" and "${ruleIdB}" both produce fact "${tag}" and respond to ${bothCatchAll ? 'all events' : `event types [${sharedTypes.join(', ')}]`}`,
            });
          }
        }
      }
    }
  }

  return contradictions;
}

/**
 * Find expectations that have no covering rule or only partial coverage.
 *
 * @param registry - The Praxis registry containing all rules and constraints
 * @param expectations - The expectation set to check coverage against
 * @returns Array of {@link Gap} objects for expectations not fully covered by the registry
 */
export function findGaps<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
  expectations: ExpectationSet,
): Gap[] {
  const gaps: Gap[] = [];
  const rules = registry.getAllRules();
  const constraints = registry.getAllConstraints();

  for (const exp of expectations.expectations) {
    const nameLower = exp.name.toLowerCase();
    const nameParts = nameLower.split(/[-_./\s]+/);

    // Find related rules by name matching
    const related = rules.filter(r => {
      const idLower = r.id.toLowerCase();
      const descLower = r.description.toLowerCase();
      const behaviorLower = r.contract?.behavior?.toLowerCase() ?? '';

      // Direct match
      if (idLower.includes(nameLower) || nameLower.includes(idLower)) return true;
      if (descLower.includes(nameLower) || behaviorLower.includes(nameLower)) return true;

      // Part-based match
      const minParts = Math.min(2, nameParts.length);
      const matches = nameParts.filter(
        part => part.length > 2 && (idLower.includes(part) || descLower.includes(part)),
      );
      return matches.length >= minParts;
    });

    const relatedConstraints = constraints.filter(c => {
      const idLower = c.id.toLowerCase();
      const descLower = c.description.toLowerCase();
      return idLower.includes(nameLower) || nameLower.includes(idLower) || descLower.includes(nameLower);
    });

    if (related.length === 0 && relatedConstraints.length === 0) {
      gaps.push({
        expectationName: exp.name,
        description: `No rules or constraints found for expectation "${exp.name}"`,
        partialCoverage: [],
        type: 'no-rule',
      });
      continue;
    }

    // Check if related rules have contracts covering the conditions
    const uncoveredConditions = exp.conditions.filter(cond => {
      const condLower = cond.description.toLowerCase();
      return !related.some(r =>
        r.contract?.examples.some(
          ex =>
            ex.given.toLowerCase().includes(condLower) ||
            ex.when.toLowerCase().includes(condLower) ||
            ex.then.toLowerCase().includes(condLower) ||
            condLower.includes(ex.given.toLowerCase()) ||
            condLower.includes(ex.when.toLowerCase()),
        ) ||
        r.contract?.invariants.some(
          inv => inv.toLowerCase().includes(condLower) || condLower.includes(inv.toLowerCase()),
        ) ||
        r.contract?.behavior.toLowerCase().includes(condLower) ||
        r.description.toLowerCase().includes(condLower),
      );
    });

    if (uncoveredConditions.length > 0 && uncoveredConditions.length < exp.conditions.length) {
      gaps.push({
        expectationName: exp.name,
        description: `Expectation "${exp.name}" is partially covered. Uncovered conditions: ${uncoveredConditions.map(c => c.description).join('; ')}`,
        partialCoverage: related.map(r => r.id),
        type: 'partial-coverage',
      });
    } else if (uncoveredConditions.length === exp.conditions.length && exp.conditions.length > 0) {
      // All conditions uncovered despite having related rules
      const rulesWithoutContracts = related.filter(r => !r.contract);
      if (rulesWithoutContracts.length > 0) {
        gaps.push({
          expectationName: exp.name,
          description: `Rules related to "${exp.name}" lack contracts: [${rulesWithoutContracts.map(r => r.id).join(', ')}]`,
          partialCoverage: related.map(r => r.id),
          type: 'no-contract',
        });
      }
    }
  }

  return gaps;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getOrCreateFactNode(facts: Map<string, FactNode>, tag: string): FactNode {
  let node = facts.get(tag);
  if (!node) {
    node = { tag, producedBy: [], consumedBy: [] };
    facts.set(tag, node);
  }
  return node;
}

function normalizeEventTypes(eventTypes?: string | string[]): string[] {
  if (!eventTypes) return [];
  return Array.isArray(eventTypes) ? eventTypes : [eventTypes];
}

/**
 * Probe a rule's execution with synthetic state to discover produced/consumed facts.
 */
function probeRuleExecution<TContext>(
  rule: RuleDescriptor<TContext>,
): { produced: string[]; consumed: string[] } {
  const produced: string[] = [];
  const consumed: string[] = [];

  // Build synthetic events from eventTypes
  const eventTypes = normalizeEventTypes(rule.eventTypes);
  const syntheticEvents: PraxisEvent[] = eventTypes.length > 0
    ? eventTypes.map(tag => ({ tag, payload: {} }))
    : [{ tag: '__probe__', payload: {} }];

  const syntheticState = {
    context: {} as TContext,
    facts: [] as PraxisFact[],
    events: syntheticEvents,
    meta: {},
    protocolVersion: '1.0.0',
  };

  try {
    const result = rule.impl(syntheticState, syntheticEvents);

    if (result instanceof RuleResult) {
      if (result.kind === 'emit') {
        for (const fact of result.facts) {
          if (!produced.includes(fact.tag)) {
            produced.push(fact.tag);
          }
        }
      } else if (result.kind === 'retract') {
        for (const tag of result.retractTags) {
          if (!consumed.includes(tag)) {
            consumed.push(tag);
          }
        }
      }
    } else if (Array.isArray(result)) {
      for (const fact of result) {
        if (fact.tag && !produced.includes(fact.tag)) {
          produced.push(fact.tag);
        }
      }
    }
  } catch {
    // Probe failed — rule needs real context. That's fine.
  }

  return { produced, consumed };
}

/**
 * Extract fact tags from text (contract examples, descriptions).
 * Looks for patterns like: emit "factTag", produces "factTag", fact "factTag"
 */
function extractFactTagsFromText(text: string): string[] {
  const tags: string[] = [];
  // Match patterns like: emit factTag, produces factTag, fact factTag
  // Also match dotted identifiers like: sprint.behind, user.loggedIn
  const patterns = [
    /(?:emit|produce|retract|read|consume|fact)\s+['"]?([a-zA-Z][a-zA-Z0-9._-]+)['"]?/gi,
    /['"]([a-zA-Z][a-zA-Z0-9._-]*\.[a-zA-Z][a-zA-Z0-9._-]*)['"]?/g,
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

/**
 * Check contract examples of two rules for conflicting payloads on the same fact tag.
 */
function checkContractConflict<TContext>(
  ruleA: RuleDescriptor<TContext>,
  ruleB: RuleDescriptor<TContext>,
  _factTag: string,
): string | null {
  if (!ruleA.contract || !ruleB.contract) return null;

  // Look for examples where both rules produce the same tag with different outcomes
  for (const exA of ruleA.contract.examples) {
    for (const exB of ruleB.contract.examples) {
      // Same precondition / trigger but different outcomes
      const sameGiven = exA.given.toLowerCase() === exB.given.toLowerCase();
      const sameWhen = exA.when.toLowerCase() === exB.when.toLowerCase();
      const differentThen = exA.then.toLowerCase() !== exB.then.toLowerCase();

      if ((sameGiven || sameWhen) && differentThen) {
        return `Contract conflict: "${ruleA.id}" expects "${exA.then}" but "${ruleB.id}" expects "${exB.then}" under similar conditions`;
      }
    }
  }

  return null;
}
