#!/usr/bin/env python3
"""
Cross-Platform Service Detection Module
Detects service/daemon issues on Windows, macOS, and Linux
"""

import sys
import subprocess
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

try:
    import psutil
except ImportError:
    psutil = None

class ServiceDetector:
    """Cross-platform service/daemon detection"""
    
    def __init__(self):
        self.platform = platform_detector
        self.logger = get_logger()
        self.issues = []
        self.critical_services = self._get_critical_services()
    
    def _get_critical_services(self):
        """Get platform-specific critical services"""
        if self.platform.is_windows():
            return [
                {'name': 'Spooler', 'display': 'Print Spooler'},
                {'name': 'Dhcp', 'display': 'DHCP Client'},
                {'name': 'Dnscache', 'display': 'DNS Client'},
                {'name': 'WinDefend', 'display': 'Windows Defender'},
                {'name': 'wuauserv', 'display': 'Windows Update'}
            ]
        elif self.platform.is_macos():
            return [
                {'name': 'com.apple.mDNSResponder', 'display': 'mDNSResponder'},
                {'name': 'com.apple.networkd', 'display': 'Network Daemon'},
                {'name': 'org.cups.cupsd', 'display': 'CUPS Print Service'}
            ]
        else:  # Linux
            return [
                {'name': 'NetworkManager', 'display': 'Network Manager'},
                {'name': 'systemd-resolved', 'display': 'DNS Resolver'},
                {'name': 'cups', 'display': 'CUPS Print Service'},
                {'name': 'ssh', 'display': 'SSH Service'}
            ]
    
    def check_service_windows(self, service_name):
        """Check Windows service status"""
        try:
            result = subprocess.run(
                ['sc', 'query', service_name],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                output = result.stdout
                if 'RUNNING' in output:
                    return 'running'
                elif 'STOPPED' in output:
                    return 'stopped'
                else:
                    return 'unknown'
            else:
                return 'not_found'
        except Exception as e:
            self.logger.error(f"Failed to check Windows service {service_name}: {e}")
            return 'error'
    
    def check_service_macos(self, service_name):
        """Check macOS service (launchd) status"""
        try:
            result = subprocess.run(
                ['launchctl', 'list', service_name],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                return 'running'
            else:
                return 'stopped'
        except Exception as e:
            self.logger.error(f"Failed to check macOS service {service_name}: {e}")
            return 'error'
    
    def check_service_linux(self, service_name):
        """Check Linux service (systemd) status"""
        try:
            result = subprocess.run(
                ['systemctl', 'is-active', service_name],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            status = result.stdout.strip()
            if status == 'active':
                return 'running'
            elif status == 'inactive':
                return 'stopped'
            else:
                return status
        except Exception as e:
            self.logger.error(f"Failed to check Linux service {service_name}: {e}")
            return 'error'
    
    def check_service(self, service_name):
        """Check service status (platform-agnostic)"""
        if self.platform.is_windows():
            return self.check_service_windows(service_name)
        elif self.platform.is_macos():
            return self.check_service_macos(service_name)
        else:
            return self.check_service_linux(service_name)
    
    def run_detection(self):
        """Run service detection"""
        self.logger.info("Starting critical services detection", 
                        component="ServiceDetect", operation="RunDetection")
        
        self.issues = []
        service_details = []
        checked_count = 0
        
        for service in self.critical_services:
            self.logger.info(f"Checking service: {service['name']}", 
                           component="ServiceDetect", operation="RunDetection")
            
            status = self.check_service(service['name'])
            checked_count += 1
            
            service_info = {
                'name': service['name'],
                'display_name': service['display'],
                'status': status
            }
            service_details.append(service_info)
            
            if status == 'running':
                self.logger.info(f"Service OK: {service['name']} is running", 
                               component="ServiceDetect", operation="RunDetection")
            elif status == 'stopped':
                issue = f"Service '{service['display']}' ({service['name']}) is stopped"
                self.issues.append(issue)
                self.logger.warning(issue, component="ServiceDetect", operation="RunDetection")
            elif status == 'not_found':
                self.logger.info(f"Service not found: {service['name']} (may not be installed)", 
                               component="ServiceDetect", operation="RunDetection")
            else:
                self.logger.warning(f"Service {service['name']} has unexpected status: {status}", 
                                  component="ServiceDetect", operation="RunDetection")
        
        self.logger.info(f"Service detection completed. Issues found: {len(self.issues)} / {checked_count} services checked", 
                        component="ServiceDetect", operation="RunDetection")
        
        return {
            'has_issues': len(self.issues) > 0,
            'issues': self.issues,
            'issue_count': len(self.issues),
            'services_checked': checked_count,
            'service_details': service_details
        }

if __name__ == "__main__":
    # Test the service detector
    detector = ServiceDetector()
    result = detector.run_detection()
    
    print("\n" + "="*50)
    print("Service Detection Results")
    print("="*50)
    print(f"Has Issues: {result['has_issues']}")
    print(f"Services Checked: {result['services_checked']}")
    print(f"Issue Count: {result['issue_count']}")
    print(f"\nIssues:")
    for issue in result['issues']:
        print(f"  - {issue}")
    print(f"\nServices:")
    for service in result['service_details']:
        print(f"  - {service['display_name']}: {service['status']}")
