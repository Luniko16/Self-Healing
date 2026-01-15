# Network Verification Module
# Verifies that network issues have been successfully resolved

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Test-NetworkVerification {
    <#
    .SYNOPSIS
    Verifies that network issues have been resolved after remediation
    
    .PARAMETER OriginalIssues
    Array of original issues that were detected and remediated
    
    .RETURNS
    Hashtable containing verification results and overall status
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$OriginalIssues
    )
    
    Write-AgentLog -Message "Starting network verification for $($OriginalIssues.Count) issues" `
        -Level "INFO" -Component "NetworkVerify" -Operation "Test-NetworkVerification"
    
    $verificationResults = @()
    $allFixed = $true
    
    # Re-test each original issue
    foreach ($issue in $OriginalIssues) {
        Write-AgentLog -Message "Verifying: $issue" `
            -Level "INFO" -Component "NetworkVerify"
        
        $fixed = $false
        
        switch -Wildcard ($issue) {
            "*internet*" {
                try {
                    Write-AgentLog -Message "Testing internet connectivity" `
                        -Level "INFO" -Component "NetworkVerify"
                    
                    $test = Test-NetConnection -ComputerName "8.8.8.8" -Port 443 `
                        -WarningAction SilentlyContinue -ErrorAction Stop
                    
                    $fixed = $test.TcpTestSucceeded
                    
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $fixed
                        Detail = "Internet connectivity test: $($test.TcpTestSucceeded)"
                    }
                    
                    Write-AgentLog -Message "Internet test result: $fixed" `
                        -Level $(if ($fixed) { "INFO" } else { "WARN" }) -Component "NetworkVerify"
                }
                catch {
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $false
                        Detail = "Internet connectivity test failed: $_"
                    }
                    Write-AgentLog -Message "Internet test error: $_" `
                        -Level "ERROR" -Component "NetworkVerify"
                }
                
                break
            }
            
            "*DNS*" {
                try {
                    Write-AgentLog -Message "Testing DNS resolution" `
                        -Level "INFO" -Component "NetworkVerify"
                    
                    $dnsTest = Resolve-DnsName -Name "microsoft.com" -ErrorAction Stop -QuickTimeout
                    $fixed = $true
                    
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $fixed
                        Detail = "DNS resolution successful for microsoft.com"
                    }
                    
                    Write-AgentLog -Message "DNS test passed" `
                        -Level "INFO" -Component "NetworkVerify"
                }
                catch {
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $false
                        Detail = "DNS resolution failed: $_"
                    }
                    
                    Write-AgentLog -Message "DNS test failed: $_" `
                        -Level "WARN" -Component "NetworkVerify"
                }
                
                break
            }
            
            "*adapter*" {
                try {
                    # Extract adapter name from issue message
                    if ($issue -match "'([^']+)'") {
                        $adapterName = $Matches[1]
                        
                        Write-AgentLog -Message "Checking adapter status: $adapterName" `
                            -Level "INFO" -Component "NetworkVerify"
                        
                        $adapter = Get-NetAdapter -Name $adapterName -ErrorAction Stop
                        $fixed = $adapter.Status -eq "Up"
                        
                        $verificationResults += @{
                            Issue = $issue
                            Fixed = $fixed
                            Detail = "Adapter '$adapterName' status: $($adapter.Status)"
                        }
                        
                        Write-AgentLog -Message "Adapter $adapterName status: $($adapter.Status)" `
                            -Level $(if ($fixed) { "INFO" } else { "WARN" }) -Component "NetworkVerify"
                    }
                    else {
                        $verificationResults += @{
                            Issue = $issue
                            Fixed = $false
                            Detail = "Could not extract adapter name from issue"
                        }
                    }
                }
                catch {
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $false
                        Detail = "Adapter check failed: $_"
                    }
                    
                    Write-AgentLog -Message "Adapter check error: $_" `
                        -Level "ERROR" -Component "NetworkVerify"
                }
                
                break
            }
            
            "*IPv4*" {
                try {
                    Write-AgentLog -Message "Checking IPv4 configuration" `
                        -Level "INFO" -Component "NetworkVerify"
                    
                    $ipConfig = Get-NetIPConfiguration -ErrorAction Stop | 
                        Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }
                    
                    $hasIPv4 = $false
                    foreach ($config in $ipConfig) {
                        if ($config.IPv4Address.IPAddress) {
                            $hasIPv4 = $true
                            break
                        }
                    }
                    
                    $fixed = $hasIPv4
                    
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $fixed
                        Detail = if ($hasIPv4) { "IPv4 address assigned" } else { "No IPv4 address found" }
                    }
                    
                    Write-AgentLog -Message "IPv4 check result: $fixed" `
                        -Level $(if ($fixed) { "INFO" } else { "WARN" }) -Component "NetworkVerify"
                }
                catch {
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $false
                        Detail = "IPv4 check failed: $_"
                    }
                    
                    Write-AgentLog -Message "IPv4 check error: $_" `
                        -Level "ERROR" -Component "NetworkVerify"
                }
                
                break
            }
            
            "*gateway*" {
                try {
                    Write-AgentLog -Message "Testing gateway reachability" `
                        -Level "INFO" -Component "NetworkVerify"
                    
                    $gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction Stop | 
                        Select-Object -First 1).NextHop
                    
                    if ($gateway -and $gateway -ne "0.0.0.0") {
                        $pingResult = Test-Connection -ComputerName $gateway -Count 2 -Quiet -ErrorAction SilentlyContinue
                        $fixed = $pingResult
                        
                        $verificationResults += @{
                            Issue = $issue
                            Fixed = $fixed
                            Detail = "Gateway ($gateway) reachability: $pingResult"
                        }
                        
                        Write-AgentLog -Message "Gateway test result: $fixed" `
                            -Level $(if ($fixed) { "INFO" } else { "WARN" }) -Component "NetworkVerify"
                    }
                    else {
                        $verificationResults += @{
                            Issue = $issue
                            Fixed = $false
                            Detail = "No gateway configured"
                        }
                    }
                }
                catch {
                    $verificationResults += @{
                        Issue = $issue
                        Fixed = $false
                        Detail = "Gateway check failed: $_"
                    }
                    
                    Write-AgentLog -Message "Gateway check error: $_" `
                        -Level "ERROR" -Component "NetworkVerify"
                }
                
                break
            }
            
            default {
                # For unrecognized issues, assume fixed if no error occurred
                $verificationResults += @{
                    Issue = $issue
                    Fixed = $true
                    Detail = "Assumed fixed after remediation (no specific verification test)"
                }
                
                Write-AgentLog -Message "No specific verification for: $issue" `
                    -Level "INFO" -Component "NetworkVerify"
            }
        }
        
        if (-not $fixed) { 
            $allFixed = $false 
        }
    }
    
    # Determine overall status
    $fixedCount = ($verificationResults | Where-Object { $_.Fixed -eq $true }).Count
    $totalCount = $verificationResults.Count
    
    $status = if ($allFixed) { 
        "FULLY_RESOLVED" 
    } 
    elseif ($fixedCount -gt 0) { 
        "PARTIALLY_RESOLVED" 
    } 
    else { 
        "NOT_RESOLVED" 
    }
    
    Write-AgentLog -Message "Network verification complete: $status ($fixedCount/$totalCount fixed)" `
        -Level "AUDIT" -Component "NetworkVerify" -Operation "Test-NetworkVerification"
    
    return @{
        AllFixed = $allFixed
        FixedCount = $fixedCount
        TotalCount = $totalCount
        Results = $verificationResults
        Status = $status
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Test-NetworkVerification
