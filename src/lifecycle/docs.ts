/**
 * Praxis Lifecycle Engine — Technical Writer
 *
 * Documentation is a first-class lifecycle phase, positioned BEFORE QA:
 *
 *   merge → docs update → QA (uses updated docs for test cases) → release
 *
 * The technical writer:
 * 1. Detects which code changed on main
 * 2. Determines which docs need creation, update, or removal
 * 3. Rewrites docs based on actual code state (not diffs)
 * 4. Validates examples compile/run
 * 5. Ensures uniform presentation via templates
 *
 * README.md describes ONLY the current version — no historical cruft.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import type { TriggerAction } from './types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A document tracked by the technical writer */
export interface TrackedDocument {
  /** Path relative to repo root */
  path: string;
  /** Document type */
  type: DocumentType;
  /** What this document covers */
  covers: string[];
  /** Current status */
  status: 'current' | 'stale' | 'missing' | 'orphaned';
  /** Last updated timestamp (from git) */
  lastUpdated?: number;
  /** Reason for status */
  reason?: string;
}

export type DocumentType =
  | 'readme'        // README.md — current version only
  | 'api'           // API reference
  | 'guide'         // How-to guides
  | 'architecture'  // Architecture/design docs
  | 'changelog'     // CHANGELOG.md
  | 'contributing'  // CONTRIBUTING.md
  | 'example'       // Example code
  | 'reference'     // Reference material
  | 'custom';       // User-defined

/** Template for consistent document structure */
export interface DocumentTemplate {
  /** Template name */
  name: string;
  /** Document type this template applies to */
  type: DocumentType;
  /** Template sections (ordered) */
  sections: TemplateSection[];
  /** File naming convention */
  filePattern?: string;
}

export interface TemplateSection {
  /** Section heading */
  heading: string;
  /** Whether this section is required */
  required: boolean;
  /** Description of what goes here */
  description: string;
  /** Example content */
  example?: string;
}

/** Result of a docs audit */
export interface DocsAuditResult {
  /** All tracked documents */
  documents: TrackedDocument[];
  /** Documents that need updates */
  needsUpdate: TrackedDocument[];
  /** Documents that should be created */
  needsCreation: Array<{ type: DocumentType; suggestedPath: string; reason: string }>;
  /** Documents that should be removed */
  needsRemoval: TrackedDocument[];
  /** Summary */
  summary: {
    total: number;
    current: number;
    stale: number;
    missing: number;
    orphaned: number;
  };
}

/** Configuration for the document writer */
export interface DocsConfig {
  /** Root directory for docs (default: 'docs/') */
  docsDir: string;
  /** Additional doc paths to track (e.g., 'README.md', 'CONTRIBUTING.md') */
  rootDocs: string[];
  /** Example directories to validate */
  exampleDirs: string[];
  /** Templates for consistent formatting */
  templates: DocumentTemplate[];
  /** Source directories that trigger doc updates when changed */
  sourceDirs: string[];
}

/** What changed in code that affects docs */
export interface CodeChange {
  /** Files added */
  added: string[];
  /** Files modified */
  modified: string[];
  /** Files deleted */
  deleted: string[];
  /** Exports added/changed (from TypeScript analysis) */
  exportsChanged: string[];
  /** New modules/directories */
  newModules: string[];
  /** Removed modules/directories */
  removedModules: string[];
}

/** Documentation update plan */
export interface DocsUpdatePlan {
  /** Documents to create */
  create: Array<{
    path: string;
    type: DocumentType;
    template?: string;
    reason: string;
    sections: string[];
  }>;
  /** Documents to update */
  update: Array<{
    path: string;
    reason: string;
    sections: string[];
    /** Specific things that changed */
    changes: string[];
  }>;
  /** Documents to remove */
  remove: Array<{
    path: string;
    reason: string;
  }>;
  /** Examples to validate/update */
  validateExamples: string[];
}

// ─── Default Templates ──────────────────────────────────────────────────────

export const defaultTemplates: DocumentTemplate[] = [
  {
    name: 'readme',
    type: 'readme',
    filePattern: 'README.md',
    sections: [
      { heading: 'Project Name', required: true, description: 'Name + one-line description' },
      { heading: 'Installation', required: true, description: 'How to install (npm/cargo/pip/etc)', example: '```bash\nnpm install @scope/package\n```' },
      { heading: 'Quick Start', required: true, description: 'Minimal working example' },
      { heading: 'Features', required: true, description: 'Current feature list (this version only)' },
      { heading: 'API', required: false, description: 'Key API surface (link to full docs if large)' },
      { heading: 'Configuration', required: false, description: 'Configuration options' },
      { heading: 'Examples', required: false, description: 'Links to example directory' },
      { heading: 'Contributing', required: false, description: 'Link to CONTRIBUTING.md' },
      { heading: 'License', required: true, description: 'License declaration' },
    ],
  },
  {
    name: 'api-reference',
    type: 'api',
    filePattern: 'docs/api/*.md',
    sections: [
      { heading: 'Module Name', required: true, description: 'Module name and purpose' },
      { heading: 'Exports', required: true, description: 'All public exports with signatures' },
      { heading: 'Types', required: true, description: 'TypeScript types/interfaces' },
      { heading: 'Usage', required: true, description: 'Usage examples' },
      { heading: 'Notes', required: false, description: 'Caveats, performance notes' },
    ],
  },
  {
    name: 'changelog',
    type: 'changelog',
    filePattern: 'CHANGELOG.md',
    sections: [
      { heading: 'Changelog', required: true, description: 'All notable changes' },
    ],
  },
  {
    name: 'contributing',
    type: 'contributing',
    filePattern: 'CONTRIBUTING.md',
    sections: [
      { heading: 'Contributing', required: true, description: 'How to contribute' },
      { heading: 'Development Setup', required: true, description: 'Dev environment setup' },
      { heading: 'Code Style', required: false, description: 'Style guidelines' },
      { heading: 'Pull Requests', required: true, description: 'PR process' },
    ],
  },
];

// ─── Docs Audit ─────────────────────────────────────────────────────────────

/**
 * Scan a repository and audit its documentation state.
 */
export function auditDocs(rootDir: string, config: DocsConfig): DocsAuditResult {
  const documents: TrackedDocument[] = [];

  // Scan root-level docs
  for (const rootDoc of config.rootDocs) {
    const fullPath = join(rootDir, rootDoc);
    const exists = existsSync(fullPath);
    const type = inferDocType(rootDoc);

    documents.push({
      path: rootDoc,
      type,
      covers: type === 'readme' ? ['project-overview'] : [type],
      status: exists ? 'current' : 'missing',
      reason: exists ? undefined : `${rootDoc} does not exist`,
    });
  }

  // Scan docs directory
  const docsDir = join(rootDir, config.docsDir);
  if (existsSync(docsDir)) {
    scanDocsDir(docsDir, rootDir, documents);
  }

  // Scan source directories to find undocumented modules
  const sourceModules = discoverSourceModules(rootDir, config.sourceDirs);
  const documentedModules = new Set(documents.flatMap(d => d.covers));

  const needsCreation: DocsAuditResult['needsCreation'] = [];
  for (const mod of sourceModules) {
    if (!documentedModules.has(mod)) {
      needsCreation.push({
        type: 'api',
        suggestedPath: `${config.docsDir}/api/${mod}.md`,
        reason: `Module "${mod}" has no documentation`,
      });
    }
  }

  // Detect orphaned docs (docs for modules that no longer exist)
  for (const doc of documents) {
    if (doc.type === 'api' && doc.status === 'current') {
      const coveredModules = doc.covers.filter(c => !sourceModules.includes(c));
      if (coveredModules.length > 0 && doc.covers.length === coveredModules.length) {
        doc.status = 'orphaned';
        doc.reason = `Covers removed module(s): ${coveredModules.join(', ')}`;
      }
    }
  }

  const needsUpdate = documents.filter(d => d.status === 'stale');
  const needsRemoval = documents.filter(d => d.status === 'orphaned');

  return {
    documents,
    needsUpdate,
    needsCreation,
    needsRemoval,
    summary: {
      total: documents.length,
      current: documents.filter(d => d.status === 'current').length,
      stale: documents.filter(d => d.status === 'stale').length,
      missing: documents.filter(d => d.status === 'missing').length,
      orphaned: documents.filter(d => d.status === 'orphaned').length,
    },
  };
}

/**
 * Analyze code changes and produce a documentation update plan.
 */
export function planDocsUpdate(
  changes: CodeChange,
  config: DocsConfig,
  currentDocs: TrackedDocument[],
): DocsUpdatePlan {
  const plan: DocsUpdatePlan = {
    create: [],
    update: [],
    remove: [],
    validateExamples: [],
  };

  // New modules need new docs
  for (const mod of changes.newModules) {
    plan.create.push({
      path: `${config.docsDir}/api/${mod}.md`,
      type: 'api',
      template: 'api-reference',
      reason: `New module: ${mod}`,
      sections: ['Module Name', 'Exports', 'Types', 'Usage'],
    });
  }

  // Removed modules → remove docs
  for (const mod of changes.removedModules) {
    const doc = currentDocs.find(d => d.covers.includes(mod));
    if (doc) {
      plan.remove.push({
        path: doc.path,
        reason: `Module "${mod}" was removed`,
      });
    }
  }

  // Changed exports → update API docs
  for (const exp of changes.exportsChanged) {
    const moduleName = exp.split('/')[0] || exp;
    const doc = currentDocs.find(d => d.covers.includes(moduleName));
    if (doc) {
      const existing = plan.update.find(u => u.path === doc.path);
      if (existing) {
        existing.changes.push(`Export changed: ${exp}`);
      } else {
        plan.update.push({
          path: doc.path,
          reason: `Exports changed in ${moduleName}`,
          sections: ['Exports', 'Types', 'Usage'],
          changes: [`Export changed: ${exp}`],
        });
      }
    }
  }

  // README always gets updated when source changes
  const sourceChanged = changes.added.length + changes.modified.length + changes.deleted.length > 0;
  if (sourceChanged) {
    const hasReadme = currentDocs.some(d => d.type === 'readme');
    if (hasReadme) {
      plan.update.push({
        path: 'README.md',
        reason: 'Source code changed — verify README reflects current state',
        sections: ['Features', 'API', 'Quick Start'],
        changes: [
          `${changes.added.length} files added`,
          `${changes.modified.length} files modified`,
          `${changes.deleted.length} files deleted`,
        ],
      });
    }
  }

  // Validate examples if source changed
  for (const dir of config.exampleDirs) {
    plan.validateExamples.push(dir);
  }

  return plan;
}

// ─── Template Validation ────────────────────────────────────────────────────

export interface TemplateValidationResult {
  path: string;
  template: string;
  valid: boolean;
  missingRequired: string[];
  extraSections: string[];
  suggestions: string[];
}

/**
 * Validate a document against its template.
 */
export function validateAgainstTemplate(
  content: string,
  template: DocumentTemplate,
  filePath: string,
): TemplateValidationResult {
  // Extract headings from markdown
  const headings = extractHeadings(content);
  const requiredSections = template.sections.filter(s => s.required).map(s => s.heading);
  const allSections = template.sections.map(s => s.heading);

  // First heading in a README is always the project name, regardless of text
  const isReadme = template.type === 'readme';

  const missingRequired = requiredSections.filter((h, i) => {
    // For README, the first required section (Project Name) matches the first heading
    if (isReadme && i === 0 && headings.length > 0) return false;

    return !headings.some(mh =>
      mh.toLowerCase().includes(h.toLowerCase()) ||
      h.toLowerCase().includes(mh.toLowerCase()) ||
      normalizeHeading(mh) === normalizeHeading(h)
    );
  });

  const extraSections = headings.filter((h, i) => {
    // First heading in README is always the project name
    if (isReadme && i === 0) return false;

    return !allSections.some(ts =>
      h.toLowerCase().includes(ts.toLowerCase()) ||
      ts.toLowerCase().includes(h.toLowerCase()) ||
      normalizeHeading(h) === normalizeHeading(ts)
    );
  });

  const suggestions: string[] = [];
  if (missingRequired.length > 0) {
    suggestions.push(`Add required sections: ${missingRequired.join(', ')}`);
  }
  if (content.length < 100) {
    suggestions.push('Document is very short — consider adding more detail');
  }

  return {
    path: filePath,
    template: template.name,
    valid: missingRequired.length === 0,
    missingRequired,
    extraSections,
    suggestions,
  };
}

// ─── Trigger Actions ────────────────────────────────────────────────────────

export const docs = {
  /**
   * Audit documentation and report status.
   */
  audit(config: DocsConfig): TriggerAction {
    return {
      id: 'docs.audit',
      description: 'Audit documentation completeness',
      execute: async (event) => {
        const rootDir = (event.data.rootDir as string) || process.cwd();
        const result = auditDocs(rootDir, config);

        return {
          success: true,
          message: `Docs audit: ${result.summary.current} current, ${result.summary.stale} stale, ${result.summary.missing} missing, ${result.summary.orphaned} orphaned`,
          data: {
            summary: result.summary,
            needsUpdate: result.needsUpdate.map(d => d.path),
            needsCreation: result.needsCreation.map(d => d.suggestedPath),
            needsRemoval: result.needsRemoval.map(d => d.path),
          },
        };
      },
    };
  },

  /**
   * Plan documentation updates based on code changes.
   */
  plan(config: DocsConfig): TriggerAction {
    return {
      id: 'docs.plan',
      description: 'Plan documentation updates from code changes',
      execute: async (event) => {
        const changes = event.data.changes as CodeChange | undefined;
        const currentDocs = event.data.currentDocs as TrackedDocument[] | undefined;

        if (!changes) {
          return { success: false, message: 'No code changes in event data', error: 'Missing changes' };
        }

        const plan = planDocsUpdate(changes, config, currentDocs ?? []);

        return {
          success: true,
          message: `Docs plan: ${plan.create.length} create, ${plan.update.length} update, ${plan.remove.length} remove`,
          data: { plan },
        };
      },
    };
  },

  /**
   * Validate all docs against templates.
   */
  validate(config: DocsConfig): TriggerAction {
    return {
      id: 'docs.validate',
      description: 'Validate docs against templates',
      execute: async (event) => {
        const rootDir = (event.data.rootDir as string) || process.cwd();
        const results: TemplateValidationResult[] = [];

        for (const template of config.templates) {
          // Find matching files
          const files = findFilesForTemplate(rootDir, template, config);
          for (const file of files) {
            try {
              const content = readFileSync(join(rootDir, file), 'utf-8');
              results.push(validateAgainstTemplate(content, template, file));
            } catch {
              results.push({
                path: file,
                template: template.name,
                valid: false,
                missingRequired: ['(file not readable)'],
                extraSections: [],
                suggestions: ['Fix file access'],
              });
            }
          }
        }

        const allValid = results.every(r => r.valid);

        return {
          success: allValid,
          message: `Template validation: ${results.filter(r => r.valid).length}/${results.length} valid`,
          data: { results, allValid },
        };
      },
    };
  },

  /**
   * Gate: docs must be updated before QA can proceed.
   */
  gate(): TriggerAction {
    return {
      id: 'docs.gate',
      description: 'Gate: documentation must be current before QA',
      execute: async (event) => {
        const docsAudit = event.data.docsAudit as DocsAuditResult | undefined;

        if (!docsAudit) {
          return { success: false, message: 'No docs audit in event data — run docs audit first', error: 'Missing audit' };
        }

        const { stale, missing } = docsAudit.summary;
        if (stale > 0 || missing > 0) {
          return {
            success: false,
            message: `Docs gate blocked: ${stale} stale, ${missing} missing documents`,
            data: {
              stale: docsAudit.needsUpdate.map(d => d.path),
              missing: docsAudit.documents.filter(d => d.status === 'missing').map(d => d.path),
            },
          };
        }

        return { success: true, message: 'Docs gate passed: all documentation current' };
      },
    };
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function inferDocType(path: string): DocumentType {
  const name = basename(path).toLowerCase();
  if (name === 'readme.md') return 'readme';
  if (name === 'changelog.md') return 'changelog';
  if (name === 'contributing.md') return 'contributing';
  if (name.includes('architecture') || name.includes('design')) return 'architecture';
  if (name.includes('api')) return 'api';
  if (name.includes('guide') || name.includes('tutorial')) return 'guide';
  return 'reference';
}

function scanDocsDir(dir: string, rootDir: string, documents: TrackedDocument[]): void {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        scanDocsDir(fullPath, rootDir, documents);
      } else if (extname(entry) === '.md') {
        const relPath = relative(rootDir, fullPath);
        const type = inferDocType(relPath);
        const moduleName = basename(entry, '.md');
        documents.push({
          path: relPath,
          type,
          covers: [moduleName],
          status: 'current',
        });
      }
    }
  } catch {
    // Directory not readable
  }
}

function discoverSourceModules(rootDir: string, sourceDirs: string[]): string[] {
  const modules: string[] = [];
  for (const dir of sourceDirs) {
    const fullDir = join(rootDir, dir);
    if (!existsSync(fullDir)) continue;
    try {
      const entries = readdirSync(fullDir);
      for (const entry of entries) {
        const fullPath = join(fullDir, entry);
        if (statSync(fullPath).isDirectory()) {
          // Check if it has an index file
          const hasIndex = ['index.ts', 'index.js', 'mod.ts', 'lib.rs'].some(f =>
            existsSync(join(fullPath, f))
          );
          if (hasIndex) modules.push(entry);
        }
      }
    } catch {
      // Skip unreadable dirs
    }
  }
  return modules;
}

function extractHeadings(markdown: string): string[] {
  const lines = markdown.split('\n');
  return lines
    .filter(l => /^#{1,3}\s+/.test(l))
    .map(l => l.replace(/^#{1,3}\s+/, '').trim());
}

function normalizeHeading(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findFilesForTemplate(rootDir: string, template: DocumentTemplate, _config: DocsConfig): string[] {
  if (!template.filePattern) return [];

  if (template.filePattern.includes('*')) {
    // Glob pattern — scan directory
    const dir = template.filePattern.split('*')[0];
    const fullDir = join(rootDir, dir);
    if (!existsSync(fullDir)) return [];
    try {
      return readdirSync(fullDir)
        .filter(f => f.endsWith('.md'))
        .map(f => join(dir, f));
    } catch {
      return [];
    }
  }

  // Exact file
  return existsSync(join(rootDir, template.filePattern)) ? [template.filePattern] : [];
}

// ─── Default Config ─────────────────────────────────────────────────────────

export function defaultDocsConfig(overrides?: Partial<DocsConfig>): DocsConfig {
  return {
    docsDir: overrides?.docsDir ?? 'docs',
    rootDocs: overrides?.rootDocs ?? ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md'],
    exampleDirs: overrides?.exampleDirs ?? ['examples'],
    templates: overrides?.templates ?? defaultTemplates,
    sourceDirs: overrides?.sourceDirs ?? ['src'],
  };
}
