# Contributing to Praxis

We love your input! We want to make contributing to Praxis as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

Praxis supports both Node.js and Deno environments. Choose the setup that works best for you.

### Node.js Setup (Primary)

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/praxis.git
cd praxis

# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

### Deno Setup (Experimental)

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/praxis.git
cd praxis

# Run with Deno
deno task dev

# Run tests with Deno
deno task test

# Lint and format
deno task lint
deno task fmt

# Type check
deno task typecheck
```

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and type checking
4. Format your code
5. Commit with a clear message
6. Push and create a pull request

## Code Style

- We use TypeScript with strict type checking
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use 2-space indentation
- Prefer functional programming patterns
- Keep line length under 100 characters

### Formatting

We use automated formatting:

- **Node.js**: TypeScript compiler with strict mode
- **Deno**: `deno fmt` for consistent formatting

Run `deno fmt` before committing to ensure consistent style.

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Use Vitest for Node.js tests
- Test both success and error cases
- Aim for high code coverage on new features
- Test edge cases and error handling

### Running Tests

```bash
# Node.js (Vitest)
npm test
npm run test:watch  # Watch mode
npm run test:ui     # UI mode

# Deno
deno task test
```

## Dogfooding Plures Tools

Praxis actively dogfoods all Plures tools to find friction before users do. This helps us build better tools and improve the developer experience.

### Decision Ledger Dogfooding

If your change adds or modifies any rule or constraint:

1. **Add/Update Contract** via `defineContract()` and attach it to `meta.contract`.
2. **Add Tests** that cover every Given/When/Then example and invariant.
3. **Update Behavior Docs** if canonical behavior changes.
4. **Run dogfood checks**:

```bash
npm run scan:rules
npm run build
npm run validate:contracts
```

See `docs/decision-ledger/DOGFOODING.md` for full guidance.

### Using Plures Tools Daily

We dogfood all Plures tools during development:

- **Praxis CLI**: Use for scaffolding and generation
- **PluresDB**: Use for test fixtures and examples
- **State-Docs**: Generate documentation from schemas
- **CodeCanvas**: Visualize complex schemas and architecture
- **Unum**: Explore distributed features in development

**When you encounter friction**, file a dogfooding issue immediately:

1. Use the **Dogfooding Friction Report** issue template
2. Focus on **one specific friction point** per issue
3. Provide context about what you were trying to do
4. Suggest how it could be better

See `docs/DOGFOODING_CHECKLIST.md` for daily/weekly/monthly dogfooding workflows.

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the CHANGELOG.md with notes on your changes.
3. Fill out the pull request template completely.
4. Ensure all CI checks pass (tests, type checking, linting).
5. Request review from maintainers.
6. Address any review feedback.
7. The PR will be merged once you have the sign-off of the maintainers.

**Note**: The repository includes an automated PR Overlap Guard that detects potential duplicate PRs. If you receive an alert, please review the linked PRs to ensure your work is distinct. See [docs/workflows/pr-overlap-guard.md](docs/workflows/pr-overlap-guard.md) for details.

### Commit Messages

Use clear, descriptive commit messages:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

Examples:

```
feat: add component generator for Svelte
fix: resolve schema validation edge case
docs: update getting started guide
```

### Semantic Versioning Labels

When creating a pull request, add one of these labels to control the version bump:

- **semver:major** - Breaking changes (e.g., 1.0.0 → 2.0.0)
- **semver:minor** - New features, backwards compatible (e.g., 1.0.0 → 1.1.0)
- **semver:patch** - Bug fixes, patches (e.g., 1.0.0 → 1.0.1) - **default if no label**

The CI/CD pipeline will automatically bump the version and publish based on your label selection.

## CI/CD Pipeline

Praxis uses a fully automated CI/CD pipeline. When your PR is merged to `main`:

1. **Auto Version Bump**: Version is automatically bumped based on semver labels
2. **Tag Creation**: A git tag is created (e.g., `v1.2.3`)
3. **Release**: GitHub Release is automatically created
4. **Publishing**: Package is published to NPM, JSR, and NuGet in parallel

For detailed information about the pipeline, see [CI/CD Pipeline Guide](./docs/guides/cicd-pipeline.md).

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker]

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/plures/praxis/issues/new).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Monorepo Structure

Praxis is organized as a monorepo with clear package boundaries. See [MONOREPO.md](./MONOREPO.md) for the complete organization plan.

### Repository Layout

```
praxis/
├── packages/           # Published npm packages
│   ├── praxis-core/   # Core logic library (facts, rules, schemas, contracts)
│   ├── praxis-cli/    # Command-line interface and generators
│   ├── praxis-svelte/ # Svelte 5 integration
│   ├── praxis-cloud/  # Cloud sync and relay
│   └── praxis/        # Main package (re-exports all)
├── apps/              # Example applications (not published)
├── tools/             # Development tools (not published)
├── ui/                # UI components and tools (not published)
└── docs/              # Documentation
```

### Package Ownership

When contributing, please respect package boundaries:

- **praxis-core**: Core logic primitives only (no UI, no integrations)
- **praxis-cli**: CLI commands, generators, templates
- **praxis-svelte**: Svelte-specific code and components
- **praxis-cloud**: Cloud relay and sync protocol
- **praxis**: Re-exports from other packages for convenience

### Working with Packages

The repository uses npm workspaces. When developing:

```bash
# Install all dependencies (from root)
npm install

# Build all packages
npm run build

# Test all packages
npm test

# Work on a specific package
cd packages/praxis-core
npm test
```

## Architecture Overview

Praxis follows a modular architecture:

### Core Components

- **Schema System** (`packages/praxis-core/src/schema/`): Declarative schema definitions and validation
- **Logic Engine** (`packages/praxis-core/src/logic/`): Facts, events, rules, and constraints
- **Decision Ledger** (`packages/praxis-core/src/decision-ledger/`): Contracts and behavior specifications
- **Component Generator** (`packages/praxis-svelte/src/generators/`): Generates Svelte components from schemas
- **CLI** (`packages/praxis-cli/src/`): Command-line interface for project scaffolding and code generation

### Key Concepts

1. **Schemas**: Define data models, components, and application structure
2. **Facts**: Immutable data points in the logic engine
3. **Events**: Temporal occurrences that trigger logic
4. **Rules**: Declarative logic that derives new facts from existing ones
5. **Constraints**: Validation rules that ensure data integrity
6. **Contracts**: Behavior specifications for rules and constraints
7. **Actors**: Effectful components for side effects and integrations

### Generator Architecture

The generator system transforms schemas into code:

1. **Parse**: Read and validate schema definitions
2. **Transform**: Convert schemas to intermediate representation
3. **Generate**: Create target code (Svelte, TypeScript, etc.)
4. **Write**: Output generated files to the file system

For more details, see [FRAMEWORK.md](./FRAMEWORK.md) and [MONOREPO.md](./MONOREPO.md).

## Contributing to Praxis-Core

Praxis-Core is the canonical logic layer used by all packages and tools. When contributing to core modules (`src/core/`, `src/dsl/`, `src/decision-ledger/`), follow these additional guidelines:

### Core Module Stability

Core modules are **STABLE** and follow strict backward compatibility requirements:

1. **Public API Changes**: All public API changes require review and approval
2. **Breaking Changes**: Breaking changes only allowed in major versions
3. **Deprecation**: Deprecate APIs for at least one minor version before removal
4. **Documentation**: All public APIs must be documented with TSDoc comments

### Core Module Guidelines

1. **Purity**: All rules and constraints must be pure functions (no side effects)
2. **Immutability**: Never mutate state; always return new values
3. **Type Safety**: Use explicit types for all public APIs
4. **JSON Compatibility**: Core types must remain JSON-serializable
5. **Cross-Language**: Consider C# and PowerShell compatibility for protocol changes

### Decision Ledger for Core Changes

All core module changes require Decision Ledger compliance:

1. **Contracts**: Every rule/constraint must have a contract attached
2. **Examples**: Contracts must include Given/When/Then examples
3. **Tests**: All contract examples must have corresponding tests
4. **Validation**: Run validation before submitting PR:

```bash
npm run scan:rules
npm run build
npm run validate:contracts
```

### Core Breaking Change Policy

Breaking changes to core APIs require:

1. **Justification**: Clear explanation of why the change is necessary
2. **Migration Guide**: Step-by-step guide for upgrading
3. **Deprecation Period**: At least one minor version of deprecation warnings
4. **Cross-Language Coordination**: Updates to C# and PowerShell implementations
5. **Major Version Bump**: Breaking changes only in major releases

For more details, see:

- [Praxis-Core API Documentation](./docs/core/praxis-core-api.md)
- [Extending Praxis-Core](./docs/core/extending-praxis-core.md)

## References

This document was adapted from the open-source contribution guidelines for [Facebook's Draft](https://github.com/facebook/draft-js/blob/master/CONTRIBUTING.md).
