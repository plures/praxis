/**
 * @plures/praxis-db — PluresDB persistence for @plures/praxis-core
 *
 * Bridges the in-memory Praxis LogicEngine to PluresDB's CRDT store
 * and Agens reactive runtime. Facts, events, and state changes are
 * persisted automatically and sync via Hyperswarm.
 *
 * ## Architecture
 *
 * ```
 * praxis-core (LogicEngine)  ←→  praxis-db (PraxisDBEngine)  ←→  PluresDB (CRDT + Agens)
 *       ↑ pure in-memory              ↑ persistence bridge             ↑ Rust native
 * ```
 *
 * The PraxisDBEngine wraps a LogicEngine and:
 * 1. Persists facts to PluresDB CRDT nodes
 * 2. Stores events in append-only CRDT log
 * 3. Emits Agens events for reactive subscribers
 * 4. Exposes PluresDB state table for cross-system reactivity
 */

export { PraxisDBEngine, type PraxisDBEngineOptions } from './engine.js';
export { PluresDBAdapter, type PluresDBAdapterOptions } from './adapter.js';
export {
  PRAXIS_PATHS,
  getFactPath,
  getEventPath,
} from './paths.js';
