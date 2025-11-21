<script lang="ts">
  /**
   * Terminal Canvas Example App
   * 
   * Demonstrates the TerminalNode Svelte component with canvas integration.
   */
  // Import the TerminalNode component directly from the .svelte file
  import TerminalNode from '@plures/praxis/components/TerminalNode.svelte';
  import { createTerminalAdapter } from '@plures/praxis';
  import type { TerminalAdapter } from '@plures/praxis';

  interface TerminalConfig {
    id: string;
    adapter: TerminalAdapter;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  // Create initial terminals
  let terminals: TerminalConfig[] = [
    {
      id: 'terminal-1',
      adapter: createTerminalAdapter({
        nodeId: 'terminal-1',
        props: {
          inputMode: 'text',
          history: [],
          lastOutput: null,
        },
      }),
      x: 50,
      y: 50,
      width: 600,
      height: 400,
    },
    {
      id: 'terminal-2',
      adapter: createTerminalAdapter({
        nodeId: 'terminal-2',
        props: {
          inputMode: 'widget',
          history: [],
          lastOutput: null,
        },
      }),
      x: 700,
      y: 50,
      width: 600,
      height: 400,
    },
  ];

  // Add a new terminal
  function addTerminal() {
    const id = `terminal-${Date.now()}`;
    const newTerminal: TerminalConfig = {
      id,
      adapter: createTerminalAdapter({
        nodeId: id,
        props: {
          inputMode: 'text',
          history: [],
          lastOutput: null,
        },
      }),
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 300,
      width: 600,
      height: 400,
    };
    terminals = [...terminals, newTerminal];
  }

  // Remove a terminal
  function removeTerminal(id: string) {
    terminals = terminals.filter(t => t.id !== id);
  }

  // Clear all terminals
  function clearAll() {
    terminals = [];
  }
</script>

<main>
  <!-- Toolbar -->
  <div class="toolbar">
    <h1>Terminal Canvas Example</h1>
    <div class="toolbar-buttons">
      <button on:click={addTerminal} class="btn btn-primary">
        + Add Terminal
      </button>
      <button on:click={clearAll} class="btn btn-danger" disabled={terminals.length === 0}>
        Clear All
      </button>
      <span class="terminal-count">
        {terminals.length} terminal{terminals.length !== 1 ? 's' : ''}
      </span>
    </div>
  </div>

  <!-- Canvas -->
  <div class="canvas">
    {#if terminals.length === 0}
      <div class="empty-state">
        <h2>No Terminals</h2>
        <p>Click "Add Terminal" to create a new terminal node</p>
      </div>
    {:else}
      {#each terminals as terminal (terminal.id)}
        <TerminalNode
          adapter={terminal.adapter}
          x={terminal.x}
          y={terminal.y}
          width={terminal.width}
          height={terminal.height}
          draggable={true}
          resizable={true}
        />
      {/each}
    {/if}
  </div>

  <!-- Instructions -->
  <div class="instructions">
    <h3>Instructions</h3>
    <ul>
      <li><strong>Drag</strong>: Click and drag the title bar to move terminals</li>
      <li><strong>Resize</strong>: Drag the bottom-right corner to resize</li>
      <li><strong>Context Menu</strong>: Right-click for operations</li>
      <li><strong>Execute</strong>: Type a command and press Enter or click Run</li>
    </ul>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #1a1a1a;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: #2d2d2d;
    border-bottom: 1px solid #3c3c3c;
    color: #d4d4d4;
  }

  .toolbar h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .toolbar-buttons {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-primary {
    background: #007acc;
    color: white;
  }

  .btn-primary:hover {
    background: #005a9e;
  }

  .btn-danger {
    background: #d32f2f;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b71c1c;
  }

  .btn:disabled {
    background: #515151;
    cursor: not-allowed;
    opacity: 0.5;
  }

  .terminal-count {
    font-size: 14px;
    color: #858585;
  }

  .canvas {
    position: relative;
    flex: 1;
    overflow: hidden;
    background: #1a1a1a;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #858585;
  }

  .empty-state h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }

  .empty-state p {
    margin: 0;
    font-size: 16px;
  }

  .instructions {
    padding: 16px 20px;
    background: #2d2d2d;
    border-top: 1px solid #3c3c3c;
    color: #d4d4d4;
  }

  .instructions h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .instructions ul {
    margin: 0;
    padding: 0 0 0 20px;
  }

  .instructions li {
    margin: 4px 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .instructions strong {
    color: #4ec9b0;
  }
</style>
