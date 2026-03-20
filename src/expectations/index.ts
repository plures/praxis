/**
 * Expectations DSL
 *
 * Public API for behavioral expectations.
 *
 * @example
 * ```ts
 * import { expectBehavior, ExpectationSet, verify } from '@plures/praxis/expectations';
 * ```
 */

export {
  Expectation,
  ExpectationSet,
  expectBehavior,
  verify,
  formatVerificationReport,
} from './expectations.js';

export type {
  ExpectationCondition,
  ConditionStatus,
  ConditionResult,
  ExpectationResult,
  VerificationReport,
  ExpectationSetOptions,
  VerifiableRegistry,
  VerifiableDescriptor,
} from './types.js';
