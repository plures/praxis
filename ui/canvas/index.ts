/**
 * Praxis Canvas
 *
 * Real-time visual editor for PSF schemas.
 * Provides bidirectional sync between canvas and code.
 *
 * Features:
 * - Drag-and-drop nodes for facts, events, rules, constraints
 * - Visual links and relationships
 * - Constraint visualization
 * - Context menus for adding/editing schema nodes
 * - Real-time sync with code via PluresDB
 * - Dark/light mode support
 * - Undo/redo
 * - Grid snapping
 * - Multiple layout algorithms
 *
 * @example
 * ```svelte
 * <script>
 *   import PraxisCanvas from '@plures/praxis/ui/canvas/components/PraxisCanvas.svelte';
 *   import { mySchema } from './schema.js';
 * </script>
 *
 * <PraxisCanvas schema={mySchema} theme="dark" />
 * ```
 */

export * from './canvas-state.js';
export * from './canvas-projection.js';

// Export component prop types
export {
  type PraxisCanvasProps,
  type CanvasNodeProps,
  type CanvasEdgeProps,
  type CanvasToolbarProps,
} from './components/index.js';

// Re-export code-canvas integration
export {
  schemaToCanvas,
  canvasToSchema,
  canvasToYaml,
  canvasToMermaid,
  validateWithGuardian,
  createCanvasEditor,
  type CanvasNode as CanvasNodeType,
  type CanvasEdge as CanvasEdgeType,
  type CanvasNodeStyle,
  type CanvasEdgeStyle,
  type CanvasDocument,
  type LifecycleState,
  type ActivityState,
  type CanvasEditorConfig,
  type GuardianResult,
} from '../../src/integrations/code-canvas.js';
