<#
.SYNOPSIS
Self-Healing Agent Orchestrator

.DESCRIPTION
Main controller for automated IT issue detection and remediation.
Follows the Detect → Diagnose → Fix → Verify → Report framework.

.PARAMETER Force
Force remediation even if no issues are detected

.PARAMETER Modules
Specify which modules to run (Network, Printer, Disk, Service)

.PARAMETER TestOnly
Run detection only without performing remediation

.EXAMPLE
.\Start-SelfHealingAgent.ps1
Run all modules with detection, remediation, and verification

.EXAMPLE
.\Start-SelfHealingAgent.ps1 -Modules Network,Printer -TestOnly
Test network and printer detection only

.EXAMPLE
.\Start-SelfHealingAgent.ps1 -Force
Force remediation even if no issues detected
#>

param(
    [switch]$Force = $false,
    [string[]]$Modules = @("Network", "Printer", "Disk", "Service"),
    [switch]$TestOnly = $false,
    [switch]$Silent = $false
)

# Get script path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Set process priority to low if running in background
if ($Silent) {
    $process = Get-Process -Id $PID
    $process.PriorityClass = "BelowNormal"
}

# Import core logging module
Import-Module (Join-Path $scriptPath "Core-Logging.psm1") -Force

# Initialize directories
Initialize-AgentDirectories

Write-AgentLog -Message "=== SELF-HEALING AGENT STARTED ===" `
    -Level "INFO" -Component "Orchestrator" -Operation "Start"

Write-AgentLog -Message "Parameters: Force=$Force, TestOnly=$TestOnly, Modules=$($Modules -join ',')" `
    -Level "INFO" -Component "Orchestrator"

# Check for admin privileges
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-AgentLog -Message "WARNING: Not running as Administrator. Some operations may fail." `
        -Level "WARN" -Component "Orchestrator"
}
else {
    Write-AgentLog -Message "Running with Administrator privileges" `
        -Level "INFO" -Component "Orchestrator"
}

# Load configuration (if exists)
$config = Get-AgentConfig -ConfigName "AgentConfig"
if ($config) {
    Write-AgentLog -Message "Configuration loaded successfully" `
        -Level "INFO" -Component "Orchestrator"
}

# Module mapping
$moduleMap = @{
    Network = @{
        Detect = "Modules\Detection\Network-Detection.psm1"
        Fix = "Modules\Remediation\Network-Remediation.psm1"
        Verify = "Modules\Verification\Network-Verification.psm1"
        DetectFunction = "Test-NetworkConnectivity"
        FixFunction = "Repair-NetworkConnectivity"
        VerifyFunction = "Test-NetworkVerification"
    }
    Printer = @{
        Detect = "Modules\Detection\Printer-Detection.psm1"
        Fix = "Modules\Remediation\Printer-Remediation.psm1"
        Verify = $null  # To be created
        DetectFunction = "Test-PrinterHealth"
        FixFunction = "Repair-PrinterIssues"
        VerifyFunction = $null
    }
    Disk = @{
        Detect = "Modules\Detection\Disk-Detection.psm1"
        Fix = "Modules\Remediation\Disk-Remediation.psm1"
        Verify = $null  # To be created
        DetectFunction = "Test-DiskSpace"
        FixFunction = "Clean-DiskSpace"
        VerifyFunction = $null
    }
    Service = @{
        Detect = "Modules\Detection\Service-Detection.psm1"
        Fix = "Modules\Remediation\Service-Remediation.psm1"
        Verify = $null  # To be created
        DetectFunction = "Test-CriticalServices"
        FixFunction = "Repair-Services"
        VerifyFunction = $null
    }
}

# Process each module
$overallResults = @()

foreach ($module in $Modules) {
    if (-not $moduleMap.ContainsKey($module)) {
        Write-AgentLog -Message "Unknown module: $module. Skipping." `
            -Level "WARN" -Component "Orchestrator"
        continue
    }
    
    try {
        Write-AgentLog -Message "Processing module: $module" `
            -Level "INFO" -Component "Orchestrator" -Operation $module
        
        $moduleInfo = $moduleMap[$module]
        
        # Import detection module
        $detectPath = Join-Path $scriptPath $moduleInfo.Detect
        if (Test-Path $detectPath) {
            Import-Module $detectPath -Force
            Write-AgentLog -Message "Loaded detection module: $($moduleInfo.Detect)" `
                -Level "INFO" -Component $module
        }
        else {
            Write-AgentLog -Message "Detection module not found: $detectPath" `
                -Level "ERROR" -Component $module
            continue
        }
        
        # DETECTION PHASE
        Write-AgentLog -Message "Starting detection phase" `
            -Level "INFO" -Component $module -Operation "Detect"
        
        $detectFunction = $moduleInfo.DetectFunction
        $detectResult = & $detectFunction
        
        Write-AgentLog -Message "Detection completed. Issues found: $($detectResult.IssueCount)" `
            -Level "INFO" -Component $module
        
        if ($detectResult.HasIssues -or $Force) {
            if ($Force -and -not $detectResult.HasIssues) {
                Write-AgentLog -Message "Force mode enabled, proceeding with remediation" `
                    -Level "INFO" -Component $module
            }
            
            Write-AgentLog -Message "Issues detected in $module module: $($detectResult.IssueCount)" `
                -Level "WARN" -Component $module
            
            foreach ($issue in $detectResult.Issues) {
                Write-AgentLog -Message "  - $issue" -Level "WARN" -Component $module
            }
            
            # REMEDIATION PHASE (unless TestOnly)
            $fixResult = $null
            $verifyResult = $null
            
            if (-not $TestOnly) {
                # Import remediation module
                $fixPath = Join-Path $scriptPath $moduleInfo.Fix
                if (Test-Path $fixPath) {
                    Import-Module $fixPath -Force
                    
                    Write-AgentLog -Message "Starting remediation phase" `
                        -Level "INFO" -Component $module -Operation "Fix"
                    
                    $fixFunction = $moduleInfo.FixFunction
                    $fixResult = & $fixFunction -Issues $detectResult.Issues
                    
                    Write-AgentLog -Message "Remediation completed. Actions taken: $($fixResult.ActionsTaken.Count)" `
                        -Level "INFO" -Component $module
                    
                    foreach ($action in $fixResult.ActionsTaken) {
                        Write-AgentLog -Message "  + $action" -Level "AUDIT" -Component $module
                    }
                    
                    if ($fixResult.Errors -and $fixResult.Errors.Count -gt 0) {
                        foreach ($error in $fixResult.Errors) {
                            Write-AgentLog -Message "  ! $error" -Level "ERROR" -Component $module
                        }
                    }
                }
                else {
                    Write-AgentLog -Message "Remediation module not found: $fixPath" `
                        -Level "ERROR" -Component $module
                }
                
                # VERIFICATION PHASE (if verification module exists)
                if ($moduleInfo.Verify) {
                    $verifyPath = Join-Path $scriptPath $moduleInfo.Verify
                    if (Test-Path $verifyPath) {
                        Import-Module $verifyPath -Force
                        
                        Write-AgentLog -Message "Starting verification phase" `
                            -Level "INFO" -Component $module -Operation "Verify"
                        
                        $verifyFunction = $moduleInfo.VerifyFunction
                        $verifyResult = & $verifyFunction -OriginalIssues $detectResult.Issues
                        
                        Write-AgentLog -Message "Verification completed. Status: $($verifyResult.Status)" `
                            -Level "INFO" -Component $module
                        
                        foreach ($result in $verifyResult.Results) {
                            $status = if ($result.Fixed) { "[FIXED]" } else { "[NOT FIXED]" }
                            Write-AgentLog -Message "  $status : $($result.Issue)" `
                                -Level $(if ($result.Fixed) { "INFO" } else { "WARN" }) -Component $module
                        }
                    }
                }
                
                # REPORTING
                $resolutionStatus = if ($verifyResult) {
                    $verifyResult.Status
                }
                elseif ($fixResult -and $fixResult.Success) {
                    "REMEDIATED"
                }
                else {
                    "FAILED"
                }
                
                $report = @{
                    Module = $module
                    Timestamp = Get-Date
                    Detection = $detectResult
                    Remediation = $fixResult
                    Verification = $verifyResult
                    ResolutionStatus = $resolutionStatus
                }
                
                $overallResults += $report
                
                # Save detailed report
                $reportFile = Join-Path $global:AgentLogPath "$(Get-Date -Format 'yyyy-MM-dd_HHmmss')_$module.json"
                try {
                    $report | ConvertTo-Json -Depth 10 | Out-File $reportFile -Encoding UTF8
                    Write-AgentLog -Message "Report saved: $reportFile" `
                        -Level "INFO" -Component $module
                }
                catch {
                    Write-AgentLog -Message "Failed to save report: $_" `
                        -Level "WARN" -Component $module
                }
                
                Write-AgentLog -Message "$module module completed with status: $resolutionStatus" `
                    -Level "AUDIT" -Component $module
            }
            else {
                Write-AgentLog -Message "Test mode: Would remediate $($detectResult.IssueCount) issue(s)" `
                    -Level "INFO" -Component $module
                
                $overallResults += @{
                    Module = $module
                    Timestamp = Get-Date
                    Detection = $detectResult
                    Remediation = $null
                    Verification = $null
                    ResolutionStatus = "TEST_ONLY"
                }
            }
        }
        else {
            Write-AgentLog -Message "No issues detected in $module module" `
                -Level "INFO" -Component $module
            
            $overallResults += @{
                Module = $module
                Timestamp = Get-Date
                Detection = $detectResult
                Remediation = $null
                Verification = $null
                ResolutionStatus = "NO_ISSUES"
            }
        }
    }
    catch {
        Write-AgentLog -Message "Error in $module module: $_" `
            -Level "ERROR" -Component $module
        Write-AgentLog -Message "Stack trace: $($_.ScriptStackTrace)" `
            -Level "ERROR" -Component $module
        
        $overallResults += @{
            Module = $module
            Timestamp = Get-Date
            Detection = $null
            Remediation = $null
            Verification = $null
            ResolutionStatus = "ERROR"
            ErrorMessage = $_.Exception.Message
        }
    }
    
    Write-Host ""  # Blank line between modules
}

# Summary
Write-AgentLog -Message "=== EXECUTION SUMMARY ===" `
    -Level "INFO" -Component "Orchestrator"

foreach ($result in $overallResults) {
    Write-AgentLog -Message "$($result.Module): $($result.ResolutionStatus)" `
        -Level "INFO" -Component "Orchestrator"
}

Write-AgentLog -Message "=== SELF-HEALING AGENT COMPLETED ===" `
    -Level "INFO" -Component "Orchestrator" -Operation "Complete"

# Return results for programmatic access
return $overallResults
