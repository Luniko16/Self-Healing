# Network Detection Module
# Detects network connectivity issues, DNS problems, and adapter failures

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Test-NetworkConnectivity {
    <#
    .SYNOPSIS
    Comprehensive network connectivity detection
    
    .PARAMETER TimeoutSeconds
    Timeout for network tests
    
    .RETURNS
    Hashtable containing detection results and identified issues
    #>
    param(
        [int]$TimeoutSeconds = 5
    )
    
    Write-AgentLog -Message "Starting network connectivity detection" `
        -Level "INFO" -Component "NetworkDetect" -Operation "Test-NetworkConnectivity"
    
    $issues = @()
    
    # Test 1: Basic internet connectivity (Google DNS)
    try {
        Write-AgentLog -Message "Testing internet connectivity to 8.8.8.8:443" `
            -Level "INFO" -Component "NetworkDetect"
        
        $testResult = Test-NetConnection -ComputerName "8.8.8.8" -Port 443 `
            -WarningAction SilentlyContinue -ErrorAction Stop
        
        if (-not $testResult.TcpTestSucceeded) {
            $issues += "No internet connectivity detected (8.8.8.8:443 unreachable)"
            Write-AgentLog -Message "Internet connectivity test failed" `
                -Level "WARN" -Component "NetworkDetect"
        }
        else {
            Write-AgentLog -Message "Internet connectivity test passed" `
                -Level "INFO" -Component "NetworkDetect"
        }
    }
    catch {
        $issues += "Internet connectivity test failed: $($_.Exception.Message)"
        Write-AgentLog -Message "Internet connectivity test error: $_" `
            -Level "ERROR" -Component "NetworkDetect"
    }
    
    # Test 2: DNS resolution
    try {
        Write-AgentLog -Message "Testing DNS resolution for google.com" `
            -Level "INFO" -Component "NetworkDetect"
        
        $dnsResult = Resolve-DnsName -Name "google.com" -ErrorAction Stop -QuickTimeout
        
        if (-not $dnsResult) {
            $issues += "DNS resolution failure (google.com not resolved)"
            Write-AgentLog -Message "DNS resolution failed" `
                -Level "WARN" -Component "NetworkDetect"
        }
        else {
            Write-AgentLog -Message "DNS resolution test passed" `
                -Level "INFO" -Component "NetworkDetect"
        }
    }
    catch {
        $issues += "DNS resolution failed: $($_.Exception.Message)"
        Write-AgentLog -Message "DNS resolution error: $_" `
            -Level "ERROR" -Component "NetworkDetect"
    }
    
    # Test 3: Network adapter status
    try {
        Write-AgentLog -Message "Checking network adapter status" `
            -Level "INFO" -Component "NetworkDetect"
        
        $adapters = Get-NetAdapter | Where-Object { 
            $_.Status -eq "Disabled" -or $_.Status -eq "Disconnected" 
        }
        
        foreach ($adapter in $adapters) {
            $issues += "Network adapter '$($adapter.Name)' is $($adapter.Status)"
            Write-AgentLog -Message "Adapter issue: $($adapter.Name) - $($adapter.Status)" `
                -Level "WARN" -Component "NetworkDetect"
        }
    }
    catch {
        $issues += "Network adapter check failed: $($_.Exception.Message)"
        Write-AgentLog -Message "Adapter check error: $_" `
            -Level "ERROR" -Component "NetworkDetect"
    }
    
    # Test 4: IP configuration
    try {
        Write-AgentLog -Message "Checking IP configuration" `
            -Level "INFO" -Component "NetworkDetect"
        
        $ipConfig = Get-NetIPConfiguration -ErrorAction SilentlyContinue | 
            Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }
        
        if (-not $ipConfig) {
            $issues += "No active network configuration found"
            Write-AgentLog -Message "No IP configuration found" `
                -Level "WARN" -Component "NetworkDetect"
        }
        else {
            $hasIPv4 = $false
            foreach ($config in $ipConfig) {
                if ($config.IPv4Address.IPAddress) {
                    $hasIPv4 = $true
                    Write-AgentLog -Message "IPv4 found: $($config.IPv4Address.IPAddress) on $($config.InterfaceAlias)" `
                        -Level "INFO" -Component "NetworkDetect"
                }
            }
            
            if (-not $hasIPv4) {
                $issues += "No IPv4 address assigned to any active adapter"
                Write-AgentLog -Message "No IPv4 address assigned" `
                    -Level "WARN" -Component "NetworkDetect"
            }
        }
    }
    catch {
        $issues += "IP configuration check failed: $($_.Exception.Message)"
        Write-AgentLog -Message "IP config check error: $_" `
            -Level "ERROR" -Component "NetworkDetect"
    }
    
    # Test 5: Default gateway reachability
    try {
        Write-AgentLog -Message "Testing default gateway reachability" `
            -Level "INFO" -Component "NetworkDetect"
        
        $gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | 
            Select-Object -First 1).NextHop
        
        if ($gateway -and $gateway -ne "0.0.0.0") {
            $pingResult = Test-Connection -ComputerName $gateway -Count 2 -Quiet -ErrorAction SilentlyContinue
            
            if (-not $pingResult) {
                $issues += "Default gateway ($gateway) is unreachable"
                Write-AgentLog -Message "Gateway unreachable: $gateway" `
                    -Level "WARN" -Component "NetworkDetect"
            }
            else {
                Write-AgentLog -Message "Gateway reachable: $gateway" `
                    -Level "INFO" -Component "NetworkDetect"
            }
        }
        else {
            $issues += "No default gateway configured"
            Write-AgentLog -Message "No default gateway found" `
                -Level "WARN" -Component "NetworkDetect"
        }
    }
    catch {
        Write-AgentLog -Message "Gateway test error: $_" `
            -Level "WARN" -Component "NetworkDetect"
    }
    
    Write-AgentLog -Message "Network detection completed. Issues found: $($issues.Count)" `
        -Level "INFO" -Component "NetworkDetect" -Operation "Test-NetworkConnectivity"
    
    return @{
        HasIssues = ($issues.Count -gt 0)
        Issues = $issues
        IssueCount = $issues.Count
        Timestamp = Get-Date
    }
}

Export-ModuleMember -Function Test-NetworkConnectivity
