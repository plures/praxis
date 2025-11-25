/**
 * Praxis Canvas
 * 
 * Real-time visual editor for PSF schemas.
 * Provides bidirectional sync between canvas and code.
 */

export * from './canvas-state.js';
export * from './canvas-projection.js';

// Re-export code-canvas integration
export {
  schemaToCanvas,
  canvasToSchema,
  canvasToYaml,
  canvasToMermaid,
  validateWithGuardian,
  createCanvasEditor,
  type CanvasNode,
  type CanvasEdge,
  type CanvasNodeStyle,
  type CanvasEdgeStyle,
  type CanvasDocument,
  type LifecycleState,
  type ActivityState,
  type CanvasEditorConfig,
  type GuardianResult,
} from '../../src/integrations/code-canvas.js';
