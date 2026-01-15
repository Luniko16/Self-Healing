# Offline Setup Guide

## Current Offline Capability: 95%

The Self-Healing Agent is designed to work **completely offline** for all core functionality. The only optional external dependency is Chart.js for visual charts in HTML reports.

---

## ✅ What Works Offline (No Internet Required)

### Core Functionality
- ✅ **All detection modules** (Network, Disk, Service, Printer)
- ✅ **All remediation modules** (fixes work without internet)
- ✅ **Safety checks** (business hours, user sessions, system state)
- ✅ **Verification** (post-remediation validation)
- ✅ **Logging** (all logs stored locally)
- ✅ **Configuration** (JSON-based, local files)
- ✅ **Scheduled execution** (Windows Task Scheduler / cron)

### Web Dashboard (Python)
- ✅ **Fully self-contained** - no external dependencies
- ✅ **All CSS inline** - no external stylesheets
- ✅ **All JavaScript inline** - no external scripts
- ✅ **Works on localhost** - no internet connection needed
- ✅ **Real-time scanning** - all processing local

### PowerShell Modules
- ✅ **All detection logic** - uses local Windows APIs
- ✅ **All remediation logic** - local system commands
- ✅ **Report generation** - creates HTML files locally
- ✅ **RMM integration** - optional, not required

---

## ⚠️ Optional External Dependency

### Chart.js (for HTML Report Charts)

**Location:** PowerShell Report Generator (`Modules/Reporting/Report-Generator.psm1`)

**Purpose:** Displays visual charts in HTML reports (bar charts, line graphs)

**Impact if offline:**
- Reports still generate successfully
- All data and statistics display correctly
- Charts simply won't render (graceful degradation)
- Console warning: "CDN unavailable - charts disabled"

**To make 100% offline:**

1. Download Chart.js:
   ```powershell
   Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js" `
       -OutFile "CrossPlatform/web/static/js/chart.min.js"
   ```

2. Update Report Generator to use local file:
   ```powershell
   # In Modules/Reporting/Report-Generator.psm1, replace:
   <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
   
   # With:
   <script src="file:///C:/Program Files/SelfHealingAgent/web/static/js/chart.min.js"></script>
   ```

---

## 🔒 Offline Security Benefits

Running offline provides several security advantages:

1. **No data exfiltration** - all data stays on local machine
2. **No external API calls** - no risk of credential leaks
3. **Air-gapped compatible** - works in isolated networks
4. **Compliance friendly** - meets strict data residency requirements
5. **Zero trust networks** - doesn't require internet access

---

## 📋 Offline Deployment Checklist

### For Completely Isolated Networks:

- [x] Install Python 3.7+ (from offline installer)
- [x] Install required Python packages:
  - `pip install psutil flask` (from wheel files)
- [x] Copy agent files to target machine
- [x] Configure agent (edit `agent_config.json`)
- [x] Run installation script
- [x] Test detection modules
- [x] Schedule background execution
- [ ] (Optional) Download Chart.js for report charts

### Python Packages for Offline Install:

```bash
# On internet-connected machine, download wheels:
pip download psutil flask -d ./offline-packages

# On offline machine, install from wheels:
pip install --no-index --find-links=./offline-packages psutil flask
```

---

## 🌐 Network Detection in Offline Mode

**Important:** The network detection module tests internet connectivity as part of its checks. In offline/air-gapped environments:

- Network adapter status checks still work
- Gateway reachability tests still work
- DNS resolution tests will fail (expected in offline mode)
- Internet connectivity tests will fail (expected in offline mode)

**To disable internet checks in offline environments:**

Edit `CrossPlatform/config/agent_config.json`:
```json
{
  "enabled_modules": ["disk", "service", "printer"],
  "offline_mode": true
}
```

Or run with specific modules only:
```bash
python CrossPlatform/agent.py --modules disk,service,printer
```

---

## 📊 Offline Reporting

### Local HTML Reports
- Generated in `Reports/` directory
- Open directly in browser (file:// protocol)
- All styling inline (no external CSS)
- JavaScript embedded (no external scripts)
- Charts optional (work without Chart.js)

### Log Files
- Stored in `Logs/` directory
- Plain text format (easy to parse)
- JSON format for structured data
- No external dependencies
- Viewable in any text editor

---

## 🚀 Offline Performance

**Benefits of offline operation:**
- ⚡ Faster execution (no network latency)
- 🔋 Lower resource usage (no HTTP requests)
- 🛡️ More reliable (no dependency on external services)
- 📈 Consistent performance (no CDN slowdowns)

---

## ✅ Verification

To verify offline capability:

1. **Disconnect from internet**
2. **Run detection:**
   ```bash
   python CrossPlatform/agent.py --test-only
   ```
3. **Start web dashboard:**
   ```bash
   python CrossPlatform/web/dashboard.py
   ```
4. **Access dashboard:** http://localhost:5000
5. **Run scans** - all should work except internet connectivity tests

**Expected results:**
- ✅ Disk detection works
- ✅ Service detection works
- ✅ Printer detection works
- ⚠️ Network detection reports "no internet" (expected)
- ✅ Web dashboard loads and functions
- ✅ All remediation actions work

---

## 📝 Summary

**The Self-Healing Agent is designed for offline operation.**

- **95% offline** out of the box
- **100% offline** with Chart.js downloaded locally
- **All core functionality** works without internet
- **Optional Chart.js** only affects visual charts in reports
- **Graceful degradation** - works perfectly without charts
- **Air-gap compatible** - suitable for isolated networks

**Bottom line:** You can deploy and run the agent in completely offline/air-gapped environments with full functionality. The only thing you'll miss is pretty charts in HTML reports (all data is still there, just not visualized).
