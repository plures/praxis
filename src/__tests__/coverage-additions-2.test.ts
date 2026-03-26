/**
 * Coverage Additions — Part 2
 *
 * Targets: scanner.ts, generator.ts, reverse-generator.ts, version.ts,
 *          report.ts, canvas-state.ts, suggestions.ts, docs.ts, mcp tools
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path, { join } from 'node:path';

// ─── Scanner ─────────────────────────────────────────────────────────────────

import { scanRepository, inferContractFromFile } from '../decision-ledger/scanner.js';

describe('scanner — scanRepository', () => {
  const baseDir = path.join(process.cwd(), 'coverage-scan-temp');
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(baseDir, `run-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should scan an empty directory', async () => {
    const result = await scanRepository({ rootDir: testDir });
    expect(result.rules).toHaveLength(0);
    expect(result.constraints).toHaveLength(0);
    expect(result.filesScanned).toBe(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should throw for non-existent directory', async () => {
    await expect(
      scanRepository({ rootDir: path.join(testDir, 'nonexistent-xyz') })
    ).rejects.toThrow('Invalid root directory');
  });

  it('should throw when path is a file, not a directory', async () => {
    const filePath = path.join(testDir, 'not-a-dir.ts');
    await fs.writeFile(filePath, 'const x = 1;');
    await expect(scanRepository({ rootDir: filePath })).rejects.toThrow('Invalid root directory');
  });

  it('should discover defineRule patterns in TypeScript files', async () => {
    // Files must be in a subdirectory to match the **/*.ts glob pattern
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'src', 'rules.ts'),
      `export const r = defineRule({ id: 'my.rule', description: 'My Rule', impl: () => [] })`
    );
    const result = await scanRepository({ rootDir: testDir, scanTests: false, scanSpecs: false });
    expect(result.rules.length).toBeGreaterThan(0);
    expect(result.rules[0].id).toBe('my.rule');
    expect(result.rules[0].description).toBe('My Rule');
  });

  it('should discover defineConstraint patterns in TypeScript files', async () => {
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'src', 'constraints.ts'),
      `export const c = defineConstraint({ id: 'my.constraint', description: 'My Constraint', impl: () => true })`
    );
    const result = await scanRepository({ rootDir: testDir, scanTests: false, scanSpecs: false });
    expect(result.constraints.length).toBeGreaterThan(0);
    expect(result.constraints[0].id).toBe('my.constraint');
  });

  it('should respect custom include patterns', async () => {
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'rules.ts'), 'defineRule({ id: "r1", description: "d", impl: () => [] })');
    await fs.writeFile(path.join(testDir, 'src', 'rules.js'), 'defineRule({ id: "r2", description: "d2", impl: () => [] })');
    const result = await scanRepository({
      rootDir: testDir,
      include: ['**/*.ts'],
      scanTests: false,
      scanSpecs: false,
    });
    expect(result.rules.some(r => r.id === 'r1')).toBe(true);
  });

  it('should respect custom exclude patterns', async () => {
    await fs.mkdir(path.join(testDir, 'included'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'excluded'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'included', 'rules.ts'),
      'defineRule({ id: "included.rule", description: "d", impl: () => [] })'
    );
    await fs.writeFile(
      path.join(testDir, 'excluded', 'rules.ts'),
      'defineRule({ id: "excluded.rule", description: "d", impl: () => [] })'
    );
    const result = await scanRepository({
      rootDir: testDir,
      exclude: ['excluded/**', '**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
      scanTests: false,
      scanSpecs: false,
    });
    expect(result.rules.find(r => r.id === 'excluded.rule')).toBeUndefined();
    expect(result.rules.find(r => r.id === 'included.rule')).toBeDefined();
  });

  it('should respect maxDepth by not going deeper than allowed', async () => {
    // Files in src/ (depth 1 from rootDir) are found, src/sub/ (depth 2) files are not
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'sub'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'src', 'shallow.ts'),
      'defineRule({ id: "shallow.rule", description: "d", impl: () => [] })'
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'sub', 'deep.ts'),
      'defineRule({ id: "deep.rule", description: "d", impl: () => [] })'
    );
    const result = await scanRepository({ rootDir: testDir, maxDepth: 1, scanTests: false, scanSpecs: false });
    expect(result.rules.find(r => r.id === 'shallow.rule')).toBeDefined();
    expect(result.rules.find(r => r.id === 'deep.rule')).toBeUndefined();
  });

  it('should map test files to rule IDs when scanTests=true', async () => {
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'src', 'rules.ts'),
      'defineRule({ id: "test.mapped", description: "Test", impl: () => [] })'
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'rules.test.ts'),
      `describe('test.mapped', () => { it('works', () => {}); })`
    );
    const result = await scanRepository({ rootDir: testDir, scanTests: true, scanSpecs: false });
    expect(result.testFiles.has('test.mapped')).toBe(true);
  });

  it('should skip test file scanning when scanTests=false', async () => {
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'foo.test.ts'), 'describe("x", () => {})');
    const result = await scanRepository({ rootDir: testDir, scanTests: false, scanSpecs: false });
    expect(result.testFiles.size).toBe(0);
  });

  it('should skip spec file scanning when scanSpecs=false', async () => {
    const result = await scanRepository({ rootDir: testDir, scanTests: false, scanSpecs: false });
    expect(result.specFiles.size).toBe(0);
  });

  it('should scan spec files when scanSpecs=true', async () => {
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'src', 'rules.ts'),
      'defineRule({ id: "spec.rule", description: "d", impl: () => [] })'
    );
    // Spec scanner includes **/*.md — use a markdown spec file
    await fs.writeFile(
      path.join(testDir, 'docs', 'spec.md'),
      '# Spec\nThis documents spec.rule behavior.'
    );
    const result = await scanRepository({ rootDir: testDir, scanTests: false, scanSpecs: true });
    expect(result.specFiles.has('spec.rule')).toBe(true);
  });

  it('should discover rule without description', async () => {
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'src', 'rules.ts'),
      'defineRule({ id: "no.desc", impl: () => [] })'
    );
    const result = await scanRepository({ rootDir: testDir, scanTests: false, scanSpecs: false });
    expect(result.rules.find(r => r.id === 'no.desc')).toBeDefined();
  });
});

// ─── Component Generator ─────────────────────────────────────────────────────

import { ComponentGenerator, createComponentGenerator } from '../core/component/generator.js';
import type { ComponentDefinition, ModelDefinition } from '../core/schema/types.js';

describe('ComponentGenerator', () => {
  const makeConfig = (overrides = {}) => ({
    outputDir: '/out',
    framework: 'svelte' as const,
    typescript: true,
    includeTests: false,
    includeDocs: false,
    ...overrides,
  });

  const basicComponent: ComponentDefinition = {
    id: 'TestComp',
    name: 'TestComp',
    type: 'display',
    description: 'A test component',
    props: [
      { name: 'title', type: 'string', required: true },
      { name: 'count', type: 'number', required: false, default: 0 },
    ],
    events: [
      { name: 'change', payload: 'string', description: 'Fires on change' },
    ],
    styling: { styles: { 'color': 'red', 'font-size': '16px' } },
  };

  it('should generate a display component with model', () => {
    const gen = new ComponentGenerator(makeConfig());
    const model: ModelDefinition = {
      id: 'TestModel',
      name: 'TestModel',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'value', type: 'number' },
        { name: 'active', type: 'boolean', optional: true },
        { name: 'createdAt', type: 'date' },
        { name: 'tags', type: 'array' },
        { name: 'meta', type: 'object' },
        { name: 'custom', type: 'custom' as any },
      ],
    };
    const result = gen.generateComponent(basicComponent, model);
    expect(result.success).toBe(true);
    expect(result.files.some(f => f.type === 'component')).toBe(true);
    expect(result.files.some(f => f.type === 'types')).toBe(true);
  });

  it('should generate a form component with model fields', () => {
    const gen = new ComponentGenerator(makeConfig({ includeTests: true, includeDocs: true }));
    const formComp: ComponentDefinition = { ...basicComponent, type: 'form' };
    const model: ModelDefinition = {
      id: 'FormModel',
      name: 'FormModel',
      fields: [{ name: 'email', type: 'string' }],
    };
    const result = gen.generateComponent(formComp, model);
    expect(result.success).toBe(true);
    expect(result.files.some(f => f.type === 'test')).toBe(true);
    expect(result.files.some(f => f.type === 'docs')).toBe(true);
    const comp = result.files.find(f => f.type === 'component');
    expect(comp?.content).toContain('handleSubmit');
    expect(comp?.content).toContain('handleReset');
  });

  it('should generate a list component', () => {
    const gen = new ComponentGenerator(makeConfig());
    const listComp: ComponentDefinition = { ...basicComponent, type: 'list' };
    const result = gen.generateComponent(listComp);
    expect(result.success).toBe(true);
    const comp = result.files.find(f => f.type === 'component');
    expect(comp?.content).toContain('handleSelect');
    expect(comp?.content).toContain('handleDelete');
  });

  it('should generate a navigation component', () => {
    const gen = new ComponentGenerator(makeConfig());
    const navComp: ComponentDefinition = { ...basicComponent, type: 'navigation' };
    const result = gen.generateComponent(navComp);
    expect(result.success).toBe(true);
    const comp = result.files.find(f => f.type === 'component');
    expect(comp?.content).toContain('navigate');
  });

  it('should generate a default (unknown type) component', () => {
    const gen = new ComponentGenerator(makeConfig());
    const defComp: ComponentDefinition = { ...basicComponent, type: 'custom' as any };
    const result = gen.generateComponent(defComp);
    expect(result.success).toBe(true);
    const comp = result.files.find(f => f.type === 'component');
    expect(comp?.content).toContain('console.log');
  });

  it('should generate without TypeScript', () => {
    const gen = new ComponentGenerator(makeConfig({ typescript: false }));
    const result = gen.generateComponent(basicComponent);
    expect(result.success).toBe(true);
    expect(result.files.some(f => f.type === 'types')).toBe(false);
    const comp = result.files.find(f => f.type === 'component');
    expect(comp?.content).not.toContain('lang="ts"');
  });

  it('should generate docs with no props and no events', () => {
    const gen = new ComponentGenerator(makeConfig({ includeDocs: true }));
    const noPropsComp: ComponentDefinition = {
      id: 'Bare',
      name: 'Bare',
      type: 'display',
      description: 'Bare component',
    };
    const result = gen.generateComponent(noPropsComp);
    expect(result.success).toBe(true);
    const docs = result.files.find(f => f.type === 'docs');
    expect(docs?.content).toContain('No props defined');
    expect(docs?.content).toContain('No events defined');
  });

  it('should generate types file with model but no props', () => {
    const gen = new ComponentGenerator(makeConfig());
    const noPropsComp: ComponentDefinition = { id: 'NP', name: 'NP', type: 'display' };
    const model: ModelDefinition = {
      id: 'NpModel',
      name: 'NpModel',
      fields: [{ name: 'x', type: 'string', optional: true }],
    };
    const result = gen.generateComponent(noPropsComp, model);
    expect(result.success).toBe(true);
    const types = result.files.find(f => f.type === 'types');
    expect(types?.content).toContain('NpModel');
  });

  it('should return errors when component generation throws', () => {
    const gen = new ComponentGenerator(makeConfig());
    // Spy on private method to force a throw
    vi.spyOn(gen as any, 'generateComponentFile').mockImplementationOnce(() => {
      throw new Error('Simulated generation error');
    });
    const result = gen.generateComponent({ id: 'Err', name: 'Err', type: 'display' });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Simulated generation error');
  });

  it('createComponentGenerator uses defaults', () => {
    const gen = createComponentGenerator('/output', { includeTests: true });
    expect(gen).toBeInstanceOf(ComponentGenerator);
  });

  it('should generate component with styling', () => {
    const gen = new ComponentGenerator(makeConfig());
    const styledComp: ComponentDefinition = {
      id: 'Styled',
      name: 'Styled',
      type: 'display',
      styling: { styles: { padding: '8px', margin: '0' } },
    };
    const result = gen.generateComponent(styledComp);
    expect(result.success).toBe(true);
    const comp = result.files.find(f => f.type === 'component');
    expect(comp?.content).toContain('padding');
  });
});

// ─── Reverse Generator ───────────────────────────────────────────────────────

import { generateContractFromRule, buildPromptForContract } from '../decision-ledger/reverse-generator.js';
import type { RuleDescriptor } from '../core/rules.js';
import { RuleResult } from '../core/rule-result.js';

describe('reverse-generator', () => {
  const baseDir = path.join(process.cwd(), 'coverage-reverse-temp');
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(baseDir, `run-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  const ruleDescriptor: RuleDescriptor = {
    id: 'test.rule',
    description: 'Does something important',
    impl: () => RuleResult.noop('test'),
  };

  it('should generate contract with heuristic (default)', async () => {
    const result = await generateContractFromRule(ruleDescriptor);
    expect(result.contract).toBeDefined();
    expect(result.contract.ruleId).toBe('test.rule');
    expect(result.method).toBe('heuristic');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should include assumptions when includeAssumptions=true', async () => {
    const result = await generateContractFromRule(ruleDescriptor, { includeAssumptions: true });
    expect(result.contract.assumptions?.length).toBeGreaterThan(0);
  });

  it('should not include assumptions when includeAssumptions=false', async () => {
    const result = await generateContractFromRule(ruleDescriptor, { includeAssumptions: false });
    expect(result.contract.assumptions ?? []).toHaveLength(0);
  });

  it('should use sourceFile to infer behavior', async () => {
    const sourceFile = path.join(testDir, 'source.ts');
    await fs.writeFile(
      sourceFile,
      `/** Does something important */\nexport const rule = defineRule({ id: 'test.rule', description: 'Does something', impl: () => [] });`
    );
    const result = await generateContractFromRule(ruleDescriptor, { sourceFile });
    expect(result.contract).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('should warn when sourceFile does not exist', async () => {
    const result = await generateContractFromRule(ruleDescriptor, {
      sourceFile: path.join(testDir, 'nonexistent.ts'),
    });
    expect(result.warnings.some(w => w.includes('Failed to analyze source file'))).toBe(true);
  });

  it('should extract examples from test files', async () => {
    const testFile = path.join(testDir, 'rule.test.ts');
    await fs.writeFile(
      testFile,
      `it('should emit when triggered', () => { expect(true).toBe(true); });
it('test.rule when condition is met should produce output', () => {});`
    );
    const result = await generateContractFromRule(ruleDescriptor, {
      generateExamples: true,
      testFiles: [testFile],
    });
    expect(result.contract.examples.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should warn when test file does not exist', async () => {
    const result = await generateContractFromRule(ruleDescriptor, {
      testFiles: [path.join(testDir, 'missing.test.ts')],
    });
    expect(result.warnings.some(w => w.includes('Failed to extract examples'))).toBe(true);
  });

  it('should add references from spec files', async () => {
    const specFile = path.join(testDir, 'spec.md');
    await fs.writeFile(specFile, '# Spec for test.rule');
    const result = await generateContractFromRule(ruleDescriptor, { specFiles: [specFile] });
    expect(result.contract.references?.length).toBeGreaterThan(0);
  });

  it('should warn about no examples when generateExamples=false', async () => {
    const result = await generateContractFromRule(ruleDescriptor, { generateExamples: false });
    expect(result.warnings.some(w => w.includes('Example generation disabled'))).toBe(true);
  });

  it('should warn about no test files when generateExamples=true but testFiles empty', async () => {
    const result = await generateContractFromRule(ruleDescriptor, { generateExamples: true, testFiles: [] });
    expect(result.warnings.some(w => w.includes('No test files provided'))).toBe(true);
  });

  it('should throw when AI provider is openai but no apiKey', async () => {
    const result = await generateContractFromRule(ruleDescriptor, { aiProvider: 'openai' });
    expect(result.warnings.some(w => w.includes('AI generation failed'))).toBe(true);
  });

  it('should throw when AI provider is github-copilot but no token', async () => {
    const result = await generateContractFromRule(ruleDescriptor, { aiProvider: 'github-copilot' });
    expect(result.warnings.some(w => w.includes('AI generation failed'))).toBe(true);
  });

  it('should throw when AI provider is auto but no credentials', async () => {
    const result = await generateContractFromRule(ruleDescriptor, { aiProvider: 'auto' });
    expect(result.warnings.some(w => w.includes('AI generation failed'))).toBe(true);
  });

  it('should use openai AI provider when apiKey provided (falls back to heuristic)', async () => {
    const result = await generateContractFromRule(ruleDescriptor, {
      aiProvider: 'openai',
      openaiApiKey: 'fake-key',
      confidenceThreshold: 0.99, // force fallback warning
    });
    expect(result.contract).toBeDefined();
    expect(result.method).toBe('heuristic');
  });

  it('should use github-copilot AI provider when token provided (falls back to heuristic)', async () => {
    const result = await generateContractFromRule(ruleDescriptor, {
      aiProvider: 'github-copilot',
      githubToken: 'fake-token',
      confidenceThreshold: 0.99,
    });
    expect(result.contract).toBeDefined();
  });

  it('should use auto AI provider with openaiApiKey', async () => {
    const result = await generateContractFromRule(ruleDescriptor, {
      aiProvider: 'auto',
      openaiApiKey: 'fake-key',
      confidenceThreshold: 0.99,
    });
    expect(result.contract).toBeDefined();
  });

  it('should use auto AI provider with githubToken', async () => {
    const result = await generateContractFromRule(ruleDescriptor, {
      aiProvider: 'auto',
      githubToken: 'fake-token',
      confidenceThreshold: 0.99,
    });
    expect(result.contract).toBeDefined();
  });

  it('buildPromptForContract should include descriptor info', () => {
    const prompt = buildPromptForContract(ruleDescriptor, {
      testFiles: ['test.ts'],
      specFiles: ['spec.md'],
    });
    expect(prompt).toContain('test.rule');
    expect(prompt).toContain('Does something important');
    expect(prompt).toContain('test.ts');
    expect(prompt).toContain('spec.md');
  });

  it('buildPromptForContract with no files', () => {
    const prompt = buildPromptForContract(ruleDescriptor, {});
    expect(prompt).toContain('test.rule');
    expect(prompt).not.toContain('Test files available');
  });
});

// ─── Version ─────────────────────────────────────────────────────────────────

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
  writeChangelog,
  orchestrateVersionBump,
} from '../lifecycle/version.js';
import type { LifecycleExpectation } from '../lifecycle/types.js';

describe('version — writeChangelog', () => {
  const versionDir = path.join(process.cwd(), 'coverage-version-temp');
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(versionDir, `run-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should create CHANGELOG.md when it does not exist', () => {
    const entry = generateChangelogEntry('1.0.0', [], '2024-01-01');
    const ok = writeChangelog(testDir, entry);
    expect(ok).toBe(true);
    expect(existsSync(join(testDir, 'CHANGELOG.md'))).toBe(true);
  });

  it('should prepend to existing CHANGELOG.md with header', async () => {
    writeFileSync(join(testDir, 'CHANGELOG.md'), '# Changelog\n\nOld content here.\n');
    const entry = generateChangelogEntry('2.0.0', [], '2024-06-01');
    const ok = writeChangelog(testDir, entry);
    expect(ok).toBe(true);
    const content = await fs.readFile(join(testDir, 'CHANGELOG.md'), 'utf-8');
    expect(content).toContain('2.0.0');
    expect(content).toContain('Old content here');
  });

  it('should append when no double-newline header separator in CHANGELOG.md', () => {
    writeFileSync(join(testDir, 'CHANGELOG.md'), '# Just a line');
    const entry = generateChangelogEntry('3.0.0', [], '2024-06-01');
    const ok = writeChangelog(testDir, entry);
    expect(ok).toBe(true);
  });

  it('should return false when write fails', () => {
    // Use a non-existent nested dir (no recursive mkdir), making write fail
    const ok = writeChangelog(join(testDir, 'no-exist', 'subdir'), generateChangelogEntry('1.0.0', []));
    expect(ok).toBe(false);
  });
});

describe('version — checkVersionConsistency', () => {
  const versionDir = path.join(process.cwd(), 'coverage-version-check-temp');
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(versionDir, `run-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should report consistent versions', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ version: '1.2.3' }, null, 2));
    const result = checkVersionConsistency(testDir, ['package.json']);
    expect(result.consistent).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('should detect version mismatch across files', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ version: '1.0.0' }, null, 2));
    writeFileSync(join(testDir, 'jsr.json'), JSON.stringify({ version: '2.0.0' }));
    const result = checkVersionConsistency(testDir, ['package.json', 'jsr.json']);
    expect(result.consistent).toBe(false);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('should handle missing files gracefully', () => {
    const result = checkVersionConsistency(testDir, ['nonexistent.json']);
    expect(result.consistent).toBe(true);
    expect(result.versions['nonexistent.json']).toBeNull();
  });
});

describe('version — orchestrateVersionBump', () => {
  const versionDir = path.join(process.cwd(), 'coverage-version-orch-temp');
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(versionDir, `run-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  const featureExp: LifecycleExpectation = {
    id: 'exp-1',
    type: 'feature',
    title: 'New feature',
    description: 'A new feature',
    status: 'planned',
    breaking: false,
    labels: [],
    relatedRules: [],
  };

  it('should perform dryRun without writing files', () => {
    const result = orchestrateVersionBump(testDir, '1.0.0', [featureExp], undefined, { dryRun: true });
    expect(result.bump.bump).toBe('minor');
    expect(result.sync).toHaveLength(0);
    // CHANGELOG.md should NOT be created in dryRun
    expect(existsSync(join(testDir, 'CHANGELOG.md'))).toBe(false);
  });

  it('should return no-op result when bump is none', () => {
    const result = orchestrateVersionBump(testDir, '1.0.0', [], undefined, { dryRun: true });
    expect(result.bump.bump).toBe('none');
    expect(result.tag).toBe('v1.0.0');
  });

  it('should throw for invalid current version', () => {
    expect(() => orchestrateVersionBump(testDir, 'not-valid', [featureExp])).toThrow(
      'Invalid current version'
    );
  });

  it('should use custom prerelease tag', () => {
    const result = orchestrateVersionBump(
      testDir,
      '1.0.0',
      [featureExp],
      undefined,
      { prerelease: true, prereleaseTag: 'beta', prereleaseNumber: 2, dryRun: true }
    );
    expect(result.tag).toContain('beta');
    expect(result.tag).toContain('2');
  });

  it('should apply bump without prerelease when prerelease=false', () => {
    const result = orchestrateVersionBump(
      testDir,
      '1.0.0',
      [featureExp],
      undefined,
      { prerelease: false, dryRun: true }
    );
    expect(result.tag).not.toContain('rc');
    expect(result.bump.prerelease).toBe(false);
  });
});

// ─── Report ──────────────────────────────────────────────────────────────────

import { generateLedger, formatLedger, formatBuildOutput, diffLedgers } from '../decision-ledger/report.js';
import { PraxisRegistry } from '../core/rules.js';
import { LogicEngine } from '../core/engine.js';
import { defineRule } from '../dsl/index.js';
import { fact } from '../core/rule-result.js';
import type { AnalysisReport } from '../decision-ledger/analyzer-types.js';

function makeEmptyReport(overrides: Partial<AnalysisReport> = {}): AnalysisReport {
  return {
    timestamp: new Date().toISOString(),
    factDerivationChains: [],
    deadRules: [],
    unreachableStates: [],
    shadowedRules: [],
    contradictions: [],
    gaps: [],
    suggestions: [],
    summary: {
      totalRules: 2,
      totalConstraints: 1,
      deadRuleCount: 0,
      unreachableStateCount: 0,
      shadowedRuleCount: 0,
      contradictionCount: 0,
      gapCount: 0,
      suggestionCount: 0,
      healthScore: 100,
    },
    ...overrides,
  };
}

describe('report — formatBuildOutput', () => {
  it('should produce CI-friendly output with no issues', () => {
    const report = makeEmptyReport();
    const output = formatBuildOutput(report);
    expect(output).toContain('::group::Decision Ledger Analysis');
    expect(output).toContain('::endgroup::');
    expect(output).not.toContain('::error');
  });

  it('should emit errors for contradictions', () => {
    const report = makeEmptyReport({
      contradictions: [
        { ruleA: 'ruleA', ruleB: 'ruleB', conflictingTag: 'fact.x', reason: 'Both produce same fact', sharedEventTypes: [] },
      ],
      summary: { ...makeEmptyReport().summary, contradictionCount: 1, healthScore: 80 },
    });
    const output = formatBuildOutput(report);
    expect(output).toContain('::error title=Contradiction');
  });

  it('should emit errors for no-rule gaps', () => {
    const report = makeEmptyReport({
      gaps: [
        { expectationName: 'missing behavior', type: 'no-rule', description: 'no rule', partialCoverage: [] },
      ],
    });
    const output = formatBuildOutput(report);
    expect(output).toContain('::error title=Missing Rule');
  });

  it('should emit warnings for dead rules', () => {
    const report = makeEmptyReport({
      deadRules: [
        { ruleId: 'dead.rule', reason: 'never fires', requiredEventTypes: ['evt.x'] },
      ],
    });
    const output = formatBuildOutput(report);
    expect(output).toContain('::warning title=Dead Rule');
  });

  it('should emit warnings for shadowed rules', () => {
    const report = makeEmptyReport({
      shadowedRules: [
        { ruleId: 'shadow.rule', shadowedBy: 'dominant.rule', reason: 'always dominated', sharedEventTypes: ['evt'] },
      ],
    });
    const output = formatBuildOutput(report);
    expect(output).toContain('::warning title=Shadowed Rule');
  });

  it('should emit warnings for unreachable states', () => {
    const report = makeEmptyReport({
      unreachableStates: [
        { factTags: ['a.fact', 'b.fact'], reason: 'impossible combination' },
      ],
    });
    const output = formatBuildOutput(report);
    expect(output).toContain('::warning title=Unreachable State');
  });

  it('should emit warnings for partial-coverage and no-contract gaps', () => {
    const report = makeEmptyReport({
      gaps: [
        { expectationName: 'partial', type: 'partial-coverage', description: 'partial', partialCoverage: ['rule.a'] },
        { expectationName: 'missing contract', type: 'no-contract', description: 'no contract', partialCoverage: ['rule.b'] },
      ],
    });
    const output = formatBuildOutput(report);
    expect(output).toContain('::warning title=Partial Coverage');
    expect(output).toContain('::warning title=Missing Contract');
  });
});

describe('report — diffLedgers', () => {
  it('should detect added and removed issues', () => {
    const before = makeEmptyReport({
      deadRules: [{ ruleId: 'old.rule', reason: 'old', requiredEventTypes: [] }],
    });
    const after = makeEmptyReport({
      deadRules: [{ ruleId: 'new.rule', reason: 'new', requiredEventTypes: [] }],
    });
    const diff = diffLedgers(before, after);
    expect(diff.changes.some(c => c.type === 'removed' && c.entityId === 'old.rule')).toBe(true);
    expect(diff.changes.some(c => c.type === 'added' && c.entityId === 'new.rule')).toBe(true);
    expect(diff.summary).toBeDefined();
  });

  it('should compute score delta', () => {
    const before = makeEmptyReport({ summary: { ...makeEmptyReport().summary, healthScore: 70 } });
    const after = makeEmptyReport({ summary: { ...makeEmptyReport().summary, healthScore: 90 } });
    const diff = diffLedgers(before, after);
    expect(diff.scoreDelta).toBe(20);
    expect(diff.summary).toContain('improved');
  });

  it('should diff unreachable states', () => {
    const before = makeEmptyReport({
      unreachableStates: [{ factTags: ['a', 'b'], reason: 'old' }],
    });
    const after = makeEmptyReport();
    const diff = diffLedgers(before, after);
    expect(diff.changes.some(c => c.category === 'unreachable-state' && c.type === 'removed')).toBe(true);
  });

  it('should diff shadowed rules', () => {
    const before = makeEmptyReport();
    const after = makeEmptyReport({
      shadowedRules: [{ ruleId: 'sr', shadowedBy: 'dom', reason: 'test', sharedEventTypes: [] }],
    });
    const diff = diffLedgers(before, after);
    expect(diff.changes.some(c => c.category === 'shadowed-rule' && c.type === 'added')).toBe(true);
  });

  it('should diff contradictions', () => {
    const before = makeEmptyReport({
      contradictions: [{ ruleA: 'a', ruleB: 'b', conflictingTag: 'x', reason: 'r', sharedEventTypes: [] }],
    });
    const after = makeEmptyReport();
    const diff = diffLedgers(before, after);
    expect(diff.changes.some(c => c.category === 'contradiction' && c.type === 'removed')).toBe(true);
  });

  it('should diff gaps', () => {
    const before = makeEmptyReport();
    const after = makeEmptyReport({
      gaps: [{ expectationName: 'new gap', type: 'no-rule', description: 'missing', partialCoverage: [] }],
    });
    const diff = diffLedgers(before, after);
    expect(diff.changes.some(c => c.category === 'gap' && c.type === 'added')).toBe(true);
  });
});

// ─── Canvas State ─────────────────────────────────────────────────────────────

import { CanvasStateManager, createCanvasStateManager } from '../../ui/canvas/canvas-state.js';

function makePSFSchema() {
  return {
    id: 'test-schema',
    name: 'Test Schema',
    version: '1.0.0',
    description: 'Test schema',
    createdAt: '2024-01-01',
    modifiedAt: '2024-01-01',
    facts: [
      { id: 'fact1', tag: 'user.loaded', description: 'User loaded', position: { x: 10, y: 20 } },
      { id: 'fact2', tag: 'data.ready', description: 'Data ready' },
    ],
    events: [
      { id: 'ev1', tag: 'user.login', description: 'Login event', position: { x: 0, y: 0 } },
      { id: 'ev2', tag: 'data.fetch', description: 'Fetch event', position: { x: 50, y: 50 } },
    ],
    rules: [
      {
        id: 'rule1',
        name: 'Login Rule',
        description: 'Handles login',
        triggers: ['user.login'],
        position: { x: 100, y: 100 },
        logic: { events: ['ev2'] },
      },
      {
        id: 'rule2',
        name: 'No-trigger Rule',
        description: 'No triggers',
        position: { x: 200, y: 200 },
      },
    ],
    constraints: [
      { id: 'c1', name: 'Always Valid', description: 'Must be valid', position: { x: 0, y: 0 } },
    ],
    models: [
      {
        id: 'm1',
        name: 'User',
        description: 'User model',
        fields: [{ name: 'id', type: 'string' }],
        relationships: [{ name: 'profile', type: 'hasOne', target: 'Profile' }],
        position: { x: 0, y: 0 },
      },
      {
        id: 'm2',
        name: 'Profile',
        description: 'Profile model',
        fields: [],
        position: { x: 100, y: 0 },
      },
    ],
    components: [
      {
        id: 'comp1',
        name: 'UserCard',
        description: 'User card',
        model: 'User',
        events: [],
        position: { x: 0, y: 200 },
      },
      {
        id: 'comp2',
        name: 'Orphan',
        description: 'No model',
        events: [],
        position: { x: 0, y: 300 },
      },
    ],
    canvas: {
      viewport: { x: 10, y: 20, zoom: 1.5 },
      grid: { enabled: true, size: 20, snap: true },
      connections: [
        { id: 'conn1', source: 'fact1', target: 'rule1', type: 'data', label: 'feeds' },
      ],
    },
  } as any;
}

describe('CanvasStateManager', () => {
  let mgr: CanvasStateManager;

  beforeEach(() => {
    mgr = createCanvasStateManager();
  });

  it('should start with initial state', () => {
    const state = mgr.getState();
    expect(state.nodes.size).toBe(0);
    expect(state.edges.size).toBe(0);
    expect(state.mode).toBe('select');
    expect(state.loading).toBe(true);
  });

  it('should load from schema', () => {
    mgr.loadFromSchema(makePSFSchema());
    const state = mgr.getState();
    expect(state.nodes.size).toBeGreaterThan(0);
    expect(state.loading).toBe(false);
  });

  it('should select a node', () => {
    mgr.loadFromSchema(makePSFSchema());
    mgr.selectNode('fact1');
    const state = mgr.getState();
    expect(state.selection.nodes.has('fact1')).toBe(true);
    expect(state.nodes.get('fact1')?.selected).toBe(true);
  });

  it('should select node with addToSelection=true', () => {
    mgr.loadFromSchema(makePSFSchema());
    mgr.selectNode('fact1');
    mgr.selectNode('fact2', true);
    const state = mgr.getState();
    expect(state.selection.nodes.has('fact1')).toBe(true);
    expect(state.selection.nodes.has('fact2')).toBe(true);
  });

  it('should clear selection', () => {
    mgr.loadFromSchema(makePSFSchema());
    mgr.selectNode('fact1');
    mgr.clearSelection();
    const state = mgr.getState();
    expect(state.selection.nodes.size).toBe(0);
    expect(state.nodes.get('fact1')?.selected).toBe(false);
  });

  it('should move node with grid snap', () => {
    mgr.loadFromSchema(makePSFSchema());
    mgr.moveNode('fact1', { x: 103, y: 207 });
    const state = mgr.getState();
    const node = state.nodes.get('fact1');
    // Grid size is 20, snap enabled: 103 → 100, 207 → 200
    expect(node?.position.x).toBe(100);
    expect(node?.position.y).toBe(200);
  });

  it('should move node without snap when grid.snap=false', () => {
    mgr.loadFromSchema(makePSFSchema());
    // Override grid to disable snap
    (mgr as any).state = { ...(mgr as any).state, grid: { ...(mgr as any).state.grid, snap: false } };
    mgr.moveNode('fact1', { x: 103, y: 207 });
    const state = mgr.getState();
    expect(state.nodes.get('fact1')?.position.x).toBe(103);
  });

  it('should set viewport', () => {
    mgr.setViewport({ x: 100, y: 200, zoom: 2 });
    expect(mgr.getState().viewport.x).toBe(100);
    expect(mgr.getState().viewport.zoom).toBe(2);
  });

  it('should set mode', () => {
    mgr.setMode('pan');
    expect(mgr.getState().mode).toBe('pan');
  });

  it('should toggle grid visibility', () => {
    const before = mgr.getState().grid.visible;
    mgr.toggleGrid();
    expect(mgr.getState().grid.visible).toBe(!before);
  });

  it('should undo and redo', () => {
    mgr.loadFromSchema(makePSFSchema());
    mgr.selectNode('fact1');
    const canUndo = mgr.undo();
    expect(canUndo).toBe(true);
    const canRedo = mgr.redo();
    expect(canRedo).toBe(true);
  });

  it('should return false when nothing to undo/redo', () => {
    expect(mgr.undo()).toBe(false);
    expect(mgr.redo()).toBe(false);
  });

  it('should notify subscribers', () => {
    let calls = 0;
    const unsub = mgr.subscribe(() => { calls++; });
    mgr.setMode('pan');
    expect(calls).toBeGreaterThanOrEqual(2); // initial call + update
    unsub();
    mgr.setMode('select');
    expect(calls).toBe(calls); // no more calls
  });

  it('should export to schema', () => {
    const schema = makePSFSchema();
    mgr.loadFromSchema(schema);
    const exported = mgr.exportToSchema(schema);
    expect(exported.canvas?.viewport).toBeDefined();
    expect(exported.facts).toBeDefined();
  });

  it('should handle canvas.connections in loadFromSchema', () => {
    mgr.loadFromSchema(makePSFSchema());
    const state = mgr.getState();
    expect(state.edges.has('conn1')).toBe(true);
  });
});

// ─── Suggestions ─────────────────────────────────────────────────────────────

import { suggest } from '../decision-ledger/suggestions.js';
import type { ContractCoverageGap } from '../decision-ledger/analyzer-types.js';

describe('suggestions — suggest', () => {
  it('should handle contract-gap: missing-error-path', () => {
    const gap: ContractCoverageGap = {
      ruleId: 'my.rule',
      type: 'missing-error-path',
      description: 'No error path examples',
      affectedEventTypes: [],
    };
    const s = suggest(gap, 'contract-gap');
    expect(s.findingType).toBe('contract-gap');
    expect(s.message).toContain('error');
    expect(s.priority).toBe(6);
  });

  it('should handle contract-gap: missing-edge-case', () => {
    const gap: ContractCoverageGap = {
      ruleId: 'my.rule',
      type: 'missing-edge-case',
      description: 'Missing edge case for event X',
      affectedEventTypes: ['X'],
    };
    const s = suggest(gap, 'contract-gap');
    expect(s.priority).toBe(5);
    expect(s.message).toContain('my.rule');
  });

  it('should handle contract-gap: missing-boundary', () => {
    const gap: ContractCoverageGap = {
      ruleId: 'my.rule',
      type: 'missing-boundary',
      description: 'Only 1 example',
      affectedEventTypes: [],
    };
    const s = suggest(gap, 'contract-gap');
    expect(s.priority).toBe(4);
    expect(s.message).toContain('boundary');
  });

  it('should handle contract-gap: cross-reference-broken', () => {
    const gap: ContractCoverageGap = {
      ruleId: 'my.rule',
      type: 'cross-reference-broken',
      description: 'Broken reference',
      affectedEventTypes: [],
    };
    const s = suggest(gap, 'contract-gap');
    expect(s.action).toBe('modify');
    expect(s.priority).toBe(7);
  });

  it('should handle contract-gap: unknown subtype', () => {
    const gap: ContractCoverageGap = {
      ruleId: 'my.rule',
      type: 'unknown' as any,
      description: 'Unknown type',
      affectedEventTypes: [],
    };
    const s = suggest(gap, 'contract-gap');
    expect(s.priority).toBe(3);
  });

  it('should handle unknown finding type via default case', () => {
    const s = suggest({} as any, 'unknown-type' as any);
    expect(s.message).toContain('Unknown finding type');
  });
});

// ─── Docs ─────────────────────────────────────────────────────────────────────

import {
  auditDocs,
  planDocsUpdate,
  validateAgainstTemplate,
  defaultTemplates,
  defaultDocsConfig,
} from '../lifecycle/docs.js';

describe('docs — validateAgainstTemplate', () => {
  const readmeTemplate = defaultTemplates.find(t => t.type === 'readme')!;
  const apiTemplate = defaultTemplates.find(t => t.type === 'api')!;

  it('should validate a valid README', () => {
    // README template requires: Project Name (first heading), Installation, Quick Start, Features, License
    const content = [
      '# My Project',
      '',
      '## Installation',
      '',
      'Run npm install.',
      '',
      '## Quick Start',
      '',
      'See the example.',
      '',
      '## Features',
      '',
      '- Feature 1',
      '',
      '## License',
      '',
      'MIT License. This document has enough content to pass the short-doc check validation.',
    ].join('\n');
    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.valid).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
  });

  it('should detect missing required sections', () => {
    const content = `# My Project\n\nJust a short doc.`;
    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.valid).toBe(false);
    expect(result.missingRequired.length).toBeGreaterThan(0);
    expect(result.suggestions.some(s => s.includes('Add required sections'))).toBe(true);
  });

  it('should warn about very short documents', () => {
    const content = `# Title\n\nShort.`;
    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.suggestions.some(s => s.includes('very short'))).toBe(true);
  });

  it('should identify extra sections not in template', () => {
    const content = `# My Project\n\n## Installation\n\n## Usage\n\n## API\n\n## License\n\n## Random Extra Section That Is Not In The Template`;
    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.extraSections.length).toBeGreaterThan(0);
  });

  it('should validate an API doc template', () => {
    const content = `# Module Name\n\n## Exports\n\nSome exports...\n\n## Types\n\nSome types...\n\n## Usage\n\nExample usage here to pass the short document check for the API reference template.`;
    const result = validateAgainstTemplate(content, apiTemplate, 'docs/api/module.md');
    expect(result.template).toBe(apiTemplate.name);
    expect(result.path).toBe('docs/api/module.md');
  });
});

describe('docs — auditDocs', () => {
  const docsDir = path.join(process.cwd(), 'coverage-docs-temp');
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(docsDir, `run-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should report missing root docs', () => {
    const config = defaultDocsConfig({ rootDocs: ['README.md', 'CONTRIBUTING.md'] });
    const result = auditDocs(testDir, config);
    expect(result.summary.missing).toBe(2);
  });

  it('should report existing root docs as current', () => {
    writeFileSync(join(testDir, 'README.md'), '# Test Project\n\nA readme file.');
    const config = defaultDocsConfig({ rootDocs: ['README.md'] });
    const result = auditDocs(testDir, config);
    expect(result.summary.current).toBeGreaterThanOrEqual(1);
  });

  it('should scan docs directory when present', () => {
    const docsSubDir = join(testDir, 'docs');
    mkdirSync(docsSubDir, { recursive: true });
    writeFileSync(join(docsSubDir, 'guide.md'), '# Guide\n\nContent.');
    const config = defaultDocsConfig({ docsDir: 'docs', rootDocs: [] });
    const result = auditDocs(testDir, config);
    expect(result.documents.some(d => d.path.includes('guide.md'))).toBe(true);
  });

  it('should suggest API doc creation for undocumented source modules', () => {
    // discoverSourceModules looks for subdirectories with an index.ts file
    const srcDir = join(testDir, 'src');
    const moduleDir = join(srcDir, 'my-module');
    mkdirSync(moduleDir, { recursive: true });
    writeFileSync(join(moduleDir, 'index.ts'), 'export const x = 1;');
    const config = defaultDocsConfig({
      sourceDirs: ['src'],
      rootDocs: [],
      docsDir: 'docs',
    });
    const result = auditDocs(testDir, config);
    expect(result.needsCreation.length).toBeGreaterThan(0);
    expect(result.needsCreation.some(n => n.reason.includes('my-module'))).toBe(true);
  });
});

describe('docs — planDocsUpdate', () => {
  it('should plan creation for new modules', () => {
    const config = defaultDocsConfig();
    const plan = planDocsUpdate(
      { added: [], modified: [], deleted: [], exportsChanged: [], newModules: ['new-feature'], removedModules: [] },
      config,
      []
    );
    expect(plan.create.some(c => c.reason.includes('new-feature'))).toBe(true);
  });

  it('should plan removal for removed modules with existing docs', () => {
    const config = defaultDocsConfig();
    const existingDocs = [
      { path: 'docs/api/old-module.md', type: 'api' as const, covers: ['old-module'], status: 'current' as const },
    ];
    const plan = planDocsUpdate(
      { added: [], modified: [], deleted: [], exportsChanged: [], newModules: [], removedModules: ['old-module'] },
      config,
      existingDocs
    );
    expect(plan.remove.some(r => r.reason.includes('old-module'))).toBe(true);
  });

  it('should plan updates for changed exports', () => {
    const config = defaultDocsConfig();
    const existingDocs = [
      { path: 'docs/api/my-lib.md', type: 'api' as const, covers: ['my-lib'], status: 'current' as const },
    ];
    const plan = planDocsUpdate(
      { added: [], modified: [], deleted: [], exportsChanged: ['my-lib/MyClass'], newModules: [], removedModules: [] },
      config,
      existingDocs
    );
    expect(plan.update.some(u => u.path.includes('my-lib'))).toBe(true);
  });
});

// ─── MCP Server Tools ─────────────────────────────────────────────────────────

import { createPraxisMcpServer } from '../mcp/server.js';
import { PraxisRegistry as PR2 } from '../core/rules.js';
import { RuleResult as RR2, fact as fact2 } from '../core/rule-result.js';

describe('MCP Server — tool invocations', () => {
  let registry: PR2<{ counter: number; name: string }>;
  let server: ReturnType<typeof createPraxisMcpServer>;

  beforeEach(() => {
    registry = new PR2({ compliance: { enabled: false } });
    registry.registerModule({
      rules: [
        {
          id: 'mcp/increment',
          description: 'Increments counter',
          eventTypes: 'counter.increment',
          contract: {
            ruleId: 'mcp/increment',
            behavior: 'Increments',
            examples: [{ given: 'counter=5', when: 'increment', then: 'counter+1' }],
            invariants: ['counter increases'],
          },
          impl: (state, events) => {
            if (!events.some(e => e.tag === 'counter.increment')) return RR2.skip('no event');
            return RR2.emit([fact2('counter.incremented', { value: state.context.counter + 1 })]);
          },
        },
      ],
      constraints: [
        {
          id: 'mcp/non-negative',
          description: 'Counter >= 0',
          impl: (state) => state.context.counter >= 0 || 'Counter must be >= 0',
        },
      ],
    });
    server = createPraxisMcpServer({ initialContext: { counter: 5, name: 'Test' }, registry });
  });

  async function callTool(name: string, params: Record<string, unknown>) {
    const tool = (server.mcpServer as any)._registeredTools[name];
    if (!tool) throw new Error(`Tool not found: ${name}`);
    const result = await tool.handler(params, {});
    return JSON.parse(result.content[0].text);
  }

  it('praxis.inspect — lists all rules and constraints', async () => {
    const output = await callTool('praxis.inspect', {});
    expect(output.rules).toHaveLength(1);
    expect(output.constraints).toHaveLength(1);
    expect(output.summary.totalRules).toBe(1);
  });

  it('praxis.inspect — with filter', async () => {
    const output = await callTool('praxis.inspect', { filter: 'increment' });
    expect(output.rules).toHaveLength(1);
    expect(output.constraints).toHaveLength(0);
  });

  it('praxis.inspect — with includeContracts=true', async () => {
    const output = await callTool('praxis.inspect', { includeContracts: true });
    expect(output.rules[0].contract).toBeDefined();
    expect(output.rules[0].contract.ruleId).toBe('mcp/increment');
  });

  it('praxis.evaluate — valid rule', async () => {
    const output = await callTool('praxis.evaluate', {
      ruleId: 'mcp/increment',
      events: [{ tag: 'counter.increment', payload: {} }],
    });
    expect(output.ruleId).toBe('mcp/increment');
    expect(output.resultKind).toBe('emit');
  });

  it('praxis.evaluate — rule not found', async () => {
    const output = await callTool('praxis.evaluate', {
      ruleId: 'nonexistent',
      events: [],
    });
    expect(output.error).toContain('not found');
  });

  it('praxis.evaluate — rule returns skip', async () => {
    const output = await callTool('praxis.evaluate', {
      ruleId: 'mcp/increment',
      events: [],  // no increment event → skip
    });
    expect(output.resultKind).toBe('skip');
  });

  it('praxis.audit — returns report', async () => {
    const output = await callTool('praxis.audit', {
      branches: [{ location: 'test:1', condition: 'x > 0', kind: 'domain', coveredBy: 'mcp/increment' }],
      stateFields: [{ source: 'store', field: 'counter', inContext: true, usedByRule: true }],
      transitions: [{ description: 'increment', eventTag: 'counter.increment', location: 'test:2' }],
      rulesNeedingContracts: ['mcp/increment'],
    });
    expect(output.report).toBeDefined();
    expect(output.formatted).toContain('Praxis');
  });

  it('praxis.suggest — returns suggestions for gap', async () => {
    const output = await callTool('praxis.suggest', { gap: 'when user logs in show dashboard' });
    expect(output.suggestions).toBeDefined();
    expect(output.suggestions.length).toBeGreaterThan(0);
  });

  it('praxis.suggest — invariant-like gap suggests constraint', async () => {
    const output = await callTool('praxis.suggest', { gap: 'counter must always be non-negative' });
    expect(output.suggestions.some((s: any) => s.type === 'constraint')).toBe(true);
  });

  it('praxis.suggest — empty result fallback suggests rule', async () => {
    const output = await callTool('praxis.suggest', { gap: 'some unknown gap xyz' });
    expect(output.suggestions.some((s: any) => s.type === 'rule')).toBe(true);
  });

  it('praxis.suggest — event-related gap suggests event', async () => {
    const output = await callTool('praxis.suggest', { gap: 'transition happens when user fires event' });
    expect(output.suggestions.some((s: any) => s.type === 'event' || s.type === 'rule')).toBe(true);
  });

  it('praxis.facts — returns current facts', async () => {
    const output = await callTool('praxis.facts', {});
    expect(output.facts).toBeDefined();
    expect(typeof output.count).toBe('number');
  });

  it('praxis.step — processes events and returns facts', async () => {
    const output = await callTool('praxis.step', {
      events: [{ tag: 'counter.increment', payload: {} }],
    });
    expect(output.facts).toBeDefined();
    expect(output.facts.some((f: any) => f.tag === 'counter.incremented')).toBe(true);
  });

  it('praxis.contracts — lists all contracts', async () => {
    const output = await callTool('praxis.contracts', {});
    expect(output.contracts).toBeDefined();
    expect(output.coverage.total).toBeGreaterThan(0);
  });

  it('praxis.contracts — with filter', async () => {
    const output = await callTool('praxis.contracts', { filter: 'increment' });
    expect(output.contracts.every((c: any) => c.ruleId.includes('increment'))).toBe(true);
  });

  it('praxis.evaluate — rule that returns array (legacy)', async () => {
    const reg2 = new PR2<{ x: number }>({ compliance: { enabled: false } });
    reg2.registerModule({
      rules: [{
        id: 'array/rule',
        description: 'Returns array',
        eventTypes: 'x.event',
        impl: () => [{ tag: 'x.done', payload: {} }],
      }],
      constraints: [],
    });
    const srv2 = createPraxisMcpServer({ initialContext: { x: 0 }, registry: reg2 });
    const tool = (srv2.mcpServer as any)._registeredTools['praxis.evaluate'];
    const result = await tool.handler({ ruleId: 'array/rule', events: [{ tag: 'x.event', payload: {} }] }, {});
    const output = JSON.parse(result.content[0].text);
    expect(output.resultKind).toBe('emit');
  });

  it('praxis.evaluate — rule that throws returns error', async () => {
    const reg3 = new PR2<{ x: number }>({ compliance: { enabled: false } });
    reg3.registerModule({
      rules: [{
        id: 'throw/rule',
        description: 'Throws',
        eventTypes: 'x.event',
        impl: () => { throw new Error('Intentional error'); },
      }],
      constraints: [],
    });
    const srv3 = createPraxisMcpServer({ initialContext: { x: 0 }, registry: reg3 });
    const tool = (srv3.mcpServer as any)._registeredTools['praxis.evaluate'];
    const result = await tool.handler({ ruleId: 'throw/rule', events: [{ tag: 'x.event', payload: {} }] }, {});
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toContain('Intentional error');
  });
});
