/**
 * Decision Ledger - Facts and Events
 *
 * Defines the facts and events used by the Decision Ledger system.
 */

import { defineFact, defineEvent } from '../dsl/index.js';
import type { MissingArtifact, Severity } from './types.js';

/**
 * Fact: ContractMissing
 *
 * Indicates that a rule or constraint is missing contract artifacts.
 */
export const ContractMissing = defineFact<
  'ContractMissing',
  {
    ruleId: string;
    missing: MissingArtifact[];
    severity: Severity;
    message?: string;
  }
>('ContractMissing');

/**
 * Fact: ContractValidated
 *
 * Indicates that a rule or constraint has been validated and has a complete contract.
 */
export const ContractValidated = defineFact<
  'ContractValidated',
  {
    ruleId: string;
    version: string;
    timestamp: string;
  }
>('ContractValidated');

/**
 * Event: ACKNOWLEDGE_CONTRACT_GAP
 *
 * Acknowledges a known contract gap with justification.
 */
export const AcknowledgeContractGap = defineEvent<
  'ACKNOWLEDGE_CONTRACT_GAP',
  {
    ruleId: string;
    missing: MissingArtifact[];
    justification: string;
    expiresAt?: string;
  }
>('ACKNOWLEDGE_CONTRACT_GAP');

/**
 * Event: VALIDATE_CONTRACTS
 *
 * Triggers validation of all registered contracts.
 */
export const ValidateContracts = defineEvent<
  'VALIDATE_CONTRACTS',
  {
    strict?: boolean;
  }
>('VALIDATE_CONTRACTS');

/**
 * Fact: ContractGapAcknowledged
 *
 * Records that a contract gap has been acknowledged.
 */
export const ContractGapAcknowledged = defineFact<
  'ContractGapAcknowledged',
  {
    ruleId: string;
    missing: MissingArtifact[];
    justification: string;
    acknowledgedAt: string;
    expiresAt?: string;
  }
>('ContractGapAcknowledged');

/**
 * Event: CONTRACT_ADDED
 *
 * Emitted when a contract is added to a rule or constraint.
 */
export const ContractAdded = defineEvent<
  'CONTRACT_ADDED',
  {
    ruleId: string;
    version: string;
  }
>('CONTRACT_ADDED');

/**
 * Event: CONTRACT_UPDATED
 *
 * Emitted when a contract is updated.
 */
export const ContractUpdated = defineEvent<
  'CONTRACT_UPDATED',
  {
    ruleId: string;
    previousVersion: string;
    newVersion: string;
  }
>('CONTRACT_UPDATED');
