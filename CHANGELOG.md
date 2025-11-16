# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-15

### Added
- Initial release of Praxis TypeScript library
- Core type definitions: `PraxisState`, `PraxisEvent`, `StepResult`, `Effect`, `StepFunction`
- Fluent DSL for defining rules and constraints
- Registry system for managing rules and constraints
- Pure step functions for state transitions
- Support for flows and actors
- Actor system for managing multiple actors
- Comprehensive test suite with 9 tests
- Working counter example demonstrating all features
- Full TypeScript type definitions
- JSON-friendly serialization for all types
- Documentation and README

### Features
- **Logic-First Design**: Build applications around facts, events, rules, and constraints
- **Pure Functional Core**: State transitions via pure `step` functions
- **Fluent DSL**: Intuitive API for defining rules and constraints
- **Registry System**: Centralized management of rules and constraints
- **Flows & Actors**: Orchestrate complex state transitions
- **JSON-Friendly**: All types are serializable for cross-platform use
- **Type-Safe**: Full TypeScript support with strict typing

[0.1.0]: https://github.com/plures/praxis/releases/tag/v0.1.0
