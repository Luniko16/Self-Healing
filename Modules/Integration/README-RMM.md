# RMM Integration Guide

This guide explains how to integrate the Self-Healing Agent with Remote Monitoring and Management (RMM) platforms.

## Overview

The RMM Integration module allows the Self-Healing Agent to send alerts, tickets, and reports to your RMM platform. This enables:

- **Centralized monitoring** of all endpoints
- **Automatic ticket creation** for issues that require attention
- **Audit trail** of all remediation actions
- **Dashboard visibility** of agent activity
- **Alerting** for critical issues

## Supported RMM Platforms

- **ConnectWise Manage** - Full ticket creation support
- **NinjaRMM** - Alert and custom field integration
- **Datto RMM (Autotask)** - Alert and monitoring integration
- **Atera** - Ticket creation and alerting
- **Syncro** - Ticket and alert integration
- **Generic Webhook** - Send to any webhook endpoint (Slack, Teams, custom systems)

## Configuration

### Step 1: Create Configuration File

Copy the template and configure for your RMM platform:

```powershell
Copy-Item "C:\Program Files\SelfHealingAgent\Config\RMMConfig.json.template" `
    -Destination "C:\Program Files\SelfHealingAgent\Config\RMMConfig.json"
```

### Step 2: Edit Configuration

Edit `RMMConfig.json` with your RMM platform details:

```json
{
  "Platform": "NinjaRMM",
  "Enabled": true,
  "APIEndpoint": "https://api.ninjarmm.com/v2/alerts",
  "APIKey": "your-api-key-here",
  "CompanyID": "12345",
  "SendOnDetection": true,
  "SendOnRemediation": true,
  "SendOnVerification": false,
  "SendDailySummary": true,
  "MinimumSeverity": "Warning"
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `Platform` | RMM platform name | Webhook |
| `Enabled` | Enable RMM integration | false |
| `APIEndpoint` | API endpoint URL | - |
| `APIKey` | API authentication key | - |
| `CompanyID` | Company/Customer ID | - |
| `ClientID` | Client ID (ConnectWise only) | - |
| `SendOnDetection` | Send alert when issues detected | true |
| `SendOnRemediation` | Send alert after remediation | true |
| `SendOnVerification` | Send alert after verification | false |
| `SendDailySummary` | Send daily summary report | true |
| `MinimumSeverity` | Minimum severity to send | Warning |

## Platform-Specific Setup

### ConnectWise Manage

1. **Generate API Keys**:
   - Log into ConnectWise Manage
   - Go to System → Members → API Members
   - Create new API member with appropriate permissions
   - Note the Public Key and Private Key

2. **Configure**:
```json
{
  "Platform": "ConnectWise",
  "Enabled": true,
  "APIEndpoint": "https://api-na.myconnectwise.net/v4_6_release/apis/3.0/service/tickets",
  "APIKey": "Base64EncodedPublicKey:PrivateKey",
  "CompanyID": "YourCompanyID",
  "ClientID": "YourClientID"
}
```

3. **Encode API Key**:
```powershell
$publicKey = "your-public-key"
$privateKey = "your-private-key"
$combined = "$publicKey:$privateKey"
$encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($combined))
```

### NinjaRMM

1. **Generate API Token**:
   - Log into NinjaRMM
   - Go to Administration → Apps → API
   - Create new API client
   - Copy the access token

2. **Configure**:
```json
{
  "Platform": "NinjaRMM",
  "Enabled": true,
  "APIEndpoint": "https://api.ninjarmm.com/v2/alerts",
  "APIKey": "your-access-token"
}
```

### Datto RMM

1. **Generate API Key**:
   - Log into Datto RMM
   - Go to Setup → Account Settings → API Credentials
   - Create new API user
   - Copy the API key and secret

2. **Configure**:
```json
{
  "Platform": "DattoRMM",
  "Enabled": true,
  "APIEndpoint": "https://api.centrastage.net/api/v2/alert",
  "APIKey": "your-api-key"
}
```

### Atera

1. **Generate API Key**:
   - Log into Atera
   - Go to Admin → API
   - Generate new API key
   - Copy the X-API-KEY

2. **Configure**:
```json
{
  "Platform": "Atera",
  "Enabled": true,
  "APIEndpoint": "https://app.atera.com/api/v3/tickets",
  "APIKey": "your-x-api-key",
  "CompanyID": "your-customer-id"
}
```

### Syncro

1. **Generate API Token**:
   - Log into Syncro
   - Go to Admin → API Tokens
   - Create new token
   - Copy the token

2. **Configure**:
```json
{
  "Platform": "Syncro",
  "Enabled": true,
  "APIEndpoint": "https://yourdomain.syncromsp.com/api/v1/tickets",
  "APIKey": "your-api-token",
  "CompanyID": "customer-id"
}
```

### Generic Webhook

For Slack, Microsoft Teams, or custom webhooks:

```json
{
  "Platform": "Webhook",
  "Enabled": true,
  "APIEndpoint": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "APIKey": ""
}
```

## Usage

### Sending Alerts from Modules

Add RMM alerts to your detection or remediation modules:

```powershell
Import-Module "C:\Program Files\SelfHealingAgent\Modules\Integration\RMM-Integration.psm1"

# Send alert after detecting issues
if ($detectResult.HasIssues) {
    Send-RMMAlert -Severity "Warning" `
        -Message "Network connectivity issues detected on $env:COMPUTERNAME" `
        -Data @{
            Issues = $detectResult.Issues
            IssueCount = $detectResult.IssueCount
        } `
        -Module "Network"
}

# Send alert after remediation
if ($fixResult.Success) {
    Send-RMMAlert -Severity "Info" `
        -Message "Network issues resolved on $env:COMPUTERNAME" `
        -Data @{
            ActionsTaken = $fixResult.ActionsTaken
        } `
        -Module "Network"
}
```

### Sending Execution Reports

Send a summary report after agent execution:

```powershell
Import-Module "C:\Program Files\SelfHealingAgent\Modules\Integration\RMM-Integration.psm1"

# After orchestrator completes
$results = & "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1"

# Send summary report
Send-RMMReport -Results $results
```

### Integration in Orchestrator

Modify `Start-SelfHealingAgent.ps1` to include RMM integration:

```powershell
# At the beginning
Import-Module (Join-Path $scriptPath "Modules\Integration\RMM-Integration.psm1") -Force

# After each module completes
if ($detectResult.HasIssues) {
    Send-RMMAlert -Severity "Warning" `
        -Message "$module module detected $($detectResult.IssueCount) issue(s)" `
        -Data $detectResult `
        -Module $module
}

# At the end
Send-RMMReport -Results $overallResults
```

## Alert Severity Levels

| Severity | When to Use | RMM Impact |
|----------|-------------|------------|
| **Info** | Successful remediation, routine operations | Low priority ticket/alert |
| **Warning** | Issues detected, partial resolution | Medium priority ticket/alert |
| **Error** | Remediation failed, service issues | High priority ticket/alert |
| **Critical** | System-critical failures, data loss risk | Critical priority ticket/alert |

## Testing

### Test RMM Connection

```powershell
Import-Module "C:\Program Files\SelfHealingAgent\Modules\Integration\RMM-Integration.psm1"

# Send test alert
Send-RMMAlert -Severity "Info" `
    -Message "Self-Healing Agent RMM integration test" `
    -Data @{ Test = $true } `
    -Module "Test"
```

### Verify Configuration

```powershell
# Check configuration
$config = Get-Content "C:\Program Files\SelfHealingAgent\Config\RMMConfig.json" | ConvertFrom-Json
Write-Host "Platform: $($config.Platform)"
Write-Host "Enabled: $($config.Enabled)"
Write-Host "Endpoint: $($config.APIEndpoint)"
```

## Troubleshooting

### Alerts Not Sending

1. **Check configuration**:
   ```powershell
   Test-Path "C:\Program Files\SelfHealingAgent\Config\RMMConfig.json"
   ```

2. **Verify enabled**:
   ```powershell
   $config = Get-Content "C:\Program Files\SelfHealingAgent\Config\RMMConfig.json" | ConvertFrom-Json
   $config.Enabled
   ```

3. **Check logs**:
   ```powershell
   Get-Content "C:\Program Files\SelfHealingAgent\Logs\Execution_$(Get-Date -Format 'yyyy-MM-dd').log" | 
       Select-String "RMM"
   ```

4. **Test API endpoint**:
   ```powershell
   Invoke-RestMethod -Uri $config.APIEndpoint -Method Get -ErrorAction SilentlyContinue
   ```

### Authentication Errors

- Verify API key is correct
- Check API key permissions in RMM platform
- Ensure API endpoint URL is correct
- Check for expired tokens

### Rate Limiting

Some RMM platforms have API rate limits:
- Reduce alert frequency
- Increase `MinimumSeverity` to reduce alert volume
- Disable `SendOnVerification` if not needed

## Security Best Practices

1. **Protect API Keys**:
   - Store in secure configuration file
   - Use file system permissions to restrict access
   - Consider using Windows Credential Manager

2. **Use HTTPS**:
   - Always use HTTPS endpoints
   - Verify SSL certificates

3. **Least Privilege**:
   - Create dedicated API user with minimum required permissions
   - Don't use admin-level API keys

4. **Audit Logging**:
   - Monitor RMM integration logs
   - Review sent alerts regularly
   - Track API usage

## Advanced Configuration

### Group Policy Integration

Configure RMM settings via Group Policy:

```
HKEY_LOCAL_MACHINE\Software\Policies\SelfHealingAgent\RMM
```

Registry values:
- `Platform` (String)
- `Enabled` (DWORD)
- `APIEndpoint` (String)
- `APIKey` (String)
- `CompanyID` (String)

### Custom Webhook Payloads

For custom webhook integrations, modify the `Send-WebhookAlert` function to match your required payload format.

### Multiple RMM Platforms

To send to multiple platforms, create multiple configuration files and call `Send-RMMAlert` multiple times with different configs.

## Examples

### Slack Integration

```json
{
  "Platform": "Webhook",
  "Enabled": true,
  "APIEndpoint": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "APIKey": ""
}
```

The webhook will receive:
```json
{
  "source": "SelfHealingAgent",
  "module": "Network",
  "severity": "Warning",
  "message": "Network connectivity issues detected",
  "timestamp": "2026-01-14T15:30:00Z",
  "endpoint": "WORKSTATION01",
  "domain": "CONTOSO",
  "data": {
    "Issues": ["DNS resolution failed", "Gateway unreachable"]
  }
}
```

### Microsoft Teams Integration

Use the Webhook platform with Teams webhook URL:

```json
{
  "Platform": "Webhook",
  "Enabled": true,
  "APIEndpoint": "https://outlook.office.com/webhook/YOUR-WEBHOOK-URL"
}
```

## Support

For RMM integration issues:
1. Check agent logs for RMM-related errors
2. Verify API credentials in RMM platform
3. Test API endpoint manually with Postman or curl
4. Review RMM platform API documentation

## Additional Resources

- [ConnectWise Manage API Documentation](https://developer.connectwise.com/)
- [NinjaRMM API Documentation](https://ninjarmm.zendesk.com/hc/en-us/sections/360008229832-API-Documentation)
- [Datto RMM API Documentation](https://help.aem.autotask.net/en/Content/2SETUP/APIv2.htm)
- [Atera API Documentation](https://app.atera.com/api/v3/swagger/ui/index)
- [Syncro API Documentation](https://syncromsp.com/syncro-api/)

---

**Enterprise-grade RMM integration for centralized monitoring and alerting**
