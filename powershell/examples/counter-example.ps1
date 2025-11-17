# Praxis PowerShell Example
# Demonstrates using Praxis from PowerShell via the CLI adapter

# Import the Praxis module
Import-Module "$PSScriptRoot/../Praxis.psm1" -Force

Write-Host "============================================================"
Write-Host "Praxis PowerShell Example"
Write-Host "Demonstrating cross-language Praxis usage"
Write-Host "============================================================"
Write-Host ""

# Check if module is loaded
$moduleInfo = Get-PraxisInfo
Write-Host "Module: $($moduleInfo.ModuleName)"
Write-Host "Protocol Version: $($moduleInfo.ProtocolVersion)"
Write-Host ""

# Initialize adapter
$enginePath = Join-Path $PSScriptRoot "../../dist/adapters/cli.js"
$configPath = Join-Path $PSScriptRoot "./counter-config.json"

Write-Host "Initializing adapter..."
Write-Host "  Engine: $enginePath"
Write-Host "  Config: $configPath"
Write-Host ""

try {
    Initialize-PraxisAdapter -EnginePath $enginePath
    Write-Host "✓ Adapter initialized successfully" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to initialize adapter: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create initial state
Write-Host "Creating initial state..."
$state = New-PraxisState -Context @{ count = 0 }
Write-Host "  Initial count: $($state.context.count)"
Write-Host ""

# Scenario 1: Increment counter
Write-Host "Scenario 1: Increment Counter"
Write-Host "------------------------------------------------------------"
$event = New-PraxisEvent -Tag "INCREMENT" -Payload @{}

try {
    $result = Invoke-PraxisStep -State $state -Events @($event) -ConfigPath $configPath
    $state = $result.state
    
    Write-Host "  ✓ Step completed" -ForegroundColor Green
    Write-Host "  Count: $($state.context.count)"
    Write-Host "  Facts: $($state.facts.Count)"
    Write-Host "  Diagnostics: $($result.diagnostics.Count) issue(s)"
}
catch {
    Write-Host "  ✗ Step failed: $_" -ForegroundColor Red
}

Write-Host ""

# Scenario 2: Increment again
Write-Host "Scenario 2: Increment Again"
Write-Host "------------------------------------------------------------"
$event = New-PraxisEvent -Tag "INCREMENT" -Payload @{}

try {
    $result = Invoke-PraxisStep -State $state -Events @($event) -ConfigPath $configPath
    $state = $result.state
    
    Write-Host "  ✓ Step completed" -ForegroundColor Green
    Write-Host "  Count: $($state.context.count)"
    Write-Host "  Facts: $($state.facts.Count)"
}
catch {
    Write-Host "  ✗ Step failed: $_" -ForegroundColor Red
}

Write-Host ""

# Scenario 3: Decrement
Write-Host "Scenario 3: Decrement Counter"
Write-Host "------------------------------------------------------------"
$event = New-PraxisEvent -Tag "DECREMENT" -Payload @{}

try {
    $result = Invoke-PraxisStep -State $state -Events @($event) -ConfigPath $configPath
    $state = $result.state
    
    Write-Host "  ✓ Step completed" -ForegroundColor Green
    Write-Host "  Count: $($state.context.count)"
    Write-Host "  Facts: $($state.facts.Count)"
}
catch {
    Write-Host "  ✗ Step failed: $_" -ForegroundColor Red
}

Write-Host ""

# Scenario 4: Test constraint (try to go below zero)
Write-Host "Scenario 4: Test Constraint (below zero)"
Write-Host "------------------------------------------------------------"
$events = @(
    (New-PraxisEvent -Tag "DECREMENT" -Payload @{}),
    (New-PraxisEvent -Tag "DECREMENT" -Payload @{})
)

try {
    $result = Invoke-PraxisStep -State $state -Events $events -ConfigPath $configPath
    $state = $result.state
    
    Write-Host "  ✓ Step completed" -ForegroundColor Green
    Write-Host "  Count: $($state.context.count)"
    Write-Host "  Diagnostics: $($result.diagnostics.Count) issue(s)"
    
    if ($result.diagnostics.Count -gt 0) {
        Write-Host "  Constraint violations:" -ForegroundColor Yellow
        foreach ($diag in $result.diagnostics) {
            Write-Host "    - $($diag.message)" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "  ✗ Step failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test protocol version
Write-Host "Testing Protocol Version Compatibility"
Write-Host "------------------------------------------------------------"
try {
    $compatible = Test-PraxisProtocolVersion -State $state
    if ($compatible) {
        Write-Host "  ✓ Protocol version compatible" -ForegroundColor Green
        Write-Host "  State version: $($state.protocolVersion)"
        Write-Host "  Adapter version: $($moduleInfo.ProtocolVersion)"
    }
}
catch {
    Write-Host "  ✗ Protocol version mismatch: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================"
Write-Host "Example Complete"
Write-Host "============================================================"
