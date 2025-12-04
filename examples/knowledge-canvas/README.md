# Knowledge Canvas Demo Application

This demo showcases CodeCanvas integration for building a visual knowledge management system with Praxis.

## Features

- ✅ Visual knowledge graph editing
- ✅ Node-based information organization
- ✅ Relationships and connections
- ✅ Schema-driven content types
- ✅ State-Docs integration for documentation
- ✅ Search and navigation
- ✅ Collaborative editing

## Architecture

The application demonstrates:

- **Visual Schema Design**: Define knowledge types in Canvas
- **Generated Components**: Auto-generate UI from knowledge schema
- **Graph Storage**: Store knowledge graph in PluresDB
- **Visual Navigation**: Canvas-based exploration interface

## Key Components

### Knowledge Schema

```typescript
export const knowledgeSchema: PraxisSchema = {
  version: '1.0.0',
  name: 'KnowledgeCanvas',

  models: [
    {
      name: 'KnowledgeNode',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'type', type: 'string' }, // concept, resource, person, project
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'tags', type: { array: 'string' } },
        { name: 'metadata', type: 'object' },
      ],
    },
    {
      name: 'Connection',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'fromId', type: 'string' },
        { name: 'toId', type: 'string' },
        { name: 'type', type: 'string' }, // relates-to, depends-on, part-of
        { name: 'strength', type: 'number' },
      ],
    },
  ],

  components: [
    {
      name: 'NodeEditor',
      type: 'form',
      model: 'KnowledgeNode',
    },
    {
      name: 'GraphView',
      type: 'custom',
      description: 'Visual graph representation',
    },
  ],
};
```

## Canvas Features Demonstrated

### 1. Visual Node Creation

- Drag-and-drop node creation
- Type selection from schema
- Real-time preview

### 2. Connection Management

- Visual relationship creation
- Connection type selection
- Strength indicators

### 3. Schema Evolution

- Modify schema in Canvas
- Regenerate components
- Migrate existing data

### 4. Documentation Integration

- Automatic State-Docs generation
- Living documentation
- Context-aware help

## Running the Demo

```bash
cd examples/knowledge-canvas
npm install

# Start app
npm run dev

# Open Canvas editor
praxis canvas src/schemas/knowledge.schema.ts
```

## Usage Flow

1. **Design Schema**: Open Canvas and define knowledge node types
2. **Generate Components**: Auto-generate forms and views
3. **Add Content**: Create knowledge nodes through UI
4. **Create Connections**: Link related nodes
5. **Explore**: Navigate the knowledge graph visually
6. **Document**: Generate documentation with State-Docs

## Canvas Workflows

### Visual-First

1. Design in Canvas
2. Generate code
3. Customize styling
4. Deploy

### Code-First

1. Define schema in TypeScript
2. Open in Canvas for visualization
3. Make visual adjustments
4. Sync back to code

## Features

- **Visual Design**: All design happens in Canvas
- **Auto-Generation**: Components generated from schema
- **Real-Time Preview**: See changes instantly
- **State-Docs**: Documentation updates automatically
- **Collaboration**: Multiple users can edit simultaneously

## Example Schemas

Pre-configured knowledge types:

- **Concepts**: Ideas and theories
- **Resources**: Articles, books, videos
- **People**: Contributors and experts
- **Projects**: Work and initiatives

## Testing

```bash
npm test
```

## Deployment

```bash
npm run build
```

## Next Steps

- Add AI-powered suggestions
- Implement graph algorithms (centrality, clustering)
- Add export to various formats
- Create templates for common knowledge domains
- Enable real-time collaboration

See the full implementation guide in [docs/examples/knowledge-canvas.md](../../docs/examples/knowledge-canvas.md).
