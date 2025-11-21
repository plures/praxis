# Terminal Node Example

This example demonstrates the usage of the new `TerminalNode` type in Praxis.

## Overview

The TerminalNode provides a terminal interface within the Praxis framework, allowing for command execution and integration with RuneBook (when available).

## Schema Definition

The `terminal-schema.yaml` file defines a simple terminal node:

```yaml
version: "1.0.0"
name: "TerminalExample"
description: "Example showing terminal node integration"
orchestration:
  type: custom
  nodes:
    - id: main-terminal
      type: terminal
      x: 100
      y: 100
      props:
        inputMode: text
        history: []
        lastOutput: null
      bindings:
        input: /terminal/input
        output: /terminal/output
```

## Features

- **Input Modes**: Support for `text` (direct text input) and `widget` (UI-based input)
- **Command History**: Maintains a history of executed commands
- **PluresDB Integration**: Bindings for input/output synchronization (to be implemented)
- **RuneBook Integration**: Future integration with the RuneBook execution model

## Usage

### From TypeScript

```typescript
import { createTerminalAdapter, runTerminalCommand } from '@plures/praxis';

// Create a terminal adapter
const terminal = createTerminalAdapter({
  nodeId: 'my-terminal',
  props: {
    inputMode: 'text',
    history: [],
    lastOutput: null,
  },
  inputPath: '/terminal/input',
  outputPath: '/terminal/output',
});

// Execute a command
const result = await terminal.executeCommand('echo Hello World');
console.log(result.output);

// Get command history
const history = terminal.getHistory();
console.log(history);

// Or use the convenience function
const quickResult = await runTerminalCommand('my-terminal', 'ls -la');
```

### From YAML Schema

Load and use a schema with terminal nodes:

```typescript
import { loadSchemaFromFile } from '@plures/praxis';

const result = await loadSchemaFromFile('./terminal-schema.yaml');
if (result.schema) {
  const terminalNode = result.schema.orchestration?.nodes?.[0];
  console.log('Terminal node:', terminalNode);
}
```

## Terminal Node Properties

- `inputMode`: `'text'` or `'widget'` - determines the input method
- `history`: `string[]` - array of previously executed commands
- `lastOutput`: `string | null` - output from the last executed command

## Node Bindings

Terminal nodes support PluresDB bindings for reactive state management:

- `input`: PluresDB path for input commands
- `output`: PluresDB path for command output

## Future Enhancements

1. **RuneBook Integration**: Full integration with the RuneBook execution model for actual command execution
2. **PluresDB Sync**: Complete implementation of reactive state synchronization
3. **Svelte Component**: Visual terminal component for canvas integration
4. **Security**: Command sandboxing and permission system
5. **Streaming Output**: Real-time command output streaming
6. **Environment Management**: Custom environment variables per terminal node

## Running the Example

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```
