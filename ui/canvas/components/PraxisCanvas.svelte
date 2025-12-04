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
  $: flows = schema?.flows || [];
  
  // Flow filtering
  let selectedFlowId: string | null = null;
  let selectedEventId: string | null = null;

  $: eventChainNodeIds = selectedEventId ? (() => {
      const ids = new Set<string>();
      ids.add(selectedEventId);

      // Find rules triggered by this event
      const rules = nodes.filter(n =>
          n.type === 'rule' &&
          ((n.data as any).triggers?.includes(selectedEventId) || (n.data as any).on?.includes(selectedEventId))
      );

      rules.forEach(r => {
          ids.add(r.id);
          // Add outputs
          const logic = (r.data as any).logic;
          if (logic?.events) {
              logic.events.forEach((e: string) => ids.add(e));
          }
      });
      return ids;
  })() : null;
  
  $: filteredNodes = selectedFlowId 
    ? nodes.filter(n => {
        // Include nodes explicitly in the flow (via metadata)
        if (n.type === 'rule' && (n.data as any)?.meta?.flowId === selectedFlowId) return true;
        
        // Include nodes connected to the flow's rules
        // This is a simplified check; a more robust graph traversal might be needed
        // but for now, we check if the node is connected to any visible rule
        const flowRuleIds = new Set(nodes
          .filter(r => r.type === 'rule' && (r.data as any)?.meta?.flowId === selectedFlowId)
          .map(r => r.id));
          
        // Check edges to see if this node is connected to a flow rule
        const connectedToFlow = edges.some(e => 
          (flowRuleIds.has(e.source) && e.target === n.id) || 
          (flowRuleIds.has(e.target) && e.source === n.id)
        );
        
        return connectedToFlow;
      })
    : selectedEventId
      ? nodes.filter(n => eventChainNodeIds?.has(n.id))
      : nodes;

  $: filteredEdges = (selectedFlowId || selectedEventId)
    ? edges.filter(e => {
        const sourceVisible = filteredNodes.some(n => n.id === e.source);
        const targetVisible = filteredNodes.some(n => n.id === e.target);
        return sourceVisible && targetVisible;
      })
    : edges;

  $: selectedNodeCount = canvasState?.selection?.nodes?.size ?? 0;
  $: selectedEdgeCount = canvasState?.selection?.edges?.size ?? 0;
  $: selectedCount = selectedNodeCount + selectedEdgeCount;
  $: canUndo = undoStack.length > 0;
  $: canRedo = redoStack.length > 0;

  // Fit view to content
  function fitView() {
    if (!canvasState?.nodes || canvasState.nodes.size === 0 || !canvasElement) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of canvasState.nodes.values()) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      // Approximate node size
      const width = node.type === 'model' ? 250 : 200;
      const height = node.type === 'model' ? 300 : 100;
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    }

    if (minX === Infinity) return;

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    const containerWidth = canvasElement.clientWidth;
    const containerHeight = canvasElement.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) return;

    const zoomX = containerWidth / width;
    const zoomY = containerHeight / height;
    let zoom = Math.min(zoomX, zoomY);

    // Clamp zoom
    zoom = Math.min(Math.max(zoom, 0.1), 1.5);

    const x = -minX * zoom + (containerWidth - width * zoom) / 2;
    const y = -minY * zoom + (containerHeight - height * zoom) / 2;

    stateManager.setViewport({ x, y, zoom });
  }

  // Get node position for edge rendering
  function getNodePosition(nodeId: string): PSFPosition {
    const node = canvasState?.nodes?.get(nodeId);
    return node?.position ?? { x: 0, y: 0 };
  }

  // Load schema on mount and when it changes
  let lastLoadedSchema: PSFSchema | null = null;
  let lastLoadedSchemaId: string | undefined;

  $: if (schema && stateManager && schema !== lastLoadedSchema) {
    const isSameSchema = lastLoadedSchemaId === schema.id;
    lastLoadedSchema = schema;
    lastLoadedSchemaId = schema.id;

    stateManager.loadFromSchema(schema);
    
    // Auto-layout nodes without positions
    // Use stateManager.getState() to avoid reactive dependency on canvasState
    const currentState = stateManager.getState();
    if (currentState.nodes && currentState.nodes.size > 0) {
      const newPositions = projection.autoLayoutMissingPositions(currentState.nodes, schema);
      for (const [nodeId, position] of newPositions) {
        const node = currentState.nodes.get(nodeId);
        if (node && !node.hasExplicitPosition) {
          stateManager.moveNode(nodeId, position);
        }
      }
      
      // Fit view after layout - only once per schema load
      if (!isSameSchema) {
        setTimeout(() => fitView(), 100);
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

  function handleNodeDragEnd(_event: CustomEvent<{ nodeId: string; position: PSFPosition }>) {
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
  function handleEdgeSelect(_event: CustomEvent<{ edgeId: string; addToSelection: boolean }>) {
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

  function handleAddNode(_event: CustomEvent<{ type: CanvasNodeState['type'] }>) {
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

  function handleContextMenuAction(_action: string) {
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
    >
      <div class="flow-selector" style="margin-left: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.8rem; opacity: 0.7;">Flow:</span>
        <select 
          bind:value={selectedFlowId}
          on:change={() => selectedEventId = null}
          style="
            background: var(--bg-secondary, #2d2d2d);
            color: var(--text-primary, #fff);
            border: 1px solid var(--border-color, #444);
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 0.8rem;
          "
        >
          <option value={null}>All Flows</option>
          {#each flows as flow}
            <option value={flow.id}>{flow.name}</option>
          {/each}
        </select>

        <span style="font-size: 0.8rem; opacity: 0.7; margin-left: 0.5rem;">Event:</span>
        <select 
          bind:value={selectedEventId}
          on:change={() => selectedFlowId = null}
          style="
            background: var(--bg-secondary, #2d2d2d);
            color: var(--text-primary, #fff);
            border: 1px solid var(--border-color, #444);
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 0.8rem;
          "
        >
          <option value={null}>All Events</option>
          {#each schema?.events || [] as event}
            <option value={event.id}>{event.id}</option>
          {/each}
        </select>
      </div>
    </CanvasToolbar>
  {/if}

  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
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
          {#each filteredEdges as edge (edge.id)}
            <CanvasEdge
              {edge}
              sourcePosition={getNodePosition(edge.source)}
              targetPosition={getNodePosition(edge.target)}
              {readonly}
              on:select={handleEdgeSelect}
              on:contextMenu={handleEdgeContextMenu}
            />
          {/each}
        </svg>

        <!-- Nodes -->
        {#each filteredNodes as node (node.id)}
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
        <div class="context-menu-divider"></div>
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
        <div class="context-menu-divider"></div>
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
