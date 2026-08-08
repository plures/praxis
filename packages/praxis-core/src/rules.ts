/**
 * Rules and Constraints System
 *
 * This module defines the types and registry for rules and constraints.
 * Rules and constraints are identified by stable IDs and can be described as data,
 * making them portable across languages and suitable for DSL-based definitions.
 */

import type { PraxisEvent, PraxisFact, PraxisState } from './protocol.js';
import type { Contract, ContractGap, MissingArtifact, Severity } from './decision-ledger/types.js';
import type { RuleResult } from './rule-result.js';

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
 * Returns either:
 * - `RuleResult` (new API — typed, traceable, supports retraction)
 * - `PraxisFact[]` (legacy — backward compatible, will be deprecated)
 *
 * The state parameter includes `events` — the current batch being processed.
 *
 * @param state Current Praxis state (includes state.events for current batch)
 * @param events Events to process (same as state.events, provided for convenience)
 * @returns RuleResult or array of new facts
 */
export type RuleFn<TContext = unknown> = (
  state: PraxisState & { context: TContext; events: PraxisEvent[] },
  events: PraxisEvent[]
) => RuleResult | PraxisFact[];

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
  /**
   * Optional event type filter — only evaluate this rule when at least one
   * event in the batch has a matching `tag`. When omitted, the rule runs on
   * every step (catch-all).
   *
   * Accepts a single tag string or an array of tags.
   *
   * @example
   * { id: 'sprint-behind', eventTypes: ['sprint.update'], impl: ... }
   * { id: 'note-check', eventTypes: 'note.update', impl: ... }
   */
  eventTypes?: string | string[];
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
  /** Cached rule ID list — invalidated on registration */
  private cachedRuleIds: RuleId[] | null = null;
  /** Cached constraint ID list — invalidated on registration */
  private cachedConstraintIds: ConstraintId[] | null = null;
  /** Index: event tag → rule IDs that declare that tag in eventTypes */
  private eventTypeIndex = new Map<string, RuleId[]>();
  /** Rule IDs that have no eventTypes filter (catch-all rules) */
  private catchAllRuleIds: RuleId[] = [];

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
    this.cachedRuleIds = null; // invalidate cache

    // Update event-type index
    if (descriptor.eventTypes) {
      const tags = Array.isArray(descriptor.eventTypes) ? descriptor.eventTypes : [descriptor.eventTypes];
      for (const tag of tags) {
        const existing = this.eventTypeIndex.get(tag);
        if (existing) {
          existing.push(descriptor.id);
        } else {
          this.eventTypeIndex.set(tag, [descriptor.id]);
        }
      }
    } else {
      this.catchAllRuleIds.push(descriptor.id);
    }

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
    this.cachedConstraintIds = null; // invalidate cache
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
    if (this.cachedRuleIds === null) {
      this.cachedRuleIds = Array.from(this.rules.keys());
    }
    return this.cachedRuleIds;
  }

  /**
   * Get all registered constraint IDs
   */
  getConstraintIds(): ConstraintId[] {
    if (this.cachedConstraintIds === null) {
      this.cachedConstraintIds = Array.from(this.constraints.keys());
    }
    return this.cachedConstraintIds;
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
   * Get rule IDs relevant to a set of event tags using the pre-built index.
   * Returns catch-all rules plus any rules whose eventTypes overlap the given tags.
   * This avoids iterating all rules and checking eventTypes at evaluation time.
   */
  getRuleIdsForEvents(eventTags: Set<string>): RuleId[] {
    if (eventTags.size === 0) {
      return this.catchAllRuleIds;
    }
    const result: RuleId[] = [...this.catchAllRuleIds];
    const seen = new Set<RuleId>();
    for (const id of this.catchAllRuleIds) seen.add(id);
    for (const tag of eventTags) {
      const ids = this.eventTypeIndex.get(tag);
      if (ids) {
        for (const id of ids) {
          if (!seen.has(id)) {
            seen.add(id);
            result.push(id);
          }
        }
      }
    }
    return result;
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
