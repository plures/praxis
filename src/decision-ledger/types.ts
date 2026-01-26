/**
 * Decision Ledger - Contract Types
 *
 * Types for defining and validating contracts for rules and constraints.
 * All types are JSON-serializable for cross-language compatibility.
 */

/**
 * A single assumption made during contract definition.
 */
export interface Assumption {
  /** Stable unique identifier for the assumption */
  id: string;
  /** The assumption statement */
  statement: string;
  /** Confidence level (0.0 to 1.0) */
  confidence: number;
  /** Justification for the assumption */
  justification: string;
  /** What this assumption was derived from */
  derivedFrom?: string;
  /** What artifacts this assumption impacts */
  impacts: Array<'spec' | 'tests' | 'code'>;
  /** Current status of the assumption */
  status: 'active' | 'revised' | 'invalidated';
}

/**
 * A reference to external documentation or resources.
 */
export interface Reference {
  /** Type of reference (e.g., 'doc', 'ticket', 'issue') */
  type: string;
  /** URL to the reference */
  url?: string;
  /** Human-readable description */
  description?: string;
}

/**
 * A Given/When/Then example for a contract.
 */
export interface Example {
  /** Initial state or preconditions */
  given: string;
  /** Triggering event or action */
  when: string;
  /** Expected outcome or postconditions */
  then: string;
}

/**
 * Contract for a rule or constraint.
 * Documents the expected behavior, test cases, invariants, and assumptions.
 */
export interface Contract {
  /** ID of the rule or constraint this contract applies to */
  ruleId: string;
  /** Canonical behavior description */
  behavior: string;
  /** Given/When/Then examples (become test vectors) */
  examples: Example[];
  /** TLA+-friendly invariants or Praxis-level invariants */
  invariants: string[];
  /** Explicit assumptions with confidence levels */
  assumptions?: Assumption[];
  /** References to docs, tickets, links */
  references?: Reference[];
  /** Contract version (for evolution tracking) */
  version?: string;
  /** Timestamp of contract creation */
  timestamp?: string;
}

/**
 * Type guard to check if an object is a valid Contract.
 */
export function isContract(obj: unknown): obj is Contract {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const contract = obj as Partial<Contract>;

  return (
    typeof contract.ruleId === 'string' &&
    typeof contract.behavior === 'string' &&
    Array.isArray(contract.examples) &&
    contract.examples.length > 0 &&
    contract.examples.every(
      (ex) =>
        typeof ex === 'object' &&
        ex !== null &&
        typeof ex.given === 'string' &&
        typeof ex.when === 'string' &&
        typeof ex.then === 'string'
    ) &&
    Array.isArray(contract.invariants) &&
    contract.invariants.every((inv) => typeof inv === 'string')
  );
}

/**
 * Options for defining a contract.
 */
export interface DefineContractOptions {
  /** ID of the rule or constraint */
  ruleId: string;
  /** Canonical behavior description */
  behavior: string;
  /** Given/When/Then examples */
  examples: Example[];
  /** Invariants that must hold */
  invariants: string[];
  /** Optional assumptions */
  assumptions?: Assumption[];
  /** Optional references */
  references?: Reference[];
  /** Optional version */
  version?: string;
}

/**
 * Define a contract for a rule or constraint.
 *
 * @example
 * const loginContract = defineContract({
 *   ruleId: 'auth.login',
 *   behavior: 'Process login events and create user session facts',
 *   examples: [
 *     {
 *       given: 'User provides valid credentials',
 *       when: 'LOGIN event is received',
 *       then: 'UserSessionCreated fact is emitted'
 *     }
 *   ],
 *   invariants: ['Session must have unique ID']
 * });
 */
export function defineContract(options: DefineContractOptions): Contract {
  if (options.examples.length === 0) {
    throw new Error('Contract must have at least one example');
  }

  return {
    ruleId: options.ruleId,
    behavior: options.behavior,
    examples: options.examples,
    invariants: options.invariants,
    assumptions: options.assumptions,
    references: options.references,
    version: options.version || '1.0.0',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract contract from rule/constraint metadata.
 */
export function getContract(meta?: Record<string, unknown>): Contract | undefined {
  if (!meta || !meta.contract) {
    return undefined;
  }

  if (isContract(meta.contract)) {
    return meta.contract;
  }

  return undefined;
}

/**
 * Severity levels for contract gaps.
 */
export type Severity = 'warning' | 'error' | 'info';

/**
 * Types of missing contract artifacts.
 */
export type MissingArtifact = 'behavior' | 'examples' | 'invariants' | 'tests' | 'spec' | 'contract';

/**
 * A gap in contract coverage.
 */
export interface ContractGap {
  /** ID of the rule or constraint */
  ruleId: string;
  /** What is missing */
  missing: MissingArtifact[];
  /** Severity of the gap */
  severity: Severity;
  /** Optional human-readable message */
  message?: string;
}

/**
 * Result of contract validation.
 */
export interface ValidationReport {
  /** Rules/constraints with complete contracts */
  complete: Array<{ ruleId: string; contract: Contract }>;
  /** Rules/constraints with incomplete contracts */
  incomplete: ContractGap[];
  /** Rules/constraints with no contract at all */
  missing: string[];
  /** Total number of rules/constraints validated */
  total: number;
  /** Timestamp of validation */
  timestamp: string;
}
