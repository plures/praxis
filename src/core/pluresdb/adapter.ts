/**
 * PraxisDB Adapter
 *
 * Provides a minimal adapter layer for PluresDB integration.
 * This module defines the core interface and an in-memory implementation.
 */

/**
 * Function to unsubscribe from a watch
 */
export type UnsubscribeFn = () => void;

/**
 * Core database interface for Praxis
 *
 * Provides a minimal API for get/set/watch operations.
 * Can be backed by in-memory storage or PluresDB.
 */
export interface PraxisDB {
  /**
   * Get a value by key
   * @param key The key to retrieve
   * @returns The value or undefined if not found
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Set a value by key
   * @param key The key to set
   * @param value The value to store
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Watch a key for changes
   * @param key The key to watch
   * @param callback Called when the value changes
   * @returns Function to unsubscribe from updates
   */
  watch<T>(key: string, callback: (val: T) => void): UnsubscribeFn;
}

/**
 * In-memory implementation of PraxisDB
 *
 * Provides a simple in-memory store for development and testing.
 * Suitable for proxying to PluresDB later.
 */
export class InMemoryPraxisDB implements PraxisDB {
  private store = new Map<string, unknown>();
  private watchers = new Map<string, Set<(val: unknown) => void>>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);

    // Notify watchers
    const keyWatchers = this.watchers.get(key);
    if (keyWatchers) {
      for (const callback of keyWatchers) {
        callback(value);
      }
    }
  }

  watch<T>(key: string, callback: (val: T) => void): UnsubscribeFn {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }

    const watchers = this.watchers.get(key)!;
    const wrappedCallback = (val: unknown) => callback(val as T);
    watchers.add(wrappedCallback);

    // Return unsubscribe function
    return () => {
      watchers.delete(wrappedCallback);
      if (watchers.size === 0) {
        this.watchers.delete(key);
      }
    };
  }

  /**
   * Get all keys (for testing/debugging)
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.store.clear();
    this.watchers.clear();
  }
}

/**
 * Create a new in-memory PraxisDB instance
 *
 * @returns InMemoryPraxisDB instance
 *
 * @example
 * ```typescript
 * const db = createInMemoryDB();
 * await db.set('user:1', { name: 'Alice' });
 * const user = await db.get('user:1');
 * ```
 */
export function createInMemoryDB(): InMemoryPraxisDB {
  return new InMemoryPraxisDB();
}
