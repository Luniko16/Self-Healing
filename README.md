# Self-Healing IT Support Agent

🛠️ An automated cross-platform endpoint agent that detects and resolves common IT issues without human intervention. Functions as a virtual Tier-1 IT technician.

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)]()
[![PowerShell](https://img.shields.io/badge/PowerShell-5.1%2B-blue)]()
[![Python](https://img.shields.io/badge/Python-3.7%2B-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## 🎯 Overview

The Self-Healing Agent follows the **Detect → Diagnose → Fix → Verify → Report** framework to automatically handle repetitive IT support issues:

- 🌐 **Network connectivity failures** (DNS, DHCP, adapter issues)
- 🖨️ **Printer and spooler problems** (stuck jobs, service failures)
- 💾 **Low disk space** (temp files, caches, update leftovers)
- ⚙️ **Critical service failures** (Windows services not running)

## ✨ Features

### Core Capabilities
- ✅ **Cross-Platform Support** - Windows, macOS, and Linux
- ✅ **Dual Implementation** - PowerShell (Windows) + Python (Cross-platform)
- ✅ **Web Dashboard** - Real-time IT admin control panel
- ✅ **Automated Detection & Remediation** - No manual intervention needed
- ✅ **Completely Silent Operation** - Runs in background with no user interaction
- ✅ **95% Offline Capable** - Works without internet connection

### Smart Operations
- 🕐 **Smart Scheduling** - Runs during off-hours (2 AM) and respects business hours
- 🛡️ **Safety Checks** - Detects active users, business hours, and system state
- 🎯 **Zero User Impact** - Low priority, minimal resources, no interruptions
- 📊 **Comprehensive Logging** - Full audit trail of all actions
- 📈 **HTML Dashboards** - Visual reports with charts and statistics

### Enterprise Features
- 🔧 **RMM Integration** - ConnectWise, Datto, NinjaRMM support
- 🏢 **Group Policy Templates** - Enterprise deployment (ADMX/ADML)
- 📋 **Event Log Integration** - Enterprise monitoring support
- ⚙️ **JSON Configuration** - Easy customization
- 🧪 **Test Mode** - Safe validation before deployment

## 🖥️ System Requirements

### Windows (PowerShell)
- **OS**: Windows 10 / 11 / Server 2016+
- **PowerShell**: 5.1 or higher
- **Privileges**: Administrator rights for remediation

### Cross-Platform (Python)
- **OS**: Windows, macOS, or Linux
- **Python**: 3.7 or higher
- **Packages**: `psutil`, `flask` (for web dashboard)
- **Privileges**: Administrator/root for remediation

## 🚀 Installation

### Option 1: Windows (PowerShell) - Background Service

For completely silent background operation:

```powershell
# Clone the repository
git clone https://github.com/YOUR_USERNAME/self-healing-agent.git
cd self-healing-agent

# Run as Administrator
.\Install-Agent.ps1
.\Install-BackgroundService.ps1
```

### Option 2: Cross-Platform (Python) - Web Dashboard

For interactive web-based management:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/self-healing-agent.git
cd self-healing-agent

# Install dependencies
pip install psutil flask

# Run the web dashboard
python CrossPlatform/web/dashboard.py
```

Then open http://localhost:5000 in your browser.

### Option 3: Cross-Platform (Python) - Command Line

For automated execution:

```bash
# Test mode (detection only)
python CrossPlatform/agent.py --test-only

# Full run with remediation (requires sudo/admin)
sudo python CrossPlatform/agent.py

# Specific modules only
python CrossPlatform/agent.py --modules network,disk,printer
```

## 🎨 Web Dashboard

The Python implementation includes a beautiful web-based dashboard for IT administrators:

**Features:**
- 🔍 Real-time scanning (Full scan or individual modules)
- 📊 Live results with issue detection
- 🔧 One-click remediation
- 📈 Statistics and summaries
- 🎯 Escalation to Tier 2 support
- 🌐 Accessible from any browser

**Access:** http://localhost:5000

**Scan Options:**
- 🔍 Run Full Scan (all modules)
- 🌐 Network Only
- 💾 Disk Only
- ⚙️ Services Only
- 🖨️ Printer Only

## 📋 Quick Start
- Run completely hidden (no windows or popups)
- Execute during off-hours (2 AM daily)
- Respect business hours and active users
- Use minimal system resources
- Never interrupt user work

### Standard Install

For manual control:

1. Download or clone the repository
2. Open PowerShell as Administrator
3. Navigate to the agent directory
4. Run the installation script:

```powershell
.\Install-Agent.ps1
```

The installer will:
- Create directory structure in `C:\Program Files\SelfHealingAgent`
- Copy all agent files
- Create default configuration
- Register scheduled task (runs daily at 2:00 AM)
- Register event log source

### Manual Installation

If you prefer manual installation:

1. Create directory: `C:\Program Files\SelfHealingAgent`
2. Copy all files maintaining the folder structure
3. Create scheduled task pointing to `Start-SelfHealingAgent.ps1`
4. Register event log source: `New-EventLog -LogName "Application" -Source "SelfHealingAgent"`

## Usage

### Run All Modules

Detect and fix all issues across all modules:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1"
```

### Run Specific Modules

Run only Network and Printer modules:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -Modules Network,Printer
```

Available modules:
- `Network` - Network connectivity issues
- `Printer` - Printer and spooler problems
- `Disk` - Disk space cleanup
- `Service` - Critical Windows services

### Test Mode (Detection Only)

Run detection without performing any remediation:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -TestOnly
```

### Force Mode

Force remediation even if no issues are detected:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -Force
```

## Configuration

Edit the configuration file: `C:\Program Files\SelfHealingAgent\Config\AgentConfig.json`

```json
{
  "CheckIntervalHours": 4,
  "BusinessHoursStart": 9,
  "BusinessHoursEnd": 18,
  "DiskCleanupThresholdGB": 10,
  "DiskCleanupCriticalGB": 5,
  "MaxLogAgeDays": 30,
  "AllowedRemediationModules": ["Network", "Printer", "Disk", "Service"],
  "EnableSafetyChecks": true,
  "NotificationEmail": "",
  "Version": "1.0.0"
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `CheckIntervalHours` | Hours between automated checks | 4 |
| `BusinessHoursStart` | Start of business hours (24h format) | 9 |
| `BusinessHoursEnd` | End of business hours (24h format) | 18 |
| `DiskCleanupThresholdGB` | Warning threshold for disk space | 10 |
| `DiskCleanupCriticalGB` | Critical threshold for disk space | 5 |
| `MaxLogAgeDays` | Days to retain log files | 30 |
| `AllowedRemediationModules` | Modules enabled for remediation | All |
| `EnableSafetyChecks` | Enable safety checks before remediation | true |

## Architecture

### Directory Structure

```
C:\Program Files\SelfHealingAgent\
├── Core-Logging.psm1              # Core logging module
├── Scripts\
│   └── Start-SelfHealingAgent.ps1 # Main orchestrator
├── Modules\
│   ├── Detection\                 # Detection modules
│   │   ├── Network-Detection.psm1
│   │   ├── Printer-Detection.psm1
│   │   ├── Disk-Detection.psm1
│   │   └── Service-Detection.psm1
│   ├── Remediation\               # Remediation modules
│   │   ├── Network-Remediation.psm1
│   │   ├── Printer-Remediation.psm1
│   │   ├── Disk-Remediation.psm1
│   │   └── Service-Remediation.psm1
│   ├── Verification\              # Verification modules
│   │   └── Network-Verification.psm1
│   └── Safety\                    # Safety checks
│       └── Safety-Checks.psm1
├── Config\
│   └── AgentConfig.json           # Configuration file
└── Logs\                          # Log files and reports
    ├── Execution_YYYY-MM-DD.log
    └── YYYY-MM-DD_HHmmss_Module.json
```

### Module Workflow

Each module follows the same pattern:

1. **Detection** - Identify issues
2. **Remediation** - Apply fixes (if not in test mode)
3. **Verification** - Confirm issues are resolved
4. **Reporting** - Log results and generate reports

## Logging

### Log Files

- **Execution Logs**: `C:\Program Files\SelfHealingAgent\Logs\Execution_YYYY-MM-DD.log`
- **Module Reports**: `C:\Program Files\SelfHealingAgent\Logs\YYYY-MM-DD_HHmmss_Module.json`
- **Windows Event Log**: Application log, source "SelfHealingAgent"

### Log Levels

- `INFO` - General information
- `WARN` - Warnings and detected issues
- `ERROR` - Errors during execution
- `AUDIT` - Actions taken and remediation results

### Example Log Entry

```
2026-01-14 14:30:15 | INFO | NetworkDetect | Test-NetworkConnectivity | Starting network connectivity detection
2026-01-14 14:30:16 | WARN | NetworkDetect | DNS resolution failed: google.com
2026-01-14 14:30:17 | AUDIT | NetworkFix | Flushed DNS cache
2026-01-14 14:30:18 | INFO | NetworkVerify | DNS resolution successful
```

## Safety Features

The agent includes multiple safety checks to prevent disruption:

- **Business Hours Detection** - Avoids remediation during work hours (9 AM - 6 PM weekdays)
- **Active User Sessions** - Postpones remediation if users are logged in
- **Pending Reboot Check** - Warns if system needs restart
- **System Uptime** - Waits for system stabilization after boot
- **CPU Usage** - Avoids remediation during high CPU usage
- **Disk Space Validation** - Ensures sufficient space before cleanup

Safety checks can be bypassed using the `-Force` parameter if needed.

## Troubleshooting

### Agent Not Running

1. Check scheduled task: `Get-ScheduledTask -TaskName "SelfHealingAgent"`
2. Verify task is enabled and has correct path
3. Check execution history in Task Scheduler

### No Logs Generated

1. Verify log directory exists: `C:\Program Files\SelfHealingAgent\Logs`
2. Check permissions on log directory
3. Run agent manually to see console output

### Remediation Not Working

1. Verify running as Administrator
2. Check safety checks aren't blocking remediation
3. Review error logs for specific failures
4. Use `-Force` parameter to bypass safety checks

### Module-Specific Issues

Run individual modules in test mode to isolate problems:

```powershell
.\Start-SelfHealingAgent.ps1 -Modules Network -TestOnly
```

## Uninstallation

Run the uninstall script as Administrator:

```powershell
C:\Program Files\SelfHealingAgent\Uninstall-Agent.ps1
```

This will:
- Remove the scheduled task
- Remove the event log source
- Delete all agent files and directories

## Security Considerations

- Agent runs as SYSTEM account for necessary privileges
- All actions are logged for audit purposes
- Safety checks prevent unintended disruption
- No external network connections (except for connectivity tests)
- No data collection or telemetry

## Extending the Agent

### Adding a New Module

1. Create detection module: `Modules\Detection\YourModule-Detection.psm1`
2. Create remediation module: `Modules\Remediation\YourModule-Remediation.psm1`
3. Create verification module: `Modules\Verification\YourModule-Verification.psm1`
4. Update `Start-SelfHealingAgent.ps1` to include your module
5. Follow the existing module patterns for consistency

### Module Template

Each module should export functions following this pattern:

- **Detection**: `Test-YourModuleHealth` - Returns hashtable with `HasIssues`, `Issues`, `Timestamp`
- **Remediation**: `Repair-YourModule` - Returns hashtable with `ActionsTaken`, `Errors`, `Success`, `Timestamp`
- **Verification**: `Test-YourModuleVerification` - Returns hashtable with `AllFixed`, `Results`, `Status`, `Timestamp`

## Enterprise Deployment

### Group Policy Deployment

1. Copy agent files to network share
2. Create GPO to run `Install-Agent.ps1` on target machines
3. Configure scheduled task via GPO if needed

### SCCM/Intune Deployment

1. Package agent as application
2. Deploy to device collections
3. Monitor deployment status
4. Collect logs centrally

### MSP Environment

- Deploy to all managed endpoints
- Centralize log collection via file share or SIEM
- Customize configuration per client
- Monitor scheduled task execution
- Review audit logs regularly

## Support

For issues, questions, or contributions:
- Review logs in `C:\Program Files\SelfHealingAgent\Logs`
- Check Windows Event Viewer (Application log, source "SelfHealingAgent")
- Run in test mode to diagnose issues

## License

This project is provided as-is for educational and production use.

## Version History

### Version 1.0.0
- Initial release
- Network, Printer, Disk, and Service modules
- Safety checks and logging
- Scheduled task automation
- Configuration management

---

**Built for IT professionals who want to automate repetitive support tasks and reduce downtime.**
