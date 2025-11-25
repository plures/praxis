<script lang="ts">
  /**
   * PraxisCanvas.svelte
   * 
   * Main canvas component for the Praxis visual schema editor.
   * Provides a complete visual editing experience for PSF schemas.
   * 
   * Features:
   * - Drag-and-drop nodes for facts, events, rules, constraints, models, components
   * - Visual links and relationships between nodes
   * - Constraint visualization
   * - Context menus for adding/editing schema nodes
   * - Real-time sync with code via PluresDB
   * - Dark/light mode support
   * - Undo/redo
   * - Grid snapping
   * - Multiple layout algorithms
   */
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { PSFSchema, PSFPosition } from '../../../core/schema-engine/psf.js';
  import { 
    CanvasStateManager, 
    type CanvasState, 
    type CanvasNodeState, 
    type CanvasEdgeState,
    type CanvasMode 
  } from '../canvas-state.js';
  import { CanvasProjection, type LayoutOptions } from '../canvas-projection.js';
  import CanvasNode from './CanvasNode.svelte';
  import CanvasEdge from './CanvasEdge.svelte';
  import CanvasToolbar from './CanvasToolbar.svelte';

  // Props
  export let schema: PSFSchema;
  export let readonly: boolean = false;
  export let theme: 'dark' | 'light' = 'dark';
  export let showToolbar: boolean = true;
  export let showMinimap: boolean = true;
  export let layoutOptions: Partial<LayoutOptions> = {};

  const dispatch = createEventDispatcher<{
    schemaChange: { schema: PSFSchema };
    nodeSelect: { nodeId: string };
    nodeDoubleClick: { nodeId: string };
    save: { schema: PSFSchema };
  }>();

  // State manager and projection
  const stateManager = new CanvasStateManager();
  const projection = new CanvasProjection(layoutOptions);
  
  // Reactive state
  let canvasState: CanvasState;
  let canvasElement: HTMLDivElement;
  let svgElement: SVGSVGElement;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let viewportStartX = 0;
  let viewportStartY = 0;
  let contextMenu: { x: number; y: number; nodeId?: string; edgeId?: string } | null = null;
  let undoStack: CanvasState[] = [];
  let redoStack: CanvasState[] = [];

  // Subscribe to state changes
  const unsubscribe = stateManager.subscribe((state) => {
    canvasState = state;
  });

  // Derived values
  $: nodes = canvasState?.nodes ? Array.from(canvasState.nodes.values()) : [];
  $: edges = canvasState?.edges ? Array.from(canvasState.edges.values()) : [];
  $: selectedNodeCount = canvasState?.selection?.nodes?.size ?? 0;
  $: selectedEdgeCount = canvasState?.selection?.edges?.size ?? 0;
  $: selectedCount = selectedNodeCount + selectedEdgeCount;
  $: canUndo = undoStack.length > 0;
  $: canRedo = redoStack.length > 0;

  // Get node position for edge rendering
  function getNodePosition(nodeId: string): PSFPosition {
    const node = canvasState?.nodes?.get(nodeId);
    return node?.position ?? { x: 0, y: 0 };
  }

  // Load schema on mount and when it changes
  $: if (schema && stateManager) {
    stateManager.loadFromSchema(schema);
    
    // Auto-layout nodes without positions
    if (canvasState?.nodes) {
      const newPositions = projection.autoLayoutMissingPositions(canvasState.nodes, schema);
      for (const [nodeId, position] of newPositions) {
        const node = canvasState.nodes.get(nodeId);
        if (node && !node.hasExplicitPosition) {
          stateManager.moveNode(nodeId, position);
        }
      }
    }
  }

  // Track if space key is held for temporary pan mode
  let isSpaceHeld = false;

  // Event handlers
  function handleCanvasMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    if (event.target !== canvasElement && event.target !== svgElement) return;

    if ((canvasState && canvasState.mode === 'pan') || isSpaceHeld) {
      isPanning = true;
      panStartX = event.clientX;
      panStartY = event.clientY;
      viewportStartX = canvasState?.viewport?.x ?? 0;
      viewportStartY = canvasState?.viewport?.y ?? 0;
      canvasElement.style.cursor = 'grabbing';
    } else if (canvasState && canvasState.mode === 'select') {
      // Clicked on empty space - clear selection
      stateManager.clearSelection();
      closeContextMenu();
    }
  }

  function handleCanvasMouseMove(event: MouseEvent) {
    if (isPanning) {
      const deltaX = event.clientX - panStartX;
      const deltaY = event.clientY - panStartY;
      stateManager.setViewport({
        x: viewportStartX + deltaX,
        y: viewportStartY + deltaY,
      });
    }
  }

  function handleCanvasMouseUp() {
    if (isPanning) {
      isPanning = false;
      canvasElement.style.cursor = '';
    }
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(
      canvasState.viewport.maxZoom,
      Math.max(canvasState.viewport.minZoom, canvasState.viewport.zoom * delta)
    );
    
    // Zoom towards mouse position
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const scale = newZoom / canvasState.viewport.zoom;
    const newX = mouseX - (mouseX - canvasState.viewport.x) * scale;
    const newY = mouseY - (mouseY - canvasState.viewport.y) * scale;
    
    stateManager.setViewport({ zoom: newZoom, x: newX, y: newY });
  }

  // Node event handlers
  function handleNodeSelect(event: CustomEvent<{ nodeId: string; addToSelection: boolean }>) {
    stateManager.selectNode(event.detail.nodeId, event.detail.addToSelection);
    dispatch('nodeSelect', { nodeId: event.detail.nodeId });
    closeContextMenu();
  }

  function handleNodeMove(event: CustomEvent<{ nodeId: string; position: PSFPosition }>) {
    stateManager.moveNode(event.detail.nodeId, event.detail.position);
  }

  function handleNodeDragEnd(event: CustomEvent<{ nodeId: string; position: PSFPosition }>) {
    // Update schema when drag ends
    if (schema) {
      const updatedSchema = stateManager.exportToSchema(schema);
      dispatch('schemaChange', { schema: updatedSchema });
    }
  }

  function handleNodeContextMenu(event: CustomEvent<{ nodeId: string; event: MouseEvent }>) {
    contextMenu = {
      x: event.detail.event.clientX,
      y: event.detail.event.clientY,
      nodeId: event.detail.nodeId,
    };
  }

  function handleNodeDoubleClick(event: CustomEvent<{ nodeId: string }>) {
    dispatch('nodeDoubleClick', { nodeId: event.detail.nodeId });
  }

  // Edge event handlers
  function handleEdgeSelect(event: CustomEvent<{ edgeId: string; addToSelection: boolean }>) {
    // TODO: Implement edge selection in state manager
    closeContextMenu();
  }

  function handleEdgeContextMenu(event: CustomEvent<{ edgeId: string; event: MouseEvent }>) {
    contextMenu = {
      x: event.detail.event.clientX,
      y: event.detail.event.clientY,
      edgeId: event.detail.edgeId,
    };
  }

  // Toolbar event handlers
  function handleModeChange(event: CustomEvent<{ mode: CanvasMode }>) {
    stateManager.setMode(event.detail.mode);
  }

  function handleZoomIn() {
    const newZoom = Math.min(canvasState.viewport.maxZoom, canvasState.viewport.zoom * 1.2);
    stateManager.setViewport({ zoom: newZoom });
  }

  function handleZoomOut() {
    const newZoom = Math.max(canvasState.viewport.minZoom, canvasState.viewport.zoom / 1.2);
    stateManager.setViewport({ zoom: newZoom });
  }

  function handleZoomReset() {
    stateManager.setViewport({ zoom: 1 });
  }

  function handleZoomFit() {
    // TODO: Calculate bounds and fit all nodes in view
    stateManager.setViewport({ zoom: 1, x: 0, y: 0 });
  }

  function handleToggleGrid() {
    stateManager.toggleGrid();
  }

  function handleToggleSnap() {
    // TODO: Implement in state manager
  }

  function handleUndo() {
    stateManager.undo();
  }

  function handleRedo() {
    stateManager.redo();
  }

  function handleDeleteSelected() {
    // TODO: Implement node/edge deletion
  }

  function handleAddNode(event: CustomEvent<{ type: CanvasNodeState['type'] }>) {
    // TODO: Implement add node at center of viewport
  }

  function handleAutoLayout() {
    if (schema) {
      const result = projection.projectSchema(schema);
      for (const [nodeId, position] of result.positions) {
        stateManager.moveNode(nodeId, position);
      }
    }
  }

  function handleExportSchema() {
    if (schema) {
      const updatedSchema = stateManager.exportToSchema(schema);
      const json = JSON.stringify(updatedSchema, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schema.id}.psf.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function handleSave() {
    if (schema) {
      const updatedSchema = stateManager.exportToSchema(schema);
      dispatch('save', { schema: updatedSchema });
    }
  }

  // Context menu
  function closeContextMenu() {
    contextMenu = null;
  }

  function handleContextMenuAction(action: string) {
    // TODO: Implement context menu actions
    closeContextMenu();
  }

  // Keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    // Don't handle if typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    if (modifier && event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    } else if (modifier && event.key === 'y') {
      event.preventDefault();
      handleRedo();
    } else if (modifier && event.key === 's') {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedCount > 0 && !readonly) {
        handleDeleteSelected();
      }
    } else if (event.key === 'Escape') {
      stateManager.clearSelection();
      closeContextMenu();
    } else if (event.key === ' ') {
      event.preventDefault();
      // Hold space to temporarily pan
      isSpaceHeld = true;
      stateManager.setMode('pan');
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === ' ') {
      isSpaceHeld = false;
      stateManager.setMode('select');
    }
  }

  // Lifecycle
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });

  onDestroy(() => {
    unsubscribe();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  });
</script>

<svelte:window on:click={closeContextMenu} />

<div 
  class="praxis-canvas"
  class:theme-dark={theme === 'dark'}
  class:theme-light={theme === 'light'}
>
  {#if showToolbar && canvasState}
    <CanvasToolbar
      mode={canvasState.mode}
      zoom={canvasState.viewport.zoom}
      gridVisible={canvasState.grid.visible}
      gridSnap={canvasState.grid.snap}
      {canUndo}
      {canRedo}
      {selectedCount}
      {readonly}
      on:modeChange={handleModeChange}
      on:zoomIn={handleZoomIn}
      on:zoomOut={handleZoomOut}
      on:zoomReset={handleZoomReset}
      on:zoomFit={handleZoomFit}
      on:toggleGrid={handleToggleGrid}
      on:toggleSnap={handleToggleSnap}
      on:undo={handleUndo}
      on:redo={handleRedo}
      on:deleteSelected={handleDeleteSelected}
      on:addNode={handleAddNode}
      on:autoLayout={handleAutoLayout}
      on:exportSchema={handleExportSchema}
      on:save={handleSave}
    />
  {/if}

  <div
    class="canvas-viewport"
    bind:this={canvasElement}
    on:mousedown={handleCanvasMouseDown}
    on:mousemove={handleCanvasMouseMove}
    on:mouseup={handleCanvasMouseUp}
    on:mouseleave={handleCanvasMouseUp}
    on:wheel={handleWheel}
    role="application"
    aria-label="Schema canvas"
    tabindex="0"
  >
    {#if canvasState}
      <!-- Grid background -->
      {#if canvasState.grid.visible}
        <svg class="canvas-grid" aria-hidden="true">
          <defs>
            <pattern
              id="grid-pattern"
              width={canvasState.grid.size * canvasState.viewport.zoom}
              height={canvasState.grid.size * canvasState.viewport.zoom}
              patternUnits="userSpaceOnUse"
              x={canvasState.viewport.x % (canvasState.grid.size * canvasState.viewport.zoom)}
              y={canvasState.viewport.y % (canvasState.grid.size * canvasState.viewport.zoom)}
            >
              <circle 
                cx="1" 
                cy="1" 
                r="1" 
                fill={theme === 'dark' ? '#3c3c3c' : '#e0e0e0'} 
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      {/if}

      <!-- Canvas content layer -->
      <div
        class="canvas-layer"
        style="
          transform: translate({canvasState.viewport.x}px, {canvasState.viewport.y}px) 
                     scale({canvasState.viewport.zoom});
          transform-origin: 0 0;
        "
      >
        <!-- Edges (rendered as SVG) -->
        <svg 
          class="edges-layer" 
          bind:this={svgElement}
          aria-label="Node connections"
        >
          {#each edges as edge (edge.id)}
            <CanvasEdge
              {edge}
              sourcePosition={getNodePosition(edge.source)}
              targetPosition={getNodePosition(edge.target)}
              zoom={canvasState.viewport.zoom}
              {readonly}
              on:select={handleEdgeSelect}
              on:contextMenu={handleEdgeContextMenu}
            />
          {/each}
        </svg>

        <!-- Nodes -->
        {#each nodes as node (node.id)}
          <CanvasNode
            {node}
            zoom={canvasState.viewport.zoom}
            gridSnap={canvasState.grid.snap}
            gridSize={canvasState.grid.size}
            {readonly}
            on:select={handleNodeSelect}
            on:move={handleNodeMove}
            on:dragEnd={handleNodeDragEnd}
            on:contextMenu={handleNodeContextMenu}
            on:doubleClick={handleNodeDoubleClick}
          />
        {/each}
      </div>

      <!-- Minimap -->
      {#if showMinimap}
        <div class="canvas-minimap">
          <svg viewBox="-200 -200 600 400" preserveAspectRatio="xMidYMid meet">
            {#each nodes as node}
              <rect
                x={node.position.x / 5 - 10}
                y={node.position.y / 5 - 5}
                width="20"
                height="10"
                rx="2"
                fill={node.selected ? '#007acc' : '#515151'}
              />
            {/each}
            <!-- Viewport indicator -->
            <rect
              x={-canvasState.viewport.x / 5 / canvasState.viewport.zoom}
              y={-canvasState.viewport.y / 5 / canvasState.viewport.zoom}
              width={200 / canvasState.viewport.zoom}
              height={100 / canvasState.viewport.zoom}
              fill="none"
              stroke="#007acc"
              stroke-width="2"
            />
          </svg>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Context menu -->
  {#if contextMenu}
    <div
      class="context-menu"
      style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
      role="menu"
    >
      {#if contextMenu.nodeId}
        <button class="context-menu-item" on:click={() => handleContextMenuAction('edit')}>
          ✏️ Edit Node
        </button>
        <button class="context-menu-item" on:click={() => handleContextMenuAction('duplicate')}>
          📋 Duplicate
        </button>
        <div class="context-menu-divider" />
        <button class="context-menu-item danger" on:click={() => handleContextMenuAction('delete')}>
          🗑️ Delete
        </button>
      {:else if contextMenu.edgeId}
        <button class="context-menu-item" on:click={() => handleContextMenuAction('editEdge')}>
          ✏️ Edit Connection
        </button>
        <button class="context-menu-item danger" on:click={() => handleContextMenuAction('deleteEdge')}>
          🗑️ Delete Connection
        </button>
      {:else}
        <button class="context-menu-item" on:click={() => handleContextMenuAction('addFact')}>
          📋 Add Fact
        </button>
        <button class="context-menu-item" on:click={() => handleContextMenuAction('addEvent')}>
          ⚡ Add Event
        </button>
        <button class="context-menu-item" on:click={() => handleContextMenuAction('addRule')}>
          📐 Add Rule
        </button>
        <button class="context-menu-item" on:click={() => handleContextMenuAction('addConstraint')}>
          🔒 Add Constraint
        </button>
        <div class="context-menu-divider" />
        <button class="context-menu-item" on:click={() => handleContextMenuAction('addModel')}>
          📦 Add Model
        </button>
        <button class="context-menu-item" on:click={() => handleContextMenuAction('addComponent')}>
          🧩 Add Component
        </button>
      {/if}
    </div>
  {/if}

  <!-- Status bar -->
  <div class="canvas-status">
    <span class="status-item">
      {nodes.length} node{nodes.length !== 1 ? 's' : ''}, 
      {edges.length} connection{edges.length !== 1 ? 's' : ''}
    </span>
    {#if selectedCount > 0}
      <span class="status-item selected">
        {selectedCount} selected
      </span>
    {/if}
    {#if canvasState}
      <span class="status-item zoom">
        {Math.round(canvasState.viewport.zoom * 100)}%
      </span>
    {/if}
  </div>
</div>

<style>
  .praxis-canvas {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .theme-dark {
    --canvas-bg: #1a1a1a;
    --canvas-text: #d4d4d4;
    --canvas-border: #3c3c3c;
    --canvas-surface: #2d2d2d;
  }

  .theme-light {
    --canvas-bg: #f5f5f5;
    --canvas-text: #1a1a1a;
    --canvas-border: #e0e0e0;
    --canvas-surface: #ffffff;
  }

  .canvas-viewport {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: var(--canvas-bg);
    cursor: default;
  }

  .canvas-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 10000px;
    height: 10000px;
    pointer-events: none;
    overflow: visible;
  }

  .edges-layer :global(g) {
    pointer-events: auto;
  }

  /* Minimap */
  .canvas-minimap {
    position: absolute;
    bottom: 48px;
    right: 12px;
    width: 200px;
    height: 100px;
    background: var(--canvas-surface);
    border: 1px solid var(--canvas-border);
    border-radius: 6px;
    overflow: hidden;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .canvas-minimap:hover {
    opacity: 1;
  }

  .canvas-minimap svg {
    width: 100%;
    height: 100%;
  }

  /* Context menu */
  .context-menu {
    position: fixed;
    background: var(--canvas-surface);
    border: 1px solid var(--canvas-border);
    border-radius: 6px;
    padding: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    min-width: 160px;
  }

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--canvas-text);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }

  .context-menu-item:hover {
    background: #3c3c3c;
  }

  .context-menu-item.danger:hover {
    background: #d32f2f;
    color: #fff;
  }

  .context-menu-divider {
    height: 1px;
    background: var(--canvas-border);
    margin: 4px 0;
  }

  /* Status bar */
  .canvas-status {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 6px 12px;
    background: var(--canvas-surface);
    border-top: 1px solid var(--canvas-border);
    font-size: 12px;
    color: #858585;
  }

  .status-item.selected {
    color: #007acc;
    font-weight: 500;
  }

  .status-item.zoom {
    margin-left: auto;
  }
</style>
