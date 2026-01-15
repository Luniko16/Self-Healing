# Printer Remediation Module
# Automatically fixes printer spooler and print job issues

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

function Repair-PrinterIssues {
    <#
    .SYNOPSIS
    Attempts to repair printer and print spooler issues
    
    .PARAMETER Issues
    Array of detected printer issues to remediate
    
    .RETURNS
    Hashtable containing actions taken and success status
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Issues
    )
    
    Write-AgentLog -Message "Starting printer remediation with $($Issues.Count) issues" `
        -Level "INFO" -Component "PrinterFix" -Operation "Repair-PrinterIssues"
    
    # Check for admin privileges
    if (-not (Test-AdminPrivileges)) {
        Write-AgentLog -Message "Printer remediation requires administrator privileges" `
            -Level "ERROR" -Component "PrinterFix"
        return @{
            ActionsTaken = @()
            Success = $false
            ErrorMessage = "Administrator privileges required"
            Timestamp = Get-Date
        }
    }
    
    $actionsTaken = @()
    $errors = @()
    
    foreach ($issue in $Issues) {
        Write-AgentLog -Message "Processing issue: $issue" `
            -Level "INFO" -Component "PrinterFix"
        
        switch -Wildcard ($issue) {
            "*Spooler*" {
                try {
                    Write-AgentLog -Message "Restarting Print Spooler service" `
                        -Level "INFO" -Component "PrinterFix"
                    
                    # Stop print spooler
                    Stop-Service -Name "Spooler" -Force -ErrorAction Stop
                    Start-Sleep -Seconds 3
                    
                    Write-AgentLog -Message "Print Spooler stopped, clearing spool directory" `
                        -Level "INFO" -Component "PrinterFix"
                    
                    # Clear spooler directory
                    $spoolPath = "$env:SystemRoot\System32\spool\PRINTERS"
                    if (Test-Path $spoolPath) {
                        $clearedFiles = Get-ChildItem "$spoolPath\*" -ErrorAction SilentlyContinue
                        $fileCount = $clearedFiles.Count
                        
                        $clearedFiles | Remove-Item -Force -ErrorAction SilentlyContinue
                        
                        Write-AgentLog -Message "Cleared $fileCount file(s) from spool directory" `
                            -Level "INFO" -Component "PrinterFix"
                    }
                    
                    # Start print spooler
                    Start-Service -Name "Spooler" -ErrorAction Stop
                    Start-Sleep -Seconds 2
                    
                    # Verify service is running
                    $spooler = Get-Service -Name "Spooler"
                    if ($spooler.Status -eq "Running") {
                        $actionsTaken += "Restarted Print Spooler service and cleared queue"
                        Write-AgentLog -Message "Print Spooler successfully restarted" `
                            -Level "AUDIT" -Component "PrinterFix"
                    }
                    else {
                        $errors += "Print Spooler failed to start (Status: $($spooler.Status))"
                        Write-AgentLog -Message "Print Spooler failed to start: $($spooler.Status)" `
                            -Level "ERROR" -Component "PrinterFix"
                    }
                }
                catch {
                    $errors += "Print Spooler restart failed: $_"
                    Write-AgentLog -Message "Print Spooler restart failed: $_" `
                        -Level "ERROR" -Component "PrinterFix"
                }
                
                break
            }
            
            "*stuck*" {
                try {
                    Write-AgentLog -Message "Clearing stuck print jobs" `
                        -Level "INFO" -Component "PrinterFix"
                    
                    # Get all print jobs before removal
                    $printJobs = Get-PrintJob -ErrorAction SilentlyContinue
                    $jobCount = $printJobs.Count
                    
                    if ($jobCount -gt 0) {
                        # Remove all print jobs
                        $printJobs | Remove-PrintJob -ErrorAction Stop
                        
                        $actionsTaken += "Cleared $jobCount print job(s)"
                        Write-AgentLog -Message "Cleared $jobCount print job(s)" `
                            -Level "AUDIT" -Component "PrinterFix"
                    }
                    else {
                        Write-AgentLog -Message "No print jobs found to clear" `
                            -Level "INFO" -Component "PrinterFix"
                    }
                }
                catch {
                    $errors += "Failed to clear print jobs: $_"
                    Write-AgentLog -Message "Failed to clear print jobs: $_" `
                        -Level "ERROR" -Component "PrinterFix"
                }
                
                break
            }
            
            "*printer*" {
                try {
                    Write-AgentLog -Message "Restarting printer-related services" `
                        -Level "INFO" -Component "PrinterFix"
                    
                    # Restart printer-specific services
                    $services = @("HTTP", "LanmanServer", "Spooler")
                    $restartedServices = @()
                    
                    foreach ($serviceName in $services) {
                        try {
                            $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
                            
                            if ($service -and $service.Status -eq "Running") {
                                Restart-Service -Name $serviceName -Force -ErrorAction Stop
                                $restartedServices += $serviceName
                                
                                Write-AgentLog -Message "Restarted service: $serviceName" `
                                    -Level "INFO" -Component "PrinterFix"
                            }
                            elseif ($service -and $service.Status -eq "Stopped") {
                                Start-Service -Name $serviceName -ErrorAction Stop
                                $restartedServices += $serviceName
                                
                                Write-AgentLog -Message "Started service: $serviceName" `
                                    -Level "INFO" -Component "PrinterFix"
                            }
                        }
                        catch {
                            Write-AgentLog -Message "Failed to restart service $serviceName : $_" `
                                -Level "WARN" -Component "PrinterFix"
                        }
                    }
                    
                    if ($restartedServices.Count -gt 0) {
                        $actionsTaken += "Restarted printer-related services: $($restartedServices -join ', ')"
                        Write-AgentLog -Message "Restarted $($restartedServices.Count) printer-related service(s)" `
                            -Level "AUDIT" -Component "PrinterFix"
                    }
                }
                catch {
                    $errors += "Failed to restart printer services: $_"
                    Write-AgentLog -Message "Failed to restart printer services: $_" `
                        -Level "ERROR" -Component "PrinterFix"
                }
                
                break
            }
            
            "*offline*" {
                try {
                    Write-AgentLog -Message "Attempting to bring printers online" `
                        -Level "INFO" -Component "PrinterFix"
                    
                    # Try to restart all printers
                    $printers = Get-Printer -ErrorAction SilentlyContinue
                    $fixedPrinters = @()
                    
                    foreach ($printer in $printers) {
                        try {
                            # Remove and re-add printer port binding (soft reset)
                            Set-Printer -Name $printer.Name -ErrorAction Stop
                            $fixedPrinters += $printer.Name
                        }
                        catch {
                            Write-AgentLog -Message "Failed to reset printer: $($printer.Name)" `
                                -Level "WARN" -Component "PrinterFix"
                        }
                    }
                    
                    if ($fixedPrinters.Count -gt 0) {
                        $actionsTaken += "Reset $($fixedPrinters.Count) printer(s)"
                        Write-AgentLog -Message "Reset printers: $($fixedPrinters -join ', ')" `
                            -Level "AUDIT" -Component "PrinterFix"
                    }
                }
                catch {
                    $errors += "Failed to bring printers online: $_"
                    Write-AgentLog -Message "Failed to bring printers online: $_" `
                        -Level "ERROR" -Component "PrinterFix"
                }
                
                break
            }
        }
        
        Start-Sleep -Seconds 2
    }
    
    $success = ($actionsTaken.Count -gt 0) -and ($errors.Count -eq 0)
    
    Write-AgentLog -Message "Printer remediation completed. Actions: $($actionsTaken.Count), Errors: $($errors.Count)" `
        -Level "INFO" -Component "PrinterFix" -Operation "Repair-PrinterIssues"
    
    return @{
        ActionsTaken = $actionsTaken
        Errors = $errors
        Success = $success
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Repair-PrinterIssues
