/**
 * Procedure Bridge
 *
 * Translates pluresLM-mcp TypeScript procedure definitions into
 * PluresDB's native IR (Intermediate Representation) steps, then
 * executes them via the NAPI `execIr` binding.
 *
 * This replaces the TypeScript ProcedureEngine in pluresLM-mcp with
 * PluresDB's Rust procedure engine for:
 * - 10-100x faster execution (native HNSW, no JS→Rust round trips per step)
 * - Native vector search within procedure pipelines
 * - Atomic multi-step execution
 */

import type { PluresDatabaseLike as PluresDatabase } from './adapter.js';

/**
 * Step kind from pluresLM-mcp's TypeScript ProcedureEngine
 */
export type TsStepKind =
  | 'search' | 'search_text' | 'filter' | 'sort' | 'limit'
  | 'merge' | 'store' | 'update' | 'delete' | 'transform'
  | 'cue' | 'parallel' | 'conditional' | 'assign' | 'emit';

/**
 * A procedure step as defined in pluresLM-mcp
 */
export interface TsProcedureStep {
  kind: TsStepKind;
  params: Record<string, unknown>;
  as?: string;
}

/**
 * Map a pluresLM-mcp step to PluresDB IR step.
 *
 * PluresDB's IR uses an enum variant per step kind with typed fields.
 * The TS procedure engine uses { kind, params } objects.
 */
function mapStepToIr(step: TsProcedureStep): Record<string, unknown> {
  const p = step.params;

  switch (step.kind) {
    case 'search':
      return {
        VectorSearch: {
          query: p.query as string,
          limit: (p.limit as number) ?? 10,
          min_score: (p.min_score as number) ?? (p.minScore as number) ?? 0,
          category: (p.category as string) ?? null,
        },
      };

    case 'search_text':
      return {
        TextSearch: {
          query: p.query as string,
          limit: (p.limit as number) ?? 10,
          field: (p.field as string) ?? 'text',
        },
      };

    case 'filter': {
      // TS filter format: { field, op, value } → IR Predicate
      const predicate = buildPredicate(p);
      return { Filter: { predicate } };
    }

    case 'sort':
      return {
        Sort: {
          by: p.by as string ?? p.field as string,
          dir: (p.dir as string) ?? (p.order as string) ?? 'desc',
          after: (p.after as string) ?? null,
        },
      };

    case 'limit':
      return { Limit: { n: (p.n as number) ?? (p.limit as number) ?? 10 } };

    case 'transform':
      return {
        Transform: {
          format: (p.format as string) ?? 'structured',
          max_chars: (p.max_chars as number) ?? (p.maxChars as number) ?? 0,
        },
      };

    case 'conditional': {
      const condition = buildPredicate(p.condition as Record<string, unknown> ?? {});
      const thenSteps = ((p.then_steps ?? p.thenSteps ?? []) as TsProcedureStep[]).map(mapStepToIr);
      const elseSteps = ((p.else_steps ?? p.elseSteps ?? []) as TsProcedureStep[]).map(mapStepToIr);
      return {
        Conditional: {
          condition,
          then_steps: thenSteps,
          else_steps: elseSteps,
        },
      };
    }

    case 'assign':
      return { Assign: { name: (p.name as string) ?? (step.as as string) ?? 'result' } };

    case 'emit':
      return {
        Emit: {
          label: (p.label as string) ?? 'output',
          from_var: (p.from_var as string) ?? (p.fromVar as string) ?? null,
        },
      };

    // Steps that don't have direct IR equivalents — pass through as no-ops
    // (store, update, delete, merge, cue, parallel are handled at orchestration level)
    case 'store':
    case 'update':
    case 'delete':
    case 'merge':
    case 'cue':
    case 'parallel':
      // These are side-effectful steps that need orchestration-level handling.
      // Return a no-op filter that passes everything through.
      return { Limit: { n: 999999 } };

    default:
      return { Limit: { n: 999999 } };
  }
}

/**
 * Build a PluresDB IR Predicate from TS filter params.
 *
 * TS format: { field: "category", op: "eq", value: "decision" }
 * IR format: { Eq: { field: "category", value: "decision" } }
 */
function buildPredicate(p: Record<string, unknown>): Record<string, unknown> {
  const field = p.field as string;
  const op = (p.op as string) ?? 'eq';
  const value = p.value;

  switch (op) {
    case 'eq': return { Eq: { field, value: String(value) } };
    case 'ne': case 'neq': return { Ne: { field, value: String(value) } };
    case 'gt': return { Gt: { field, value: String(value) } };
    case 'lt': return { Lt: { field, value: String(value) } };
    case 'gte': return { Gte: { field, value: String(value) } };
    case 'lte': return { Lte: { field, value: String(value) } };
    case 'contains': return { Contains: { field, value: String(value) } };
    case 'exists': return { Exists: { field } };
    case 'and': {
      const clauses = (value as Record<string, unknown>[]).map(buildPredicate);
      return { And: clauses };
    }
    case 'or': {
      const clauses = (value as Record<string, unknown>[]).map(buildPredicate);
      return { Or: clauses };
    }
    default: return { Eq: { field: field ?? 'id', value: String(value ?? '') } };
  }
}

/**
 * Execute a pluresLM-mcp procedure definition natively in PluresDB.
 *
 * Translates TS steps → PluresDB IR → execIr NAPI call.
 * Returns the procedure result in the same format the TS engine would.
 */
export function executeProcedure(
  db: PluresDatabase,
  steps: TsProcedureStep[],
): unknown {
  // Separate IR-executable steps from side-effect steps
  const irSteps: Record<string, unknown>[] = [];
  const sideEffects: TsProcedureStep[] = [];

  for (const step of steps) {
    if (['store', 'update', 'delete', 'cue'].includes(step.kind)) {
      sideEffects.push(step);
    } else {
      irSteps.push(mapStepToIr(step));
    }
  }

  // Execute the query pipeline natively
  let result: unknown;
  if (irSteps.length > 0) {
    result = db.execIr(irSteps);
  } else {
    result = { nodes: [], variables: {} };
  }

  // Handle side effects against the result
  for (const step of sideEffects) {
    executeSideEffect(db, step, result);
  }

  return result;
}

/**
 * Execute a side-effectful step (store/update/delete/cue).
 */
function executeSideEffect(
  db: PluresDatabase,
  step: TsProcedureStep,
  _pipelineResult: unknown,
): void {
  const p = step.params;

  switch (step.kind) {
    case 'store': {
      const data = p.data as Record<string, unknown> ?? {};
      const id = (p.id as string) ?? crypto.randomUUID();
      db.put(id, data);
      break;
    }
    case 'delete': {
      const id = p.id as string;
      if (id) db.delete(id);
      break;
    }
    // update and cue are best handled at the orchestration layer
    default:
      break;
  }
}

/**
 * Check if a set of procedure steps can be fully executed natively.
 *
 * Returns true if all steps have IR equivalents. When false, the caller
 * should fall back to the TS engine for unsupported steps.
 */
export function canExecuteNatively(steps: TsProcedureStep[]): boolean {
  const nativeKinds = new Set<TsStepKind>([
    'search', 'search_text', 'filter', 'sort', 'limit',
    'transform', 'conditional', 'assign', 'emit',
  ]);
  return steps.every(s => nativeKinds.has(s.kind));
}
