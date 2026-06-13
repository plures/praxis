//! Praxis Intent Language (.px) — thin wrapper over `pluresdb-px`.
//!
//! This module re-exports the canonical `.px` runtime from `pluresdb-px` and adds:
//! - `eval` — unified expression evaluator with NativeFunctionRegistry
//! - `executor` — extended executor integrating the expression evaluator
//!
//! ADR-0021 Phase 4: praxis-native no longer maintains its own parser, grammar,
//! compiler, linter, resolver, watcher, compose, or scenario runner. All of those
//! live in pluresdb-px (the foundation layer).

pub mod eval;
pub mod executor;

// ── Re-exports from pluresdb-px ──────────────────────────────────────────────

// Core parse function
pub use pluresdb_px::px::parse;

// AST types
pub use pluresdb_px::px::{
    FunctionMode, PxAction, PxCapture, PxConfig, PxConfigEntry, PxConstraint, PxContract,
    PxDataflowParam, PxDataflowProcedure, PxDataflowReturn, PxDocument, PxEntity, PxExample,
    PxExpectation, PxFact, PxField, PxFunction, PxImport, PxMatchArm, PxParallelBranch,
    PxProcedure, PxProcedureTrigger, PxRule, PxScenario, PxScenarioRun, PxStep, PxTrigger,
};

// Parser + Rule enum (needed by eval.rs for expression parsing)
pub use pluresdb_px::px::{PxParser, Rule};

// Sub-modules (re-export the full upstream modules for downstream use)
pub use pluresdb_px::px::builder;
pub use pluresdb_px::px::compiler;
pub use pluresdb_px::px::dataflow;
pub use pluresdb_px::px::lint;
pub use pluresdb_px::px::resolver;
pub use pluresdb_px::px::scenario_runner;

#[cfg(feature = "napi-binding")]
pub use pluresdb_px::px::async_executor;
#[cfg(feature = "napi-binding")]
pub use pluresdb_px::px::compose;
#[cfg(feature = "napi-binding")]
pub use pluresdb_px::px::watcher;

// Always re-export async_executor and compose when the dep supports it
#[cfg(not(feature = "napi-binding"))]
pub use pluresdb_px::px::async_executor;
#[cfg(not(feature = "napi-binding"))]
pub use pluresdb_px::px::compose;
#[cfg(not(feature = "napi-binding"))]
pub use pluresdb_px::px::watcher;
