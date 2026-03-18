/**
 * Chronicle Module
 *
 * Causal graph tracking for Praxis state transitions.
 * Records every storeFact / appendEvent call as a Chronicle node in PluresDB,
 * enabling full observability, auditing, and training data extraction.
 *
 * @example
 * ```typescript
 * import { createInMemoryDB } from '@plures/praxis';
 * import { createChronicle, createChronosMcpTools, ChronicleContext } from '@plures/praxis';
 *
 * const db = createInMemoryDB();
 * const chronicle = createChronicle(db);
 * const store = createPraxisDBStore(db, registry).withChronicle(chronicle);
 *
 * // Attribute changes to a causal span
 * await ChronicleContext.runAsync(
 *   { spanId: 'route-msg-1', contextId: 'session-abc' },
 *   () => store.storeFact({ tag: 'RouteDecision', payload: { route: 'fast-path' } })
 * );
 *
 * // Trace causality backward from any node
 * const tools = createChronosMcpTools(chronicle);
 * const { data } = await tools.trace({ nodeId: '...', direction: 'backward' });
 * ```
 */

// Types
export type {
  TraceDirection,
  EdgeType,
  ChronicleEvent,
  ChronicleNode,
  ChronicleEdge,
} from './types.js';

// Context propagation
export { ChronicleContext } from './context.js';
export type { ChronicleSpan } from './context.js';

// Chronicle interface and PluresDB implementation
export type { Chronicle } from './chronicle.js';
export { PluresDbChronicle, createChronicle, CHRONICLE_PATHS } from './chronicle.js';

// MCP tools
export type {
  ChronosTraceParams,
  ChronosSearchParams,
  McpToolResult,
  ChronosMcpTools,
} from './mcp.js';
export { createChronosMcpTools } from './mcp.js';
