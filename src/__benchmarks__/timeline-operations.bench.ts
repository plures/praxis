/**
 * Benchmark Suite — Timeline Operations
 *
 * Measures throughput of ProjectChronicle and Timeline queries:
 * - Recording events (single, bulk)
 * - getTimeline with no filter
 * - getTimeline with kind/action/subject/time-range filters
 * - getEventsSince (time-range scan)
 * - getDelta (behavioral diff computation)
 * - getHistory (subject filter)
 * - Large chronicle (10k events)
 */

import { describe, bench } from 'vitest';
import { ProjectChronicle, createProjectChronicle } from '../chronos/project-chronicle.js';
import { Timeline, createTimeline } from '../chronos/timeline.js';
import type { ProjectEventKind } from '../chronos/project-chronicle.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const KINDS: ProjectEventKind[] = ['rule', 'contract', 'expectation', 'gate', 'build', 'fact'];
const ACTIONS = ['registered', 'modified', 'removed', 'added', 'introduced', 'deprecated', 'opened', 'closed', 'satisfied', 'violated'];
const SUBJECTS = ['auth/login', 'auth/logout', 'cart/add', 'cart/remove', 'order/create', 'order/cancel', 'user/signup', 'user/delete'];

function makeChronicle(eventCount: number, opts: { maxEvents?: number } = {}): ProjectChronicle {
  const chronicle = createProjectChronicle({ maxEvents: opts.maxEvents ?? 0 });
  let ts = 1_000_000;
  for (let i = 0; i < eventCount; i++) {
    chronicle.record({
      kind: KINDS[i % KINDS.length]!,
      action: ACTIONS[i % ACTIONS.length]!,
      subject: SUBJECTS[i % SUBJECTS.length]!,
      timestamp: ts++,
      metadata: { index: i },
    });
  }
  return chronicle;
}

// ─── Recording ────────────────────────────────────────────────────────────────

describe('timeline operations — recording events', () => {
  bench('record 1 event', () => {
    const chronicle = createProjectChronicle({ maxEvents: 0 });
    chronicle.record({ kind: 'rule', action: 'registered', subject: 'rule-a', timestamp: 1, metadata: {} });
  });

  bench('record 100 events sequentially', () => {
    const chronicle = createProjectChronicle({ maxEvents: 0 });
    for (let i = 0; i < 100; i++) {
      chronicle.record({
        kind: KINDS[i % KINDS.length]!,
        action: ACTIONS[i % ACTIONS.length]!,
        subject: SUBJECTS[i % SUBJECTS.length]!,
        timestamp: i,
        metadata: { i },
      });
    }
  });

  bench('record 1000 events sequentially', () => {
    const chronicle = createProjectChronicle({ maxEvents: 0 });
    for (let i = 0; i < 1000; i++) {
      chronicle.record({
        kind: KINDS[i % KINDS.length]!,
        action: ACTIONS[i % ACTIONS.length]!,
        subject: SUBJECTS[i % SUBJECTS.length]!,
        timestamp: i,
        metadata: { i },
      });
    }
  });

  bench('recordRuleRegistered convenience method', () => {
    const chronicle = createProjectChronicle({ maxEvents: 0 });
    chronicle.recordRuleRegistered('my-rule', { description: 'bench rule' });
  });

  bench('record with eviction — maxEvents=100, chronicle at capacity', () => {
    const chronicle = makeChronicle(100, { maxEvents: 100 });
    chronicle.record({ kind: 'rule', action: 'registered', subject: 'new-rule', timestamp: 9_999_999, metadata: {} });
  });
});

// ─── getTimeline — unfiltered ─────────────────────────────────────────────────

describe('timeline operations — getTimeline (unfiltered)', () => {
  bench('getTimeline — 100 events', () => {
    const timeline = createTimeline(makeChronicle(100));
    timeline.getTimeline();
  });

  bench('getTimeline — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline();
  });

  bench('getTimeline — 10000 events', () => {
    const timeline = createTimeline(makeChronicle(10_000));
    timeline.getTimeline();
  });
});

// ─── getTimeline — with filters ───────────────────────────────────────────────

describe('timeline operations — getTimeline (filtered)', () => {
  bench('filter by kind — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ kind: 'rule' });
  });

  bench('filter by action — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ action: 'registered' });
  });

  bench('filter by subject — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ subject: 'auth/login' });
  });

  bench('filter by kind + action — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ kind: 'rule', action: 'registered' });
  });

  bench('filter by time range (first half) — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ since: 1_000_000, until: 1_000_500 });
  });

  bench('filter by time range (full span) — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ since: 1_000_000, until: 1_002_000 });
  });

  bench('filter by multiple kinds — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ kind: ['rule', 'contract'] });
  });

  bench('filter by multiple subjects — 1000 events', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getTimeline({ subject: ['auth/login', 'cart/add'] });
  });
});

// ─── getEventsSince ───────────────────────────────────────────────────────────

describe('timeline operations — getEventsSince', () => {
  bench('getEventsSince — scan 1000 events, match all', () => {
    const chronicle = makeChronicle(1000);
    const timeline = createTimeline(chronicle);
    timeline.getEventsSince(0);
  });

  bench('getEventsSince — scan 1000 events, match ~50%', () => {
    const chronicle = makeChronicle(1000);
    const timeline = createTimeline(chronicle);
    timeline.getEventsSince(1_001_000);
  });

  bench('getEventsSince — scan 10000 events, match ~50%', () => {
    const chronicle = makeChronicle(10_000);
    const timeline = createTimeline(chronicle);
    timeline.getEventsSince(1_010_000);
  });
});

// ─── getDelta ─────────────────────────────────────────────────────────────────

describe('timeline operations — getDelta', () => {
  bench('getDelta — 100 events, full range', () => {
    const chronicle = makeChronicle(100);
    const timeline = createTimeline(chronicle);
    timeline.getDelta(1_000_000, 1_000_300);
  });

  bench('getDelta — 1000 events, full range', () => {
    const chronicle = makeChronicle(1000);
    const timeline = createTimeline(chronicle);
    timeline.getDelta(1_000_000, 1_003_000);
  });

  bench('getDelta — 10000 events, full range', () => {
    const chronicle = makeChronicle(10_000);
    const timeline = createTimeline(chronicle);
    timeline.getDelta(1_000_000, 1_030_000);
  });

  bench('getDelta — 1000 events, narrow window (10%)', () => {
    const chronicle = makeChronicle(1000);
    const timeline = createTimeline(chronicle);
    timeline.getDelta(1_000_000, 1_000_100);
  });
});

// ─── getHistory ───────────────────────────────────────────────────────────────

describe('timeline operations — getHistory', () => {
  bench('getHistory — 100 events, common subject', () => {
    const timeline = createTimeline(makeChronicle(100));
    timeline.getHistory('auth/login');
  });

  bench('getHistory — 1000 events, common subject', () => {
    const timeline = createTimeline(makeChronicle(1000));
    timeline.getHistory('auth/login');
  });

  bench('getHistory — 10000 events, common subject', () => {
    const timeline = createTimeline(makeChronicle(10_000));
    timeline.getHistory('auth/login');
  });

  bench('getHistory — 1000 events, rare subject', () => {
    const chronicle = makeChronicle(1000);
    // Insert one unique subject at the end
    chronicle.record({ kind: 'fact', action: 'introduced', subject: 'unique-subject', timestamp: 9_999_999, metadata: {} });
    const timeline = createTimeline(chronicle);
    timeline.getHistory('unique-subject');
  });
});

// ─── Chronicle: size tracking ─────────────────────────────────────────────────

describe('timeline operations — size access', () => {
  bench('chronicle.size — 10000 events', () => {
    const chronicle = makeChronicle(10_000);
    void chronicle.size;
  });

  bench('chronicle.getEvents() — 10000 events', () => {
    const chronicle = makeChronicle(10_000);
    chronicle.getEvents();
  });
});
