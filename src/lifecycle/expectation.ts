/**
 * Praxis Lifecycle Engine — Expectation DSL
 *
 * The single entry point for all work. Features, bugs, security fixes,
 * customer reports — everything enters as an expectation.
 */

import type {
  LifecycleExpectation,
  ExpectationType,
  ExpectationPriority,
  ClassificationResult,
} from './types.js';

// ─── Builder ────────────────────────────────────────────────────────────────

/** Chainable builder for lifecycle expectations */
export class ExpectationBuilder {
  private _exp: Partial<LifecycleExpectation> = {};

  constructor(id: string) {
    this._exp.id = id;
    this._exp.acceptance = [];
    this._exp.labels = [];
    this._exp.related = [];
    this._exp.priority = 'medium';
  }

  /** Set the expectation type */
  type(type: ExpectationType): this {
    this._exp.type = type;
    return this;
  }

  /** Set the title */
  title(title: string): this {
    this._exp.title = title;
    return this;
  }

  /** Set the description */
  describe(description: string): this {
    this._exp.description = description;
    return this;
  }

  /** Set priority */
  priority(priority: ExpectationPriority): this {
    this._exp.priority = priority;
    return this;
  }

  /** Add acceptance criteria */
  accept(...criteria: string[]): this {
    this._exp.acceptance!.push(...criteria);
    return this;
  }

  /** Add a Given/When/Then acceptance criterion */
  given(given: string): { when: (when: string) => { then: (then: string) => ExpectationBuilder } } {
    const self = this;
    return {
      when: (when: string) => ({
        then: (then: string) => {
          self._exp.acceptance!.push(`Given ${given}, when ${when}, then ${then}`);
          return self;
        },
      }),
    };
  }

  /** Mark as breaking change (major version bump) */
  breaking(): this {
    this._exp.breaking = true;
    return this;
  }

  /** Add labels */
  label(...labels: string[]): this {
    this._exp.labels!.push(...labels);
    return this;
  }

  /** Add related expectation IDs */
  relatedTo(...ids: string[]): this {
    this._exp.related!.push(...ids);
    return this;
  }

  /** Add metadata */
  meta(key: string, value: unknown): this {
    if (!this._exp.meta) this._exp.meta = {};
    this._exp.meta[key] = value;
    return this;
  }

  /** Build the expectation (validates required fields) */
  build(): LifecycleExpectation {
    if (!this._exp.id) throw new Error('Expectation requires an id');
    if (!this._exp.type) throw new Error(`Expectation "${this._exp.id}" requires a type`);
    if (!this._exp.title) throw new Error(`Expectation "${this._exp.id}" requires a title`);
    if (!this._exp.description) throw new Error(`Expectation "${this._exp.id}" requires a description`);

    return this._exp as LifecycleExpectation;
  }
}

/**
 * Create a lifecycle expectation — the single entry point for all work.
 *
 * @example
 * ```ts
 * const auth = expectation('user-oauth-flow')
 *   .type('feature')
 *   .title('OAuth2 Authentication')
 *   .describe('Users can authenticate via OAuth2 providers')
 *   .priority('high')
 *   .given('a valid OAuth token')
 *     .when('login is attempted')
 *     .then('session is created')
 *   .given('an expired token')
 *     .when('login is attempted')
 *     .then('refresh is triggered')
 *   .accept('Error shown for invalid tokens')
 *   .build();
 * ```
 */
export function expectation(id: string): ExpectationBuilder {
  return new ExpectationBuilder(id);
}

/**
 * Shorthand — create expectation from a plain object.
 *
 * @example
 * ```ts
 * const fix = defineExpectation({
 *   id: 'fix-login-redirect',
 *   type: 'fix',
 *   title: 'Fix login redirect loop',
 *   description: 'Users get stuck in redirect loop after OAuth callback',
 *   priority: 'critical',
 *   acceptance: ['Login completes without redirect loop'],
 * });
 * ```
 */
export function defineExpectation(exp: LifecycleExpectation): LifecycleExpectation {
  if (!exp.id) throw new Error('Expectation requires an id');
  if (!exp.type) throw new Error(`Expectation "${exp.id}" requires a type`);
  if (!exp.title) throw new Error(`Expectation "${exp.id}" requires a title`);
  if (!exp.description) throw new Error(`Expectation "${exp.id}" requires a description`);

  return {
    ...exp,
    acceptance: exp.acceptance ?? [],
    labels: exp.labels ?? [],
    related: exp.related ?? [],
    priority: exp.priority ?? 'medium',
  };
}

// ─── Classification Engine ──────────────────────────────────────────────────

/** Keywords that suggest specific expectation types */
const TYPE_SIGNALS: Record<ExpectationType, string[]> = {
  feature: ['add', 'new', 'implement', 'create', 'support', 'enable', 'allow', 'introduce'],
  fix: ['fix', 'bug', 'broken', 'crash', 'error', 'incorrect', 'wrong', 'fail', 'issue', 'regression'],
  security: ['vulnerability', 'cve', 'exploit', 'injection', 'xss', 'csrf', 'auth', 'permission', 'exposure', 'leak'],
  performance: ['slow', 'fast', 'optimize', 'performance', 'latency', 'throughput', 'cache', 'memory', 'cpu'],
  chore: ['refactor', 'cleanup', 'maintenance', 'upgrade', 'dependency', 'deps', 'tooling', 'infrastructure'],
  docs: ['document', 'readme', 'changelog', 'guide', 'tutorial', 'api docs', 'jsdoc', 'comments'],
  deprecation: ['deprecate', 'remove', 'sunset', 'end-of-life', 'eol', 'migrate away', 'replace'],
};

/** Priority signals */
const PRIORITY_SIGNALS: Record<ExpectationPriority, string[]> = {
  critical: ['critical', 'urgent', 'emergency', 'p0', 'outage', 'data loss', 'security breach'],
  high: ['important', 'high priority', 'p1', 'blocker', 'breaking', 'customer impact'],
  medium: ['medium', 'p2', 'normal', 'should have'],
  low: ['low', 'nice to have', 'p3', 'minor', 'cosmetic', 'when time allows'],
};

/**
 * Classify an expectation based on its content.
 *
 * Uses keyword matching against title + description + acceptance criteria.
 * In the future, this could use an LLM for more nuanced classification.
 */
export function classifyExpectation(exp: LifecycleExpectation): ClassificationResult {
  const text = [
    exp.title,
    exp.description,
    ...exp.acceptance,
    ...(exp.labels ?? []),
  ].join(' ').toLowerCase();

  // Score each type
  const typeScores = new Map<ExpectationType, number>();
  for (const [type, signals] of Object.entries(TYPE_SIGNALS) as [ExpectationType, string[]][]) {
    let score = 0;
    for (const signal of signals) {
      if (text.includes(signal)) score++;
    }
    if (score > 0) typeScores.set(type, score);
  }

  // Pick highest scoring type (default to 'feature' if no signals)
  let bestType: ExpectationType = exp.type ?? 'feature';
  let bestScore = 0;
  for (const [type, score] of typeScores) {
    if (score > bestScore) {
      bestType = type;
      bestScore = score;
    }
  }

  const confidence = bestScore > 0 ? Math.min(1, bestScore / 3) : 0.5;

  // Priority signals
  let suggestedPriority: ExpectationPriority | undefined;
  for (const [priority, signals] of Object.entries(PRIORITY_SIGNALS) as [ExpectationPriority, string[]][]) {
    if (signals.some(s => text.includes(s))) {
      suggestedPriority = priority;
      break; // First match wins (critical > high > medium > low)
    }
  }

  // Security always gets bumped to high minimum
  if (bestType === 'security' && (!suggestedPriority || suggestedPriority === 'low' || suggestedPriority === 'medium')) {
    suggestedPriority = 'high';
  }

  // Suggested labels from type
  const suggestedLabels: string[] = [bestType];
  if (exp.breaking) suggestedLabels.push('breaking-change');
  if (bestType === 'security') suggestedLabels.push('security');

  return {
    type: bestType,
    confidence,
    reason: bestScore > 0
      ? `Matched ${bestScore} signal(s) for type "${bestType}"`
      : `Defaulted to "${bestType}" (explicit type or no strong signals)`,
    suggestedPriority,
    suggestedLabels,
  };
}

// ─── Expectation Loading ────────────────────────────────────────────────────

/**
 * Parse expectation files from a directory.
 * Expects .ts/.js files that default-export a LifecycleExpectation or array of them.
 *
 * Note: In Node.js, this uses dynamic import(). In CLI context, expectations
 * are loaded via the config loader.
 */
export async function loadExpectations(dir: string): Promise<LifecycleExpectation[]> {
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const files = await readdir(dir).catch(() => []);
  const expectations: LifecycleExpectation[] = [];

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js') && !file.endsWith('.mjs')) continue;
    if (file.startsWith('_') || file.startsWith('.')) continue;

    try {
      const mod = await import(join(dir, file));
      const exported = mod.default ?? mod;

      if (Array.isArray(exported)) {
        expectations.push(...exported.map(e => defineExpectation(e)));
      } else if (exported && typeof exported === 'object' && exported.id) {
        // Could be a built ExpectationBuilder or a plain object
        if (exported instanceof ExpectationBuilder) {
          expectations.push(exported.build());
        } else {
          expectations.push(defineExpectation(exported));
        }
      }
    } catch {
      // Skip files that can't be loaded (e.g., .d.ts files)
    }
  }

  return expectations;
}
