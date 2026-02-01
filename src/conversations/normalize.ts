/**
 * Normalization module for praxis-conversations
 * Handles normalization of conversation content (deterministic)
 */

import type { Conversation } from './types.js';

/**
 * Normalize whitespace in text
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, '  ') // Replace tabs with spaces
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
}

/**
 * Normalize code blocks
 */
function normalizeCodeBlocks(text: string): string {
  // Ensure code blocks have consistent formatting
  return text.replace(/```(\w+)?\n/g, (match, lang) => {
    return lang ? `\`\`\`${lang.toLowerCase()}\n` : '```\n';
  });
}

/**
 * Normalize a single conversation turn
 */
function normalizeTurn(content: string): string {
  let normalized = content;
  normalized = normalizeWhitespace(normalized);
  normalized = normalizeCodeBlocks(normalized);
  return normalized;
}

/**
 * Normalize a conversation
 */
export function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    turns: conversation.turns.map(turn => ({
      ...turn,
      content: normalizeTurn(turn.content),
    })),
    normalized: true,
  };
}
