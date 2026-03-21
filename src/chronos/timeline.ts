/**
 * Timeline — Queryable view over ProjectChronicle events
 *
 * Provides filtering, range queries, subject history, and behavioral deltas.
 */

import type { ProjectEvent, ProjectEventKind } from './project-chronicle.js';
import type { ProjectChronicle } from './project-chronicle.js';

// ─── Filter Types ───────────────────────────────────────────────────────────

/** Filter criteria for timeline queries. All fields are optional (AND logic). */
export interface TimelineFilter {
  /** Filter by event kind(s). */
  kind?: ProjectEventKind | ProjectEventKind[];
  /** Filter by action string(s). */
  action?: string | string[];
  /** Filter by subject (exact match or array). */
  subject?: string | string[];
  /** Only events at or after this timestamp (inclusive). */
  since?: number;
  /** Only events at or before this timestamp (inclusive). */
  until?: number;
}

/** Summary of changes between two points in time. */
export interface BehavioralDelta {
  /** Time range of this delta. */
  from: number;
  to: number;
  /** Events within the range. */
  events: ProjectEvent[];
  /** Summary counts by kind. */
  summary: Record<ProjectEventKind, number>;
  /** Subjects that were added (first 'registered' / 'added' / 'introduced'). */
  added: string[];
  /** Subjects that were removed ('removed' / 'deprecated'). */
  removed: string[];
  /** Subjects that were modified. */
  modified: string[];
}

// ─── Timeline Class ─────────────────────────────────────────────────────────

/**
 * Queryable timeline wrapping a ProjectChronicle.
 *
 * All query methods return new arrays — never the internal event store.
 */
export class Timeline {
  constructor(private readonly chronicle: ProjectChronicle) {}

  // ── Queries ─────────────────────────────────────────────────────────────

  /**
   * Query events with optional filtering.
   * Returns matching events sorted chronologically (oldest first).
   */
  getTimeline(filter?: TimelineFilter): ProjectEvent[] {
    let events = this.chronicle.getEvents();
    if (!filter) return events;
    events = applyFilter(events, filter);
    return events;
  }

  /**
   * Get all events since a timestamp (inclusive).
   */
  getEventsSince(timestamp: number): ProjectEvent[] {
    return this.getTimeline({ since: timestamp });
  }

  /**
   * Compute a behavioral delta between two timestamps.
   */
  getDelta(from: number, to: number): BehavioralDelta {
    const events = this.getTimeline({ since: from, until: to });
    return buildDelta(from, to, events);
  }

  /**
   * Get full history for a specific subject (rule id, gate name, etc.).
   * Sorted chronologically.
   */
  getHistory(subjectId: string): ProjectEvent[] {
    return this.getTimeline({ subject: subjectId });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function applyFilter(events: ProjectEvent[], filter: TimelineFilter): ProjectEvent[] {
  return events.filter(e => {
    if (filter.kind) {
      const kinds = Array.isArray(filter.kind) ? filter.kind : [filter.kind];
      if (!kinds.includes(e.kind)) return false;
    }
    if (filter.action) {
      const actions = Array.isArray(filter.action) ? filter.action : [filter.action];
      if (!actions.includes(e.action)) return false;
    }
    if (filter.subject) {
      const subjects = Array.isArray(filter.subject) ? filter.subject : [filter.subject];
      if (!subjects.includes(e.subject)) return false;
    }
    if (filter.since != null && e.timestamp < filter.since) return false;
    if (filter.until != null && e.timestamp > filter.until) return false;
    return true;
  });
}

const ADD_ACTIONS = new Set(['registered', 'added', 'introduced', 'opened']);
const REMOVE_ACTIONS = new Set(['removed', 'deprecated', 'closed']);
const MODIFY_ACTIONS = new Set(['modified', 'updated']);

function buildDelta(from: number, to: number, events: ProjectEvent[]): BehavioralDelta {
  const summary: Record<string, number> = {};
  const added = new Set<string>();
  const removed = new Set<string>();
  const modified = new Set<string>();

  for (const e of events) {
    summary[e.kind] = (summary[e.kind] ?? 0) + 1;

    if (ADD_ACTIONS.has(e.action)) {
      added.add(e.subject);
      removed.delete(e.subject); // re-added overrides removal
    } else if (REMOVE_ACTIONS.has(e.action)) {
      removed.add(e.subject);
      added.delete(e.subject); // removed overrides addition
    } else if (MODIFY_ACTIONS.has(e.action)) {
      modified.add(e.subject);
    }
  }

  return {
    from,
    to,
    events,
    summary: summary as Record<ProjectEventKind, number>,
    added: [...added],
    removed: [...removed],
    modified: [...modified],
  };
}

/**
 * Create a Timeline for a given chronicle.
 */
export function createTimeline(chronicle: ProjectChronicle): Timeline {
  return new Timeline(chronicle);
}
