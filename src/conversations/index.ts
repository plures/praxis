/**
 * Praxis Conversations Subsystem
 * 
 * Deterministic-first conversation ingestion pipeline:
 * capture -> redact -> normalize -> classify -> candidates -> gate -> emit
 */

export * from './types.js';
export * from './capture.js';
export * from './redact.js';
export * from './normalize.js';
export * from './classify.js';
export * from './candidates.js';
export * from './gate.js';

// Emitters
export * from './emitters/fs.js';
export * from './emitters/github.js';

// Re-export main pipeline functions
export { captureConversation, loadConversation, serializeConversation } from './capture.js';
export { redactConversation, redactText } from './redact.js';
export { normalizeConversation } from './normalize.js';
export { classifyConversation } from './classify.js';
export { generateCandidate } from './candidates.js';
export { applyGates, candidatePassed } from './gate.js';
export { emitToFS } from './emitters/fs.js';
export { emitToGitHub } from './emitters/github.js';
