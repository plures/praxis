/**
 * Capture module for praxis-conversations
 * Handles capturing conversations from various sources
 */

import type { Conversation } from './types.js';
import { randomUUID } from 'node:crypto';

/**
 * Capture a conversation from raw input
 */
export function captureConversation(input: {
  turns: Array<{ role: string; content: string; timestamp?: string }>;
  metadata?: Record<string, unknown>;
}): Conversation {
  const now = new Date().toISOString();
  
  return {
    id: randomUUID(),
    timestamp: now,
    turns: input.turns.map(turn => ({
      role: turn.role as 'user' | 'assistant' | 'system',
      content: turn.content,
      timestamp: turn.timestamp || now,
      metadata: {},
    })),
    metadata: {
      source: (input.metadata?.source as string) || 'unknown',
      userId: input.metadata?.userId as string,
      sessionId: input.metadata?.sessionId as string,
      tags: (input.metadata?.tags as string[]) || [],
    },
    redacted: false,
    normalized: false,
    classified: false,
  };
}

/**
 * Load a conversation from JSON
 */
export function loadConversation(json: string): Conversation {
  const data = JSON.parse(json);
  // Basic validation
  if (!data.id || !data.timestamp || !data.turns || !data.metadata) {
    throw new Error('Invalid conversation JSON: missing required fields');
  }
  return data as Conversation;
}

/**
 * Serialize a conversation to JSON
 */
export function serializeConversation(conversation: Conversation): string {
  return JSON.stringify(conversation, null, 2);
}
