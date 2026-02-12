/**
 * Candidates module for praxis-conversations
 * Generates emission candidates from classified conversations
 */

import type { Conversation, Candidate, CandidateMetadata } from './types.js';
import { randomUUID } from 'node:crypto';

/**
 * Generate a candidate from a conversation
 */
export function generateCandidate(conversation: Conversation): Candidate | null {
  if (!conversation.classified || !conversation.classification) {
    throw new Error('Conversation must be classified before generating candidates');
  }
  
  const { classification } = conversation;
  
  // Determine candidate type based on classification
  let type: Candidate['type'] = 'documentation';
  if (classification.category === 'bug-report') {
    type = 'github-issue';
  } else if (classification.category === 'feature-request') {
    type = 'github-issue';
  } else if (classification.category === 'documentation') {
    type = 'documentation';
  }
  
  // Generate title from first user turn
  const firstUserTurn = conversation.turns.find(t => t.role === 'user');
  if (!firstUserTurn) {
    return null; // No user input to generate candidate from
  }
  
  const title = generateTitle(firstUserTurn.content, classification.category);
  const body = generateBody(conversation);
  
  // Determine priority
  let priority: CandidateMetadata['priority'] = 'medium';
  if (classification.category === 'bug-report' && (classification.confidence ?? 0) > 0.7) {
    priority = 'high';
  }
  
  // Deduplicate labels using Set for O(n) performance
  const labels = [...new Set([classification.category, ...(classification.tags || [])].filter((label): label is string => label !== undefined))];
  
  return {
    id: randomUUID(),
    conversationId: conversation.id,
    type,
    title,
    body,
    metadata: {
      priority,
      labels,
      source: {
        conversationId: conversation.id,
        timestamp: conversation.timestamp,
      },
    },
    emitted: false,
  };
}

/**
 * Generate a title from content
 */
function generateTitle(content: string, category?: string): string {
  // Take first line or first sentence, max 80 chars
  const firstLine = content.split('\n')[0].trim();
  const firstSentence = firstLine.split(/[.!?]/)[0].trim();
  
  let title = firstSentence.substring(0, 80);
  if (firstSentence.length > 80) {
    title += '...';
  }
  
  // Add category prefix if available
  if (category && category !== 'unknown') {
    const prefix = category.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    title = `[${prefix}] ${title}`;
  }
  
  return title;
}

/**
 * Generate body from conversation
 */
function generateBody(conversation: Conversation): string {
  const parts: string[] = [];
  
  // Add conversation summary
  parts.push('## Conversation Summary\n');
  
  for (const turn of conversation.turns) {
    const roleName = turn.role.charAt(0).toUpperCase() + turn.role.slice(1);
    parts.push(`**${roleName}:**\n${turn.content}\n`);
  }
  
  // Add metadata
  if (conversation.classification) {
    parts.push(`\n## Classification\n`);
    parts.push(`- Category: ${conversation.classification.category}`);
    parts.push(`- Confidence: ${(conversation.classification.confidence || 0).toFixed(2)}`);
    if (conversation.classification.tags && conversation.classification.tags.length > 0) {
      parts.push(`- Tags: ${conversation.classification.tags.join(', ')}`);
    }
  }
  
  parts.push(`\n---\n*Generated from conversation ${conversation.id}*`);
  
  return parts.join('\n');
}
