/**
 * @plures/praxis — Completeness Analysis
 *
 * This module provides tools to measure and enforce "Praxis Completeness" —
 * the degree to which an application's logic is expressed through Praxis
 * rules, constraints, and contracts rather than scattered conditionals.
 *
 * ## Definition: Praxis Logic Completeness
 *
 * An application is "Praxis Complete" when:
 *
 * 1. **DOMAIN RULES (100%)** — Every business decision that produces user-visible
 *    behavior change is expressed as a Praxis rule. "If the sprint is behind pace,
 *    show a warning" is domain logic. It belongs in Praxis.
 *
 * 2. **INVARIANTS (100%)** — Every data validity assertion is a Praxis constraint.
 *    "Sprint hours must not exceed 80" is an invariant. It belongs in Praxis.
 *
 * 3. **CONTRACTS (>80%)** — Rules that encode non-obvious behavior have contracts
 *    (behavior description + examples + invariants). Contracts are documentation
 *    AND test vectors — they prove the tool isn't the bug.
 *
 * 4. **CONTEXT COVERAGE (100%)** — Every piece of application state that rules
 *    reason about is in the Praxis context. If a rule needs to know about
 *    connection status, connection status must be in the context.
 *
 * 5. **EVENT COVERAGE (100%)** — Every state transition that should trigger rule
 *    evaluation fires a Praxis event. If notes can be saved, there's a note.save
 *    event. If sprint refreshes, there's a sprint.refresh event.
 *
 * ## What Is NOT Praxis Logic
 *
 * - **UI mechanics**: Panel toggle, scroll position, animation state, focus management
 * - **Data transport**: fetch() calls, WebSocket plumbing, file I/O
 * - **Framework wiring**: Svelte subscriptions, onMount, store creation
 * - **Data transformation**: Parsing, formatting, serialization
 * - **Routing/navigation**: URL handling, panel switching (unless it has business rules)
 *
 * The line: "Does this `if` statement encode a business decision or an app invariant?"
 * If yes → Praxis rule/constraint. If no → leave it.
 *
 * ## Measuring Completeness
 *
 * ### Quantitative Metrics
 * - **Rule Coverage**: (domain `if` branches in Praxis) / (total domain `if` branches)
 * - **Constraint Coverage**: (data invariants in Praxis) / (total data invariants)
 * - **Contract Coverage**: (rules with contracts) / (rules that need contracts)
 * - **Context Coverage**: (state fields wired to context) / (state fields rules need)
 * - **Event Coverage**: (state transitions with events) / (state transitions that matter)
 *
 * ### Qualitative Indicators
 * - Can you change a business rule by editing ONE rule definition? (single source of truth)
 * - Can you test a business rule without rendering UI? (Praxis engine is headless)
 * - Can you explain every business rule to a PM by reading the registry? (self-documenting)
 * - Does the PraxisPanel show all active concerns? (observable)
 *
 * ## The Completeness Score
 *
 * ```
 * Score = (
 *   rulesCovered / totalDomainBranches * 40 +     // Rules are king (40%)
 *   constraintsCovered / totalInvariants * 20 +    // Invariants matter (20%)
 *   contractsCovered / rulesNeedingContracts * 15 + // Contracts prevent bugs (15%)
 *   contextFieldsCovered / totalNeeded * 15 +       // Context = visibility (15%)
 *   eventsCovered / totalTransitions * 10            // Events = reactivity (10%)
 * )
 * ```
 *
 * 90+ = Complete | 70-89 = Good | 50-69 = Partial | <50 = Incomplete
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** A conditional branch in application logic — domain, invariant, UI, etc. */
export interface LogicBranch {
  /** Source file + line */
  location: string;
  /** The condition expression */
  condition: string;
  /** Classification */
  kind: 'domain' | 'invariant' | 'ui' | 'transport' | 'wiring' | 'transform';
  /** If domain/invariant: the Praxis rule/constraint that covers it, or null */
  coveredBy: string | null;
  /** Human note */
  note?: string;
}

/** A state field that may or may not be wired into the Praxis context. */
export interface StateField {
  /** Store or source name */
  source: string;
  /** Field path */
  field: string;
  /** Whether it's in the Praxis context */
  inContext: boolean;
  /** Whether any rule references it */
  usedByRule: boolean;
}

/** A state transition that should be modelled as a Praxis event. */
export interface StateTransition {
  /** What changes */
  description: string;
  /** The Praxis event tag, or null if missing */
  eventTag: string | null;
  /** Source location */
  location: string;
}

/** Completeness audit report — coverage across rules, constraints, contracts, context, and events. */
export interface CompletenessReport {
  /** Overall score (0-100) */
  score: number;
  /** Rating */
  rating: 'complete' | 'good' | 'partial' | 'incomplete';

  rules: {
    total: number;
    covered: number;
    uncovered: LogicBranch[];
  };
  constraints: {
    total: number;
    covered: number;
    uncovered: LogicBranch[];
  };
  contracts: {
    total: number;
    withContracts: number;
    missing: string[];
  };
  context: {
    total: number;
    covered: number;
    missing: StateField[];
  };
  events: {
    total: number;
    covered: number;
    missing: StateTransition[];
  };
}

/** Options for the completeness audit — threshold and strict mode. */
export interface CompletenessConfig {
  /** Minimum score to pass (default: 90) */
  threshold?: number;
  /** Whether to throw on failure (for CI) */
  strict?: boolean;
}

// ─── Audit Helper ───────────────────────────────────────────────────────────

/**
 * Run a completeness audit against a Praxis registry and app manifest.
 *
 * The manifest is a developer-authored declaration of all logic branches,
 * state fields, and state transitions in the app. The auditor checks which
 * ones are covered by Praxis.
 *
 * @param manifest - Developer-authored manifest listing all logic branches, state fields, and transitions
 * @param registryRuleIds - IDs of rules currently registered in the engine
 * @param registryConstraintIds - IDs of constraints currently registered in the engine
 * @param rulesWithContracts - IDs of rules that have Decision Ledger contracts attached
 * @param config - Optional audit configuration (threshold, strict mode)
 * @returns A {@link CompletenessReport} with a numeric score and per-dimension coverage details
 */
export function auditCompleteness(
  manifest: {
    branches: LogicBranch[];
    stateFields: StateField[];
    transitions: StateTransition[];
    rulesNeedingContracts: string[];
  },
  registryRuleIds: string[],
  registryConstraintIds: string[],
  rulesWithContracts: string[],
  config?: CompletenessConfig,
): CompletenessReport {
  const threshold = config?.threshold ?? 90;

  // Rules
  const domainBranches = manifest.branches.filter(b => b.kind === 'domain');
  const coveredDomain = domainBranches.filter(b => b.coveredBy && registryRuleIds.includes(b.coveredBy));
  const uncoveredDomain = domainBranches.filter(b => !b.coveredBy || !registryRuleIds.includes(b.coveredBy));

  // Constraints
  const invariantBranches = manifest.branches.filter(b => b.kind === 'invariant');
  const coveredInvariants = invariantBranches.filter(b => b.coveredBy && registryConstraintIds.includes(b.coveredBy));
  const uncoveredInvariants = invariantBranches.filter(b => !b.coveredBy || !registryConstraintIds.includes(b.coveredBy));

  // Contracts
  const needContracts = manifest.rulesNeedingContracts;
  const haveContracts = needContracts.filter(id => rulesWithContracts.includes(id));
  const missingContracts = needContracts.filter(id => !rulesWithContracts.includes(id));

  // Context
  const neededFields = manifest.stateFields.filter(f => f.usedByRule);
  const coveredFields = neededFields.filter(f => f.inContext);
  const missingFields = neededFields.filter(f => !f.inContext);

  // Events
  const coveredTransitions = manifest.transitions.filter(t => t.eventTag);
  const missingTransitions = manifest.transitions.filter(t => !t.eventTag);

  // Score
  const ruleScore = domainBranches.length > 0 ? (coveredDomain.length / domainBranches.length) * 40 : 40;
  const constraintScore = invariantBranches.length > 0 ? (coveredInvariants.length / invariantBranches.length) * 20 : 20;
  const contractScore = needContracts.length > 0 ? (haveContracts.length / needContracts.length) * 15 : 15;
  const contextScore = neededFields.length > 0 ? (coveredFields.length / neededFields.length) * 15 : 15;
  const eventScore = manifest.transitions.length > 0 ? (coveredTransitions.length / manifest.transitions.length) * 10 : 10;

  const score = Math.round(ruleScore + constraintScore + contractScore + contextScore + eventScore);
  const rating = score >= 90 ? 'complete' : score >= 70 ? 'good' : score >= 50 ? 'partial' : 'incomplete';

  const report: CompletenessReport = {
    score,
    rating,
    rules: { total: domainBranches.length, covered: coveredDomain.length, uncovered: uncoveredDomain },
    constraints: { total: invariantBranches.length, covered: coveredInvariants.length, uncovered: uncoveredInvariants },
    contracts: { total: needContracts.length, withContracts: haveContracts.length, missing: missingContracts },
    context: { total: neededFields.length, covered: coveredFields.length, missing: missingFields },
    events: { total: manifest.transitions.length, covered: coveredTransitions.length, missing: missingTransitions },
  };

  if (config?.strict && score < threshold) {
    throw new Error(`Praxis completeness ${score}/100 (${rating}) — below threshold ${threshold}. ${uncoveredDomain.length} uncovered rules, ${uncoveredInvariants.length} uncovered invariants, ${missingContracts.length} missing contracts.`);
  }

  return report;
}

/**
 * Format a completeness report as human-readable text.
 *
 * @param report - The completeness report returned by {@link auditCompleteness}
 * @returns A multi-line string suitable for printing to a console or log
 */
export function formatReport(report: CompletenessReport): string {
  const lines: string[] = [];
  const icon = report.rating === 'complete' ? '✅' : report.rating === 'good' ? '🟢' : report.rating === 'partial' ? '🟡' : '🔴';

  lines.push(`${icon} Praxis Completeness: ${report.score}/100 (${report.rating})`);
  lines.push('');
  lines.push(`Rules:       ${report.rules.covered}/${report.rules.total} domain branches covered (${pct(report.rules.covered, report.rules.total)})`);
  lines.push(`Constraints: ${report.constraints.covered}/${report.constraints.total} invariants covered (${pct(report.constraints.covered, report.constraints.total)})`);
  lines.push(`Contracts:   ${report.contracts.withContracts}/${report.contracts.total} rules have contracts (${pct(report.contracts.withContracts, report.contracts.total)})`);
  lines.push(`Context:     ${report.context.covered}/${report.context.total} state fields in context (${pct(report.context.covered, report.context.total)})`);
  lines.push(`Events:      ${report.events.covered}/${report.events.total} transitions have events (${pct(report.events.covered, report.events.total)})`);

  if (report.rules.uncovered.length > 0) {
    lines.push('');
    lines.push('Uncovered domain logic:');
    for (const b of report.rules.uncovered) {
      lines.push(`  ❌ ${b.location}: ${b.condition}${b.note ? ` — ${b.note}` : ''}`);
    }
  }

  if (report.constraints.uncovered.length > 0) {
    lines.push('');
    lines.push('Uncovered invariants:');
    for (const b of report.constraints.uncovered) {
      lines.push(`  ❌ ${b.location}: ${b.condition}${b.note ? ` — ${b.note}` : ''}`);
    }
  }

  if (report.contracts.missing.length > 0) {
    lines.push('');
    lines.push('Rules missing contracts:');
    for (const id of report.contracts.missing) {
      lines.push(`  📝 ${id}`);
    }
  }

  if (report.events.missing.length > 0) {
    lines.push('');
    lines.push('State transitions without events:');
    for (const t of report.events.missing) {
      lines.push(`  ⚡ ${t.location}: ${t.description}`);
    }
  }

  return lines.join('\n');
}

function pct(a: number, b: number): string {
  if (b === 0) return '100%';
  return Math.round((a / b) * 100) + '%';
}
