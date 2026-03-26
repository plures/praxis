/**
 * Praxis Lifecycle Engine — Version Engine
 *
 * Deterministic versioning from expectations, not commits.
 * - feature → minor bump
 * - fix/security/performance/chore/docs → patch bump
 * - breaking flag → major bump
 * - Prerelease tagging (rc.1, rc.2, ...)
 * - Multi-file version sync
 * - Changelog generation from expectations
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { LifecycleExpectation, VersioningConfig } from './types.js';

// ─── Semver Types ───────────────────────────────────────────────────────────

/** Represents a parsed semantic version with optional prerelease and build metadata. */
export interface SemverVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;  // e.g., 'rc.1'
  build?: string;       // e.g., 'build.123'
}

/** The type of semver version bump to apply: major, minor, patch, or none. */
export type BumpType = 'major' | 'minor' | 'patch' | 'none';

/** The result of calculating a version bump, including the old and new version strings and the reasons for the bump. */
export interface VersionBumpResult {
  from: string;
  to: string;
  bump: BumpType;
  prerelease: boolean;
  reasons: string[];
}

/** The result of syncing a version string into a single file (e.g., package.json or Cargo.toml). */
export interface VersionSyncResult {
  file: string;
  updated: boolean;
  from?: string;
  to?: string;
  error?: string;
}

/** A single changelog entry representing the changes included in one released version. */
export interface ChangelogEntry {
  version: string;
  date: string;
  sections: Record<string, string[]>;
  breaking: string[];
}

// ─── Parse / Format ─────────────────────────────────────────────────────────

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$/;

/** Parse a semver string (e.g., `"1.2.3-rc.1"`) into a {@link SemverVersion} object, or `null` if invalid.
 *
 * @param version - Semver string with optional `"v"` prefix (e.g. `"v2.0.0"` or `"1.2.3-rc.1"`)
 * @returns Parsed {@link SemverVersion} or `null` if the string is not a valid semver
 */
export function parseSemver(version: string): SemverVersion | null {
  const clean = version.replace(/^v/, '');
  const match = clean.match(SEMVER_RE);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/** Format a {@link SemverVersion} back into a version string, optionally prefixed with `"v"`.
 *
 * @param v - The semver version object to format
 * @param prefix - When `true`, prepends `"v"` to the output (e.g. `"v1.2.3"`)
 * @returns A semver-formatted string
 */
export function formatSemver(v: SemverVersion, prefix: boolean = false): string {
  let s = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease) s += `-${v.prerelease}`;
  if (v.build) s += `+${v.build}`;
  return prefix ? `v${s}` : s;
}

// ─── Bump Calculation ───────────────────────────────────────────────────────

/**
 * Calculate the semver bump type from a set of expectations.
 * Returns the highest bump needed.
 *
 * @param expectations - Array of lifecycle expectations to examine for breaking/feature/fix markers
 * @returns The required `BumpType` and an array of reasons explaining each expectation's contribution
 */
export function calculateBump(expectations: LifecycleExpectation[]): { bump: BumpType; reasons: string[] } {
  if (expectations.length === 0) return { bump: 'none', reasons: ['No expectations'] };

  let bump: BumpType = 'none';
  const reasons: string[] = [];

  for (const exp of expectations) {
    if (exp.breaking) {
      bump = 'major';
      reasons.push(`${exp.id}: breaking change → major`);
      break; // Major wins, no need to check further
    }

    if (exp.type === 'feature' || exp.type === 'deprecation') {
      bump = 'minor';
      reasons.push(`${exp.id}: ${exp.type} → minor`);
    } else {
      // fix, security, performance, chore, docs → patch
      if (bump === 'none') {
        bump = 'patch';
        reasons.push(`${exp.id}: ${exp.type} → patch`);
      }
    }
  }

  return { bump, reasons };
}

/**
 * Apply a bump to a version, producing the next version.
 *
 * @param current - The current semver version
 * @param bump - The bump type to apply (`'major'`, `'minor'`, `'patch'`, or `'none'`)
 * @param prerelease - Optional prerelease tag and increment number (e.g. `{ tag: 'rc', increment: 1 }`)
 * @returns The new {@link SemverVersion} after applying the bump
 */
export function applyBump(
  current: SemverVersion,
  bump: BumpType,
  prerelease?: { tag: string; increment?: number },
): SemverVersion {
  let next: SemverVersion;

  switch (bump) {
    case 'major':
      next = { major: current.major + 1, minor: 0, patch: 0 };
      break;
    case 'minor':
      next = { major: current.major, minor: current.minor + 1, patch: 0 };
      break;
    case 'patch':
      next = { major: current.major, minor: current.minor, patch: current.patch + 1 };
      break;
    case 'none':
      next = { ...current };
      break;
  }

  if (prerelease) {
    const inc = prerelease.increment ?? 1;
    next.prerelease = `${prerelease.tag}.${inc}`;
  }

  return next;
}

/**
 * Increment the prerelease counter of an existing prerelease version.
 * e.g., 1.2.0-rc.1 → 1.2.0-rc.2
 *
 * @param version - The prerelease version to increment
 * @param tag - Optional prerelease tag to use (defaults to the existing tag, or `'rc'`)
 * @returns A new {@link SemverVersion} with an incremented prerelease counter
 */
export function incrementPrerelease(version: SemverVersion, tag?: string): SemverVersion {
  if (!version.prerelease) {
    return { ...version, prerelease: `${tag ?? 'rc'}.1` };
  }

  const parts = version.prerelease.split('.');
  const currentTag = parts.slice(0, -1).join('.');
  const currentNum = parseInt(parts[parts.length - 1], 10);

  return {
    ...version,
    prerelease: `${tag ?? currentTag}.${(isNaN(currentNum) ? 0 : currentNum) + 1}`,
  };
}

/**
 * Promote a prerelease to stable (strip prerelease/build metadata).
 *
 * @param version - The prerelease version to promote (e.g. `1.2.0-rc.3`)
 * @returns A stable {@link SemverVersion} with prerelease and build metadata removed
 */
export function promoteToStable(version: SemverVersion): SemverVersion {
  return { major: version.major, minor: version.minor, patch: version.patch };
}

// ─── Multi-File Version Sync ────────────────────────────────────────────────

/** Strategy for reading/writing version in different file types */
interface VersionFileStrategy {
  /** File patterns this strategy handles */
  patterns: string[];
  /** Read the current version from file content */
  read: (content: string) => string | null;
  /** Write a new version into file content */
  write: (content: string, version: string) => string;
}

const strategies: VersionFileStrategy[] = [
  {
    // package.json
    patterns: ['package.json'],
    read: (content) => {
      try {
        return JSON.parse(content).version ?? null;
      } catch { return null; }
    },
    write: (content, version) => {
      try {
        const json = JSON.parse(content);
        json.version = version;
        return JSON.stringify(json, null, 2) + '\n';
      } catch { return content; }
    },
  },
  {
    // Cargo.toml
    patterns: ['Cargo.toml'],
    read: (content) => {
      const match = content.match(/^\s*version\s*=\s*"([^"]+)"/m);
      return match?.[1] ?? null;
    },
    write: (content, version) => {
      return content.replace(
        /^(\s*version\s*=\s*")([^"]+)(")/m,
        `$1${version}$3`,
      );
    },
  },
  {
    // jsr.json / deno.json
    patterns: ['jsr.json', 'deno.json', 'deno.jsonc'],
    read: (content) => {
      try {
        return JSON.parse(content.replace(/\/\/.*/g, '')).version ?? null;
      } catch { return null; }
    },
    write: (content, version) => {
      return content.replace(
        /("version"\s*:\s*")([^"]+)(")/,
        `$1${version}$3`,
      );
    },
  },
  {
    // pyproject.toml
    patterns: ['pyproject.toml'],
    read: (content) => {
      const match = content.match(/^\s*version\s*=\s*"([^"]+)"/m);
      return match?.[1] ?? null;
    },
    write: (content, version) => {
      return content.replace(
        /^(\s*version\s*=\s*")([^"]+)(")/m,
        `$1${version}$3`,
      );
    },
  },
  {
    // .csproj / .nuspec (XML)
    patterns: ['.csproj', '.nuspec'],
    read: (content) => {
      const match = content.match(/<Version>([^<]+)<\/Version>/);
      return match?.[1] ?? null;
    },
    write: (content, version) => {
      return content.replace(
        /(<Version>)([^<]+)(<\/Version>)/,
        `$1${version}$3`,
      );
    },
  },
];

function findStrategy(filePath: string): VersionFileStrategy | null {
  const name = basename(filePath);
  for (const s of strategies) {
    if (s.patterns.some(p => name === p || name.endsWith(p))) return s;
  }
  return null;
}

/**
 * Read the current version from a file.
 *
 * Supports `package.json`, `*.csproj`, `*.fsproj`, `pyproject.toml`, `Cargo.toml`, and more.
 *
 * @param filePath - Absolute or relative path to the version file
 * @returns The version string, or `null` if unrecognized format or file not readable
 */
export function readVersionFromFile(filePath: string): string | null {
  const strategy = findStrategy(filePath);
  if (!strategy) return null;

  try {
    const content = readFileSync(filePath, 'utf-8');
    return strategy.read(content);
  } catch {
    return null;
  }
}

/**
 * Write a new version to a file.
 *
 * @param filePath - Absolute or relative path to the version file
 * @param version - The new version string to write (e.g. `"2.0.0"`)
 * @returns `true` if the version was written, `false` if the file format is unsupported or write failed
 */
export function writeVersionToFile(filePath: string, version: string): boolean {
  const strategy = findStrategy(filePath);
  if (!strategy) return false;

  try {
    const content = readFileSync(filePath, 'utf-8');
    const updated = strategy.write(content, version);
    writeFileSync(filePath, updated, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Sync a version across multiple files.
 *
 * @param rootDir - Root directory of the project
 * @param version - The target version string to write to all files
 * @param files - Optional list of file paths to sync (relative to `rootDir`; defaults to `['package.json']`)
 * @returns Array of {@link VersionSyncResult} objects, one per target file
 */
export function syncVersions(
  rootDir: string,
  version: string,
  files?: string[],
): VersionSyncResult[] {
  const targets = files ?? ['package.json'];
  const results: VersionSyncResult[] = [];

  for (const file of targets) {
    const filePath = join(rootDir, file);

    if (!existsSync(filePath)) {
      results.push({ file, updated: false, error: 'File not found' });
      continue;
    }

    const currentVersion = readVersionFromFile(filePath);
    if (currentVersion === version) {
      results.push({ file, updated: false, from: currentVersion, to: version });
      continue;
    }

    const success = writeVersionToFile(filePath, version);
    results.push({
      file,
      updated: success,
      from: currentVersion ?? undefined,
      to: version,
      error: success ? undefined : 'Write failed',
    });
  }

  return results;
}

/**
 * Check version consistency across files.
 *
 * @param rootDir - Root directory of the project
 * @param files - List of file paths to check (relative to `rootDir`)
 * @returns An object with `consistent` flag, per-file `versions`, and a list of `conflicts`
 */
export function checkVersionConsistency(
  rootDir: string,
  files: string[],
): { consistent: boolean; versions: Record<string, string | null>; conflicts: string[] } {
  const versions: Record<string, string | null> = {};
  const found = new Set<string>();
  const conflicts: string[] = [];

  for (const file of files) {
    const filePath = join(rootDir, file);
    const ver = existsSync(filePath) ? readVersionFromFile(filePath) : null;
    versions[file] = ver;
    if (ver) found.add(ver);
  }

  if (found.size > 1) {
    conflicts.push(`Version mismatch: ${Array.from(found).join(' vs ')}`);
    for (const [file, ver] of Object.entries(versions)) {
      if (ver) conflicts.push(`  ${file}: ${ver}`);
    }
  }

  return { consistent: found.size <= 1, versions, conflicts };
}

// ─── Changelog Generation ───────────────────────────────────────────────────

const SECTION_MAP: Record<string, string> = {
  feature: '✨ Features',
  fix: '🐛 Bug Fixes',
  security: '🔒 Security',
  performance: '⚡ Performance',
  chore: '🔧 Chores',
  docs: '📚 Documentation',
  deprecation: '⚠️ Deprecations',
};

/**
 * Generate a changelog entry from expectations.
 *
 * @param version - The release version string (e.g. `"2.1.0"`)
 * @param expectations - Lifecycle expectations to include in the changelog
 * @param date - Optional ISO date string (defaults to today)
 * @returns A {@link ChangelogEntry} with categorized sections and breaking changes
 */
export function generateChangelogEntry(
  version: string,
  expectations: LifecycleExpectation[],
  date?: string,
): ChangelogEntry {
  const sections: Record<string, string[]> = {};
  const breaking: string[] = [];

  for (const exp of expectations) {
    const section = SECTION_MAP[exp.type] ?? '🔧 Other';
    if (!sections[section]) sections[section] = [];
    sections[section].push(`${exp.title} (${exp.id})`);

    if (exp.breaking) {
      breaking.push(`**BREAKING:** ${exp.title} — ${exp.description}`);
    }
  }

  return {
    version,
    date: date ?? new Date().toISOString().split('T')[0],
    sections,
    breaking,
  };
}

/**
 * Format a changelog entry as markdown.
 *
 * @param entry - The changelog entry to format
 * @returns A markdown string formatted as a `## [version] — date` section
 */
export function formatChangelog(entry: ChangelogEntry): string {
  const lines: string[] = [];
  lines.push(`## [${entry.version}] — ${entry.date}`);
  lines.push('');

  if (entry.breaking.length > 0) {
    lines.push('### 💥 Breaking Changes');
    for (const b of entry.breaking) lines.push(`- ${b}`);
    lines.push('');
  }

  for (const [section, items] of Object.entries(entry.sections)) {
    lines.push(`### ${section}`);
    for (const item of items) lines.push(`- ${item}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Prepend a changelog entry to CHANGELOG.md (or create it).
 *
 * @param rootDir - Root directory of the project
 * @param entry - The changelog entry to prepend
 * @param filename - Target filename (defaults to `'CHANGELOG.md'`)
 * @returns `true` if the file was written successfully, `false` on error
 */
export function writeChangelog(
  rootDir: string,
  entry: ChangelogEntry,
  filename: string = 'CHANGELOG.md',
): boolean {
  const filePath = join(rootDir, filename);
  const formatted = formatChangelog(entry);

  try {
    if (existsSync(filePath)) {
      const existing = readFileSync(filePath, 'utf-8');
      // Insert after the header line
      const headerEnd = existing.indexOf('\n\n');
      if (headerEnd > -1) {
        const header = existing.slice(0, headerEnd + 2);
        const rest = existing.slice(headerEnd + 2);
        writeFileSync(filePath, header + formatted + '\n' + rest, 'utf-8');
      } else {
        writeFileSync(filePath, existing + '\n\n' + formatted, 'utf-8');
      }
    } else {
      const content = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${formatted}`;
      writeFileSync(filePath, content, 'utf-8');
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

/** Full result of an orchestrated version bump, including bump details, file sync results, and generated changelog entry. */
export interface VersionOrchestrationResult {
  bump: VersionBumpResult;
  sync: VersionSyncResult[];
  changelog: ChangelogEntry;
  tag: string;
}

/**
 * Orchestrate a full version bump: calculate → bump → sync → changelog → tag.
 *
 * Does NOT execute git operations — returns the tag name for the caller.
 *
 * @param rootDir - Root directory of the project
 * @param currentVersion - The current version string (e.g. `"1.2.3"`)
 * @param expectations - Lifecycle expectations to determine bump type and changelog content
 * @param config - Optional versioning configuration (prerelease tag, files to sync, etc.)
 * @param opts - Optional overrides: `prerelease`, `prereleaseTag`, `prereleaseNumber`, `dryRun`
 * @returns A {@link VersionOrchestrationResult} with bump details, file sync results, changelog, and git tag name
 */
export function orchestrateVersionBump(
  rootDir: string,
  currentVersion: string,
  expectations: LifecycleExpectation[],
  config?: VersioningConfig,
  opts?: { prerelease?: boolean; prereleaseTag?: string; prereleaseNumber?: number; dryRun?: boolean },
): VersionOrchestrationResult {
  const parsed = parseSemver(currentVersion);
  if (!parsed) throw new Error(`Invalid current version: ${currentVersion}`);

  // 1. Calculate bump
  const { bump, reasons } = calculateBump(expectations);
  if (bump === 'none') {
    return {
      bump: { from: currentVersion, to: currentVersion, bump: 'none', prerelease: false, reasons },
      sync: [],
      changelog: { version: currentVersion, date: new Date().toISOString().split('T')[0], sections: {}, breaking: [] },
      tag: `v${currentVersion}`,
    };
  }

  // 2. Apply bump
  const prerelease = opts?.prerelease !== false; // Default to prerelease
  const tag = opts?.prereleaseTag ?? config?.prereleaseTag ?? 'rc';
  const next = applyBump(parsed, bump, prerelease ? { tag, increment: opts?.prereleaseNumber } : undefined);
  const nextVersion = formatSemver(next);

  // 3. Sync files
  const versionFiles = config?.versionFiles ?? ['package.json'];
  const sync = opts?.dryRun ? [] : syncVersions(rootDir, nextVersion, versionFiles);

  // 4. Generate changelog
  const changelog = generateChangelogEntry(nextVersion, expectations);
  if (!opts?.dryRun) {
    writeChangelog(rootDir, changelog);
  }

  return {
    bump: {
      from: currentVersion,
      to: nextVersion,
      bump,
      prerelease,
      reasons,
    },
    sync,
    changelog,
    tag: `v${nextVersion}`,
  };
}
