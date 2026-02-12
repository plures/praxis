/**
 * Redaction module for praxis-conversations
 * Handles PII redaction from conversations (deterministic patterns only)
 */

import type { Conversation } from './types.js';

/**
 * Deterministic PII patterns to redact
 * Note: These patterns prioritize safety over precision
 * - IP pattern: matches sequences like XXX.XXX.XXX.XXX (may match invalid IPs)
 * - Card pattern: matches 16-digit sequences (does not validate with Luhn algorithm)
 */
const PII_PATTERNS = [
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  // Phone numbers (simple patterns)
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  // Credit card numbers (basic pattern - intentionally broad for safety)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  // SSN pattern
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  // IP addresses (basic pattern - may match invalid IPs like 999.999.999.999)
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_REDACTED]' },
];

/**
 * Redact PII from a text string using deterministic patterns
 */
export function redactText(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

/**
 * Redact PII from a conversation
 */
export function redactConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    turns: conversation.turns.map(turn => ({
      ...turn,
      content: redactText(turn.content),
    })),
    metadata: {
      ...conversation.metadata,
      // Redact userId if it looks like an email
      userId: conversation.metadata.userId 
        ? redactText(conversation.metadata.userId)
        : undefined,
    },
    redacted: true,
  };
}
