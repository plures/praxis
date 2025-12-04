/**
 * Praxis Cloud Sync Example
 *
 * Demonstrates cloud synchronization with task management.
 */

import { connectRelay } from '../../dist/cloud/index.js';
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
} from '../../dist/index.js';

// Types
interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

interface TaskContext {
  tasks: Task[];
}

// Define facts and events
const TaskCreated = defineFact<'TaskCreated', { id: string; title: string }>('TaskCreated');
const TaskCompleted = defineFact<'TaskCompleted', { id: string }>('TaskCompleted');
const CreateTask = defineEvent<'CREATE_TASK', { id: string; title: string }>('CREATE_TASK');
const CompleteTask = defineEvent<'COMPLETE_TASK', { id: string }>('COMPLETE_TASK');

// Define rules
const createTaskRule = defineRule<TaskContext>({
  id: 'task.create',
  description: 'Create a new task',
  impl: (state, events) => {
    const event = events.find(CreateTask.is);
    if (event) {
      state.context.tasks.push({
        id: event.payload.id,
        title: event.payload.title,
        completed: false,
        createdAt: Date.now(),
      });
      return [TaskCreated.create(event.payload)];
    }
    return [];
  },
});

const completeTaskRule = defineRule<TaskContext>({
  id: 'task.complete',
  description: 'Complete a task',
  impl: (state, events) => {
    const event = events.find(CompleteTask.is);
    if (event) {
      const task = state.context.tasks.find((t) => t.id === event.payload.id);
      if (task) {
        task.completed = true;
        return [TaskCompleted.create({ id: event.payload.id })];
      }
    }
    return [];
  },
});

// Main
async function main() {
  console.log('Praxis Cloud Sync Example');
  console.log('========================\n');

  // Create engine
  const registry = new PraxisRegistry<TaskContext>();
  registry.registerRule(createTaskRule);
  registry.registerRule(completeTaskRule);

  const engine = createPraxisEngine({
    initialContext: { tasks: [] },
    registry,
  });

  console.log('Connecting to Praxis Cloud...');

  try {
    // Connect to cloud relay
    const relay = await connectRelay(
      process.env.CLOUD_ENDPOINT || 'https://praxis-relay.azurewebsites.net',
      {
        appId: 'cloud-sync-example',
        authToken: process.env.GITHUB_TOKEN,
        autoSync: false, // Manual sync for demo
      }
    );

    console.log('✓ Connected to Praxis Cloud\n');

    // Create some tasks
    console.log('Creating tasks...');
    engine.step([CreateTask.create({ id: '1', title: 'Buy groceries' })]);
    engine.step([CreateTask.create({ id: '2', title: 'Write documentation' })]);
    engine.step([CreateTask.create({ id: '3', title: 'Fix bug #123' })]);

    console.log(`✓ Created ${engine.getContext().tasks.length} tasks\n`);

    // Sync to cloud
    console.log('Syncing to cloud...');
    const state = engine.getState();
    await relay.sync({
      type: 'delta',
      appId: 'cloud-sync-example',
      clock: {},
      facts: state.facts,
      events: [],
      timestamp: Date.now(),
    });

    console.log('✓ Synced to cloud\n');

    // Complete a task
    console.log('Completing task...');
    engine.step([CompleteTask.create({ id: '1' })]);

    // Sync again
    console.log('Syncing changes...');
    const newState = engine.getState();
    await relay.sync({
      type: 'delta',
      appId: 'cloud-sync-example',
      clock: {},
      facts: newState.facts,
      events: [],
      timestamp: Date.now(),
    });

    console.log('✓ Synced changes\n');

    // Get usage metrics
    console.log('Usage Metrics:');
    console.log('-------------');
    const usage = await relay.getUsage();
    console.log(`App ID: ${usage.appId}`);
    console.log(`Syncs: ${usage.syncCount}`);
    console.log(`Events: ${usage.eventCount}`);
    console.log(`Facts: ${usage.factCount}`);
    console.log(`Storage: ${(usage.storageBytes / 1024).toFixed(2)} KB\n`);

    // Get health
    const health = await relay.getHealth();
    console.log('Service Health:');
    console.log('--------------');
    console.log(`Status: ${health.status}`);
    console.log(`Relay: ${health.services.relay ? '✓' : '✗'}`);
    console.log(`Event Grid: ${health.services.eventGrid ? '✓' : '✗'}`);
    console.log(`Storage: ${health.services.storage ? '✓' : '✗'}`);
    console.log(`Auth: ${health.services.auth ? '✓' : '✗'}\n`);

    // Display tasks
    console.log('Current Tasks:');
    console.log('-------------');
    const tasks = engine.getContext().tasks;
    tasks.forEach((task) => {
      const status = task.completed ? '✓' : ' ';
      console.log(`[${status}] ${task.title}`);
    });

    // Disconnect
    await relay.disconnect();
    console.log('\n✓ Disconnected from cloud');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
