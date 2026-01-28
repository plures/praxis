/**
 * Rules and Constraints System
 *
 * This module defines the types and registry for rules and constraints.
 * Rules and constraints are identified by stable IDs and can be described as data,
 * making them portable across languages and suitable for DSL-based definitions.
 */

import type { PraxisEvent, PraxisFact, PraxisState } from './protocol.js';
import type { Contract, ContractGap, MissingArtifact, Severity } from '../decision-ledger/types.js';

declare const process:
  | {
      env?: {
        NODE_ENV?: string;
      };
    }
  | undefined;

/**
 * Unique identifier for a rule
 */
export type RuleId = string;

/**
 * Unique identifier for a constraint
 */
export type ConstraintId = string;

/**
 * A rule function derives new facts or transitions from context + input facts/events.
 * Rules must be pure - no side effects.
 *
 * @param state Current Praxis state
 * @param events Events to process
 * @returns Array of new facts to add to the state
 */
export type RuleFn<TContext = unknown> = (
  state: PraxisState & { context: TContext },
  events: PraxisEvent[]
) => PraxisFact[];

/**
 * A constraint function checks that an invariant holds.
 * Constraints must be pure - no side effects.
 *
 * @param state Current Praxis state
 * @returns true if constraint is satisfied, false or error message if violated
 */
export type ConstraintFn<TContext = unknown> = (
  state: PraxisState & { context: TContext }
) => boolean | string;

/**
 * Descriptor for a rule, including its ID, description, and implementation.
 */
export interface RuleDescriptor<TContext = unknown> {
  /** Unique identifier for the rule */
  id: RuleId;
  /** Human-readable description */
  description: string;
  /** Implementation function */
  impl: RuleFn<TContext>;
  /** Optional contract for rule behavior */
  contract?: Contract;
  /** Optional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Descriptor for a constraint, including its ID, description, and implementation.
 */
export interface ConstraintDescriptor<TContext = unknown> {
  /** Unique identifier for the constraint */
  id: ConstraintId;
  /** Human-readable description */
  description: string;
  /** Implementation function */
  impl: ConstraintFn<TContext>;
  /** Optional contract for constraint behavior */
  contract?: Contract;
  /** Optional metadata */
  meta?: Record<string, unknown>;
}

/**
 * A Praxis module bundles rules and constraints.
 * Modules can be composed and registered with the engine.
 */
export interface PraxisModule<TContext = unknown> {
  /** Rules in this module */
  rules: RuleDescriptor<TContext>[];
  /** Constraints in this module */
  constraints: ConstraintDescriptor<TContext>[];
  /** Optional module metadata */
  meta?: Record<string, unknown>;
}

/**
 * Compliance validation options for rule/constraint registration.
 */
export interface RegistryComplianceOptions {
  /** Enable contract checks during registration (default: true in dev) */
  enabled?: boolean;
  /** Required contract fields to be present */
  requiredFields?: Array<'behavior' | 'examples' | 'invariants'>;
  /** Severity to use for missing contracts */
  missingSeverity?: Severity;
  /** Callback for contract gaps (e.g., to emit facts) */
  onGap?: (gap: ContractGap) => void;
}

/**
 * PraxisRegistry configuration options.
 */
export interface PraxisRegistryOptions {
  compliance?: RegistryComplianceOptions;
}

/**
 * Registry for rules and constraints.
 * Maps IDs to their descriptors.
 */
export class PraxisRegistry<TContext = unknown> {
  private rules = new Map<RuleId, RuleDescriptor<TContext>>();
  private constraints = new Map<ConstraintId, ConstraintDescriptor<TContext>>();
  private readonly compliance: RegistryComplianceOptions;
  private contractGaps: ContractGap[] = [];

  constructor(options: PraxisRegistryOptions = {}) {
    const defaultEnabled = typeof process !== 'undefined' ? process.env?.NODE_ENV !== 'production' : false;
    this.compliance = {
      enabled: defaultEnabled,
      requiredFields: ['behavior', 'examples', 'invariants'],
      missingSeverity: 'warning',
      ...options.compliance,
    };
  }

  /**
   * Register a rule
   */
  registerRule(descriptor: RuleDescriptor<TContext>): void {
    if (this.rules.has(descriptor.id)) {
      throw new Error(`Rule with id "${descriptor.id}" already registered`);
    }
    this.rules.set(descriptor.id, descriptor);
    this.trackContractCompliance(descriptor.id, descriptor);
  }

  /**
   * Register a constraint
   */
  registerConstraint(descriptor: ConstraintDescriptor<TContext>): void {
    if (this.constraints.has(descriptor.id)) {
      throw new Error(`Constraint with id "${descriptor.id}" already registered`);
    }
    this.constraints.set(descriptor.id, descriptor);
    this.trackContractCompliance(descriptor.id, descriptor);
  }

  /**
   * Register a module (all its rules and constraints)
   */
  registerModule(module: PraxisModule<TContext>): void {
    for (const rule of module.rules) {
      this.registerRule(rule);
    }
    for (const constraint of module.constraints) {
      this.registerConstraint(constraint);
    }
  }

  /**
   * Get a rule by ID
   */
  getRule(id: RuleId): RuleDescriptor<TContext> | undefined {
    return this.rules.get(id);
  }

  /**
   * Get a constraint by ID
   */
  getConstraint(id: ConstraintId): ConstraintDescriptor<TContext> | undefined {
    return this.constraints.get(id);
  }

  /**
   * Get all registered rule IDs
   */
  getRuleIds(): RuleId[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Get all registered constraint IDs
   */
  getConstraintIds(): ConstraintId[] {
    return Array.from(this.constraints.keys());
  }

  /**
   * Get all rules
   */
  getAllRules(): RuleDescriptor<TContext>[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get all constraints
   */
  getAllConstraints(): ConstraintDescriptor<TContext>[] {
    return Array.from(this.constraints.values());
  }

  /**
  * Get collected contract gaps from registration-time validation.
  */
  getContractGaps(): ContractGap[] {
    return [...this.contractGaps];
  }

  /**
  * Clear collected contract gaps.
  */
  clearContractGaps(): void {
    this.contractGaps = [];
  }

  private trackContractCompliance(
    id: string,
    descriptor: RuleDescriptor<TContext> | ConstraintDescriptor<TContext>
  ): void {
    if (!this.compliance.enabled) {
      return;
    }

    const gaps = this.validateDescriptorContract(id, descriptor);
    for (const gap of gaps) {
      this.contractGaps.push(gap);
      if (this.compliance.onGap) {
        this.compliance.onGap(gap);
      } else {
        const label = gap.severity === 'error' ? 'ERROR' : gap.severity === 'warning' ? 'WARN' : 'INFO';
        console.warn(`[Praxis][${label}] Contract gap for "${gap.ruleId}": missing ${gap.missing.join(', ')}`);
      }
    }
  }

  private validateDescriptorContract(
    id: string,
    descriptor: RuleDescriptor<TContext> | ConstraintDescriptor<TContext>
  ): ContractGap[] {
    const requiredFields = this.compliance.requiredFields ?? ['behavior', 'examples', 'invariants'];
    const missingSeverity = this.compliance.missingSeverity ?? 'warning';
    const contract =
      descriptor.contract ??
      (descriptor.meta?.contract && typeof descriptor.meta.contract === 'object'
        ? (descriptor.meta.contract as Contract)
        : undefined);

    if (!contract) {
      return [
        {
          ruleId: id,
          missing: ['contract'],
          severity: missingSeverity,
          message: `Contract missing for "${id}"`,
        },
      ];
    }

    const missing: MissingArtifact[] = [];

    if (requiredFields.includes('behavior') && (!contract.behavior || contract.behavior.trim() === '')) {
      missing.push('behavior');
    }

    if (requiredFields.includes('examples') && (!contract.examples || contract.examples.length === 0)) {
      missing.push('examples');
    }

    if (requiredFields.includes('invariants') && (!contract.invariants || contract.invariants.length === 0)) {
      missing.push('invariants');
    }

    if (missing.length === 0) {
      return [];
    }

    return [
      {
        ruleId: id,
        missing,
        severity: 'warning',
        message: `Contract for "${id}" is incomplete: missing ${missing.join(', ')}`,
      },
    ];
  }
}
