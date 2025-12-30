# Unified Praxis Application Example

This example demonstrates all Praxis ecosystem integrations working together:

- **Logic Engine**: Facts, events, and rules for application logic
- **PluresDB**: Local-first persistence and event sourcing
- **Unum**: Distributed communication and identity management
- **State-Docs**: Auto-generated documentation
- **CodeCanvas**: Visual schema representation

## Quick Start

```bash
# Run the example
node index.js

# Generate documentation
npm run docs

# Export canvas visualization
npm run canvas:export
```

## What This Example Shows

### 1. Unified Application Setup

The example uses `createUnifiedApp()` to set up all integrations in a single call:

```typescript
const app = await createUnifiedApp({
  registry,
  initialContext: { count: 0, messages: [] },
  enableUnum: true,
  unumIdentity: { name: 'node-1' },
  enableDocs: true,
  docsConfig: { projectTitle: 'Unified App' },
  schema: mySchema,
});
```

### 2. Local-First Persistence

All events and facts are automatically persisted to PluresDB:

```typescript
// Events are persisted automatically
app.engine.step([Increment.create({ amount: 1 })]);

// Facts are stored in PluresDB
const facts = await app.pluresdb.loadEvents({ tag: 'INCREMENT' });
```

### 3. Distributed Communication

Events can be broadcast to other nodes via Unum channels:

```typescript
// Broadcast to connected nodes
if (app.channel && app.unum) {
  await app.unum.broadcastEvent(app.channel.id, myEvent);
}

// Subscribe to events from other nodes
app.unum?.subscribeToEvents(app.channel!.id, (event) => {
  app.engine.step([event]);
});
```

### 4. Auto-Generated Documentation

Documentation is generated from your schemas and registry:

```typescript
// Generate docs programmatically
const docs = app.generateDocs?.();

// Or use the CLI
// npx praxis docs schema.yaml --output ./docs
```

### 5. Visual Schema Export

Schemas can be exported to visual formats:

```typescript
// Canvas document with visual representation
const canvas = app.canvas;

// Export to Mermaid diagram
const mermaid = canvasToMermaid(canvas);

// Or use the CLI
// npx praxis canvas schema.yaml --export mermaid
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         Praxis Logic Engine                 │
│  (Facts, Events, Rules, Constraints)        │
└──────────────┬──────────────────────────────┘
               │
               ├─► PluresDB (Persistence)
               │   - Event sourcing
               │   - Reactive queries
               │   - Schema storage
               │
               ├─► Unum (Distribution)
               │   - Identity management
               │   - Channel communication
               │   - Event broadcasting
               │
               ├─► State-Docs (Documentation)
               │   - Markdown generation
               │   - Mermaid diagrams
               │   - API reference
               │
               └─► CodeCanvas (Visualization)
                   - Visual schema editor
                   - FSM diagrams
                   - Canvas export
```

## Integration Benefits

1. **Single Source of Truth**: Define your schema once, use everywhere
2. **Automatic Persistence**: No manual database code
3. **Built-in Distribution**: Collaborate across nodes with minimal code
4. **Living Documentation**: Always up-to-date with your code
5. **Visual Design**: See and edit your architecture visually

## Learn More

- [PluresDB Integration](../../src/integrations/pluresdb.ts)
- [Unum Integration](../../src/integrations/unum.ts)
- [State-Docs Integration](../../src/integrations/state-docs.ts)
- [CodeCanvas Integration](../../src/integrations/code-canvas.ts)
- [Unified Helpers](../../src/integrations/unified.ts)
