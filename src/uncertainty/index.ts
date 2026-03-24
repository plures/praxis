/**
 * Uncertainty Module for Praxis
 * 
 * Provides confidence-scored facts with propagation through inference chains.
 * Integrates with Chronos for causal tracking and PluresDB for persistence.
 * 
 * Core concept: Every fact has a confidence score [0.0, 1.0].
 * When facts depend on other facts, confidence propagates:
 *   confidence(B) ≤ min(confidence(A), confidence(B|A))
 * 
 * Inspired by Bayesian networks but simplified for operational use.
 * 
 * @module @plures/praxis/uncertainty
 */

import { defineRule, defineConstraint, defineModule, RuleResult } from '@plures/praxis';

// ── Types ──────────────────────────────────────────────────────────────────

export interface UncertainFact {
  /** Unique fact identifier */
  id: string;
  /** Human-readable claim */
  claim: string;
  /** Confidence score [0.0, 1.0] */
  confidence: number;
  /** How this fact was established */
  source: 'observation' | 'inference' | 'assumption' | 'verified';
  /** Supporting evidence */
  evidence: Evidence[];
  /** Contradicting evidence */
  contraEvidence: Evidence[];
  /** Fact IDs this depends on */
  dependsOn: string[];
  /** When this fact was last verified */
  lastVerified: string | null;
  /** When this fact was created */
  createdAt: string;
  /** Tags for categorization */
  tags: string[];
}

export interface Evidence {
  /** What was observed */
  observation: string;
  /** When it was observed */
  timestamp: string;
  /** Where it was observed (log, API, manual, etc.) */
  source: string;
  /** How strongly this supports/contradicts the fact [0.0, 1.0] */
  weight: number;
}

export type ConfidenceLevel = 'verified' | 'high' | 'medium' | 'low' | 'speculative';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute confidence level from numeric score.
 */
export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.95) return 'verified';
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  if (score >= 0.3) return 'low';
  return 'speculative';
}

/**
 * Propagate confidence through a dependency chain.
 * Uses the weakest-link principle: confidence(B) ≤ min(deps) × own_confidence
 */
export function propagateConfidence(
  fact: UncertainFact,
  factStore: Map<string, UncertainFact>
): number {
  if (fact.dependsOn.length === 0) return fact.confidence;

  const depConfidences = fact.dependsOn.map(depId => {
    const dep = factStore.get(depId);
    if (!dep) return 0; // Missing dependency = zero confidence
    return propagateConfidence(dep, factStore);
  });

  const minDep = Math.min(...depConfidences);
  return Math.min(fact.confidence, minDep * fact.confidence);
}

/**
 * Compute fact confidence from evidence using a simple Bayesian update.
 * Prior: 0.5 (maximum ignorance)
 * Each piece of evidence shifts the posterior.
 */
export function computeConfidenceFromEvidence(
  evidence: Evidence[],
  contraEvidence: Evidence[]
): number {
  let logOdds = 0; // log-odds of prior 0.5 = 0

  for (const e of evidence) {
    logOdds += Math.log(e.weight / (1 - Math.min(e.weight, 0.999)));
  }
  for (const e of contraEvidence) {
    logOdds -= Math.log(e.weight / (1 - Math.min(e.weight, 0.999)));
  }

  // Convert log-odds back to probability
  const odds = Math.exp(logOdds);
  return odds / (1 + odds);
}

// ── Events ─────────────────────────────────────────────────────────────────

export const FACT_ASSERTED = 'praxis.uncertainty.factAsserted';
export const FACT_CHALLENGED = 'praxis.uncertainty.factChallenged';
export const CONFIDENCE_DEGRADED = 'praxis.uncertainty.confidenceDegraded';
export const ANOMALY_DETECTED = 'praxis.uncertainty.anomalyDetected';

// ── Rules ──────────────────────────────────────────────────────────────────

/**
 * Confidence degradation rule.
 * 
 * When a fact's confidence drops below a threshold, emit warnings
 * for all facts that depend on it.
 */
export const confidenceDegradationRule = defineRule({
  id: 'praxis.uncertainty.confidenceDegradation',
  description: 'Propagate confidence drops through dependency chains',
  eventTypes: FACT_CHALLENGED,
  contract: {
    ruleId: 'praxis.uncertainty.confidenceDegradation',
    behavior: 'When a fact loses confidence, all dependent facts are flagged',
    examples: [
      {
        given: 'Fact A (confidence 0.9) supports Fact B (confidence 0.8)',
        when: 'Fact A challenged, drops to 0.3',
        then: 'Fact B flagged with degraded confidence 0.24'
      },
      {
        given: 'Fact A (confidence 0.95) with no dependents',
        when: 'Fact A challenged, drops to 0.7',
        then: 'Warning emitted, no cascading effects'
      }
    ],
    invariants: [
      'Propagated confidence never exceeds the minimum dependency confidence',
      'Every degradation must identify the root fact that was challenged'
    ]
  },
  impl: (state, events) => {
    const event = events.find(e => e.tag === FACT_CHALLENGED);
    if (!event) return RuleResult.skip('No challenge event');

    const { factId, newConfidence, reason } = event.payload;
    const factStore = state.context?.factStore as Map<string, UncertainFact> | undefined;
    if (!factStore) return RuleResult.skip('No fact store in context');

    const fact = factStore.get(factId);
    if (!fact) return RuleResult.skip(`Fact ${factId} not found`);

    const emissions = [];

    // Find all facts that depend on this one
    for (const [id, f] of factStore) {
      if (f.dependsOn.includes(factId)) {
        const oldEffective = propagateConfidence(f, factStore);
        // Simulate the update
        const tempFact = { ...fact, confidence: newConfidence };
        const tempStore = new Map(factStore);
        tempStore.set(factId, tempFact);
        const newEffective = propagateConfidence(f, tempStore);

        if (newEffective < oldEffective) {
          emissions.push({
            tag: CONFIDENCE_DEGRADED,
            payload: {
              factId: id,
              claim: f.claim,
              oldConfidence: oldEffective,
              newConfidence: newEffective,
              rootCause: factId,
              rootReason: reason,
              level: confidenceLevel(newEffective),
              message: `Confidence in "${f.claim}" degraded from ${(oldEffective * 100).toFixed(0)}% to ${(newEffective * 100).toFixed(0)}% due to challenge on "${fact.claim}"`
            }
          });
        }
      }
    }

    if (emissions.length > 0) {
      return RuleResult.emit(emissions);
    }
    return RuleResult.noop('No dependent facts affected');
  }
});

/**
 * Expectation violation anomaly rule.
 * 
 * When an observation contradicts our expectations, detect it as an anomaly.
 * This is how we'd catch a rogue actor: expected behavior doesn't match observed.
 */
export const expectationAnomalyRule = defineRule({
  id: 'praxis.uncertainty.expectationAnomaly',
  description: 'Detect when observations contradict declared expectations',
  eventTypes: FACT_ASSERTED,
  contract: {
    ruleId: 'praxis.uncertainty.expectationAnomaly',
    behavior: 'Cross-references new facts against expectations to detect anomalies',
    examples: [
      {
        given: 'Expectation: only queue-advance assigns Copilot',
        when: 'Observation: Copilot assigned by unknown workflow',
        then: 'Anomaly emitted with details'
      }
    ],
    invariants: [
      'Every anomaly must reference the violated expectation',
      'Anomalies include the contradicting evidence'
    ]
  },
  impl: (state, events) => {
    const event = events.find(e => e.tag === FACT_ASSERTED);
    if (!event) return RuleResult.skip('No assertion event');

    const { fact } = event.payload;
    const expectations = state.context?.expectations as Array<{
      id: string;
      claim: string;
      conditions: Array<{ type: string; description: string }>;
    }> | undefined;

    if (!expectations) return RuleResult.skip('No expectations in context');

    const anomalies = [];
    for (const exp of expectations) {
      for (const cond of exp.conditions) {
        if (cond.type === 'never' && fact.claim.includes(cond.description)) {
          anomalies.push({
            tag: ANOMALY_DETECTED,
            payload: {
              expectationId: exp.id,
              expectationClaim: exp.claim,
              violatedCondition: cond,
              contradictingFact: fact,
              message: `ANOMALY: "${fact.claim}" violates expectation "${exp.claim}" (never: ${cond.description})`
            }
          });
        }
      }
    }

    if (anomalies.length > 0) {
      return RuleResult.emit(anomalies);
    }
    return RuleResult.noop('Fact consistent with expectations');
  }
});

// ── Constraints ────────────────────────────────────────────────────────────

/**
 * No high-confidence claims without evidence.
 */
export const evidenceRequiredConstraint = defineConstraint({
  id: 'praxis.uncertainty.evidenceRequired',
  description: 'Facts with confidence > 0.8 must have at least one piece of evidence',
  contract: {
    ruleId: 'praxis.uncertainty.evidenceRequired',
    behavior: 'Prevents high-confidence claims without supporting evidence',
    examples: [
      { given: 'fact with confidence 0.9 and 2 evidence items', when: 'checked', then: 'passes' },
      { given: 'fact with confidence 0.9 and 0 evidence items', when: 'checked', then: 'violation' }
    ],
    invariants: ['High confidence requires evidence — no exceptions']
  },
  impl: (state) => {
    const factStore = state.context?.factStore as Map<string, UncertainFact> | undefined;
    if (!factStore) return true;

    const violations = [];
    for (const [id, fact] of factStore) {
      if (fact.confidence > 0.8 && fact.evidence.length === 0 && fact.source !== 'verified') {
        violations.push(id);
      }
    }

    if (violations.length > 0) {
      return `High-confidence facts without evidence: ${violations.join(', ')}`;
    }
    return true;
  }
});

// ── Module ─────────────────────────────────────────────────────────────────

export const uncertaintyModule = defineModule({
  rules: [confidenceDegradationRule, expectationAnomalyRule],
  constraints: [evidenceRequiredConstraint],
  meta: { domain: 'uncertainty', version: '1.0.0' }
});
