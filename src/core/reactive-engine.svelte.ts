/**
 * Praxis Reactive Logic Engine
 * 
 * A platform-agnostic implementation of the Praxis Logic Engine.
 * This version maintains the same API as the Svelte implementation but without
 * Svelte-specific dependencies, making it usable in any JavaScript/TypeScript environment.
 */

export interface ReactiveEngineOptions<TContext> {
    initialContext: TContext;
    initialFacts?: any[];
    initialMeta?: Record<string, unknown>;
}

export class ReactiveLogicEngine<TContext extends object> {
    // The single source of truth
    // State is a plain field, accessible for platform-agnostic extensions
    // (e.g., custom reactivity, proxies, etc.)
    state: { context: TContext; facts: any[]; meta: Record<string, unknown> } = {
        context: {} as TContext,
        facts: [],
        meta: {}
    };

    constructor(options: ReactiveEngineOptions<TContext>) {
        this.state.context = options.initialContext;
        this.state.facts = options.initialFacts ?? [];
        this.state.meta = options.initialMeta ?? {};
    }

    /**
     * Access the context directly.
     * Framework-specific wrappers (e.g., Svelte runes) can build on top of this value.
     */
    get context(): TContext {
        return this.state.context;
    }

    /**
     * Access the facts list.
     */
    get facts(): any[] {
        return this.state.facts;
    }

    /**
     * Apply a mutation to the state.
     * This is the "Action" or "Rule" equivalent.
     * 
     * @param mutator A function that receives the state and modifies it.
     */
    apply(mutator: (state: { context: TContext; facts: any[]; meta: Record<string, unknown> }) => void): void {
        mutator(this.state);
    }

    /**
     * Access the metadata.
     */
    get meta(): Record<string, unknown> {
        return this.state.meta;
    }
}
