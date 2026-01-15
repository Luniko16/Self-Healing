# RMM Integration Module
# Sends alerts and reports to Remote Monitoring and Management platforms

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Get-RMMConfiguration {
    <#
    .SYNOPSIS
    Retrieves RMM configuration from config file or registry
    #>
    
    # Try to get from Group Policy first
    $policyPath = "HKLM:\Software\Policies\SelfHealingAgent\RMM"
    if (Test-Path $policyPath) {
        try {
            $config = Get-ItemProperty -Path $policyPath -ErrorAction Stop
            return @{
                Platform = $config.Platform
                APIEndpoint = $config.APIEndpoint
                APIKey = $config.APIKey
                CompanyID = $config.CompanyID
                Enabled = $config.Enabled
            }
        }
        catch {
            Write-AgentLog -Message "Failed to read RMM config from Group Policy: $_" `
                -Level "WARN" -Component "RMM"
        }
    }
    
    # Fallback to config file
    $configFile = Get-AgentConfig -ConfigName "RMMConfig"
    if ($configFile) {
        return $configFile
    }
    
    return $null
}

function Send-RMMAlert {
    <#
    .SYNOPSIS
    Sends alert to configured RMM platform
    
    .PARAMETER Severity
    Alert severity (Info, Warning, Error, Critical)
    
    .PARAMETER Message
    Alert message
    
    .PARAMETER Data
    Additional data to include in the alert
    
    .PARAMETER Module
    Module that generated the alert
    
    .RETURNS
    Boolean indicating success
    #>
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet("Info", "Warning", "Error", "Critical")]
        [string]$Severity,
        
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [hashtable]$Data = @{},
        
        [string]$Module = "Agent"
    )
    
    Write-AgentLog -Message "Sending RMM alert: $Severity - $Message" `
        -Level "INFO" -Component "RMM" -Operation "Send-RMMAlert"
    
    # Get RMM configuration
    $config = Get-RMMConfiguration
    
    if (-not $config -or -not $config.Enabled) {
        Write-AgentLog -Message "RMM integration not configured or disabled" `
            -Level "INFO" -Component "RMM"
        return $false
    }
    
    # Build alert payload
    $alert = @{
        source = "SelfHealingAgent"
        module = $Module
        severity = $Severity
        message = $Message
        timestamp = Get-Date -Format "o"
        data = $Data
        endpoint = $env:COMPUTERNAME
        domain = $env:USERDOMAIN
        agentVersion = "1.0.0"
    }
    
    # Route to appropriate RMM platform
    $success = $false
    
    switch ($config.Platform) {
        "ConnectWise" {
            $success = Send-ConnectWiseAlert -Config $config -Alert $alert
        }
        "NinjaRMM" {
            $success = Send-NinjaRMMAlert -Config $config -Alert $alert
        }
        "DattoRMM" {
            $success = Send-DattoRMMAlert -Config $config -Alert $alert
        }
        "Atera" {
            $success = Send-AteraAlert -Config $config -Alert $alert
        }
        "Syncro" {
            $success = Send-SyncroAlert -Config $config -Alert $alert
        }
        "Webhook" {
            $success = Send-WebhookAlert -Config $config -Alert $alert
        }
        default {
            Write-AgentLog -Message "Unknown RMM platform: $($config.Platform)" `
                -Level "ERROR" -Component "RMM"
            return $false
        }
    }
    
    if ($success) {
        Write-AgentLog -Message "RMM alert sent successfully to $($config.Platform)" `
            -Level "AUDIT" -Component "RMM"
    }
    else {
        Write-AgentLog -Message "Failed to send RMM alert to $($config.Platform)" `
            -Level "ERROR" -Component "RMM"
    }
    
    return $success
}

function Send-ConnectWiseAlert {
    <#
    .SYNOPSIS
    Sends alert to ConnectWise Manage
    #>
    param(
        [hashtable]$Config,
        [hashtable]$Alert
    )
    
    try {
        Write-AgentLog -Message "Sending alert to ConnectWise Manage" `
            -Level "INFO" -Component "RMM"
        
        # Build ConnectWise ticket
        $ticket = @{
            company = @{ id = $Config.CompanyID }
            summary = "$($Alert.severity): $($Alert.message)"
            initialDescription = @"
Self-Healing Agent Alert

Severity: $($Alert.severity)
Module: $($Alert.module)
Endpoint: $($Alert.endpoint)
Domain: $($Alert.domain)
Timestamp: $($Alert.timestamp)

Message: $($Alert.message)

Additional Data:
$($Alert.data | ConvertTo-Json -Depth 5)
"@
            board = @{ id = 1 }  # Service Board
            status = @{ id = 1 }  # New
            priority = @{ id = $(if ($Alert.severity -eq "Critical") { 1 } else { 3 }) }
            source = @{ name = "Self-Healing Agent" }
        }
        
        # Prepare headers
        $headers = @{
            "Authorization" = "Basic $($Config.APIKey)"
            "Content-Type" = "application/json"
            "clientId" = $Config.ClientID
        }
        
        # Send request
        $response = Invoke-RestMethod -Uri $Config.APIEndpoint `
            -Method Post `
            -Headers $headers `
            -Body ($ticket | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        Write-AgentLog -Message "ConnectWise ticket created: $($response.id)" `
            -Level "INFO" -Component "RMM"
        
        return $true
    }
    catch {
        Write-AgentLog -Message "ConnectWise alert failed: $_" `
            -Level "ERROR" -Component "RMM"
        return $false
    }
}

function Send-NinjaRMMAlert {
    <#
    .SYNOPSIS
    Sends alert to NinjaRMM
    #>
    param(
        [hashtable]$Config,
        [hashtable]$Alert
    )
    
    try {
        Write-AgentLog -Message "Sending alert to NinjaRMM" `
            -Level "INFO" -Component "RMM"
        
        # Build NinjaRMM alert
        $ninjaAlert = @{
            deviceId = $env:COMPUTERNAME
            severity = switch ($Alert.severity) {
                "Info" { "INFO" }
                "Warning" { "WARNING" }
                "Error" { "ERROR" }
                "Critical" { "CRITICAL" }
            }
            message = $Alert.message
            source = "SelfHealingAgent"
            timestamp = $Alert.timestamp
            metadata = $Alert.data
        }
        
        # Prepare headers
        $headers = @{
            "Authorization" = "Bearer $($Config.APIKey)"
            "Content-Type" = "application/json"
        }
        
        # Send request
        $response = Invoke-RestMethod -Uri $Config.APIEndpoint `
            -Method Post `
            -Headers $headers `
            -Body ($ninjaAlert | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        Write-AgentLog -Message "NinjaRMM alert created successfully" `
            -Level "INFO" -Component "RMM"
        
        return $true
    }
    catch {
        Write-AgentLog -Message "NinjaRMM alert failed: $_" `
            -Level "ERROR" -Component "RMM"
        return $false
    }
}

function Send-DattoRMMAlert {
    <#
    .SYNOPSIS
    Sends alert to Datto RMM (Autotask)
    #>
    param(
        [hashtable]$Config,
        [hashtable]$Alert
    )
    
    try {
        Write-AgentLog -Message "Sending alert to Datto RMM" `
            -Level "INFO" -Component "RMM"
        
        # Build Datto alert
        $dattoAlert = @{
            deviceUid = $env:COMPUTERNAME
            alertType = "SelfHealingAgent"
            severity = $Alert.severity
            message = $Alert.message
            timestamp = $Alert.timestamp
            details = $Alert.data | ConvertTo-Json -Depth 5
        }
        
        # Prepare headers
        $headers = @{
            "Authorization" = "Bearer $($Config.APIKey)"
            "Content-Type" = "application/json"
        }
        
        # Send request
        $response = Invoke-RestMethod -Uri $Config.APIEndpoint `
            -Method Post `
            -Headers $headers `
            -Body ($dattoAlert | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        Write-AgentLog -Message "Datto RMM alert created successfully" `
            -Level "INFO" -Component "RMM"
        
        return $true
    }
    catch {
        Write-AgentLog -Message "Datto RMM alert failed: $_" `
            -Level "ERROR" -Component "RMM"
        return $false
    }
}

function Send-AteraAlert {
    <#
    .SYNOPSIS
    Sends alert to Atera
    #>
    param(
        [hashtable]$Config,
        [hashtable]$Alert
    )
    
    try {
        Write-AgentLog -Message "Sending alert to Atera" `
            -Level "INFO" -Component "RMM"
        
        # Build Atera ticket
        $ateraTicket = @{
            TicketTitle = "$($Alert.severity): $($Alert.message)"
            TicketType = "Problem"
            TicketStatus = "Open"
            TicketPriority = $(if ($Alert.severity -eq "Critical") { "High" } else { "Medium" })
            Description = @"
Self-Healing Agent Alert

Severity: $($Alert.severity)
Module: $($Alert.module)
Endpoint: $($Alert.endpoint)
Timestamp: $($Alert.timestamp)

$($Alert.message)

Data: $($Alert.data | ConvertTo-Json -Depth 5)
"@
            EndUserID = $Config.CompanyID
        }
        
        # Prepare headers
        $headers = @{
            "X-API-KEY" = $Config.APIKey
            "Content-Type" = "application/json"
        }
        
        # Send request
        $response = Invoke-RestMethod -Uri $Config.APIEndpoint `
            -Method Post `
            -Headers $headers `
            -Body ($ateraTicket | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        Write-AgentLog -Message "Atera ticket created: $($response.TicketID)" `
            -Level "INFO" -Component "RMM"
        
        return $true
    }
    catch {
        Write-AgentLog -Message "Atera alert failed: $_" `
            -Level "ERROR" -Component "RMM"
        return $false
    }
}

function Send-SyncroAlert {
    <#
    .SYNOPSIS
    Sends alert to Syncro
    #>
    param(
        [hashtable]$Config,
        [hashtable]$Alert
    )
    
    try {
        Write-AgentLog -Message "Sending alert to Syncro" `
            -Level "INFO" -Component "RMM"
        
        # Build Syncro ticket
        $syncroTicket = @{
            subject = "$($Alert.severity): $($Alert.message)"
            problem_type = "Self-Healing Agent"
            status = "New"
            priority = $(if ($Alert.severity -eq "Critical") { "High" } else { "Normal" })
            comment = @"
Self-Healing Agent Alert

Severity: $($Alert.severity)
Module: $($Alert.module)
Endpoint: $($Alert.endpoint)
Timestamp: $($Alert.timestamp)

$($Alert.message)

Data: $($Alert.data | ConvertTo-Json -Depth 5)
"@
            customer_id = $Config.CompanyID
        }
        
        # Prepare headers
        $headers = @{
            "Authorization" = "Bearer $($Config.APIKey)"
            "Content-Type" = "application/json"
        }
        
        # Send request
        $response = Invoke-RestMethod -Uri $Config.APIEndpoint `
            -Method Post `
            -Headers $headers `
            -Body ($syncroTicket | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        Write-AgentLog -Message "Syncro ticket created: $($response.ticket.id)" `
            -Level "INFO" -Component "RMM"
        
        return $true
    }
    catch {
        Write-AgentLog -Message "Syncro alert failed: $_" `
            -Level "ERROR" -Component "RMM"
        return $false
    }
}

function Send-WebhookAlert {
    <#
    .SYNOPSIS
    Sends alert to generic webhook endpoint
    #>
    param(
        [hashtable]$Config,
        [hashtable]$Alert
    )
    
    try {
        Write-AgentLog -Message "Sending alert to webhook: $($Config.APIEndpoint)" `
            -Level "INFO" -Component "RMM"
        
        # Prepare headers
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        # Add API key if provided
        if ($Config.APIKey) {
            $headers["Authorization"] = "Bearer $($Config.APIKey)"
        }
        
        # Send request
        $response = Invoke-RestMethod -Uri $Config.APIEndpoint `
            -Method Post `
            -Headers $headers `
            -Body ($Alert | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        Write-AgentLog -Message "Webhook alert sent successfully" `
            -Level "INFO" -Component "RMM"
        
        return $true
    }
    catch {
        Write-AgentLog -Message "Webhook alert failed: $_" `
            -Level "ERROR" -Component "RMM"
        return $false
    }
}

function Send-RMMReport {
    <#
    .SYNOPSIS
    Sends execution report to RMM platform
    
    .PARAMETER Results
    Execution results from the orchestrator
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Results
    )
    
    Write-AgentLog -Message "Sending execution report to RMM" `
        -Level "INFO" -Component "RMM" -Operation "Send-RMMReport"
    
    # Build summary
    $summary = @{
        TotalModules = $Results.Count
        ModulesWithIssues = ($Results | Where-Object { $_.Detection.HasIssues }).Count
        FullyResolved = ($Results | Where-Object { $_.ResolutionStatus -eq "FULLY_RESOLVED" }).Count
        PartiallyResolved = ($Results | Where-Object { $_.ResolutionStatus -eq "PARTIALLY_RESOLVED" }).Count
        Failed = ($Results | Where-Object { $_.ResolutionStatus -eq "FAILED" }).Count
        NoIssues = ($Results | Where-Object { $_.ResolutionStatus -eq "NO_ISSUES" }).Count
    }
    
    # Determine overall severity
    $severity = if ($summary.Failed -gt 0) {
        "Error"
    }
    elseif ($summary.PartiallyResolved -gt 0) {
        "Warning"
    }
    elseif ($summary.ModulesWithIssues -gt 0) {
        "Info"
    }
    else {
        "Info"
    }
    
    # Build message
    $message = "Self-Healing Agent execution completed: $($summary.FullyResolved) resolved, $($summary.PartiallyResolved) partial, $($summary.Failed) failed"
    
    # Send alert with full results
    return Send-RMMAlert -Severity $severity -Message $message -Data @{
        Summary = $summary
        Results = $Results
    } -Module "Orchestrator"
}

Export-ModuleMember -Function Send-RMMAlert, Send-RMMReport
