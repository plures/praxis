/**
 * Praxis Reactive Logic Engine
 * 
 * A Svelte 5 native implementation of the Praxis Logic Engine.
 * Uses Runes ($state, $derived, $effect) for fine-grained reactivity.
 */

console.log("Reactive Engine Loaded");

export interface ReactiveEngineOptions<TContext> {
    initialContext: TContext;
    initialFacts?: any[];
    initialMeta?: Record<string, unknown>;
}

export class ReactiveLogicEngine<TContext extends object> {
    // The single source of truth, reactive by default
    // We use $state.raw for things that shouldn't be deeply reactive if needed,
    // but for context we usually want deep reactivity.
    state = $state<{
        context: TContext;
        facts: any[];
        meta: Record<string, unknown>;
    }>({
        context: {} as TContext,
        facts: [],
        meta: {}
    });

    constructor(options: ReactiveEngineOptions<TContext>) {
        this.state.context = options.initialContext;
        this.state.facts = options.initialFacts ?? [];
        this.state.meta = options.initialMeta ?? {};
    }

    /**
     * Access the reactive context directly.
     * Consumers can use this in $derived() or $effect().
     */
    get context() {
        return this.state.context;
    }

    /**
     * Access the reactive facts list.
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
     * Access the reactive meta.
     */
    get meta() {
        return this.state.meta;
    }
}
