<script lang="ts">
  /**
   * CanvasToolbar.svelte
   * 
   * Toolbar component for the Praxis visual schema editor.
   * Provides actions for canvas manipulation and node creation.
   */
  import { createEventDispatcher } from 'svelte';
  import type { CanvasMode } from '../canvas-state.js';

  // Props
  export let mode: CanvasMode = 'select';
  export let zoom: number = 1;
  export let gridVisible: boolean = true;
  export let gridSnap: boolean = true;
  export let canUndo: boolean = false;
  export let canRedo: boolean = false;
  export let selectedCount: number = 0;
  export let readonly: boolean = false;

  const dispatch = createEventDispatcher<{
    modeChange: { mode: CanvasMode };
    zoomIn: void;
    zoomOut: void;
    zoomReset: void;
    zoomFit: void;
    toggleGrid: void;
    toggleSnap: void;
    undo: void;
    redo: void;
    deleteSelected: void;
    addNode: { type: 'fact' | 'event' | 'rule' | 'constraint' | 'model' | 'component' };
    autoLayout: void;
    exportSchema: void;
    save: void;
  }>();

  // Mode options
  const modes: { value: CanvasMode; label: string; icon: string; title: string }[] = [
    { value: 'select', label: 'Select', icon: '🖱️', title: 'Select and move nodes' },
    { value: 'pan', label: 'Pan', icon: '✋', title: 'Pan the canvas' },
    { value: 'connect', label: 'Connect', icon: '🔗', title: 'Create connections between nodes' },
    { value: 'add', label: 'Add', icon: '➕', title: 'Add new nodes' },
  ];

  // Node types for adding
  const nodeTypes: { type: 'fact' | 'event' | 'rule' | 'constraint' | 'model' | 'component'; label: string; icon: string }[] = [
    { type: 'fact', label: 'Fact', icon: '📋' },
    { type: 'event', label: 'Event', icon: '⚡' },
    { type: 'rule', label: 'Rule', icon: '📐' },
    { type: 'constraint', label: 'Constraint', icon: '🔒' },
    { type: 'model', label: 'Model', icon: '📦' },
    { type: 'component', label: 'Component', icon: '🧩' },
  ];

  let showAddMenu = false;

  function setMode(newMode: CanvasMode) {
    dispatch('modeChange', { mode: newMode });
    showAddMenu = newMode === 'add';
  }

  function handleAddNode(type: 'fact' | 'event' | 'rule' | 'constraint' | 'model' | 'component') {
    dispatch('addNode', { type });
    showAddMenu = false;
  }
</script>

<div class="canvas-toolbar">
  <!-- Mode buttons -->
  <div class="toolbar-group">
    {#each modes as modeOption}
      <button
        class="toolbar-btn"
        class:active={mode === modeOption.value}
        title={modeOption.title}
        on:click={() => setMode(modeOption.value)}
        disabled={readonly && modeOption.value !== 'select' && modeOption.value !== 'pan'}
      >
        <span class="btn-icon">{modeOption.icon}</span>
        <span class="btn-label">{modeOption.label}</span>
      </button>
    {/each}
  </div>

  <!-- Add node dropdown -->
  {#if showAddMenu && !readonly}
    <div class="add-menu">
      {#each nodeTypes as nodeType}
        <button
          class="add-menu-item"
          on:click={() => handleAddNode(nodeType.type)}
        >
          <span class="item-icon">{nodeType.icon}</span>
          <span class="item-label">{nodeType.label}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="toolbar-divider"></div>

  <!-- Zoom controls -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn"
      title="Zoom out"
      on:click={() => dispatch('zoomOut')}
    >
      <span class="btn-icon">🔍−</span>
    </button>
    <span class="zoom-level">{Math.round(zoom * 100)}%</span>
    <button
      class="toolbar-btn"
      title="Zoom in"
      on:click={() => dispatch('zoomIn')}
    >
      <span class="btn-icon">🔍+</span>
    </button>
    <button
      class="toolbar-btn"
      title="Reset zoom"
      on:click={() => dispatch('zoomReset')}
    >
      <span class="btn-icon">↺</span>
    </button>
    <button
      class="toolbar-btn"
      title="Fit to view"
      on:click={() => dispatch('zoomFit')}
    >
      <span class="btn-icon">⊡</span>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Grid controls -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn"
      class:active={gridVisible}
      title="Toggle grid"
      on:click={() => dispatch('toggleGrid')}
    >
      <span class="btn-icon">▦</span>
      <span class="btn-label">Grid</span>
    </button>
    <button
      class="toolbar-btn"
      class:active={gridSnap}
      title="Toggle snap to grid"
      on:click={() => dispatch('toggleSnap')}
    >
      <span class="btn-icon">⊞</span>
      <span class="btn-label">Snap</span>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Undo/Redo -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn"
      title="Undo (Ctrl+Z)"
      on:click={() => dispatch('undo')}
      disabled={!canUndo}
    >
      <span class="btn-icon">↩</span>
    </button>
    <button
      class="toolbar-btn"
      title="Redo (Ctrl+Y)"
      on:click={() => dispatch('redo')}
      disabled={!canRedo}
    >
      <span class="btn-icon">↪</span>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Actions -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn"
      title="Auto-layout nodes"
      on:click={() => dispatch('autoLayout')}
    >
      <span class="btn-icon">🔄</span>
      <span class="btn-label">Layout</span>
    </button>
    {#if selectedCount > 0}
      <button
        class="toolbar-btn danger"
        title="Delete selected ({selectedCount})"
        on:click={() => dispatch('deleteSelected')}
        disabled={readonly}
      >
        <span class="btn-icon">🗑</span>
        <span class="btn-label">Delete ({selectedCount})</span>
      </button>
    {/if}
  </div>

  <div class="toolbar-spacer"></div>

  <slot />

  <!-- Export/Save -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn"
      title="Export schema"
      on:click={() => dispatch('exportSchema')}
    >
      <span class="btn-icon">📤</span>
      <span class="btn-label">Export</span>
    </button>
    <button
      class="toolbar-btn primary"
      title="Save changes"
      on:click={() => dispatch('save')}
      disabled={readonly}
    >
      <span class="btn-icon">💾</span>
      <span class="btn-label">Save</span>
    </button>
  </div>
</div>

<style>
  .canvas-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #2d2d2d;
    border-bottom: 1px solid #3c3c3c;
    user-select: none;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: #3c3c3c;
    border: 1px solid #515151;
    border-radius: 4px;
    color: #d4d4d4;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: #4c4c4c;
    border-color: #616161;
  }

  .toolbar-btn.active {
    background: #007acc;
    border-color: #007acc;
    color: #fff;
  }

  .toolbar-btn.primary {
    background: #007acc;
    border-color: #005a9e;
    color: #fff;
  }

  .toolbar-btn.primary:hover:not(:disabled) {
    background: #005a9e;
  }

  .toolbar-btn.danger:hover:not(:disabled) {
    background: #d32f2f;
    border-color: #b71c1c;
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon {
    font-size: 14px;
    line-height: 1;
  }

  .btn-label {
    font-weight: 500;
  }

  .zoom-level {
    font-size: 12px;
    color: #858585;
    min-width: 42px;
    text-align: center;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: #515151;
    margin: 0 4px;
  }

  .toolbar-spacer {
    flex: 1;
  }

  /* Add menu dropdown */
  .add-menu {
    position: absolute;
    top: 100%;
    left: 180px;
    margin-top: 4px;
    background: #2d2d2d;
    border: 1px solid #515151;
    border-radius: 6px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }

  .add-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #d4d4d4;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease;
    text-align: left;
  }

  .add-menu-item:hover {
    background: #3c3c3c;
  }

  .item-icon {
    font-size: 16px;
    line-height: 1;
  }

  .item-label {
    font-weight: 500;
  }
</style>
