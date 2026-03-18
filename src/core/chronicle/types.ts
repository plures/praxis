/**
 * Chronicle Types
 *
 * Core types for the Chronicle causal tracking system.
 * Records state transitions as a causal graph stored in PluresDB.
 */

/**
 * Direction for traversing causal chains.
 */
export type TraceDirection = 'backward' | 'forward' | 'both';

/**
 * Causal relationship type between Chronicle nodes.
 * - `causes`: node A caused node B (explicit causal link)
 * - `context`: node B belongs to the same session/request as node A
 * - `follows`: node B happened after node A in the same context
 */
export type EdgeType = 'causes' | 'context' | 'follows';

/**
 * A recorded state transition event passed to Chronicle.
 */
export interface ChronicleEvent {
  /** Path to the changed value (fact or event stream path) */
  path: string;
  /** Value before the change (undefined for creates) */
  before?: unknown;
  /** Value after the change */
  after?: unknown;
  /** Parent span/node ID that caused this change */
  cause?: string;
  /** Session or request ID grouping related changes */
  context?: string;
  /** Additional metadata key-value pairs */
  metadata: Record<string, string>;
}

/**
 * A Chronicle node representing a single recorded state transition.
 */
export interface ChronicleNode {
  /** Unique node ID: `chronos:{timestamp}-{counter}` */
  id: string;
  /** Timestamp (ms since epoch) when this node was recorded */
  timestamp: number;
  /** The recorded state transition */
  event: ChronicleEvent;
}

/**
 * A directed edge in the causal graph connecting two Chronicle nodes.
 */
export interface ChronicleEdge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Type of causal relationship */
  type: EdgeType;
}
