<script lang="ts">
  /**
   * CanvasNode.svelte
   * 
   * Individual node component for the Praxis visual schema editor.
   * Represents facts, events, rules, constraints, models, components, and flows.
   */
  import { createEventDispatcher, onDestroy } from 'svelte';
  import type { PSFPosition } from '../../../core/schema-engine/psf.js';
  import type { CanvasNodeState } from '../canvas-state.js';

  // Props
  export let node: CanvasNodeState;
  export let zoom: number = 1;
  export let gridSnap: boolean = true;
  export let gridSize: number = 20;
  export let readonly: boolean = false;

  const dispatch = createEventDispatcher<{
    select: { nodeId: string; addToSelection: boolean };
    move: { nodeId: string; position: PSFPosition };
    dragStart: { nodeId: string };
    dragEnd: { nodeId: string; position: PSFPosition };
    contextMenu: { nodeId: string; event: MouseEvent };
    doubleClick: { nodeId: string };
  }>();

  // Local state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let nodeStartX = 0;
  let nodeStartY = 0;

  // Node type colors
  const typeColors: Record<CanvasNodeState['type'], { bg: string; border: string; text: string }> = {
    fact: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
    event: { bg: '#3f2d1e', border: '#f59e0b', text: '#fcd34d' },
    rule: { bg: '#1e3f1e', border: '#22c55e', text: '#86efac' },
    constraint: { bg: '#3f1e1e', border: '#ef4444', text: '#fca5a5' },
    model: { bg: '#2d1e3f', border: '#a855f7', text: '#d8b4fe' },
    component: { bg: '#1e3f3f', border: '#14b8a6', text: '#5eead4' },
    flow: { bg: '#3f3f1e', border: '#eab308', text: '#fef08a' },
  };

  // Node type icons (emoji for simplicity, could be SVG)
  const typeIcons: Record<CanvasNodeState['type'], string> = {
    fact: '📋',
    event: '⚡',
    rule: '📐',
    constraint: '🔒',
    model: '📦',
    component: '🧩',
    flow: '🔀',
  };

  $: colors = typeColors[node.type];
  $: icon = typeIcons[node.type];

  // Mouse button constants
  const LEFT_MOUSE_BUTTON = 0;

  function handleMouseDown(event: MouseEvent) {
    if (readonly) return;
    if (event.button !== LEFT_MOUSE_BUTTON) return;

    event.stopPropagation();

    // Select the node
    dispatch('select', { 
      nodeId: node.id, 
      addToSelection: event.shiftKey || event.ctrlKey || event.metaKey 
    });

    // Start dragging
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    nodeStartX = node.position.x;
    nodeStartY = node.position.y;

    dispatch('dragStart', { nodeId: node.id });

    // Add global listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    const deltaX = (event.clientX - dragStartX) / zoom;
    const deltaY = (event.clientY - dragStartY) / zoom;

    let newX = nodeStartX + deltaX;
    let newY = nodeStartY + deltaY;

    // Snap to grid if enabled
    if (gridSnap) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    dispatch('move', { nodeId: node.id, position: { x: newX, y: newY } });
  }

  function handleMouseUp(event: MouseEvent) {
    if (!isDragging) return;

    isDragging = false;

    // Remove global listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    const deltaX = (event.clientX - dragStartX) / zoom;
    const deltaY = (event.clientY - dragStartY) / zoom;

    let newX = nodeStartX + deltaX;
    let newY = nodeStartY + deltaY;

    if (gridSnap) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    dispatch('dragEnd', { nodeId: node.id, position: { x: newX, y: newY } });
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('contextMenu', { nodeId: node.id, event });
  }

  function handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    dispatch('doubleClick', { nodeId: node.id });
  }

  // Cleanup on component destroy
  onDestroy(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  });
</script>

<div
  class="canvas-node"
  class:selected={node.selected}
  class:dragging={isDragging}
  style="
    left: {node.position.x}px;
    top: {node.position.y}px;
    --node-bg: {colors.bg};
    --node-border: {colors.border};
    --node-text: {colors.text};
  "
  on:mousedown={handleMouseDown}
  on:contextmenu={handleContextMenu}
  on:dblclick={handleDoubleClick}
  role="button"
  tabindex="0"
  aria-label="{node.type}: {node.label}"
  aria-pressed={node.selected}
>
  <div class="node-header">
    <span class="node-icon">{icon}</span>
    <span class="node-type">{node.type}</span>
  </div>
  <div class="node-label">{node.label}</div>
  {#if node.data?.description}
    <div class="node-description">{node.data.description}</div>
  {/if}
  
  <!-- Connection ports -->
  <div class="node-port port-input" aria-label="Input port"></div>
  <div class="node-port port-output" aria-label="Output port"></div>
</div>

<style>
  .canvas-node {
    position: absolute;
    min-width: 160px;
    max-width: 280px;
    padding: 12px;
    background: var(--node-bg);
    border: 2px solid var(--node-border);
    border-radius: 8px;
    cursor: grab;
    user-select: none;
    transition: box-shadow 0.15s ease, transform 0.1s ease;
    z-index: 1;
  }

  .canvas-node:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2;
  }

  .canvas-node.selected {
    border-width: 3px;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.4);
    z-index: 3;
  }

  .canvas-node.dragging {
    cursor: grabbing;
    opacity: 0.9;
    transform: scale(1.02);
    z-index: 100;
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .node-icon {
    font-size: 16px;
    line-height: 1;
  }

  .node-type {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--node-text);
    opacity: 0.8;
  }

  .node-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--node-text);
    word-break: break-word;
    margin-bottom: 4px;
  }

  .node-description {
    font-size: 11px;
    color: var(--node-text);
    opacity: 0.7;
    line-height: 1.4;
    max-height: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* Connection ports */
  .node-port {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--node-border);
    border: 2px solid var(--node-bg);
    border-radius: 50%;
    cursor: crosshair;
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .node-port:hover {
    transform: scale(1.3);
    background: #fff;
  }

  .port-input {
    top: 50%;
    left: -6px;
    transform: translateY(-50%);
  }

  .port-input:hover {
    transform: translateY(-50%) scale(1.3);
  }

  .port-output {
    top: 50%;
    right: -6px;
    transform: translateY(-50%);
  }

  .port-output:hover {
    transform: translateY(-50%) scale(1.3);
  }

  /* Focus styles for accessibility */
  .canvas-node:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--node-border), 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .canvas-node:focus:not(:focus-visible) {
    box-shadow: none;
  }

  .canvas-node:focus-visible {
    box-shadow: 0 0 0 3px var(--node-border), 0 4px 16px rgba(0, 0, 0, 0.4);
  }
</style>
