# Network Remediation Module
# Automatically fixes network connectivity issues

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

function Repair-NetworkConnectivity {
    <#
    .SYNOPSIS
    Attempts to repair network connectivity issues
    
    .PARAMETER Issues
    Array of detected network issues to remediate
    
    .RETURNS
    Hashtable containing actions taken and success status
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Issues
    )
    
    Write-AgentLog -Message "Starting network remediation with $($Issues.Count) issues" `
        -Level "INFO" -Component "NetworkFix" -Operation "Repair-NetworkConnectivity"
    
    # Check for admin privileges
    if (-not (Test-AdminPrivileges)) {
        Write-AgentLog -Message "Network remediation requires administrator privileges" `
            -Level "ERROR" -Component "NetworkFix"
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
            -Level "INFO" -Component "NetworkFix"
        
        switch -Wildcard ($issue) {
            "*internet*" {
                # Step 1: Release and renew IP
                try {
                    Write-AgentLog -Message "Attempting IP release/renew" `
                        -Level "INFO" -Component "NetworkFix"
                    
                    ipconfig /release | Out-Null
                    Start-Sleep -Seconds 2
                    ipconfig /renew | Out-Null
                    
                    $actionsTaken += "Released and renewed IP configuration"
                    Write-AgentLog -Message "IP release/renew completed" `
                        -Level "AUDIT" -Component "NetworkFix"
                }
                catch {
                    $errors += "IP release/renew failed: $_"
                    Write-AgentLog -Message "IP release/renew failed: $_" `
                        -Level "ERROR" -Component "NetworkFix"
                }
                
                # Step 2: Flush DNS
                try {
                    Write-AgentLog -Message "Flushing DNS cache" `
                        -Level "INFO" -Component "NetworkFix"
                    
                    ipconfig /flushdns | Out-Null
                    Clear-DnsClientCache -ErrorAction SilentlyContinue
                    
                    $actionsTaken += "Flushed DNS cache"
                    Write-AgentLog -Message "DNS cache flushed" `
                        -Level "AUDIT" -Component "NetworkFix"
                }
                catch {
                    $errors += "DNS flush failed: $_"
                    Write-AgentLog -Message "DNS flush failed: $_" `
                        -Level "ERROR" -Component "NetworkFix"
                }
                
                # Step 3: Reset network adapter
                try {
                    $adapter = Get-NetAdapter | Where-Object { 
                        $_.Status -eq "Disconnected" -or $_.Status -eq "Disabled" 
                    } | Select-Object -First 1
                    
                    if ($adapter) {
                        Write-AgentLog -Message "Resetting adapter: $($adapter.Name)" `
                            -Level "INFO" -Component "NetworkFix"
                        
                        Restart-NetAdapter -Name $adapter.Name -Confirm:$false
                        Start-Sleep -Seconds 5
                        
                        $actionsTaken += "Reset network adapter: $($adapter.Name)"
                        Write-AgentLog -Message "Adapter reset completed: $($adapter.Name)" `
                            -Level "AUDIT" -Component "NetworkFix"
                    }
                }
                catch {
                    $errors += "Adapter reset failed: $_"
                    Write-AgentLog -Message "Adapter reset failed: $_" `
                        -Level "ERROR" -Component "NetworkFix"
                }
                
                break
            }
            
            "*DNS*" {
                try {
                    Write-AgentLog -Message "Repairing DNS configuration" `
                        -Level "INFO" -Component "NetworkFix"
                    
                    # Reset DNS to automatic
                    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
                    foreach ($adapter in $adapters) {
                        Set-DnsClientServerAddress -InterfaceAlias $adapter.Name `
                            -ResetServerAddresses -ErrorAction SilentlyContinue
                    }
                    
                    # Restart DNS client service
                    Restart-Service -Name "Dnscache" -Force -ErrorAction Stop
                    Start-Sleep -Seconds 2
                    
                    $actionsTaken += "Reset DNS client configuration"
                    Write-AgentLog -Message "DNS configuration repaired" `
                        -Level "AUDIT" -Component "NetworkFix"
                }
                catch {
                    $errors += "DNS repair failed: $_"
                    Write-AgentLog -Message "DNS repair failed: $_" `
                        -Level "ERROR" -Component "NetworkFix"
                }
                
                break
            }
            
            "*adapter*" {
                try {
                    # Extract adapter name from issue message
                    if ($issue -match "'([^']+)'") {
                        $adapterName = $Matches[1]
                        
                        Write-AgentLog -Message "Enabling network adapter: $adapterName" `
                            -Level "INFO" -Component "NetworkFix"
                        
                        Enable-NetAdapter -Name $adapterName -Confirm:$false
                        Start-Sleep -Seconds 5
                        
                        $actionsTaken += "Enabled network adapter: $adapterName"
                        Write-AgentLog -Message "Adapter enabled: $adapterName" `
                            -Level "AUDIT" -Component "NetworkFix"
                    }
                }
                catch {
                    $errors += "Adapter enable failed: $_"
                    Write-AgentLog -Message "Adapter enable failed: $_" `
                        -Level "ERROR" -Component "NetworkFix"
                }
                
                break
            }
            
            "*IPv4*" {
                try {
                    Write-AgentLog -Message "Attempting DHCP renewal" `
                        -Level "INFO" -Component "NetworkFix"
                    
                    # Force DHCP renewal
                    $dhcpAdapters = Get-WmiObject Win32_NetworkAdapterConfiguration | 
                        Where-Object { $_.DHCPEnabled -eq $true }
                    
                    foreach ($adapter in $dhcpAdapters) {
                        $result = $adapter.RenewDHCPLease()
                        if ($result.ReturnValue -eq 0) {
                            Write-AgentLog -Message "DHCP renewed for adapter: $($adapter.Description)" `
                                -Level "INFO" -Component "NetworkFix"
                        }
                    }
                    
                    # Restart DHCP client service
                    $dhcpService = Get-Service -Name "Dhcp" -ErrorAction SilentlyContinue
                    if ($dhcpService) {
                        Restart-Service -Name "Dhcp" -Force
                        Start-Sleep -Seconds 2
                    }
                    
                    $actionsTaken += "Forced DHCP renewal"
                    Write-AgentLog -Message "DHCP renewal completed" `
                        -Level "AUDIT" -Component "NetworkFix"
                }
                catch {
                    $errors += "DHCP renewal failed: $_"
                    Write-AgentLog -Message "DHCP renewal failed: $_" `
                        -Level "ERROR" -Component "NetworkFix"
                }
                
                break
            }
            
            "*gateway*" {
                try {
                    Write-AgentLog -Message "Attempting gateway connectivity repair" `
                        -Level "INFO" -Component "NetworkFix"
                    
                    # Reset IP and restart adapter
                    ipconfig /release | Out-Null
                    Start-Sleep -Seconds 2
                    ipconfig /renew | Out-Null
                    
                    $actionsTaken += "Reset gateway connectivity"
                    Write-AgentLog -Message "Gateway repair attempted" `
                        -Level "AUDIT" -Component "NetworkFix"
                }
                catch {
                    $errors += "Gateway repair failed: $_"
                    Write-AgentLog -Message "Gateway repair failed: $_" `
                        -Level "ERROR" -Component "NetworkFix"
                }
                
                break
            }
        }
        
        Start-Sleep -Seconds 2
    }
    
    # Final step: Restart critical networking services
    Write-AgentLog -Message "Restarting critical network services" `
        -Level "INFO" -Component "NetworkFix"
    
    $services = @("Netlogon", "LanmanWorkstation", "LanmanServer")
    foreach ($serviceName in $services) {
        try {
            $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
            if ($service -and $service.Status -eq "Running") {
                Restart-Service -Name $serviceName -Force -ErrorAction Stop
                $actionsTaken += "Restarted service: $serviceName"
                Write-AgentLog -Message "Service restarted: $serviceName" `
                    -Level "INFO" -Component "NetworkFix"
            }
        }
        catch {
            Write-AgentLog -Message "Failed to restart service $serviceName : $_" `
                -Level "WARN" -Component "NetworkFix"
        }
    }
    
    $success = ($actionsTaken.Count -gt 0) -and ($errors.Count -eq 0)
    
    Write-AgentLog -Message "Network remediation completed. Actions: $($actionsTaken.Count), Errors: $($errors.Count)" `
        -Level "INFO" -Component "NetworkFix" -Operation "Repair-NetworkConnectivity"
    
    return @{
        ActionsTaken = $actionsTaken
        Errors = $errors
        Success = $success
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Repair-NetworkConnectivity
