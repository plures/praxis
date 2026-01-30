import * as ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs/promises';
import { statSync } from 'node:fs';
import { analyzeRuleFile, analyzeRuleSource, type RuleAnalysis } from '../ast-analyzer/src/ast-analyzer';

type DefinitionKind = 'rule' | 'constraint';

interface ContractIndexEntry {
  id: string;
  kind: DefinitionKind;
  file: string;
  description?: string;
  hasContract: boolean;
  analysis?: RuleAnalysis;
}

interface ContractIndexSummary {
  rules: number;
  constraints: number;
  files: number;
}

interface ContractIndex {
  generatedAt: string;
  root: string;
  summary: ContractIndexSummary;
  rules: ContractIndexEntry[];
  constraints: ContractIndexEntry[];
}

const DEFAULT_ROOTS = ['src', 'core', 'examples', 'tools', 'ui'];
const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'build',
  'out',
  '.next',
  'docs',
  'csharp',
  '__tests__',
  'test',
  'tests',
]);
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const rootArg = getArgValue(args, '--root');
  const outputArg = getArgValue(args, '--output');

  const rootDir = rootArg ? path.resolve(rootArg) : process.cwd();
  const outputPath = outputArg
    ? path.resolve(outputArg)
    : path.join(rootDir, 'docs', 'decision-ledger', 'contract-index.json');

  const targetRoots = DEFAULT_ROOTS
    .map((dir) => path.join(rootDir, dir))
    .filter((dir) => isDirectorySync(dir));

  const files: string[] = [];
  for (const dir of targetRoots) {
    await walk(dir, files);
  }

  const rules: ContractIndexEntry[] = [];
  const constraints: ContractIndexEntry[] = [];
  let scannedFiles = 0;

  for (const filePath of files) {
    scannedFiles += 1;
    const entries = await analyzeFile(filePath, rootDir);
    for (const entry of entries) {
      if (entry.kind === 'rule') {
        rules.push(entry);
      } else {
        constraints.push(entry);
      }
    }
  }

  rules.sort(compareEntries);
  constraints.sort(compareEntries);

  const output: ContractIndex = {
    generatedAt: new Date().toISOString(),
    root: rootDir,
    summary: {
      rules: rules.length,
      constraints: constraints.length,
      files: scannedFiles,
    },
    rules,
    constraints,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(
    `Decision Ledger scan complete: ${rules.length} rules, ${constraints.length} constraints from ${scannedFiles} files.`
  );
  console.log(`Contract index written to ${outputPath}`);
}

function getArgValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return undefined;
  }
  return args[index + 1];
}

function isDirectorySync(targetPath: string): boolean {
  try {
    const stat = statSync(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function walk(dir: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) {
        continue;
      }
      await walk(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (TARGET_EXTENSIONS.has(ext) && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
}

async function analyzeFile(filePath: string, rootDir: string): Promise<ContractIndexEntry[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const analysis = safeAnalyzeRules(filePath, sourceFile, content);
  const analysisById = new Map(analysis.map((item) => [item.ruleId, item]));

  const entries: ContractIndexEntry[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callName = node.expression.text;
      if (callName === 'defineRule' || callName === 'defineConstraint') {
        const arg = node.arguments[0];
        const obj = arg ? unwrapObjectLiteral(arg) : undefined;
        if (obj) {
          const id = getStringProperty(obj, 'id');
          if (id) {
            const kind: DefinitionKind = callName === 'defineRule' ? 'rule' : 'constraint';
            const description = getStringProperty(obj, 'description');
            const hasContract = hasContractProperty(obj);
            const entry: ContractIndexEntry = {
              id,
              kind,
              file: toPosixPath(path.relative(rootDir, filePath)),
              description,
              hasContract,
            };

            if (kind === 'rule') {
              const ruleAnalysis = analysisById.get(id);
              if (ruleAnalysis) {
                entry.analysis = ruleAnalysis;
              }
            }

            entries.push(entry);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return entries;
}

function safeAnalyzeRules(
  filePath: string,
  sourceFile?: ts.SourceFile,
  content?: string
): RuleAnalysis[] {
  try {
    if (sourceFile && content !== undefined) {
      return analyzeRuleSource(sourceFile, content);
    }
    return analyzeRuleFile(filePath);
  } catch {
    return [];
  }
}

function unwrapObjectLiteral(expr: ts.Expression): ts.ObjectLiteralExpression | undefined {
  let current = expr;
  while (ts.isAsExpression(current) || ts.isParenthesizedExpression(current) || ts.isSatisfiesExpression(current)) {
    current = current.expression;
  }
  return ts.isObjectLiteralExpression(current) ? current : undefined;
}

function getStringProperty(obj: ts.ObjectLiteralExpression, name: string): string | undefined {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === name) {
      const initializer = prop.initializer;
      if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
        return initializer.text;
      }
    }
  }
  return undefined;
}

function hasContractProperty(obj: ts.ObjectLiteralExpression): boolean {
  if (getObjectHasContract(obj)) {
    return true;
  }

  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'meta') {
      const meta = unwrapObjectLiteral(prop.initializer);
      if (meta && getObjectHasContract(meta)) {
        return true;
      }
    }
  }

  return false;
}

function getObjectHasContract(obj: ts.ObjectLiteralExpression): boolean {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'contract') {
      return true;
    }
  }
  return false;
}

function compareEntries(a: ContractIndexEntry, b: ContractIndexEntry): number {
  const idComparison = a.id.localeCompare(b.id);
  if (idComparison !== 0) {
    return idComparison;
  }
  return a.file.localeCompare(b.file);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

main().catch((error) => {
  console.error('Decision Ledger scan failed:', error);
  process.exit(1);
});
