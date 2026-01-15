# Core Logging Module for Self-Healing Agent
# Provides centralized logging, event tracking, and configuration management

# Use current directory for testing, or Program Files if installed
$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
$global:AgentLogPath = Join-Path $scriptRoot "Logs"
$global:AgentConfigPath = Join-Path $scriptRoot "Config"

function Initialize-AgentDirectories {
    <#
    .SYNOPSIS
    Ensures required directories exist for the agent
    #>
    @($global:AgentLogPath, $global:AgentConfigPath) | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -Path $_ -ItemType Directory -Force | Out-Null
            Write-Host "Created directory: $_" -ForegroundColor Cyan
        }
    }
}

function Write-AgentLog {
    <#
    .SYNOPSIS
    Writes structured log entries to file, event log, and console
    
    .PARAMETER Message
    The log message content
    
    .PARAMETER Level
    Log severity level (INFO, WARN, ERROR, AUDIT)
    
    .PARAMETER Component
    Component or module generating the log
    
    .PARAMETER Operation
    Specific operation being performed
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet("INFO", "WARN", "ERROR", "AUDIT")]
        [string]$Level,
        
        [string]$Component = "Agent",
        
        [string]$Operation = "General"
    )
    
    # Ensure log directory exists
    if (-not (Test-Path $global:AgentLogPath)) {
        New-Item -Path $global:AgentLogPath -ItemType Directory -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp | $Level | $Component | $Operation | $Message"
    $logFile = Join-Path $AgentLogPath "Execution_$(Get-Date -Format 'yyyy-MM-dd').log"
    
    # Write to log file
    try {
        $logEntry | Out-File -FilePath $logFile -Append -Encoding UTF8
    }
    catch {
        Write-Warning "Failed to write to log file: $_"
    }
    
    # Write to Event Log for critical events
    if ($Level -eq "ERROR" -or $Level -eq "AUDIT") {
        $eventId = switch ($Level) {
            "ERROR" { 1001 }
            "AUDIT" { 1002 }
            default { 1000 }
        }
        
        try {
            # Check if event source exists, if not skip event logging
            if ([System.Diagnostics.EventLog]::SourceExists("SelfHealingAgent")) {
                Write-EventLog -LogName "Application" -Source "SelfHealingAgent" `
                    -EventId $eventId -EntryType Information -Message $logEntry
            }
        }
        catch {
            # Silently continue if event log write fails
        }
    }
    
    # Console output for interactive sessions
    $color = switch ($Level) {
        "INFO"  { "White" }
        "WARN"  { "Yellow" }
        "ERROR" { "Red" }
        "AUDIT" { "Green" }
    }
    
    Write-Host $logEntry -ForegroundColor $color
}

function Get-AgentConfig {
    <#
    .SYNOPSIS
    Retrieves configuration from JSON file
    
    .PARAMETER ConfigName
    Name of the configuration file (without .json extension)
    
    .RETURNS
    PSCustomObject containing configuration data, or $null if not found
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$ConfigName
    )
    
    $configFile = Join-Path $global:AgentConfigPath "$ConfigName.json"
    
    if (Test-Path $configFile) {
        try {
            return Get-Content $configFile -Raw | ConvertFrom-Json
        }
        catch {
            Write-AgentLog -Message "Failed to parse config file: $configFile - $_" `
                -Level "ERROR" -Component "Config" -Operation "Get-AgentConfig"
            return $null
        }
    }
    
    Write-AgentLog -Message "Config file not found: $configFile" `
        -Level "WARN" -Component "Config" -Operation "Get-AgentConfig"
    return $null
}

# Export functions
Export-ModuleMember -Function Write-AgentLog, Get-AgentConfig, Initialize-AgentDirectories
