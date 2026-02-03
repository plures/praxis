/**
 * Gating module for praxis-conversations
 * Applies deterministic gates to candidates before emission
 */

import type { Candidate, GateStatus, GateResult } from './types.js';

/**
 * Gate: Minimum content length
 */
function gateMinimumLength(candidate: Candidate): GateResult {
  const minLength = 50;
  const passed = candidate.body.length >= minLength;
  
  return {
    name: 'minimum-length',
    passed,
    message: passed 
      ? 'Content meets minimum length requirement'
      : `Content too short (${candidate.body.length} < ${minLength} chars)`,
  };
}

/**
 * Gate: Has valid title
 */
function gateValidTitle(candidate: Candidate): GateResult {
  const passed = candidate.title.length > 10 && candidate.title.length < 200;
  
  return {
    name: 'valid-title',
    passed,
    message: passed
      ? 'Title is valid'
      : 'Title length must be between 10 and 200 characters',
  };
}

/**
 * Gate: Not duplicate (simple check based on title)
 * In production, this would check against existing issues
 */
function gateNotDuplicate(_candidate: Candidate): GateResult {
  // For now, always pass - would implement duplicate detection in production
  return {
    name: 'not-duplicate',
    passed: true,
    message: 'Duplicate check passed (stub)',
  };
}

/**
 * Gate: Has metadata
 */
function gateHasMetadata(candidate: Candidate): GateResult {
  const hasLabels = !!(candidate.metadata.labels && candidate.metadata.labels.length > 0);
  const hasPriority = !!candidate.metadata.priority;
  const passed = hasLabels && hasPriority;
  
  return {
    name: 'has-metadata',
    passed,
    message: passed
      ? 'Candidate has required metadata'
      : 'Missing labels or priority in metadata',
  };
}

/**
 * Apply all gates to a candidate
 */
export function applyGates(candidate: Candidate): Candidate {
  const gates: GateResult[] = [
    gateMinimumLength(candidate),
    gateValidTitle(candidate),
    gateNotDuplicate(candidate),
    gateHasMetadata(candidate),
  ];
  
  const allPassed = gates.every(g => g.passed);
  const failedGates = gates.filter(g => !g.passed);
  
  const gateStatus: GateStatus = {
    passed: allPassed,
    reason: allPassed 
      ? 'All gates passed'
      : `Failed gates: ${failedGates.map(g => g.name).join(', ')}`,
    gates,
  };
  
  return {
    ...candidate,
    gateStatus,
  };
}

/**
 * Check if a candidate passed all gates
 */
export function candidatePassed(candidate: Candidate): boolean {
  return candidate.gateStatus?.passed || false;
}
