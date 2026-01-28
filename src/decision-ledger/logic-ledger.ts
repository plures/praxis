/**
 * Decision Ledger - Logic Ledger Writer
 *
 * Immutable, append-only ledger persisted to disk with index and LATEST snapshots.
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Contract, Assumption } from './types.js';

export interface LogicLedgerEntry {
  ruleId: string;
  version: number;
  timestamp: string;
  canonicalBehavior: {
    behavior: string;
    examples: Contract['examples'];
    invariants: string[];
  };
  assumptions: Assumption[];
  artifacts: {
    contractPresent: boolean;
    testsPresent: boolean;
    specPresent: boolean;
  };
  drift: {
    changeSummary: string;
    assumptionsInvalidated: string[];
    assumptionsRevised: string[];
    conflicts: string[];
  };
}

export interface LogicLedgerWriteOptions {
  rootDir: string;
  author: string;
  testsPresent?: boolean;
  specPresent?: boolean;
}

export interface LogicLedgerIndex {
  byRuleId: Record<string, string>;
}

export async function writeLogicLedgerEntry(
  contract: Contract,
  options: LogicLedgerWriteOptions
): Promise<LogicLedgerEntry> {
  const rootDir = options.rootDir;
  const ledgerId = normalizeRuleId(contract.ruleId);
  const ledgerDir = path.join(rootDir, 'logic-ledger', ledgerId);
  await fs.mkdir(ledgerDir, { recursive: true });

  const latestPath = path.join(ledgerDir, 'LATEST.json');
  const latest = await readJson<LogicLedgerEntry | null>(latestPath, null);
  const nextVersion = latest ? latest.version + 1 : 1;

  const entry: LogicLedgerEntry = {
    ruleId: contract.ruleId,
    version: nextVersion,
    timestamp: new Date().toISOString(),
    canonicalBehavior: {
      behavior: contract.behavior,
      examples: contract.examples,
      invariants: contract.invariants,
    },
    assumptions: contract.assumptions ?? [],
    artifacts: {
      contractPresent: true,
      testsPresent: options.testsPresent ?? false,
      specPresent: options.specPresent ?? false,
    },
    drift: computeDrift(latest, contract),
  };

  const versionFile = path.join(ledgerDir, `v${String(nextVersion).padStart(4, '0')}.json`);
  await fs.writeFile(versionFile, JSON.stringify(entry, null, 2));
  await fs.writeFile(latestPath, JSON.stringify(entry, null, 2));

  await updateIndex(rootDir, contract.ruleId, path.relative(rootDir, ledgerDir));

  return entry;
}

function computeDrift(previous: LogicLedgerEntry | null, contract: Contract): LogicLedgerEntry['drift'] {
  if (!previous) {
    return {
      changeSummary: 'initial',
      assumptionsInvalidated: [],
      assumptionsRevised: [],
      conflicts: [],
    };
  }

  const conflicts: string[] = [];
  const previousBehavior = JSON.stringify(previous.canonicalBehavior);
  const nextBehavior = JSON.stringify({
    behavior: contract.behavior,
    examples: contract.examples,
    invariants: contract.invariants,
  });

  if (previousBehavior !== nextBehavior) {
    conflicts.push('behavior-changed');
  }

  const prevAssumptions = new Map(previous.assumptions.map((a) => [a.id, a]));
  const assumptionsInvalidated: string[] = [];
  const assumptionsRevised: string[] = [];

  for (const assumption of contract.assumptions ?? []) {
    const prior = prevAssumptions.get(assumption.id);
    if (!prior) {
      continue;
    }

    if (prior.statement !== assumption.statement || prior.status !== assumption.status) {
      assumptionsRevised.push(assumption.id);
    }
  }

  for (const prior of previous.assumptions) {
    const current = (contract.assumptions ?? []).find((a) => a.id === prior.id);
    if (!current || current.status === 'invalidated') {
      assumptionsInvalidated.push(prior.id);
    }
  }

  return {
    changeSummary: conflicts.length > 0 ? 'updated' : 'no-change',
    assumptionsInvalidated,
    assumptionsRevised,
    conflicts,
  };
}

async function updateIndex(rootDir: string, ruleId: string, ledgerDir: string): Promise<void> {
  const indexPath = path.join(rootDir, 'logic-ledger', 'index.json');
  const index = await readJson<LogicLedgerIndex>(indexPath, { byRuleId: {} });
  index.byRuleId[ruleId] = ledgerDir.replace(/\\/g, '/');
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
}

function normalizeRuleId(ruleId: string): string {
  const hash = createHash('sha256').update(ruleId).digest('hex').slice(0, 6);
  return `${ruleId.replace(/[^a-zA-Z0-9_-]/g, '-')}-${hash}`.toLowerCase();
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}
