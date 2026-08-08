# Cloud Sync + Auth Workflow

Learn how to synchronize Praxis state across multiple devices using Praxis Cloud, with an authentication flow that gates access to shared data.

**Time:** 20–25 minutes  
**Level:** Intermediate  
**Prerequisites:** [Getting Started tutorial](./getting-started.md)

## What You'll Build

A notes application that:

- Authenticates users before granting access
- Syncs notes across clients via Praxis Cloud relay
- Handles conflicts with CRDT resolution
- Works offline and reconciles on reconnect

## Step 1: Project Setup

```bash
mkdir praxis-cloud-notes && cd praxis-cloud-notes
npm init -y
npm install @plures/praxis @plures/pluresdb
npm install -D typescript @types/node
```

## Step 2: Define the Auth Schema

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

// Auth state
const AuthState = definePath<{
  status: 'anonymous' | 'authenticating' | 'authenticated' | 'error';
  userId: string | null;
  token: string | null;
  error: string | null;
}>('auth', {
  status: 'anonymous',
  userId: null,
  token: null,
  error: null,
});

// Application data — gated behind auth
const Notes = definePath<{ id: string; text: string; updatedAt: number }[]>('notes', []);
const SyncStatus = definePath<'idle' | 'syncing' | 'error'>('syncStatus', 'idle');
```

## Step 3: Auth Rules

```ts
// Rule — transition auth state machine on login attempt
const processLogin = defineRule({
  id: 'auth.processLogin',
  watch: ['auth'],
  evaluate: (values) => {
    const auth = values['auth'] as { status: string };
    if (auth.status !== 'authenticating') return RuleResult.noop();

    // In production this would call your auth service
    return RuleResult.emit([fact('auth.tokenReceived', { token: 'jwt-token-here' })]);
  },
});

// Rule — enforce session expiry
const sessionExpiry = defineRule({
  id: 'auth.sessionExpiry',
  watch: ['auth'],
  evaluate: (values) => {
    const auth = values['auth'] as { status: string; token: string | null };
    if (auth.status !== 'authenticated' || !auth.token) return RuleResult.noop();

    // Check expiry (simplified — in production decode JWT)
    const expired = false; // placeholder
    if (expired) {
      return RuleResult.emit([fact('auth.sessionExpired', {})]);
    }
    return RuleResult.noop();
  },
});
```

## Step 4: Constraint — Gate Data Access

```ts
// Only authenticated users can modify notes
const requireAuth = defineConstraint({
  id: 'notes.requireAuth',
  description: 'User must be authenticated to modify notes',
  watch: ['notes', 'auth'],
  validate: (values) => {
    const auth = values['auth'] as { status: string };
    return auth.status === 'authenticated' || 'Authentication required';
  },
});
```

## Step 5: Cloud Sync with PluresDB

```ts
import { connectRelay } from '@plures/praxis/cloud';

// Create the app
const app = createApp({
  name: 'cloud-notes',
  schema: [AuthState, Notes, SyncStatus],
  rules: [processLogin, sessionExpiry],
  constraints: [requireAuth],
});

// Connect to Praxis Cloud relay after authentication
async function connectNotesRelay() {
  const auth = app.query<{ token: string | null }>('auth').current;
  if (!auth.token) throw new Error('Authenticate before connecting sync');
  return connectRelay('https://relay.praxis.plures.dev', {
    appId: 'cloud-notes',
    authToken: auth.token,
    autoSync: true,
  });
}
```

## Step 6: Run the Auth + Sync Flow

```ts
// 1. Start anonymous — notes mutation is rejected
const rejected = app.mutate('notes', [{ id: '1', text: 'Hello', updatedAt: Date.now() }]);
console.log(rejected.accepted); // demo only — use OpenTelemetry in production
// Expected output: false

// 2. Trigger login
app.mutate('auth', {
  status: 'authenticating',
  userId: 'user-123',
  token: null,
  error: null,
});

// 3. After rule processes login, state transitions to authenticated
app.mutate('auth', {
  status: 'authenticated',
  userId: 'user-123',
  token: 'jwt-token-here',
  error: null,
});

console.log(app.query('auth').current.status);
// Expected output: authenticated

// 4. Connect sync with the authenticated token
const relay = await connectNotesRelay();

// 5. Now notes mutation succeeds
const accepted = app.mutate('notes', [
  { id: '1', text: 'My first synced note', updatedAt: Date.now() },
]);
console.log(accepted.accepted);
// Expected output: true

// 6. Check sync status
console.log(app.query('syncStatus').current);
// Expected output: idle
```

## Conflict Resolution

When two clients edit the same note offline, PluresDB uses CRDT-based resolution:

```ts
// Client A (offline) edits note 1
app.mutate('notes', [
  { id: '1', text: 'Edited on laptop', updatedAt: 1000 },
]);

// Client B (offline) edits note 1
// (on another device, same room)
// { id: '1', text: 'Edited on phone', updatedAt: 1001 }

// On reconnect, PluresDB resolves via last-write-wins (updatedAt)
// Result: 'Edited on phone' wins because updatedAt is higher
```

For custom merge strategies, resolve conflicts before sending the next delta:

```ts
const localNote = { text: 'Edited on laptop', updatedAt: 1000 };
const remoteNote = { text: 'Edited on phone', updatedAt: 1001 };

const resolveNote = (
  local: { text: string; updatedAt: number },
  remote: { text: string; updatedAt: number },
) => (remote.updatedAt > local.updatedAt ? remote : local);

await relay.sync({
  type: 'delta',
  appId: 'cloud-notes',
  clock: {},
  events: [{ tag: 'notes.resolved', payload: resolveNote(localNote, remoteNote) }],
  timestamp: Date.now(),
});
```

## Offline Behavior

Praxis Cloud sync is designed for local-first operation:

| Scenario | Behavior |
|----------|----------|
| Online | Mutations sync immediately to all connected clients |
| Offline | Mutations are queued locally in PluresDB |
| Reconnect | Queued mutations are replayed and conflicts resolved |
| Auth expired | Sync pauses; re-authenticate to resume |

## Full Source

<details>
<summary>Click to expand <code>src/cloud-notes.ts</code></summary>

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';
import { connectRelay } from '@plures/praxis/cloud';

const AuthState = definePath<{
  status: 'anonymous' | 'authenticating' | 'authenticated' | 'error';
  userId: string | null;
  token: string | null;
  error: string | null;
}>('auth', { status: 'anonymous', userId: null, token: null, error: null });

const Notes = definePath<{ id: string; text: string; updatedAt: number }[]>('notes', []);
const SyncStatus = definePath<'idle' | 'syncing' | 'error'>('syncStatus', 'idle');

const processLogin = defineRule({
  id: 'auth.processLogin',
  watch: ['auth'],
  evaluate: (values) => {
    const auth = values['auth'] as { status: string };
    if (auth.status !== 'authenticating') return RuleResult.noop();
    return RuleResult.emit([fact('auth.tokenReceived', { token: 'jwt-token-here' })]);
  },
});

const sessionExpiry = defineRule({
  id: 'auth.sessionExpiry',
  watch: ['auth'],
  evaluate: (values) => {
    const auth = values['auth'] as { status: string; token: string | null };
    if (auth.status !== 'authenticated' || !auth.token) return RuleResult.noop();
    const expired = false; // placeholder — decode JWT in production
    if (expired) {
      return RuleResult.emit([fact('auth.sessionExpired', {})]);
    }
    return RuleResult.noop();
  },
});

const requireAuth = defineConstraint({
  id: 'notes.requireAuth',
  description: 'User must be authenticated to modify notes',
  watch: ['notes', 'auth'],
  validate: (values) => {
    const auth = values['auth'] as { status: string };
    return auth.status === 'authenticated' || 'Authentication required';
  },
});

const app = createApp({
  name: 'cloud-notes',
  schema: [AuthState, Notes, SyncStatus],
  rules: [processLogin, sessionExpiry],
  constraints: [requireAuth],
});

async function connectNotesRelay() {
  const auth = app.query<{ token: string | null }>('auth').current;
  if (!auth.token) throw new Error('Authenticate before connecting sync');
  return connectRelay('https://relay.praxis.plures.dev', {
    appId: 'cloud-notes',
    authToken: auth.token,
    autoSync: true,
  });
}

// Rejected — not authenticated
console.log(app.mutate('notes', [{ id: '1', text: 'Hello', updatedAt: Date.now() }]).accepted); // demo only — use OpenTelemetry in production
// false

// Start authentication
app.mutate('auth', { status: 'authenticating', userId: 'user-123', token: null, error: null });

// Authenticate
app.mutate('auth', { status: 'authenticated', userId: 'user-123', token: 'jwt-token-here', error: null });
console.log(app.query('auth').current.status); // authenticated
const relay = await connectNotesRelay();

// Accepted
console.log(app.mutate('notes', [{ id: '1', text: 'Synced note', updatedAt: Date.now() }]).accepted);
// true
```

</details>

## What's Next

- [PluresDB Integration docs](../core/pluresdb-integration.md) — deep dive into persistence
- [Offline Chat example](../../examples/offline-chat/) — full offline-first application
- [Cloud Sync example](../../examples/cloud-sync/) — multi-client synchronization
- [Getting Started](./getting-started.md) — revisit the basics
