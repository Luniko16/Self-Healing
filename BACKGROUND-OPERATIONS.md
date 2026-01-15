# Background Operations Guide

This guide explains how the Self-Healing Agent operates completely in the background without impacting user productivity.

## Overview

The Self-Healing Agent is designed to run as a **completely silent background service** that:
- ✅ Never shows windows or popups to users
- ✅ Never interrupts user work
- ✅ Runs during off-hours (2 AM by default)
- ✅ Respects business hours (9 AM - 6 PM)
- ✅ Detects active user sessions
- ✅ Uses minimal system resources
- ✅ Operates with low process priority

## Installation for Background Operation

### Quick Install

```powershell
# Run as Administrator
.\Install-Agent.ps1
.\Install-BackgroundService.ps1
```

This configures the agent to run completely in the background with optimal settings.

### What Gets Configured

1. **Silent Execution Wrapper**
   - Hides PowerShell window completely
   - Suppresses all output and notifications
   - Redirects logs to files only

2. **Scheduled Task Settings**
   - Runs as SYSTEM account (no user interaction)
   - Hidden from Task Scheduler UI
   - Low priority (Priority 7)
   - Won't wake computer from sleep
   - Won't interrupt if user is active

3. **Multiple Triggers**
   - **Daily at 2:00 AM** - Primary execution during off-hours
   - **At system startup** - 5 minute delay to avoid boot slowdown
   - **Every 4 hours** - Periodic checks during the day (respects safety checks)

4. **Safety Checks**
   - Business hours detection (9 AM - 6 PM)
   - Active user session detection
   - System uptime validation
   - CPU usage monitoring
   - Pending reboot detection

## How It Stays Silent

### 1. No User Interface

The agent runs with:
```powershell
-WindowStyle Hidden -NoProfile -NonInteractive
```

This ensures:
- No PowerShell window appears
- No console output visible
- No user prompts or dialogs

### 2. Process Priority

The agent sets its process priority to **BelowNormal**, ensuring:
- User applications always get priority
- No performance impact on user work
- Background execution only when resources available

### 3. Safety Checks

Before any remediation, the agent checks:

| Check | Purpose | Action if Failed |
|-------|---------|------------------|
| **Business Hours** | Avoid disruption during work hours | Postpone remediation |
| **Active Users** | Don't interrupt logged-in users | Postpone remediation |
| **System Uptime** | Wait for system stabilization | Wait 10 minutes after boot |
| **CPU Usage** | Don't impact performance | Postpone if CPU > 80% |
| **Pending Reboot** | Avoid incomplete fixes | Log warning, continue |

### 4. Execution Schedule

Default schedule optimized for minimal impact:

```
┌─────────────────────────────────────────────────────────┐
│ Time    │ Action                │ Impact                │
├─────────┼───────────────────────┼───────────────────────┤
│ 2:00 AM │ Primary execution     │ Zero (users offline)  │
│ 6:00 AM │ Periodic check        │ Low (before work)     │
│ 10:00 AM│ Periodic check        │ Skipped (business hrs)│
│ 2:00 PM │ Periodic check        │ Skipped (business hrs)│
│ 6:00 PM │ Periodic check        │ Low (after work)      │
│ 10:00 PM│ Periodic check        │ Zero (users offline)  │
└─────────┴───────────────────────┴───────────────────────┘
```

## Monitoring Background Operations

### View Execution History

```powershell
# Check last execution
Get-ScheduledTaskInfo -TaskName "SelfHealingAgent"

# View execution log
Get-Content "C:\Program Files\SelfHealingAgent\Logs\Execution_$(Get-Date -Format 'yyyy-MM-dd').log"

# View recent activity
Get-ChildItem "C:\Program Files\SelfHealingAgent\Logs\*.json" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5
```

### Check Task Status

```powershell
# View task details
Get-ScheduledTask -TaskName "SelfHealingAgent" | Format-List *

# View task history in Event Viewer
Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" | 
    Where-Object { $_.Message -like "*SelfHealingAgent*" } | 
    Select-Object -First 10
```

### Generate Dashboard Report

```powershell
# Generate HTML report
Import-Module "C:\Program Files\SelfHealingAgent\Modules\Reporting\Report-Generator.psm1"
Generate-AgentReport -Days 30

# Open report
Start-Process "C:\Program Files\SelfHealingAgent\Reports\Dashboard.html"
```

## Configuration for Different Environments

### Development/Test Environment

More frequent checks, less restrictive:

```json
{
  "CheckIntervalHours": 1,
  "BusinessHoursStart": 0,
  "BusinessHoursEnd": 0,
  "EnableSafetyChecks": false,
  "MaxRemediationsPerDay": 50
}
```

### Production Workstations

Conservative settings, maximum safety:

```json
{
  "CheckIntervalHours": 4,
  "BusinessHoursStart": 9,
  "BusinessHoursEnd": 18,
  "EnableSafetyChecks": true,
  "MaxRemediationsPerDay": 5,
  "MinimizeUserImpact": true
}
```

### Servers (24/7 Operation)

Aggressive remediation, no business hours:

```json
{
  "CheckIntervalHours": 2,
  "BusinessHoursStart": 0,
  "BusinessHoursEnd": 0,
  "EnableSafetyChecks": false,
  "MaxRemediationsPerDay": 20
}
```

### Kiosks/Unattended Systems

Immediate remediation, no delays:

```json
{
  "CheckIntervalHours": 1,
  "BusinessHoursStart": 0,
  "BusinessHoursEnd": 0,
  "EnableSafetyChecks": false,
  "MaxRemediationsPerDay": 100
}
```

## Resource Usage

The agent is designed to use minimal resources:

| Resource | Usage | Impact |
|----------|-------|--------|
| **CPU** | < 5% during execution | Negligible |
| **Memory** | ~50-100 MB | Minimal |
| **Disk I/O** | Low (log writes only) | Negligible |
| **Network** | Minimal (connectivity tests) | Negligible |
| **Execution Time** | 30-120 seconds | Brief |

### Performance Optimization

The agent automatically:
- Sets process priority to BelowNormal
- Throttles operations if CPU > 80%
- Limits concurrent operations
- Uses efficient PowerShell cmdlets
- Minimizes disk I/O

## Troubleshooting Background Operations

### Agent Not Running

```powershell
# Check if task exists
Get-ScheduledTask -TaskName "SelfHealingAgent"

# Check task status
(Get-ScheduledTask -TaskName "SelfHealingAgent").State

# Enable task if disabled
Enable-ScheduledTask -TaskName "SelfHealingAgent"

# Run immediately for testing
Start-ScheduledTask -TaskName "SelfHealingAgent"
```

### No Logs Generated

```powershell
# Check log directory permissions
Get-Acl "C:\Program Files\SelfHealingAgent\Logs"

# Verify SYSTEM account has write access
icacls "C:\Program Files\SelfHealingAgent\Logs"

# Test manual execution
& "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -TestOnly
```

### Task Runs But Nothing Happens

```powershell
# Check safety checks
$config = Get-Content "C:\Program Files\SelfHealingAgent\Config\AgentConfig.json" | ConvertFrom-Json
$config.EnableSafetyChecks

# View last execution result
Get-ScheduledTaskInfo -TaskName "SelfHealingAgent" | Select-Object LastRunTime, LastTaskResult

# Check for errors in Event Viewer
Get-WinEvent -LogName "Application" | 
    Where-Object { $_.Source -eq "SelfHealingAgent" } | 
    Select-Object -First 10
```

## Best Practices

### 1. Initial Testing

Before deploying to production:

```powershell
# Test in non-production environment
.\Start-SelfHealingAgent.ps1 -TestOnly

# Review logs
Get-Content "Logs\Execution_$(Get-Date -Format 'yyyy-MM-dd').log"

# Generate test report
Generate-AgentReport -Days 7
```

### 2. Gradual Rollout

Deploy in phases:
1. **Pilot group** (10-20 machines) - 1 week
2. **Department** (50-100 machines) - 2 weeks
3. **Organization-wide** - After validation

### 3. Monitoring

Set up monitoring for:
- Task execution success rate
- Remediation success rate
- User complaints or issues
- System performance metrics

### 4. Regular Review

Monthly review:
- Check dashboard reports
- Review failed remediations
- Adjust safety thresholds
- Update module configurations

## User Communication

### What Users Should Know

**Minimal communication needed:**
- "IT has deployed an automated support tool"
- "It runs in the background to fix common issues"
- "You won't see or notice it running"
- "Contact IT if you experience any issues"

### What Users Won't Notice

- No windows or popups
- No performance impact
- No interruptions
- No notifications
- No changes to their workflow

## Enterprise Deployment

### Group Policy Deployment

1. Copy agent files to network share
2. Deploy via GPO startup script
3. Configure via Group Policy preferences
4. Monitor via centralized logging

### SCCM/Intune Deployment

1. Package as application
2. Deploy to device collections
3. Configure compliance policies
4. Monitor via SCCM reports

### MSP Deployment

1. Deploy via RMM tool
2. Configure per-client settings
3. Integrate with ticketing system
4. Monitor via RMM dashboard

## Security Considerations

### Least Privilege

The agent:
- Runs as SYSTEM only when needed
- Uses specific permissions for each operation
- Logs all actions for audit
- Never modifies user data

### Audit Trail

All operations are logged:
- What was detected
- What action was taken
- When it occurred
- What the result was

### Compliance

The agent supports:
- SOC 2 compliance (audit logging)
- HIPAA compliance (no PHI access)
- PCI DSS compliance (no payment data access)
- GDPR compliance (no personal data collection)

## Support

For background operation issues:
1. Check Task Scheduler history
2. Review agent logs
3. Verify safety check settings
4. Test manual execution
5. Contact IT support

---

**The Self-Healing Agent: Silent, Safe, and Effective**

*Fixing IT issues in the background so users can focus on their work.*
