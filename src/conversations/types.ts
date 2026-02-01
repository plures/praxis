/**
 * TypeScript types for the praxis-conversations subsystem
 */

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationMetadata {
  source?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

export interface Classification {
  category?: string;
  confidence?: number;
  tags?: string[];
}

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

export interface GateResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface GateStatus {
  passed: boolean;
  reason?: string;
  gates?: GateResult[];
}

export interface EmissionResult {
  success: boolean;
  timestamp: string;
  externalId?: string;
  error?: string;
}

export interface CandidateMetadata {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  labels?: string[];
  assignees?: string[];
  source?: {
    conversationId: string;
    timestamp: string;
  };
}

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

export interface PipelineOptions {
  skipRedaction?: boolean;
  skipNormalization?: boolean;
  skipClassification?: boolean;
}

export interface EmitterOptions {
  dryRun?: boolean;
  commitIntent?: boolean;
}

export interface FSEmitterOptions extends EmitterOptions {
  outputDir: string;
}

export interface GitHubEmitterOptions extends EmitterOptions {
  owner: string;
  repo: string;
  token?: string;
}
