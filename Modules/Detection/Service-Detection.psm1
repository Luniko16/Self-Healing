# Service Detection Module
# Detects critical Windows services that are not running

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Test-CriticalServices {
    <#
    .SYNOPSIS
    Checks the status of critical Windows services
    
    .RETURNS
    Hashtable containing detection results and identified issues
    #>
    
    Write-AgentLog -Message "Starting critical services detection" `
        -Level "INFO" -Component "ServiceDetect" -Operation "Test-CriticalServices"
    
    # Define critical services and their expected states
    $criticalServices = @(
        @{ Name = "Spooler"; DisplayName = "Print Spooler"; Expected = "Running" },
        @{ Name = "Dhcp"; DisplayName = "DHCP Client"; Expected = "Running" },
        @{ Name = "Dnscache"; DisplayName = "DNS Client"; Expected = "Running" },
        @{ Name = "WinDefend"; DisplayName = "Windows Defender"; Expected = "Running" },
        @{ Name = "W32Time"; DisplayName = "Windows Time"; Expected = "Running" },
        @{ Name = "wuauserv"; DisplayName = "Windows Update"; Expected = "Running" },
        @{ Name = "EventLog"; DisplayName = "Windows Event Log"; Expected = "Running" },
        @{ Name = "Netlogon"; DisplayName = "Netlogon"; Expected = "Running" }
    )
    
    $issues = @()
    $serviceDetails = @()
    $checkedCount = 0
    
    foreach ($svc in $criticalServices) {
        try {
            Write-AgentLog -Message "Checking service: $($svc.Name)" `
                -Level "INFO" -Component "ServiceDetect"
            
            $service = Get-Service -Name $svc.Name -ErrorAction Stop
            $checkedCount++
            
            # Store service details
            $serviceDetails += @{
                Name = $svc.Name
                DisplayName = $service.DisplayName
                Status = $service.Status.ToString()
                StartType = $service.StartType.ToString()
                Expected = $svc.Expected
            }
            
            # Check if service status matches expected
            if ($service.Status -ne $svc.Expected) {
                $issues += "Service '$($svc.DisplayName)' ($($svc.Name)) is $($service.Status), should be $($svc.Expected)"
                Write-AgentLog -Message "Service issue: $($svc.Name) is $($service.Status), expected $($svc.Expected)" `
                    -Level "WARN" -Component "ServiceDetect"
            }
            else {
                Write-AgentLog -Message "Service OK: $($svc.Name) is $($service.Status)" `
                    -Level "INFO" -Component "ServiceDetect"
            }
            
            # Check if service is set to automatic start
            if ($service.StartType -eq "Disabled" -and $svc.Expected -eq "Running") {
                $issues += "Service '$($svc.DisplayName)' ($($svc.Name)) is disabled but should be running"
                Write-AgentLog -Message "Service disabled: $($svc.Name)" `
                    -Level "WARN" -Component "ServiceDetect"
            }
        }
        catch [Microsoft.PowerShell.Commands.ServiceCommandException] {
            # Service doesn't exist on this system
            Write-AgentLog -Message "Service not found: $($svc.Name) (may not be installed on this system)" `
                -Level "INFO" -Component "ServiceDetect"
            
            $serviceDetails += @{
                Name = $svc.Name
                DisplayName = $svc.DisplayName
                Status = "NotInstalled"
                StartType = "N/A"
                Expected = $svc.Expected
            }
        }
        catch {
            $issues += "Failed to check service '$($svc.Name)': $($_.Exception.Message)"
            Write-AgentLog -Message "Service check failed for $($svc.Name): $_" `
                -Level "ERROR" -Component "ServiceDetect"
            
            $serviceDetails += @{
                Name = $svc.Name
                DisplayName = $svc.DisplayName
                Status = "Error"
                StartType = "N/A"
                Expected = $svc.Expected
            }
        }
    }
    
    Write-AgentLog -Message "Critical services detection completed. Issues found: $($issues.Count) / $checkedCount services checked" `
        -Level "INFO" -Component "ServiceDetect" -Operation "Test-CriticalServices"
    
    return @{
        HasIssues = ($issues.Count -gt 0)
        Issues = $issues
        IssueCount = $issues.Count
        ServicesChecked = $checkedCount
        ServiceDetails = $serviceDetails
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Test-CriticalServices
