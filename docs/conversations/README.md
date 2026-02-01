# Praxis Conversations Module

**Status**: Planning  
**Target Version**: Praxis 2.0  
**Module Path**: `@plures/praxis/conversations`

## Overview

The Conversations module brings knowledge capture and engineering capabilities into Praxis, enabling developers to capture insights, decisions, and context directly from their IDE without leaving their workflow.

## Key Features

### ✅ Planned Features

#### IDE Capture
- **In-IDE knowledge capture**: Capture thoughts and decisions without context switching
- **Code-aware**: Automatically capture file paths, line numbers, and git context
- **Quick access**: Keyboard shortcuts and command palette integration
- **Contextual linking**: Link knowledge to specific code locations

#### Knowledge Management
- **Structured templates**: Pre-defined templates for decisions, patterns, notes, bugs
- **Flexible organization**: Tags, categories, and custom taxonomies
- **Relationship mapping**: Connect related pieces of knowledge
- **Visual graph**: See how knowledge pieces relate to each other

#### Local-First Architecture
- **Offline-capable**: Full functionality without internet connection
- **PluresDB storage**: Leverages Praxis's proven local-first datastore
- **Automatic sync**: Cloud sync when connected (via Praxis Cloud)
- **Conflict-free**: CRDT-based resolution for concurrent edits

#### Search & Discovery
- **Fast full-text search**: Find knowledge quickly
- **Filter by type, tags, date**: Precise filtering
- **Code context search**: Find by file or line number
- **Graph navigation**: Explore related knowledge

## Documentation

- [Extraction Plan](../KNO_ENG_EXTRACTION_PLAN.md) - Detailed refactoring plan from kno-eng
- [Integration Points](#integration-points) - How it fits into Praxis
- [API Preview](#api-preview) - Planned API design
- [Migration Guide](#migration-from-kno-eng) - For existing kno-eng users

## Integration Points

### 1. PluresDB Storage
All knowledge data is stored in PluresDB collections, leveraging existing local-first infrastructure.

### 2. Praxis Logic Engine
Knowledge processing rules (auto-tagging, smart linking) run as Praxis rules.

### 3. Svelte Components
UI components generated using Praxis component system.

### 4. Praxis Cloud
Optional cloud sync via existing Praxis Cloud infrastructure.

### 5. CLI Integration
Knowledge management commands integrated into Praxis CLI.

## API Preview

> **Note**: This module is in planning phase. The following is a preview of the intended API.

### Basic Usage

```typescript
import { 
  createKnowledgeDB,
  KnowledgeCaptureEngine 
} from '@plures/praxis/conversations';

// Initialize
const db = await createKnowledgeDB({ mode: 'auto' });
const engine = new KnowledgeCaptureEngine({ db });

// Capture
const entry = await engine.capture({
  type: 'decision',
  title: 'Use PluresDB for storage',
  content: 'Detailed reasoning...',
  tags: ['architecture', 'storage'],
  context: {
    filePath: '/src/db.ts',
    lineNumber: 42,
  }
});

// Search
const results = await engine.search('PluresDB');
```

### CLI Commands

```bash
praxis knowledge capture "My decision"
praxis knowledge search "architecture"
praxis knowledge export --format markdown
```

## Migration from kno-eng

### Migration Tool

```bash
# Run migration
praxis knowledge migrate --from kno-eng --source ~/.kno-eng/data

# Verify migration
praxis knowledge verify
```

### Compatibility Layer

```typescript
import { knoEngCompat } from '@plures/praxis/conversations/compat';

const engine = new KnowledgeCaptureEngine({ db });
const kno = knoEngCompat(engine);  // kno-eng compatible API
```

## Roadmap

### Phase 1: Foundation (v2.0) - Q2 2026
- [x] Planning complete
- [ ] Core infrastructure
- [ ] PluresDB schemas
- [ ] Basic CLI commands

### Phase 2: IDE Integration (v2.1) - Q3 2026
- [ ] VS Code extension
- [ ] Code context extraction
- [ ] Quick capture UI

### Phase 3: UI & Components (v2.2) - Q4 2026
- [ ] Svelte components
- [ ] Knowledge graph visualization
- [ ] Search interface

### Phase 4: Sync & Collaboration (v2.3) - Q1 2027
- [ ] Praxis Cloud integration
- [ ] Team knowledge sharing
- [ ] Conflict resolution

### Phase 5: Advanced Features (v2.4+) - Q2 2027+
- [ ] AI-powered suggestions
- [ ] Graph analytics
- [ ] JetBrains IDE support

## Contributing

1. Read the [Extraction Plan](../KNO_ENG_EXTRACTION_PLAN.md)
2. Check [open issues](https://github.com/plures/praxis/issues?q=label%3Aconversations)
3. Join the discussion in [GitHub Discussions](https://github.com/plures/praxis/discussions)

## Resources

- [Extraction Plan](../KNO_ENG_EXTRACTION_PLAN.md) - Detailed refactoring plan
- [PluresDB Integration](../core/pluresdb-integration.md) - Local-first storage
- [Praxis Framework](../../FRAMEWORK.md) - Overall architecture

---

**Last Updated**: 2026-02-01  
**Module Status**: Planning  
**Next Milestone**: Phase 1 Kickoff
