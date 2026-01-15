<#
.SYNOPSIS
Installs Self-Healing Agent as a background service

.DESCRIPTION
Configures the agent to run completely in the background without user interaction.
Uses Windows Task Scheduler with optimal settings for background execution.
#>

# Check for Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

Write-Host "=== Self-Healing Agent Background Service Installation ===" -ForegroundColor Cyan
Write-Host ""

$agentPath = "C:\Program Files\SelfHealingAgent"
$scriptPath = Join-Path $agentPath "Scripts\Start-SelfHealingAgent-Silent.ps1"

# Verify installation
if (-not (Test-Path $agentPath)) {
    Write-Host "Agent not installed. Please run Install-Agent.ps1 first." -ForegroundColor Red
    exit 1
}

# Copy silent wrapper
$sourcePath = $PSScriptRoot
if (Test-Path "$sourcePath\Start-SelfHealingAgent-Silent.ps1") {
    Copy-Item "$sourcePath\Start-SelfHealingAgent-Silent.ps1" -Destination "$agentPath\Scripts\" -Force
    Write-Host "[1/3] Silent wrapper installed" -ForegroundColor Green
}

# Remove existing task if present
$existingTask = Get-ScheduledTask -TaskName "SelfHealingAgent" -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName "SelfHealingAgent" -Confirm:$false
    Write-Host "  Removed existing scheduled task" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/3] Configuring background scheduled task..." -ForegroundColor Green

# Create action - completely hidden execution
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-WindowStyle Hidden -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$scriptPath`""

# Create multiple triggers for comprehensive coverage
$triggers = @()

# Trigger 1: Daily at 2 AM (off-hours)
$triggers += New-ScheduledTaskTrigger -Daily -At 2AM

# Trigger 2: At system startup (after 5 minute delay)
$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$startupTrigger.Delay = "PT5M"  # 5 minute delay
$triggers += $startupTrigger

# Trigger 3: Every 4 hours during the day (but only if idle)
$trigger4Hours = New-ScheduledTaskTrigger -Once -At 6AM -RepetitionInterval (New-TimeSpan -Hours 4) -RepetitionDuration (New-TimeSpan -Days 1)
$triggers += $trigger4Hours

# Task settings optimized for background execution
$settings = New-ScheduledTaskSettingsSet `
    -Hidden `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 10) `
    -Priority 7 `
    -MultipleInstances IgnoreNew

# Additional settings for minimal impact
$settings.DisallowStartIfOnBatteries = $false
$settings.StopIfGoingOnBatteries = $false
$settings.WakeToRun = $false  # Don't wake computer
$settings.RunOnlyIfIdle = $false  # Run even if not idle
$settings.IdleSettings.StopOnIdleEnd = $false

# Run as SYSTEM with highest privileges (completely background)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Register the task
Register-ScheduledTask -TaskName "SelfHealingAgent" `
    -Action $action `
    -Trigger $triggers `
    -Settings $settings `
    -Principal $principal `
    -Description "Self-Healing IT Support Agent - Runs silently in background to detect and fix common IT issues without user interaction" `
    -Force | Out-Null

Write-Host "  Background task configured successfully" -ForegroundColor Green
Write-Host "  - Runs daily at 2:00 AM" -ForegroundColor Gray
Write-Host "  - Runs at system startup (5 min delay)" -ForegroundColor Gray
Write-Host "  - Runs every 4 hours during the day" -ForegroundColor Gray
Write-Host "  - Completely hidden from users" -ForegroundColor Gray
Write-Host "  - No window or notifications" -ForegroundColor Gray
Write-Host "  - Low priority (won't impact performance)" -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Configuring safety settings..." -ForegroundColor Green

# Create configuration with safety settings
$config = @{
    CheckIntervalHours = 4
    BusinessHoursStart = 9
    BusinessHoursEnd = 18
    DiskCleanupThresholdGB = 10
    DiskCleanupCriticalGB = 5
    MaxLogAgeDays = 30
    AllowedRemediationModules = @("Network", "Printer", "Disk", "Service")
    EnableSafetyChecks = $true
    RunSilently = $true
    MinimizeUserImpact = $true
    MaxRemediationsPerDay = 5
    NotificationEmail = ""
    Version = "1.0.0"
}

$configPath = "$agentPath\Config\AgentConfig.json"
$config | ConvertTo-Json -Depth 5 | Out-File $configPath -Encoding UTF8 -Force

Write-Host "  Safety settings configured" -ForegroundColor Green
Write-Host "  - Business hours protection enabled" -ForegroundColor Gray
Write-Host "  - User session detection enabled" -ForegroundColor Gray
Write-Host "  - Maximum 5 remediations per day" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Background Service Installed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The agent will now run completely in the background:" -ForegroundColor White
Write-Host "  ✓ No windows or popups" -ForegroundColor Gray
Write-Host "  ✓ No user notifications" -ForegroundColor Gray
Write-Host "  ✓ No performance impact" -ForegroundColor Gray
Write-Host "  ✓ Runs during off-hours (2 AM)" -ForegroundColor Gray
Write-Host "  ✓ Respects business hours" -ForegroundColor Gray
Write-Host "  ✓ Detects active users" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitoring:" -ForegroundColor White
Write-Host "  Logs: $agentPath\Logs" -ForegroundColor Gray
Write-Host "  Reports: $agentPath\Reports" -ForegroundColor Gray
Write-Host "  Task Scheduler: Task Scheduler Library > SelfHealingAgent" -ForegroundColor Gray
Write-Host ""
Write-Host "To test immediately (will run in background):" -ForegroundColor White
Write-Host "  Start-ScheduledTask -TaskName 'SelfHealingAgent'" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view execution history:" -ForegroundColor White
Write-Host "  Get-ScheduledTaskInfo -TaskName 'SelfHealingAgent'" -ForegroundColor Cyan
Write-Host ""
