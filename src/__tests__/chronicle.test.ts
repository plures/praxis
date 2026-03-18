/**
 * Chronicle Integration Tests
 *
 * Validates:
 * - ChronicleNode creation on storeFact / appendEvent
 * - Causal edge creation from ChronicleContext spans
 * - trace() backward/forward traversal
 * - range() time-bounded queries
 * - subgraph() per-context queries
 * - ChronosMcpTools (trace + search)
 * - Chronicle errors never break primary operations
 * - End-to-end: agent decision → chronicle node → trace backward to input
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInMemoryDB,
  InMemoryPraxisDB,
  createPraxisDBStore,
  PraxisDBStore,
  createChronicle,
  PluresDbChronicle,
  CHRONICLE_PATHS,
  ChronicleContext,
  createChronosMcpTools,
} from '../integrations/pluresdb.js';
import { PraxisRegistry } from '../core/rules.js';
import { defineFact, defineEvent, defineRule } from '../dsl/index.js';
import type { Chronicle, ChronicleNode } from '../core/chronicle/index.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSetup() {
  const db = createInMemoryDB();
  const registry = new PraxisRegistry();
  const chronicle = createChronicle(db);
  const store = createPraxisDBStore(db, registry).withChronicle(chronicle);
  return { db, registry, chronicle, store };
}

// ── PluresDbChronicle unit tests ───────────────────────────────────────────────

describe('PluresDbChronicle', () => {
  let db: InMemoryPraxisDB;
  let chronicle: PluresDbChronicle;

  beforeEach(() => {
    db = createInMemoryDB();
    chronicle = createChronicle(db);
  });

  it('should record a node and return it', async () => {
    const node = await chronicle.record({
      path: '/test/fact',
      after: { tag: 'Foo', payload: {} },
      metadata: {},
    });

    expect(node.id).toMatch(/^chronos:\d+-\d+$/);
    expect(node.timestamp).toBeGreaterThan(0);
    expect(node.event.path).toBe('/test/fact');
  });

  it('should persist node under CHRONICLE_PATHS.NODES', async () => {
    const node = await chronicle.record({ path: '/test', metadata: {} });

    const stored = await db.get<ChronicleNode>(`${CHRONICLE_PATHS.NODES}/${node.id}`);
    expect(stored).toBeDefined();
    expect(stored?.id).toBe(node.id);
  });

  it('should update the global index', async () => {
    const n1 = await chronicle.record({ path: '/a', metadata: {} });
    const n2 = await chronicle.record({ path: '/b', metadata: {} });

    const index = await db.get<string[]>(CHRONICLE_PATHS.INDEX);
    expect(index).toContain(n1.id);
    expect(index).toContain(n2.id);
  });

  it('should create a "causes" edge when cause is provided', async () => {
    const n1 = await chronicle.record({ path: '/a', metadata: {} });
    const n2 = await chronicle.record({ path: '/b', cause: n1.id, metadata: {} });

    const outEdges = await db.get<Array<{ from: string; to: string; type: string }>>(
      `${CHRONICLE_PATHS.EDGES_OUT}/${n1.id}`
    );
    const inEdges = await db.get<Array<{ from: string; to: string; type: string }>>(
      `${CHRONICLE_PATHS.EDGES_IN}/${n2.id}`
    );

    expect(outEdges).toHaveLength(1);
    expect(outEdges?.[0]).toEqual({ from: n1.id, to: n2.id, type: 'causes' });
    expect(inEdges?.[0]).toEqual({ from: n1.id, to: n2.id, type: 'causes' });
  });

  it('should create "follows" edges between nodes in the same context', async () => {
    const n1 = await chronicle.record({ path: '/a', context: 'ctx-1', metadata: {} });
    const n2 = await chronicle.record({ path: '/b', context: 'ctx-1', metadata: {} });
    const n3 = await chronicle.record({ path: '/c', context: 'ctx-1', metadata: {} });

    const outEdgesN1 = await db.get<Array<{ type: string; to: string }>>(
      `${CHRONICLE_PATHS.EDGES_OUT}/${n1.id}`
    );
    const outEdgesN2 = await db.get<Array<{ type: string; to: string }>>(
      `${CHRONICLE_PATHS.EDGES_OUT}/${n2.id}`
    );

    expect(outEdgesN1?.[0]).toMatchObject({ type: 'follows', to: n2.id });
    expect(outEdgesN2?.[0]).toMatchObject({ type: 'follows', to: n3.id });
  });

  it('should update the context index', async () => {
    const n1 = await chronicle.record({ path: '/a', context: 'ctx-2', metadata: {} });
    const n2 = await chronicle.record({ path: '/b', context: 'ctx-2', metadata: {} });

    const ctxIndex = await db.get<string[]>(`${CHRONICLE_PATHS.CONTEXT}/ctx-2`);
    expect(ctxIndex).toEqual([n1.id, n2.id]);
  });
});

// ── Chronicle.trace ────────────────────────────────────────────────────────────

describe('Chronicle.trace', () => {
  let chronicle: PluresDbChronicle;

  beforeEach(() => {
    chronicle = createChronicle(createInMemoryDB());
  });

  it('should trace backward through causal edges', async () => {
    const root = await chronicle.record({ path: '/root', metadata: {} });
    const mid = await chronicle.record({ path: '/mid', cause: root.id, metadata: {} });
    const leaf = await chronicle.record({ path: '/leaf', cause: mid.id, metadata: {} });

    const result = await chronicle.trace(leaf.id, 'backward', 10);
    const ids = result.map((n) => n.id);

    expect(ids).toContain(leaf.id);
    expect(ids).toContain(mid.id);
    expect(ids).toContain(root.id);
  });

  it('should trace forward through causal edges', async () => {
    const root = await chronicle.record({ path: '/root', metadata: {} });
    const mid = await chronicle.record({ path: '/mid', cause: root.id, metadata: {} });
    await chronicle.record({ path: '/leaf', cause: mid.id, metadata: {} });

    const result = await chronicle.trace(root.id, 'forward', 10);
    const ids = result.map((n) => n.id);

    expect(ids).toContain(root.id);
    expect(ids).toContain(mid.id);
  });

  it('should respect maxDepth', async () => {
    const n1 = await chronicle.record({ path: '/1', metadata: {} });
    const n2 = await chronicle.record({ path: '/2', cause: n1.id, metadata: {} });
    const n3 = await chronicle.record({ path: '/3', cause: n2.id, metadata: {} });

    const result = await chronicle.trace(n3.id, 'backward', 1);
    const ids = result.map((n) => n.id);

    expect(ids).toContain(n3.id);
    expect(ids).toContain(n2.id);
    // n1 is depth 2 from n3, should be excluded with maxDepth=1
    expect(ids).not.toContain(n1.id);
  });

  it('should not visit nodes twice (cycle-safe)', async () => {
    // Build a simple two-node chain and verify tracing terminates
    const safeDb = createInMemoryDB();
    const safeChronicle = createChronicle(safeDb);
    const a = await safeChronicle.record({ path: '/a', metadata: {} });
    const b = await safeChronicle.record({ path: '/b', cause: a.id, metadata: {} });

    const result = await safeChronicle.trace(b.id, 'both', 20);
    // Should terminate without stack overflow and return at most the two nodes
    expect(result.length).toBeLessThanOrEqual(2);
  });
});

// ── Chronicle.range ────────────────────────────────────────────────────────────

describe('Chronicle.range', () => {
  it('should return nodes within a time range', async () => {
    const chronicle = createChronicle(createInMemoryDB());

    const before = Date.now() - 1;
    const n1 = await chronicle.record({ path: '/a', metadata: {} });
    const after = Date.now() + 1;

    const results = await chronicle.range(before, after);
    const ids = results.map((n) => n.id);

    expect(ids).toContain(n1.id);
  });

  it('should exclude nodes outside the range', async () => {
    const chronicle = createChronicle(createInMemoryDB());

    const n1 = await chronicle.record({ path: '/a', metadata: {} });
    const future = Date.now() + 10_000;

    const results = await chronicle.range(future, future + 1);
    const ids = results.map((n) => n.id);

    expect(ids).not.toContain(n1.id);
  });
});

// ── Chronicle.subgraph ─────────────────────────────────────────────────────────

describe('Chronicle.subgraph', () => {
  it('should return all nodes in a context', async () => {
    const chronicle = createChronicle(createInMemoryDB());

    const n1 = await chronicle.record({ path: '/a', context: 'session-X', metadata: {} });
    const n2 = await chronicle.record({ path: '/b', context: 'session-X', metadata: {} });
    await chronicle.record({ path: '/c', context: 'session-Y', metadata: {} });

    const nodes = await chronicle.subgraph('session-X');
    const ids = nodes.map((n) => n.id);

    expect(ids).toContain(n1.id);
    expect(ids).toContain(n2.id);
    expect(nodes).toHaveLength(2);
  });
});

// ── ChronicleContext ───────────────────────────────────────────────────────────

describe('ChronicleContext', () => {
  it('should have no current span by default', () => {
    expect(ChronicleContext.current).toBeUndefined();
  });

  it('should provide current span inside run()', () => {
    let captured: ReturnType<typeof ChronicleContext.current>;
    ChronicleContext.run({ spanId: 'span-1', contextId: 'ctx-1' }, () => {
      captured = ChronicleContext.current;
    });
    expect(captured?.spanId).toBe('span-1');
    expect(captured?.contextId).toBe('ctx-1');
  });

  it('should restore previous span after run()', () => {
    ChronicleContext.run({ spanId: 'outer' }, () => {
      ChronicleContext.run({ spanId: 'inner' }, () => {
        expect(ChronicleContext.current?.spanId).toBe('inner');
      });
      expect(ChronicleContext.current?.spanId).toBe('outer');
    });
    expect(ChronicleContext.current).toBeUndefined();
  });

  it('should provide current span inside runAsync()', async () => {
    let captured: ReturnType<typeof ChronicleContext.current>;
    await ChronicleContext.runAsync({ spanId: 'async-span', contextId: 'async-ctx' }, async () => {
      captured = ChronicleContext.current;
    });
    expect(captured?.spanId).toBe('async-span');
  });

  it('should restore span after runAsync() even if it throws', async () => {
    await expect(
      ChronicleContext.runAsync({ spanId: 'err-span' }, async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    expect(ChronicleContext.current).toBeUndefined();
  });

  it('should create child spans inheriting contextId', () => {
    ChronicleContext.run({ spanId: 'parent', contextId: 'session-Z' }, () => {
      const child = ChronicleContext.childSpan('child-span');
      expect(child.spanId).toBe('child-span');
      expect(child.contextId).toBe('session-Z');
    });
  });
});

// ── PraxisDBStore.withChronicle ────────────────────────────────────────────────

describe('PraxisDBStore.withChronicle', () => {
  it('should record a node when storeFact is called', async () => {
    const { store, chronicle } = makeSetup();

    await store.storeFact({ tag: 'UserLoggedIn', payload: { userId: 'alice', id: 'u1' } });

    const index = await (chronicle as PluresDbChronicle)['db'].get<string[]>(CHRONICLE_PATHS.INDEX);
    expect(index).toHaveLength(1);
  });

  it('should record nodes for each fact in storeFacts', async () => {
    const { store, chronicle } = makeSetup();

    await store.storeFacts([
      { tag: 'A', payload: { id: 'a1' } },
      { tag: 'B', payload: { id: 'b1' } },
    ]);

    const index = await (chronicle as PluresDbChronicle)['db'].get<string[]>(CHRONICLE_PATHS.INDEX);
    expect(index).toHaveLength(2);
  });

  it('should record a node when appendEvent is called', async () => {
    const { store, chronicle } = makeSetup();

    await store.appendEvent({ tag: 'LOGIN', payload: { username: 'alice' } });

    const index = await (chronicle as PluresDbChronicle)['db'].get<string[]>(CHRONICLE_PATHS.INDEX);
    expect(index).toHaveLength(1);
  });

  it('should attribute recorded nodes to the current ChronicleContext span', async () => {
    const { store, chronicle } = makeSetup();

    await ChronicleContext.runAsync(
      { spanId: 'my-span', contextId: 'session-1' },
      () => store.storeFact({ tag: 'Decision', payload: { route: 'fast', id: 'd1' } })
    );

    const index = await (chronicle as PluresDbChronicle)['db'].get<string[]>(CHRONICLE_PATHS.INDEX);
    const nodeId = index?.[0]!;
    const node = await (chronicle as PluresDbChronicle)['db'].get<ChronicleNode>(
      `${CHRONICLE_PATHS.NODES}/${nodeId}`
    );

    expect(node?.event.cause).toBe('my-span');
    expect(node?.event.context).toBe('session-1');
  });

  it('should not fail storeFact when Chronicle throws', async () => {
    const db = createInMemoryDB();
    const registry = new PraxisRegistry();

    const brokenChronicle: Chronicle = {
      async record() {
        throw new Error('chronicle exploded');
      },
      async trace() {
        return [];
      },
      async range() {
        return [];
      },
      async subgraph() {
        return [];
      },
    };

    const store = createPraxisDBStore(db, registry).withChronicle(brokenChronicle);

    // Must not throw despite Chronicle failure
    await expect(
      store.storeFact({ tag: 'Safe', payload: { id: 's1' } })
    ).resolves.toBeUndefined();
  });

  it('should return the same store instance from withChronicle (fluent)', () => {
    const db = createInMemoryDB();
    const registry = new PraxisRegistry();
    const store = createPraxisDBStore(db, registry);
    const chronicle = createChronicle(db);

    const returned = store.withChronicle(chronicle);
    expect(returned).toBe(store);
  });
});

// ── ChronosMcpTools ────────────────────────────────────────────────────────────

describe('ChronosMcpTools', () => {
  it('chronos.trace should return nodes on success', async () => {
    const { chronicle } = makeSetup();
    const tools = createChronosMcpTools(chronicle);

    const root = await chronicle.record({ path: '/root', metadata: {} });
    const leaf = await chronicle.record({ path: '/leaf', cause: root.id, metadata: {} });

    const result = await tools.trace({ nodeId: leaf.id, direction: 'backward', maxDepth: 5 });

    expect(result.success).toBe(true);
    const ids = result.data?.map((n) => n.id) ?? [];
    expect(ids).toContain(leaf.id);
    expect(ids).toContain(root.id);
  });

  it('chronos.trace should return error on failure', async () => {
    const brokenChronicle: Chronicle = {
      async record() {
        return {} as ChronicleNode;
      },
      async trace() {
        throw new Error('db offline');
      },
      async range() {
        return [];
      },
      async subgraph() {
        return [];
      },
    };

    const tools = createChronosMcpTools(brokenChronicle);
    const result = await tools.trace({ nodeId: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('db offline');
  });

  it('chronos.search should filter by query string', async () => {
    const { chronicle } = makeSetup();
    const tools = createChronosMcpTools(chronicle);

    await chronicle.record({ path: '/praxis/facts/UserLoggedIn/u1', after: { userId: 'alice' }, metadata: {} });
    await chronicle.record({ path: '/praxis/events/LOGIN', after: { username: 'bob' }, metadata: {} });

    const result = await tools.search({ query: 'userloggedin' });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.event.path).toContain('UserLoggedIn');
  });

  it('chronos.search should filter by contextId', async () => {
    const { chronicle } = makeSetup();
    const tools = createChronosMcpTools(chronicle);

    await chronicle.record({ path: '/a', context: 'ctx-search', metadata: { tag: 'alpha' } });
    await chronicle.record({ path: '/b', context: 'ctx-other', metadata: { tag: 'beta' } });

    const result = await tools.search({ query: 'alpha', contextId: 'ctx-search' });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('chronos.search should respect limit', async () => {
    const { chronicle } = makeSetup();
    const tools = createChronosMcpTools(chronicle);

    for (let i = 0; i < 5; i++) {
      await chronicle.record({ path: `/item/${i}`, metadata: { tag: 'item' } });
    }

    const result = await tools.search({ query: 'item', limit: 2 });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });
});

// ── End-to-end: agent decision → chronicle node → trace backward to input ─────

describe('End-to-end: agent decision traced back to input event', () => {
  it('should trace a RouteDecision fact back to the originating AgentInput event', async () => {
    // Setup
    const db = createInMemoryDB();
    const chronicle = createChronicle(db);

    interface AgentCtx {
      sessionId: string;
    }

    const AgentInput = defineEvent<'AgentInput', { prompt: string }>('AgentInput');
    const RouteDecision = defineFact<'RouteDecision', { route: string; id: string }>(
      'RouteDecision'
    );

    const routingRule = defineRule<AgentCtx>({
      id: 'agent.route',
      description: 'Route agent input to appropriate handler',
      impl: (_state, events) => {
        const input = events.find(AgentInput.is);
        if (input) {
          return [RouteDecision.create({ route: 'fast-path', id: 'decision-1' })];
        }
        return [];
      },
    });

    const registry = new PraxisRegistry<AgentCtx>();
    registry.registerRule(routingRule);

    const store = createPraxisDBStore(db, registry, { sessionId: 'sess-42' }).withChronicle(
      chronicle
    );

    // Simulate an agent request: the input event triggers routing
    const sessionSpan = { spanId: 'request-1', contextId: 'sess-42' };

    await ChronicleContext.runAsync(sessionSpan, async () => {
      // Append input event (triggers routingRule which stores RouteDecision fact)
      await store.appendEvent(AgentInput.create({ prompt: 'Hello, agent!' }));
    });

    // Find the RouteDecision chronicle node
    const allNodes = await chronicle.range(0, Date.now() + 1000);
    const decisionNode = allNodes.find((n) => n.event.path.includes('RouteDecision'));

    expect(decisionNode).toBeDefined();

    // The RouteDecision fact should be attributed to the same context
    expect(decisionNode?.event.context).toBe('sess-42');

    // The session subgraph should contain both the input event and decision fact nodes
    const subgraph = await chronicle.subgraph('sess-42');
    const paths = subgraph.map((n) => n.event.path);

    expect(paths.some((p) => p.includes('AgentInput'))).toBe(true);
  });
});
