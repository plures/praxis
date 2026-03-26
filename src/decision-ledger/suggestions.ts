/**
 * Decision Ledger — Actionable Fix Suggestions
 *
 * For each finding from the analyzer, generates concrete,
 * actionable suggestions with optional code skeletons.
 */

import type {
  DeadRule,
  UnreachableState,
  ShadowedRule,
  Contradiction,
  Gap,
  ContractCoverageGap,
  Suggestion,
  FindingType,
} from './analyzer-types.js';

/**
 * Generate a suggestion for any type of finding.
 *
 * @param finding - The finding to generate a suggestion for
 * @param type - The type of finding, used to dispatch to the appropriate suggestion generator
 * @returns A {@link Suggestion} with a message, action, and priority
 */
export function suggest(
  finding: DeadRule | UnreachableState | ShadowedRule | Contradiction | Gap | ContractCoverageGap,
  type: FindingType,
): Suggestion {
  switch (type) {
    case 'dead-rule':
      return suggestForDeadRule(finding as DeadRule);
    case 'gap':
      return suggestForGap(finding as Gap);
    case 'contradiction':
      return suggestForContradiction(finding as Contradiction);
    case 'unreachable-state':
      return suggestForUnreachableState(finding as UnreachableState);
    case 'shadowed-rule':
      return suggestForShadowedRule(finding as ShadowedRule);
    case 'contract-gap':
      return suggestForContractGap(finding as ContractCoverageGap);
    default:
      return {
        findingType: type,
        entityId: 'unknown',
        message: 'Unknown finding type',
        action: 'modify',
        priority: 1,
      };
  }
}

/**
 * Generate suggestions for all findings at once.
 *
 * @param findings - Object with optional arrays of each finding type to generate suggestions for
 * @returns Flat array of {@link Suggestion} objects, one per finding across all types
 */
export function suggestAll(findings: {
  deadRules?: DeadRule[];
  gaps?: Gap[];
  contradictions?: Contradiction[];
  unreachableStates?: UnreachableState[];
  shadowedRules?: ShadowedRule[];
  contractGaps?: ContractCoverageGap[];
}): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (findings.deadRules) {
    for (const f of findings.deadRules) {
      suggestions.push(suggestForDeadRule(f));
    }
  }
  if (findings.gaps) {
    for (const f of findings.gaps) {
      suggestions.push(suggestForGap(f));
    }
  }
  if (findings.contradictions) {
    for (const f of findings.contradictions) {
      suggestions.push(suggestForContradiction(f));
    }
  }
  if (findings.unreachableStates) {
    for (const f of findings.unreachableStates) {
      suggestions.push(suggestForUnreachableState(f));
    }
  }
  if (findings.shadowedRules) {
    for (const f of findings.shadowedRules) {
      suggestions.push(suggestForShadowedRule(f));
    }
  }
  if (findings.contractGaps) {
    for (const f of findings.contractGaps) {
      suggestions.push(suggestForContractGap(f));
    }
  }

  // Sort by priority (higher first)
  suggestions.sort((a, b) => b.priority - a.priority);

  return suggestions;
}

// ─── Individual Suggestion Generators ───────────────────────────────────────

function suggestForDeadRule(finding: DeadRule): Suggestion {
  const eventList = finding.requiredEventTypes.join(', ');
  return {
    findingType: 'dead-rule',
    entityId: finding.ruleId,
    message: `Remove rule "${finding.ruleId}" or add event type "${finding.requiredEventTypes[0]}" to your event sources. Rule requires [${eventList}] but none are emitted by the application.`,
    action: finding.requiredEventTypes.length === 1 ? 'add-event-type' : 'remove',
    priority: 5,
    skeleton: `// Option 1: Remove the dead rule
registry.removeRule('${finding.ruleId}');

// Option 2: Add the missing event type
engine.step([{ tag: '${finding.requiredEventTypes[0]}', payload: {} }]);`,
  };
}

function suggestForGap(finding: Gap): Suggestion {
  const ruleId = finding.expectationName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  switch (finding.type) {
    case 'no-rule':
      return {
        findingType: 'gap',
        entityId: finding.expectationName,
        message: `Add a rule covering: "${finding.expectationName}". No rules or constraints address this expected behavior.`,
        action: 'add-rule',
        priority: 8,
        skeleton: `defineRule({
  id: '${ruleId}',
  description: '${finding.description}',
  eventTypes: ['TODO_EVENT_TYPE'],
  impl: (state, events) => {
    // TODO: Implement logic for "${finding.expectationName}"
    return RuleResult.noop('Not implemented');
  },
  contract: defineContract({
    ruleId: '${ruleId}',
    behavior: '${finding.expectationName}',
    examples: [
      { given: 'TODO', when: 'TODO', then: 'TODO' },
    ],
    invariants: [],
  }),
});`,
      };

    case 'partial-coverage':
      return {
        findingType: 'gap',
        entityId: finding.expectationName,
        message: `Expectation "${finding.expectationName}" is partially covered by rules [${finding.partialCoverage.join(', ')}]. Add contract examples or additional rules for uncovered conditions.`,
        action: 'modify',
        priority: 6,
      };

    case 'no-contract':
      return {
        findingType: 'gap',
        entityId: finding.expectationName,
        message: `Rules related to "${finding.expectationName}" ([${finding.partialCoverage.join(', ')}]) lack contracts. Add contracts with examples covering the expected behavior.`,
        action: 'add-contract',
        priority: 7,
      };

    default:
      return {
        findingType: 'gap',
        entityId: finding.expectationName,
        message: finding.description,
        action: 'add-rule',
        priority: 5,
      };
  }
}

function suggestForContradiction(finding: Contradiction): Suggestion {
  return {
    findingType: 'contradiction',
    entityId: `${finding.ruleA}↔${finding.ruleB}`,
    message: `Rules "${finding.ruleA}" and "${finding.ruleB}" both produce fact "${finding.conflictingTag}" with potentially different payloads. Add priority ordering, merge the rules, or add distinguishing conditions.`,
    action: 'add-priority',
    priority: 9,
    skeleton: `// Option 1: Add priority via meta
defineRule({
  id: '${finding.ruleA}',
  meta: { priority: 10 },  // Higher priority wins
  // ...
});

// Option 2: Add distinguishing conditions
defineRule({
  id: '${finding.ruleA}',
  impl: (state, events) => {
    // Add condition to distinguish from "${finding.ruleB}"
    if (/* specific condition */) {
      return RuleResult.emit([{ tag: '${finding.conflictingTag}', payload: { /* ... */ } }]);
    }
    return RuleResult.skip('Deferred to ${finding.ruleB}');
  },
});`,
  };
}

function suggestForUnreachableState(finding: UnreachableState): Suggestion {
  const tags = finding.factTags.join(', ');
  return {
    findingType: 'unreachable-state',
    entityId: finding.factTags.join('+'),
    message: `No rule produces facts [${tags}] together. If this state combination is valid, add a composite rule that produces all required facts.`,
    action: 'add-rule',
    priority: 4,
    skeleton: `defineRule({
  id: 'composite-${finding.factTags[0]?.replace('.', '-') ?? 'unknown'}',
  description: 'Produces facts [${tags}] together',
  impl: (state, events) => {
    return RuleResult.emit([
${finding.factTags.map(t => `      { tag: '${t}', payload: {} },`).join('\n')}
    ]);
  },
});`,
  };
}

function suggestForShadowedRule(finding: ShadowedRule): Suggestion {
  return {
    findingType: 'shadowed-rule',
    entityId: finding.ruleId,
    message: `Rule "${finding.ruleId}" is always superseded by "${finding.shadowedBy}" for event types [${finding.sharedEventTypes.join(', ')}]. Consider merging the rules or adding a distinguishing condition to "${finding.ruleId}".`,
    action: 'merge',
    priority: 3,
    skeleton: `// Option 1: Remove the shadowed rule
registry.removeRule('${finding.ruleId}');

// Option 2: Add unique behavior to the shadowed rule
defineRule({
  id: '${finding.ruleId}',
  impl: (state, events) => {
    // Add condition that "${finding.shadowedBy}" doesn't cover
    if (/* unique condition */) {
      return RuleResult.emit([/* unique facts */]);
    }
    return RuleResult.skip('Handled by ${finding.shadowedBy}');
  },
});`,
  };
}

function suggestForContractGap(finding: ContractCoverageGap): Suggestion {
  let message: string;
  let action: Suggestion['action'] = 'add-contract';
  let priority: number;

  switch (finding.type) {
    case 'missing-error-path':
      message = `Rule "${finding.ruleId}" has no error/failure examples in its contract. Add examples showing what happens when preconditions fail, inputs are invalid, or the rule needs to skip.`;
      priority = 6;
      break;
    case 'missing-edge-case':
      message = `Rule "${finding.ruleId}": ${finding.description}. Add contract examples covering all declared event types.`;
      priority = 5;
      break;
    case 'missing-boundary':
      message = `Rule "${finding.ruleId}" has only 1 contract example. Add boundary condition examples (empty input, maximum values, concurrent events).`;
      priority = 4;
      break;
    case 'cross-reference-broken':
      message = `Rule "${finding.ruleId}": ${finding.description}. Verify the referenced fact producer exists.`;
      action = 'modify';
      priority = 7;
      break;
    default:
      message = finding.description;
      priority = 3;
  }

  return {
    findingType: 'contract-gap',
    entityId: finding.ruleId,
    message,
    action,
    priority,
  };
}
