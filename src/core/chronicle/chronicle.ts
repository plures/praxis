/**
 * Chronicle Interface and PluresDbChronicle Implementation
 *
 * Records state transitions as a causal graph in PluresDB.
 * Attached to PraxisDBStore via `.withChronicle()` for zero-effort observability.
 */

import type { PraxisDB } from '../pluresdb/adapter.js';
import type { ChronicleEvent, ChronicleEdge, ChronicleNode, EdgeType, TraceDirection } from './types.js';

/**
 * Storage path constants for Chronicle data in PluresDB.
 *
 * Layout:
 * - `/_praxis/chronos/nodes/{nodeId}` — ChronicleNode documents
 * - `/_praxis/chronos/edges/out/{nodeId}` — outgoing ChronicleEdge arrays
 * - `/_praxis/chronos/edges/in/{nodeId}` — incoming ChronicleEdge arrays
 * - `/_praxis/chronos/context/{contextId}` — ordered nodeId arrays per context
 * - `/_praxis/chronos/index` — global ordered nodeId array (for range queries)
 */
export const CHRONICLE_PATHS = {
  BASE: '/_praxis/chronos',
  NODES: '/_praxis/chronos/nodes',
  EDGES_OUT: '/_praxis/chronos/edges/out',
  EDGES_IN: '/_praxis/chronos/edges/in',
  CONTEXT: '/_praxis/chronos/context',
  INDEX: '/_praxis/chronos/index',
} as const;

/**
 * Chronicle interface — records state transitions as a causal graph.
 *
 * Automatically attached to any PraxisDBStore at runtime via `.withChronicle()`.
 * Records state diffs as graph nodes with causal edges.
 */
export interface Chronicle {
  /**
   * Record a state transition and return the created node.
   */
  record(event: ChronicleEvent): Promise<ChronicleNode>;

  /**
   * Trace causality backward or forward from a node.
   *
   * @param nodeId Starting node ID
   * @param direction `'backward'` follows incoming edges, `'forward'` follows outgoing edges
   * @param maxDepth Maximum traversal depth (prevents cycles / infinite loops)
   */
  trace(nodeId: string, direction: TraceDirection, maxDepth: number): Promise<ChronicleNode[]>;

  /**
   * Return all Chronicle nodes recorded within a timestamp range.
   *
   * @param start Inclusive start timestamp (ms)
   * @param end Inclusive end timestamp (ms)
   */
  range(start: number, end: number): Promise<ChronicleNode[]>;

  /**
   * Return all Chronicle nodes belonging to a context (session/request).
   *
   * @param contextId The context identifier
   */
  subgraph(contextId: string): Promise<ChronicleNode[]>;
}

/**
 * Monotonically-increasing counter for unique node IDs within a process.
 *
 * Node.js is single-threaded: the pre-increment here is atomic within a
 * turn of the event loop, so this counter produces unique IDs for all
 * concurrent async operations within a single process.
 */
let _nodeCounter = 0;

/**
 * PluresDB-backed implementation of the Chronicle interface.
 *
 * Stores causal graph nodes and edges in PluresDB under `/_praxis/chronos/`.
 * Shares the same PluresDB instance as PraxisDBStore so the JS Chronos UI
 * can read from the same data layer.
 *
 * @example
 * ```typescript
 * const db = createInMemoryDB();
 * const chronicle = new PluresDbChronicle(db);
 *
 * const store = createPraxisDBStore(db, registry).withChronicle(chronicle);
 * // All storeFact / appendEvent calls are now recorded automatically.
 * ```
 */
export class PluresDbChronicle implements Chronicle {
  private readonly db: PraxisDB;

  constructor(db: PraxisDB) {
    this.db = db;
  }

  async record(event: ChronicleEvent): Promise<ChronicleNode> {
    const timestamp = Date.now();
    const id = `chronos:${timestamp}-${++_nodeCounter}`;

    const node: ChronicleNode = { id, timestamp, event };

    // Persist the node document
    await this.db.set(`${CHRONICLE_PATHS.NODES}/${id}`, node);

    // Update global time-ordered index
    const index = (await this.db.get<string[]>(CHRONICLE_PATHS.INDEX)) ?? [];
    await this.db.set(CHRONICLE_PATHS.INDEX, [...index, id]);

    // If this change was caused by a known span, create a 'causes' edge
    if (event.cause) {
      await this.addEdge(event.cause, id, 'causes');
    }

    // If this change belongs to a context, maintain per-context ordering
    if (event.context) {
      const contextPath = `${CHRONICLE_PATHS.CONTEXT}/${event.context}`;
      const contextNodes = (await this.db.get<string[]>(contextPath)) ?? [];

      // Link to the previous node in the same context with a 'follows' edge
      if (contextNodes.length > 0) {
        const prevId = contextNodes[contextNodes.length - 1]!;
        await this.addEdge(prevId, id, 'follows');
      }

      await this.db.set(contextPath, [...contextNodes, id]);
    }

    return node;
  }

  async trace(nodeId: string, direction: TraceDirection, maxDepth: number): Promise<ChronicleNode[]> {
    const visited = new Set<string>();
    const result: ChronicleNode[] = [];
    await this._traceRecursive(nodeId, direction, maxDepth, 0, visited, result);
    return result;
  }

  async range(start: number, end: number): Promise<ChronicleNode[]> {
    const index = (await this.db.get<string[]>(CHRONICLE_PATHS.INDEX)) ?? [];
    const result: ChronicleNode[] = [];

    for (const id of index) {
      const node = await this.db.get<ChronicleNode>(`${CHRONICLE_PATHS.NODES}/${id}`);
      if (node && node.timestamp >= start && node.timestamp <= end) {
        result.push(node);
      }
    }

    return result;
  }

  async subgraph(contextId: string): Promise<ChronicleNode[]> {
    const contextPath = `${CHRONICLE_PATHS.CONTEXT}/${contextId}`;
    const nodeIds = (await this.db.get<string[]>(contextPath)) ?? [];
    const result: ChronicleNode[] = [];

    for (const id of nodeIds) {
      const node = await this.db.get<ChronicleNode>(`${CHRONICLE_PATHS.NODES}/${id}`);
      if (node) {
        result.push(node);
      }
    }

    return result;
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async addEdge(from: string, to: string, type: EdgeType): Promise<void> {
    const edge: ChronicleEdge = { from, to, type };

    const outPath = `${CHRONICLE_PATHS.EDGES_OUT}/${from}`;
    const outEdges = (await this.db.get<ChronicleEdge[]>(outPath)) ?? [];
    await this.db.set(outPath, [...outEdges, edge]);

    const inPath = `${CHRONICLE_PATHS.EDGES_IN}/${to}`;
    const inEdges = (await this.db.get<ChronicleEdge[]>(inPath)) ?? [];
    await this.db.set(inPath, [...inEdges, edge]);
  }

  private async _traceRecursive(
    nodeId: string,
    direction: TraceDirection,
    maxDepth: number,
    depth: number,
    visited: Set<string>,
    result: ChronicleNode[]
  ): Promise<void> {
    if (depth > maxDepth || visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);

    const node = await this.db.get<ChronicleNode>(`${CHRONICLE_PATHS.NODES}/${nodeId}`);
    if (node) {
      result.push(node);
    }

    if (direction === 'backward' || direction === 'both') {
      const inEdges =
        (await this.db.get<ChronicleEdge[]>(`${CHRONICLE_PATHS.EDGES_IN}/${nodeId}`)) ?? [];
      for (const edge of inEdges) {
        await this._traceRecursive(edge.from, direction, maxDepth, depth + 1, visited, result);
      }
    }

    if (direction === 'forward' || direction === 'both') {
      const outEdges =
        (await this.db.get<ChronicleEdge[]>(`${CHRONICLE_PATHS.EDGES_OUT}/${nodeId}`)) ?? [];
      for (const edge of outEdges) {
        await this._traceRecursive(edge.to, direction, maxDepth, depth + 1, visited, result);
      }
    }
  }
}

/**
 * Create a PluresDB-backed Chronicle instance.
 *
 * @param db The PraxisDB instance to store causal graph data in
 */
export function createChronicle(db: PraxisDB): PluresDbChronicle {
  return new PluresDbChronicle(db);
}
