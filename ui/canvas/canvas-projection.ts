/**
 * Canvas Projection
 *
 * Projects PSF schema to canvas representation and vice versa.
 * Handles layout algorithms and visual arrangement.
 */

import type { PSFSchema, PSFPosition } from '../../core/schema-engine/psf.js';
import type { CanvasNodeState } from './canvas-state.js';

/**
 * Layout options
 */
export interface LayoutOptions {
  /** Layout algorithm */
  algorithm: 'auto' | 'hierarchical' | 'force' | 'grid' | 'circular';
  /** Node spacing */
  nodeSpacing: number;
  /** Layer spacing (for hierarchical) */
  layerSpacing: number;
  /** Direction (for hierarchical) */
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  /** Respect existing positions */
  respectExisting: boolean;
  /** Center layout */
  center: boolean;
}

/**
 * Default layout options
 */
const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  algorithm: 'auto',
  nodeSpacing: 150,
  layerSpacing: 200,
  direction: 'LR',
  respectExisting: true,
  center: true,
};

/**
 * Layout result
 */
export interface LayoutResult {
  /** Node positions */
  positions: Map<string, PSFPosition>;
  /** Suggested viewport */
  viewport: { x: number; y: number; zoom: number };
  /** Layout bounds */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Canvas Projection class
 *
 * Handles projection between PSF schema and canvas visualization.
 */
export class CanvasProjection {
  private options: LayoutOptions;

  constructor(options: Partial<LayoutOptions> = {}) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  }

  /**
   * Project PSF schema to canvas layout
   */
  projectSchema(schema: PSFSchema): LayoutResult {
    const nodes = this.extractNodes(schema);
    const edges = this.extractEdges(schema, nodes);

    // Check if we should use existing positions
    if (this.options.respectExisting && this.hasExistingPositions(schema)) {
      return this.useExistingLayout(nodes, edges);
    }

    // Apply layout algorithm
    switch (this.options.algorithm) {
      case 'hierarchical':
        return this.hierarchicalLayout(nodes, edges);
      case 'force':
        return this.forceDirectedLayout(nodes, edges);
      case 'grid':
        return this.gridLayout(nodes);
      case 'circular':
        return this.circularLayout(nodes);
      case 'auto':
      default:
        return this.autoLayout(nodes, edges);
    }
  }

  /**
   * Auto-layout nodes without positions
   */
  autoLayoutMissingPositions(
    existingNodes: Map<string, CanvasNodeState>,
    _schema: PSFSchema
  ): Map<string, PSFPosition> {
    const positions = new Map<string, PSFPosition>();
    const nodesWithoutPositions: string[] = [];

    // Find nodes without explicit positions
    for (const [id, node] of existingNodes) {
      if (!node.hasExplicitPosition) {
        nodesWithoutPositions.push(id);
      } else {
        positions.set(id, node.position);
      }
    }

    if (nodesWithoutPositions.length === 0) {
      return positions;
    }

    // Find bounding box of existing nodes
    let maxX = 0;
    let maxY = 0;
    for (const pos of positions.values()) {
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    }

    // Layout missing nodes in a grid below existing ones
    const startY = maxY + this.options.layerSpacing;
    let col = 0;
    let row = 0;
    const cols = Math.ceil(Math.sqrt(nodesWithoutPositions.length));

    for (const nodeId of nodesWithoutPositions) {
      positions.set(nodeId, {
        x: col * this.options.nodeSpacing,
        y: startY + row * this.options.nodeSpacing,
      });

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    }

    return positions;
  }

  // Private methods

  private extractNodes(
    schema: PSFSchema
  ): Array<{ id: string; type: string; position?: PSFPosition }> {
    const nodes: Array<{ id: string; type: string; position?: PSFPosition }> = [];

    for (const fact of schema.facts) {
      nodes.push({ id: fact.id, type: 'fact', position: fact.position });
    }
    for (const event of schema.events) {
      nodes.push({ id: event.id, type: 'event', position: event.position });
    }
    for (const rule of schema.rules) {
      nodes.push({ id: rule.id, type: 'rule', position: rule.position });
    }
    for (const constraint of schema.constraints) {
      nodes.push({ id: constraint.id, type: 'constraint', position: constraint.position });
    }
    for (const model of schema.models) {
      nodes.push({ id: model.id, type: 'model', position: model.position });
    }
    for (const component of schema.components) {
      nodes.push({ id: component.id, type: 'component', position: component.position });
    }

    return nodes;
  }

  private extractEdges(
    schema: PSFSchema,
    nodes: Array<{ id: string; type: string }>
  ): Array<{ source: string; target: string }> {
    const edges: Array<{ source: string; target: string }> = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Extract rule triggers
    for (const rule of schema.rules) {
      if (rule.triggers) {
        for (const trigger of rule.triggers) {
          const eventNode = schema.events.find((e) => e.tag === trigger);
          if (eventNode && nodeIds.has(eventNode.id)) {
            edges.push({ source: eventNode.id, target: rule.id });
          }
        }
      }
    }

    // Extract model relationships
    for (const model of schema.models) {
      if (model.relationships) {
        for (const rel of model.relationships) {
          const targetModel = schema.models.find((m) => m.name === rel.target);
          if (targetModel && nodeIds.has(targetModel.id)) {
            edges.push({ source: model.id, target: targetModel.id });
          }
        }
      }
    }

    // Extract component bindings
    for (const component of schema.components) {
      if (component.model) {
        const model = schema.models.find((m) => m.name === component.model);
        if (model && nodeIds.has(model.id)) {
          edges.push({ source: component.id, target: model.id });
        }
      }
    }

    return edges;
  }

  private hasExistingPositions(schema: PSFSchema): boolean {
    const hasPos = (items: Array<{ position?: PSFPosition }>): boolean =>
      items.some((item) => item.position && (item.position.x !== 0 || item.position.y !== 0));

    return (
      hasPos(schema.facts) ||
      hasPos(schema.events) ||
      hasPos(schema.rules) ||
      hasPos(schema.constraints) ||
      hasPos(schema.models) ||
      hasPos(schema.components)
    );
  }

  private useExistingLayout(
    nodes: Array<{ id: string; type: string; position?: PSFPosition }>,
    _edges: Array<{ source: string; target: string }>
  ): LayoutResult {
    const positions = new Map<string, PSFPosition>();
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const node of nodes) {
      const pos = node.position || { x: 0, y: 0 };
      positions.set(node.id, pos);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    }

    return {
      positions,
      viewport: { x: 0, y: 0, zoom: 1 },
      bounds: { minX, minY, maxX, maxY },
    };
  }

  private autoLayout(
    nodes: Array<{ id: string; type: string; position?: PSFPosition }>,
    _edges: Array<{ source: string; target: string }>
  ): LayoutResult {
    // Group nodes by type
    const groups: Record<string, Array<{ id: string; type: string }>> = {};
    for (const node of nodes) {
      if (!groups[node.type]) {
        groups[node.type] = [];
      }
      groups[node.type].push(node);
    }

    // Layer order for hierarchical layout
    const layerOrder = ['event', 'rule', 'constraint', 'fact', 'model', 'component'];
    const positions = new Map<string, PSFPosition>();

    let y = 0;
    for (const type of layerOrder) {
      const group = groups[type] || [];
      if (group.length === 0) continue;

      let x = 0;
      for (const node of group) {
        positions.set(node.id, { x, y });
        x += this.options.nodeSpacing;
      }

      y += this.options.layerSpacing;
    }

    // Handle any remaining types
    for (const [type, group] of Object.entries(groups)) {
      if (layerOrder.includes(type)) continue;

      let x = 0;
      for (const node of group) {
        positions.set(node.id, { x, y });
        x += this.options.nodeSpacing;
      }
      y += this.options.layerSpacing;
    }

    return this.finalizeLayout(positions);
  }

  private hierarchicalLayout(
    nodes: Array<{ id: string; type: string; position?: PSFPosition }>,
    edges: Array<{ source: string; target: string }>
  ): LayoutResult {
    // Build adjacency list
    const adjacency = new Map<string, Set<string>>();
    for (const node of nodes) {
      adjacency.set(node.id, new Set());
    }
    for (const edge of edges) {
      adjacency.get(edge.source)?.add(edge.target);
    }

    // Find roots (nodes with no incoming edges)
    const hasIncoming = new Set<string>();
    for (const edge of edges) {
      hasIncoming.add(edge.target);
    }
    const roots = nodes.filter((n) => !hasIncoming.has(n.id));

    // Assign layers using BFS
    const layers = new Map<string, number>();
    const visited = new Set<string>();
    const queue: Array<{ id: string; layer: number }> = roots.map((r) => ({ id: r.id, layer: 0 }));

    while (queue.length > 0) {
      const { id, layer } = queue.shift()!;
      if (visited.has(id)) continue;

      visited.add(id);
      layers.set(id, layer);

      const neighbors = adjacency.get(id) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, layer: layer + 1 });
        }
      }
    }

    // Handle unvisited nodes
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        layers.set(node.id, 0);
      }
    }

    // Position nodes by layer
    const layerNodes = new Map<number, string[]>();
    for (const [id, layer] of layers) {
      if (!layerNodes.has(layer)) {
        layerNodes.set(layer, []);
      }
      layerNodes.get(layer)!.push(id);
    }

    const positions = new Map<string, PSFPosition>();
    for (const [layer, nodeIds] of layerNodes) {
      const layerWidth = nodeIds.length * this.options.nodeSpacing;
      let x = -layerWidth / 2;

      for (const id of nodeIds) {
        const pos = this.getPositionForDirection(layer, x, this.options.direction);
        positions.set(id, pos);
        x += this.options.nodeSpacing;
      }
    }

    return this.finalizeLayout(positions);
  }

  private forceDirectedLayout(
    nodes: Array<{ id: string; type: string; position?: PSFPosition }>,
    edges: Array<{ source: string; target: string }>
  ): LayoutResult {
    // Simple force-directed simulation
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();

    // Initialize with random positions
    for (const node of nodes) {
      positions.set(node.id, {
        x: Math.random() * 500,
        y: Math.random() * 500,
        vx: 0,
        vy: 0,
      });
    }

    const iterations = 100;
    const repulsion = 10000;
    const attraction = 0.1;
    const damping = 0.8;

    for (let i = 0; i < iterations; i++) {
      // Apply repulsion between all pairs
      for (const [id1, pos1] of positions) {
        for (const [id2, pos2] of positions) {
          if (id1 >= id2) continue;

          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const force = repulsion / (dist * dist);

          pos1.vx -= (force * dx) / dist;
          pos1.vy -= (force * dy) / dist;
          pos2.vx += (force * dx) / dist;
          pos2.vy += (force * dy) / dist;
        }
      }

      // Apply attraction along edges
      for (const edge of edges) {
        const pos1 = positions.get(edge.source);
        const pos2 = positions.get(edge.target);
        if (!pos1 || !pos2) continue;

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;

        pos1.vx += attraction * dx;
        pos1.vy += attraction * dy;
        pos2.vx -= attraction * dx;
        pos2.vy -= attraction * dy;
      }

      // Update positions
      for (const pos of positions.values()) {
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.vx *= damping;
        pos.vy *= damping;
      }
    }

    const finalPositions = new Map<string, PSFPosition>();
    for (const [id, pos] of positions) {
      finalPositions.set(id, { x: pos.x, y: pos.y });
    }

    return this.finalizeLayout(finalPositions);
  }

  private gridLayout(
    nodes: Array<{ id: string; type: string; position?: PSFPosition }>
  ): LayoutResult {
    const positions = new Map<string, PSFPosition>();
    const cols = Math.ceil(Math.sqrt(nodes.length));

    let col = 0;
    let row = 0;

    for (const node of nodes) {
      positions.set(node.id, {
        x: col * this.options.nodeSpacing,
        y: row * this.options.nodeSpacing,
      });

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    }

    return this.finalizeLayout(positions);
  }

  private circularLayout(
    nodes: Array<{ id: string; type: string; position?: PSFPosition }>
  ): LayoutResult {
    const positions = new Map<string, PSFPosition>();
    const radius = (nodes.length * this.options.nodeSpacing) / (2 * Math.PI);
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, i) => {
      const angle = i * angleStep;
      positions.set(node.id, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    });

    return this.finalizeLayout(positions);
  }

  private getPositionForDirection(layer: number, offset: number, direction: string): PSFPosition {
    switch (direction) {
      case 'TB':
        return { x: offset, y: layer * this.options.layerSpacing };
      case 'BT':
        return { x: offset, y: -layer * this.options.layerSpacing };
      case 'LR':
        return { x: layer * this.options.layerSpacing, y: offset };
      case 'RL':
        return { x: -layer * this.options.layerSpacing, y: offset };
      default:
        return { x: layer * this.options.layerSpacing, y: offset };
    }
  }

  private finalizeLayout(positions: Map<string, PSFPosition>): LayoutResult {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const pos of positions.values()) {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    }

    // Center if requested
    if (this.options.center) {
      const offsetX = (minX + maxX) / 2;
      const offsetY = (minY + maxY) / 2;

      for (const [id, pos] of positions) {
        positions.set(id, {
          x: pos.x - offsetX,
          y: pos.y - offsetY,
        });
      }

      minX -= offsetX;
      maxX -= offsetX;
      minY -= offsetY;
      maxY -= offsetY;
    }

    return {
      positions,
      viewport: { x: 0, y: 0, zoom: 1 },
      bounds: { minX, minY, maxX, maxY },
    };
  }
}

/**
 * Create a canvas projection instance
 */
export function createCanvasProjection(options?: Partial<LayoutOptions>): CanvasProjection {
  return new CanvasProjection(options);
}
