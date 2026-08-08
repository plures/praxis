#!/usr/bin/env node
/**
 * Benchmark gate.
 *
 * Compares a Vitest benchmark report (`vitest bench --outputJson=<file>`)
 * against the checked-in baseline in `benchmarks/baseline.json` and exits
 * non-zero when any tracked scenario regresses beyond the allowed tolerance.
 *
 * Usage: node scripts/check-benchmarks.mjs [--report <path>] [--baseline <path>]
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const args = { report: 'bench-results.json', baseline: 'benchmarks/baseline.json' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--report' || arg === '--baseline') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      args[arg.slice(2)] = value;
      i++;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf8'));
}

/** Flatten a Vitest benchmark report into `scenario name -> ops/sec`. */
function collectResults(report) {
  const results = new Map();
  for (const file of report.files ?? []) {
    for (const group of file.groups ?? []) {
      // fullName is "<filepath> > <group name>"; keep only the group name.
      const groupName = String(group.fullName ?? '').split(' > ').slice(1).join(' > ');
      for (const benchmark of group.benchmarks ?? []) {
        results.set(`${groupName} > ${benchmark.name}`, benchmark.hz);
      }
    }
  }
  return results;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseline = readJson(args.baseline);
  const results = collectResults(readJson(args.report));

  const tolerance = baseline.tolerance;
  if (typeof tolerance !== 'number' || tolerance < 0 || tolerance >= 1) {
    process.stderr.write(`Baseline ${args.baseline} must define a numeric "tolerance" in [0, 1).\n`);
    process.exit(1);
  }

  const failures = [];
  const rows = [];

  for (const [scenario, expected] of Object.entries(baseline.scenarios ?? {})) {
    const minimum = expected * (1 - tolerance);
    const actual = results.get(scenario);
    if (actual === undefined) {
      failures.push(`${scenario}: missing from benchmark report`);
      continue;
    }
    const status = actual >= minimum ? 'ok' : 'REGRESSED';
    rows.push(`${status.padEnd(10)} ${Math.round(actual)} ops/sec (min ${Math.round(minimum)}) — ${scenario}`);
    if (actual < minimum) {
      failures.push(
        `${scenario}: ${Math.round(actual)} ops/sec is below the minimum ${Math.round(minimum)} ops/sec ` +
          `(baseline ${expected}, tolerance ${tolerance * 100}%)`,
      );
    }
  }

  process.stdout.write(`${rows.join('\n')}\n`);

  if (failures.length > 0) {
    process.stderr.write(`\nBenchmark gate failed:\n- ${failures.join('\n- ')}\n`);
    process.exit(1);
  }

  process.stdout.write(`\nBenchmark gate passed (${rows.length} scenarios).\n`);
}

main();
