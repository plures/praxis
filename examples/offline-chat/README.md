# Offline-First Chat Demo Application

This demo showcases the local-first architecture capabilities of the Praxis framework with a chat application that works offline.

## Features

- ✅ Offline message composition
- ✅ Local message storage with PluresDB
- ✅ Automatic sync when connected
- ✅ Message queue for offline messages
- ✅ Conflict resolution for concurrent edits
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Channel-based messaging with Unum

## Key Implementation Points

### Offline Message Storage

- Messages stored locally in PluresDB
- Automatic queueing when offline
- Status tracking (pending, sent, delivered, read)

### Automatic Sync

- Network detection
- Batch sync on reconnection
- Conflict resolution with last-write-wins

### Real-Time Features

- Typing indicators
- Read receipts
- Online/offline status

## Running the Demo

```bash
cd examples/offline-chat
npm install
npm run dev
```

## Test Scenarios

1. **Basic Offline**: Send messages while offline, go online, watch them sync
2. **Concurrent Edits**: Multiple users offline, both send messages, resolve conflicts
3. **Long Offline**: Extended offline period with many messages

See the full implementation guide in the [examples directory](../../docs/examples/offline-chat.md).
