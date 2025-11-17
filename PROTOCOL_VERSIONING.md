# Praxis Protocol Versioning

## Overview

The Praxis protocol is the language-neutral, JSON-friendly foundation that makes cross-language implementations possible. This document defines the versioning strategy and stability guarantees for the Praxis protocol.

## Current Version

**Protocol Version: 1.0.0**

## Semantic Versioning

The Praxis protocol follows semantic versioning (MAJOR.MINOR.PATCH):

### MAJOR Version

Incremented for breaking changes to core protocol types or semantics:
- Changes to required fields in `PraxisFact`, `PraxisEvent`, or `PraxisState`
- Changes to the signature of `PraxisStepFn`
- Changes to the semantics of how the protocol should be implemented
- Removal of fields or types from the protocol

### MINOR Version

Incremented for backward-compatible additions:
- New optional fields added to existing types
- New diagnostic kinds or configuration options
- Enhancements that don't break existing implementations

### PATCH Version

Incremented for:
- Documentation clarifications
- Internal implementation improvements (in TypeScript)
- Bug fixes that don't change the protocol surface

## Stability Guarantees

### 1. Core Types Stability

The following types are considered **stable** within a major version:

#### PraxisFact
```typescript
interface PraxisFact {
  tag: string;
  payload: unknown;
}
```
- `tag` will always be a string identifier
- `payload` will always be JSON-serializable
- Structure will not change in breaking ways

#### PraxisEvent
```typescript
interface PraxisEvent {
  tag: string;
  payload: unknown;
}
```
- Same guarantees as PraxisFact
- Distinction from PraxisFact is semantic (events drive change)

#### PraxisState
```typescript
interface PraxisState {
  context: unknown;
  facts: PraxisFact[];
  meta?: Record<string, unknown>;
  protocolVersion?: string;
}
```
- `context` will always hold domain-specific data
- `facts` will always be an array of PraxisFact
- `meta` will always be optional metadata
- `protocolVersion` (added in v1.0.0) indicates the protocol version

#### PraxisStepFn
```typescript
type PraxisStepFn = (
  state: PraxisState,
  events: PraxisEvent[],
  config: PraxisStepConfig
) => PraxisStepResult;
```
- Pure, deterministic function signature
- Input/output types remain stable

### 2. JSON Compatibility

**Guarantee**: All protocol types will remain JSON-serializable.

This means:
- No functions, symbols, or other non-JSON types in protocol data
- All data can be serialized via `JSON.stringify()`
- All data can be transmitted over HTTP, files, or message queues
- Cross-language implementations can exchange data without loss

### 3. Cross-Language Compatibility

**Guarantee**: Protocol changes will be coordinated across all official language implementations.

Official implementations:
- **TypeScript** (reference implementation) - Available now
- **C#** - Planned
- **PowerShell** - Planned

When a new protocol version is released:
1. TypeScript implementation is updated first
2. Other language implementations follow within a release window
3. Compatibility matrix is published showing which versions work together

### 4. Migration Path

For **MAJOR** version changes, we provide:

1. **Migration Guide**
   - Detailed changelog of breaking changes
   - Code examples showing before/after
   - Automated migration tools where possible

2. **Deprecation Period**
   - Previous major version supported for at least 6 months
   - Deprecation warnings in the previous version
   - Clear timeline for end-of-support

3. **Compatibility Shims**
   - Where possible, compatibility layers to ease migration
   - Clear documentation of trade-offs

## Version Checking

Implementations should check and validate protocol versions:

### TypeScript Example
```typescript
import { PRAXIS_PROTOCOL_VERSION } from "@plures/praxis";

function validateProtocolVersion(state: PraxisState): boolean {
  if (!state.protocolVersion) {
    // Pre-1.0.0 state without version field
    console.warn("State missing protocolVersion, assuming 1.0.0");
    return true;
  }
  
  const [major] = state.protocolVersion.split('.');
  const [expectedMajor] = PRAXIS_PROTOCOL_VERSION.split('.');
  
  if (major !== expectedMajor) {
    throw new Error(
      `Protocol version mismatch: state is ${state.protocolVersion}, ` +
      `engine expects ${PRAXIS_PROTOCOL_VERSION}`
    );
  }
  
  return true;
}
```

### C# Example (future)
```csharp
public static void ValidateProtocolVersion(PraxisState state)
{
    if (string.IsNullOrEmpty(state.ProtocolVersion))
    {
        Console.WriteLine("Warning: State missing ProtocolVersion");
        return;
    }
    
    var stateMajor = state.ProtocolVersion.Split('.')[0];
    var engineMajor = PraxisProtocol.VERSION.Split('.')[0];
    
    if (stateMajor != engineMajor)
    {
        throw new Exception(
            $"Protocol version mismatch: state is {state.ProtocolVersion}, " +
            $"engine expects {PraxisProtocol.VERSION}"
        );
    }
}
```

### PowerShell Example (future)
```powershell
function Test-PraxisProtocolVersion {
    param([PSCustomObject]$State)
    
    if (-not $State.protocolVersion) {
        Write-Warning "State missing protocolVersion"
        return $true
    }
    
    $stateMajor = $State.protocolVersion.Split('.')[0]
    $engineMajor = $global:PRAXIS_PROTOCOL_VERSION.Split('.')[0]
    
    if ($stateMajor -ne $engineMajor) {
        throw "Protocol version mismatch: state is $($State.protocolVersion), engine expects $global:PRAXIS_PROTOCOL_VERSION"
    }
    
    return $true
}
```

## Protocol Extensions

Language-specific implementations may add features beyond the core protocol, but these must be:

1. **Optional**: Core protocol functionality works without them
2. **Documented**: Clearly marked as language-specific
3. **Non-Breaking**: Don't prevent other implementations from reading the state

### Example: TypeScript-Specific Features

The TypeScript implementation adds:
- Type guards (`defineFact`, `defineEvent` return objects with `.is()` methods)
- Fluent DSL for defining rules and constraints
- Svelte integration

These are **not** part of the protocol and don't affect JSON serialization.

## Version History

### 1.0.0 (Current)
- Initial stable protocol release
- Core types: PraxisFact, PraxisEvent, PraxisState, PraxisStepFn
- Added `protocolVersion` field to PraxisState
- Stability guarantees established
- Cross-language compatibility design finalized

### 0.1.0 (Pre-release)
- Initial implementation
- Protocol types defined but not versioned
- TypeScript-only

## FAQ

### Q: What if I need to change the protocol in my fork?

If you need protocol changes for a fork:
1. Change the protocol version to indicate incompatibility (e.g., "1.0.0-mycompany")
2. Document your changes clearly
3. Consider contributing the feature back to the main project

### Q: Can I mix protocol versions?

**No.** Different major versions are incompatible. State serialized with one major version cannot be safely loaded by another. Minor and patch versions within the same major are compatible.

### Q: How do I know which protocol version I'm using?

```typescript
import { PRAXIS_PROTOCOL_VERSION } from "@plures/praxis";
console.log(`Protocol version: ${PRAXIS_PROTOCOL_VERSION}`);
```

### Q: What about older state without protocolVersion field?

State created before v1.0.0 won't have the `protocolVersion` field. Implementations should assume version 1.0.0 for backward compatibility but may warn users to re-serialize their state.

## Contributing

Protocol changes require:
1. RFC (Request for Comments) with rationale
2. Impact analysis on all language implementations
3. Approval from core maintainers
4. Migration guide (for major versions)
5. Updates to this document

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## References

- [Core Protocol Types](./src/core/protocol.ts)
- [Semantic Versioning](https://semver.org/)
- [README](./README.md)
- [API Documentation](./README.md#api-reference)
