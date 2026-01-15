<#
.SYNOPSIS
Silent background execution wrapper for Self-Healing Agent

.DESCRIPTION
Runs the Self-Healing Agent in completely silent mode with no user interaction.
Designed for scheduled tasks and background execution.
#>

param(
    [switch]$Force = $false,
    [string[]]$Modules = @("Network", "Printer", "Disk", "Service")
)

# Hide PowerShell window completely
$windowCode = @"
[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
"@

try {
    $Win32ShowWindow = Add-Type -MemberDefinition $windowCode -Name "Win32ShowWindow" -Namespace Win32Functions -PassThru
    $consolePtr = [System.Diagnostics.Process]::GetCurrentProcess().MainWindowHandle
    $Win32ShowWindow::ShowWindow($consolePtr, 0) | Out-Null
}
catch {
    # If hiding window fails, continue anyway
}

# Suppress all output
$ErrorActionPreference = "SilentlyContinue"
$WarningPreference = "SilentlyContinue"
$VerbosePreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

# Redirect all output to null
$null = Start-Transcript -Path "$env:TEMP\SelfHealingAgent-Silent.log" -Force

try {
    # Get script directory
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    
    # Run the main agent script
    $agentScript = Join-Path $scriptPath "Start-SelfHealingAgent.ps1"
    
    if (Test-Path $agentScript) {
        # Execute with no output
        & $agentScript -Force:$Force -Modules $Modules *>&1 | Out-Null
    }
    else {
        # Log error but don't show to user
        Write-Error "Agent script not found: $agentScript" -ErrorAction SilentlyContinue
    }
}
catch {
    # Silently log errors
    Write-Error $_ -ErrorAction SilentlyContinue
}
finally {
    Stop-Transcript | Out-Null
}

# Exit silently
exit 0
