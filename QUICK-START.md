# Quick Start Guide - Self-Healing Agent

## 🚀 5-Minute Setup

### Step 1: Install (2 minutes)

```powershell
# Run as Administrator
cd C:\Path\To\Self-Healing
.\Install-Agent.ps1
.\Install-BackgroundService.ps1
```

**Done!** The agent is now running silently in the background.

### Step 2: Verify (1 minute)

```powershell
# Check task is running
Get-ScheduledTask -TaskName "SelfHealingAgent"

# Test immediately
Start-ScheduledTask -TaskName "SelfHealingAgent"

# Wait 30 seconds, then check logs
Get-Content "C:\Program Files\SelfHealingAgent\Logs\Execution_$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 20
```

### Step 3: Monitor (2 minutes)

```powershell
# Generate dashboard
Import-Module "C:\Program Files\SelfHealingAgent\Modules\Reporting\Report-Generator.psm1"
Generate-AgentReport -Days 7

# Open in browser
Start-Process "C:\Program Files\SelfHealingAgent\Reports\Dashboard.html"
```

## 📋 What It Does

The agent runs **completely in the background** and automatically fixes:

| Issue | Detection | Remediation |
|-------|-----------|-------------|
| **Network** | Internet, DNS, DHCP, adapters | Renew IP, flush DNS, restart adapters |
| **Printer** | Spooler, stuck jobs, offline | Restart spooler, clear jobs, reset printers |
| **Disk** | Low space (< 10GB) | Clean temp files, caches, updates |
| **Services** | Critical services stopped | Restart services, set to automatic |

## ⏰ When It Runs

- **Primary**: Daily at 2:00 AM (off-hours)
- **Startup**: 5 minutes after system boot
- **Periodic**: Every 4 hours (respects business hours)

## 🛡️ Safety Features

The agent **never interrupts users**:

✅ Detects business hours (9 AM - 6 PM)  
✅ Detects active user sessions  
✅ Runs with low priority  
✅ No windows or popups  
✅ Maximum 5 fixes per day  

## 📊 Monitoring

### View Last Execution

```powershell
Get-ScheduledTaskInfo -TaskName "SelfHealingAgent"
```

### View Logs

```powershell
# Today's log
Get-Content "C:\Program Files\SelfHealingAgent\Logs\Execution_$(Get-Date -Format 'yyyy-MM-dd').log"

# Recent activity
Get-ChildItem "C:\Program Files\SelfHealingAgent\Logs\*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

### View Dashboard

```powershell
Start-Process "C:\Program Files\SelfHealingAgent\Reports\Dashboard.html"
```

## 🔧 Common Tasks

### Test Without Remediation

```powershell
& "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -TestOnly
```

### Run Specific Module

```powershell
& "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -Modules Network
```

### Force Remediation

```powershell
& "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -Force
```

### Disable Temporarily

```powershell
Disable-ScheduledTask -TaskName "SelfHealingAgent"
```

### Re-enable

```powershell
Enable-ScheduledTask -TaskName "SelfHealingAgent"
```

## ⚙️ Configuration

Edit: `C:\Program Files\SelfHealingAgent\Config\AgentConfig.json`

```json
{
  "CheckIntervalHours": 4,
  "BusinessHoursStart": 9,
  "BusinessHoursEnd": 18,
  "EnableSafetyChecks": true,
  "MaxRemediationsPerDay": 5
}
```

## 🚨 Troubleshooting

### Agent Not Running

```powershell
# Check status
Get-ScheduledTask -TaskName "SelfHealingAgent"

# Enable if disabled
Enable-ScheduledTask -TaskName "SelfHealingAgent"

# Run now
Start-ScheduledTask -TaskName "SelfHealingAgent"
```

### No Logs

```powershell
# Check permissions
Get-Acl "C:\Program Files\SelfHealingAgent\Logs"

# Test manually
& "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -TestOnly
```

### Not Fixing Issues

```powershell
# Check if running as admin
Get-ScheduledTask -TaskName "SelfHealingAgent" | Select-Object -ExpandProperty Principal

# Should show: UserId = SYSTEM, RunLevel = Highest
```

## 📈 Enterprise Deployment

### Deploy to Multiple Machines

```powershell
# Via Group Policy
# 1. Copy agent to network share
# 2. Create GPO with startup script
# 3. Link to target OU

# Via SCCM/Intune
# 1. Package as application
# 2. Deploy to device collection
# 3. Monitor compliance
```

### Centralized Monitoring

```powershell
# Collect logs from all machines
$computers = Get-ADComputer -Filter * -SearchBase "OU=Workstations,DC=domain,DC=com"

foreach ($computer in $computers) {
    $logPath = "\\$($computer.Name)\C$\Program Files\SelfHealingAgent\Logs"
    Copy-Item "$logPath\*.json" -Destination "\\FileServer\AgentLogs\$($computer.Name)\" -Force
}
```

## 📞 Support

- **Logs**: `C:\Program Files\SelfHealingAgent\Logs`
- **Config**: `C:\Program Files\SelfHealingAgent\Config`
- **Reports**: `C:\Program Files\SelfHealingAgent\Reports`
- **Documentation**: See README.md and BACKGROUND-OPERATIONS.md

## 🎯 Key Points

1. **Completely Silent** - Users never see it running
2. **Safe by Default** - Won't interrupt work
3. **Automatic** - No manual intervention needed
4. **Monitored** - Full audit trail
5. **Configurable** - Adjust to your needs

---

**That's it! The agent is now protecting your endpoints in the background.**

*Questions? Check the full documentation in README.md*
