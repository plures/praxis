/**
 * Praxis CLI - Validate Command
 *
 * Validates contract coverage for rules and constraints in the registry.
 */

import { PraxisRegistry } from '../../core/rules.js';
import {
  validateContracts,
  formatValidationReport,
  formatValidationReportJSON,
  formatValidationReportSARIF,
  writeLogicLedgerEntry,
  type ArtifactIndex,
  type Contract,
} from '../../decision-ledger/index.js';
import { ContractMissing } from '../../decision-ledger/index.js';
import type { PraxisEvent, PraxisFact } from '../../core/protocol.js';
import type { ContractGap } from '../../decision-ledger/types.js';

interface ValidateOptions {
  output?: 'console' | 'json' | 'sarif';
  strict?: boolean;
  registry?: string;
  tests?: boolean;
  spec?: boolean;
  emitFacts?: boolean;
  gapOutput?: string;
  ledger?: string;
  author?: string;
}

/**
 * Validate command implementation.
 *
 * @param options Command options
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  const outputFormat = options.output || 'console';
  const strict = options.strict || false;

  // In a real implementation, this would load the registry from the project
  // For now, we'll create a demo registry to show how it works
  const registry = await loadRegistry(options.registry);
  const artifactIndex = await buildArtifactIndex(registry, {
    includeTests: options.tests ?? true,
    includeSpec: options.spec ?? true,
  });

  // Validate contracts
  const report = validateContracts(registry, {
    strict,
    requiredFields: ['behavior', 'examples', 'invariants'],
    missingSeverity: strict ? 'error' : 'warning',
    artifactIndex,
  });

  if (options.emitFacts) {
    const facts = gapsToFacts(report.incomplete);
    const events = gapsToEvents(report.incomplete);
    await emitGapArtifacts({ facts, events, gapOutput: options.gapOutput });
  }

  if (options.ledger) {
    await writeLedgerSnapshots(registry, {
      rootDir: options.ledger,
      author: options.author ?? 'system',
      artifactIndex,
    });
  }

  // Format and output the report
  switch (outputFormat) {
    case 'json':
      console.log(formatValidationReportJSON(report));
      break;
    case 'sarif':
      console.log(formatValidationReportSARIF(report));
      break;
    case 'console':
    default:
      console.log(formatValidationReport(report));
      break;
  }

  // Exit with error code if in strict mode and there are issues
  if (strict && (report.incomplete.length > 0 || report.missing.length > 0)) {
    // Count errors from incomplete contracts
    const incompleteErrors = report.incomplete.filter((gap: ContractGap) => gap.severity === 'error').length;
    // In strict mode, missing contracts are also errors
    const totalErrors = incompleteErrors + report.missing.length;
    
    if (totalErrors > 0) {
      console.error(`\n❌ Validation failed: ${totalErrors} error(s) found`);
      process.exit(1);
    }
  }

  // Exit with success (only show messages in console mode)
  if (outputFormat === 'console') {
    if (report.incomplete.length === 0 && report.missing.length === 0) {
      console.log('\n✅ All contracts validated successfully!');
    } else {
      const warningCount = report.incomplete.filter((gap: ContractGap) => gap.severity === 'warning').length;
      if (warningCount > 0) {
        console.log(`\n⚠️  ${warningCount} warning(s) found`);
      }
    }
  }
}

/**
 * Load the registry from the project.
 *
 * In a real implementation, this would:
 * 1. Load the project's Praxis configuration
 * 2. Import and instantiate the registry
 * 3. Load all registered rules and constraints
 *
 * For now, it returns an empty registry for demonstration.
 *
 * @param registryPath Optional path to registry module
 * @returns The loaded registry
 */
async function loadRegistry(registryPath?: string): Promise<PraxisRegistry> {
  const registry = new PraxisRegistry();

  // If a registry path is provided, try to load it
  if (registryPath) {
    try {
      // Dynamic import would happen here
      // const module = await import(registryPath);
      // return module.registry || module.default;
      const module = await import(resolveRegistryPath(registryPath));
      const candidate = module.registry ?? module.default ?? module.createRegistry?.();
      if (candidate && candidate instanceof PraxisRegistry) {
        return candidate;
      }
      throw new Error('Registry module did not export a PraxisRegistry instance');
    } catch (error) {
      console.warn(`Warning: Could not load registry from ${registryPath}:`, error);
    }
  }

  // Return empty registry for now
  // In practice, this would scan the project for rules/constraints
  return registry;
}

function resolveRegistryPath(registryPath: string): string {
  if (registryPath.startsWith('.') || registryPath.startsWith('/')) {
    return new URL(registryPath, `file://${process.cwd()}/`).href;
  }

  return registryPath;
}

async function buildArtifactIndex(
  registry: PraxisRegistry,
  options: { includeTests: boolean; includeSpec: boolean }
): Promise<ArtifactIndex> {
  const index: ArtifactIndex = {};
  const ruleIds = new Set(registry.getRuleIds().concat(registry.getConstraintIds()));

  if (options.includeTests) {
    index.tests = new Set();
    for (const id of ruleIds) {
      if (await hasArtifactFile('tests', id)) {
        index.tests.add(id);
      }
    }
  }

  if (options.includeSpec) {
    index.spec = new Set();
    for (const id of ruleIds) {
      if (await hasArtifactFile('spec', id)) {
        index.spec.add(id);
      }
    }
  }

  return index;
}

async function writeLedgerSnapshots(
  registry: PraxisRegistry,
  options: { rootDir: string; author: string; artifactIndex?: ArtifactIndex }
): Promise<void> {
  const { rootDir, author, artifactIndex } = options;
  
  // Process rules and constraints separately to avoid type issues
  const processDescriptor = async (descriptor: { contract?: Contract; meta?: Record<string, unknown> } & { id: string }) => {
    if (!descriptor.contract && !descriptor.meta?.contract) {
      return;
    }
    const contract = descriptor.contract ?? (descriptor.meta?.contract as any);
    await writeLogicLedgerEntry(contract, {
      rootDir,
      author,
      testsPresent: artifactIndex?.tests?.has(contract.ruleId) ?? false,
      specPresent: artifactIndex?.spec?.has(contract.ruleId) ?? false,
    });
  };

  // Process all rules
  for (const descriptor of registry.getAllRules()) {
    await processDescriptor(descriptor);
  }
  
  // Process all constraints
  for (const descriptor of registry.getAllConstraints()) {
    await processDescriptor(descriptor);
  }
}

async function hasArtifactFile(type: 'tests' | 'spec', ruleId: string): Promise<boolean> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const candidateDirs = type === 'tests' ? ['src/__tests__', 'tests', 'test'] : ['spec', 'specs'];
  const sanitized = ruleId.replace(/[^a-zA-Z0-9_-]/g, '_');

  for (const dir of candidateDirs) {
    const fullDir = path.resolve(process.cwd(), dir);
    try {
      const entries = await fs.readdir(fullDir);
      if (entries.some((file) => file.includes(sanitized))) {
        return true;
      }
    } catch {
      // ignore missing directories
    }
  }

  return false;
}

function gapsToFacts(gaps: ContractGap[]): PraxisFact[] {
  return gaps.map((gap) =>
    ContractMissing.create({
      ruleId: gap.ruleId,
      missing: gap.missing,
      severity: gap.severity,
      message: gap.message,
    })
  );
}

function gapsToEvents(_gaps: ContractGap[]): PraxisEvent[] {
  return [];
}

async function emitGapArtifacts(payload: {
  facts: PraxisFact[];
  events: PraxisEvent[];
  gapOutput?: string;
}): Promise<void> {
  if (payload.gapOutput) {
    const fs = await import('node:fs/promises');
    await fs.writeFile(payload.gapOutput, JSON.stringify(payload, null, 2));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}
