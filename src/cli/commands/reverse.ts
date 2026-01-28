/**
 * Praxis CLI - Reverse Command
 *
 * Reverse engineer contracts from existing codebases by scanning repositories
 * and generating contracts for discovered rules and constraints.
 */

import { PraxisRegistry } from '../../core/rules.js';
import { scanRepository } from '../../decision-ledger/scanner.js';
import { generateContractFromRule } from '../../decision-ledger/reverse-generator.js';
import { writeLogicLedgerEntry } from '../../decision-ledger/logic-ledger.js';
import type { AIProvider } from '../../decision-ledger/reverse-generator.js';

interface ReverseOptions {
  /** Root directory to scan */
  dir?: string;
  /** AI provider (none, github-copilot, openai, auto) */
  ai?: AIProvider;
  /** Output directory for generated contracts */
  output?: string;
  /** Whether to write to logic ledger */
  ledger?: boolean;
  /** Dry run mode (don't write files) */
  dryRun?: boolean;
  /** Interactive mode (prompt for each contract) */
  interactive?: boolean;
  /** Confidence threshold (0.0 to 1.0) */
  confidence?: string;
  /** Maximum number of rules to process */
  limit?: string;
  /** Author name for ledger entries */
  author?: string;
  /** Output format */
  format?: 'json' | 'console' | 'yaml';
}

/**
 * Reverse command implementation.
 *
 * @param options Command options
 */
export async function reverseCommand(options: ReverseOptions): Promise<void> {
  const rootDir = options.dir || process.cwd();
  const aiProvider: AIProvider = (options.ai as AIProvider) || 'none';
  const outputDir = options.output || './contracts';
  const dryRun = options.dryRun || false;
  const interactive = options.interactive || false;
  const confidenceThreshold = parseFloat(options.confidence || '0.7');
  const limit = options.limit ? parseInt(options.limit, 10) : undefined;
  const author = options.author || 'reverse-engineer';
  const format = options.format || 'console';

  console.log('🔍 Scanning repository for rules and constraints...');
  console.log(`   Directory: ${rootDir}`);
  console.log(`   AI Provider: ${aiProvider}`);
  console.log('');

  // Create a registry to store discovered rules
  const registry = new PraxisRegistry();

  // Scan the repository
  const scanResult = await scanRepository({
    rootDir,
    scanTests: true,
    scanSpecs: true,
    maxDepth: 10,
  });

  console.log(`✅ Scan complete in ${scanResult.duration}ms`);
  console.log(`   Files scanned: ${scanResult.filesScanned}`);
  console.log(`   Rules found: ${scanResult.rules.length}`);
  console.log(`   Constraints found: ${scanResult.constraints.length}`);
  console.log(`   Test files: ${scanResult.testFiles.size} mapped`);
  console.log(`   Spec files: ${scanResult.specFiles.size} mapped`);
  if (scanResult.warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${scanResult.warnings.length}`);
    scanResult.warnings.slice(0, 5).forEach(w => console.log(`      - ${w}`));
    if (scanResult.warnings.length > 5) {
      console.log(`      ... and ${scanResult.warnings.length - 5} more`);
    }
  }
  console.log('');

  // Register discovered rules and constraints
  for (const rule of scanResult.rules) {
    registry.registerRule(rule);
  }
  for (const constraint of scanResult.constraints) {
    registry.registerConstraint(constraint);
  }

  // Get all rules and constraints to process
  const allDescriptors = [
    ...scanResult.rules.map((r) => ({ ...r, type: 'rule' as const })),
    ...scanResult.constraints.map((c) => ({ ...c, type: 'constraint' as const })),
  ];

  // Limit if specified
  const toProcess = limit ? allDescriptors.slice(0, limit) : allDescriptors;

  console.log(`🤖 Generating contracts for ${toProcess.length} items...`);
  console.log('');

  const results: Array<{
    id: string;
    type: 'rule' | 'constraint';
    success: boolean;
    confidence: number;
    method: string;
    warnings: string[];
  }> = [];

  let generated = 0;
  let skipped = 0;

  for (const descriptor of toProcess) {
    console.log(`📝 Processing ${descriptor.type}: ${descriptor.id}`);

    // Get associated artifacts
    const testFiles = scanResult.testFiles.get(descriptor.id) || [];
    const specFiles = scanResult.specFiles.get(descriptor.id) || [];
    const sourceFile = descriptor.meta?.sourceFile as string | undefined;

    // Interactive mode: ask user if they want to process this
    if (interactive) {
      const readline = await import('node:readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      try {
        const answer = await new Promise<string>((resolve) => {
          rl.question(`   Generate contract for ${descriptor.id}? (y/n) `, resolve);
        });

        if (answer.toLowerCase() !== 'y') {
          console.log('   ⏭️  Skipped');
          console.log('');
          skipped++;
          continue;
        }
      } finally {
        rl.close();
      }
    }

    try {
      // Generate contract
      const result = await generateContractFromRule(descriptor, {
        aiProvider,
        confidenceThreshold,
        includeAssumptions: true,
        generateExamples: true,
        sourceFile,
        testFiles,
        specFiles,
      });

      console.log(`   ✅ Generated (${result.method}, confidence: ${result.confidence.toFixed(2)})`);
      
      if (result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings:`);
        result.warnings.forEach((warning) => console.log(`      - ${warning}`));
      }

      // Display contract summary
      console.log(`   📋 Contract summary:`);
      console.log(`      Behavior: ${result.contract.behavior}`);
      console.log(`      Examples: ${result.contract.examples.length}`);
      console.log(`      Invariants: ${result.contract.invariants.length}`);
      if (result.contract.assumptions) {
        console.log(`      Assumptions: ${result.contract.assumptions.length}`);
      }
      console.log('');

      // Save results
      results.push({
        id: descriptor.id,
        type: descriptor.type,
        success: true,
        confidence: result.confidence,
        method: result.method,
        warnings: result.warnings,
      });

      // Write to files if not dry run
      if (!dryRun) {
        // Write to output directory
        await writeContractToFile(result.contract, outputDir, format);

        // Write to logic ledger if requested
        if (options.ledger) {
          await writeLogicLedgerEntry(result.contract, {
            rootDir: rootDir,
            author,
            testsPresent: testFiles.length > 0,
            specPresent: specFiles.length > 0,
          });
        }
      }

      generated++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
      console.log('');

      results.push({
        id: descriptor.id,
        type: descriptor.type,
        success: false,
        confidence: 0,
        method: 'none',
        warnings: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  // Print summary
  console.log('');
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`Total processed: ${toProcess.length}`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}`);
  console.log('');

  // Show statistics
  const successfulResults = results.filter((r) => r.success);
  const avgConfidence =
    successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
      : 0;
  
  console.log(`Average confidence: ${avgConfidence > 0 ? avgConfidence.toFixed(2) : 'N/A'}`);
  
  const methodCounts = results.reduce((acc, r) => {
    acc[r.method] = (acc[r.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`Methods used:`);
  for (const [method, count] of Object.entries(methodCounts)) {
    console.log(`  - ${method}: ${count}`);
  }
  console.log('');

  if (dryRun) {
    console.log('ℹ️  Dry run mode - no files were written');
  } else {
    console.log(`✅ Contracts written to: ${outputDir}`);
    if (options.ledger) {
      console.log(`✅ Logic ledger updated: ${rootDir}/logic-ledger`);
    }
  }
}

/**
 * Write a contract to a file.
 */
async function writeContractToFile(
  contract: any,
  outputDir: string,
  format: 'json' | 'console' | 'yaml'
): Promise<void> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const crypto = await import('node:crypto');

  await fs.mkdir(outputDir, { recursive: true });

  // Use hash to ensure unique filenames while keeping them readable
  const hash = crypto.createHash('md5').update(contract.ruleId).digest('hex').slice(0, 6);
  const sanitized = contract.ruleId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const fileName = `${sanitized}-${hash}.${format === 'yaml' ? 'yaml' : 'json'}`;
  const filePath = path.join(outputDir, fileName);

  let content: string;

  if (format === 'yaml') {
    const yaml = await import('js-yaml');
    content = yaml.dump(contract);
  } else {
    // Default to JSON for both 'json' and 'console' formats
    content = JSON.stringify(contract, null, 2);
  }

  await fs.writeFile(filePath, content);
}
