/**
 * Praxis Reactive Logic Engine
 * 
 * A minimal TypeScript implementation of the Praxis Logic Engine.
 * This variant avoids Svelte-specific reactivity primitives to remain framework-agnostic.
 */

export interface ReactiveEngineOptions<TContext> {
    initialContext: TContext;
    initialFacts?: any[];
    initialMeta?: Record<string, unknown>;
}

export class ReactiveLogicEngine<TContext extends object> {
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
    get context() {
        return this.state.context;
    }

    /**
     * Access the facts list.
     */
    get facts() {
        return this.state.facts;
    }

    /**
     * Apply a mutation to the state.
     * This is the "Action" or "Rule" equivalent.
     * 
     * @param mutator A function that receives the state and modifies it.
     */
    apply(mutator: (state: { context: TContext; facts: any[]; meta: Record<string, unknown> }) => void) {
        mutator(this.state);
    }

    /**
     * Access the metadata.
     */
    get meta() {
        return this.state.meta;
    }
}
