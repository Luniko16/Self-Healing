<#
.SYNOPSIS
Installation script for Self-Healing Agent

.DESCRIPTION
Installs the Self-Healing Agent to C:\Program Files\SelfHealingAgent
Creates directory structure, copies files, configures scheduled task, and registers event log source.

.NOTES
Must be run as Administrator
#>

# Check for Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator"
    Write-Host "Please right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Self-Healing Agent Installation ===" -ForegroundColor Cyan
Write-Host ""

$agentPath = "C:\Program Files\SelfHealingAgent"
$sourcePath = $PSScriptRoot

Write-Host "Installation Path: $agentPath" -ForegroundColor White
Write-Host "Source Path: $sourcePath" -ForegroundColor White
Write-Host ""

# Verify source files exist
$requiredFiles = @(
    "Core-Logging.psm1",
    "Start-SelfHealingAgent.ps1"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path (Join-Path $sourcePath $file))) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Error "Missing required files: $($missingFiles -join ', ')"
    Write-Host "Please ensure all agent files are present in: $sourcePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/6] Creating directory structure..." -ForegroundColor Green

# Create directory structure
$folders = @(
    "Config",
    "Modules\Detection",
    "Modules\Remediation",
    "Modules\Verification",
    "Modules\Safety",
    "Logs",
    "Scripts"
)

try {
    foreach ($folder in $folders) {
        $fullPath = Join-Path $agentPath $folder
        if (-not (Test-Path $fullPath)) {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
            Write-Host "  Created: $folder" -ForegroundColor Gray
        }
        else {
            Write-Host "  Exists: $folder" -ForegroundColor Gray
        }
    }
    Write-Host "  Directory structure created successfully" -ForegroundColor Green
}
catch {
    Write-Error "Failed to create directory structure: $_"
    exit 1
}

Write-Host ""
Write-Host "[2/6] Copying agent files..." -ForegroundColor Green

try {
    # Copy main orchestrator script
    if (Test-Path "$sourcePath\Start-SelfHealingAgent.ps1") {
        Copy-Item "$sourcePath\Start-SelfHealingAgent.ps1" -Destination "$agentPath\Scripts\" -Force
        Write-Host "  Copied: Start-SelfHealingAgent.ps1" -ForegroundColor Gray
    }
    
    # Copy Core-Logging module
    if (Test-Path "$sourcePath\Core-Logging.psm1") {
        Copy-Item "$sourcePath\Core-Logging.psm1" -Destination "$agentPath\" -Force
        Write-Host "  Copied: Core-Logging.psm1" -ForegroundColor Gray
    }
    
    # Copy Modules directory
    if (Test-Path "$sourcePath\Modules") {
        Copy-Item "$sourcePath\Modules\*" -Destination "$agentPath\Modules\" -Recurse -Force
        Write-Host "  Copied: Modules directory" -ForegroundColor Gray
    }
    
    Write-Host "  Files copied successfully" -ForegroundColor Green
}
catch {
    Write-Error "Failed to copy files: $_"
    exit 1
}

Write-Host ""
Write-Host "[3/6] Creating default configuration..." -ForegroundColor Green

try {
    $defaultConfig = @{
        CheckIntervalHours = 4
        BusinessHoursStart = 9
        BusinessHoursEnd = 18
        DiskCleanupThresholdGB = 10
        DiskCleanupCriticalGB = 5
        MaxLogAgeDays = 30
        AllowedRemediationModules = @("Network", "Printer", "Disk", "Service")
        EnableSafetyChecks = $true
        NotificationEmail = ""
        Version = "1.0.0"
    }
    
    $configPath = "$agentPath\Config\AgentConfig.json"
    $defaultConfig | ConvertTo-Json -Depth 5 | Out-File $configPath -Encoding UTF8
    
    Write-Host "  Configuration file created: $configPath" -ForegroundColor Gray
    Write-Host "  Default configuration applied" -ForegroundColor Green
}
catch {
    Write-Error "Failed to create configuration: $_"
    exit 1
}

Write-Host ""
Write-Host "[4/6] Creating scheduled task..." -ForegroundColor Green

try {
    # Remove existing task if it exists
    $existingTask = Get-ScheduledTask -TaskName "SelfHealingAgent" -ErrorAction SilentlyContinue
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName "SelfHealingAgent" -Confirm:$false
        Write-Host "  Removed existing scheduled task" -ForegroundColor Gray
    }
    
    # Create new scheduled task
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$agentPath\Scripts\Start-SelfHealingAgent.ps1`""
    
    # Run daily at 2 AM
    $trigger = New-ScheduledTaskTrigger -Daily -At 2AM
    
    # Task settings
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 2)
    
    # Run as SYSTEM with highest privileges
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    # Register the task
    Register-ScheduledTask -TaskName "SelfHealingAgent" `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Automated IT issue detection and remediation agent. Runs daily to detect and fix common Windows issues." `
        -Force | Out-Null
    
    Write-Host "  Scheduled task created: SelfHealingAgent" -ForegroundColor Gray
    Write-Host "  Schedule: Daily at 2:00 AM" -ForegroundColor Gray
    Write-Host "  Scheduled task configured successfully" -ForegroundColor Green
}
catch {
    Write-Error "Failed to create scheduled task: $_"
    Write-Host "You can manually create the scheduled task later" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/6] Registering event log source..." -ForegroundColor Green

try {
    # Check if event source already exists
    if ([System.Diagnostics.EventLog]::SourceExists("SelfHealingAgent")) {
        Write-Host "  Event log source already exists" -ForegroundColor Gray
    }
    else {
        New-EventLog -LogName "Application" -Source "SelfHealingAgent" -ErrorAction Stop
        Write-Host "  Event log source registered: SelfHealingAgent" -ForegroundColor Gray
    }
    Write-Host "  Event log source configured successfully" -ForegroundColor Green
}
catch {
    Write-Warning "Failed to register event log source: $_"
    Write-Host "  Agent will still function, but event logging may be limited" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[6/6] Creating uninstall script..." -ForegroundColor Green

try {
    $uninstallScript = @"
# Uninstall Self-Healing Agent
# Must be run as Administrator

if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

Write-Host "=== Self-Healing Agent Uninstallation ===" -ForegroundColor Cyan

# Remove scheduled task
Write-Host "Removing scheduled task..." -ForegroundColor Yellow
Unregister-ScheduledTask -TaskName "SelfHealingAgent" -Confirm:`$false -ErrorAction SilentlyContinue

# Remove event log source
Write-Host "Removing event log source..." -ForegroundColor Yellow
Remove-EventLog -Source "SelfHealingAgent" -ErrorAction SilentlyContinue

# Remove installation directory
Write-Host "Removing installation directory..." -ForegroundColor Yellow
Remove-Item -Path "$agentPath" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Self-Healing Agent uninstalled successfully!" -ForegroundColor Green
"@
    
    $uninstallScript | Out-File "$agentPath\Uninstall-Agent.ps1" -Encoding UTF8
    Write-Host "  Uninstall script created: $agentPath\Uninstall-Agent.ps1" -ForegroundColor Gray
}
catch {
    Write-Warning "Failed to create uninstall script: $_"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Self-Healing Agent installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installation Details:" -ForegroundColor White
Write-Host "  Location: $agentPath" -ForegroundColor Gray
Write-Host "  Scheduled Task: SelfHealingAgent (Daily at 2:00 AM)" -ForegroundColor Gray
Write-Host "  Configuration: $agentPath\Config\AgentConfig.json" -ForegroundColor Gray
Write-Host "  Logs: $agentPath\Logs" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Review and customize: $agentPath\Config\AgentConfig.json" -ForegroundColor Gray
Write-Host "  2. Test the agent: $agentPath\Scripts\Start-SelfHealingAgent.ps1 -TestOnly" -ForegroundColor Gray
Write-Host "  3. Run manually: $agentPath\Scripts\Start-SelfHealingAgent.ps1" -ForegroundColor Gray
Write-Host "  4. View logs: $agentPath\Logs" -ForegroundColor Gray
Write-Host ""
Write-Host "To uninstall, run: $agentPath\Uninstall-Agent.ps1" -ForegroundColor Gray
Write-Host ""
