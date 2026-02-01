# @plures/praxis-cloud

Cloud synchronization and relay server for the Praxis application framework. Enables distributed applications with real-time sync and collaboration.

## Overview

`praxis-cloud` provides:

- **Cloud Relay**: WebSocket-based relay server for real-time communication
- **Sync Protocol**: Distributed state synchronization
- **Conflict Resolution**: Automatic conflict resolution for concurrent edits
- **Offline Support**: Queue and sync operations when reconnected
- **Multi-Tenant**: Support for isolated tenants and workspaces

## Installation

```bash
npm install @plures/praxis-cloud
```

## Usage

### Cloud Relay Server

```typescript
import { createCloudRelay } from '@plures/praxis-cloud';

const relay = await createCloudRelay({
  port: 3000,
  auth: {
    enabled: true,
    provider: 'github',
  },
  storage: {
    type: 'memory', // or 'redis', 'postgres'
  },
});

await relay.start();
console.log('Cloud relay running on port 3000');
```

### Client-Side Sync

```typescript
import { createSyncClient } from '@plures/praxis-cloud';
import { createPraxisEngine } from '@plures/praxis-core';

const engine = createPraxisEngine({
  initialContext: {},
  rules: [],
});

const client = await createSyncClient({
  url: 'wss://relay.example.com',
  engine,
  channel: 'my-app',
  auth: {
    token: 'your-auth-token',
  },
});

// Auto-sync engine state
await client.connect();

// Dispatch events (automatically synced)
engine.step([MyEvent.create({})]);

// Subscribe to remote changes
client.on('sync', (state) => {
  console.log('State synced:', state);
});
```

### Distributed State

```typescript
import { createDistributedEngine } from '@plures/praxis-cloud';

const engine = await createDistributedEngine({
  initialContext: {},
  rules: [],
  relay: {
    url: 'wss://relay.example.com',
    channel: 'shared-workspace',
  },
  identity: {
    nodeId: 'node-1',
    userId: 'user-123',
  },
});

// State changes are automatically synchronized across all connected nodes
engine.step([MyEvent.create({})]);

// Subscribe to remote updates
engine.on('remote-update', (update) => {
  console.log('Remote update:', update);
});
```

### Offline Queue

```typescript
import { createOfflineQueue } from '@plures/praxis-cloud';

const queue = createOfflineQueue({
  storage: 'indexeddb', // or 'localstorage', 'memory'
});

// Queue operations when offline
queue.enqueue({
  type: 'event',
  payload: MyEvent.create({}),
});

// Automatically sync when reconnected
queue.on('online', async () => {
  await queue.flush();
});
```

## API Reference

### `createCloudRelay(config)`

Create a cloud relay server.

**Parameters:**
- `config.port`: Server port
- `config.auth`: Authentication configuration
- `config.storage`: Storage backend configuration
- `config.channels`: Channel configuration

**Returns:** `Promise<CloudRelay>` - Relay server instance

### `createSyncClient(config)`

Create a sync client for connecting to a cloud relay.

**Parameters:**
- `config.url`: Relay server URL
- `config.engine`: Praxis engine to sync
- `config.channel`: Channel to join
- `config.auth`: Authentication credentials

**Returns:** `Promise<SyncClient>` - Sync client instance

### `createDistributedEngine(config)`

Create a distributed Praxis engine with automatic sync.

**Parameters:**
- `config.initialContext`: Initial context state
- `config.rules`: Rules to register
- `config.relay`: Relay configuration
- `config.identity`: Node identity

**Returns:** `Promise<DistributedEngine>` - Distributed engine instance

## Configuration

### Relay Server Configuration

```typescript
{
  port: 3000,
  host: '0.0.0.0',
  
  // Authentication
  auth: {
    enabled: true,
    provider: 'github' | 'oauth' | 'custom',
    secret: 'your-secret-key',
  },
  
  // Storage backend
  storage: {
    type: 'memory' | 'redis' | 'postgres',
    connection: 'redis://localhost:6379',
  },
  
  // Channels
  channels: {
    maxSubscribers: 100,
    messageLimit: 1000,
  },
  
  // Sync options
  sync: {
    conflictResolution: 'last-write-wins' | 'custom',
    batchSize: 100,
    interval: 1000, // ms
  },
}
```

### Client Configuration

```typescript
{
  url: 'wss://relay.example.com',
  channel: 'my-app',
  
  // Authentication
  auth: {
    token: 'your-auth-token',
    // or
    provider: async () => {
      return await fetchToken();
    },
  },
  
  // Reconnection
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    delay: 1000, // ms
  },
  
  // Offline support
  offline: {
    enabled: true,
    storage: 'indexeddb',
    queueSize: 1000,
  },
}
```

## Examples

### Real-Time Collaboration

```typescript
import { createDistributedEngine } from '@plures/praxis-cloud';
import { defineRule, defineEvent } from '@plures/praxis-core';

const TextUpdated = defineEvent<'TEXT_UPDATED', { content: string }>('TEXT_UPDATED');

const engine = await createDistributedEngine({
  initialContext: { text: '' },
  rules: [
    defineRule({
      id: 'update-text',
      impl: (state, events) => {
        const evt = events.find(TextUpdated.is);
        if (evt) {
          state.context.text = evt.payload.content;
        }
        return [];
      },
    }),
  ],
  relay: {
    url: 'wss://relay.example.com',
    channel: 'collaborative-doc',
  },
});

// Updates are synced to all connected clients
engine.step([TextUpdated.create({ content: 'Hello, world!' })]);
```

### Offline-First Chat

See [examples/offline-chat](../../examples/offline-chat) for a complete example.

## Deployment

### Deploy to Azure

```bash
# Using Azure CLI
az webapp create --name my-praxis-relay --resource-group my-rg
az webapp deployment source config-zip --src relay.zip
```

### Deploy to AWS

```bash
# Using AWS SAM
sam build
sam deploy --guided
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```bash
docker build -t praxis-relay .
docker run -p 3000:3000 praxis-relay
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Run relay server locally
npm run relay
```

## License

MIT - See [LICENSE](../../LICENSE) for details

## Related Packages

- `@plures/praxis-core`: Core logic library
- `@plures/praxis`: Main package (re-exports from all packages)
- `@plures/praxis-cli`: Command-line interface
- `@plures/praxis-svelte`: Svelte 5 integration

## Links

- [Main Documentation](../../docs/README.md)
- [Cloud Integration Guide](../../docs/guides/cloud-sync.md)
- [Getting Started](../../docs/guides/getting-started.md)
