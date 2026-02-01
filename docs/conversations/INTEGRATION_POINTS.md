# Integration Points: kno-eng → Praxis Conversations

**Document**: Integration Architecture  
**Date**: 2026-02-01  
**Status**: Planning

## Overview

This document defines the specific integration points for refactoring kno-eng into the Praxis framework as the `conversations` module, ensuring seamless integration with existing Praxis infrastructure.

## Integration Architecture

### High-Level Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                     Praxis Framework                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐          │
│  │   Schema   │  │   Logic    │  │  Component   │          │
│  │   System   │  │   Engine   │  │  Generator   │          │
│  └─────┬──────┘  └─────┬──────┘  └───────┬──────┘          │
│        │               │                  │                 │
│        │               │                  │                 │
│  ┌─────▼───────────────▼──────────────────▼──────┐          │
│  │      Conversations Module (kno-eng)           │          │
│  ├───────────────────────────────────────────────┤          │
│  │  Capture  │  Knowledge  │  Rules  │  Sync    │          │
│  └─────┬─────────────┬────────────┬───────┬──────┘          │
│        │             │            │       │                 │
├────────┼─────────────┼────────────┼───────┼─────────────────┤
│        │             │            │       │                 │
│  ┌─────▼──────┐ ┌────▼─────┐ ┌───▼────┐ ┌▼────────┐       │
│  │ PluresDB   │ │  Unum    │ │ Canvas │ │  Cloud  │       │
│  └────────────┘ └──────────┘ └────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 1. Data Layer Integration (PluresDB)

### 1.1 Schema Definition

**Integration Point**: Praxis Schema System → PluresDB Collections

**Location**: `/src/conversations/schema/knowledge.schema.ts`

**Purpose**: Define data models for knowledge entries, threads, and relationships using Praxis schema format.

**Implementation**:

```typescript
// /src/conversations/schema/knowledge.schema.ts
import { definePraxisSchema } from '@plures/praxis/schema';

export const conversationsSchema = definePraxisSchema({
  version: '1.0.0',
  name: 'praxis-conversations',
  
  models: [
    {
      name: 'KnowledgeEntry',
      description: 'Individual knowledge capture entry',
      fields: [
        { name: 'id', type: 'uuid', primary: true },
        { name: 'type', type: 'string', required: true },
        { name: 'title', type: 'string', required: true },
        { name: 'content', type: 'string', required: true },
        { name: 'tags', type: { array: 'string' }, default: [] },
        
        // Code context
        { name: 'filePath', type: 'string', optional: true },
        { name: 'lineNumber', type: 'number', optional: true },
        { name: 'commitSha', type: 'string', optional: true },
        
        // Metadata
        { name: 'createdBy', type: 'string', required: true },
        { name: 'createdAt', type: 'datetime', default: 'now' },
        { name: 'updatedAt', type: 'datetime', default: 'now' },
        
        // Relationships
        { name: 'relatedTo', type: { array: 'string' }, default: [] },
        { name: 'threadId', type: 'string', optional: true },
      ],
      indexes: [
        { fields: ['createdBy'], type: 'standard' },
        { fields: ['createdAt'], sort: 'desc' },
        { fields: ['tags'], type: 'multikey' },
        { fields: ['filePath'], type: 'standard' },
      ],
    },
    
    {
      name: 'ConversationThread',
      description: 'Threaded discussions around knowledge',
      fields: [
        { name: 'id', type: 'uuid', primary: true },
        { name: 'topic', type: 'string', required: true },
        { name: 'participants', type: { array: 'string' }, default: [] },
        { name: 'entries', type: { array: 'string' }, default: [] },
        { name: 'status', type: 'string', default: 'active' },
        { name: 'createdAt', type: 'datetime', default: 'now' },
        { name: 'updatedAt', type: 'datetime', default: 'now' },
      ],
      indexes: [
        { fields: ['status', 'updatedAt'], sort: 'desc' },
      ],
    },
    
    {
      name: 'KnowledgeLink',
      description: 'Relationships between knowledge entries',
      fields: [
        { name: 'id', type: 'uuid', primary: true },
        { name: 'fromId', type: 'string', required: true },
        { name: 'toId', type: 'string', required: true },
        { name: 'type', type: 'string', required: true },
        { name: 'strength', type: 'number', default: 1.0 },
      ],
      indexes: [
        { fields: ['fromId'], type: 'standard' },
        { fields: ['toId'], type: 'standard' },
      ],
    },
  ],
});
```

**Integration Benefits**:
- Leverages PluresDB's local-first storage
- Automatic CRDT conflict resolution
- Reactive queries for UI updates
- Built-in indexing for fast search

### 1.2 Database Initialization

**Integration Point**: PluresDB Adapter → Conversations Engine

**Location**: `/src/conversations/core/db.ts`

**Implementation**:

```typescript
// /src/conversations/core/db.ts
import { createPraxisLocalFirst } from '@plures/praxis';
import { conversationsSchema } from '../schema/knowledge.schema';

export async function createKnowledgeDB(options = {}) {
  const db = await createPraxisLocalFirst({
    mode: options.mode || 'auto',
    dbName: options.dbName || 'praxis-knowledge',
    schema: conversationsSchema,
    sync: options.sync || { enabled: false },
  });
  
  return db;
}
```

## 2. Logic Engine Integration

### 2.1 Facts and Events

**Integration Point**: Praxis Logic Engine → Knowledge Processing

**Location**: `/src/conversations/core/facts.ts`

**Implementation**:

```typescript
// /src/conversations/core/facts.ts
import { defineFact, defineEvent } from '@plures/praxis';

// Facts
export const KnowledgeCaptured = defineFact<'KnowledgeCaptured', {
  entry: KnowledgeEntry;
}>('KnowledgeCaptured');

export const EntryTagged = defineFact<'EntryTagged', {
  entryId: string;
  tags: string[];
}>('EntryTagged');

export const EntriesLinked = defineFact<'EntriesLinked', {
  fromId: string;
  toId: string;
  type: string;
  strength: number;
}>('EntriesLinked');

// Events
export const CaptureKnowledge = defineEvent<'CAPTURE_KNOWLEDGE', {
  type: string;
  title: string;
  content: string;
  context?: CodeContext;
}>('CAPTURE_KNOWLEDGE');

export const SearchKnowledge = defineEvent<'SEARCH_KNOWLEDGE', {
  query: string;
  filters?: SearchFilters;
}>('SEARCH_KNOWLEDGE');
```

### 2.2 Processing Rules

**Integration Point**: Praxis Rules → Auto-tagging and Linking

**Location**: `/src/conversations/rules/`

**Implementation**:

```typescript
// /src/conversations/rules/auto-tag.ts
import { defineRule } from '@plures/praxis';
import { KnowledgeCaptured, EntryTagged } from '../core/facts';

export const autoTagRule = defineRule({
  id: 'conversations.auto-tag',
  description: 'Automatically extract tags from knowledge content',
  impl: (state, events) => {
    const captured = events.find(KnowledgeCaptured.is);
    if (!captured) return [];
    
    const entry = captured.payload.entry;
    const extractedTags = extractTags(entry.content, entry.title);
    
    return [
      EntryTagged.create({
        entryId: entry.id,
        tags: extractedTags,
      })
    ];
  },
});

// /src/conversations/rules/smart-link.ts
import { defineRule } from '@plures/praxis';
import { KnowledgeCaptured, EntriesLinked } from '../core/facts';

export const smartLinkRule = defineRule({
  id: 'conversations.smart-link',
  description: 'Automatically detect and link related knowledge',
  impl: (state, events) => {
    const captured = events.find(KnowledgeCaptured.is);
    if (!captured) return [];
    
    const entry = captured.payload.entry;
    const existingEntries = state.context.knowledgeEntries || [];
    
    // Find related entries using similarity
    const related = findRelatedEntries(entry, existingEntries);
    
    return related.map(({ id, score }) =>
      EntriesLinked.create({
        fromId: entry.id,
        toId: id,
        type: 'relates-to',
        strength: score,
      })
    );
  },
});
```

### 2.3 Registry Integration

**Integration Point**: Praxis Registry → Conversations Rules

**Location**: `/src/conversations/core/registry.ts`

**Implementation**:

```typescript
// /src/conversations/core/registry.ts
import { PraxisRegistry } from '@plures/praxis';
import { autoTagRule } from '../rules/auto-tag';
import { smartLinkRule } from '../rules/smart-link';

export function createConversationsRegistry(): PraxisRegistry {
  const registry = new PraxisRegistry();
  
  // Register all conversation rules
  registry.registerRule(autoTagRule);
  registry.registerRule(smartLinkRule);
  // ... more rules
  
  return registry;
}
```

## 3. UI Component Integration

### 3.1 Svelte Component Generation

**Integration Point**: Praxis Component Generator → Conversations UI

**Location**: `/src/conversations/components/`

**Implementation**:

```typescript
// Generate components from schema
import { generateComponents } from '@plures/praxis/component';
import { conversationsSchema } from '../schema/knowledge.schema';

const components = generateComponents({
  schema: conversationsSchema,
  target: 'svelte5',
  theme: 'praxis-default',
});

// Generated components:
// - KnowledgeEntryEditor.svelte
// - ConversationThreadView.svelte
// - KnowledgeSearchBar.svelte
```

### 3.2 Custom Components

**Location**: `/src/conversations/components/`

**Custom Components** (not auto-generated):

```svelte
<!-- /src/conversations/components/QuickCapture.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { KnowledgeCaptureEngine } from '../core/engine';
  
  export let engine: KnowledgeCaptureEngine;
  
  let title = '';
  let content = '';
  let type = 'note';
  
  const dispatch = createEventDispatcher();
  
  async function capture() {
    const entry = await engine.capture({
      type,
      title,
      content,
      context: await extractCurrentContext(),
    });
    
    dispatch('captured', entry);
    // Reset form
    title = '';
    content = '';
  }
</script>

<div class="quick-capture">
  <select bind:value={type}>
    <option value="note">Note</option>
    <option value="decision">Decision</option>
    <option value="pattern">Pattern</option>
    <option value="bug">Bug</option>
  </select>
  
  <input 
    bind:value={title} 
    placeholder="Title..."
  />
  
  <textarea 
    bind:value={content} 
    placeholder="Capture your thoughts..."
  />
  
  <button on:click={capture}>Capture</button>
</div>
```

## 4. CLI Integration

### 4.1 Command Registration

**Integration Point**: Praxis CLI → Knowledge Commands

**Location**: `/src/cli/commands/knowledge.ts`

**Implementation**:

```typescript
// /src/cli/commands/knowledge.ts
import { Command } from 'commander';
import { createKnowledgeDB, KnowledgeCaptureEngine } from '../../conversations';

export function registerKnowledgeCommands(program: Command) {
  const knowledge = program
    .command('knowledge')
    .description('Knowledge capture and management');
  
  knowledge
    .command('capture <content>')
    .option('-t, --title <title>', 'Entry title')
    .option('--type <type>', 'Entry type (note, decision, pattern, bug)', 'note')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async (content, options) => {
      const db = await createKnowledgeDB();
      const engine = new KnowledgeCaptureEngine({ db });
      
      const entry = await engine.capture({
        type: options.type,
        title: options.title || content.substring(0, 50),
        content,
        tags: options.tags ? options.tags.split(',') : [],
      });
      
      console.log(`Captured: ${entry.id}`);
    });
  
  knowledge
    .command('search <query>')
    .option('--type <type>', 'Filter by type')
    .option('--tags <tags>', 'Filter by tags')
    .action(async (query, options) => {
      const db = await createKnowledgeDB();
      const engine = new KnowledgeCaptureEngine({ db });
      
      const results = await engine.search(query, {
        type: options.type,
        tags: options.tags ? options.tags.split(',') : undefined,
      });
      
      console.log(`Found ${results.length} entries:`);
      results.forEach(r => console.log(`  ${r.title} (${r.type})`));
    });
  
  knowledge
    .command('export')
    .option('-f, --format <format>', 'Export format (json, markdown, html)', 'json')
    .option('-o, --output <path>', 'Output path')
    .action(async (options) => {
      const db = await createKnowledgeDB();
      const engine = new KnowledgeCaptureEngine({ db });
      
      await engine.export({
        format: options.format,
        outputPath: options.output,
      });
      
      console.log(`Exported to ${options.output}`);
    });
}
```

### 4.2 CLI Entry Point

**Integration Point**: Main CLI → Knowledge Commands

**Location**: `/src/cli/index.ts`

**Implementation**:

```typescript
// /src/cli/index.ts
import { Command } from 'commander';
import { registerKnowledgeCommands } from './commands/knowledge';

const program = new Command();

// ... existing commands

// Register knowledge commands
registerKnowledgeCommands(program);

program.parse();
```

## 5. Sync Integration

### 5.1 PluresDB Sync Configuration

**Integration Point**: PluresDB Sync → Praxis Cloud

**Location**: `/src/conversations/sync/adapter.ts`

**Implementation**:

```typescript
// /src/conversations/sync/adapter.ts
import { createPluresDBAdapter } from '@plures/praxis/adapters';

export async function createConversationsSyncAdapter(db, options = {}) {
  return createPluresDBAdapter({
    db,
    collections: ['KnowledgeEntry', 'ConversationThread', 'KnowledgeLink'],
    sync: {
      enabled: options.enabled !== false,
      endpoint: options.endpoint || process.env.PRAXIS_CLOUD_URL,
      authToken: options.authToken || process.env.PRAXIS_AUTH_TOKEN,
      autoSync: options.autoSync !== false,
      syncInterval: options.syncInterval || 5000,
    },
  });
}
```

### 5.2 Conflict Resolution

**Integration Point**: PluresDB CRDT → Knowledge Merging

**Implementation**:

```typescript
// Use PluresDB's built-in CRDT resolution
// No custom code needed - PluresDB handles it automatically

// For custom merge logic (if needed):
const db = await createKnowledgeDB({
  sync: {
    conflictResolution: 'custom',
    resolveConflict: (local, remote, base) => {
      // Custom merge logic for knowledge entries
      return {
        ...base,
        ...remote,
        ...local,
        // Merge tags (union)
        tags: [...new Set([...local.tags, ...remote.tags])],
        // Merge relatedTo (union)
        relatedTo: [...new Set([...local.relatedTo, ...remote.relatedTo])],
        mergedAt: new Date(),
      };
    },
  },
});
```

## 6. IDE Extension Integration

### 6.1 VS Code Extension Architecture

**Integration Point**: VS Code Extension API → Praxis Conversations Engine

**Location**: `/extensions/vscode/`

**Implementation**:

```typescript
// /extensions/vscode/src/extension.ts
import * as vscode from 'vscode';
import { createKnowledgeDB, KnowledgeCaptureEngine } from '@plures/praxis/conversations';

let engine: KnowledgeCaptureEngine;

export async function activate(context: vscode.ExtensionContext) {
  // Initialize Praxis knowledge database
  const db = await createKnowledgeDB({
    mode: 'auto',
    dbName: 'vscode-praxis-knowledge',
  });
  
  engine = new KnowledgeCaptureEngine({ db });
  
  // Register command: Quick Capture
  const captureCommand = vscode.commands.registerCommand(
    'praxis.captureKnowledge',
    async () => {
      const editor = vscode.window.activeTextEditor;
      
      const title = await vscode.window.showInputBox({
        prompt: 'Knowledge entry title',
        placeHolder: 'Enter a title...',
      });
      
      if (!title) return;
      
      const content = await vscode.window.showInputBox({
        prompt: 'Content',
        placeHolder: 'Capture your thoughts...',
      });
      
      if (!content) return;
      
      const entry = await engine.capture({
        type: 'note',
        title,
        content,
        context: editor ? {
          filePath: editor.document.fileName,
          lineNumber: editor.selection.active.line + 1,
          selectedCode: editor.document.getText(editor.selection),
        } : undefined,
      });
      
      vscode.window.showInformationMessage(`Captured: ${entry.title}`);
    }
  );
  
  // Register command: Search
  const searchCommand = vscode.commands.registerCommand(
    'praxis.searchKnowledge',
    async () => {
      const query = await vscode.window.showInputBox({
        prompt: 'Search knowledge',
        placeHolder: 'Enter search query...',
      });
      
      if (!query) return;
      
      const results = await engine.search(query);
      
      // Show results in Quick Pick
      const selected = await vscode.window.showQuickPick(
        results.map(r => ({
          label: r.title,
          description: r.type,
          detail: r.content.substring(0, 100),
          entry: r,
        })),
        { placeHolder: `Found ${results.length} entries` }
      );
      
      if (selected) {
        // Open entry editor or navigate to code location
        if (selected.entry.context?.filePath) {
          const doc = await vscode.workspace.openTextDocument(
            selected.entry.context.filePath
          );
          const editor = await vscode.window.showTextDocument(doc);
          if (selected.entry.context.lineNumber) {
            const line = selected.entry.context.lineNumber - 1;
            editor.selection = new vscode.Selection(line, 0, line, 0);
            editor.revealRange(new vscode.Range(line, 0, line, 0));
          }
        }
      }
    }
  );
  
  context.subscriptions.push(captureCommand, searchCommand);
}
```

## 7. Testing Integration

### 7.1 Test Infrastructure

**Integration Point**: Praxis Test Utils → Conversations Tests

**Location**: `/src/conversations/__tests__/`

**Implementation**:

```typescript
// /src/conversations/__tests__/capture.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createKnowledgeDB, KnowledgeCaptureEngine } from '../core';

describe('KnowledgeCaptureEngine', () => {
  let db;
  let engine;
  
  beforeEach(async () => {
    db = await createKnowledgeDB({ mode: 'memory' }); // In-memory for tests
    engine = new KnowledgeCaptureEngine({ db });
  });
  
  it('should capture knowledge with context', async () => {
    const entry = await engine.capture({
      type: 'decision',
      title: 'Test decision',
      content: 'Test content',
      context: {
        filePath: '/test.ts',
        lineNumber: 42,
      },
    });
    
    expect(entry.id).toBeDefined();
    expect(entry.title).toBe('Test decision');
    expect(entry.context.filePath).toBe('/test.ts');
  });
  
  it('should search knowledge by content', async () => {
    await engine.capture({
      type: 'note',
      title: 'React patterns',
      content: 'Using hooks for state management',
    });
    
    const results = await engine.search('hooks');
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React patterns');
  });
});
```

## Summary: Integration Points

| Component | Integration Point | Location | Status |
|-----------|------------------|----------|--------|
| Data Storage | PluresDB collections | `/src/conversations/schema/` | Planned |
| Logic Processing | Praxis rules & events | `/src/conversations/rules/` | Planned |
| UI Components | Svelte 5 components | `/src/conversations/components/` | Planned |
| CLI Commands | Praxis CLI | `/src/cli/commands/knowledge.ts` | Planned |
| Sync | PluresDB + Praxis Cloud | `/src/conversations/sync/` | Planned |
| IDE Extension | VS Code extension | `/extensions/vscode/` | Planned |
| Testing | Vitest tests | `/src/conversations/__tests__/` | Planned |

## Next Steps

1. **Phase 1**: Implement data layer (PluresDB schemas)
2. **Phase 2**: Implement logic layer (rules and events)
3. **Phase 3**: Implement CLI commands
4. **Phase 4**: Build VS Code extension
5. **Phase 5**: Generate UI components
6. **Phase 6**: Integration testing

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-01  
**Review Status**: Pending stakeholder approval
