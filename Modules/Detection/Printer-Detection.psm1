# Printer Detection Module
# Detects printer spooler issues, stuck jobs, and printer failures

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Test-PrinterHealth {
    <#
    .SYNOPSIS
    Comprehensive printer health detection
    
    .RETURNS
    Hashtable containing detection results and identified issues
    #>
    
    Write-AgentLog -Message "Starting printer health detection" `
        -Level "INFO" -Component "PrinterDetect" -Operation "Test-PrinterHealth"
    
    $issues = @()
    $spoolerStatus = "Unknown"
    $stuckJobCount = 0
    
    # Check print spooler service
    try {
        Write-AgentLog -Message "Checking Print Spooler service status" `
            -Level "INFO" -Component "PrinterDetect"
        
        $spooler = Get-Service -Name "Spooler" -ErrorAction Stop
        $spoolerStatus = $spooler.Status
        
        if ($spooler.Status -ne "Running") {
            $issues += "Print Spooler service is not running (Status: $($spooler.Status))"
            Write-AgentLog -Message "Print Spooler not running: $($spooler.Status)" `
                -Level "WARN" -Component "PrinterDetect"
        }
        else {
            Write-AgentLog -Message "Print Spooler is running" `
                -Level "INFO" -Component "PrinterDetect"
        }
    }
    catch {
        $issues += "Failed to check Print Spooler service: $($_.Exception.Message)"
        Write-AgentLog -Message "Print Spooler check failed: $_" `
            -Level "ERROR" -Component "PrinterDetect"
    }
    
    # Check for stuck print jobs
    try {
        Write-AgentLog -Message "Checking for stuck print jobs" `
            -Level "INFO" -Component "PrinterDetect"
        
        $stuckJobs = Get-PrintJob -ErrorAction SilentlyContinue | 
            Where-Object { $_.JobStatus -match "Error|Blocked|Paused|Offline" }
        
        if ($stuckJobs) {
            $stuckJobCount = $stuckJobs.Count
            $issues += "Found $stuckJobCount stuck/errored print jobs"
            Write-AgentLog -Message "Found $stuckJobCount stuck print jobs" `
                -Level "WARN" -Component "PrinterDetect"
            
            # Log details of stuck jobs
            foreach ($job in $stuckJobs) {
                Write-AgentLog -Message "Stuck job: $($job.DocumentName) on $($job.PrinterName) - Status: $($job.JobStatus)" `
                    -Level "INFO" -Component "PrinterDetect"
            }
        }
        else {
            Write-AgentLog -Message "No stuck print jobs found" `
                -Level "INFO" -Component "PrinterDetect"
        }
    }
    catch {
        Write-AgentLog -Message "Print job check failed: $_" `
            -Level "WARN" -Component "PrinterDetect"
    }
    
    # Check if any printers are installed
    try {
        Write-AgentLog -Message "Checking installed printers" `
            -Level "INFO" -Component "PrinterDetect"
        
        $allPrinters = Get-Printer -ErrorAction SilentlyContinue
        
        if (-not $allPrinters) {
            $issues += "No printers installed on this system"
            Write-AgentLog -Message "No printers found" `
                -Level "WARN" -Component "PrinterDetect"
        }
        else {
            Write-AgentLog -Message "Found $($allPrinters.Count) printer(s)" `
                -Level "INFO" -Component "PrinterDetect"
            
            # Check for offline or error state printers
            $problemPrinters = $allPrinters | Where-Object { 
                $_.PrinterStatus -match "Offline|Error|PaperJam|PaperOut|DoorOpen" 
            }
            
            if ($problemPrinters) {
                foreach ($printer in $problemPrinters) {
                    $issues += "Printer '$($printer.Name)' has issues: $($printer.PrinterStatus)"
                    Write-AgentLog -Message "Printer issue: $($printer.Name) - $($printer.PrinterStatus)" `
                        -Level "WARN" -Component "PrinterDetect"
                }
            }
        }
    }
    catch {
        Write-AgentLog -Message "Printer enumeration failed: $_" `
            -Level "WARN" -Component "PrinterDetect"
    }
    
    # Test default printer
    try {
        Write-AgentLog -Message "Checking default printer" `
            -Level "INFO" -Component "PrinterDetect"
        
        $defaultPrinter = Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE" -ErrorAction Stop
        
        if ($defaultPrinter) {
            Write-AgentLog -Message "Default printer: $($defaultPrinter.Name)" `
                -Level "INFO" -Component "PrinterDetect"
            
            # Printer status codes:
            # 1 = Other, 2 = Unknown, 3 = Idle, 4 = Printing, 5 = Warmup
            # 6 = Stopped Printing, 7 = Offline
            $statusMap = @{
                1 = "Other"
                2 = "Unknown"
                3 = "Idle"
                4 = "Printing"
                5 = "Warmup"
                6 = "Stopped Printing"
                7 = "Offline"
            }
            
            $statusText = $statusMap[$defaultPrinter.PrinterStatus]
            
            if ($defaultPrinter.PrinterStatus -notin @(3, 4, 5)) {
                $issues += "Default printer '$($defaultPrinter.Name)' status: $statusText"
                Write-AgentLog -Message "Default printer issue: $($defaultPrinter.Name) - $statusText" `
                    -Level "WARN" -Component "PrinterDetect"
            }
            else {
                Write-AgentLog -Message "Default printer status: $statusText" `
                    -Level "INFO" -Component "PrinterDetect"
            }
        }
        else {
            Write-AgentLog -Message "No default printer configured" `
                -Level "INFO" -Component "PrinterDetect"
        }
    }
    catch {
        Write-AgentLog -Message "Default printer check failed: $_" `
            -Level "WARN" -Component "PrinterDetect"
    }
    
    Write-AgentLog -Message "Printer health detection completed. Issues found: $($issues.Count)" `
        -Level "INFO" -Component "PrinterDetect" -Operation "Test-PrinterHealth"
    
    return @{
        HasIssues = ($issues.Count -gt 0)
        Issues = $issues
        IssueCount = $issues.Count
        SpoolerStatus = $spoolerStatus
        StuckJobCount = $stuckJobCount
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Test-PrinterHealth
