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
praxis-cli init my-app

# With options
praxis-cli init my-app --template basic
praxis-cli init my-app --template fullstack --svelte
```

### Generate Components

```bash
# Generate a Svelte component from schema
praxis-cli generate component User --schema user.schema.yaml

# Generate multiple components
praxis-cli generate components --schema app.schema.yaml
```

### Validate Contracts

```bash
# Validate all contracts in the project
praxis-cli validate

# Validate with console output
praxis-cli validate --output console

# Validate with SARIF output (for CI/CD)
praxis-cli validate --output sarif
```

### Analyze Application

```bash
# Analyze logic dependencies
praxis-cli analyze

# Generate dependency graph
praxis-cli analyze --graph
```

## Commands

### `init`

Scaffold a new Praxis project.

```bash
praxis-cli init <project-name> [options]

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
praxis-cli generate <type> <name> [options]

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
praxis-cli validate [options]

Options:
  --output <format>  Output format (console, sarif, json)
  --fix              Auto-fix issues where possible
  --contracts        Validate contracts only
  --schemas          Validate schemas only
```

### `analyze`

Analyze application logic and dependencies.

```bash
praxis-cli analyze [options]

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
praxis-cli init my-app --template basic
```

### fullstack

A full-stack application with Svelte UI, logic engine, and PluresDB.

```bash
praxis-cli init my-app --template fullstack
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
