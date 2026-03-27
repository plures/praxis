/**
 * Decision Ledger - Facts and Events
 *
 * Defines the facts and events used by the Decision Ledger system.
 */

import { defineFact, defineEvent } from '../dsl/index.js';
import type { FactDefinition, EventDefinition } from '../dsl/index.js';
import type { MissingArtifact, Severity } from './types.js';

/**
 * Fact: ContractMissing
 *
 * Indicates that a rule or constraint is missing contract artifacts.
 */
export const ContractMissing: FactDefinition<
  'ContractMissing',
  {
    ruleId: string;
    missing: MissingArtifact[];
    severity: Severity;
    message?: string;
  }
> = defineFact('ContractMissing');

/**
 * Fact: ContractValidated
 *
 * Indicates that a rule or constraint has been validated and has a complete contract.
 */
export const ContractValidated: FactDefinition<
  'ContractValidated',
  {
    ruleId: string;
    version: string;
    timestamp: string;
  }
> = defineFact('ContractValidated');

/**
 * Event: ACKNOWLEDGE_CONTRACT_GAP
 *
 * Acknowledges a known contract gap with justification.
 */
export const AcknowledgeContractGap: EventDefinition<
  'ACKNOWLEDGE_CONTRACT_GAP',
  {
    ruleId: string;
    missing: MissingArtifact[];
    justification: string;
    expiresAt?: string;
  }
> = defineEvent('ACKNOWLEDGE_CONTRACT_GAP');

/**
 * Event: VALIDATE_CONTRACTS
 *
 * Triggers validation of all registered contracts.
 */
export const ValidateContracts: EventDefinition<
  'VALIDATE_CONTRACTS',
  {
    strict?: boolean;
  }
> = defineEvent('VALIDATE_CONTRACTS');

/**
 * Fact: ContractGapAcknowledged
 *
 * Records that a contract gap has been acknowledged.
 */
export const ContractGapAcknowledged: FactDefinition<
  'ContractGapAcknowledged',
  {
    ruleId: string;
    missing: MissingArtifact[];
    justification: string;
    acknowledgedAt: string;
    expiresAt?: string;
  }
> = defineFact('ContractGapAcknowledged');

/**
 * Event: CONTRACT_ADDED
 *
 * Emitted when a contract is added to a rule or constraint.
 */
export const ContractAdded: EventDefinition<
  'CONTRACT_ADDED',
  {
    ruleId: string;
    version: string;
  }
> = defineEvent('CONTRACT_ADDED');

/**
 * Event: CONTRACT_UPDATED
 *
 * Emitted when a contract is updated.
 */
export const ContractUpdated: EventDefinition<
  'CONTRACT_UPDATED',
  {
    ruleId: string;
    previousVersion: string;
    newVersion: string;
  }
> = defineEvent('CONTRACT_UPDATED');

/**
 * Event: CONTRACT_GAP_EMITTED
 *
 * Emitted when contract gaps are surfaced during validation.
 */
export const ContractGapEmitted: EventDefinition<
  'CONTRACT_GAP_EMITTED',
  {
    ruleId: string;
    missing: MissingArtifact[];
    severity: Severity;
  }
> = defineEvent('CONTRACT_GAP_EMITTED');
