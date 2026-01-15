#!/usr/bin/env python3
"""
Cross-Platform Service Remediation Module
Restarts and repairs critical services on Windows, macOS, and Linux
"""

import subprocess
import sys
import time
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

class ServiceRemediator:
    """Cross-platform service remediation"""
    
    def __init__(self):
        self.platform = platform_detector
        self.logger = get_logger()
        self.actions_taken = []
    
    def restart_service(self, service_name):
        """Restart a service (platform-specific)"""
        self.logger.info(f"Restarting service: {service_name}", 
                        component="ServiceFix", operation="RestartService")
        
        try:
            if self.platform.is_windows():
                # Stop service
                subprocess.run(['net', 'stop', service_name], 
                             capture_output=True, timeout=30, check=False)
                time.sleep(2)
                
                # Start service
                result = subprocess.run(['net', 'start', service_name], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Restarted service: {service_name}")
                    self.logger.info(f"Service {service_name} restarted successfully", 
                                   component="ServiceFix", operation="RestartService")
                    return True
            
            elif self.platform.is_macos():
                # Try launchctl first
                result = subprocess.run(['sudo', 'launchctl', 'kickstart', '-k', 
                                       f'system/{service_name}'], 
                                      capture_output=True, timeout=30)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Restarted service: {service_name}")
                    self.logger.info(f"Service {service_name} restarted successfully", 
                                   component="ServiceFix", operation="RestartService")
                    return True
            
            elif self.platform.is_linux():
                # Use systemctl
                result = subprocess.run(['sudo', 'systemctl', 'restart', service_name], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Restarted service: {service_name}")
                    self.logger.info(f"Service {service_name} restarted successfully", 
                                   component="ServiceFix", operation="RestartService")
                    return True
            
            return False
        
        except subprocess.TimeoutExpired:
            self.logger.error(f"Service restart timed out: {service_name}", 
                            component="ServiceFix", operation="RestartService")
            return False
        except Exception as e:
            self.logger.error(f"Failed to restart service {service_name}: {e}", 
                            component="ServiceFix", operation="RestartService")
            return False
    
    def enable_service(self, service_name):
        """Enable a service to start automatically"""
        self.logger.info(f"Enabling service: {service_name}", 
                        component="ServiceFix", operation="EnableService")
        
        try:
            if self.platform.is_windows():
                result = subprocess.run(['sc', 'config', service_name, 'start=', 'auto'], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Enabled auto-start for service: {service_name}")
                    self.logger.info(f"Service {service_name} enabled successfully", 
                                   component="ServiceFix", operation="EnableService")
                    return True
            
            elif self.platform.is_linux():
                result = subprocess.run(['sudo', 'systemctl', 'enable', service_name], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Enabled service: {service_name}")
                    self.logger.info(f"Service {service_name} enabled successfully", 
                                   component="ServiceFix", operation="EnableService")
                    return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to enable service {service_name}: {e}", 
                            component="ServiceFix", operation="EnableService")
            return False
    
    def start_service(self, service_name):
        """Start a stopped service"""
        self.logger.info(f"Starting service: {service_name}", 
                        component="ServiceFix", operation="StartService")
        
        try:
            if self.platform.is_windows():
                result = subprocess.run(['net', 'start', service_name], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Started service: {service_name}")
                    self.logger.info(f"Service {service_name} started successfully", 
                                   component="ServiceFix", operation="StartService")
                    return True
            
            elif self.platform.is_macos():
                result = subprocess.run(['sudo', 'launchctl', 'start', service_name], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Started service: {service_name}")
                    self.logger.info(f"Service {service_name} started successfully", 
                                   component="ServiceFix", operation="StartService")
                    return True
            
            elif self.platform.is_linux():
                result = subprocess.run(['sudo', 'systemctl', 'start', service_name], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append(f"Started service: {service_name}")
                    self.logger.info(f"Service {service_name} started successfully", 
                                   component="ServiceFix", operation="StartService")
                    return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to start service {service_name}: {e}", 
                            component="ServiceFix", operation="StartService")
            return False
    
    def fix_print_spooler(self):
        """Fix print spooler service"""
        self.logger.info("Fixing print spooler service", 
                        component="ServiceFix", operation="FixSpooler")
        
        try:
            if self.platform.is_windows():
                # Stop spooler
                subprocess.run(['net', 'stop', 'Spooler'], 
                             capture_output=True, timeout=30, check=False)
                time.sleep(2)
                
                # Clear print queue
                import os
                spool_dir = 'C:\\Windows\\System32\\spool\\PRINTERS'
                if os.path.exists(spool_dir):
                    for file in os.listdir(spool_dir):
                        try:
                            os.remove(os.path.join(spool_dir, file))
                        except:
                            pass
                
                # Start spooler
                subprocess.run(['net', 'start', 'Spooler'], 
                             capture_output=True, timeout=30, check=True)
                
                self.actions_taken.append("Fixed print spooler (cleared queue and restarted)")
                self.logger.info("Print spooler fixed successfully", 
                               component="ServiceFix", operation="FixSpooler")
                return True
            
            elif self.platform.is_macos():
                # Reset CUPS
                subprocess.run(['sudo', 'launchctl', 'stop', 'org.cups.cupsd'], 
                             capture_output=True, timeout=30, check=False)
                time.sleep(2)
                subprocess.run(['sudo', 'launchctl', 'start', 'org.cups.cupsd'], 
                             capture_output=True, timeout=30, check=True)
                
                self.actions_taken.append("Restarted CUPS printing service")
                return True
            
            elif self.platform.is_linux():
                # Restart CUPS
                subprocess.run(['sudo', 'systemctl', 'restart', 'cups'], 
                             capture_output=True, timeout=30, check=True)
                
                self.actions_taken.append("Restarted CUPS printing service")
                return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to fix print spooler: {e}", 
                            component="ServiceFix", operation="FixSpooler")
            return False
    
    def run_remediation(self, issues):
        """Run service remediation based on detected issues"""
        self.logger.info(f"Starting service remediation with {len(issues)} issue(s)", 
                        component="ServiceFix", operation="RunRemediation")
        
        self.actions_taken = []
        
        try:
            # Parse issues and fix services
            for issue in issues:
                issue_lower = issue.lower()
                
                # Print spooler issues
                if 'spooler' in issue_lower or 'print' in issue_lower:
                    self.fix_print_spooler()
                
                # DHCP client issues
                elif 'dhcp' in issue_lower:
                    if self.platform.is_windows():
                        self.restart_service('Dhcp')
                    elif self.platform.is_linux():
                        self.restart_service('dhclient')
                
                # DNS client issues
                elif 'dns' in issue_lower:
                    if self.platform.is_windows():
                        self.restart_service('Dnscache')
                    elif self.platform.is_linux():
                        self.restart_service('systemd-resolved')
                
                # Windows Update issues
                elif 'update' in issue_lower or 'wuauserv' in issue_lower:
                    if self.platform.is_windows():
                        self.restart_service('wuauserv')
                
                # Windows Defender issues
                elif 'defender' in issue_lower or 'windefend' in issue_lower:
                    if self.platform.is_windows():
                        self.restart_service('WinDefend')
                
                # SSH service issues
                elif 'ssh' in issue_lower:
                    if self.platform.is_windows():
                        self.restart_service('sshd')
                    elif self.platform.is_linux():
                        self.restart_service('ssh')
                
                # Generic service restart (extract service name from issue)
                elif 'stopped' in issue_lower or 'not running' in issue_lower:
                    # Try to extract service name
                    parts = issue.split()
                    for i, part in enumerate(parts):
                        if part.lower() in ['service', 'stopped', 'not']:
                            if i > 0:
                                service_name = parts[i-1].strip(':,.')
                                self.restart_service(service_name)
                                break
            
            remediation_success = len(self.actions_taken) > 0
            
        except Exception as e:
            self.logger.error(f"Service remediation failed: {e}", 
                            component="ServiceFix", operation="RunRemediation")
            remediation_success = False
        
        self.logger.info(f"Service remediation completed. Actions taken: {len(self.actions_taken)}", 
                        component="ServiceFix", operation="RunRemediation")
        
        return {
            'success': remediation_success,
            'actions_taken': self.actions_taken,
            'action_count': len(self.actions_taken)
        }

if __name__ == "__main__":
    # Test the service remediator
    remediator = ServiceRemediator()
    test_issues = ["Print Spooler service is not running", "DHCP Client service stopped"]
    result = remediator.run_remediation(test_issues)
    
    print("\n" + "="*50)
    print("Service Remediation Results")
    print("="*50)
    print(f"Success: {result['success']}")
    print(f"Actions Taken: {result['action_count']}")
    print(f"\nActions:")
    for action in result['actions_taken']:
        print(f"  - {action}")
