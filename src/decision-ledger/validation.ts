/**
 * Decision Ledger - Validation
 *
 * Contract validation logic for rules and constraints.
 */

import type { PraxisRegistry } from '../core/rules.js';
import type {
  Contract,
  ContractGap,
  ValidationReport,
  MissingArtifact,
  Severity,
} from './types.js';
import { getContractFromDescriptor } from './types.js';

/**
 * Options for contract validation.
 */
export interface ValidateOptions {
  /** Treat missing contracts as errors instead of warnings */
  strict?: boolean;
  /** Severity for missing contracts (default: 'warning') */
  missingSeverity?: Severity;
  /** Severity for incomplete contracts (default: 'warning') */
  incompleteSeverity?: Severity;
  /** Required contract fields */
  requiredFields?: Array<'behavior' | 'examples' | 'invariants'>;
  /** Optional index of artifacts for test/spec presence */
  artifactIndex?: ArtifactIndex;
}

/**
 * Artifact index for contract compliance checks.
 */
export interface ArtifactIndex {
  /** Rule IDs that have associated tests */
  tests?: Set<string>;
  /** Rule IDs that have associated specs (e.g., TLA+) */
  spec?: Set<string>;
  /** Optional mapping of rule IDs to contract versions (for drift detection) */
  contractVersions?: Map<string, string>;
}

/**
 * Validate contracts in a registry.
 *
 * @param registry The registry to validate
 * @param options Validation options
 * @returns Validation report
 */
export function validateContracts<TContext = unknown>(
  registry: PraxisRegistry<TContext>,
  options: ValidateOptions = {}
): ValidationReport {
  const {
    incompleteSeverity = 'warning',
    requiredFields = ['behavior', 'examples'],
    artifactIndex,
  } = options;

  const complete: Array<{ ruleId: string; contract: Contract }> = [];
  const incomplete: ContractGap[] = [];
  const missing: string[] = [];

  // Validate rules
  for (const rule of registry.getAllRules()) {
    const contract = getContractFromDescriptor(rule);

    if (!contract) {
      missing.push(rule.id);
      if (options.missingSeverity) {
        incomplete.push({
          ruleId: rule.id,
          missing: ['contract'],
          severity: options.missingSeverity,
          message: `Rule '${rule.id}' has no contract`,
        });
      }
      continue;
    }

    const gaps = validateContract(contract, requiredFields, artifactIndex);

    if (gaps.length > 0) {
      incomplete.push({
        ruleId: rule.id,
        missing: gaps,
        severity: incompleteSeverity,
        message: `Rule '${rule.id}' contract is incomplete: missing ${gaps.join(', ')}`,
      });
    } else {
      complete.push({ ruleId: rule.id, contract });
    }
  }

  // Validate constraints
  for (const constraint of registry.getAllConstraints()) {
    const contract = getContractFromDescriptor(constraint);

    if (!contract) {
      missing.push(constraint.id);
      if (options.missingSeverity) {
        incomplete.push({
          ruleId: constraint.id,
          missing: ['contract'],
          severity: options.missingSeverity,
          message: `Constraint '${constraint.id}' has no contract`,
        });
      }
      continue;
    }

    const gaps = validateContract(contract, requiredFields, artifactIndex);

    if (gaps.length > 0) {
      incomplete.push({
        ruleId: constraint.id,
        missing: gaps,
        severity: incompleteSeverity,
        message: `Constraint '${constraint.id}' contract is incomplete: missing ${gaps.join(', ')}`,
      });
    } else {
      complete.push({ ruleId: constraint.id, contract });
    }
  }

  const total = registry.getAllRules().length + registry.getAllConstraints().length;

  return {
    complete,
    incomplete,
    missing,
    total,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate a single contract for completeness.
 *
 * @param contract The contract to validate
 * @param requiredFields Fields that must be present
 * @returns Array of missing artifacts
 */
function validateContract(
  contract: Contract,
  requiredFields: Array<'behavior' | 'examples' | 'invariants'>,
  artifactIndex?: ArtifactIndex
): MissingArtifact[] {
  const missing: MissingArtifact[] = [];

  if (requiredFields.includes('behavior') && isFieldEmpty(contract.behavior)) {
    missing.push('behavior');
  }

  if (requiredFields.includes('examples') && (!contract.examples || contract.examples.length === 0)) {
    missing.push('examples');
  }

  if (requiredFields.includes('invariants') && (!contract.invariants || contract.invariants.length === 0)) {
    missing.push('invariants');
  }

  if (artifactIndex?.tests && !artifactIndex.tests.has(contract.ruleId)) {
    missing.push('tests');
  }

  if (artifactIndex?.spec && !artifactIndex.spec.has(contract.ruleId)) {
    missing.push('spec');
  }

  return missing;
}

/**
 * Check if a string field is empty or undefined.
 */
function isFieldEmpty(value: string | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * Format validation report as human-readable text.
 *
 * @param report The validation report
 * @returns Formatted string
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push('Contract Validation Report');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Total: ${report.total}`);
  lines.push(`Complete: ${report.complete.length}`);
  lines.push(`Incomplete: ${report.incomplete.length}`);
  lines.push(`Missing: ${report.missing.length}`);
  lines.push('');

  if (report.complete.length > 0) {
    lines.push('✓ Complete Contracts:');
    for (const { ruleId, contract } of report.complete) {
      lines.push(`  ✓ ${ruleId} (v${contract.version || '1.0.0'})`);
    }
    lines.push('');
  }

  if (report.incomplete.length > 0) {
    lines.push('✗ Incomplete Contracts:');
    for (const gap of report.incomplete) {
      const icon = gap.severity === 'error' ? '✗' : gap.severity === 'warning' ? '⚠' : 'ℹ';
      lines.push(`  ${icon} ${gap.ruleId} - Missing: ${gap.missing.join(', ')}`);
      if (gap.message) {
        lines.push(`     ${gap.message}`);
      }
    }
    lines.push('');
  }

  if (report.missing.length > 0) {
    lines.push('✗ No Contract:');
    for (const ruleId of report.missing) {
      lines.push(`  ✗ ${ruleId}`);
    }
    lines.push('');
  }

  lines.push(`Validated at: ${report.timestamp}`);

  return lines.join('\n');
}

/**
 * Format validation report as JSON.
 *
 * @param report The validation report
 * @returns JSON string
 */
export function formatValidationReportJSON(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format validation report as SARIF (Static Analysis Results Interchange Format).
 *
 * @param report The validation report
 * @returns SARIF JSON string
 */
export function formatValidationReportSARIF(report: ValidationReport): string {
  const results = report.incomplete.map((gap) => {
    // Use first missing item or 'contract' as fallback
    const primaryMissing = gap.missing.length > 0 ? gap.missing[0] : 'contract';
    
    return {
      ruleId: `decision-ledger/${primaryMissing}`,
      level: gap.severity === 'error' ? 'error' : gap.severity === 'warning' ? 'warning' : 'note',
      message: {
        text: gap.message || `Missing: ${gap.missing.join(', ')}`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: 'registry',
            },
            region: {
              startLine: 1,
            },
          },
        },
      ],
      properties: {
        ruleId: gap.ruleId,
        missing: gap.missing,
      },
    };
  });

  const sarif = {
    version: '2.1.0',
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'Praxis Decision Ledger',
            version: '1.0.0',
            informationUri: 'https://github.com/plures/praxis',
            rules: [
              {
                id: 'decision-ledger/contract',
                shortDescription: {
                  text: 'Rule or constraint missing contract',
                },
              },
              {
                id: 'decision-ledger/behavior',
                shortDescription: {
                  text: 'Contract missing behavior description',
                },
              },
              {
                id: 'decision-ledger/examples',
                shortDescription: {
                  text: 'Contract missing examples',
                },
              },
              {
                id: 'decision-ledger/invariants',
                shortDescription: {
                  text: 'Contract missing invariants',
                },
              },
              {
                id: 'decision-ledger/tests',
                shortDescription: {
                  text: 'Contract missing tests',
                },
              },
              {
                id: 'decision-ledger/spec',
                shortDescription: {
                  text: 'Contract missing spec',
                },
              },
            ],
          },
        },
        results,
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
