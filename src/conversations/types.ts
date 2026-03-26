/**
 * TypeScript types for the praxis-conversations subsystem
 */

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Metadata attached to a conversation (source, user, session, tags). */
export interface ConversationMetadata {
  source?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

/** Classification result for a conversation — category, confidence, and tags. */
export interface Classification {
  category?: string;
  confidence?: number;
  tags?: string[];
}

/** A full conversation record with turns, metadata, and processing state. */
export interface Conversation {
  id: string;
  timestamp: string;
  turns: ConversationTurn[];
  metadata: ConversationMetadata;
  redacted?: boolean;
  normalized?: boolean;
  classified?: boolean;
  classification?: Classification;
}

/** Result of a single gate evaluation — whether the gate passed and why. */
export interface GateResult {
  name: string;
  passed: boolean;
  message?: string;
}

/** Aggregated gate status for a conversation — did all gates pass? */
export interface GateStatus {
  passed: boolean;
  reason?: string;
  gates?: GateResult[];
}

/** Result of emitting a candidate to an external system (GitHub, filesystem, etc.). */
export interface EmissionResult {
  success: boolean;
  timestamp: string;
  externalId?: string;
  error?: string;
}

/** Priority, labels, and routing metadata for a derived candidate. */
export interface CandidateMetadata {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  labels?: string[];
  assignees?: string[];
  source?: {
    conversationId: string;
    timestamp: string;
  };
}

/** A candidate work item (issue, PR, doc update) derived from a conversation. */
export interface Candidate {
  id: string;
  conversationId: string;
  type: 'github-issue' | 'github-pr' | 'documentation' | 'feature-request' | 'bug-report';
  title: string;
  body: string;
  metadata: CandidateMetadata;
  gateStatus?: GateStatus;
  emitted?: boolean;
  emissionResult?: EmissionResult;
}

/** Options for the conversation processing pipeline (skip stages selectively). */
export interface PipelineOptions {
  skipRedaction?: boolean;
  skipNormalization?: boolean;
  skipClassification?: boolean;
}

/** Base options for all candidate emitters. */
export interface EmitterOptions {
  dryRun?: boolean;
  commitIntent?: boolean;
}

/** Options for the filesystem-based candidate emitter. */
export interface FSEmitterOptions extends EmitterOptions {
  outputDir: string;
}

/** Options for the GitHub-based candidate emitter (creates issues/PRs). */
export interface GitHubEmitterOptions extends EmitterOptions {
  owner: string;
  repo: string;
  token?: string;
}
