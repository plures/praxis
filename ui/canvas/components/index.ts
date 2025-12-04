/**
 * Praxis Canvas Svelte Components
 *
 * Visual schema editor components for the Praxis framework.
 *
 * Note: Svelte components (.svelte files) must be imported directly in Svelte applications.
 * This module provides TypeScript types for component props.
 *
 * @example
 * ```svelte
 * <script>
 *   import PraxisCanvas from '@plures/praxis/ui/canvas/components/PraxisCanvas.svelte';
 *   import CanvasNode from '@plures/praxis/ui/canvas/components/CanvasNode.svelte';
 * </script>
 * ```
 */

import type { PSFSchema, PSFPosition } from '../../../core/schema-engine/psf.js';
import type { CanvasNodeState, CanvasEdgeState, CanvasMode } from '../canvas-state.js';
import type { LayoutOptions } from '../canvas-projection.js';

/**
 * Props for PraxisCanvas Svelte component
 */
export interface PraxisCanvasProps {
  /** PSF schema to visualize */
  schema: PSFSchema;
  /** Read-only mode */
  readonly?: boolean;
  /** Color theme */
  theme?: 'dark' | 'light';
  /** Show toolbar */
  showToolbar?: boolean;
  /** Show minimap */
  showMinimap?: boolean;
  /** Layout options for auto-layout */
  layoutOptions?: Partial<LayoutOptions>;
}

/**
 * Props for CanvasNode Svelte component
 */
export interface CanvasNodeProps {
  /** Node state */
  node: CanvasNodeState;
  /** Current zoom level */
  zoom?: number;
  /** Enable grid snapping */
  gridSnap?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
  /** Read-only mode */
  readonly?: boolean;
}

/**
 * Props for CanvasEdge Svelte component
 */
export interface CanvasEdgeProps {
  /** Edge state */
  edge: CanvasEdgeState;
  /** Source node position */
  sourcePosition: PSFPosition;
  /** Target node position */
  targetPosition: PSFPosition;
  /** Current zoom level */
  zoom?: number;
  /** Read-only mode */
  readonly?: boolean;
}

/**
 * Props for CanvasToolbar Svelte component
 */
export interface CanvasToolbarProps {
  /** Current canvas mode */
  mode?: CanvasMode;
  /** Current zoom level */
  zoom?: number;
  /** Grid visibility */
  gridVisible?: boolean;
  /** Grid snapping enabled */
  gridSnap?: boolean;
  /** Can undo */
  canUndo?: boolean;
  /** Can redo */
  canRedo?: boolean;
  /** Number of selected items */
  selectedCount?: number;
  /** Read-only mode */
  readonly?: boolean;
}

/**
 * Re-export state and projection types for convenience
 */
export type { CanvasState, CanvasNodeState, CanvasEdgeState, CanvasMode } from '../canvas-state.js';
export type { LayoutOptions, LayoutResult } from '../canvas-projection.js';
export { createCanvasStateManager, CanvasStateManager } from '../canvas-state.js';
export { createCanvasProjection, CanvasProjection } from '../canvas-projection.js';
