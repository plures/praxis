---
title: Fix missing explicit type annotations in public API
assignees:
  - copilot
---
There are missing explicit type annotations detected in the public API. Reference: [workflow run](https://github.com/plures/praxis/actions/runs/20536760879/job/58995968915)

Please address the following:

1. In src/core/reactive-engine.ts (line 154), add an explicit return type to the state getter:
```typescript
get state(): { context: TContext; facts: any[]; meta: Record<string, unknown> } {
    return {
        context: this._contextProxy,
        facts: this._factsProxy,
        meta: this._metaProxy,
    };
}
```

2. In src/core/reactive-engine.svelte.ts (line 30), explicitly declare the type of the state property:
```typescript
state: { context: TContext; facts: any[]; meta: Record<string, unknown> } = $state({
    context: {} as TContext,
    facts: [] as any[],
    meta: {} as Record<string, unknown>
});
```
