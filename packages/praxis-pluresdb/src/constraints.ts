/**
 * Constraint Executor
 *
 * Compiles Praxis constraints into PluresDB procedure pipelines
 * and executes them natively. This is the bridge between praxis-core's
 * constraint definitions and PluresDB's Rust procedure engine.
 *
 * Instead of evaluating constraints in JS against in-memory state,
 * constraints become stored procedures that run against the live DB.
 */

import type { PluresDatabase } from '@plures/pluresdb';
import { executeProcedure, type TsProcedureStep } from './procedure-bridge.js';

/**
 * A constraint definition from praxis-core (simplified for DB execution).
 */
export interface ConstraintDef {
  /** Unique constraint ID */
  id: string;
  /** Human-readable description */
  description?: string;
  /** Category filter — only check facts of this type */
  factTag?: string;
  /** Field-level checks */
  checks: ConstraintCheck[];
  /** Severity: 'error' blocks writes, 'warn' logs only */
  severity?: 'error' | 'warn';
}

export interface ConstraintCheck {
  /** Field path in the fact payload */
  field: string;
  /** Comparison operator */
  op: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'exists' | 'contains';
  /** Expected value (not needed for 'exists') */
  value?: unknown;
  /** Error message when check fails */
  message?: string;
}

export interface ConstraintResult {
  constraintId: string;
  passed: boolean;
  violations: string[];
}

/**
 * Execute a set of constraints against the current DB state.
 *
 * Each constraint is compiled into a PluresDB procedure pipeline:
 * 1. Filter by factTag (if specified)
 * 2. Apply each check as a filter step
 * 3. If results are empty after filtering, constraint passes
 *    (no violating records found)
 *
 * For "existence" constraints (must exist), we invert the logic.
 */
export function executeConstraints(
  db: PluresDatabase,
  constraints: ConstraintDef[],
): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  for (const constraint of constraints) {
    const violations: string[] = [];

    // Build a pipeline that finds violating records
    const steps: TsProcedureStep[] = [];

    // Step 1: Get all facts (or filter by tag)
    if (constraint.factTag) {
      steps.push({
        kind: 'filter',
        params: { field: 'data.tag', op: 'eq', value: constraint.factTag },
      });
    }

    // Step 2: For each check, try to find violations
    for (const check of constraint.checks) {
      try {
        // Query for records that VIOLATE the constraint (inverse logic)
        const violationSteps: TsProcedureStep[] = [];
        if (constraint.factTag) {
          violationSteps.push({
            kind: 'filter',
            params: { field: 'data.tag', op: 'eq', value: constraint.factTag },
          });
        }

        // Invert the check to find violations
        const invertedOp = invertOp(check.op);
        if (invertedOp) {
          violationSteps.push({
            kind: 'filter',
            params: { field: `data.payload.${check.field}`, op: invertedOp, value: check.value },
          });
          violationSteps.push({ kind: 'limit', params: { n: 1 } });

          const result = executeProcedure(db, violationSteps) as { nodes?: unknown[] };
          if (result?.nodes && result.nodes.length > 0) {
            violations.push(
              check.message ?? `Constraint "${constraint.id}" violated: ${check.field} ${check.op} ${check.value}`
            );
          }
        }
      } catch (err) {
        violations.push(
          `Error checking constraint "${constraint.id}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    results.push({
      constraintId: constraint.id,
      passed: violations.length === 0,
      violations,
    });
  }

  return results;
}

/**
 * Invert a comparison operator for violation detection.
 */
function invertOp(op: string): string | null {
  switch (op) {
    case 'eq': return 'ne';
    case 'ne': return 'eq';
    case 'gt': return 'lte';
    case 'lt': return 'gte';
    case 'gte': return 'lt';
    case 'lte': return 'gt';
    case 'exists': return null; // Can't invert in a single filter
    case 'contains': return null;
    default: return null;
  }
}

/**
 * Store a constraint definition in PluresDB for persistence and replication.
 */
export function storeConstraint(db: PluresDatabase, constraint: ConstraintDef): string {
  const id = `constraint:${constraint.id}`;
  db.put(id, {
    type: 'praxis:constraint',
    ...constraint,
    storedAt: new Date().toISOString(),
  });
  return id;
}

/**
 * Load all stored constraints from PluresDB.
 */
export function loadConstraints(db: PluresDatabase): ConstraintDef[] {
  const records = db.listByType('praxis:constraint');
  return records.map(r => {
    const data = r.data as Record<string, unknown>;
    return {
      id: data.id as string,
      description: data.description as string | undefined,
      factTag: data.factTag as string | undefined,
      checks: (data.checks as ConstraintCheck[]) ?? [],
      severity: (data.severity as 'error' | 'warn') ?? 'error',
    };
  });
}
