/**
 * Canvas State Management
 * 
 * Manages the reactive state of the visual canvas editor.
 * Integrates with PluresDB for real-time synchronization.
 */

import type { PSFSchema, PSFPosition } from '../../core/schema-engine/psf.js';
import type { SchemaSyncEngine, SchemaChangeEvent } from '../../core/db-adapter/sync-engine.js';

/**
 * Canvas node representation
 */
export interface CanvasNodeState {
  /** Node ID */
  id: string;
  /** Node type */
  type: 'fact' | 'event' | 'rule' | 'constraint' | 'model' | 'component' | 'flow';
  /** Display label */
  label: string;
  /** Position */
  position: PSFPosition;
  /** Is selected */
  selected: boolean;
  /** Is being dragged */
  dragging: boolean;
  /** Additional data */
  data: Record<string, unknown>;
}

/**
 * Canvas edge representation
 */
export interface CanvasEdgeState {
  /** Edge ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Source port */
  sourcePort?: string;
  /** Target node ID */
  target: string;
  /** Target port */
  targetPort?: string;
  /** Edge type */
  type: 'data' | 'control' | 'event' | 'reference';
  /** Is selected */
  selected: boolean;
  /** Label */
  label?: string;
}

/**
 * Canvas viewport state
 */
export interface CanvasViewportState {
  /** X offset */
  x: number;
  /** Y offset */
  y: number;
  /** Zoom level */
  zoom: number;
  /** Minimum zoom */
  minZoom: number;
  /** Maximum zoom */
  maxZoom: number;
}

/**
 * Canvas grid settings
 */
export interface CanvasGridState {
  /** Is grid enabled */
  enabled: boolean;
  /** Grid size */
  size: number;
  /** Snap to grid */
  snap: boolean;
  /** Show grid lines */
  visible: boolean;
}

/**
 * Canvas selection state
 */
export interface CanvasSelectionState {
  /** Selected node IDs */
  nodes: Set<string>;
  /** Selected edge IDs */
  edges: Set<string>;
  /** Selection box (for multi-select) */
  box?: { x: number; y: number; width: number; height: number };
}

/**
 * Canvas interaction mode
 */
export type CanvasMode = 'select' | 'pan' | 'connect' | 'add';

/**
 * Full canvas state
 */
export interface CanvasState {
  /** All nodes */
  nodes: Map<string, CanvasNodeState>;
  /** All edges */
  edges: Map<string, CanvasEdgeState>;
  /** Viewport */
  viewport: CanvasViewportState;
  /** Grid */
  grid: CanvasGridState;
  /** Selection */
  selection: CanvasSelectionState;
  /** Current mode */
  mode: CanvasMode;
  /** Is read-only */
  readonly: boolean;
  /** Is loading */
  loading: boolean;
  /** Last update timestamp */
  lastUpdate: number;
}

/**
 * Canvas state manager
 * 
 * Manages the reactive state of the canvas editor.
 */
export class CanvasStateManager {
  private state: CanvasState;
  private syncEngine?: SchemaSyncEngine;
  private subscribers: Set<(state: CanvasState) => void> = new Set();
  private undoStack: CanvasState[] = [];
  private redoStack: CanvasState[] = [];
  private maxUndoHistory = 50;

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Get current state
   */
  getState(): Readonly<CanvasState> {
    return this.state;
  }

  /**
   * Connect to sync engine
   */
  connectToSync(syncEngine: SchemaSyncEngine): void {
    this.syncEngine = syncEngine;

    // Subscribe to schema changes
    syncEngine.subscribe((schema) => {
      this.loadFromSchema(schema);
    });

    // Subscribe to individual changes
    syncEngine.subscribeToChanges((change) => {
      this.handleSchemaChange(change);
    });
  }

  /**
   * Load canvas state from PSF schema
   */
  loadFromSchema(schema: PSFSchema): void {
    const nodes = new Map<string, CanvasNodeState>();
    const edges = new Map<string, CanvasEdgeState>();

    // Load facts
    for (const fact of schema.facts) {
      nodes.set(fact.id, {
        id: fact.id,
        type: 'fact',
        label: fact.tag,
        position: fact.position || { x: 0, y: 0 },
        selected: false,
        dragging: false,
        data: { description: fact.description },
      });
    }

    // Load events
    for (const event of schema.events) {
      nodes.set(event.id, {
        id: event.id,
        type: 'event',
        label: event.tag,
        position: event.position || { x: 0, y: 0 },
        selected: false,
        dragging: false,
        data: { description: event.description },
      });
    }

    // Load rules
    for (const rule of schema.rules) {
      nodes.set(rule.id, {
        id: rule.id,
        type: 'rule',
        label: rule.name || rule.id,
        position: rule.position || { x: 0, y: 0 },
        selected: false,
        dragging: false,
        data: { description: rule.description, triggers: rule.triggers },
      });

      // Create edges from triggers
      if (rule.triggers) {
        for (const trigger of rule.triggers) {
          const eventNode = schema.events.find((e) => e.tag === trigger);
          if (eventNode) {
            const edgeId = `edge_${eventNode.id}_${rule.id}`;
            edges.set(edgeId, {
              id: edgeId,
              source: eventNode.id,
              target: rule.id,
              type: 'event',
              selected: false,
              label: 'triggers',
            });
          }
        }
      }
    }

    // Load constraints
    for (const constraint of schema.constraints) {
      nodes.set(constraint.id, {
        id: constraint.id,
        type: 'constraint',
        label: constraint.name || constraint.id,
        position: constraint.position || { x: 0, y: 0 },
        selected: false,
        dragging: false,
        data: { description: constraint.description },
      });
    }

    // Load models
    for (const model of schema.models) {
      nodes.set(model.id, {
        id: model.id,
        type: 'model',
        label: model.name,
        position: model.position || { x: 0, y: 0 },
        selected: false,
        dragging: false,
        data: { description: model.description, fields: model.fields },
      });

      // Create edges for relationships
      if (model.relationships) {
        for (const rel of model.relationships) {
          const targetModel = schema.models.find((m) => m.name === rel.target);
          if (targetModel) {
            const edgeId = `edge_${model.id}_${targetModel.id}_${rel.name}`;
            edges.set(edgeId, {
              id: edgeId,
              source: model.id,
              target: targetModel.id,
              type: 'reference',
              selected: false,
              label: `${rel.name} (${rel.type})`,
            });
          }
        }
      }
    }

    // Load components
    for (const component of schema.components) {
      nodes.set(component.id, {
        id: component.id,
        type: 'component',
        label: component.name,
        position: component.position || { x: 0, y: 0 },
        selected: false,
        dragging: false,
        data: { description: component.description, model: component.model },
      });

      // Create edge to model
      if (component.model) {
        const model = schema.models.find((m) => m.name === component.model);
        if (model) {
          const edgeId = `edge_${component.id}_${model.id}`;
          edges.set(edgeId, {
            id: edgeId,
            source: component.id,
            target: model.id,
            type: 'data',
            selected: false,
            label: 'binds to',
          });
        }
      }
    }

    // Load canvas layout if available
    let viewport = this.state.viewport;
    let grid = this.state.grid;

    if (schema.canvas) {
      if (schema.canvas.viewport) {
        viewport = {
          ...viewport,
          ...schema.canvas.viewport,
        };
      }
      if (schema.canvas.grid) {
        grid = {
          ...grid,
          enabled: schema.canvas.grid.enabled,
          size: schema.canvas.grid.size,
          snap: schema.canvas.grid.snap,
        };
      }

      // Load connections from canvas layout
      if (schema.canvas.connections) {
        for (const conn of schema.canvas.connections) {
          edges.set(conn.id, {
            id: conn.id,
            source: conn.source,
            sourcePort: conn.sourcePort,
            target: conn.target,
            targetPort: conn.targetPort,
            type: conn.type || 'data',
            selected: false,
            label: conn.label,
          });
        }
      }
    }

    // Update state
    this.setState({
      ...this.state,
      nodes,
      edges,
      viewport,
      grid,
      selection: { nodes: new Set(), edges: new Set() },
      loading: false,
      lastUpdate: Date.now(),
    });
  }

  /**
   * Export canvas state to PSF schema updates
   */
  exportToSchema(existingSchema: PSFSchema): PSFSchema {
    const updates: Partial<PSFSchema> = {
      modifiedAt: new Date().toISOString(),
    };

    // Update positions for all node types
    const updatePositions = <T extends { id: string; position?: PSFPosition }>(
      items: T[],
      nodeType: CanvasNodeState['type']
    ): T[] => {
      return items.map((item) => {
        const node = this.state.nodes.get(item.id);
        if (node && node.type === nodeType) {
          return { ...item, position: node.position };
        }
        return item;
      });
    };

    updates.facts = updatePositions(existingSchema.facts, 'fact');
    updates.events = updatePositions(existingSchema.events, 'event');
    updates.rules = updatePositions(existingSchema.rules, 'rule');
    updates.constraints = updatePositions(existingSchema.constraints, 'constraint');
    updates.models = updatePositions(existingSchema.models, 'model');
    updates.components = updatePositions(existingSchema.components, 'component');

    // Update canvas layout
    updates.canvas = {
      viewport: {
        x: this.state.viewport.x,
        y: this.state.viewport.y,
        zoom: this.state.viewport.zoom,
      },
      grid: {
        enabled: this.state.grid.enabled,
        size: this.state.grid.size,
        snap: this.state.grid.snap,
      },
      connections: Array.from(this.state.edges.values()).map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourcePort: edge.sourcePort,
        target: edge.target,
        targetPort: edge.targetPort,
        type: edge.type === 'reference' ? 'data' : edge.type,
        label: edge.label,
      })),
    };

    return { ...existingSchema, ...updates };
  }

  /**
   * Select node
   */
  selectNode(nodeId: string, addToSelection = false): void {
    this.saveToUndo();

    const selection = addToSelection
      ? new Set(this.state.selection.nodes)
      : new Set<string>();

    selection.add(nodeId);

    this.setState({
      ...this.state,
      selection: {
        ...this.state.selection,
        nodes: selection,
        edges: addToSelection ? this.state.selection.edges : new Set(),
      },
      nodes: this.updateNode(nodeId, { selected: true }),
    });
  }

  /**
   * Move node
   */
  moveNode(nodeId: string, position: PSFPosition): void {
    const finalPosition = this.state.grid.snap
      ? this.snapToGrid(position)
      : position;

    this.setState({
      ...this.state,
      nodes: this.updateNode(nodeId, { position: finalPosition }),
      lastUpdate: Date.now(),
    });

    // Sync to schema if connected
    this.syncPositionToSchema(nodeId, finalPosition);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    const updatedNodes = new Map(this.state.nodes);
    for (const [id, node] of updatedNodes) {
      if (node.selected) {
        updatedNodes.set(id, { ...node, selected: false });
      }
    }

    const updatedEdges = new Map(this.state.edges);
    for (const [id, edge] of updatedEdges) {
      if (edge.selected) {
        updatedEdges.set(id, { ...edge, selected: false });
      }
    }

    this.setState({
      ...this.state,
      nodes: updatedNodes,
      edges: updatedEdges,
      selection: { nodes: new Set(), edges: new Set() },
    });
  }

  /**
   * Set viewport
   */
  setViewport(viewport: Partial<CanvasViewportState>): void {
    this.setState({
      ...this.state,
      viewport: { ...this.state.viewport, ...viewport },
    });
  }

  /**
   * Set mode
   */
  setMode(mode: CanvasMode): void {
    this.setState({ ...this.state, mode });
  }

  /**
   * Toggle grid
   */
  toggleGrid(): void {
    this.setState({
      ...this.state,
      grid: { ...this.state.grid, visible: !this.state.grid.visible },
    });
  }

  /**
   * Undo
   */
  undo(): boolean {
    if (this.undoStack.length === 0) return false;

    const previousState = this.undoStack.pop()!;
    this.redoStack.push(this.state);
    this.state = previousState;
    this.notifySubscribers();
    return true;
  }

  /**
   * Redo
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;

    const nextState = this.redoStack.pop()!;
    this.undoStack.push(this.state);
    this.state = nextState;
    this.notifySubscribers();
    return true;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: CanvasState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.state);
    return () => this.subscribers.delete(callback);
  }

  // Private methods

  private createInitialState(): CanvasState {
    return {
      nodes: new Map(),
      edges: new Map(),
      viewport: { x: 0, y: 0, zoom: 1, minZoom: 0.25, maxZoom: 4 },
      grid: { enabled: true, size: 20, snap: true, visible: true },
      selection: { nodes: new Set(), edges: new Set() },
      mode: 'select',
      readonly: false,
      loading: true,
      lastUpdate: Date.now(),
    };
  }

  private setState(newState: CanvasState): void {
    this.state = newState;
    this.notifySubscribers();
  }

  private updateNode(nodeId: string, updates: Partial<CanvasNodeState>): Map<string, CanvasNodeState> {
    const updatedNodes = new Map(this.state.nodes);
    const node = updatedNodes.get(nodeId);
    if (node) {
      updatedNodes.set(nodeId, { ...node, ...updates });
    }
    return updatedNodes;
  }

  private snapToGrid(position: PSFPosition): PSFPosition {
    const size = this.state.grid.size;
    return {
      x: Math.round(position.x / size) * size,
      y: Math.round(position.y / size) * size,
    };
  }

  private saveToUndo(): void {
    this.undoStack.push({ ...this.state });
    if (this.undoStack.length > this.maxUndoHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }

  private handleSchemaChange(change: SchemaChangeEvent): void {
    // Handle external schema changes
    console.log('Schema change:', change);
  }

  private async syncPositionToSchema(nodeId: string, position: PSFPosition): Promise<void> {
    if (!this.syncEngine) return;

    const node = this.state.nodes.get(nodeId);
    if (!node) return;

    const typeMap: Record<CanvasNodeState['type'], 'facts' | 'events' | 'rules' | 'constraints' | 'models' | 'components'> = {
      fact: 'facts',
      event: 'events',
      rule: 'rules',
      constraint: 'constraints',
      model: 'models',
      component: 'components',
      flow: 'facts', // flows not directly supported yet
    };

    const schemaType = typeMap[node.type];
    if (schemaType) {
      try {
        await this.syncEngine.updateNodePosition(schemaType, nodeId, position);
      } catch (error) {
        console.error('Failed to sync position:', error);
      }
    }
  }
}

/**
 * Create canvas state manager
 */
export function createCanvasStateManager(): CanvasStateManager {
  return new CanvasStateManager();
}
