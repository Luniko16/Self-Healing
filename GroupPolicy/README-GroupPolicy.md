# Group Policy Deployment Guide

This guide explains how to deploy and configure the Self-Healing Agent using Group Policy in an Active Directory environment.

## Overview

The Self-Healing Agent includes ADMX/ADML templates for centralized management via Group Policy. This allows IT administrators to:

- Enable/disable the agent across the organization
- Control which modules are active
- Configure safety settings and thresholds
- Enforce consistent configuration across all endpoints

## Files Included

- `SelfHealingAgent.admx` - Group Policy template (XML schema)
- `en-US/SelfHealingAgent.adml` - English language resources

## Installation

### Option 1: Central Store (Recommended for Domain)

1. Copy the ADMX file to the Central Store:
   ```
   \\yourdomain.com\SYSVOL\yourdomain.com\Policies\PolicyDefinitions\SelfHealingAgent.admx
   ```

2. Copy the ADML file to the language folder:
   ```
   \\yourdomain.com\SYSVOL\yourdomain.com\Policies\PolicyDefinitions\en-US\SelfHealingAgent.adml
   ```

3. The templates will be available to all domain controllers and administrators

### Option 2: Local Installation

1. Copy the ADMX file to:
   ```
   C:\Windows\PolicyDefinitions\SelfHealingAgent.admx
   ```

2. Copy the ADML file to:
   ```
   C:\Windows\PolicyDefinitions\en-US\SelfHealingAgent.adml
   ```

3. The templates will only be available on the local machine

## Configuration

### Opening Group Policy Editor

1. Open **Group Policy Management Console** (gpmc.msc)
2. Create a new GPO or edit an existing one
3. Navigate to: **Computer Configuration → Policies → Administrative Templates → System → Self-Healing Agent**

### Available Policies

#### Main Settings

| Policy | Description | Default |
|--------|-------------|---------|
| **Enable Self-Healing Agent** | Master switch to enable/disable the agent | Not Configured |
| **Check Interval (Hours)** | How often the agent checks for issues | 4 hours |
| **Log Retention Period (Days)** | How long to keep log files | 30 days |

#### Module Settings

| Policy | Description | Default |
|--------|-------------|---------|
| **Enable Network Repair Module** | Fixes network connectivity issues | Not Configured |
| **Enable Printer Repair Module** | Fixes printer and spooler issues | Not Configured |
| **Enable Disk Cleanup Module** | Cleans temporary files and caches | Not Configured |
| **Enable Service Repair Module** | Restarts critical Windows services | Not Configured |
| **Disk Cleanup Threshold (GB)** | Free space threshold for cleanup | 10 GB |

#### Safety Settings

| Policy | Description | Default |
|--------|-------------|---------|
| **Enable Safety Checks** | Perform safety checks before remediation | Enabled |
| **Business Hours Start Time** | When business hours begin (0-23) | 9 (9 AM) |
| **Business Hours End Time** | When business hours end (0-23) | 18 (6 PM) |
| **Maximum Remediations Per Day** | Limit remediation attempts | 5 |

## Common Scenarios

### Scenario 1: Enable All Modules for All Computers

1. Create a new GPO: "Self-Healing Agent - All Modules"
2. Link to the domain or target OU
3. Configure the following policies:
   - **Enable Self-Healing Agent**: Enabled
   - **Enable Network Repair Module**: Enabled
   - **Enable Printer Repair Module**: Enabled
   - **Enable Disk Cleanup Module**: Enabled
   - **Enable Service Repair Module**: Enabled
   - **Enable Safety Checks**: Enabled

### Scenario 2: Network and Printer Only for Workstations

1. Create a new GPO: "Self-Healing Agent - Workstations"
2. Link to the Workstations OU
3. Configure the following policies:
   - **Enable Self-Healing Agent**: Enabled
   - **Enable Network Repair Module**: Enabled
   - **Enable Printer Repair Module**: Enabled
   - **Enable Disk Cleanup Module**: Disabled
   - **Enable Service Repair Module**: Disabled

### Scenario 3: Aggressive Cleanup for Servers

1. Create a new GPO: "Self-Healing Agent - Servers"
2. Link to the Servers OU
3. Configure the following policies:
   - **Enable Self-Healing Agent**: Enabled
   - **Enable Disk Cleanup Module**: Enabled
   - **Disk Cleanup Threshold (GB)**: 20
   - **Business Hours Start Time**: 0 (midnight)
   - **Business Hours End Time**: 6 (6 AM)
   - **Enable Safety Checks**: Disabled (for servers with no users)

### Scenario 4: Test Mode (Detection Only)

1. Create a new GPO: "Self-Healing Agent - Test Mode"
2. Link to a test OU
3. Configure the following policies:
   - **Enable Self-Healing Agent**: Enabled
   - **Enable Network Repair Module**: Disabled
   - **Enable Printer Repair Module**: Disabled
   - **Enable Disk Cleanup Module**: Disabled
   - **Enable Service Repair Module**: Disabled

This will allow detection but prevent automatic remediation.

## Registry Keys

The Group Policy settings are stored in the following registry location:

```
HKEY_LOCAL_MACHINE\Software\Policies\SelfHealingAgent
```

### Registry Values

| Value Name | Type | Description |
|------------|------|-------------|
| `Enabled` | DWORD | 1 = Enabled, 0 = Disabled |
| `CheckIntervalHours` | DWORD | Hours between checks |
| `MaxLogAgeDays` | DWORD | Log retention period |
| `MaxRemediationsPerDay` | DWORD | Maximum remediation attempts |
| `BusinessHoursStart` | DWORD | Business hours start (0-23) |
| `BusinessHoursEnd` | DWORD | Business hours end (0-23) |
| `DiskCleanupThresholdGB` | DWORD | Disk cleanup threshold |
| `EnableSafetyChecks` | DWORD | 1 = Enabled, 0 = Disabled |

### Module Registry Keys

Module settings are stored under:

```
HKEY_LOCAL_MACHINE\Software\Policies\SelfHealingAgent\Modules
```

| Value Name | Type | Description |
|------------|------|-------------|
| `NetworkEnabled` | DWORD | 1 = Enabled, 0 = Disabled |
| `PrinterEnabled` | DWORD | 1 = Enabled, 0 = Disabled |
| `DiskEnabled` | DWORD | 1 = Enabled, 0 = Disabled |
| `ServiceEnabled` | DWORD | 1 = Enabled, 0 = Disabled |

## Updating the Agent to Read Group Policy

To make the agent read Group Policy settings, add this function to your modules:

```powershell
function Get-PolicySetting {
    param(
        [string]$ValueName,
        $DefaultValue
    )
    
    $policyPath = "HKLM:\Software\Policies\SelfHealingAgent"
    
    try {
        if (Test-Path $policyPath) {
            $value = Get-ItemProperty -Path $policyPath -Name $ValueName -ErrorAction SilentlyContinue
            if ($null -ne $value.$ValueName) {
                return $value.$ValueName
            }
        }
    }
    catch {
        # Policy not set, use default
    }
    
    return $DefaultValue
}

# Example usage:
$isEnabled = Get-PolicySetting -ValueName "Enabled" -DefaultValue 1
$maxRemediations = Get-PolicySetting -ValueName "MaxRemediationsPerDay" -DefaultValue 5
```

## Verification

### Verify Policy Application

1. On a target computer, run:
   ```powershell
   gpupdate /force
   ```

2. Check the registry:
   ```powershell
   Get-ItemProperty -Path "HKLM:\Software\Policies\SelfHealingAgent"
   ```

3. View applied policies:
   ```powershell
   gpresult /h gpresult.html
   ```
   Open the HTML file and search for "Self-Healing Agent"

### Verify Agent Behavior

1. Check the agent log:
   ```powershell
   Get-Content "C:\Program Files\SelfHealingAgent\Logs\Execution_$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 50
   ```

2. Run the agent manually:
   ```powershell
   & "C:\Program Files\SelfHealingAgent\Scripts\Start-SelfHealingAgent.ps1" -TestOnly
   ```

## Troubleshooting

### Policy Not Applying

1. **Check GPO link**: Ensure the GPO is linked to the correct OU
2. **Check security filtering**: Verify the computer account has Read and Apply permissions
3. **Force update**: Run `gpupdate /force` on the target computer
4. **Check inheritance**: Ensure GPO inheritance is not blocked
5. **Review event logs**: Check Group Policy event logs for errors

### Agent Not Respecting Policy

1. **Verify registry keys**: Check that policy values are written to the registry
2. **Check agent version**: Ensure the agent is configured to read Group Policy settings
3. **Review agent logs**: Look for policy-related messages in the agent logs
4. **Test manually**: Set registry values manually to test agent behavior

### Policy Conflicts

If multiple GPOs configure the same setting:
- The last applied GPO wins (based on GPO precedence)
- Use GPO link order and enforcement to control precedence
- Use `gpresult /h` to see which GPO is winning

## Best Practices

1. **Test First**: Deploy to a test OU before production
2. **Use Security Filtering**: Target specific computer groups
3. **Document Changes**: Keep track of GPO modifications
4. **Monitor Logs**: Regularly review agent logs for issues
5. **Gradual Rollout**: Deploy to small groups first, then expand
6. **Backup GPOs**: Export GPOs before making changes
7. **Use Descriptive Names**: Name GPOs clearly (e.g., "Self-Healing Agent - Workstations")

## Reporting

### Generate Policy Report

```powershell
# Export GPO settings
Get-GPOReport -Name "Self-Healing Agent" -ReportType HTML -Path "C:\Reports\SelfHealingAgent-GPO.html"

# Check which computers have the policy applied
Get-ADComputer -Filter * -Properties * | 
    Where-Object { $_.DistinguishedName -like "*OU=Workstations*" } | 
    Select-Object Name, OperatingSystem, LastLogonDate
```

### Monitor Agent Deployment

```powershell
# Check registry on remote computers
$computers = Get-ADComputer -Filter * -SearchBase "OU=Workstations,DC=domain,DC=com"

foreach ($computer in $computers) {
    $result = Invoke-Command -ComputerName $computer.Name -ScriptBlock {
        Get-ItemProperty -Path "HKLM:\Software\Policies\SelfHealingAgent" -ErrorAction SilentlyContinue
    }
    
    [PSCustomObject]@{
        ComputerName = $computer.Name
        AgentEnabled = $result.Enabled
        LastCheck = $result.LastCheckTime
    }
}
```

## Support

For issues with Group Policy deployment:
1. Review the Group Policy event logs
2. Use `gpresult /h` to diagnose policy application
3. Check the agent logs for policy-related messages
4. Verify registry keys are being set correctly

## Additional Resources

- [Group Policy Management Console](https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/dn265969(v=ws.11))
- [ADMX Template Reference](https://docs.microsoft.com/en-us/windows/client-management/mdm/understanding-admx-backed-policies)
- [Group Policy Troubleshooting](https://docs.microsoft.com/en-us/troubleshoot/windows-server/group-policy/applying-group-policy-troubleshooting-guidance)

---

**Enterprise-ready Group Policy management for the Self-Healing Agent**
