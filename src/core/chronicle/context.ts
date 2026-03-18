/**
 * Chronicle Context
 *
 * Synchronous causal context propagation for Chronicle span tracking.
 * Equivalent to Rust's `tracing` crate span context, adapted for TypeScript.
 *
 * @example
 * ```typescript
 * // Run code attributed to a specific span/session
 * await ChronicleContext.runAsync(
 *   { spanId: 'route-decision-1', contextId: 'session-abc' },
 *   async () => {
 *     await store.storeFact(fact); // attributed to route-decision-1 / session-abc
 *   }
 * );
 * ```
 */
export interface ChronicleSpan {
  /** The span/operation ID (becomes the `cause` field on Chronicle nodes) */
  spanId?: string;
  /** Session or request ID grouping related spans */
  contextId?: string;
}

/**
 * Stack-based synchronous causal context propagation.
 *
 * Uses a call-stack approach for environments without AsyncLocalStorage.
 * Works correctly for synchronous and sequentially-awaited async code.
 * For concurrent async flows, use `runAsync` per logical operation.
 */
export class ChronicleContext {
  private static readonly _stack: ChronicleSpan[] = [];

  /**
   * Get the current active span, if any.
   */
  static get current(): ChronicleSpan | undefined {
    return this._stack[this._stack.length - 1];
  }

  /**
   * Run a synchronous function within a causal span.
   * The span is automatically popped when the function returns.
   */
  static run<T>(span: ChronicleSpan, fn: () => T): T {
    this._stack.push(span);
    try {
      return fn();
    } finally {
      this._stack.pop();
    }
  }

  /**
   * Run an async function within a causal span.
   * The span is popped after the promise settles.
   */
  static async runAsync<T>(span: ChronicleSpan, fn: () => Promise<T>): Promise<T> {
    this._stack.push(span);
    try {
      return await fn();
    } finally {
      this._stack.pop();
    }
  }

  /**
   * Create a child span that inherits the current contextId.
   *
   * @param spanId ID for the new span
   * @returns A new ChronicleSpan with the current contextId
   */
  static childSpan(spanId: string): ChronicleSpan {
    return {
      spanId,
      contextId: this.current?.contextId,
    };
  }
}
