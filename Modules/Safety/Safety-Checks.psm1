# Safety Checks Module
# Ensures remediation operations are safe to perform

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Test-SafeToRemediate {
    <#
    .SYNOPSIS
    Performs safety checks before allowing remediation operations
    
    .PARAMETER Operation
    The type of operation to check (e.g., DiskCleanup, NetworkFix, ServiceRestart)
    
    .PARAMETER IgnoreBusinessHours
    Skip business hours check
    
    .PARAMETER IgnoreUserSessions
    Skip active user session check
    
    .RETURNS
    Boolean indicating if it's safe to proceed with remediation
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Operation,
        
        [switch]$IgnoreBusinessHours = $false,
        
        [switch]$IgnoreUserSessions = $false
    )
    
    Write-AgentLog -Message "Starting safety checks for operation: $Operation" `
        -Level "INFO" -Component "Safety" -Operation "Test-SafeToRemediate"
    
    $safetyIssues = @()
    
    # Check 1: Business hours (9 AM - 6 PM)
    if (-not $IgnoreBusinessHours) {
        try {
            $hour = (Get-Date).Hour
            $dayOfWeek = (Get-Date).DayOfWeek
            
            # Check if it's a weekday during business hours
            if ($dayOfWeek -notin @([DayOfWeek]::Saturday, [DayOfWeek]::Sunday)) {
                if ($hour -ge 9 -and $hour -lt 18) {
                    $safetyIssues += "Business hours detected (9 AM - 6 PM on weekday)"
                    Write-AgentLog -Message "Business hours - remediation may impact users" `
                        -Level "WARN" -Component "Safety"
                }
                else {
                    Write-AgentLog -Message "Outside business hours - safe to proceed" `
                        -Level "INFO" -Component "Safety"
                }
            }
            else {
                Write-AgentLog -Message "Weekend detected - safe to proceed" `
                    -Level "INFO" -Component "Safety"
            }
        }
        catch {
            Write-AgentLog -Message "Failed to check business hours: $_" `
                -Level "WARN" -Component "Safety"
        }
    }
    
    # Check 2: Active user sessions
    if (-not $IgnoreUserSessions) {
        try {
            Write-AgentLog -Message "Checking for active user sessions" `
                -Level "INFO" -Component "Safety"
            
            # Try quser command (works on most Windows systems)
            $sessions = quser 2>$null
            
            if ($sessions) {
                $activeSessions = $sessions | Select-String -Pattern "Active"
                
                if ($activeSessions) {
                    $safetyIssues += "Active user session(s) detected"
                    Write-AgentLog -Message "Active user sessions found - remediation may impact users" `
                        -Level "WARN" -Component "Safety"
                }
                else {
                    Write-AgentLog -Message "No active user sessions" `
                        -Level "INFO" -Component "Safety"
                }
            }
            else {
                # Fallback: Check using WMI
                $loggedOnUsers = Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue
                
                if ($loggedOnUsers -and $loggedOnUsers.UserName) {
                    $safetyIssues += "User logged on: $($loggedOnUsers.UserName)"
                    Write-AgentLog -Message "User logged on: $($loggedOnUsers.UserName)" `
                        -Level "WARN" -Component "Safety"
                }
                else {
                    Write-AgentLog -Message "No users logged on" `
                        -Level "INFO" -Component "Safety"
                }
            }
        }
        catch {
            Write-AgentLog -Message "Failed to check user sessions: $_" `
                -Level "WARN" -Component "Safety"
        }
    }
    
    # Check 3: Disk space threshold for cleanup operations
    if ($Operation -eq "DiskCleanup") {
        try {
            Write-AgentLog -Message "Checking disk space for cleanup operation" `
                -Level "INFO" -Component "Safety"
            
            $systemDrive = Get-Volume -DriveLetter C -ErrorAction Stop
            $freeGB = [math]::Round($systemDrive.SizeRemaining / 1GB, 2)
            
            if ($freeGB -lt 2) {
                $safetyIssues += "Critically low disk space (${freeGB}GB free) - cleanup may be risky"
                Write-AgentLog -Message "Critically low disk space: ${freeGB}GB" `
                    -Level "ERROR" -Component "Safety"
            }
            elseif ($freeGB -lt 5) {
                Write-AgentLog -Message "Low disk space: ${freeGB}GB - proceed with caution" `
                    -Level "WARN" -Component "Safety"
            }
            else {
                Write-AgentLog -Message "Sufficient disk space: ${freeGB}GB" `
                    -Level "INFO" -Component "Safety"
            }
        }
        catch {
            Write-AgentLog -Message "Failed to check disk space: $_" `
                -Level "WARN" -Component "Safety"
        }
    }
    
    # Check 4: Pending reboot
    try {
        Write-AgentLog -Message "Checking for pending reboot" `
            -Level "INFO" -Component "Safety"
        
        $pendingReboot = $false
        
        # Check Windows Update reboot flag
        if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired") {
            $pendingReboot = $true
        }
        
        # Check Component Based Servicing reboot flag
        if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending") {
            $pendingReboot = $true
        }
        
        # Check pending file rename operations
        $pendingFileRename = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" `
            -Name PendingFileRenameOperations -ErrorAction SilentlyContinue
        
        if ($pendingFileRename) {
            $pendingReboot = $true
        }
        
        if ($pendingReboot) {
            $safetyIssues += "System has pending reboot - some operations may not complete properly"
            Write-AgentLog -Message "Pending reboot detected" `
                -Level "WARN" -Component "Safety"
        }
        else {
            Write-AgentLog -Message "No pending reboot" `
                -Level "INFO" -Component "Safety"
        }
    }
    catch {
        Write-AgentLog -Message "Failed to check pending reboot: $_" `
            -Level "WARN" -Component "Safety"
    }
    
    # Check 5: System uptime (avoid remediation right after boot)
    try {
        Write-AgentLog -Message "Checking system uptime" `
            -Level "INFO" -Component "Safety"
        
        $os = Get-WmiObject -Class Win32_OperatingSystem -ErrorAction Stop
        $lastBootTime = $os.ConvertToDateTime($os.LastBootUpTime)
        $uptime = (Get-Date) - $lastBootTime
        
        if ($uptime.TotalMinutes -lt 10) {
            $safetyIssues += "System recently booted ($([math]::Round($uptime.TotalMinutes, 1)) minutes ago) - allow time for services to stabilize"
            Write-AgentLog -Message "System recently booted - waiting for stabilization" `
                -Level "WARN" -Component "Safety"
        }
        else {
            Write-AgentLog -Message "System uptime: $([math]::Round($uptime.TotalHours, 1)) hours" `
                -Level "INFO" -Component "Safety"
        }
    }
    catch {
        Write-AgentLog -Message "Failed to check system uptime: $_" `
            -Level "WARN" -Component "Safety"
    }
    
    # Check 6: High CPU usage
    try {
        Write-AgentLog -Message "Checking CPU usage" `
            -Level "INFO" -Component "Safety"
        
        $cpuUsage = (Get-WmiObject -Class Win32_Processor -ErrorAction Stop | 
            Measure-Object -Property LoadPercentage -Average).Average
        
        if ($cpuUsage -gt 80) {
            $safetyIssues += "High CPU usage detected (${cpuUsage}%) - remediation may impact performance"
            Write-AgentLog -Message "High CPU usage: ${cpuUsage}%" `
                -Level "WARN" -Component "Safety"
        }
        else {
            Write-AgentLog -Message "CPU usage: ${cpuUsage}%" `
                -Level "INFO" -Component "Safety"
        }
    }
    catch {
        Write-AgentLog -Message "Failed to check CPU usage: $_" `
            -Level "WARN" -Component "Safety"
    }
    
    # Determine if safe to proceed
    $isSafe = ($safetyIssues.Count -eq 0)
    
    if ($isSafe) {
        Write-AgentLog -Message "All safety checks passed - safe to proceed with $Operation" `
            -Level "INFO" -Component "Safety" -Operation "Test-SafeToRemediate"
    }
    else {
        Write-AgentLog -Message "Safety checks failed ($($safetyIssues.Count) issue(s)) - remediation not recommended" `
            -Level "WARN" -Component "Safety" -Operation "Test-SafeToRemediate"
        
        foreach ($issue in $safetyIssues) {
            Write-AgentLog -Message "  - $issue" -Level "WARN" -Component "Safety"
        }
    }
    
    return @{
        IsSafe = $isSafe
        SafetyIssues = $safetyIssues
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Test-SafeToRemediate
