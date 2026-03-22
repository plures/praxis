/**
 * Praxis Lifecycle Engine — Version Engine Tests (Phase 3)
 */

import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseSemver,
  formatSemver,
  calculateBump,
  applyBump,
  incrementPrerelease,
  promoteToStable,
  readVersionFromFile,
  writeVersionToFile,
  syncVersions,
  checkVersionConsistency,
  generateChangelogEntry,
  formatChangelog,
  orchestrateVersionBump,
  defineExpectation,
} from '../lifecycle/index.js';

// ─── Semver Parsing ─────────────────────────────────────────────────────────

describe('version/parse', () => {
  it('parses basic semver', () => {
    const v = parseSemver('1.2.3');
    expect(v).toEqual({ major: 1, minor: 2, patch: 3, prerelease: undefined, build: undefined });
  });

  it('parses with v prefix', () => {
    const v = parseSemver('v2.0.0');
    expect(v?.major).toBe(2);
  });

  it('parses prerelease', () => {
    const v = parseSemver('1.0.0-rc.1');
    expect(v?.prerelease).toBe('rc.1');
  });

  it('parses build metadata', () => {
    const v = parseSemver('1.0.0+build.123');
    expect(v?.build).toBe('build.123');
  });

  it('parses prerelease + build', () => {
    const v = parseSemver('1.0.0-beta.2+sha.abc');
    expect(v?.prerelease).toBe('beta.2');
    expect(v?.build).toBe('sha.abc');
  });

  it('returns null for invalid', () => {
    expect(parseSemver('not-a-version')).toBeNull();
    expect(parseSemver('')).toBeNull();
  });
});

describe('version/format', () => {
  it('formats basic version', () => {
    expect(formatSemver({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
  });

  it('formats with prefix', () => {
    expect(formatSemver({ major: 1, minor: 0, patch: 0 }, true)).toBe('v1.0.0');
  });

  it('formats with prerelease', () => {
    expect(formatSemver({ major: 2, minor: 0, patch: 0, prerelease: 'rc.1' })).toBe('2.0.0-rc.1');
  });
});

// ─── Bump Calculation ───────────────────────────────────────────────────────

describe('version/bump', () => {
  const feature = defineExpectation({ id: 'f1', type: 'feature', title: 'F', description: 'D', priority: 'medium', acceptance: [] });
  const fix = defineExpectation({ id: 'b1', type: 'fix', title: 'F', description: 'D', priority: 'medium', acceptance: [] });
  const breaking = defineExpectation({ id: 'br', type: 'feature', title: 'F', description: 'D', priority: 'medium', acceptance: [], breaking: true });
  const security = defineExpectation({ id: 's1', type: 'security', title: 'S', description: 'D', priority: 'high', acceptance: [] });

  it('feature → minor', () => {
    const { bump } = calculateBump([feature]);
    expect(bump).toBe('minor');
  });

  it('fix → patch', () => {
    const { bump } = calculateBump([fix]);
    expect(bump).toBe('patch');
  });

  it('security → patch', () => {
    const { bump } = calculateBump([security]);
    expect(bump).toBe('patch');
  });

  it('breaking → major', () => {
    const { bump } = calculateBump([breaking]);
    expect(bump).toBe('major');
  });

  it('mixed: breaking wins', () => {
    const { bump } = calculateBump([fix, feature, breaking]);
    expect(bump).toBe('major');
  });

  it('mixed: feature wins over fix', () => {
    const { bump } = calculateBump([fix, feature]);
    expect(bump).toBe('minor');
  });

  it('empty → none', () => {
    const { bump } = calculateBump([]);
    expect(bump).toBe('none');
  });

  it('applyBump minor', () => {
    const v = applyBump({ major: 1, minor: 2, patch: 3 }, 'minor');
    expect(v).toEqual({ major: 1, minor: 3, patch: 0 });
  });

  it('applyBump with prerelease', () => {
    const v = applyBump({ major: 1, minor: 0, patch: 0 }, 'minor', { tag: 'rc' });
    expect(v.prerelease).toBe('rc.1');
  });

  it('incrementPrerelease', () => {
    const v = incrementPrerelease({ major: 1, minor: 0, patch: 0, prerelease: 'rc.1' });
    expect(v.prerelease).toBe('rc.2');
  });

  it('promoteToStable strips prerelease', () => {
    const v = promoteToStable({ major: 2, minor: 0, patch: 0, prerelease: 'rc.3' });
    expect(v.prerelease).toBeUndefined();
    expect(formatSemver(v)).toBe('2.0.0');
  });
});

// ─── Multi-File Sync ────────────────────────────────────────────────────────

describe('version/sync', () => {
  const tmpDir = join('/tmp', 'praxis-version-test-' + Date.now());

  it('reads/writes package.json', () => {
    mkdirSync(tmpDir, { recursive: true });
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2));

    expect(readVersionFromFile(pkgPath)).toBe('1.0.0');

    writeVersionToFile(pkgPath, '2.0.0');
    expect(readVersionFromFile(pkgPath)).toBe('2.0.0');
  });

  it('reads/writes Cargo.toml', () => {
    const cargoPath = join(tmpDir, 'Cargo.toml');
    writeFileSync(cargoPath, '[package]\nname = "test"\nversion = "0.1.0"\n');

    expect(readVersionFromFile(cargoPath)).toBe('0.1.0');

    writeVersionToFile(cargoPath, '0.2.0');
    expect(readVersionFromFile(cargoPath)).toBe('0.2.0');
  });

  it('syncs across files', () => {
    const results = syncVersions(tmpDir, '3.0.0', ['package.json', 'Cargo.toml']);
    expect(results).toHaveLength(2);
    expect(results.every(r => r.updated)).toBe(true);

    expect(readVersionFromFile(join(tmpDir, 'package.json'))).toBe('3.0.0');
    expect(readVersionFromFile(join(tmpDir, 'Cargo.toml'))).toBe('3.0.0');
  });

  it('checks consistency', () => {
    writeVersionToFile(join(tmpDir, 'package.json'), '3.0.0');
    writeVersionToFile(join(tmpDir, 'Cargo.toml'), '2.0.0');

    const result = checkVersionConsistency(tmpDir, ['package.json', 'Cargo.toml']);
    expect(result.consistent).toBe(false);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('reports consistent when same', () => {
    syncVersions(tmpDir, '4.0.0', ['package.json', 'Cargo.toml']);
    const result = checkVersionConsistency(tmpDir, ['package.json', 'Cargo.toml']);
    expect(result.consistent).toBe(true);
  });

  // Cleanup
  it('cleanup', () => {
    rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ─── Changelog ──────────────────────────────────────────────────────────────

describe('version/changelog', () => {
  it('generates entry from expectations', () => {
    const entry = generateChangelogEntry('2.0.0', [
      defineExpectation({ id: 'f1', type: 'feature', title: 'New Login', description: 'D', priority: 'medium', acceptance: [] }),
      defineExpectation({ id: 'b1', type: 'fix', title: 'Fix Crash', description: 'D', priority: 'high', acceptance: [] }),
      defineExpectation({ id: 'br', type: 'feature', title: 'New API', description: 'D', priority: 'medium', acceptance: [], breaking: true }),
    ]);

    expect(entry.sections['✨ Features']).toHaveLength(2);
    expect(entry.sections['🐛 Bug Fixes']).toHaveLength(1);
    expect(entry.breaking).toHaveLength(1);
  });

  it('formats as markdown', () => {
    const entry = generateChangelogEntry('1.1.0', [
      defineExpectation({ id: 'f1', type: 'feature', title: 'Dark Mode', description: 'D', priority: 'medium', acceptance: [] }),
    ], '2026-03-21');

    const md = formatChangelog(entry);
    expect(md).toContain('## [1.1.0] — 2026-03-21');
    expect(md).toContain('Dark Mode');
    expect(md).toContain('✨ Features');
  });
});

// ─── Orchestrator ───────────────────────────────────────────────────────────

describe('version/orchestrate', () => {
  it('orchestrates full bump (dry run)', () => {
    const result = orchestrateVersionBump(
      '/tmp',
      '1.0.0',
      [defineExpectation({ id: 'f1', type: 'feature', title: 'A', description: 'B', priority: 'medium', acceptance: [] })],
      undefined,
      { dryRun: true },
    );

    expect(result.bump.from).toBe('1.0.0');
    expect(result.bump.to).toBe('1.1.0-rc.1');
    expect(result.bump.bump).toBe('minor');
    expect(result.bump.prerelease).toBe(true);
    expect(result.tag).toBe('v1.1.0-rc.1');
  });

  it('major bump for breaking changes', () => {
    const result = orchestrateVersionBump(
      '/tmp',
      '1.5.3',
      [defineExpectation({ id: 'br', type: 'feature', title: 'A', description: 'B', priority: 'medium', acceptance: [], breaking: true })],
      undefined,
      { dryRun: true },
    );

    expect(result.bump.to).toBe('2.0.0-rc.1');
    expect(result.bump.bump).toBe('major');
  });

  it('no bump for empty expectations', () => {
    const result = orchestrateVersionBump('/tmp', '1.0.0', [], undefined, { dryRun: true });
    expect(result.bump.bump).toBe('none');
    expect(result.bump.to).toBe('1.0.0');
  });
});
