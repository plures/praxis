/**
 * Canvas Command
 *
 * Opens the CodeCanvas visual schema editor.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { spawn } from 'child_process';
import {
  schemaToCanvas,
  canvasToYaml,
  canvasToMermaid,
  createCanvasEditor,
} from '../../integrations/code-canvas.js';
import { loadSchemaFromFile } from '../../core/schema/loader.js';
import type { PSFSchema } from '../../../core/schema-engine/psf.js';

// ── Legacy schema types (pre-PSF format) ─────────────────────────────────────

interface LegacyEventRef {
  name: string;
}

interface LegacyRule {
  id?: string;
  name?: string;
  on?: string[];
  do?: string | string[];
  meta?: Record<string, unknown>;
  triggers?: string[];
  logic?: { events?: string[] };
}

interface LegacyFact {
  id?: string;
  name?: string;
}

interface LegacyLogicGroup {
  id?: string;
  description?: string;
  rules?: LegacyRule[];
  facts?: LegacyFact[];
  events?: (string | LegacyEventRef)[];
  constraints?: unknown[];
}

interface LegacySchema {
  logic?: LegacyLogicGroup[];
  events?: unknown[];
  version?: string;
}

interface CanvasConnection {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
}

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
export async function canvas(
  schemaPath: string | undefined,
  options: CanvasOptions
): Promise<void> {
  const port = parseInt(options.port || '3000', 10);
  // const mode = options.mode || 'edit'; // Unused

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   CodeCanvas Visual Editor                        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // If export format is specified, export and exit
  if (options.export) {
    await exportCanvas(schemaPath, options);
    return;
  }

  // Load schema if provided
  let schema: PSFSchema | undefined;
  if (schemaPath && fs.existsSync(schemaPath)) {
    try {
      const result = await loadSchemaFromFile(schemaPath);
      if (result.errors.length > 0) {
        console.error(`Error loading schema: ${result.errors.join(', ')}`);
        process.exit(1);
      }
      const loadedSchema = result.schema as unknown as LegacySchema & PSFSchema;
      console.log('Loaded schema keys:', Object.keys(loadedSchema));
      console.log('Has logic:', !!loadedSchema.logic);
      console.log('Has events:', !!loadedSchema.events);

      // Convert legacy schema to PSFSchema if needed
      if (loadedSchema.logic && !loadedSchema.events) {
        console.log('Converting legacy schema to PSF format...');
        console.log(`Found ${loadedSchema.logic.length} logic groups.`);

        // 1. Extract Rules and ensure IDs, tagging them with their source flow
        const rules: LegacyRule[] = [];
        const flows: Array<{ id: string; name: string; type: string; steps: unknown[]; description?: string }> = [];

        loadedSchema.logic?.forEach((l: LegacyLogicGroup) => {
          const flowId = l.id ?? 'default-flow';
          console.log(`Processing flow: ${flowId}`);
          flows.push({
            id: flowId,
            name: l.description || flowId,
            type: 'sequence',
            steps: [], // Populated implicitly by rules for now
            description: l.description,
          });

          (l.rules ?? []).forEach((r: LegacyRule) => {
            rules.push({
              ...r,
              id: r.id ?? r.name,
              triggers: r.on,
              meta: { ...r.meta, flowId: flowId },
            });
          });
        });

        // Extract Facts and ensure IDs
        const facts = (loadedSchema.logic ?? [])
          .flatMap((l: LegacyLogicGroup) => l.facts ?? [])
          .map((f: LegacyFact) => ({
            ...f,
            id: f.id ?? f.name,
          }));

        // 2. Infer Models from Rules
        const inferredModels = new Map<string, Record<string, unknown>>();

        // Always ensure core models exist for Azure DevOps Integration
        inferredModels.set('Connection', {
          id: 'Connection',
          name: 'Connection',
          description: 'Azure DevOps Connection',
          properties: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'orgUrl', type: 'string' },
            { name: 'project', type: 'string' },
            { name: 'token', type: 'string' },
          ],
        });

        inferredModels.set('WorkItem', {
          id: 'WorkItem',
          name: 'WorkItem',
          description: 'Azure DevOps Work Item',
          properties: [
            { name: 'id', type: 'number' },
            { name: 'title', type: 'string' },
            { name: 'state', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'assignedTo', type: 'string' },
          ],
        });

        // 3. Extract Events Aggressively
        const eventSet = new Set<string>();
        // From explicit events list
        (loadedSchema.logic ?? []).forEach((l: LegacyLogicGroup) => {
          (l.events ?? []).forEach((e) => eventSet.add(typeof e === 'string' ? e : e.name));
        });
        // From rules
        rules.forEach((r: LegacyRule) => {
          (r.on ?? []).forEach((e: string) => eventSet.add(e));
          if (r.logic?.events) {
            r.logic.events.forEach((e: string) => eventSet.add(e));
          }
        });

        // 4. Generate Connections
        const connections: CanvasConnection[] = [];
        const factMap = new Map(facts.map((f: LegacyFact) => [f.name, f.id]));

        rules.forEach((r: LegacyRule) => {
          const ruleId = r.id ?? r.name ?? 'unknown';
          // Event -> Rule
          (r.on ?? []).forEach((e: string) => {
            connections.push({
              id: `conn_evt_${e}_${ruleId}`,
              source: e,
              target: ruleId,
              type: 'event',
              label: 'triggers',
            });
          });

          // Rule -> Fact (Heuristic)
          if (r.do) {
            const doStrs = Array.isArray(r.do) ? r.do : [r.do];
            doStrs.forEach((action: string) => {
              factMap.forEach((factId, factName) => {
                if (typeof action === 'string' && action.includes(factName as string) && factId) {
                  connections.push({
                    id: `conn_act_${ruleId}_${factId}`,
                    source: ruleId,
                    target: factId,
                    type: 'control',
                    label: 'updates',
                  });
                }
              });
            });
          }
        });

        schema = {
          $version: loadedSchema.version || '1.0.0',
          id: loadedSchema.name || 'schema',
          name: loadedSchema.name,
          description: loadedSchema.description,
          models: [...(loadedSchema.models || []), ...inferredModels.values()],
          components: loadedSchema.components || [],
          events: Array.from(eventSet).map((name) => ({
            id: name,
            tag: name,
            name: name,
            payload: { type: 'object', properties: {} },
          })),
          facts: facts,
          rules: rules,
          constraints: (loadedSchema.logic ?? []).flatMap((l: LegacyLogicGroup) => l.constraints ?? []),
          flows: flows,
          canvas: {
            connections: connections,
          },
          metadata: loadedSchema.metadata,
        } as unknown as PSFSchema;
      } else {
        schema = loadedSchema as unknown as PSFSchema;
      }
      console.log(`✓ Loaded schema: ${schemaPath}`);
    } catch (error) {
      console.error(`Error loading schema: ${error}`);
      process.exit(1);
    }
  }

  // Create canvas from schema
  const editor = createCanvasEditor({ schema, layout: 'hierarchical' });

  console.log(`\nStarting Canvas API server on http://localhost:${port}`);

  // Start a simple HTTP server for the canvas API
  const server = http.createServer((req, res) => {
    // Enable CORS for Vite dev server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === '/api/canvas') {
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
    console.log('Canvas API server running!');

    // Start Vite to serve the UI
    console.log('Starting UI...');
    const vitePort = 5173;

    // Use npm exec to run vite from the praxis directory context
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'cmd.exe' : 'npm';
    const args = isWin
      ? [
          '/d',
          '/s',
          '/c',
          'npm',
          'exec',
          '--prefix',
          'praxis',
          'vite',
          'praxis/ui/canvas',
          '--',
          '--port',
          vitePort.toString(),
        ]
      : [
          'exec',
          '--prefix',
          'praxis',
          'vite',
          'praxis/ui/canvas',
          '--',
          '--port',
          vitePort.toString(),
        ];

    const vite = spawn(cmd, args, {
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, API_URL: `http://localhost:${port}` },
    });
    console.log(`\n  UI:      http://localhost:${vitePort}`);
    console.log(`  API:     http://localhost:${port}/api/canvas`);
    console.log('Press Ctrl+C to stop.\n');

    vite.on('close', (code) => {
      console.log(`UI process exited with code ${code}`);
      server.close();
      process.exit(code || 0);
    });
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
  const loadedSchema = result.schema as unknown as LegacySchema & PSFSchema;
  let schema: PSFSchema;

  if (loadedSchema.logic && !loadedSchema.events) {
    console.log('Converting legacy schema to PSF format...');

    // 1. Extract Rules and ensure IDs, tagging them with their source flow
    const rules: LegacyRule[] = [];
    const flows: Array<{ id: string; name: string; type: string; steps: unknown[]; description?: string }> = [];

    (loadedSchema.logic ?? []).forEach((l: LegacyLogicGroup) => {
      const flowId = l.id ?? 'default-flow';
      flows.push({
        id: flowId,
        name: l.description ?? flowId,
        type: 'sequence',
        steps: [], // Populated implicitly by rules for now
        description: l.description,
      });

      (l.rules ?? []).forEach((r: LegacyRule) => {
        rules.push({
          ...r,
          id: r.id ?? r.name,
          triggers: r.on,
          meta: { ...r.meta, flowId: flowId },
        });
      });
    });

    // Extract Facts and ensure IDs
    const facts = (loadedSchema.logic ?? [])
      .flatMap((l: LegacyLogicGroup) => l.facts ?? [])
      .map((f: LegacyFact) => ({
        ...f,
        id: f.id ?? f.name,
      }));

    // 2. Infer Models from Rules
    const inferredModels = new Map<string, Record<string, unknown>>();

    // Always ensure core models exist for Azure DevOps Integration
    inferredModels.set('Connection', {
      id: 'Connection',
      name: 'Connection',
      description: 'Azure DevOps Connection',
      properties: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'orgUrl', type: 'string' },
        { name: 'project', type: 'string' },
        { name: 'token', type: 'string' },
      ],
    });

    inferredModels.set('WorkItem', {
      id: 'WorkItem',
      name: 'WorkItem',
      description: 'Azure DevOps Work Item',
      properties: [
        { name: 'id', type: 'number' },
        { name: 'title', type: 'string' },
        { name: 'state', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'assignedTo', type: 'string' },
      ],
    });

    // 3. Extract Events Aggressively
    const eventSet = new Set<string>();
    // From explicit events list
    (loadedSchema.logic ?? []).forEach((l: LegacyLogicGroup) => {
      (l.events ?? []).forEach((e) => eventSet.add(typeof e === 'string' ? e : e.name));
    });
    // From rules
    rules.forEach((r: LegacyRule) => {
      (r.on ?? []).forEach((e: string) => eventSet.add(e));
      if (r.logic?.events) {
        r.logic.events.forEach((e: string) => eventSet.add(e));
      }
    });

    schema = {
      $version: loadedSchema.version || '1.0.0',
      id: loadedSchema.name || 'schema',
      name: loadedSchema.name,
      description: loadedSchema.description,
      models: [...(loadedSchema.models || []), ...inferredModels.values()],
      components: loadedSchema.components || [],
      events: Array.from(eventSet).map((name) => ({
        id: name,
        tag: name,
        name: name,
        payload: { type: 'object', properties: {} },
      })),
      facts: facts,
      rules: rules,
      constraints: (loadedSchema.logic ?? []).flatMap((l: LegacyLogicGroup) => l.constraints ?? []),
      flows: flows,
      metadata: loadedSchema.metadata,
    } as unknown as PSFSchema;
  } else {
    schema = loadedSchema as unknown as PSFSchema;
  }
  const canvas = schemaToCanvas(schema);

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

  const outputPath =
    options.output || `${path.basename(schemaPath, path.extname(schemaPath))}.canvas.${ext}`;
  fs.writeFileSync(outputPath, output);

  console.log(`✓ Exported canvas to: ${outputPath}`);
}
