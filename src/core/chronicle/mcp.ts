/**
 * Chronicle MCP Tools
 *
 * Exposes Chronicle query functionality as MCP-compatible tool handlers.
 * Register these tools with any MCP server to surface Chronos querying
 * capabilities for troubleshooting, auditing, and AI training data extraction.
 *
 * @example
 * ```typescript
 * const chronicle = createChronicle(db);
 * const tools = createChronosMcpTools(chronicle);
 *
 * // MCP server registration (framework-agnostic)
 * server.registerTool('chronos.trace', tools.trace);
 * server.registerTool('chronos.search', tools.search);
 * ```
 */

import type { Chronicle } from './chronicle.js';
import type { ChronicleNode, TraceDirection } from './types.js';

/**
 * Parameters for the `chronos.trace` MCP tool.
 */
export interface ChronosTraceParams {
  /** ID of the Chronicle node to start tracing from */
  nodeId: string;
  /** Direction to traverse the causal graph (default: `'backward'`) */
  direction?: TraceDirection;
  /** Maximum traversal depth (default: 10) */
  maxDepth?: number;
}

/**
 * Parameters for the `chronos.search` MCP tool.
 */
export interface ChronosSearchParams {
  /** Search query matched against node paths, metadata, and serialised payloads */
  query: string;
  /** Optional context ID — restricts search to a single session/request subgraph */
  contextId?: string;
  /** Inclusive start timestamp in ms (default: 0) */
  since?: number;
  /** Inclusive end timestamp in ms (default: now) */
  until?: number;
  /** Maximum number of results (default: no limit) */
  limit?: number;
}

/**
 * Uniform result envelope for MCP tool calls.
 */
export interface McpToolResult<T> {
  /** Whether the tool call succeeded */
  success: boolean;
  /** Returned data (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
}

/**
 * Chronos MCP tools bound to a Chronicle instance.
 */
export interface ChronosMcpTools {
  /**
   * `chronos.trace` — trace causality backward/forward from a Chronicle node.
   */
  trace(params: ChronosTraceParams): Promise<McpToolResult<ChronicleNode[]>>;

  /**
   * `chronos.search` — search Chronicle nodes by path, metadata, or payload content.
   */
  search(params: ChronosSearchParams): Promise<McpToolResult<ChronicleNode[]>>;
}

/**
 * Create Chronos MCP tools bound to a Chronicle instance.
 *
 * @param chronicle Chronicle instance to query
 * @returns Object with `trace` and `search` tool handlers
 */
export function createChronosMcpTools(chronicle: Chronicle): ChronosMcpTools {
  return {
    async trace(params: ChronosTraceParams): Promise<McpToolResult<ChronicleNode[]>> {
      try {
        const nodes = await chronicle.trace(
          params.nodeId,
          params.direction ?? 'backward',
          params.maxDepth ?? 10
        );
        return { success: true, data: nodes };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },

    async search(params: ChronosSearchParams): Promise<McpToolResult<ChronicleNode[]>> {
      try {
        const query = params.query.toLowerCase();

        let candidates: ChronicleNode[];
        if (params.contextId) {
          candidates = await chronicle.subgraph(params.contextId);
        } else {
          candidates = await chronicle.range(params.since ?? 0, params.until ?? Date.now());
        }

        // Full-text match against path, metadata values, and serialised after/before payloads.
        // NOTE: This is a linear scan suitable for development and moderate datasets.
        // For production use at scale, consider building a search index in PluresDB.
        const filtered = candidates.filter((node) => {
          const inPath = node.event.path.toLowerCase().includes(query);
          const inMeta = Object.values(node.event.metadata).some((v) =>
            v.toLowerCase().includes(query)
          );
          const inAfter = JSON.stringify(node.event.after ?? '').toLowerCase().includes(query);
          const inBefore = JSON.stringify(node.event.before ?? '').toLowerCase().includes(query);
          return inPath || inMeta || inAfter || inBefore;
        });

        const limited = params.limit !== undefined ? filtered.slice(0, params.limit) : filtered;
        return { success: true, data: limited };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
