import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyImplementation } from './verify-fsm-implementation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const WS_PORT = 3001;

const PROJECT_ROOT = process.cwd();
const CANVAS_JSON_PATH =
  process.env.PRAXIS_CANVAS_PATH || path.join(PROJECT_ROOT, 'praxis.canvas.json');
const HTML_TEMPLATE_PATH = path.join(__dirname, '../template/index.html');

// Default to a standard structure, or use env var
const RULES_DIR = process.env.PRAXIS_RULES_DIR
  ? path.resolve(process.env.PRAXIS_RULES_DIR)
  : path.join(PROJECT_ROOT, 'src/rules');
const SCAFFOLD_DIR = path.join(RULES_DIR, 'scaffolded');
const INDEX_FILE = path.join(RULES_DIR, 'index.ts');

// Ensure scaffold directory exists if we are going to use it
// We'll check existence before writing

// WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`\n🔌 WebSocket Server running at ws://localhost:${WS_PORT}`);

function broadcastAnalysis() {
  try {
    const { missingHandlers, emptyHandlers } = verifyImplementation();
    const events = [
      ...missingHandlers.map((h) => ({ type: h, status: 'unhandled' })),
      ...emptyHandlers.map((h) => ({ type: h, status: 'empty' })),
    ];

    const msg = JSON.stringify({
      type: 'LOGIC_INSPECTION',
      events,
    });

    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  } catch (e) {
    console.error('Analysis failed:', e);
  }
}

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  // Send initial analysis
  setTimeout(broadcastAnalysis, 1000);

  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      // Broadcast to all other clients (e.g. Extension -> Canvas, or Canvas -> Extension)
      wss.clients.forEach((client: WebSocket) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

async function startServer() {
  if (!fs.existsSync(CANVAS_JSON_PATH)) {
    console.error(`Error: Canvas data not found at ${CANVAS_JSON_PATH}`);
    console.error('Please ensure you have generated the canvas schema.');
    // Don't exit, just warn, so the server can still start (maybe for other features)
    // process.exit(1);
  }

  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      try {
        let canvasData: any = { nodes: [], edges: [] };
        if (fs.existsSync(CANVAS_JSON_PATH)) {
          canvasData = JSON.parse(fs.readFileSync(CANVAS_JSON_PATH, 'utf-8'));
        }

        let html = fs.readFileSync(HTML_TEMPLATE_PATH, 'utf-8');

        // Transform Praxis Canvas format to Cytoscape format
        const nodes = canvasData.nodes.map((n: any) => {
          const { id: dataId, ...restData } = n.data || {};
          return {
            data: {
              ...restData,
              originalId: dataId,
              id: n.id,
              label: n.label,
              type: n.type,
              parent: n.id.includes('.') ? n.id.split('.')[0] : undefined, // Group by domain
            },
            position: n.position,
          };
        });

        // Create parent nodes for domains
        const domains = new Set<string>();
        nodes.forEach((n: any) => {
          if (n.data.parent) domains.add(n.data.parent);
        });

        const parentNodes = Array.from(domains).map((domain) => ({
          data: {
            id: domain,
            label: domain.toUpperCase(),
            type: 'domain',
          },
        }));

        const cyElements = [
          ...parentNodes,
          ...nodes,
          ...canvasData.edges.map((e: any) => ({
            data: {
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.label,
              type: e.type,
            },
          })),
        ];

        // Inject data
        html = html.replace('window.CANVAS_DATA', JSON.stringify(cyElements));

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    } else if (req.url === '/api/analyze' && req.method === 'POST') {
      broadcastAnalysis();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else if (req.url === '/api/save' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const positions = JSON.parse(body);
          if (!fs.existsSync(CANVAS_JSON_PATH)) {
            throw new Error('Canvas file not found');
          }
          const canvasData = JSON.parse(fs.readFileSync(CANVAS_JSON_PATH, 'utf-8'));

          // Update positions
          for (const node of canvasData.nodes) {
            if (positions[node.id]) {
              node.position = positions[node.id];
            }
          }

          fs.writeFileSync(CANVAS_JSON_PATH, JSON.stringify(canvasData, null, 2));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          console.error(err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to save' }));
        }
      });
    } else if (req.url === '/api/rules' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk.toString()));
      req.on('end', async () => {
        try {
          if (!fs.existsSync(SCAFFOLD_DIR)) {
            fs.mkdirSync(SCAFFOLD_DIR, { recursive: true });
          }

          const { id, description, triggers } = JSON.parse(body);
          const safeName = id.replace(/\./g, '_');
          const fileName = `${safeName}.ts`;
          const filePath = path.join(SCAFFOLD_DIR, fileName);

          const content = `
import { defineRule } from '@plures/praxis';
// Note: You may need to adjust this import based on your project structure
import type { ApplicationEngineContext } from '../../engine.js';

/**
 * ${description || id}
 */
export const ${safeName} = defineRule<ApplicationEngineContext>({
  id: '${id}',
  description: '${description || id}',
  meta: {
    triggers: ${JSON.stringify(triggers || [])},
  },
  impl: (state, events) => {
    // TODO: Implement rule logic
    return [];
  },
});
`;
          fs.writeFileSync(filePath, content.trim());

          // Update index.ts
          if (fs.existsSync(INDEX_FILE)) {
            let indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
            const exportLine = `export * from './scaffolded/${safeName}.js';`;
            if (!indexContent.includes(exportLine)) {
              fs.appendFileSync(INDEX_FILE, `\n${exportLine}`);
            }
          }

          // Regenerate schema
          // This assumes a script exists in the user's package.json
          const { exec } = await import('child_process');
          exec('npm run generate:schema', (error, _stdout, _stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              // Don't fail the request if schema gen fails, just warn
              // res.writeHead(500);
              // res.end(JSON.stringify({ error: 'Failed to regenerate schema' }));
              // return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
        } catch (err) {
          console.error(err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to create rule' }));
        }
      });
    } else if (req.url === '/api/connections' && req.method === 'POST') {
      // Connection logic omitted for brevity in this portable version
      // as it requires complex file finding logic that depends on project structure.
      // In a full implementation, we would use the AST analyzer to find the files.
      res.writeHead(501);
      res.end(JSON.stringify({ error: 'Not implemented in portable version' }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`\n🎨 Praxis Canvas running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop.\n');
  });
}

startServer();
