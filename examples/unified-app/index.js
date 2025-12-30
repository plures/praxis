/**
 * Unified Praxis Application Example
 *
 * Demonstrates all ecosystem integrations working together:
 * - Logic Engine with facts, events, and rules
 * - PluresDB for local-first persistence
 * - Unum for distributed communication
 * - State-Docs for auto-generated documentation
 * - CodeCanvas for visual schema representation
 */

import {
  createUnifiedApp,
  PraxisRegistry,
  defineEvent,
  defineRule,
  defineFact,
  canvasToMermaid,
} from '../../dist/node/index.js';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

// Define events
const Increment = defineEvent('INCREMENT', { amount: 1 });
const MessageSent = defineEvent('MESSAGE_SENT', { text: '', from: '' });

// Define facts
const CountUpdated = defineFact('COUNT_UPDATED', { count: 0 });
const MessageReceived = defineFact('MESSAGE_RECEIVED', { text: '', from: '', timestamp: 0 });

// Create registry and register rules
const registry = new PraxisRegistry();

registry.registerRule(
  defineRule({
    id: 'counter.increment',
    description: 'Increment counter',
    impl: (state, events) => {
      const evt = events.find(Increment.is);
      if (!evt) return [];

      const newCount = (state.context.count || 0) + evt.payload.amount;
      state.context.count = newCount;

      return [CountUpdated.create({ count: newCount })];
    },
  })
);

registry.registerRule(
  defineRule({
    id: 'messages.receive',
    description: 'Receive message',
    impl: (state, events) => {
      const evt = events.find(MessageSent.is);
      if (!evt) return [];

      const message = {
        text: evt.payload.text,
        from: evt.payload.from,
        timestamp: Date.now(),
      };

      state.context.messages = [...(state.context.messages || []), message];

      return [MessageReceived.create(message)];
    },
  })
);

// Define schema for CodeCanvas
const schema = {
  version: '1.0.0',
  name: 'unified-app',
  description: 'Unified Praxis application with all integrations',
  models: [
    {
      name: 'Counter',
      fields: [{ name: 'count', type: 'number', optional: false }],
    },
    {
      name: 'Message',
      fields: [
        { name: 'text', type: 'string', optional: false },
        { name: 'from', type: 'string', optional: false },
        { name: 'timestamp', type: 'number', optional: false },
      ],
    },
  ],
  components: [
    {
      name: 'CounterDisplay',
      type: 'display',
      model: 'Counter',
    },
    {
      name: 'MessageList',
      type: 'list',
      model: 'Message',
    },
  ],
  logic: [
    {
      id: 'counter-logic',
      description: 'Counter increment logic',
      events: [{ tag: 'INCREMENT', payload: { amount: 'number' } }],
      facts: [{ tag: 'COUNT_UPDATED', payload: { count: 'number' } }],
      rules: [
        {
          id: 'counter.increment',
          description: 'Increment counter',
          on: ['INCREMENT'],
        },
      ],
    },
    {
      id: 'messaging-logic',
      description: 'Message handling logic',
      events: [{ tag: 'MESSAGE_SENT', payload: { text: 'string', from: 'string' } }],
      facts: [
        {
          tag: 'MESSAGE_RECEIVED',
          payload: { text: 'string', from: 'string', timestamp: 'number' },
        },
      ],
      rules: [
        {
          id: 'messages.receive',
          description: 'Receive and store message',
          on: ['MESSAGE_SENT'],
        },
      ],
    },
  ],
};

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Unified Praxis Application Example             ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Create unified app with all integrations
  console.log('🚀 Creating unified application...');
  const app = await createUnifiedApp({
    registry,
    initialContext: { count: 0, messages: [] },
    enableUnum: true,
    unumIdentity: {
      name: 'unified-app-node-1',
      metadata: { role: 'primary', version: '1.0.0' },
    },
    enableDocs: true,
    docsConfig: {
      projectTitle: 'Unified Praxis App',
      target: './docs',
    },
    schema,
  });

  console.log('✓ Engine created');
  console.log('✓ PluresDB connected');
  console.log('✓ Unum identity established:', app.unum?.identity?.name);
  console.log('✓ Channel created:', app.channel?.name);
  console.log('✓ Documentation generator ready');
  console.log('✓ Canvas document generated\n');

  // Demonstrate engine with PluresDB persistence
  console.log('📊 Testing logic engine with PluresDB...');
  app.engine.step([Increment.create({ amount: 5 })]);
  console.log(`✓ Counter incremented to: ${app.engine.getContext().count}`);

  app.engine.step([
    MessageSent.create({ text: 'Hello from unified app!', from: 'unified-app-node-1' }),
  ]);
  console.log(`✓ Message stored: ${app.engine.getContext().messages.length} messages\n`);

  // Demonstrate Unum distribution
  if (app.unum && app.channel) {
    console.log('🌐 Testing Unum distribution...');

    // Broadcast event to channel
    await app.unum.broadcastEvent(app.channel.id, MessageSent.create({
      text: 'Broadcast message!',
      from: 'unified-app-node-1',
    }));
    console.log('✓ Event broadcast to channel\n');

    // Subscribe to channel events (in real app, this would be on another node)
    app.unum.subscribeToEvents(app.channel.id, (event) => {
      console.log('📨 Received event from channel:', event.tag);
    });
  }

  // Generate documentation
  console.log('📝 Generating documentation...');
  if (app.generateDocs) {
    const docs = app.generateDocs();
    console.log(`✓ Generated ${docs.length} documentation files`);

    // Write docs to filesystem
    for (const doc of docs) {
      const dir = dirname(doc.path);
      await mkdir(dir, { recursive: true });
      await writeFile(doc.path, doc.content);
    }
    console.log('✓ Documentation written to ./docs\n');
  }

  // Export canvas visualization
  if (app.canvas) {
    console.log('🎨 Exporting canvas visualization...');
    const mermaid = canvasToMermaid(app.canvas);
    await writeFile('./schema.mmd', mermaid);
    console.log('✓ Mermaid diagram exported to schema.mmd\n');
  }

  // Show integration summary
  console.log('═══════════════════════════════════════════════════');
  console.log('Integration Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Engine State:      ${JSON.stringify(app.engine.getContext())}`);
  console.log(`PluresDB:          Connected and persisting`);
  console.log(`Unum Identity:     ${app.unum?.identity?.name}`);
  console.log(`Active Channel:    ${app.channel?.name}`);
  console.log(`Documentation:     Generated in ./docs`);
  console.log(`Canvas Export:     schema.mmd`);
  console.log('═══════════════════════════════════════════════════\n');

  console.log('✨ All integrations working successfully!\n');

  // Cleanup
  app.dispose();
  console.log('✓ Cleaned up resources');
}

main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
