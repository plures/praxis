/**
 * Praxis Lifecycle Engine — QA Integration
 *
 * QA is a first-class lifecycle phase:
 * - Test cases generated from acceptance criteria (at expectation time)
 * - QA branches created from prerelease tags
 * - Test matrix execution + artifact collection
 * - Pass/fail → lifecycle event dispatch
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { LifecycleExpectation, QAConfig } from './types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A test case generated from the acceptance criteria of a {@link LifecycleExpectation}. */
export interface TestCase {
  /** Unique test ID */
  id: string;
  /** Source expectation */
  expectationId: string;
  /** Test title */
  title: string;
  /** Test description (from acceptance criteria) */
  description: string;
  /** Given/When/Then parsed from acceptance criteria */
  steps?: { given?: string; when?: string; then?: string };
  /** Tags for filtering */
  tags: string[];
  /** Priority inherited from expectation */
  priority: string;
}

/** A matrix of test combinations across multiple configuration axes (e.g., OS × Node version). */
export interface TestMatrix {
  /** Matrix name */
  name: string;
  /** Axes to combine (e.g., { os: ['linux', 'macos'], node: ['18', '20'] }) */
  axes: Record<string, string[]>;
  /** Total combinations */
  totalCombinations: number;
  /** Test case IDs to run */
  testCaseIds: string[];
}

/** The aggregate result of executing a QA run against a prerelease, including per-test results and summary statistics. */
export interface QARunResult {
  /** Run ID */
  id: string;
  /** Prerelease version tested */
  version: string;
  /** Timestamp */
  timestamp: number;
  /** Overall pass/fail */
  passed: boolean;
  /** Per-test results */
  results: TestResult[];
  /** Summary */
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  /** Matrix combination (if applicable) */
  matrix?: Record<string, string>;
}

/** The result of executing a single test case, including pass/fail status, duration, and any error details. */
export interface TestResult {
  testId: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  /** Stack trace or additional details */
  details?: string;
}

/** A QA artifact file produced during a test run (e.g., test-cases JSON, coverage report, or run result). */
export interface QAArtifact {
  /** Artifact type */
  type: 'test-cases' | 'matrix' | 'run-result' | 'coverage' | 'summary';
  /** File path relative to artifacts dir */
  path: string;
  /** Timestamp */
  timestamp: number;
  /** Metadata */
  meta?: Record<string, unknown>;
}

// ─── Test Case Generation ───────────────────────────────────────────────────

const GWT_RE = /^Given\s+(.+?),?\s+when\s+(.+?),?\s+then\s+(.+)$/i;

/**
 * Generate test cases from expectation acceptance criteria.
 *
 * Each acceptance criterion becomes a test case. Given/When/Then
 * criteria are parsed into structured steps.
 */
export function generateTestCases(expectations: LifecycleExpectation[]): TestCase[] {
  const cases: TestCase[] = [];

  for (const exp of expectations) {
    for (let i = 0; i < exp.acceptance.length; i++) {
      const criterion = exp.acceptance[i];
      const id = `${exp.id}-tc-${i + 1}`;

      // Try to parse Given/When/Then
      const gwtMatch = criterion.match(GWT_RE);
      const steps = gwtMatch ? {
        given: gwtMatch[1].trim(),
        when: gwtMatch[2].trim(),
        then: gwtMatch[3].trim(),
      } : undefined;

      cases.push({
        id,
        expectationId: exp.id,
        title: steps ? `${exp.title}: ${steps.then}` : `${exp.title}: ${criterion}`,
        description: criterion,
        steps,
        tags: [exp.type, ...(exp.labels ?? [])],
        priority: exp.priority,
      });
    }
  }

  return cases;
}

/**
 * Format test cases as a test file template.
 *
 * Generates a vitest/jest-compatible test file skeleton.
 */
export function formatTestCasesAsCode(cases: TestCase[], framework: 'vitest' | 'jest' = 'vitest'): string {
  const imports = framework === 'vitest'
    ? `import { describe, it, expect } from 'vitest';`
    : `// Jest test file`;

  const groups = new Map<string, TestCase[]>();
  for (const tc of cases) {
    const group = tc.expectationId;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(tc);
  }

  const blocks: string[] = [
    '/**',
    ' * Auto-generated test cases from Praxis expectations.',
    ' * Fill in the test bodies to implement.',
    ' */',
    '',
    imports,
    '',
  ];

  for (const [expId, tcs] of groups) {
    blocks.push(`describe('${expId}', () => {`);
    for (const tc of tcs) {
      if (tc.steps) {
        const then = tc.steps.then ?? tc.description;
        const given = tc.steps.given ?? '';
        const when = tc.steps.when ?? '';
        blocks.push(`  it('${then.replace(/'/g, "\\'")}', () => {`);
        blocks.push(`    // Given: ${given}`);
        blocks.push(`    // When: ${when}`);
        blocks.push(`    // Then: ${then}`);
        blocks.push(`    // TODO: Implement test`);
        blocks.push(`    expect(true).toBe(true);`);
        blocks.push(`  });`);
      } else {
        blocks.push(`  it('${tc.description.replace(/'/g, "\\'")}', () => {`);
        blocks.push(`    // TODO: Implement test`);
        blocks.push(`    expect(true).toBe(true);`);
        blocks.push(`  });`);
      }
      blocks.push('');
    }
    blocks.push('});');
    blocks.push('');
  }

  return blocks.join('\n');
}

// ─── Test Matrix ────────────────────────────────────────────────────────────

/**
 * Create a test matrix from axes.
 */
export function createTestMatrix(
  name: string,
  axes: Record<string, string[]>,
  testCaseIds: string[],
): TestMatrix {
  let total = 1;
  for (const values of Object.values(axes)) {
    total *= values.length;
  }

  return { name, axes, totalCombinations: total, testCaseIds };
}

/**
 * Expand a matrix into all combinations.
 */
export function expandMatrix(matrix: TestMatrix): Record<string, string>[] {
  const keys = Object.keys(matrix.axes);
  if (keys.length === 0) return [{}];

  const combinations: Record<string, string>[] = [];

  function recurse(index: number, current: Record<string, string>) {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }
    const key = keys[index];
    for (const value of matrix.axes[key]) {
      current[key] = value;
      recurse(index + 1, current);
    }
  }

  recurse(0, {});
  return combinations;
}

// ─── Artifact Management ────────────────────────────────────────────────────

/**
 * Write QA artifacts to the artifacts directory.
 */
export function writeQAArtifact(
  rootDir: string,
  config: QAConfig,
  artifact: { type: QAArtifact['type']; filename: string; content: string },
): QAArtifact {
  const dir = join(rootDir, config.artifactsDir);
  mkdirSync(dir, { recursive: true });

  const filePath = join(dir, artifact.filename);
  writeFileSync(filePath, artifact.content, 'utf-8');

  return {
    type: artifact.type,
    path: join(config.artifactsDir, artifact.filename),
    timestamp: Date.now(),
  };
}

/**
 * Write test cases to files.
 */
export function writeTestCases(
  rootDir: string,
  config: QAConfig,
  cases: TestCase[],
): QAArtifact[] {
  const artifacts: QAArtifact[] = [];

  // Write JSON manifest
  artifacts.push(writeQAArtifact(rootDir, config, {
    type: 'test-cases',
    filename: 'test-cases.json',
    content: JSON.stringify(cases, null, 2),
  }));

  // Write test file template
  const code = formatTestCasesAsCode(cases);
  artifacts.push(writeQAArtifact(rootDir, config, {
    type: 'test-cases',
    filename: 'generated.test.ts',
    content: code,
  }));

  return artifacts;
}

/**
 * Write a QA run result.
 */
export function writeQARunResult(
  rootDir: string,
  config: QAConfig,
  result: QARunResult,
): QAArtifact {
  return writeQAArtifact(rootDir, config, {
    type: 'run-result',
    filename: `run-${result.id}.json`,
    content: JSON.stringify(result, null, 2),
  });
}

/**
 * Load all QA run results from artifacts directory.
 */
export function loadQARunResults(rootDir: string, config: QAConfig): QARunResult[] {
  const dir = join(rootDir, config.artifactsDir);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter(f => f.startsWith('run-') && f.endsWith('.json'));
  const results: QARunResult[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), 'utf-8');
      results.push(JSON.parse(content));
    } catch {
      // Skip corrupted files
    }
  }

  return results.sort((a, b) => b.timestamp - a.timestamp);
}

// ─── QA Summary ─────────────────────────────────────────────────────────────

/** Aggregated summary of QA results across all runs for a given prerelease version. */
export interface QASummary {
  version: string;
  totalRuns: number;
  lastRun?: QARunResult;
  overallPassed: boolean;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  failedTests: Array<{ testId: string; title: string; error?: string; runId: string }>;
}

/**
 * Summarize QA results for a specific version.
 */
export function summarizeQA(results: QARunResult[], version?: string): QASummary {
  const filtered = version ? results.filter(r => r.version === version) : results;
  const lastRun = filtered[0];

  const allFailed: QASummary['failedTests'] = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const run of filtered) {
    totalTests += run.summary.total;
    totalPassed += run.summary.passed;
    totalFailed += run.summary.failed;

    for (const tr of run.results) {
      if (tr.status === 'failed') {
        allFailed.push({ testId: tr.testId, title: tr.title, error: tr.error, runId: run.id });
      }
    }
  }

  return {
    version: version ?? 'all',
    totalRuns: filtered.length,
    lastRun,
    overallPassed: totalFailed === 0 && totalTests > 0,
    totalTests,
    totalPassed,
    totalFailed,
    failedTests: allFailed,
  };
}

/**
 * Format QA summary as markdown.
 */
export function formatQASummary(summary: QASummary): string {
  const icon = summary.overallPassed ? '✅' : '❌';
  const lines = [
    `${icon} **QA Summary — ${summary.version}**`,
    '',
    `- Runs: ${summary.totalRuns}`,
    `- Tests: ${summary.totalPassed}/${summary.totalTests} passed, ${summary.totalFailed} failed`,
    `- Status: ${summary.overallPassed ? 'PASSED' : 'FAILED'}`,
  ];

  if (summary.failedTests.length > 0) {
    lines.push('', '**Failed Tests:**');
    for (const ft of summary.failedTests) {
      lines.push(`- \`${ft.testId}\`: ${ft.title}${ft.error ? ` — ${ft.error}` : ''}`);
    }
  }

  if (summary.lastRun) {
    lines.push('', `Last run: ${new Date(summary.lastRun.timestamp).toISOString()} (${summary.lastRun.summary.duration}ms)`);
  }

  return lines.join('\n');
}
