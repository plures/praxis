/**
 * @plures/praxis-pluresdb
 *
 * PluresDB native backend for the Praxis logic engine.
 *
 * Provides:
 * - `PluresDBNativeAdapter` — PraxisDB interface backed by NAPI bindings
 * - `executeProcedure` — run pluresLM-mcp procedures natively in Rust
 * - `executeConstraints` — evaluate Praxis constraints via PluresDB pipelines
 * - `canExecuteNatively` — check if a procedure can bypass the TS engine
 */

// Adapter
export { PluresDBNativeAdapter, type NativeAdapterConfig, type PraxisDB, type UnsubscribeFn } from './adapter.js';

// Procedure bridge
export { executeProcedure, canExecuteNatively, type TsProcedureStep, type TsStepKind } from './procedure-bridge.js';

// Constraint executor
export {
  executeConstraints,
  storeConstraint,
  loadConstraints,
  type ConstraintDef,
  type ConstraintCheck,
  type ConstraintResult,
} from './constraints.js';
