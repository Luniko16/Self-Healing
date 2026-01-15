# Self-Healing Agent - Cross-Platform Edition

A universal IT support automation tool that works on **Windows, macOS, and Linux**.

## 🌍 Platform Support

| Platform | Status | Tested Versions |
|----------|--------|-----------------|
| **Windows** | ✅ Full Support | Windows 10, 11, Server 2016+ |
| **macOS** | ✅ Full Support | macOS 10.15+, Big Sur, Monterey, Ventura |
| **Linux** | ✅ Full Support | Ubuntu 20.04+, Debian 10+, RHEL 8+, CentOS 8+ |

## 🚀 Quick Start

### Prerequisites

- **Python 3.7+** (all platforms)
- **Administrator/Root privileges** (for remediation)

### Installation

#### Windows
```powershell
# Install Python if not already installed
# Download from python.org

# Install agent
cd CrossPlatform
python install.py
```

#### macOS
```bash
# Python 3 is pre-installed on macOS 10.15+
# Or install via Homebrew: brew install python3

# Install agent
cd CrossPlatform
sudo python3 install.py
```

#### Linux
```bash
# Install Python 3 if needed
sudo apt-get install python3 python3-pip  # Debian/Ubuntu
sudo yum install python3 python3-pip      # RHEL/CentOS

# Install agent
cd CrossPlatform
sudo python3 install.py
```

## 📋 Features by Platform

### Network Detection & Repair

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Internet connectivity test | ✅ | ✅ | ✅ |
| DNS resolution test | ✅ | ✅ | ✅ |
| Gateway reachability | ✅ | ✅ | ✅ |
| Interface detection | ✅ | ✅ | ✅ |
| IP renewal (DHCP) | ✅ | ✅ | ✅ |
| DNS cache flush | ✅ | ✅ | ✅ |
| Network restart | ✅ | ✅ | ✅ |

### Disk Cleanup

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Disk space detection | ✅ | ✅ | ✅ |
| Temp file cleanup | ✅ | ✅ | ✅ |
| Cache cleanup | ✅ | ✅ | ✅ |
| Log rotation | ✅ | ✅ | ✅ |
| Package cache cleanup | ✅ | ✅ | ✅ |

### Service Management

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Service status check | ✅ | ✅ | ✅ |
| Service restart | ✅ | ✅ | ✅ |
| Service enable/disable | ✅ | ✅ | ✅ |
| Daemon management | N/A | ✅ | ✅ |

### Printer Management

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Printer detection | ✅ | ✅ | ✅ |
| Print queue management | ✅ | ✅ | ✅ |
| Spooler restart | ✅ | ✅ (CUPS) | ✅ (CUPS) |

## 🔧 Usage

### Run Detection Only (Test Mode)

```bash
# All platforms
python3 agent.py --test-only

# Specific module
python3 agent.py --test-only --modules network

# Verbose output
python3 agent.py --test-only --verbose
```

### Run with Remediation

```bash
# Windows (PowerShell as Administrator)
python agent.py

# macOS/Linux (with sudo)
sudo python3 agent.py

# Specific modules
sudo python3 agent.py --modules network,disk
```

### Background Service

#### Windows
```powershell
# Install as Windows Service
python install_service.py

# Start service
sc start SelfHealingAgent

# Check status
sc query SelfHealingAgent
```

#### macOS
```bash
# Install as LaunchDaemon
sudo python3 install_service.py

# Start service
sudo launchctl load /Library/LaunchDaemons/com.selfhealingagent.plist

# Check status
sudo launchctl list | grep selfhealingagent
```

#### Linux (systemd)
```bash
# Install as systemd service
sudo python3 install_service.py

# Start service
sudo systemctl start selfhealingagent

# Enable on boot
sudo systemctl enable selfhealingagent

# Check status
sudo systemctl status selfhealingagent
```

## 📁 Directory Structure

```
CrossPlatform/
├── src/
│   ├── platform_detector.py    # OS detection
│   ├── logger.py                # Cross-platform logging
│   ├── config_manager.py        # Configuration management
│   └── agent.py                 # Main orchestrator
├── modules/
│   ├── network_detection.py     # Network detection
│   ├── network_remediation.py   # Network fixes
│   ├── disk_detection.py        # Disk space detection
│   ├── disk_remediation.py      # Disk cleanup
│   ├── service_detection.py     # Service monitoring
│   └── service_remediation.py   # Service management
├── config/
│   └── agent_config.json        # Configuration file
├── logs/                        # Log files
├── install.py                   # Installation script
├── install_service.py           # Service installation
└── README.md                    # This file
```

## ⚙️ Configuration

Edit `config/agent_config.json`:

```json
{
  "check_interval_hours": 4,
  "business_hours_start": 9,
  "business_hours_end": 18,
  "disk_cleanup_threshold_gb": 10,
  "max_remediations_per_day": 5,
  "enabled_modules": ["network", "disk", "service", "printer"],
  "enable_safety_checks": true,
  "log_level": "INFO"
}
```

## 🔒 Platform-Specific Permissions

### Windows
- Requires **Administrator** privileges
- Uses Windows Event Log for system logging
- Integrates with Task Scheduler

### macOS
- Requires **root** (sudo) privileges
- Uses system log (unified logging)
- Integrates with LaunchDaemons

### Linux
- Requires **root** (sudo) privileges
- Uses syslog for system logging
- Integrates with systemd

## 📊 Monitoring

### View Logs

```bash
# All platforms - view today's log
cat logs/execution_$(date +%Y-%m-%d).log

# Tail live log
tail -f logs/execution_$(date +%Y-%m-%d).log

# View system logs
# Windows: Event Viewer → Application
# macOS: Console.app or: log show --predicate 'process == "SelfHealingAgent"'
# Linux: journalctl -u selfhealingagent
```

### Generate Report

```bash
python3 generate_report.py --days 30
```

Opens HTML dashboard in browser with:
- Execution statistics
- Issues detected and resolved
- Platform-specific metrics
- Time saved estimates

## 🐛 Troubleshooting

### Agent Not Running

```bash
# Check if service is running
# Windows
sc query SelfHealingAgent

# macOS
sudo launchctl list | grep selfhealingagent

# Linux
sudo systemctl status selfhealingagent
```

### Permission Errors

```bash
# Ensure running with proper privileges
# Windows: Run as Administrator
# macOS/Linux: Use sudo

# Check file permissions
ls -la /opt/selfhealingagent  # Linux
ls -la "/Library/Application Support/SelfHealingAgent"  # macOS
```

### Python Dependencies

```bash
# Install required packages
pip3 install -r requirements.txt

# Or manually
pip3 install psutil requests
```

## 🔄 Updates

```bash
# Pull latest version
git pull origin main

# Reinstall
python3 install.py --upgrade

# Restart service
# Windows
sc stop SelfHealingAgent && sc start SelfHealingAgent

# macOS
sudo launchctl unload /Library/LaunchDaemons/com.selfhealingagent.plist
sudo launchctl load /Library/LaunchDaemons/com.selfhealingagent.plist

# Linux
sudo systemctl restart selfhealingagent
```

## 🌟 Key Differences from Windows-Only Version

| Feature | Windows-Only | Cross-Platform |
|---------|--------------|----------------|
| Language | PowerShell | Python 3 |
| Modules | .psm1 files | .py files |
| Service | Task Scheduler | Native service managers |
| Logging | Event Log | Syslog + file logging |
| Config | JSON | JSON (same format) |
| Deployment | GPO, SCCM | Ansible, Puppet, Chef |

## 📦 Dependencies

### Required
- Python 3.7+
- psutil (cross-platform system utilities)

### Optional
- requests (for RMM integration)
- distro (for Linux distribution detection)

Install all:
```bash
pip3 install psutil requests distro
```

## 🤝 Contributing

The cross-platform version welcomes contributions for:
- Additional platform support (BSD, Solaris, etc.)
- Platform-specific optimizations
- New detection/remediation modules
- Improved error handling

## 📄 License

Same as main project - provided as-is for educational and production use.

## 🆘 Support

- **Documentation**: See platform-specific guides in `/docs`
- **Issues**: Check logs in `/logs` directory
- **Community**: GitHub Issues

---

**Universal IT Support Automation - One Agent, All Platforms**

*Fixing IT issues everywhere, silently and automatically.*
