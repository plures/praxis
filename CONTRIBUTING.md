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

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the CHANGELOG.md with notes on your changes.
3. Fill out the pull request template completely.
4. Ensure all CI checks pass (tests, type checking, linting).
5. Request review from maintainers.
6. Address any review feedback.
7. The PR will be merged once you have the sign-off of the maintainers.

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

## Architecture Overview

Praxis follows a modular architecture:

### Core Components

- **Schema System** (`src/core/schema/`): Declarative schema definitions and validation
- **Logic Engine** (`src/core/logic/`): Facts, events, rules, and constraints
- **Component Generator** (`src/core/component/`): Generates Svelte components from schemas
- **State Machines** (`src/flows.ts`): Flow and scenario orchestration
- **CLI** (`src/cli/`): Command-line interface for project scaffolding and code generation

### Key Concepts

1. **Schemas**: Define data models, components, and application structure
2. **Facts**: Immutable data points in the logic engine
3. **Events**: Temporal occurrences that trigger logic
4. **Rules**: Declarative logic that derives new facts from existing ones
5. **Constraints**: Validation rules that ensure data integrity
6. **Actors**: Effectful components for side effects and integrations

### Generator Architecture

The generator system transforms schemas into code:

1. **Parse**: Read and validate schema definitions
2. **Transform**: Convert schemas to intermediate representation
3. **Generate**: Create target code (Svelte, TypeScript, etc.)
4. **Write**: Output generated files to the file system

For more details, see [FRAMEWORK.md](./FRAMEWORK.md).

## References

This document was adapted from the open-source contribution guidelines for [Facebook's Draft](https://github.com/facebook/draft-js/blob/master/CONTRIBUTING.md).
