# Praxis PowerShell Module
# Cross-language adapter for calling the Praxis TypeScript engine

<#
.SYNOPSIS
    PowerShell adapter for Praxis application logic engine

.DESCRIPTION
    This module provides PowerShell cmdlets for interacting with the Praxis
    TypeScript engine via a JSON-based CLI boundary. It demonstrates the
    cross-language capability of the Praxis protocol.

.NOTES
    Protocol Version: 1.0.0
    Requires: Node.js with @plures/praxis installed
#>

# Module configuration
$global:PRAXIS_PROTOCOL_VERSION = "1.0.0"
$global:PRAXIS_ENGINE_PATH = $null

<#
.SYNOPSIS
    Initialize the Praxis PowerShell adapter

.DESCRIPTION
    Sets up the connection to the TypeScript engine

.PARAMETER EnginePath
    Path to the compiled Praxis CLI adapter (JavaScript file)

.EXAMPLE
    Initialize-PraxisAdapter -EnginePath "./dist/adapters/cli.js"
#>
function Initialize-PraxisAdapter {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$EnginePath
    )
    
    if (-not (Test-Path $EnginePath)) {
        throw "Engine path not found: $EnginePath"
    }
    
    $global:PRAXIS_ENGINE_PATH = $EnginePath
    Write-Verbose "Praxis adapter initialized with engine: $EnginePath"
}

<#
.SYNOPSIS
    Create a new Praxis state

.DESCRIPTION
    Creates a new Praxis state with initial context

.PARAMETER Context
    Hashtable or PSCustomObject representing the initial context

.PARAMETER Facts
    Array of initial facts

.EXAMPLE
    $state = New-PraxisState -Context @{ count = 0 }
#>
function New-PraxisState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [object]$Context,
        
        [Parameter(Mandatory=$false)]
        [array]$Facts = @()
    )
    
    return [PSCustomObject]@{
        context = $Context
        facts = $Facts
        meta = @{}
        protocolVersion = $global:PRAXIS_PROTOCOL_VERSION
    }
}

<#
.SYNOPSIS
    Create a new Praxis event

.DESCRIPTION
    Creates a Praxis event with a tag and payload

.PARAMETER Tag
    Event type identifier

.PARAMETER Payload
    Event payload data

.EXAMPLE
    $event = New-PraxisEvent -Tag "INCREMENT" -Payload @{}
#>
function New-PraxisEvent {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Tag,
        
        [Parameter(Mandatory=$true)]
        [object]$Payload
    )
    
    return [PSCustomObject]@{
        tag = $Tag
        payload = $Payload
    }
}

<#
.SYNOPSIS
    Create a new Praxis fact

.DESCRIPTION
    Creates a Praxis fact with a tag and payload

.PARAMETER Tag
    Fact type identifier

.PARAMETER Payload
    Fact payload data

.EXAMPLE
    $fact = New-PraxisFact -Tag "UserLoggedIn" -Payload @{ userId = "alice" }
#>
function New-PraxisFact {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Tag,
        
        [Parameter(Mandatory=$true)]
        [object]$Payload
    )
    
    return [PSCustomObject]@{
        tag = $Tag
        payload = $Payload
    }
}

<#
.SYNOPSIS
    Invoke a Praxis step

.DESCRIPTION
    Sends state and events to the TypeScript engine and returns the result

.PARAMETER State
    Current Praxis state

.PARAMETER Events
    Array of events to process

.PARAMETER ConfigPath
    Path to registry configuration JSON file

.EXAMPLE
    $result = Invoke-PraxisStep -State $state -Events @($event) -ConfigPath "./config.json"
#>
function Invoke-PraxisStep {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$State,
        
        [Parameter(Mandatory=$true)]
        [array]$Events,
        
        [Parameter(Mandatory=$true)]
        [string]$ConfigPath
    )
    
    if (-not $global:PRAXIS_ENGINE_PATH) {
        throw "Praxis adapter not initialized. Call Initialize-PraxisAdapter first."
    }
    
    # Prepare input
    $input = @{
        state = $State
        events = $Events
        configPath = $ConfigPath
    } | ConvertTo-Json -Depth 10 -Compress
    
    # Call Node.js engine
    try {
        $output = $input | node $global:PRAXIS_ENGINE_PATH 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            throw "Engine returned error code $LASTEXITCODE`: $output"
        }
        
        $result = $output | ConvertFrom-Json
        return $result
    }
    catch {
        Write-Error "Failed to invoke Praxis engine: $_"
        throw
    }
}

<#
.SYNOPSIS
    Test protocol version compatibility

.DESCRIPTION
    Checks if a state's protocol version is compatible with this adapter

.PARAMETER State
    Praxis state to check

.EXAMPLE
    Test-PraxisProtocolVersion -State $state
#>
function Test-PraxisProtocolVersion {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$State
    )
    
    if (-not $State.protocolVersion) {
        Write-Warning "State missing protocolVersion field"
        return $true
    }
    
    $stateMajor = $State.protocolVersion.Split('.')[0]
    $adapterMajor = $global:PRAXIS_PROTOCOL_VERSION.Split('.')[0]
    
    if ($stateMajor -ne $adapterMajor) {
        throw "Protocol version mismatch: state is $($State.protocolVersion), adapter expects $global:PRAXIS_PROTOCOL_VERSION"
    }
    
    return $true
}

<#
.SYNOPSIS
    Get Praxis module information

.DESCRIPTION
    Returns information about the PowerShell adapter

.EXAMPLE
    Get-PraxisInfo
#>
function Get-PraxisInfo {
    [CmdletBinding()]
    param()
    
    return [PSCustomObject]@{
        ModuleName = "Praxis PowerShell Adapter"
        ProtocolVersion = $global:PRAXIS_PROTOCOL_VERSION
        EnginePath = $global:PRAXIS_ENGINE_PATH
        Initialized = ($null -ne $global:PRAXIS_ENGINE_PATH)
    }
}

# Export module members
Export-ModuleMember -Function @(
    'Initialize-PraxisAdapter',
    'New-PraxisState',
    'New-PraxisEvent',
    'New-PraxisFact',
    'Invoke-PraxisStep',
    'Test-PraxisProtocolVersion',
    'Get-PraxisInfo'
)
