/**
 * Classification module for praxis-conversations
 * Handles deterministic classification of conversations (no LLM)
 */

import type { Conversation, Classification } from './types.js';

/**
 * Deterministic keyword-based classification rules
 */
const CLASSIFICATION_RULES = [
  {
    category: 'bug-report',
    keywords: ['bug', 'error', 'crash', 'broken', 'issue', 'problem', 'fail', 'exception'],
    weight: 1.0,
  },
  {
    category: 'feature-request',
    keywords: ['feature', 'enhancement', 'add', 'support', 'implement', 'would like', 'could you'],
    weight: 1.0,
  },
  {
    category: 'question',
    keywords: ['how', 'what', 'why', 'when', 'where', '?', 'help', 'question'],
    weight: 0.8,
  },
  {
    category: 'documentation',
    keywords: ['docs', 'documentation', 'readme', 'guide', 'tutorial', 'example'],
    weight: 0.9,
  },
  {
    category: 'performance',
    keywords: ['slow', 'performance', 'optimize', 'speed', 'memory', 'cpu'],
    weight: 1.0,
  },
];

/**
 * Extract keywords from text (simple tokenization)
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 2);
}

/**
 * Calculate classification scores for a conversation
 */
function calculateScores(conversation: Conversation): Record<string, number> {
  const scores: Record<string, number> = {};
  
  // Combine all turn content
  const allContent = conversation.turns
    .map(t => t.content)
    .join(' ');
  
  const keywords = extractKeywords(allContent);
  const keywordSet = new Set(keywords);
  
  for (const rule of CLASSIFICATION_RULES) {
    let matchCount = 0;
    for (const keyword of rule.keywords) {
      if (keywordSet.has(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      scores[rule.category] = (matchCount / rule.keywords.length) * rule.weight;
    }
  }
  
  return scores;
}

/**
 * Classify a conversation using deterministic keyword matching
 */
export function classifyConversation(conversation: Conversation): Conversation {
  const scores = calculateScores(conversation);
  
  // Find the highest scoring category
  let bestCategory = 'unknown';
  let bestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  
  const classification: Classification = {
    category: bestCategory,
    confidence: Math.min(bestScore, 1.0),
    tags: Object.entries(scores)
      .filter(([_, score]) => score > 0.3)
      .map(([category]) => category),
  };
  
  return {
    ...conversation,
    classification,
    classified: true,
  };
}
