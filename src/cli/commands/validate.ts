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
  type ContractGap,
} from '../../decision-ledger/index.js';

interface ValidateOptions {
  output?: 'console' | 'json' | 'sarif';
  strict?: boolean;
  registry?: string;
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

  // Validate contracts
  const report = validateContracts(registry, {
    strict,
    requiredFields: ['behavior', 'examples'],
  });

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

  // Exit with success
  if (report.incomplete.length === 0 && report.missing.length === 0) {
    console.log('\n✅ All contracts validated successfully!');
  } else {
    const warningCount = report.incomplete.filter((gap: ContractGap) => gap.severity === 'warning').length;
    if (warningCount > 0) {
      console.log(`\n⚠️  ${warningCount} warning(s) found`);
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
      console.warn(`Note: Loading from custom registry path not yet implemented`);
    } catch (error) {
      console.warn(`Warning: Could not load registry from ${registryPath}:`, error);
    }
  }

  // Return empty registry for now
  // In practice, this would scan the project for rules/constraints
  return registry;
}
