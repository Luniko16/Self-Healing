# Service Remediation Module
# Automatically restarts and repairs critical Windows services

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

function Repair-Services {
    <#
    .SYNOPSIS
    Attempts to repair critical Windows services that are not running
    
    .PARAMETER Issues
    Array of detected service issues to remediate
    
    .RETURNS
    Hashtable containing actions taken and success status
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Issues
    )
    
    Write-AgentLog -Message "Starting service remediation with $($Issues.Count) issue(s)" `
        -Level "INFO" -Component "ServiceFix" -Operation "Repair-Services"
    
    # Check for admin privileges
    if (-not (Test-AdminPrivileges)) {
        Write-AgentLog -Message "Service remediation requires administrator privileges" `
            -Level "ERROR" -Component "ServiceFix"
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
            -Level "INFO" -Component "ServiceFix"
        
        # Extract service name from issue message
        # Matches patterns like: "Service 'ServiceName' (DisplayName) is Stopped"
        if ($issue -match "Service '([^']+)'.*\(([^)]+)\)") {
            $displayName = $matches[1]
            $serviceName = $matches[2]
        }
        elseif ($issue -match "Service '([^']+)'") {
            $serviceName = $matches[1]
            $displayName = $serviceName
        }
        else {
            Write-AgentLog -Message "Could not extract service name from issue: $issue" `
                -Level "WARN" -Component "ServiceFix"
            continue
        }
        
        try {
            Write-AgentLog -Message "Attempting to repair service: $serviceName" `
                -Level "INFO" -Component "ServiceFix"
            
            $service = Get-Service -Name $serviceName -ErrorAction Stop
            
            # Check if service is disabled
            if ($service.StartType -eq "Disabled") {
                Write-AgentLog -Message "Service $serviceName is disabled, changing to Automatic" `
                    -Level "INFO" -Component "ServiceFix"
                
                Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
                $actionsTaken += "Changed '$displayName' ($serviceName) startup type to Automatic"
                
                Write-AgentLog -Message "Changed $serviceName startup type to Automatic" `
                    -Level "AUDIT" -Component "ServiceFix"
            }
            
            # Check current status
            $currentStatus = $service.Status
            
            if ($currentStatus -eq "Running") {
                Write-AgentLog -Message "Service $serviceName is already running, performing restart" `
                    -Level "INFO" -Component "ServiceFix"
                
                # Restart the service
                Restart-Service -Name $serviceName -Force -ErrorAction Stop
                Start-Sleep -Seconds 2
                
                $actionsTaken += "Restarted service: '$displayName' ($serviceName)"
                Write-AgentLog -Message "Restarted service: $serviceName" `
                    -Level "AUDIT" -Component "ServiceFix"
            }
            elseif ($currentStatus -eq "Stopped") {
                Write-AgentLog -Message "Service $serviceName is stopped, attempting to start" `
                    -Level "INFO" -Component "ServiceFix"
                
                # Start the service
                Start-Service -Name $serviceName -ErrorAction Stop
                Start-Sleep -Seconds 2
                
                $actionsTaken += "Started service: '$displayName' ($serviceName)"
                Write-AgentLog -Message "Started service: $serviceName" `
                    -Level "AUDIT" -Component "ServiceFix"
            }
            elseif ($currentStatus -eq "Paused") {
                Write-AgentLog -Message "Service $serviceName is paused, resuming" `
                    -Level "INFO" -Component "ServiceFix"
                
                # Resume the service
                Resume-Service -Name $serviceName -ErrorAction Stop
                Start-Sleep -Seconds 2
                
                $actionsTaken += "Resumed service: '$displayName' ($serviceName)"
                Write-AgentLog -Message "Resumed service: $serviceName" `
                    -Level "AUDIT" -Component "ServiceFix"
            }
            else {
                Write-AgentLog -Message "Service $serviceName has unexpected status: $currentStatus" `
                    -Level "WARN" -Component "ServiceFix"
                
                # Try to restart anyway
                Restart-Service -Name $serviceName -Force -ErrorAction Stop
                Start-Sleep -Seconds 2
                
                $actionsTaken += "Restarted service: '$displayName' ($serviceName) from $currentStatus state"
            }
            
            # Verify service is now running
            Start-Sleep -Seconds 1
            $service.Refresh()
            $newStatus = (Get-Service -Name $serviceName).Status
            
            if ($newStatus -eq "Running") {
                Write-AgentLog -Message "Service $serviceName verified as Running" `
                    -Level "INFO" -Component "ServiceFix"
            }
            else {
                $errors += "Service '$displayName' ($serviceName) is $newStatus after repair attempt"
                Write-AgentLog -Message "Service $serviceName is $newStatus after repair (expected Running)" `
                    -Level "ERROR" -Component "ServiceFix"
            }
        }
        catch [Microsoft.PowerShell.Commands.ServiceCommandException] {
            $errors += "Service '$serviceName' not found or cannot be controlled: $_"
            Write-AgentLog -Message "Service $serviceName not found or cannot be controlled: $_" `
                -Level "ERROR" -Component "ServiceFix"
        }
        catch {
            $errors += "Failed to repair service '$serviceName': $_"
            Write-AgentLog -Message "Failed to repair service $serviceName : $_" `
                -Level "ERROR" -Component "ServiceFix"
        }
        
        Start-Sleep -Seconds 1
    }
    
    $success = ($actionsTaken.Count -gt 0) -and ($errors.Count -eq 0)
    
    Write-AgentLog -Message "Service remediation completed. Actions: $($actionsTaken.Count), Errors: $($errors.Count)" `
        -Level "INFO" -Component "ServiceFix" -Operation "Repair-Services"
    
    return @{
        ActionsTaken = $actionsTaken
        Errors = $errors
        Success = $success
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Repair-Services
