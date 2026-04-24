/**
 * Cloud Relay Client
 *
 * Client for connecting to Praxis Cloud Relay service (Azure-based).
 */

import type {
  AddTeamMemberRequest,
  CloudRelayConfig,
  CloudRelayClient,
  RelayStatus,
  CRDTSyncMessage,
  UsageMetrics,
  HealthCheckResponse,
  ListTeamMembersRequest,
  RemoveTeamMemberRequest,
  TeamMember,
} from './types.js';

/**
 * Create a cloud relay client
 *
 * @param config - Cloud relay configuration including endpoint URL and authentication details
 * @returns A new {@link CloudRelayClient} connected to the specified endpoint
 */
export function createCloudRelay(config: CloudRelayConfig): CloudRelayClient {
  const status: RelayStatus = {
    connected: false,
    endpoint: config.endpoint,
    appId: config.appId,
  };

  let syncTimer: NodeJS.Timeout | null = null;
  const vectorClock: Record<string, number> = {};

  return {
    async connect(): Promise<void> {
      // Validate endpoint
      if (!config.endpoint) {
        throw new Error('Cloud relay endpoint is required');
      }

      // Test connection
      try {
        const response = await fetch(`${config.endpoint}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authToken && {
              Authorization: `Bearer ${config.authToken}`,
            }),
          },
        });

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.statusText}`);
        }

        status.connected = true;
        status.lastSync = Date.now();

        // Start auto-sync if enabled
        if (config.autoSync) {
          const interval = config.syncInterval || 5000;
          syncTimer = setInterval(() => {
            // Auto-sync logic would go here
            // For now, just update lastSync
            status.lastSync = Date.now();
          }, interval);
        }
      } catch (error) {
        status.connected = false;
        throw new Error(
          `Failed to connect to cloud relay: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async disconnect(): Promise<void> {
      if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
      }
      status.connected = false;
    },

    async sync(message: CRDTSyncMessage): Promise<void> {
      if (!status.connected) {
        throw new Error('Not connected to cloud relay');
      }

      // Update vector clock
      vectorClock[config.appId] = (vectorClock[config.appId] || 0) + 1;
      message.clock = { ...vectorClock };

      try {
        const response = await fetch(`${config.endpoint}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authToken && {
              Authorization: `Bearer ${config.authToken}`,
            }),
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        status.lastSync = Date.now();

        // Merge received vector clock
        const result = (await response.json()) as { clock?: Record<string, number> };
        if (result.clock) {
          Object.entries(result.clock).forEach(([key, value]) => {
            vectorClock[key] = Math.max(vectorClock[key] || 0, value as number);
          });
        }
      } catch (error) {
        throw new Error(
          `Failed to sync: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async getUsage(): Promise<UsageMetrics> {
      if (!status.connected) {
        throw new Error('Not connected to cloud relay');
      }

      try {
        const response = await fetch(`${config.endpoint}/usage?appId=${config.appId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authToken && {
              Authorization: `Bearer ${config.authToken}`,
            }),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get usage: ${response.statusText}`);
        }

        return (await response.json()) as UsageMetrics;
      } catch (error) {
        throw new Error(
          `Failed to get usage metrics: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async getHealth(): Promise<HealthCheckResponse> {
      try {
        const response = await fetch(`${config.endpoint}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.statusText}`);
        }

        return (await response.json()) as HealthCheckResponse;
      } catch (error) {
        throw new Error(
          `Failed to get health status: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async listTeamMembers(request: ListTeamMembersRequest): Promise<TeamMember[]> {
      if (!status.connected) {
        throw new Error('Not connected to cloud relay');
      }

      const query = new URLSearchParams({
        teamId: request.teamId,
        actorId: request.actorId,
      });

      try {
        const response = await fetch(`${config.endpoint}/teams/members?${query.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authToken && {
              Authorization: `Bearer ${config.authToken}`,
            }),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list team members: ${response.statusText}`);
        }

        const result = (await response.json()) as { members: TeamMember[] };
        return result.members;
      } catch (error) {
        throw new Error(
          `Failed to list team members: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async addTeamMember(request: AddTeamMemberRequest): Promise<TeamMember[]> {
      if (!status.connected) {
        throw new Error('Not connected to cloud relay');
      }

      try {
        const response = await fetch(`${config.endpoint}/teams/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authToken && {
              Authorization: `Bearer ${config.authToken}`,
            }),
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Failed to add team member: ${response.statusText}`);
        }

        const result = (await response.json()) as { members: TeamMember[] };
        return result.members;
      } catch (error) {
        throw new Error(
          `Failed to add team member: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async removeTeamMember(request: RemoveTeamMemberRequest): Promise<TeamMember[]> {
      if (!status.connected) {
        throw new Error('Not connected to cloud relay');
      }

      try {
        const response = await fetch(`${config.endpoint}/teams/members`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authToken && {
              Authorization: `Bearer ${config.authToken}`,
            }),
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Failed to remove team member: ${response.statusText}`);
        }

        const result = (await response.json()) as { members: TeamMember[] };
        return result.members;
      } catch (error) {
        throw new Error(
          `Failed to remove team member: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    getStatus(): RelayStatus {
      return { ...status };
    },
  };
}

/**
 * Connect to Praxis Cloud Relay
 *
 * @param endpoint - Azure Function App endpoint URL
 * @param options - Additional configuration options
 * @returns Cloud relay client instance
 *
 * @example
 * ```typescript
 * import { connectRelay } from "@plures/praxis/cloud";
 *
 * const relay = await connectRelay("https://my-app.azurewebsites.net", {
 *   appId: "my-app",
 *   authToken: "github-token",
 *   autoSync: true
 * });
 *
 * // Sync data
 * await relay.sync({
 *   type: "delta",
 *   appId: "my-app",
 *   clock: {},
 *   facts: [...],
 *   timestamp: Date.now()
 * });
 * ```
 */
export async function connectRelay(
  endpoint: string,
  options: Omit<CloudRelayConfig, 'endpoint'> = { appId: 'default' }
): Promise<CloudRelayClient> {
  const config: CloudRelayConfig = {
    endpoint,
    ...options,
  };

  const client = createCloudRelay(config);
  await client.connect();
  return client;
}
