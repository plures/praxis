/**
 * PluresDB Adapter for Praxis
 *
 * Wraps PluresDB's native NAPI interface with a Praxis-specific API.
 * Uses the new Agens NAPI bindings for reactive events, state, and timers.
 */

import type { PluresDatabase } from '@plures/pluresdb';
import { getFactPath, getEventPath } from './paths.js';

export interface PluresDBAdapterOptions {
  /** PluresDB database instance */
  db: PluresDatabase;
  /** Actor ID for CRDT writes (default: 'praxis') */
  actorId?: string;
}

/**
 * PluresDB adapter that provides get/set/watch/events for Praxis.
 *
 * Uses PluresDB CRDT store for facts/events and Agens runtime for
 * reactive events and state.
 */
export class PluresDBAdapter {
  private db: PluresDatabase;
  private actorId: string;

  constructor(options: PluresDBAdapterOptions) {
    this.db = options.db;
    this.actorId = options.actorId ?? 'praxis';
  }

  // -- Facts --

  getFact<T>(tag: string, id: string): T | undefined {
    const path = getFactPath(tag, id);
    const node = this.db.get(path);
    if (!node) return undefined;
    return (node as Record<string, unknown>).data as T;
  }

  storeFact(tag: string, id: string, data: unknown): void {
    const path = getFactPath(tag, id);
    await this.db.put(path, {
      type: 'praxis:fact',
      tag,
      id,
      data,
      actorId: this.actorId,
      storedAt: new Date().toISOString(),
    });
  }

  async listFacts(tag: string): Promise<Array<{ id: string; data: unknown }>> {
    const prefix = getFactPath(tag);
    return this.db
      .listByType('praxis:fact')
      .filter((n: { id: string }) => n.id.startsWith(prefix))
      .map((n: { id: string; data: Record<string, unknown> }) => ({
        id: n.data.id as string,
        data: n.data.data,
      }));
  }

  // -- Events --

  appendEvent(tag: string, payload: unknown): string {
    const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `${getEventPath(tag)}/${eventId}`;
    await this.db.put(path, {
      type: 'praxis:event',
      tag,
      payload,
      actorId: this.actorId,
      timestamp: new Date().toISOString(),
    });

    // Also emit as Agens event for reactive subscribers
    this.db.agensEmit({
      event_type: 'message',
      id: `praxis-event:${eventId}`,
      payload: { tag, data: payload },
    });

    return eventId;
  }

  // -- Agens State (reactive key/value) --

  stateGet(key: string): unknown {
    return this.db.agensStateGet(key);
  }

  stateSet(key: string, value: unknown): void {
    this.db.agensStateSet(key, value);
  }

  stateWatch(sinceIso: string): Array<{ key: string; value: unknown }> {
    return this.db.agensStateWatch(sinceIso) as Array<{
      key: string;
      value: unknown;
    }>;
  }

  // -- Agens Events --

  emitPraxisEvent(event: {
    event_type: string;
    id: string;
    [key: string]: unknown;
  }): string {
    return this.db.agensEmitPraxis(event);
  }

  listEvents(sinceIso: string): unknown[] {
    return this.db.agensListEvents(sinceIso);
  }

  // -- Agens Timers --

  scheduleTimer(
    name: string,
    intervalSecs: number,
    payload: unknown,
  ): string {
    return this.db.agensTimerSchedule(
      name,
      intervalSecs,
      payload,
    );
  }

  cancelTimer(timerId: string): boolean {
    return this.db.agensTimerCancel(timerId);
  }

  listTimers(): unknown[] {
    return this.db.agensTimerList();
  }

  dueTimers(): unknown[] {
    return this.db.agensTimerDue();
  }

  rescheduleTimer(timerId: string): boolean {
    return this.db.agensTimerReschedule(timerId);
  }

  // -- Raw DB access --

  get database(): PluresDatabase {
    return this.db;
  }
}
