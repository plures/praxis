# Todo App Example

A minimal todo application demonstrating basic Praxis concepts.

## Overview

This example shows the simplest possible Praxis application - a todo list. It demonstrates:

- Basic fact/event definitions
- Simple rules for CRUD operations
- Model definition
- Component bindings

## Schema Structure

- **Facts**: `TodoCreated`, `TodoCompleted`, `TodoDeleted`
- **Events**: `CreateTodo`, `CompleteTodo`, `DeleteTodo`
- **Rules**: Simple CRUD operations
- **Models**: `Todo`
- **Components**: `TodoInput`, `TodoItem`, `TodoList`

## Quick Start

```bash
# Generate code from schema
praxis generate --schema ./schema.psf.json

# Start development
praxis dev
```

## Usage

```typescript
import { createPraxisEngine } from '@plures/praxis';
import { rules } from './generated/rules';

// Create engine
const engine = createPraxisEngine({
  initialContext: { todos: [] },
  registry: rules,
});

// Create a todo
engine.dispatch({ tag: 'CreateTodo', payload: { title: 'Learn Praxis' } });

// Complete a todo
engine.dispatch({ tag: 'CompleteTodo', payload: { id: 'abc123' } });
```

## License

MIT
