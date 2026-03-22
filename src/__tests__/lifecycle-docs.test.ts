/**
 * Praxis Lifecycle Engine — Technical Writer Tests (Phase 8)
 */

import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  auditDocs,
  planDocsUpdate,
  validateAgainstTemplate,
  defaultTemplates,
  defaultDocsConfig,
  docs,
} from '../lifecycle/index.js';
import type {
  DocsConfig,
  CodeChange,
  TrackedDocument,
  LifecycleEvent,
  TriggerContext,
} from '../lifecycle/index.js';

const tmpDir = join('/tmp', 'praxis-docs-test-' + Date.now());

function setup() {
  mkdirSync(join(tmpDir, 'src/lifecycle'), { recursive: true });
  mkdirSync(join(tmpDir, 'src/hooks'), { recursive: true });
  mkdirSync(join(tmpDir, 'src/unified'), { recursive: true });
  mkdirSync(join(tmpDir, 'docs/api'), { recursive: true });

  // Source modules with index files
  writeFileSync(join(tmpDir, 'src/lifecycle/index.ts'), 'export {}');
  writeFileSync(join(tmpDir, 'src/hooks/index.ts'), 'export {}');
  writeFileSync(join(tmpDir, 'src/unified/index.ts'), 'export {}');

  // Docs
  writeFileSync(join(tmpDir, 'README.md'), `# My Project\n\n## Installation\n\nnpm install\n\n## Quick Start\n\nHello\n\n## Features\n\n- Feature 1\n\n## License\n\nMIT\n`);
  writeFileSync(join(tmpDir, 'docs/api/lifecycle.md'), `# Lifecycle\n\n## Exports\n\ncreateEventBus\n\n## Types\n\nLifecycleEvent\n\n## Usage\n\nExample\n`);
}

function cleanup() {
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
}

// ─── Docs Audit ─────────────────────────────────────────────────────────────

describe('docs/audit', () => {
  const config = defaultDocsConfig({ sourceDirs: ['src'] });

  it('detects existing and missing docs', () => {
    setup();
    const result = auditDocs(tmpDir, config);

    // README exists
    const readme = result.documents.find(d => d.path === 'README.md');
    expect(readme).toBeDefined();
    expect(readme!.status).toBe('current');

    // CHANGELOG missing
    const changelog = result.documents.find(d => d.path === 'CHANGELOG.md');
    expect(changelog).toBeDefined();
    expect(changelog!.status).toBe('missing');

    cleanup();
  });

  it('discovers undocumented modules', () => {
    setup();
    const result = auditDocs(tmpDir, config);

    // hooks and unified should be flagged as needing docs
    const needsDoc = result.needsCreation.map(n => n.suggestedPath);
    expect(needsDoc.some(p => p.includes('hooks'))).toBe(true);
    expect(needsDoc.some(p => p.includes('unified'))).toBe(true);

    // lifecycle has docs already
    expect(needsDoc.some(p => p.includes('lifecycle'))).toBe(false);

    cleanup();
  });

  it('calculates correct summary', () => {
    setup();
    const result = auditDocs(tmpDir, config);

    expect(result.summary.current).toBeGreaterThan(0);
    expect(result.summary.total).toBeGreaterThan(0);
    // CHANGELOG.md and CONTRIBUTING.md should be missing
    expect(result.summary.missing).toBe(2);

    cleanup();
  });
});

// ─── Update Planning ────────────────────────────────────────────────────────

describe('docs/plan', () => {
  it('creates docs for new modules', () => {
    const changes: CodeChange = {
      added: ['src/newmod/index.ts'],
      modified: [],
      deleted: [],
      exportsChanged: [],
      newModules: ['newmod'],
      removedModules: [],
    };

    const config = defaultDocsConfig();
    const plan = planDocsUpdate(changes, config, []);

    expect(plan.create).toHaveLength(1);
    expect(plan.create[0].path).toContain('newmod');
    expect(plan.create[0].type).toBe('api');
  });

  it('removes docs for deleted modules', () => {
    const changes: CodeChange = {
      added: [],
      modified: [],
      deleted: ['src/oldmod/index.ts'],
      exportsChanged: [],
      newModules: [],
      removedModules: ['oldmod'],
    };

    const currentDocs: TrackedDocument[] = [
      { path: 'docs/api/oldmod.md', type: 'api', covers: ['oldmod'], status: 'current' },
    ];

    const plan = planDocsUpdate(changes, defaultDocsConfig(), currentDocs);

    expect(plan.remove).toHaveLength(1);
    expect(plan.remove[0].path).toContain('oldmod');
  });

  it('updates docs when exports change', () => {
    const changes: CodeChange = {
      added: [],
      modified: ['src/lifecycle/version.ts'],
      deleted: [],
      exportsChanged: ['lifecycle/parseSemver', 'lifecycle/formatSemver'],
      newModules: [],
      removedModules: [],
    };

    const currentDocs: TrackedDocument[] = [
      { path: 'docs/api/lifecycle.md', type: 'api', covers: ['lifecycle'], status: 'current' },
      { path: 'README.md', type: 'readme', covers: ['project-overview'], status: 'current' },
    ];

    const plan = planDocsUpdate(changes, defaultDocsConfig(), currentDocs);

    // API doc should be updated for export changes
    const apiUpdate = plan.update.find(u => u.path.includes('lifecycle'));
    expect(apiUpdate).toBeDefined();
    expect(apiUpdate!.changes.some(c => c.includes('parseSemver'))).toBe(true);

    // README should be updated because source changed
    const readmeUpdate = plan.update.find(u => u.path === 'README.md');
    expect(readmeUpdate).toBeDefined();
  });

  it('plans example validation', () => {
    const config = defaultDocsConfig({ exampleDirs: ['examples', 'docs/examples'] });
    const plan = planDocsUpdate(
      { added: ['src/x.ts'], modified: [], deleted: [], exportsChanged: [], newModules: [], removedModules: [] },
      config,
      [],
    );

    expect(plan.validateExamples).toEqual(['examples', 'docs/examples']);
  });
});

// ─── Template Validation ────────────────────────────────────────────────────

describe('docs/template-validation', () => {
  const readmeTemplate = defaultTemplates.find(t => t.name === 'readme')!;

  it('validates a complete README', () => {
    const content = `# My Project

## Installation

npm install

## Quick Start

Hello world

## Features

- Feature 1

## License

MIT
`;

    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.valid).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
  });

  it('detects missing required sections', () => {
    const content = `# My Project

Some text here.
`;

    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.valid).toBe(false);
    expect(result.missingRequired.length).toBeGreaterThan(0);
    expect(result.missingRequired).toContain('Installation');
  });

  it('reports extra sections', () => {
    const content = `# My Project

## Installation

npm install

## Quick Start

Hello

## Features

Feature 1

## License

MIT

## My Custom Section

Extra stuff
`;

    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.valid).toBe(true);
    expect(result.extraSections).toContain('My Custom Section');
  });

  it('provides suggestions for short docs', () => {
    const content = `# Hi`;
    const result = validateAgainstTemplate(content, readmeTemplate, 'README.md');
    expect(result.suggestions.some(s => s.includes('short'))).toBe(true);
  });
});

// ─── Trigger Actions ────────────────────────────────────────────────────────

describe('docs/triggers', () => {
  it('docs.audit returns summary', async () => {
    setup();
    const config = defaultDocsConfig({ sourceDirs: ['src'] });
    const action = docs.audit(config);

    const result = await action.execute(
      { name: 'lifecycle/integrate/merge.executed', timestamp: Date.now(), data: { rootDir: tmpDir }, source: 'test' },
      {} as TriggerContext,
    );

    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    cleanup();
  });

  it('docs.plan returns update plan', async () => {
    const config = defaultDocsConfig();
    const action = docs.plan(config);

    const result = await action.execute(
      {
        name: 'lifecycle/integrate/merge.executed',
        timestamp: Date.now(),
        source: 'test',
        data: {
          changes: {
            added: ['src/newmod/index.ts'],
            modified: [],
            deleted: [],
            exportsChanged: [],
            newModules: ['newmod'],
            removedModules: [],
          },
          currentDocs: [],
        },
      },
      {} as TriggerContext,
    );

    expect(result.success).toBe(true);
    expect(result.data?.plan).toBeDefined();
  });

  it('docs.gate blocks on stale docs', async () => {
    const action = docs.gate();

    const result = await action.execute(
      {
        name: 'lifecycle/qa/qa.suite-triggered',
        timestamp: Date.now(),
        source: 'test',
        data: {
          docsAudit: {
            documents: [],
            needsUpdate: [{ path: 'README.md', type: 'readme', covers: [], status: 'stale' }],
            needsCreation: [],
            needsRemoval: [],
            summary: { total: 3, current: 1, stale: 1, missing: 1, orphaned: 0 },
          },
        },
      },
      {} as TriggerContext,
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('blocked');
  });

  it('docs.gate passes when all current', async () => {
    const action = docs.gate();

    const result = await action.execute(
      {
        name: 'lifecycle/qa/qa.suite-triggered',
        timestamp: Date.now(),
        source: 'test',
        data: {
          docsAudit: {
            documents: [],
            needsUpdate: [],
            needsCreation: [],
            needsRemoval: [],
            summary: { total: 3, current: 3, stale: 0, missing: 0, orphaned: 0 },
          },
        },
      },
      {} as TriggerContext,
    );

    expect(result.success).toBe(true);
  });
});

// ─── Default Config ─────────────────────────────────────────────────────────

describe('docs/config', () => {
  it('provides sensible defaults', () => {
    const config = defaultDocsConfig();
    expect(config.docsDir).toBe('docs');
    expect(config.rootDocs).toContain('README.md');
    expect(config.templates.length).toBeGreaterThan(0);
  });

  it('allows overrides', () => {
    const config = defaultDocsConfig({ docsDir: 'documentation', sourceDirs: ['lib'] });
    expect(config.docsDir).toBe('documentation');
    expect(config.sourceDirs).toEqual(['lib']);
    // Defaults still applied for non-overridden fields
    expect(config.rootDocs).toContain('README.md');
  });
});

// ─── Integration: Lifecycle Flow with Docs ──────────────────────────────────

describe('docs/integration', () => {
  it('merge → docs audit → docs gate → QA flow', async () => {
    setup();
    const config = defaultDocsConfig({ sourceDirs: ['src'] });

    // 1. Audit docs after merge
    const auditResult = auditDocs(tmpDir, config);
    expect(auditResult.summary.total).toBeGreaterThan(0);

    // 2. Gate check — should fail because CHANGELOG + CONTRIBUTING missing
    const gateAction = docs.gate();
    const gateResult = await gateAction.execute(
      {
        name: 'lifecycle/qa/qa.suite-triggered',
        timestamp: Date.now(),
        source: 'test',
        data: { docsAudit: auditResult },
      },
      {} as TriggerContext,
    );

    expect(gateResult.success).toBe(false); // Missing docs block QA

    // 3. Create missing docs
    writeFileSync(join(tmpDir, 'CHANGELOG.md'), '# Changelog\n\n## [1.0.0]\n\n- Initial release\n');
    writeFileSync(join(tmpDir, 'CONTRIBUTING.md'), '# Contributing\n\n## Development Setup\n\nclone + install\n\n## Pull Requests\n\nFork and PR\n');

    // 4. Re-audit — should pass now
    const reaudit = auditDocs(tmpDir, config);
    expect(reaudit.summary.missing).toBe(0);

    const gateResult2 = await gateAction.execute(
      {
        name: 'lifecycle/qa/qa.suite-triggered',
        timestamp: Date.now(),
        source: 'test',
        data: { docsAudit: reaudit },
      },
      {} as TriggerContext,
    );

    expect(gateResult2.success).toBe(true); // Now QA can proceed

    cleanup();
  });
});
