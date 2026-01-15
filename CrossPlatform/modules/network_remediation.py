#!/usr/bin/env python3
"""
Cross-Platform Network Remediation Module
Fixes network connectivity issues on Windows, macOS, and Linux
"""

import subprocess
import sys
import time
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

class NetworkRemediator:
    """Cross-platform network connectivity remediation"""
    
    def __init__(self):
        self.platform = platform_detector
        self.logger = get_logger()
        self.actions_taken = []
        self.success = False
    
    def flush_dns_cache(self):
        """Flush DNS cache (platform-specific)"""
        self.logger.info("Flushing DNS cache", 
                        component="NetworkFix", operation="FlushDNS")
        
        try:
            if self.platform.is_windows():
                subprocess.run(['ipconfig', '/flushdns'], 
                             capture_output=True, timeout=30, check=True)
            elif self.platform.is_macos():
                subprocess.run(['sudo', 'dscacheutil', '-flushcache'], 
                             capture_output=True, timeout=30, check=True)
                subprocess.run(['sudo', 'killall', '-HUP', 'mDNSResponder'], 
                             capture_output=True, timeout=30, check=False)
            elif self.platform.is_linux():
                # Try systemd-resolved first
                result = subprocess.run(['sudo', 'systemd-resolve', '--flush-caches'], 
                                      capture_output=True, timeout=30)
                if result.returncode != 0:
                    # Try nscd
                    subprocess.run(['sudo', 'systemctl', 'restart', 'nscd'], 
                                 capture_output=True, timeout=30, check=False)
            
            self.actions_taken.append("Flushed DNS cache")
            self.logger.info("DNS cache flushed successfully", 
                           component="NetworkFix", operation="FlushDNS")
            return True
        
        except subprocess.TimeoutExpired:
            self.logger.error("DNS flush timed out", 
                            component="NetworkFix", operation="FlushDNS")
            return False
        except Exception as e:
            self.logger.error(f"Failed to flush DNS cache: {e}", 
                            component="NetworkFix", operation="FlushDNS")
            return False
    
    def renew_dhcp_lease(self):
        """Renew DHCP lease (platform-specific)"""
        self.logger.info("Renewing DHCP lease", 
                        component="NetworkFix", operation="RenewDHCP")
        
        try:
            if self.platform.is_windows():
                subprocess.run(['ipconfig', '/release'], 
                             capture_output=True, timeout=30, check=True)
                time.sleep(2)
                subprocess.run(['ipconfig', '/renew'], 
                             capture_output=True, timeout=30, check=True)
            
            elif self.platform.is_macos():
                # Get active interface
                result = subprocess.run(['route', '-n', 'get', 'default'], 
                                      capture_output=True, text=True, timeout=10)
                interface = None
                for line in result.stdout.split('\n'):
                    if 'interface:' in line:
                        interface = line.split(':')[1].strip()
                        break
                
                if interface:
                    subprocess.run(['sudo', 'ipconfig', 'set', interface, 'DHCP'], 
                                 capture_output=True, timeout=30, check=True)
            
            elif self.platform.is_linux():
                subprocess.run(['sudo', 'dhclient', '-r'], 
                             capture_output=True, timeout=30, check=False)
                time.sleep(2)
                subprocess.run(['sudo', 'dhclient'], 
                             capture_output=True, timeout=30, check=True)
            
            self.actions_taken.append("Renewed DHCP lease")
            self.logger.info("DHCP lease renewed successfully", 
                           component="NetworkFix", operation="RenewDHCP")
            return True
        
        except subprocess.TimeoutExpired:
            self.logger.error("DHCP renewal timed out", 
                            component="NetworkFix", operation="RenewDHCP")
            return False
        except Exception as e:
            self.logger.error(f"Failed to renew DHCP lease: {e}", 
                            component="NetworkFix", operation="RenewDHCP")
            return False
    
    def restart_network_service(self):
        """Restart network service (platform-specific)"""
        self.logger.info("Restarting network service", 
                        component="NetworkFix", operation="RestartService")
        
        try:
            if self.platform.is_windows():
                # Restart DNS client and DHCP client
                services = ['Dnscache', 'Dhcp']
                for service in services:
                    subprocess.run(['net', 'stop', service], 
                                 capture_output=True, timeout=30, check=False)
                    time.sleep(1)
                    subprocess.run(['net', 'start', service], 
                                 capture_output=True, timeout=30, check=True)
            
            elif self.platform.is_macos():
                # Restart network interfaces
                subprocess.run(['sudo', 'ifconfig', 'en0', 'down'], 
                             capture_output=True, timeout=10, check=False)
                time.sleep(2)
                subprocess.run(['sudo', 'ifconfig', 'en0', 'up'], 
                             capture_output=True, timeout=10, check=True)
            
            elif self.platform.is_linux():
                # Try NetworkManager first
                result = subprocess.run(['sudo', 'systemctl', 'restart', 'NetworkManager'], 
                                      capture_output=True, timeout=30)
                if result.returncode != 0:
                    # Try networking service
                    subprocess.run(['sudo', 'systemctl', 'restart', 'networking'], 
                                 capture_output=True, timeout=30, check=True)
            
            self.actions_taken.append("Restarted network service")
            self.logger.info("Network service restarted successfully", 
                           component="NetworkFix", operation="RestartService")
            return True
        
        except subprocess.TimeoutExpired:
            self.logger.error("Network service restart timed out", 
                            component="NetworkFix", operation="RestartService")
            return False
        except Exception as e:
            self.logger.error(f"Failed to restart network service: {e}", 
                            component="NetworkFix", operation="RestartService")
            return False
    
    def reset_network_adapter(self, adapter_name=None):
        """Reset network adapter (platform-specific)"""
        self.logger.info(f"Resetting network adapter: {adapter_name or 'default'}", 
                        component="NetworkFix", operation="ResetAdapter")
        
        try:
            if self.platform.is_windows():
                if adapter_name:
                    subprocess.run(['netsh', 'interface', 'set', 'interface', 
                                  adapter_name, 'disabled'], 
                                 capture_output=True, timeout=10, check=True)
                    time.sleep(2)
                    subprocess.run(['netsh', 'interface', 'set', 'interface', 
                                  adapter_name, 'enabled'], 
                                 capture_output=True, timeout=10, check=True)
                else:
                    # Reset all adapters
                    subprocess.run(['netsh', 'winsock', 'reset'], 
                                 capture_output=True, timeout=30, check=True)
                    subprocess.run(['netsh', 'int', 'ip', 'reset'], 
                                 capture_output=True, timeout=30, check=True)
            
            elif self.platform.is_macos() or self.platform.is_linux():
                interface = adapter_name or 'en0' if self.platform.is_macos() else 'eth0'
                subprocess.run(['sudo', 'ifconfig', interface, 'down'], 
                             capture_output=True, timeout=10, check=False)
                time.sleep(2)
                subprocess.run(['sudo', 'ifconfig', interface, 'up'], 
                             capture_output=True, timeout=10, check=True)
            
            self.actions_taken.append(f"Reset network adapter: {adapter_name or 'default'}")
            self.logger.info("Network adapter reset successfully", 
                           component="NetworkFix", operation="ResetAdapter")
            return True
        
        except subprocess.TimeoutExpired:
            self.logger.error("Network adapter reset timed out", 
                            component="NetworkFix", operation="ResetAdapter")
            return False
        except Exception as e:
            self.logger.error(f"Failed to reset network adapter: {e}", 
                            component="NetworkFix", operation="ResetAdapter")
            return False
    
    def run_remediation(self, issues):
        """Run remediation based on detected issues"""
        self.logger.info(f"Starting network remediation with {len(issues)} issue(s)", 
                        component="NetworkFix", operation="RunRemediation")
        
        self.actions_taken = []
        remediation_success = False
        
        # Analyze issues and apply fixes
        has_dns_issue = any('DNS' in issue or 'resolution' in issue for issue in issues)
        has_connectivity_issue = any('internet' in issue.lower() or 'connectivity' in issue.lower() for issue in issues)
        has_gateway_issue = any('gateway' in issue.lower() for issue in issues)
        
        try:
            # Step 1: Flush DNS if DNS issues detected
            if has_dns_issue:
                self.flush_dns_cache()
                time.sleep(2)
            
            # Step 2: Renew DHCP lease if connectivity or gateway issues
            if has_connectivity_issue or has_gateway_issue:
                self.renew_dhcp_lease()
                time.sleep(3)
            
            # Step 3: Restart network service if still having issues
            if has_connectivity_issue:
                self.restart_network_service()
                time.sleep(3)
            
            # Step 4: Reset adapter as last resort (only if critical)
            if has_connectivity_issue and len(issues) > 2:
                self.reset_network_adapter()
                time.sleep(5)
            
            remediation_success = len(self.actions_taken) > 0
            
        except Exception as e:
            self.logger.error(f"Remediation failed: {e}", 
                            component="NetworkFix", operation="RunRemediation")
            remediation_success = False
        
        self.logger.info(f"Network remediation completed. Actions taken: {len(self.actions_taken)}", 
                        component="NetworkFix", operation="RunRemediation")
        
        return {
            'success': remediation_success,
            'actions_taken': self.actions_taken,
            'action_count': len(self.actions_taken)
        }

if __name__ == "__main__":
    # Test the network remediator
    remediator = NetworkRemediator()
    test_issues = ["No internet connectivity detected", "DNS resolution failed"]
    result = remediator.run_remediation(test_issues)
    
    print("\n" + "="*50)
    print("Network Remediation Results")
    print("="*50)
    print(f"Success: {result['success']}")
    print(f"Actions Taken: {result['action_count']}")
    print(f"\nActions:")
    for action in result['actions_taken']:
        print(f"  - {action}")
