# @plures/praxis-cli

Command-line interface for the Praxis application framework. Provides scaffolding, code generation, and validation tools.

## Overview

The Praxis CLI helps you:

- **Scaffold** new Praxis projects
- **Generate** components, schemas, and rules from templates
- **Validate** contracts and behavior specifications
- **Analyze** your application logic and dependencies

## Installation

```bash
# Global installation
npm install -g @plures/praxis-cli

# Or use with npx (no installation required)
npx @plures/praxis-cli --help
```

For use in a project:

```bash
npm install --save-dev @plures/praxis-cli
```

## Usage

### Scaffold a New Project

```bash
# Interactive project creation
praxis create app my-app

# With options
praxis create app my-app --template basic
praxis create app my-app --template fullstack
```

### Generate Components

```bash
# Generate code from a schema file
praxis generate --schema app.schema.yaml

# Generate multiple components
praxis generate --schema app.schema.yaml --target components
```

### Validate Contracts

```bash
# Validate all contracts in the project
praxis validate

# Validate with console output
praxis validate --output console

# Validate with SARIF output (for CI/CD)
praxis validate --output sarif
```

### Analyze Application

```bash
# Analyze logic dependencies
praxis analyze

# Generate dependency graph
praxis analyze --graph
```

## Commands

### `init`

Scaffold a new Praxis project.

```bash
praxis create app <project-name> [options]

Options:
  --template <name>   Project template (basic, fullstack)
  --svelte           Include Svelte integration
  --cloud            Include cloud sync
  --typescript       Use TypeScript (default: true)
  --force            Overwrite existing directory
```

### `generate`

Generate code from templates.

```bash
praxis generate <type> <name> [options]

Types:
  component     Generate a Svelte component
  schema        Generate a schema definition
  rule          Generate a rule
  constraint    Generate a constraint
  actor         Generate an actor

Options:
  --schema <file>    Schema file to use
  --output <dir>     Output directory
  --force            Overwrite existing files
```

### `validate`

Validate contracts and behavior specifications.

```bash
praxis validate [options]

Options:
  --output <format>  Output format (console, sarif, json)
  --fix              Auto-fix issues where possible
  --contracts        Validate contracts only
  --schemas          Validate schemas only
```

### `analyze`

Analyze application logic and dependencies.

```bash
praxis analyze [options]

Options:
  --graph            Generate dependency graph
  --output <file>    Output file for graph
  --format <type>    Graph format (dot, json, mermaid)
```

## Templates

The CLI includes several project templates:

### basic

A minimal Praxis application with logic engine and schemas.

```bash
praxis create app my-app --template basic
```

### fullstack

A full-stack application with Svelte UI, logic engine, and PluresDB.

```bash
praxis create app my-app --template fullstack
```

## Configuration

Create a `praxis.config.json` file in your project root:

```json
{
  "schemas": "./schemas",
  "generated": "./src/generated",
  "templates": "./templates",
  "validation": {
    "contracts": true,
    "schemas": true
  }
}
```

## API

You can also use the CLI programmatically:

```typescript
import { scaffold, generate, validate } from '@plures/praxis-cli';

// Scaffold a project
await scaffold({
  name: 'my-app',
  template: 'basic',
  outputDir: './my-app',
});

// Generate a component
await generate({
  type: 'component',
  name: 'User',
  schema: './schemas/user.yaml',
  outputDir: './src/components',
});

// Validate contracts
const results = await validate({
  contracts: true,
  schemas: true,
});
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Watch mode
npm run test:watch
```

## License

MIT - See [LICENSE](../../LICENSE) for details

## Related Packages

- `@plures/praxis-core`: Core logic library
- `@plures/praxis`: Main package (re-exports from all packages)
- `@plures/praxis-svelte`: Svelte 5 integration
- `@plures/praxis-cloud`: Cloud sync and relay

## Links

- [Main Documentation](../../docs/README.md)
- [CLI Usage Guide](../../docs/core/cli-usage.md)
- [Getting Started](../../docs/guides/getting-started.md)
