/**
 * Cloud Relay Types
 *
 * Type definitions for Praxis Cloud Relay service.
 */

type PraxisFact = {
  tag: string;
  payload: unknown;
};

type PraxisEvent = {
  tag: string;
  payload: unknown;
};

/**
 * Cloud relay configuration
 */
export interface CloudRelayConfig {
  /**
   * Azure Function App endpoint URL
   */
  endpoint: string;

  /**
   * GitHub OAuth token for authentication
   */
  authToken?: string;

  /**
   * Application identifier
   */
  appId: string;

  /**
   * Enable automatic sync
   */
  autoSync?: boolean;

  /**
   * Sync interval in milliseconds (default: 5000)
   */
  syncInterval?: number;

  /**
   * Enable encryption for blob storage
   */
  encryption?: boolean;
}

/**
 * Relay connection status
 */
export interface RelayStatus {
  connected: boolean;
  lastSync?: number;
  endpoint: string;
  appId: string;
}

/**
 * CRDT sync message
 */
export interface CRDTSyncMessage {
  /**
   * Message type
   */
  type: 'sync' | 'delta' | 'snapshot';

  /**
   * Application identifier
   */
  appId: string;

  /**
   * Vector clock for causality tracking
   */
  clock: Record<string, number>;

  /**
   * Facts to sync
   */
  facts?: PraxisFact[];

  /**
   * Events to forward
   */
  events?: PraxisEvent[];

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Usage metrics
 */
export interface UsageMetrics {
  /**
   * Application identifier
   */
  appId: string;

  /**
   * Number of sync operations
   */
  syncCount: number;

  /**
   * Number of events forwarded
   */
  eventCount: number;

  /**
   * Number of facts synced
   */
  factCount: number;

  /**
   * Storage used in bytes
   */
  storageBytes: number;

  /**
   * Period start timestamp
   */
  periodStart: number;

  /**
   * Period end timestamp
   */
  periodEnd: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  services: {
    relay: boolean;
    eventGrid: boolean;
    storage: boolean;
    auth: boolean;
  };
}

/**
 * Team member roles for enterprise collaboration
 */
export type TeamRole = 'owner' | 'admin' | 'member';

/**
 * Team member model
 */
export interface TeamMember {
  userId: string;
  role: TeamRole;
  addedAt: number;
  addedBy: string;
}

/**
 * Team model
 */
export interface Team {
  id: string;
  appId: string;
  name: string;
  createdAt: number;
  createdBy: string;
  members: TeamMember[];
}

/**
 * List members API request
 */
export interface ListTeamMembersRequest {
  teamId: string;
  actorId: string;
}

/**
 * Add member API request
 */
export interface AddTeamMemberRequest {
  teamId: string;
  actorId: string;
  userId: string;
  role?: TeamRole;
  appId?: string;
  teamName?: string;
}

/**
 * Remove member API request
 */
export interface RemoveTeamMemberRequest {
  teamId: string;
  actorId: string;
  userId: string;
}

/**
 * Cloud relay client interface
 */
export interface CloudRelayClient {
  /**
   * Connect to the relay
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the relay
   */
  disconnect(): Promise<void>;

  /**
   * Sync facts and events
   */
  sync(message: CRDTSyncMessage): Promise<void>;

  /**
   * Get usage metrics
   */
  getUsage(): Promise<UsageMetrics>;

  /**
   * Get health status
   */
  getHealth(): Promise<HealthCheckResponse>;

  /**
   * List team members
   */
  listTeamMembers(request: ListTeamMembersRequest): Promise<TeamMember[]>;

  /**
   * Add or update a team member
   */
  addTeamMember(request: AddTeamMemberRequest): Promise<TeamMember[]>;

  /**
   * Remove a team member
   */
  removeTeamMember(request: RemoveTeamMemberRequest): Promise<TeamMember[]>;

  /**
   * Get connection status
   */
  getStatus(): RelayStatus;
}

/**
 * GitHub OAuth user info
 */
export interface GitHubUser {
  id: number;
  login: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  token?: string;
  user?: GitHubUser;
  expiresAt?: number;
}
