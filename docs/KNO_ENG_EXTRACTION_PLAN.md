# kno-eng Extraction Plan: Integration into Praxis

**Status**: Planning Phase  
**Created**: 2026-02-01  
**Owner**: Praxis Team

## Executive Summary

This document outlines the plan to refactor `kno-eng` (knowledge engineering tool) into Praxis, preserving its IDE capture/UX value while avoiding duplication of sync functionality that already exists in Praxis via PluresDB.

## Background

### Current State
- **kno-eng**: External knowledge capture and engineering tool with IDE integration
- **Praxis**: Full-stack framework with local-first architecture, PluresDB integration, and visual tooling
- **Overlap**: Both systems have sync capabilities; kno-eng has its own sync while Praxis uses PluresDB + Unum

### Goals
1. **Preserve Value**: Keep the IDE capture and UX features that make kno-eng valuable
2. **Eliminate Duplication**: Remove redundant sync implementation from kno-eng
3. **Leverage Praxis**: Use Praxis's existing local-first + PluresDB architecture
4. **Seamless Integration**: Create natural integration points within praxis-conversations

## Analysis: What kno-eng Provides

### Core Value Propositions (KEEP)

#### 1. IDE Capture/UX Layer
- **In-IDE knowledge capture**: Capture thoughts, decisions, and context without leaving the IDE
- **Contextual annotations**: Link knowledge to specific code locations
- **Quick capture workflows**: Minimal friction for developers to record insights
- **Search and retrieval**: Fast access to previously captured knowledge
- **Visual organization**: Graph-based or hierarchical knowledge organization

**Decision**: KEEP - This is unique value that Praxis doesn't currently provide

#### 2. Knowledge Engineering Features
- **Structured knowledge templates**: Templates for different knowledge types (decisions, patterns, bugs, etc.)
- **Tagging and categorization**: Flexible taxonomy for organizing knowledge
- **Relationship mapping**: Connect related pieces of knowledge
- **Export capabilities**: Extract knowledge in various formats

**Decision**: KEEP - Integrate into Praxis schema system

#### 3. Developer Experience
- **Minimal context switching**: Stay in the IDE for knowledge capture
- **Keyboard-driven workflows**: Fast, developer-friendly interactions
- **Smart defaults**: Intelligent suggestions based on context

**Decision**: KEEP - Core UX value

### Redundant Features (CUT)

#### 1. Custom Sync Implementation
- **Local storage layer**: Redundant with PluresDB
- **Sync protocol**: Redundant with Praxis + Unum
- **Conflict resolution**: Already handled by PluresDB CRDTs
- **Offline queue**: PluresDB provides this

**Decision**: CUT - Use Praxis/PluresDB instead

#### 2. Data Persistence
- **Custom database**: Replace with PluresDB collections
- **Schema management**: Use Praxis schema system
- **Migrations**: Use PluresDB migration system

**Decision**: CUT - Use Praxis infrastructure

#### 3. Authentication/Authorization
- If kno-eng has its own auth system, replace with Praxis Cloud GitHub OAuth

**Decision**: CUT - Use Praxis Cloud auth

### Features to Defer (DEFER)

#### 1. Advanced Analytics
- Knowledge graph analytics
- Usage patterns and insights
- AI-powered knowledge suggestions

**Decision**: DEFER - Can be added post-migration

#### 2. Collaboration Features
- Real-time collaborative editing
- Team knowledge spaces
- Permission systems

**Decision**: DEFER - Praxis has basic team support; advanced features can come later

#### 3. External Integrations
- Integrations with external knowledge bases
- API for third-party tools
- Plugin system

**Decision**: DEFER - Focus on core functionality first

## Integration Architecture

### Target: praxis-conversations

Create a new module/package within Praxis for conversation and knowledge management:

```
/praxis
  /src
    /conversations              # NEW: Knowledge capture and conversations
      /capture                  # IDE capture layer from kno-eng
        /vscode                 # VS Code extension
        /jetbrains              # JetBrains plugin (defer)
        /core                   # Core capture logic
      /schema                   # Knowledge schemas
      /components               # UI components for knowledge views
      /rules                    # Logic rules for knowledge processing
```

### Data Model

#### Knowledge Schema (PluresDB Collections)

```typescript
// Core knowledge model
{
  name: 'KnowledgeEntry',
  schema: {
    id: { type: 'uuid', primary: true },
    type: { type: 'string' }, // decision, pattern, note, bug, etc.
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    tags: { type: 'array', items: 'string' },
    
    // Code context
    filePath: { type: 'string' },
    lineNumber: { type: 'number' },
    commitSha: { type: 'string' },
    
    // Metadata
    createdBy: { type: 'string' },
    createdAt: { type: 'datetime' },
    updatedAt: { type: 'datetime' },
    
    // Relationships
    relatedTo: { type: 'array', items: 'string' }, // IDs of related entries
  }
}

// Conversation threads
{
  name: 'ConversationThread',
  schema: {
    id: { type: 'uuid', primary: true },
    topic: { type: 'string', required: true },
    participants: { type: 'array', items: 'string' },
    entries: { type: 'array', items: 'string' }, // KnowledgeEntry IDs
    status: { type: 'string' }, // active, archived, resolved
    createdAt: { type: 'datetime' },
    updatedAt: { type: 'datetime' },
  }
}

// Knowledge relationships
{
  name: 'KnowledgeLink',
  schema: {
    id: { type: 'uuid', primary: true },
    fromId: { type: 'string', required: true },
    toId: { type: 'string', required: true },
    type: { type: 'string' }, // relates-to, depends-on, implements, etc.
    strength: { type: 'number', default: 1.0 },
  }
}
```

### Integration Points

#### 1. IDE Extension Layer (VS Code)

**Location**: `/src/conversations/capture/vscode/`

**Functionality**:
- Command palette integration for quick capture
- Code context extraction (file, line, git info)
- Inline annotations and code lenses
- Search and navigation
- Sync via Praxis PluresDB adapter

**Architecture**:
```typescript
// VS Code Extension
import { createPraxisLocalFirst } from '@plures/praxis';
import { KnowledgeCaptureEngine } from '@plures/praxis/conversations';

export async function activate(context: vscode.ExtensionContext) {
  // Initialize Praxis with PluresDB
  const db = await createPraxisLocalFirst({ 
    mode: 'auto',
    dbName: 'praxis-knowledge' 
  });
  
  // Initialize knowledge capture engine
  const captureEngine = new KnowledgeCaptureEngine({
    db,
    workspace: vscode.workspace.rootPath,
  });
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('praxis.captureKnowledge', async () => {
      // Capture current context
      const editor = vscode.window.activeTextEditor;
      await captureEngine.capture({
        content: await vscode.window.showInputBox(),
        context: {
          filePath: editor?.document.fileName,
          lineNumber: editor?.selection.active.line,
          // ... more context
        }
      });
    })
  );
}
```

#### 2. Praxis Logic Engine Integration

**Location**: `/src/conversations/rules/`

**Functionality**:
- Auto-tagging based on content
- Smart linking of related knowledge
- Notification rules (e.g., unresolved decisions)
- Knowledge graph computations

**Example Rules**:
```typescript
import { defineRule, defineFact } from '@plures/praxis';

const KnowledgeCaptured = defineFact<'KnowledgeCaptured', {
  entry: KnowledgeEntry;
}>('KnowledgeCaptured');

const autoTagRule = defineRule({
  id: 'knowledge.auto-tag',
  description: 'Automatically tag knowledge entries',
  impl: (state, events) => {
    const captured = events.find(KnowledgeCaptured.is);
    if (!captured) return [];
    
    const entry = captured.payload.entry;
    const tags = extractTags(entry.content);
    
    return [
      EntryTagged.create({ 
        entryId: entry.id, 
        tags 
      })
    ];
  }
});
```

#### 3. UI Components (Svelte)

**Location**: `/src/conversations/components/`

**Components**:
- `KnowledgeEntryEditor.svelte`: Create/edit knowledge entries
- `KnowledgeGraph.svelte`: Visual graph of knowledge relationships
- `ConversationThread.svelte`: Thread view for discussions
- `KnowledgeSearch.svelte`: Search interface
- `QuickCapture.svelte`: Minimal capture form

**Integration with Praxis Component System**:
```typescript
// Use Praxis component generation
const knowledgeComponents = generateComponents({
  schema: knowledgeSchema,
  target: 'svelte5',
  theme: 'praxis-default'
});
```

#### 4. PluresDB Sync Integration

**Location**: `/src/conversations/sync/`

**Functionality**:
- Leverage existing PluresDB sync
- Team knowledge sharing
- Cloud backup via Praxis Cloud

**Configuration**:
```typescript
import { createPluresDBAdapter } from '@plures/praxis';

const pluresAdapter = createPluresDBAdapter({
  db,
  collections: ['KnowledgeEntry', 'ConversationThread', 'KnowledgeLink'],
  sync: {
    enabled: true,
    endpoint: process.env.PRAXIS_CLOUD_URL,
    autoSync: true,
  }
});
```

#### 5. CLI Integration

**Location**: `/src/cli/commands/knowledge.ts`

**Commands**:
```bash
# Capture knowledge from CLI
praxis knowledge capture "Important decision about architecture"

# Search knowledge
praxis knowledge search "authentication"

# Export knowledge
praxis knowledge export --format markdown --output ./docs/decisions/

# Start knowledge server (for IDE extensions)
praxis knowledge serve --port 3000
```

## Migration Strategy

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create `/src/conversations` module structure
- [ ] Define PluresDB schemas for knowledge data
- [ ] Implement core capture logic (without IDE integration)
- [ ] Create basic Praxis rules for knowledge processing
- [ ] Add CLI commands for knowledge management

### Phase 2: IDE Integration (Week 3-4)
- [ ] Port VS Code extension from kno-eng
- [ ] Replace kno-eng sync with PluresDB calls
- [ ] Update extension to use Praxis schema
- [ ] Test local-first functionality
- [ ] Add code lens and inline annotations

### Phase 3: UI Components (Week 5-6)
- [ ] Generate Svelte components from schema
- [ ] Create knowledge graph visualization
- [ ] Build conversation thread UI
- [ ] Implement search interface
- [ ] Add quick capture modal

### Phase 4: Sync & Collaboration (Week 7-8)
- [ ] Integrate with Praxis Cloud
- [ ] Enable team knowledge sharing
- [ ] Test conflict resolution
- [ ] Add usage analytics
- [ ] Performance optimization

### Phase 5: Polish & Documentation (Week 9-10)
- [ ] User documentation
- [ ] Migration guide for existing kno-eng users
- [ ] Example knowledge bases
- [ ] Performance benchmarks
- [ ] Security audit

## Technical Decisions

### Decision 1: Storage Layer
**Choice**: PluresDB  
**Rationale**: Already integrated, local-first, CRDT-based, proven sync
**Tradeoff**: Slight learning curve for kno-eng users, but better long-term

### Decision 2: UI Framework
**Choice**: Svelte 5  
**Rationale**: Praxis standard, component generation support
**Tradeoff**: Need to port any existing UI

### Decision 3: IDE Support Priority
**Choice**: VS Code first, JetBrains defer  
**Rationale**: Broader user base, easier integration
**Tradeoff**: JetBrains users wait longer

### Decision 4: Sync Protocol
**Choice**: PluresDB + Unum (not custom)  
**Rationale**: Don't reinvent the wheel, proven architecture
**Tradeoff**: Less control over sync details

### Decision 5: Module Structure
**Choice**: `/src/conversations` within praxis core  
**Rationale**: First-class feature, not a separate package
**Tradeoff**: Increases praxis bundle size slightly

## Success Metrics

### Functional
- [ ] Can capture knowledge from VS Code
- [ ] Knowledge persists locally via PluresDB
- [ ] Knowledge syncs across devices
- [ ] Search returns relevant results < 100ms
- [ ] No data loss during offline->online transitions

### Performance
- [ ] Capture latency < 50ms
- [ ] Search results < 100ms for 10k entries
- [ ] Sync < 1s for typical knowledge base
- [ ] VS Code extension bundle < 500KB

### UX
- [ ] < 3 clicks to capture knowledge
- [ ] Zero config for local-first usage
- [ ] < 5 min setup for cloud sync
- [ ] Keyboard shortcuts for all common actions

## Open Questions

1. **Namespace**: Should it be `@plures/praxis/conversations` or `@plures/praxis-conversations`?
   - **Recommendation**: `/conversations` subpath export for now, can extract later if needed

2. **Knowledge Graph UI**: Use existing library (e.g., react-flow) or build custom?
   - **Recommendation**: Start with existing library (adapt to Svelte), optimize later

3. **Migration Tool**: How do existing kno-eng users migrate their data?
   - **Recommendation**: Build a CLI migration tool: `praxis knowledge migrate --from kno-eng`

4. **Pricing**: Should knowledge features be free or part of paid tiers?
   - **Recommendation**: Free for local-only, cloud sync requires Praxis Cloud subscription

5. **Conversation Features**: Full chat-like interface or simple threaded comments?
   - **Recommendation**: Start simple (threaded comments), add chat features if needed

## Resources Required

### Development
- 1 full-stack developer (10 weeks)
- 1 VS Code extension developer (4 weeks)
- 1 UX designer (2 weeks, part-time)

### Testing
- 10 beta users from kno-eng community
- 2 weeks testing period

### Documentation
- User guide (20 pages)
- Migration guide (10 pages)
- API documentation (generated)
- Video tutorials (3x 5min videos)

## Risks & Mitigation

### Risk 1: Feature Parity
**Risk**: Missing features that kno-eng users depend on  
**Mitigation**: Survey existing users, beta program, phased rollout

### Risk 2: Performance
**Risk**: PluresDB overhead vs. custom solution  
**Mitigation**: Benchmark early, optimize indexes, consider caching

### Risk 3: Adoption
**Risk**: Existing kno-eng users resist migration  
**Mitigation**: Migration tool, maintain kno-eng for 6 months, clear benefits communication

### Risk 4: Scope Creep
**Risk**: Adding too many new features during migration  
**Mitigation**: Strict phase gates, defer non-essential features

## Next Steps

1. **Approval**: Get stakeholder sign-off on this plan
2. **Prototyping**: Build Phase 1 prototype (1 week)
3. **Beta Recruitment**: Recruit 10 beta testers from kno-eng community
4. **Kickoff**: Start Phase 1 development
5. **Weekly Reviews**: Track progress against milestones

## Appendix A: Praxis Integration Points Summary

| Feature | Integration Point | Status |
|---------|------------------|--------|
| Knowledge Storage | PluresDB collections | Plan complete |
| Sync | PluresDB + Unum | Plan complete |
| UI Components | Svelte 5 components | Plan complete |
| Logic Rules | Praxis logic engine | Plan complete |
| CLI | Praxis CLI commands | Plan complete |
| Auth | Praxis Cloud OAuth | Plan complete |
| IDE Extension | VS Code extension | Plan complete |
| Documentation | State-Docs | Planned |
| Visual Editing | CodeCanvas | Deferred |

## Appendix B: File Structure

```
/praxis
  /src
    /conversations/
      /core/
        index.ts              # Main entry point
        engine.ts             # KnowledgeCaptureEngine
        types.ts              # TypeScript types
      /capture/
        /vscode/
          extension.ts        # VS Code extension entry
          commands.ts         # Command implementations
          provider.ts         # Code lens provider
        /core/
          capturer.ts         # Core capture logic
          context.ts          # Context extraction
      /schema/
        knowledge.schema.ts   # PluresDB schema definitions
        contracts.ts          # Decision ledger contracts
      /components/
        KnowledgeEntry.svelte
        KnowledgeGraph.svelte
        ConversationThread.svelte
        QuickCapture.svelte
      /rules/
        auto-tag.ts           # Auto-tagging rule
        link-detection.ts     # Smart linking rule
        notifications.ts      # Notification rules
      /cli/
        capture.ts            # CLI capture command
        search.ts             # CLI search command
        export.ts             # CLI export command
      /sync/
        adapter.ts            # PluresDB adapter config
        
  /docs
    /conversations/
      README.md               # Overview
      GETTING_STARTED.md      # Quick start
      MIGRATION.md            # Migration from kno-eng
      ARCHITECTURE.md         # Architecture details
      
  /examples
    /knowledge-capture/
      README.md
      src/
        basic-example.ts
        vscode-integration.ts
```

## Appendix C: Example API Usage

```typescript
import { 
  KnowledgeCaptureEngine, 
  createKnowledgeDB 
} from '@plures/praxis/conversations';

// Initialize
const db = await createKnowledgeDB({ mode: 'auto' });
const engine = new KnowledgeCaptureEngine({ db });

// Capture knowledge
const entry = await engine.capture({
  type: 'decision',
  title: 'Use PluresDB for storage',
  content: 'We decided to use PluresDB because...',
  tags: ['architecture', 'storage'],
  context: {
    filePath: '/src/db.ts',
    lineNumber: 42,
  }
});

// Search
const results = await engine.search('PluresDB');

// Create conversation thread
const thread = await engine.createThread({
  topic: 'Storage architecture discussion',
  entries: [entry.id],
});

// Link related knowledge
await engine.link(entry.id, relatedEntryId, 'implements');
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-01  
**Next Review**: After Phase 1 completion
