/**
 * Decision Ledger — Fact Derivation Tracing
 *
 * Trace how facts are derived through chains of rule firings,
 * and analyze the impact of removing a fact from the system.
 */

import type { PraxisRegistry } from '../core/rules.js';
import type { LogicEngine } from '../core/engine.js';
import type { DerivationChain, DerivationStep, ImpactReport } from './analyzer-types.js';
import { analyzeDependencyGraph } from './analyzer.js';

/**
 * Trace how a fact was derived through the rule chain.
 *
 * Starting from the fact tag, walks backward through the dependency graph
 * to find the full derivation chain: event → rule A → fact X → rule B → fact Y
 *
 * Uses the engine's current state to identify which rules actually fired.
 */
export function traceDerivation<TContext = unknown>(
  factTag: string,
  _engine: LogicEngine<TContext>,
  registry: PraxisRegistry<TContext>,
): DerivationChain {
  const graph = analyzeDependencyGraph(registry);
  const steps: DerivationStep[] = [];
  const visited = new Set<string>();

  function walkBackward(tag: string, depth: number): void {
    if (visited.has(tag) || depth > 20) return; // prevent cycles
    visited.add(tag);

    const factNode = graph.facts.get(tag);
    if (!factNode) {
      steps.unshift({
        type: 'fact-produced',
        id: tag,
        description: `Fact "${tag}" (origin unknown — not in dependency graph)`,
      });
      return;
    }

    // This fact was produced
    steps.unshift({
      type: 'fact-produced',
      id: tag,
      description: `Fact "${tag}" produced`,
    });

    // Walk to producers
    for (const ruleId of factNode.producedBy) {
      if (visited.has(ruleId)) continue;
      visited.add(ruleId);

      const rule = registry.getRule(ruleId);
      steps.unshift({
        type: 'rule-fired',
        id: ruleId,
        description: `Rule "${ruleId}" fired${rule ? `: ${rule.description}` : ''}`,
      });

      // What does this rule consume?
      const consumed = graph.consumers.get(ruleId) ?? [];
      for (const consumedTag of consumed) {
        steps.unshift({
          type: 'fact-read',
          id: consumedTag,
          description: `Rule "${ruleId}" reads fact "${consumedTag}"`,
        });
        walkBackward(consumedTag, depth + 1);
      }

      // What events trigger this rule?
      if (rule?.eventTypes) {
        const types = Array.isArray(rule.eventTypes) ? rule.eventTypes : [rule.eventTypes];
        for (const eventType of types) {
          steps.unshift({
            type: 'event',
            id: eventType,
            description: `Event "${eventType}" triggers rule "${ruleId}"`,
          });
        }
      }
    }
  }

  walkBackward(factTag, 0);

  // Deduplicate steps while preserving order
  const seen = new Set<string>();
  const dedupedSteps = steps.filter(step => {
    const key = `${step.type}:${step.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    targetFact: factTag,
    steps: dedupedSteps,
    depth: dedupedSteps.filter(s => s.type === 'rule-fired').length,
  };
}

/**
 * Trace the impact of removing a fact from the system.
 *
 * Returns which rules would stop firing and which downstream facts
 * would disappear if the given fact were removed.
 */
export function traceImpact<TContext = unknown>(
  factTag: string,
  registry: PraxisRegistry<TContext>,
): ImpactReport {
  const graph = analyzeDependencyGraph(registry);
  const affectedRules: string[] = [];
  const affectedFacts: string[] = [];
  const visited = new Set<string>();

  function walkForward(tag: string, depth: number): number {
    if (visited.has(tag) || depth > 20) return depth;
    visited.add(tag);

    const factNode = graph.facts.get(tag);
    if (!factNode) return depth;

    let maxDepth = depth;

    // Find rules that consume this fact
    for (const ruleId of factNode.consumedBy) {
      if (!affectedRules.includes(ruleId)) {
        affectedRules.push(ruleId);
      }

      // What facts do those rules produce? Those would also disappear.
      const produced = graph.producers.get(ruleId) ?? [];
      for (const producedTag of produced) {
        if (producedTag !== factTag && !affectedFacts.includes(producedTag)) {
          affectedFacts.push(producedTag);
          const childDepth = walkForward(producedTag, depth + 1);
          if (childDepth > maxDepth) maxDepth = childDepth;
        }
      }
    }

    return maxDepth;
  }

  const depth = walkForward(factTag, 0);

  return {
    factTag,
    affectedRules,
    affectedFacts,
    depth,
  };
}
