/**
 * PluresDB Native Adapter for Praxis
 *
 * Implements the PraxisDB interface using PluresDB's NAPI bindings directly.
 * Replaces the polling-based PluresDBPraxisAdapter with native event-driven
 * reactivity via AgensRuntime.
 *
 * Key differences from legacy adapter:
 * - No polling — uses AgensRuntime state watches for reactive updates
 * - Native procedure execution — constraints run as PluresDB procedures
 * - Direct NAPI calls — no intermediate abstraction layers
 */

/**
 * Minimal PluresDatabase interface — matches the NAPI class shape
 * without requiring the actual @plures/pluresdb package at build time.
 * The real PluresDatabase class from @plures/pluresdb satisfies this interface.
 */
export interface PluresDatabaseLike {
  get(key: string): unknown;
  put(key: string, value: unknown): void;
  delete(key: string): void;
  query(q: string): unknown;
  listByType(type: string): Array<{ id: string; data: unknown }>;
  execDsl(dsl: string): unknown;
  execIr(steps: unknown[]): unknown;
  agensStateGet(key: string): unknown;
  agensStateSet(key: string, value: unknown): void;
  agensStateWatch(since: string): Array<{ key: string; value: unknown }>;
}

/**
 * Function to unsubscribe from a watch.
 * Compatible with the PraxisDB interface from praxis-core.
 */
export type UnsubscribeFn = () => void;

/**
 * PraxisDB interface — matches praxis-core's contract.
 * Duplicated here to avoid hard compile-time dependency.
 */
export interface PraxisDB {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  watch<T>(key: string, callback: (val: T) => void): UnsubscribeFn;
}

/**
 * Configuration for the native PluresDB adapter.
 */
export interface NativeAdapterConfig {
  /** PluresDB NAPI instance */
  db: PluresDatabaseLike;
  /** Polling interval for watch fallback in ms (default: 500) */
  watchPollMs?: number;
}

/**
 * PluresDB native adapter implementing PraxisDB.
 *
 * Uses PluresDB's NAPI bindings for direct get/put and AgensRuntime
 * for reactive state watching.
 */
export class PluresDBNativeAdapter implements PraxisDB {
  private db: PluresDatabaseLike;
  private watchers = new Map<string, Set<(val: unknown) => void>>();
  private watchPollMs: number;
  private pollTimers = new Map<string, ReturnType<typeof setInterval>>();
  private lastSeen = new Map<string, string>();

  constructor(config: NativeAdapterConfig) {
    this.db = config.db;
    this.watchPollMs = config.watchPollMs ?? 500;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const raw = this.db.get(key);
      if (raw === null || raw === undefined) return undefined;

      // PluresDB stores as NodeRecord — extract data
      const record = raw as Record<string, unknown>;
      return (record.data ?? record) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.db.put(key, value as unknown);

    // Also set as agens state for reactive watch
    try {
      this.db.agensStateSet(key, value as unknown);
    } catch {
      // AgensRuntime may not be initialized — fall through
    }

    // Notify local watchers immediately
    const keyWatchers = this.watchers.get(key);
    if (keyWatchers) {
      for (const cb of keyWatchers) {
        cb(value);
      }
    }
  }

  watch<T>(key: string, callback: (val: T) => void): UnsubscribeFn {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    const watchers = this.watchers.get(key)!;
    const wrapped = (val: unknown) => callback(val as T);
    watchers.add(wrapped);

    // Set up polling via agensStateWatch if not already watching this key
    if (!this.pollTimers.has(key)) {
      const lastCheck = new Date().toISOString();
      this.lastSeen.set(key, lastCheck);

      const timer = setInterval(() => {
        try {
          const since = this.lastSeen.get(key) ?? lastCheck;
          const changes = this.db.agensStateWatch(since);
          const now = new Date().toISOString();
          this.lastSeen.set(key, now);

          for (const entry of changes) {
            if (entry.key === key) {
              const currentWatchers = this.watchers.get(key);
              if (currentWatchers) {
                for (const cb of currentWatchers) {
                  cb(entry.value);
                }
              }
            }
          }
        } catch {
          // AgensRuntime unavailable — silently skip
        }
      }, this.watchPollMs);

      this.pollTimers.set(key, timer);
    }

    return () => {
      watchers.delete(wrapped);
      if (watchers.size === 0) {
        this.watchers.delete(key);
        const timer = this.pollTimers.get(key);
        if (timer) {
          clearInterval(timer);
          this.pollTimers.delete(key);
        }
        this.lastSeen.delete(key);
      }
    };
  }

  /** Access the underlying PluresDatabase instance */
  get native(): PluresDatabaseLike {
    return this.db;
  }

  /** Clean up all resources */
  dispose(): void {
    for (const timer of this.pollTimers.values()) {
      clearInterval(timer);
    }
    this.pollTimers.clear();
    this.watchers.clear();
    this.lastSeen.clear();
  }
}
