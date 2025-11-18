# Praxis Cloud Sync Example

This example demonstrates how to use Praxis Cloud Relay for synchronizing data across multiple clients.

## Setup

1. **Initialize Cloud Connection:**

```bash
npx praxis cloud init
```

Follow the wizard to authenticate with GitHub and configure your cloud endpoint.

2. **Run the Example:**

```bash
npm install
npm start
```

## What it Does

This example:
- Connects to Praxis Cloud Relay
- Creates a simple task management application
- Syncs tasks across multiple clients using CRDT protocol
- Tracks usage metrics

## Code Overview

```typescript
import { connectRelay } from "@plures/praxis/cloud";
import { createPraxisEngine, PraxisRegistry } from "@plures/praxis";

// Connect to cloud
const relay = await connectRelay("https://praxis-relay.azurewebsites.net", {
  appId: "task-app",
  authToken: process.env.GITHUB_TOKEN,
  autoSync: true,
  syncInterval: 5000
});

// Define facts and events
const TaskCreated = defineFact<"TaskCreated", { id: string; title: string }>("TaskCreated");
const CreateTask = defineEvent<"CREATE_TASK", { id: string; title: string }>("CREATE_TASK");

// Create engine and handle events
const engine = createPraxisEngine({
  initialContext: { tasks: [] },
  registry
});

// Sync on state change
engine.on("stateChange", async (state) => {
  await relay.sync({
    type: "delta",
    appId: "task-app",
    clock: {},
    facts: state.facts,
    events: [],
    timestamp: Date.now()
  });
});
```

## Files

- `index.ts` - Main application code
- `package.json` - Dependencies
- `README.md` - This file

## Learn More

- [Praxis Cloud Documentation](../../src/cloud/README.md)
- [Praxis Framework](../../README.md)
