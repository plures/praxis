# Praxis PowerShell Adapter

PowerShell module for using Praxis application logic engine from PowerShell scripts.

## Overview

The Praxis PowerShell adapter provides a cross-language interface to the Praxis TypeScript engine via a JSON-based CLI boundary. This demonstrates the language-agnostic nature of the Praxis protocol and enables PowerShell scripts to leverage Praxis for application logic.

## Features

- ✅ Full Praxis protocol support (v1.0.0)
- ✅ JSON-based state and event management
- ✅ Protocol version compatibility checking
- ✅ Cross-platform (Windows, macOS, Linux with PowerShell Core)
- ✅ Type-safe PowerShell cmdlets
- ✅ Example counter application

## Prerequisites

- PowerShell 5.1+ or PowerShell Core 7+
- Node.js (for running the TypeScript engine)
- Praxis TypeScript library built (`npm run build`)

## Installation

1. Build the Praxis TypeScript library:

   ```bash
   cd /path/to/praxis
   npm install
   npm run build
   ```

2. Import the PowerShell module:
   ```powershell
   Import-Module ./powershell/Praxis.psm1
   ```

## Usage

### Initialize the Adapter

```powershell
Initialize-PraxisAdapter -EnginePath "./dist/adapters/cli.js"
```

### Create State and Events

```powershell
# Create initial state
$state = New-PraxisState -Context @{ count = 0 }

# Create an event
$event = New-PraxisEvent -Tag "INCREMENT" -Payload @{}

# Create a fact
$fact = New-PraxisFact -Tag "Incremented" -Payload @{}
```

### Process Events

```powershell
# Invoke a step with events
$result = Invoke-PraxisStep -State $state -Events @($event) -ConfigPath "./config.json"

# Update state
$state = $result.state

# Check diagnostics
if ($result.diagnostics.Count -gt 0) {
    Write-Host "Diagnostics: $($result.diagnostics)"
}
```

### Check Protocol Version

```powershell
$compatible = Test-PraxisProtocolVersion -State $state
if ($compatible) {
    Write-Host "Protocol version compatible"
}
```

## Configuration File Format

The adapter requires a JSON configuration file that defines rules and constraints:

```json
{
  "rules": [
    {
      "id": "rule.id",
      "description": "Rule description",
      "impl": "(state, events) => { /* implementation */ return []; }"
    }
  ],
  "constraints": [
    {
      "id": "constraint.id",
      "description": "Constraint description",
      "impl": "(state) => true || 'error message'"
    }
  ]
}
```

**Note**: Rule and constraint implementations are JavaScript code as strings, evaluated by the Node.js engine. For production use, consider loading pre-compiled modules instead.

## Example

See `powershell/examples/counter-example.ps1` for a complete working example.

Run the example:

```powershell
cd powershell/examples
./counter-example.ps1
```

## API Reference

### Initialize-PraxisAdapter

Initialize the connection to the TypeScript engine.

**Parameters:**

- `EnginePath` (string, required): Path to the compiled CLI adapter

**Example:**

```powershell
Initialize-PraxisAdapter -EnginePath "./dist/adapters/cli.js"
```

### New-PraxisState

Create a new Praxis state.

**Parameters:**

- `Context` (object, required): Initial context (hashtable or PSCustomObject)
- `Facts` (array, optional): Array of initial facts

**Returns:** PSCustomObject representing a PraxisState

**Example:**

```powershell
$state = New-PraxisState -Context @{ count = 0 }
```

### New-PraxisEvent

Create a new Praxis event.

**Parameters:**

- `Tag` (string, required): Event type identifier
- `Payload` (object, required): Event payload data

**Returns:** PSCustomObject representing a PraxisEvent

**Example:**

```powershell
$event = New-PraxisEvent -Tag "INCREMENT" -Payload @{}
```

### New-PraxisFact

Create a new Praxis fact.

**Parameters:**

- `Tag` (string, required): Fact type identifier
- `Payload` (object, required): Fact payload data

**Returns:** PSCustomObject representing a PraxisFact

**Example:**

```powershell
$fact = New-PraxisFact -Tag "UserLoggedIn" -Payload @{ userId = "alice" }
```

### Invoke-PraxisStep

Process events through the Praxis engine.

**Parameters:**

- `State` (PSCustomObject, required): Current Praxis state
- `Events` (array, required): Array of events to process
- `ConfigPath` (string, required): Path to registry configuration JSON

**Returns:** PSCustomObject representing a PraxisStepResult (with `state` and `diagnostics` properties)

**Example:**

```powershell
$result = Invoke-PraxisStep -State $state -Events @($event) -ConfigPath "./config.json"
```

### Test-PraxisProtocolVersion

Check protocol version compatibility.

**Parameters:**

- `State` (PSCustomObject, required): State to check

**Returns:** Boolean indicating compatibility

**Example:**

```powershell
$compatible = Test-PraxisProtocolVersion -State $state
```

### Get-PraxisInfo

Get information about the PowerShell adapter.

**Returns:** PSCustomObject with module information

**Example:**

```powershell
$info = Get-PraxisInfo
Write-Host "Protocol Version: $($info.ProtocolVersion)"
```

## Protocol Compatibility

The PowerShell adapter follows the Praxis protocol versioning strategy:

- **Current Protocol Version**: 1.0.0
- **Compatibility**: Major version must match between adapter and engine
- **Validation**: Automatic protocol version checking via `Test-PraxisProtocolVersion`

See [PROTOCOL_VERSIONING.md](../PROTOCOL_VERSIONING.md) for details.

## Architecture

```
┌─────────────────┐
│  PowerShell     │
│  Script         │
└────────┬────────┘
         │
         │ Import Module
         ▼
┌─────────────────┐
│  Praxis.psm1    │
│  (PowerShell)   │
└────────┬────────┘
         │
         │ JSON via stdin/stdout
         ▼
┌─────────────────┐
│  cli.js         │
│  (Node.js)      │
└────────┬────────┘
         │
         │ Function Calls
         ▼
┌─────────────────┐
│  Praxis Engine  │
│  (TypeScript)   │
└─────────────────┘
```

## Limitations

- Rule and constraint implementations use `eval()` for simplicity (not recommended for production)
- State must be JSON-serializable (no functions, symbols, etc.)
- Synchronous execution only (async actors not supported through CLI boundary)

## Future Enhancements

- Pre-compiled module loading for rules/constraints
- Async operation support
- Performance optimizations (persistent engine instances)
- Enhanced error reporting
- PowerShell-native type definitions
- Package as PowerShell Gallery module

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](../LICENSE) for details.

## See Also

- [Praxis README](../README.md)
- [Protocol Versioning](../PROTOCOL_VERSIONING.md)
- [C# Adapter](../csharp/) (planned)
- [API Documentation](../README.md#api-reference)
