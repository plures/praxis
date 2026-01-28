/**
 * Decision Ledger - Repository Scanner
 *
 * Scans repositories to discover existing rules, constraints, and related artifacts
 * for reverse engineering contracts from existing codebases.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RuleDescriptor, ConstraintDescriptor } from '../core/rules.js';
import type { Contract } from './types.js';

/**
 * Options for repository scanning.
 */
export interface ScanOptions {
  /** Root directory to scan */
  rootDir: string;
  /** File patterns to include (glob patterns) */
  include?: string[];
  /** File patterns to exclude (glob patterns) */
  exclude?: string[];
  /** Whether to scan for test files */
  scanTests?: boolean;
  /** Whether to scan for spec files */
  scanSpecs?: boolean;
  /** Maximum depth for directory traversal */
  maxDepth?: number;
}

/**
 * Result of repository scanning.
 */
export interface ScanResult {
  /** Discovered rules */
  rules: RuleDescriptor[];
  /** Discovered constraints */
  constraints: ConstraintDescriptor[];
  /** Mapping of rule IDs to test file paths */
  testFiles: Map<string, string[]>;
  /** Mapping of rule IDs to spec file paths */
  specFiles: Map<string, string[]>;
  /** Total files scanned */
  filesScanned: number;
  /** Scan duration in milliseconds */
  duration: number;
}

/**
 * Discovered artifact information.
 */
export interface DiscoveredArtifact {
  /** Rule or constraint ID */
  ruleId: string;
  /** Type of artifact */
  type: 'test' | 'spec' | 'implementation';
  /** File path */
  filePath: string;
  /** Line number where artifact is defined */
  line?: number;
  /** Inferred description */
  description?: string;
}

/**
 * Scan a repository for existing rules and constraints.
 *
 * @param options Scan options
 * @returns Scan result
 */
export async function scanRepository(
  options: ScanOptions
): Promise<ScanResult> {
  const startTime = Date.now();
  const { rootDir, scanTests = true, scanSpecs = true, maxDepth = 10 } = options;

  const rules: RuleDescriptor[] = [];
  const constraints: ConstraintDescriptor[] = [];
  const testFiles = new Map<string, string[]>();
  const specFiles = new Map<string, string[]>();
  let filesScanned = 0;

  // Scan for implementation files
  const implFiles = await findFiles(rootDir, {
    include: options.include || ['**/*.ts', '**/*.js'],
    exclude: options.exclude || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.spec.ts',
      '**/*.spec.js',
    ],
    maxDepth,
  });

  for (const file of implFiles) {
    filesScanned++;
    const content = await fs.readFile(file, 'utf-8');
    
    // Look for defineRule and defineConstraint patterns
    const discoveredRules = await extractRulesFromFile(file, content);
    const discoveredConstraints = await extractConstraintsFromFile(file, content);
    
    rules.push(...discoveredRules);
    constraints.push(...discoveredConstraints);
  }

  // Scan for test files if requested
  if (scanTests) {
    const testFileList = await findFiles(rootDir, {
      include: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      maxDepth,
    });

    for (const testFile of testFileList) {
      filesScanned++;
      const content = await fs.readFile(testFile, 'utf-8');
      const mappings = await mapTestsToRules(testFile, content, rules);
      
      for (const [ruleId, filePath] of mappings) {
        if (!testFiles.has(ruleId)) {
          testFiles.set(ruleId, []);
        }
        testFiles.get(ruleId)!.push(filePath);
      }
    }
  }

  // Scan for spec files if requested
  if (scanSpecs) {
    const specFileList = await findFiles(rootDir, {
      include: ['**/*.tla', '**/*.md', '**/spec/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      maxDepth,
    });

    for (const specFile of specFileList) {
      filesScanned++;
      const content = await fs.readFile(specFile, 'utf-8');
      const mappings = await mapSpecsToRules(specFile, content, rules);
      
      for (const [ruleId, filePath] of mappings) {
        if (!specFiles.has(ruleId)) {
          specFiles.set(ruleId, []);
        }
        specFiles.get(ruleId)!.push(filePath);
      }
    }
  }

  const duration = Date.now() - startTime;

  return {
    rules,
    constraints,
    testFiles,
    specFiles,
    filesScanned,
    duration,
  };
}

/**
 * Extract rules from a file's content.
 */
async function extractRulesFromFile(
  filePath: string,
  content: string
): Promise<RuleDescriptor[]> {
  const rules: RuleDescriptor[] = [];
  
  // Pattern to match defineRule calls
  const defineRulePattern = /defineRule\s*\(\s*\{([^}]+)\}\s*\)/g;
  let match;

  while ((match = defineRulePattern.exec(content)) !== null) {
    const ruleConfig = match[1];
    
    // Extract id and description
    const idMatch = /id:\s*['"]([^'"]+)['"]/g.exec(ruleConfig);
    const descMatch = /description:\s*['"]([^'"]+)['"]/g.exec(ruleConfig);
    
    if (idMatch) {
      const id = idMatch[1];
      const description = descMatch ? descMatch[1] : '';
      
      rules.push({
        id,
        description,
        impl: () => [], // Placeholder
        meta: {
          sourceFile: filePath,
          discovered: true,
        },
      } as RuleDescriptor);
    }
  }

  return rules;
}

/**
 * Extract constraints from a file's content.
 */
async function extractConstraintsFromFile(
  filePath: string,
  content: string
): Promise<ConstraintDescriptor[]> {
  const constraints: ConstraintDescriptor[] = [];
  
  // Pattern to match defineConstraint calls
  const defineConstraintPattern = /defineConstraint\s*\(\s*\{([^}]+)\}\s*\)/g;
  let match;

  while ((match = defineConstraintPattern.exec(content)) !== null) {
    const constraintConfig = match[1];
    
    // Extract id and description
    const idMatch = /id:\s*['"]([^'"]+)['"]/g.exec(constraintConfig);
    const descMatch = /description:\s*['"]([^'"]+)['"]/g.exec(constraintConfig);
    
    if (idMatch) {
      const id = idMatch[1];
      const description = descMatch ? descMatch[1] : '';
      
      constraints.push({
        id,
        description,
        impl: () => true, // Placeholder
        meta: {
          sourceFile: filePath,
          discovered: true,
        },
      } as ConstraintDescriptor);
    }
  }

  return constraints;
}

/**
 * Map test files to rule IDs.
 */
async function mapTestsToRules(
  testFile: string,
  content: string,
  rules: RuleDescriptor[]
): Promise<Map<string, string>> {
  const mappings = new Map<string, string>();
  
  // Look for rule IDs mentioned in test descriptions or imports
  for (const rule of rules) {
    if (content.includes(rule.id)) {
      mappings.set(rule.id, testFile);
    }
  }

  return mappings;
}

/**
 * Map spec files to rule IDs.
 */
async function mapSpecsToRules(
  specFile: string,
  content: string,
  rules: RuleDescriptor[]
): Promise<Map<string, string>> {
  const mappings = new Map<string, string>();
  
  // Look for rule IDs mentioned in spec files
  for (const rule of rules) {
    if (content.includes(rule.id)) {
      mappings.set(rule.id, specFile);
    }
  }

  return mappings;
}

/**
 * Find files matching patterns in a directory.
 */
async function findFiles(
  rootDir: string,
  options: {
    include: string[];
    exclude: string[];
    maxDepth: number;
  }
): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > options.maxDepth) {
      return;
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        // Check exclude patterns
        if (shouldExclude(relativePath, options.exclude)) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          // Check include patterns
          if (shouldInclude(relativePath, options.include)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors and continue
    }
  }

  await walk(rootDir, 0);
  return files;
}

/**
 * Check if a path should be excluded.
 */
function shouldExclude(relativePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = globToRegex(pattern);
    return regex.test(relativePath);
  });
}

/**
 * Check if a path should be included.
 */
function shouldInclude(relativePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = globToRegex(pattern);
    return regex.test(relativePath);
  });
}

/**
 * Convert a simple glob pattern to a regex.
 * Supports: *, **, ?, and basic path matching.
 */
function globToRegex(pattern: string): RegExp {
  let regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '___DOUBLESTAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLESTAR___/g, '.*')
    .replace(/\?/g, '.');
  
  return new RegExp(`^${regexPattern}$`);
}

/**
 * Analyze a file to infer contract information.
 */
export async function inferContractFromFile(
  filePath: string,
  ruleId: string
): Promise<Partial<Contract>> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Basic inference from code comments and structure
  const behavior = inferBehavior(content, ruleId);
  const invariants = inferInvariants(content);
  
  return {
    ruleId,
    behavior,
    invariants,
    examples: [], // Populated separately from tests
  };
}

/**
 * Infer behavior description from code.
 */
function inferBehavior(content: string, ruleId: string): string {
  // Look for JSDoc comments or description strings
  const jsdocMatch = /\/\*\*\s*\n\s*\*\s*([^\n]+)/g.exec(content);
  if (jsdocMatch) {
    return jsdocMatch[1].trim();
  }
  
  // Look for description in defineRule
  const descMatch = /description:\s*['"]([^'"]+)['"]/g.exec(content);
  if (descMatch) {
    return descMatch[1];
  }
  
  // Fallback: use rule ID as basis
  return `Process ${ruleId} events`;
}

/**
 * Infer invariants from code.
 */
function inferInvariants(content: string): string[] {
  const invariants: string[] = [];
  
  // Look for assertions or validation checks
  const assertPattern = /assert\s*\([^)]+,\s*['"]([^'"]+)['"]\)/g;
  let match;
  
  while ((match = assertPattern.exec(content)) !== null) {
    invariants.push(match[1]);
  }
  
  return invariants;
}
