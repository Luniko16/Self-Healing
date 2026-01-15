# Disk Detection Module
# Detects low disk space issues on fixed drives

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Test-DiskSpace {
    <#
    .SYNOPSIS
    Detects low disk space on fixed drives
    
    .PARAMETER WarningThresholdGB
    Warning threshold in GB (default: 10GB)
    
    .PARAMETER CriticalThresholdGB
    Critical threshold in GB (default: 5GB)
    
    .RETURNS
    Hashtable containing detection results and identified issues
    #>
    param(
        [int]$WarningThresholdGB = 10,
        [int]$CriticalThresholdGB = 5
    )
    
    Write-AgentLog -Message "Starting disk space detection (Warning: ${WarningThresholdGB}GB, Critical: ${CriticalThresholdGB}GB)" `
        -Level "INFO" -Component "DiskDetect" -Operation "Test-DiskSpace"
    
    $issues = @()
    $volumeDetails = @()
    
    try {
        # Get all fixed drives with drive letters
        $volumes = Get-Volume -ErrorAction Stop | 
            Where-Object { $_.DriveType -eq "Fixed" -and $_.DriveLetter }
        
        Write-AgentLog -Message "Found $($volumes.Count) fixed drive(s) to check" `
            -Level "INFO" -Component "DiskDetect"
        
        foreach ($volume in $volumes) {
            try {
                $freeGB = [math]::Round($volume.SizeRemaining / 1GB, 2)
                $totalGB = [math]::Round($volume.Size / 1GB, 2)
                $usedGB = [math]::Round(($volume.Size - $volume.SizeRemaining) / 1GB, 2)
                $freePercent = if ($totalGB -gt 0) { 
                    [math]::Round(($freeGB / $totalGB) * 100, 2) 
                } else { 
                    0 
                }
                
                Write-AgentLog -Message "Drive $($volume.DriveLetter): - Free: ${freeGB}GB / ${totalGB}GB (${freePercent}%)" `
                    -Level "INFO" -Component "DiskDetect"
                
                # Check thresholds
                if ($freeGB -lt $CriticalThresholdGB) {
                    $issues += "CRITICAL: Drive $($volume.DriveLetter): has only ${freeGB}GB free (${freePercent}%)"
                    Write-AgentLog -Message "CRITICAL: Drive $($volume.DriveLetter): has only ${freeGB}GB free" `
                        -Level "ERROR" -Component "DiskDetect"
                } 
                elseif ($freeGB -lt $WarningThresholdGB) {
                    $issues += "WARNING: Drive $($volume.DriveLetter): has only ${freeGB}GB free (${freePercent}%)"
                    Write-AgentLog -Message "WARNING: Drive $($volume.DriveLetter): has only ${freeGB}GB free" `
                        -Level "WARN" -Component "DiskDetect"
                }
                else {
                    Write-AgentLog -Message "Drive $($volume.DriveLetter): has sufficient space" `
                        -Level "INFO" -Component "DiskDetect"
                }
                
                # Store volume details
                $volumeDetails += @{
                    Drive = $volume.DriveLetter
                    FreeGB = $freeGB
                    UsedGB = $usedGB
                    TotalGB = $totalGB
                    FreePercent = $freePercent
                    FileSystem = $volume.FileSystem
                    HealthStatus = $volume.HealthStatus
                }
            }
            catch {
                Write-AgentLog -Message "Failed to process volume $($volume.DriveLetter): $_" `
                    -Level "ERROR" -Component "DiskDetect"
            }
        }
    }
    catch {
        $issues += "Failed to enumerate disk volumes: $($_.Exception.Message)"
        Write-AgentLog -Message "Volume enumeration failed: $_" `
            -Level "ERROR" -Component "DiskDetect"
    }
    
    Write-AgentLog -Message "Disk space detection completed. Issues found: $($issues.Count)" `
        -Level "INFO" -Component "DiskDetect" -Operation "Test-DiskSpace"
    
    return @{
        HasIssues = ($issues.Count -gt 0)
        Issues = $issues
        IssueCount = $issues.Count
        Volumes = $volumeDetails
        WarningThresholdGB = $WarningThresholdGB
        CriticalThresholdGB = $CriticalThresholdGB
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Test-DiskSpace
