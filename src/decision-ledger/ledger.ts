/**
 * Decision Ledger - Ledger Storage
 *
 * Immutable, append-only ledger for tracking contract history.
 */

import type { Contract, Assumption } from './types.js';

/**
 * Status of a ledger entry.
 */
export type LedgerEntryStatus = 'active' | 'superseded' | 'deprecated';

/**
 * A single entry in the behavior ledger.
 */
export interface LedgerEntry {
  /** Unique identifier for this ledger entry */
  id: string;
  /** Timestamp of entry creation */
  timestamp: string;
  /** Status of this entry */
  status: LedgerEntryStatus;
  /** Author or system that created this entry */
  author: string;
  /** The contract being recorded */
  contract: Contract;
  /** ID of the entry this supersedes (if any) */
  supersedes?: string;
  /** Reason for this entry (e.g., 'initial', 'assumption-revised', 'behavior-updated') */
  reason?: string;
}

/**
 * Immutable, append-only behavior ledger.
 */
export class BehaviorLedger {
  private entries: LedgerEntry[] = [];
  private entryMap: Map<string, LedgerEntry> = new Map();

  /**
   * Append a new entry to the ledger.
   *
   * @param entry The entry to append
   * @throws Error if entry ID already exists
   */
  append(entry: LedgerEntry): void {
    if (this.entryMap.has(entry.id)) {
      throw new Error(`Ledger entry with ID '${entry.id}' already exists`);
    }

    // If this entry supersedes another, mark the old one as superseded
    // Note: The entries array preserves the original entry for historical record.
    // Only the map entry is updated to reflect the superseded status for queries.
    if (entry.supersedes) {
      const superseded = this.entryMap.get(entry.supersedes);
      if (superseded && superseded.status === 'active') {
        // Create a new entry with updated status (immutability)
        const updatedEntry: LedgerEntry = {
          ...superseded,
          status: 'superseded',
        };
        // Replace in map but keep original in entries array for history
        this.entryMap.set(entry.supersedes, updatedEntry);
      }
    }

    this.entries.push(entry);
    this.entryMap.set(entry.id, entry);
  }

  /**
   * Get an entry by ID.
   *
   * @param id The entry ID
   * @returns The entry, or undefined if not found
   */
  getEntry(id: string): LedgerEntry | undefined {
    return this.entryMap.get(id);
  }

  /**
   * Get all entries (in order of append).
   *
   * @returns Array of all entries
   */
  getAllEntries(): LedgerEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries for a specific rule ID.
   *
   * @param ruleId The rule ID
   * @returns Array of entries for this rule
   */
  getEntriesForRule(ruleId: string): LedgerEntry[] {
    return this.entries.filter((entry) => entry.contract.ruleId === ruleId);
  }

  /**
   * Get the latest active entry for a rule.
   *
   * @param ruleId The rule ID
   * @returns The latest active entry, or undefined if none
   */
  getLatestEntry(ruleId: string): LedgerEntry | undefined {
    const entries = this.getEntriesForRule(ruleId);
    const activeEntries = entries.filter((entry) => entry.status === 'active');

    if (activeEntries.length === 0) {
      return undefined;
    }

    // Return the most recent active entry
    return activeEntries[activeEntries.length - 1];
  }

  /**
   * Get all active assumptions across all entries.
   *
   * @returns Map of assumption ID to assumption
   */
  getActiveAssumptions(): Map<string, Assumption> {
    const assumptions = new Map<string, Assumption>();

    for (const entry of this.entries) {
      if (entry.status !== 'active') {
        continue;
      }

      for (const assumption of entry.contract.assumptions || []) {
        if (assumption.status === 'active') {
          assumptions.set(assumption.id, assumption);
        }
      }
    }

    return assumptions;
  }

  /**
   * Find assumptions that impact a specific artifact type.
   *
   * @param impactType The artifact type ('spec', 'tests', 'code')
   * @returns Array of assumptions
   */
  findAssumptionsByImpact(impactType: 'spec' | 'tests' | 'code'): Assumption[] {
    const assumptions: Assumption[] = [];

    for (const entry of this.entries) {
      if (entry.status !== 'active') {
        continue;
      }

      for (const assumption of entry.contract.assumptions || []) {
        if (assumption.status === 'active' && assumption.impacts.includes(impactType)) {
          assumptions.push(assumption);
        }
      }
    }

    return assumptions;
  }

  /**
   * Get ledger statistics.
   */
  getStats(): {
    totalEntries: number;
    activeEntries: number;
    supersededEntries: number;
    deprecatedEntries: number;
    uniqueRules: number;
  } {
    const active = this.entries.filter((e) => e.status === 'active').length;
    const superseded = this.entries.filter((e) => e.status === 'superseded').length;
    const deprecated = this.entries.filter((e) => e.status === 'deprecated').length;
    const uniqueRules = new Set(this.entries.map((e) => e.contract.ruleId)).size;

    return {
      totalEntries: this.entries.length,
      activeEntries: active,
      supersededEntries: superseded,
      deprecatedEntries: deprecated,
      uniqueRules,
    };
  }

  /**
   * Export ledger as JSON.
   *
   * @returns JSON string
   */
  toJSON(): string {
    return JSON.stringify(
      {
        version: '1.0.0',
        entries: this.entries,
        stats: this.getStats(),
      },
      null,
      2
    );
  }

  /**
   * Import ledger from JSON.
   *
   * @param json The JSON string
   * @returns A new BehaviorLedger instance
   */
  static fromJSON(json: string): BehaviorLedger {
    const data = JSON.parse(json);
    const ledger = new BehaviorLedger();

    for (const entry of data.entries || []) {
      ledger.append(entry);
    }

    return ledger;
  }
}

/**
 * Create a new behavior ledger.
 *
 * @returns A new empty ledger
 */
export function createBehaviorLedger(): BehaviorLedger {
  return new BehaviorLedger();
}
