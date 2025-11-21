# Terminal Canvas Example

This example demonstrates how to use the `TerminalNode` Svelte component with the Praxis terminal adapter in a canvas-based application.

## Overview

This example shows:
- Creating multiple terminal adapters
- Rendering terminal nodes on a canvas
- Drag and drop positioning
- Resizing terminal windows
- Context menu operations
- Command execution and output display

## Structure

```
terminal-canvas/
├── App.svelte          # Main canvas application
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

### Basic Setup

```svelte
<!-- App.svelte -->
<script lang="ts">
  import TerminalNode from '@plures/praxis/components/TerminalNode.svelte';
  import { createTerminalAdapter } from '@plures/praxis';

  const terminal = createTerminalAdapter({
    nodeId: 'main-terminal',
  });
</script>

<div class="canvas">
  <TerminalNode adapter={terminal} x={100} y={100} />
</div>

<style>
  .canvas {
    position: relative;
    width: 100%;
    height: 100vh;
    background: #1a1a1a;
  }
</style>
```

### Multiple Terminals

```svelte
<script lang="ts">
  import TerminalNode from '@plures/praxis/components/TerminalNode.svelte';
  import { createTerminalAdapter } from '@plures/praxis';

  const terminals = [
    {
      id: 'term-1',
      adapter: createTerminalAdapter({ nodeId: 'terminal-1' }),
      x: 50,
      y: 50,
    },
    {
      id: 'term-2',
      adapter: createTerminalAdapter({ nodeId: 'terminal-2' }),
      x: 700,
      y: 50,
    },
    {
      id: 'term-3',
      adapter: createTerminalAdapter({ nodeId: 'terminal-3' }),
      x: 50,
      y: 500,
    },
  ];
</script>

<div class="canvas">
  {#each terminals as terminal (terminal.id)}
    <TerminalNode
      adapter={terminal.adapter}
      x={terminal.x}
      y={terminal.y}
      width={600}
      height={400}
    />
  {/each}
</div>
```

### With State Management

```svelte
<script lang="ts">
  import TerminalNode from '@plures/praxis/components/TerminalNode.svelte';
  import { createTerminalAdapter } from '@plures/praxis';
  import { writable } from 'svelte/store';

  interface TerminalConfig {
    id: string;
    adapter: any;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const terminals = writable<TerminalConfig[]>([]);

  function addTerminal() {
    const id = `terminal-${Date.now()}`;
    terminals.update(t => [
      ...t,
      {
        id,
        adapter: createTerminalAdapter({ nodeId: id }),
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: 600,
        height: 400,
      }
    ]);
  }
</script>

<div class="toolbar">
  <button on:click={addTerminal}>Add Terminal</button>
</div>

<div class="canvas">
  {#each $terminals as terminal (terminal.id)}
    <TerminalNode
      adapter={terminal.adapter}
      x={terminal.x}
      y={terminal.y}
      width={terminal.width}
      height={terminal.height}
    />
  {/each}
</div>
```

## Features Demonstrated

1. **Canvas Layout**: Absolute positioning of terminal nodes
2. **Drag and Drop**: Move terminals around the canvas
3. **Resize**: Adjust terminal dimensions with resize handle
4. **Context Menu**: Right-click for operations (clear, copy)
5. **Command Execution**: Enter and execute commands
6. **History**: Track command history per terminal
7. **Multiple Modes**: Text input and widget input modes

## Integration with RuneBook

This example lays the foundation for RuneBook's reactive canvas where terminal nodes will:
- Execute real commands via RuneBook execution engine
- Sync state with PluresDB
- Connect to other nodes (InputNode, DisplayNode, AgentNode)
- React to upstream data changes
- Provide reactive output to downstream nodes

## Next Steps

To integrate with the full RuneBook ecosystem:

1. Connect to PluresDB for reactive state sync
2. Implement node wiring (connections between nodes)
3. Add InputNode and DisplayNode components
4. Implement real command execution via RuneBook
5. Add AgentNode for AI integration
6. Build the full Tauri shell application

## Requirements

- Svelte 5.0+
- Node.js 18+
- Modern browser

## Development

This example uses Vite + Svelte for development:

```bash
npm create vite@latest . -- --template svelte-ts
npm install @plures/praxis
npm run dev
```

## License

MIT
