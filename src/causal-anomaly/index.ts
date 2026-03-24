/**
 * Causal Anomaly Detector — Chronos + Praxis Bridge
 * 
 * Observes GitHub workflow events as a timeline, builds causal chains,
 * and detects when effects appear without known causes.
 * 
 * This is how we would have caught automation-infrastructure:
 *   1. Observe: Copilot assigned to issue #4 at T=08:00
 *   2. Expected cause: queue-advance workflow ran
 *   3. Actual cause: auto-assign-issues.yml in automation-infrastructure
 *   4. Missing link: no queue-advance run → causal gap detected
 *   5. Alert: "Effect without known cause — unknown actor suspected"
 * 
 * @module @plures/praxis/causal-anomaly
 */

import { defineRule, defineModule } from '../dsl/index.js';
import { RuleResult } from '../core/rule-result.js';

// ── Types ──────────────────────────────────────────────────────────────────

/** An observed event in the GitHub automation timeline */
export interface TimelineEvent {
  id: string;
  timestamp: number;
  repo: string;
  type: 'issue-assigned' | 'pr-created' | 'pr-merged' | 'review-requested' | 
        'review-completed' | 'workflow-run' | 'check-completed' | 'issue-created';
  actor: string;          // who/what caused this
  subject: string;        // what was acted on (issue #, PR #, etc.)
  details: Record<string, unknown>;
  /** Expected cause event type (if we have an expectation) */
  expectedCause?: string;
  /** Expected cause actor */
  expectedActor?: string;
}

/** A causal expectation: "when X happens, Y should have caused it" */
export interface CausalExpectation {
  effect: string;         // event type to watch for
  expectedCauses: Array<{
    actor: string;        // expected actor (workflow name, user, etc.)
    eventType: string;    // expected preceding event type
    maxLagMs: number;     // max time between cause and effect
  }>;
  description: string;
}

// ── Events ─────────────────────────────────────────────────────────────────

export const TIMELINE_EVENT = 'causal.timelineEvent';
export const CAUSAL_GAP = 'causal.gap';
export const UNKNOWN_ACTOR = 'causal.unknownActor';

// ── Rules ──────────────────────────────────────────────────────────────────

/**
 * Causal gap detection rule.
 * 
 * When an effect is observed without a matching cause in the timeline,
 * emit a causal gap alert. This is the primary rogue-actor detector.
 */
export const causalGapRule = defineRule({
  id: 'causal.gapDetection',
  description: 'Detect effects that appear without known causes in the timeline',
  eventTypes: TIMELINE_EVENT,
  contract: {
    ruleId: 'causal.gapDetection',
    behavior: 'Alerts when an observed effect has no matching causal predecessor',
    examples: [
      {
        given: 'Copilot assigned to issue, queue-advance ran 2s earlier',
        when: 'timeline event processed',
        then: 'no gap — causal link found'
      },
      {
        given: 'Copilot assigned to issue, no queue-advance run in last 5min',
        when: 'timeline event processed',
        then: 'causal gap emitted — unknown actor suspected'
      }
    ],
    invariants: [
      'Every causal gap must identify the orphaned effect',
      'Max lag window must be respected when searching for causes'
    ]
  },
  impl: (state, events) => {
    const event = events.find(e => e.tag === TIMELINE_EVENT);
    if (!event) return RuleResult.skip('No timeline event');

    const timelineEvent: TimelineEvent = event.payload as TimelineEvent;
    const causalContext = state.context as { causalExpectations?: CausalExpectation[]; timeline?: TimelineEvent[] } | undefined;
    const expectations: CausalExpectation[] = causalContext?.causalExpectations ?? [];
    const timeline: TimelineEvent[] = causalContext?.timeline ?? [];

    // Find matching expectation for this event type
    const expectation = expectations.find(e => e.effect === timelineEvent.type);
    if (!expectation) return RuleResult.noop('No expectation for this event type');

    // Search for a matching cause in the timeline
    const found = expectation.expectedCauses.some(cause => {
      return timeline.some(prev =>
        prev.type === cause.eventType &&
        (cause.actor === '*' || prev.actor === cause.actor) &&
        prev.repo === timelineEvent.repo &&
        (timelineEvent.timestamp - prev.timestamp) <= cause.maxLagMs &&
        (timelineEvent.timestamp - prev.timestamp) >= 0
      );
    });

    if (!found) {
      return RuleResult.emit([{
        tag: CAUSAL_GAP,
        payload: {
          effect: timelineEvent,
          expectation,
          timeline: timeline.slice(-20), // last 20 events for context
          message: `CAUSAL GAP: "${timelineEvent.type}" on ${timelineEvent.repo}#${timelineEvent.subject} by "${timelineEvent.actor}" has no known cause. Expected: ${expectation.expectedCauses.map(c => c.actor).join(' or ')}`
        }
      }]);
    }

    return RuleResult.noop('Causal link found');
  }
});

/**
 * Unknown actor detection rule.
 * 
 * Flags events from actors not in the known-actors list.
 */
export const unknownActorRule = defineRule({
  id: 'causal.unknownActor',
  description: 'Flag events from actors not in the known-actors registry',
  eventTypes: TIMELINE_EVENT,
  contract: {
    ruleId: 'causal.unknownActor',
    behavior: 'Alerts when an action is performed by an unregistered actor',
    examples: [
      {
        given: 'PR merged by queue-advance workflow (known)',
        when: 'timeline event processed',
        then: 'no alert'
      },
      {
        given: 'Issue assigned by auto-assign-issues.yml (unknown)',
        when: 'timeline event processed',
        then: 'unknown actor alert'
      }
    ],
    invariants: [
      'Known actors list must be explicitly maintained',
      'Every unknown actor alert includes the full event context'
    ]
  },
  impl: (state, events) => {
    const event = events.find(e => e.tag === TIMELINE_EVENT);
    if (!event) return RuleResult.skip('No timeline event');

    const timelineEvent: TimelineEvent = event.payload as TimelineEvent;
    const actorContext = state.context as { knownActors?: Set<string> } | undefined;
    const knownActors: Set<string> = actorContext?.knownActors ?? new Set();

    if (!knownActors.has(timelineEvent.actor)) {
      return RuleResult.emit([{
        tag: UNKNOWN_ACTOR,
        payload: {
          actor: timelineEvent.actor,
          event: timelineEvent,
          message: `UNKNOWN ACTOR: "${timelineEvent.actor}" performed "${timelineEvent.type}" on ${timelineEvent.repo}#${timelineEvent.subject}`
        }
      }]);
    }

    return RuleResult.noop('Known actor');
  }
});

// ── Module ─────────────────────────────────────────────────────────────────

export const causalAnomalyModule = defineModule({
  rules: [causalGapRule, unknownActorRule],
  constraints: [],
  meta: { domain: 'causal-anomaly', version: '1.0.0' }
});

// ── Default Expectations ───────────────────────────────────────────────────

/**
 * Default causal expectations for the plures org automation.
 * These encode what we KNOW about cause-effect relationships.
 */
export const defaultExpectations: CausalExpectation[] = [
  {
    effect: 'issue-assigned',
    expectedCauses: [
      { actor: 'Copilot PR Lifecycle', eventType: 'workflow-run', maxLagMs: 300_000 },
      { actor: 'kayodebristol', eventType: 'issue-assigned', maxLagMs: 0 }, // manual
    ],
    description: 'Copilot issue assignment should only come from queue-advance or manual'
  },
  {
    effect: 'pr-created',
    expectedCauses: [
      { actor: 'Copilot', eventType: 'issue-assigned', maxLagMs: 3_600_000 },
    ],
    description: 'Copilot PRs should follow issue assignment within 1 hour'
  },
  {
    effect: 'review-requested',
    expectedCauses: [
      { actor: 'Copilot PR Lifecycle', eventType: 'check-completed', maxLagMs: 300_000 },
    ],
    description: 'Review requests should follow CI completion'
  },
  {
    effect: 'pr-merged',
    expectedCauses: [
      { actor: 'Copilot PR Lifecycle', eventType: 'review-completed', maxLagMs: 300_000 },
      { actor: 'kayodebristol', eventType: 'review-completed', maxLagMs: 86_400_000 },
    ],
    description: 'Merges should follow review completion'
  }
];

/**
 * Known actors in the plures org.
 */
export const knownActors = new Set([
  'kayodebristol',
  'Copilot',
  'copilot-swe-agent[bot]',
  'copilot-pull-request-reviewer[bot]',
  'github-actions[bot]',
  'dependabot[bot]',
  'Copilot PR Lifecycle',
  'Auto Release',
  'tech-doc-writer',
  'qa-cross-repo',
  'Org Anomaly Scanner',
]);
