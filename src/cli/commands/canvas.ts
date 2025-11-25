/**
 * Canvas Command
 * 
 * Opens the CodeCanvas visual schema editor.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import {
  schemaToCanvas,
  canvasToYaml,
  canvasToMermaid,
  createCanvasEditor,
} from '../../integrations/code-canvas.js';
import { loadSchemaFromFile } from '../../core/schema/loader.js';
import type { PraxisSchema } from '../../core/schema/types.js';

/**
 * Canvas command options
 */
export interface CanvasOptions {
  /** Port for Canvas server */
  port?: string;
  /** Mode (edit, view, present) */
  mode?: 'edit' | 'view' | 'present';
  /** Export format */
  export?: 'yaml' | 'mermaid' | 'json';
  /** Output file for export */
  output?: string;
}

/**
 * Open CodeCanvas for visual editing
 */
export async function canvas(schemaPath: string | undefined, options: CanvasOptions): Promise<void> {
  const port = parseInt(options.port || '3000', 10);
  const mode = options.mode || 'edit';
  
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   CodeCanvas Visual Editor                        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  // If export format is specified, export and exit
  if (options.export) {
    await exportCanvas(schemaPath, options);
    return;
  }
  
  // Load schema if provided
  let schema: PraxisSchema | undefined;
  if (schemaPath && fs.existsSync(schemaPath)) {
    try {
      const result = await loadSchemaFromFile(schemaPath);
      if (result.errors.length > 0) {
        console.error(`Error loading schema: ${result.errors.join(', ')}`);
        process.exit(1);
      }
      schema = result.schema;
      console.log(`✓ Loaded schema: ${schemaPath}`);
    } catch (error) {
      console.error(`Error loading schema: ${error}`);
      process.exit(1);
    }
  }
  
  // Create canvas from schema
  const editor = createCanvasEditor({ schema, layout: 'hierarchical' });
  
  console.log(`\nStarting Canvas server on http://localhost:${port}`);
  console.log(`Mode: ${mode}\n`);
  
  // Start a simple HTTP server for the canvas
  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(generateCanvasHtml(editor.document, mode));
    } else if (req.url === '/api/canvas') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(editor.document));
    } else if (req.url === '/api/mermaid') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(editor.toMermaid());
    } else if (req.url === '/api/yaml') {
      res.writeHead(200, { 'Content-Type': 'text/yaml' });
      res.end(editor.toYaml());
    } else if (req.url === '/api/schema') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(editor.toSchema()));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  server.listen(port, () => {
    console.log('Canvas server running!');
    console.log(`\n  Local:   http://localhost:${port}`);
    console.log(`  Mermaid: http://localhost:${port}/api/mermaid`);
    console.log(`  YAML:    http://localhost:${port}/api/yaml`);
    console.log(`  Schema:  http://localhost:${port}/api/schema\n`);
    console.log('Press Ctrl+C to stop.\n');
  });
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down Canvas server...');
    server.close();
    process.exit(0);
  });
}

/**
 * Export canvas to file
 */
async function exportCanvas(schemaPath: string | undefined, options: CanvasOptions): Promise<void> {
  if (!schemaPath || !fs.existsSync(schemaPath)) {
    console.error('Error: Schema file required for export');
    console.log('Usage: praxis canvas <schema-file> --export yaml --output schema.canvas.yaml');
    process.exit(1);
  }
  
  const result = await loadSchemaFromFile(schemaPath);
  if (result.errors.length > 0 || !result.schema) {
    console.error(`Error loading schema: ${result.errors.join(', ')}`);
    process.exit(1);
  }
  const canvas = schemaToCanvas(result.schema);
  
  let output: string;
  let ext: string;
  
  switch (options.export) {
    case 'yaml':
      output = canvasToYaml(canvas);
      ext = 'yaml';
      break;
    case 'mermaid':
      output = canvasToMermaid(canvas);
      ext = 'mmd';
      break;
    case 'json':
    default:
      output = JSON.stringify(canvas, null, 2);
      ext = 'json';
  }
  
  const outputPath = options.output || `${path.basename(schemaPath, path.extname(schemaPath))}.canvas.${ext}`;
  fs.writeFileSync(outputPath, output);
  
  console.log(`✓ Exported canvas to: ${outputPath}`);
}

/**
 * Generate HTML for canvas viewer
 */
function generateCanvasHtml(document: ReturnType<typeof createCanvasEditor>['document'], mode: string): string {
  const mermaidDiagram = canvasToMermaid({
    id: document.id,
    name: document.name,
    version: document.version,
    nodes: document.nodes,
    edges: document.edges,
  });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeCanvas - ${document.name}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; }
    .header { background: #16213e; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 1.25rem; color: #00d9ff; }
    .header .mode { background: #0f3460; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; }
    .main { padding: 2rem; display: flex; gap: 2rem; }
    .canvas { flex: 1; background: #16213e; border-radius: 8px; padding: 1.5rem; min-height: 500px; }
    .sidebar { width: 300px; }
    .panel { background: #16213e; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .panel h3 { font-size: 0.875rem; color: #00d9ff; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .panel ul { list-style: none; }
    .panel li { padding: 0.5rem 0; border-bottom: 1px solid #0f3460; font-size: 0.875rem; }
    .panel li:last-child { border-bottom: none; }
    .mermaid { background: #fff; border-radius: 8px; padding: 1rem; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .stat { background: #0f3460; padding: 0.75rem; border-radius: 4px; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #00d9ff; }
    .stat-label { font-size: 0.75rem; color: #888; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎨 CodeCanvas - ${document.name}</h1>
    <span class="mode">${mode.toUpperCase()} MODE</span>
  </div>
  <div class="main">
    <div class="canvas">
      <div class="mermaid">
${mermaidDiagram}
      </div>
    </div>
    <div class="sidebar">
      <div class="panel">
        <h3>Statistics</h3>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${document.nodes.filter(n => n.type === 'model').length}</div>
            <div class="stat-label">Models</div>
          </div>
          <div class="stat">
            <div class="stat-value">${document.nodes.filter(n => n.type === 'component').length}</div>
            <div class="stat-label">Components</div>
          </div>
          <div class="stat">
            <div class="stat-value">${document.nodes.filter(n => n.type === 'event').length}</div>
            <div class="stat-label">Events</div>
          </div>
          <div class="stat">
            <div class="stat-value">${document.nodes.filter(n => n.type === 'fact').length}</div>
            <div class="stat-label">Facts</div>
          </div>
        </div>
      </div>
      <div class="panel">
        <h3>Nodes</h3>
        <ul>
          ${document.nodes.map(n => `<li><strong>${n.type}:</strong> ${n.label}</li>`).join('\n          ')}
        </ul>
      </div>
      <div class="panel">
        <h3>Edges</h3>
        <ul>
          ${document.edges.length ? document.edges.map(e => `<li>${e.source} → ${e.target}</li>`).join('\n          ') : '<li>No edges</li>'}
        </ul>
      </div>
    </div>
  </div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'base' });
  </script>
</body>
</html>`;
}
