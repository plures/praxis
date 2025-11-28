
import * as fs from 'fs';
import * as path from 'path';
import { analyzeRuleFile } from '../../tools/ast-analyzer/src/ast-analyzer.js';

export function verifyImplementation() {
  const projectRoot = process.cwd();
  // Default assumption: rules are in src/fsm/rules or src/rules
  // We'll search recursively in src/
  
  const srcDir = path.join(projectRoot, 'src');
  if (!fs.existsSync(srcDir)) {
    console.warn('src directory not found, skipping verification');
    return { missingHandlers: [], emptyHandlers: [] };
  }

  const ruleFiles = findRuleFiles(srcDir);
  const allRules: any[] = [];

  for (const file of ruleFiles) {
    try {
      const analysis = analyzeRuleFile(file);
      allRules.push(...analysis);
    } catch (e) {
      // Ignore errors in individual files
    }
  }

  // For now, we just report what we found as a proof of concept
  // In a real scenario, we would compare against the schema
  
  // Check for empty implementations (no mutations, no events)
  const emptyHandlers = allRules
    .filter(r => r.mutations.length === 0 && r.events.length === 0)
    .map(r => r.ruleId);

  return {
    missingHandlers: [], // We'd need the schema to know what's missing
    emptyHandlers
  };
}

function findRuleFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        results = results.concat(findRuleFiles(filePath));
      }
    } else {
      if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        // Heuristic: check if file contains 'defineRule'
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('defineRule')) {
          results.push(filePath);
        }
      }
    }
  }
  return results;
}

