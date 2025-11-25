<script lang="ts">
  /**
   * CanvasEdge.svelte
   * 
   * Edge/connection component for the Praxis visual schema editor.
   * Renders lines between nodes with optional labels and styling.
   */
  import { createEventDispatcher } from 'svelte';
  import type { CanvasEdgeState } from '../canvas-state.js';
  import type { PSFPosition } from '../../../core/schema-engine/psf.js';

  // Props
  export let edge: CanvasEdgeState;
  export let sourcePosition: PSFPosition;
  export let targetPosition: PSFPosition;
  export let zoom: number = 1;
  export let readonly: boolean = false;

  const dispatch = createEventDispatcher<{
    select: { edgeId: string; addToSelection: boolean };
    contextMenu: { edgeId: string; event: MouseEvent };
    delete: { edgeId: string };
  }>();

  // Edge type colors
  const typeColors: Record<CanvasEdgeState['type'], string> = {
    data: '#3b82f6',
    control: '#22c55e',
    event: '#f59e0b',
    reference: '#a855f7',
  };

  $: color = typeColors[edge.type];

  // Calculate path points - using quadratic bezier for smooth curves
  // Add offset for port positions
  $: sourceX = sourcePosition.x + 140; // Approximate node width
  $: sourceY = sourcePosition.y + 40;  // Approximate node half-height
  $: targetX = targetPosition.x;
  $: targetY = targetPosition.y + 40;

  // Control point for bezier curve
  $: controlX = (sourceX + targetX) / 2;
  
  // Create SVG path
  $: path = `M ${sourceX} ${sourceY} Q ${controlX} ${sourceY} ${controlX} ${(sourceY + targetY) / 2} Q ${controlX} ${targetY} ${targetX} ${targetY}`;
  
  // Simple path for straight line fallback
  $: simplePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  
  // Choose path based on distance
  $: distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
  $: finalPath = distance > 100 ? path : simplePath;

  // Label position - center of the path
  $: labelX = controlX;
  $: labelY = (sourceY + targetY) / 2;

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    dispatch('select', { 
      edgeId: edge.id, 
      addToSelection: event.shiftKey || event.ctrlKey || event.metaKey 
    });
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('contextMenu', { edgeId: edge.id, event });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!readonly && edge.selected) {
        dispatch('delete', { edgeId: edge.id });
      }
    }
  }
</script>

<g
  class="canvas-edge"
  class:selected={edge.selected}
  on:click={handleClick}
  on:contextmenu={handleContextMenu}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
  aria-label="{edge.label || edge.type} connection"
>
  <!-- Invisible wider path for easier clicking -->
  <path
    class="edge-hitbox"
    d={finalPath}
    fill="none"
    stroke="transparent"
    stroke-width="16"
  />
  
  <!-- Visible path -->
  <path
    class="edge-path"
    d={finalPath}
    fill="none"
    stroke={color}
    stroke-width={edge.selected ? 3 : 2}
    stroke-linecap="round"
  />
  
  <!-- Arrow marker at the end -->
  <circle
    class="edge-endpoint"
    cx={targetX}
    cy={targetY}
    r="4"
    fill={color}
  />
  
  <!-- Optional label -->
  {#if edge.label}
    <g class="edge-label-group" transform="translate({labelX}, {labelY})">
      <rect
        class="edge-label-bg"
        x="-40"
        y="-10"
        width="80"
        height="20"
        rx="4"
        fill="#1e1e1e"
        stroke={color}
        stroke-width="1"
      />
      <text
        class="edge-label"
        text-anchor="middle"
        dominant-baseline="middle"
        fill={color}
        font-size="10"
      >
        {edge.label.length > 12 ? edge.label.slice(0, 12) + '...' : edge.label}
      </text>
    </g>
  {/if}
</g>

<style>
  .canvas-edge {
    cursor: pointer;
  }

  .edge-path {
    transition: stroke-width 0.15s ease;
    pointer-events: none;
  }

  .edge-hitbox {
    cursor: pointer;
  }

  .canvas-edge:hover .edge-path {
    stroke-width: 3;
  }

  .canvas-edge.selected .edge-path {
    stroke-dasharray: 8, 4;
    animation: dash 0.5s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: -12;
    }
  }

  .edge-endpoint {
    transition: transform 0.15s ease;
  }

  .canvas-edge:hover .edge-endpoint {
    transform: scale(1.5);
    transform-origin: center;
  }

  .edge-label-group {
    pointer-events: none;
  }

  .edge-label {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
  }

  .canvas-edge:focus {
    outline: none;
  }

  .canvas-edge:focus .edge-path {
    stroke-width: 4;
  }
</style>
