# Disk Remediation Module
# Automatically cleans disk space by removing temporary files and caches

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Test-AdminPrivileges {
    <#
    .SYNOPSIS
    Checks if the script is running with administrator privileges
    #>
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Clean-DiskSpace {
    <#
    .SYNOPSIS
    Cleans disk space by removing temporary files, caches, and update leftovers
    
    .PARAMETER Issues
    Array of detected disk space issues
    
    .RETURNS
    Hashtable containing actions taken, space freed, and success status
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Issues
    )
    
    Write-AgentLog -Message "Starting disk space cleanup for $($Issues.Count) issue(s)" `
        -Level "INFO" -Component "DiskCleanup" -Operation "Clean-DiskSpace"
    
    # Check for admin privileges
    if (-not (Test-AdminPrivileges)) {
        Write-AgentLog -Message "Disk cleanup requires administrator privileges" `
            -Level "ERROR" -Component "DiskCleanup"
        return @{
            ActionsTaken = @()
            Success = $false
            ErrorMessage = "Administrator privileges required"
            SpaceFreedGB = 0
            Timestamp = Get-Date
        }
    }
    
    $actionsTaken = @()
    $errors = @()
    $spaceFreed = 0
    
    # Clean Windows Temp files
    Write-AgentLog -Message "Cleaning temporary files" `
        -Level "INFO" -Component "DiskCleanup"
    
    $tempPaths = @(
        "$env:TEMP",
        "$env:SystemRoot\Temp",
        "$env:SystemRoot\Prefetch",
        "$env:LOCALAPPDATA\Temp"
    )
    
    foreach ($path in $tempPaths) {
        if (Test-Path $path) {
            try {
                Write-AgentLog -Message "Cleaning path: $path" `
                    -Level "INFO" -Component "DiskCleanup"
                
                # Calculate size before cleanup
                $filesBefore = Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue
                $sizeBefore = ($filesBefore | Measure-Object -Property Length -Sum).Sum
                
                if ($null -eq $sizeBefore) { $sizeBefore = 0 }
                
                # Remove files older than 7 days
                $oldFiles = $filesBefore | Where-Object { 
                    $_.LastWriteTime -lt (Get-Date).AddDays(-7) 
                }
                
                $removedCount = 0
                foreach ($file in $oldFiles) {
                    try {
                        Remove-Item $file.FullName -Force -ErrorAction Stop
                        $removedCount++
                    }
                    catch {
                        # Silently skip files in use
                    }
                }
                
                # Calculate size after cleanup
                $filesAfter = Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue
                $sizeAfter = ($filesAfter | Measure-Object -Property Length -Sum).Sum
                
                if ($null -eq $sizeAfter) { $sizeAfter = 0 }
                
                $freed = ($sizeBefore - $sizeAfter) / 1GB
                
                if ($freed -gt 0.01) {
                    $spaceFreed += $freed
                    $actionsTaken += "Cleaned temp files from $path (Freed: $([math]::Round($freed, 2))GB, Files: $removedCount)"
                    Write-AgentLog -Message "Cleaned $path - Freed: $([math]::Round($freed, 2))GB" `
                        -Level "AUDIT" -Component "DiskCleanup"
                }
                else {
                    Write-AgentLog -Message "No significant space freed from $path" `
                        -Level "INFO" -Component "DiskCleanup"
                }
            }
            catch {
                $errors += "Failed to clean $path : $_"
                Write-AgentLog -Message "Failed to clean $path : $_" `
                    -Level "ERROR" -Component "DiskCleanup"
            }
        }
        else {
            Write-AgentLog -Message "Path not found: $path" `
                -Level "INFO" -Component "DiskCleanup"
        }
    }
    
    # Clean Windows Update cache
    try {
        Write-AgentLog -Message "Cleaning Windows Update cache" `
            -Level "INFO" -Component "DiskCleanup"
        
        $wuPath = "$env:SystemRoot\SoftwareDistribution\Download"
        
        if (Test-Path $wuPath) {
            # Stop Windows Update service
            $wuService = Get-Service -Name "wuauserv" -ErrorAction SilentlyContinue
            $wasRunning = $false
            
            if ($wuService -and $wuService.Status -eq "Running") {
                Stop-Service -Name "wuauserv" -Force -ErrorAction Stop
                $wasRunning = $true
                Start-Sleep -Seconds 2
            }
            
            # Calculate size before
            $wuFiles = Get-ChildItem $wuPath -Recurse -File -ErrorAction SilentlyContinue
            $wuSizeBefore = ($wuFiles | Measure-Object -Property Length -Sum).Sum
            if ($null -eq $wuSizeBefore) { $wuSizeBefore = 0 }
            
            # Clean the directory
            Remove-Item "$wuPath\*" -Recurse -Force -ErrorAction SilentlyContinue
            
            # Calculate space freed
            $wuFreed = $wuSizeBefore / 1GB
            
            if ($wuFreed -gt 0.01) {
                $spaceFreed += $wuFreed
                $actionsTaken += "Cleaned Windows Update cache (Freed: $([math]::Round($wuFreed, 2))GB)"
                Write-AgentLog -Message "Cleaned Windows Update cache - Freed: $([math]::Round($wuFreed, 2))GB" `
                    -Level "AUDIT" -Component "DiskCleanup"
            }
            
            # Restart Windows Update service if it was running
            if ($wasRunning) {
                Start-Service -Name "wuauserv" -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        $errors += "Failed to clean Windows Update cache: $_"
        Write-AgentLog -Message "Failed to clean Windows Update cache: $_" `
            -Level "ERROR" -Component "DiskCleanup"
    }
    
    # Clean Recycle Bin
    try {
        Write-AgentLog -Message "Emptying Recycle Bin" `
            -Level "INFO" -Component "DiskCleanup"
        
        # Use Clear-RecycleBin if available (PowerShell 5.0+)
        if (Get-Command Clear-RecycleBin -ErrorAction SilentlyContinue) {
            Clear-RecycleBin -Force -ErrorAction Stop
            $actionsTaken += "Emptied Recycle Bin"
            Write-AgentLog -Message "Recycle Bin emptied" `
                -Level "AUDIT" -Component "DiskCleanup"
        }
        else {
            # Fallback method for older PowerShell
            $shell = New-Object -ComObject Shell.Application
            $recycleBin = $shell.Namespace(0xA)
            $recycleBin.Items() | ForEach-Object { 
                Remove-Item $_.Path -Recurse -Force -ErrorAction SilentlyContinue 
            }
            $actionsTaken += "Emptied Recycle Bin (legacy method)"
            Write-AgentLog -Message "Recycle Bin emptied (legacy method)" `
                -Level "AUDIT" -Component "DiskCleanup"
        }
    }
    catch {
        $errors += "Failed to empty Recycle Bin: $_"
        Write-AgentLog -Message "Failed to empty Recycle Bin: $_" `
            -Level "WARN" -Component "DiskCleanup"
    }
    
    # Clean browser caches (Chrome, Edge)
    try {
        Write-AgentLog -Message "Cleaning browser caches" `
            -Level "INFO" -Component "DiskCleanup"
        
        $browserPaths = @(
            "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
            "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
        )
        
        foreach ($browserPath in $browserPaths) {
            if (Test-Path $browserPath) {
                try {
                    $cacheFiles = Get-ChildItem $browserPath -Recurse -File -ErrorAction SilentlyContinue
                    $cacheSize = ($cacheFiles | Measure-Object -Property Length -Sum).Sum
                    
                    if ($null -eq $cacheSize) { $cacheSize = 0 }
                    
                    Remove-Item "$browserPath\*" -Recurse -Force -ErrorAction SilentlyContinue
                    
                    $cacheFreed = $cacheSize / 1GB
                    if ($cacheFreed -gt 0.01) {
                        $spaceFreed += $cacheFreed
                        $actionsTaken += "Cleaned browser cache (Freed: $([math]::Round($cacheFreed, 2))GB)"
                        Write-AgentLog -Message "Cleaned browser cache - Freed: $([math]::Round($cacheFreed, 2))GB" `
                            -Level "AUDIT" -Component "DiskCleanup"
                    }
                }
                catch {
                    Write-AgentLog -Message "Failed to clean browser cache at $browserPath" `
                        -Level "WARN" -Component "DiskCleanup"
                }
            }
        }
    }
    catch {
        Write-AgentLog -Message "Browser cache cleanup error: $_" `
            -Level "WARN" -Component "DiskCleanup"
    }
    
    $success = ($actionsTaken.Count -gt 0) -and ($errors.Count -eq 0)
    
    Write-AgentLog -Message "Disk cleanup completed. Actions: $($actionsTaken.Count), Space freed: $([math]::Round($spaceFreed, 2))GB, Errors: $($errors.Count)" `
        -Level "INFO" -Component "DiskCleanup" -Operation "Clean-DiskSpace"
    
    return @{
        ActionsTaken = $actionsTaken
        Errors = $errors
        SpaceFreedGB = [math]::Round($spaceFreed, 2)
        Success = $success
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Clean-DiskSpace
