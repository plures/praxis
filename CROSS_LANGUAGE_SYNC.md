# Cross-Language Sync Strategy

This document outlines the strategy for keeping the Praxis implementations across different languages (TypeScript, C#, PowerShell) in sync.

## Protocol Version as the Source of Truth

The **protocol version** (`PRAXIS_PROTOCOL_VERSION` / `PraxisProtocol.Version`) serves as the primary synchronization mechanism. All implementations must:

1. Reference the same protocol version (currently `1.0.0`)
2. Implement the same core types with identical JSON serialization
3. Maintain backward compatibility within major versions

## Core Protocol Types

All implementations must provide these types with identical JSON structure:

### PraxisFact
```json
{
  "tag": "string",
  "payload": "any"
}
```

### PraxisEvent
```json
{
  "tag": "string",
  "payload": "any"
}
```

### PraxisState
```json
{
  "context": "any",
  "facts": "PraxisFact[]",
  "meta": "Record<string, any> | null",
  "protocolVersion": "string | null"
}
```

### PraxisDiagnostics
```json
{
  "kind": "constraint-violation" | "rule-error",
  "message": "string",
  "data": "any | null"
}
```

### PraxisStepConfig
```json
{
  "ruleIds": "string[]",
  "constraintIds": "string[]"
}
```

### PraxisStepResult
```json
{
  "state": "PraxisState",
  "diagnostics": "PraxisDiagnostics[]"
}
```

## Version Matrix

| Component | TypeScript | C# | PowerShell |
|-----------|------------|-----|------------|
| Protocol Version | 1.0.0 | 1.0.0 | 1.0.0 |
| Package Version | 0.2.0 | 0.2.0 | N/A |
| Package Name | @plures/praxis | Plures.Praxis | Praxis.psm1 |

## Sync Workflow

### 1. Protocol Changes

When making changes to the core protocol:

1. **Update Protocol Version**: Increment according to semver rules
2. **Update TypeScript First**: Make changes in `src/core/protocol.ts`
3. **Generate JSON Schema**: Export schema from TypeScript implementation
4. **Update C#**: Apply changes to `csharp/Praxis/src/Core/Protocol.cs`
5. **Update PowerShell**: Apply changes to `powershell/Praxis.psm1`
6. **Cross-Language Tests**: Run integration tests across all implementations

### 2. Feature Additions

New features that don't change the protocol:

1. Implement in TypeScript first (reference implementation)
2. Port to C# with equivalent functionality
3. Update PowerShell adapter if needed
4. Ensure all implementations have matching tests

### 3. Version Bumping

Keep package versions synchronized:

```bash
# TypeScript (package.json)
npm version patch  # or minor/major

# C# (Praxis.csproj)
# Update <Version> element

# Update CROSS_LANGUAGE_SYNC.md version matrix
```

## JSON Schema Validation

A shared JSON schema file (`protocol-schema.json`) can be generated from the TypeScript types and used to validate all implementations:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "PraxisFact": {
      "type": "object",
      "required": ["tag", "payload"],
      "properties": {
        "tag": { "type": "string" },
        "payload": {}
      }
    }
    // ... more definitions
  }
}
```

## Integration Testing

### Cross-Language State Transfer

Test that state can be serialized in one language and deserialized in another:

```typescript
// TypeScript: Create state, serialize to JSON
const state = createPraxisEngine({ ... }).getState();
const json = JSON.stringify(state);
fs.writeFileSync('state.json', json);
```

```csharp
// C#: Deserialize and verify
var json = File.ReadAllText("state.json");
var state = JsonSerializer.Deserialize<PraxisState>(json);
Assert.Equal("1.0.0", state.ProtocolVersion);
```

### CLI Boundary Testing

The PowerShell adapter uses JSON over stdin/stdout:

```powershell
$state = '{"context":{},"facts":[],"protocolVersion":"1.0.0"}' | 
  node dist/adapters/cli.js
```

## Publishing Locations

| Platform | Package Name | Registry |
|----------|--------------|----------|
| npm | @plures/praxis | https://www.npmjs.com/package/@plures/praxis |
| NuGet | Plures.Praxis | https://www.nuget.org/packages/Plures.Praxis |
| JSR | @plures/praxis | https://jsr.io/@plures/praxis |
| PowerShell | Praxis.psm1 | GitHub Repository |

## CI/CD Integration

GitHub Actions workflows handle publishing:

- **TypeScript**: `release.yml` publishes to npm on version tags
- **C#**: `publish-nuget.yml` publishes to NuGet on version tags
- **JSR**: `publish-jsr.yml` publishes to JSR registry

## Breaking Changes

When making breaking changes (major version bump):

1. Document migration path in `MIGRATION.md`
2. Add deprecation warnings in current version
3. Provide compatibility shims where possible
4. Update all implementations simultaneously
5. Coordinate release timing

## Monitoring

Regular checks ensure implementations stay in sync:

1. **Protocol Version Check**: CI verifies all implementations report same version
2. **JSON Compatibility Test**: Serialize/deserialize across implementations
3. **API Surface Check**: Document public API changes in CHANGELOG.md
