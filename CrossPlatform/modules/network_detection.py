#!/usr/bin/env python3
"""
Cross-Platform Network Detection Module
Detects network connectivity issues on Windows, macOS, and Linux
"""

import socket
import subprocess
import platform
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

class NetworkDetector:
    """Cross-platform network connectivity detection"""
    
    def __init__(self):
        self.platform = platform_detector
        self.logger = get_logger()
        self.issues = []
    
    def test_internet_connectivity(self, host="8.8.8.8", port=53, timeout=5):
        """Test internet connectivity by connecting to a reliable host"""
        self.logger.info(f"Testing internet connectivity to {host}:{port}", 
                        component="NetworkDetect", operation="InternetTest")
        
        try:
            socket.setdefaulttimeout(timeout)
            socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
            self.logger.info("Internet connectivity test passed", 
                           component="NetworkDetect", operation="InternetTest")
            return True
        except socket.error as e:
            self.issues.append(f"No internet connectivity detected: {str(e)}")
            self.logger.warning(f"Internet connectivity test failed: {e}", 
                              component="NetworkDetect", operation="InternetTest")
            return False
    
    def test_dns_resolution(self, hostname="google.com"):
        """Test DNS resolution"""
        self.logger.info(f"Testing DNS resolution for {hostname}", 
                        component="NetworkDetect", operation="DNSTest")
        
        try:
            socket.gethostbyname(hostname)
            self.logger.info("DNS resolution test passed", 
                           component="NetworkDetect", operation="DNSTest")
            return True
        except socket.gaierror as e:
            self.issues.append(f"DNS resolution failed for {hostname}: {str(e)}")
            self.logger.warning(f"DNS resolution failed: {e}", 
                              component="NetworkDetect", operation="DNSTest")
            return False
    
    def get_network_interfaces(self):
        """Get network interfaces (platform-specific)"""
        self.logger.info("Checking network interfaces", 
                        component="NetworkDetect", operation="InterfaceCheck")
        
        interfaces = []
        
        try:
            if self.platform.is_windows():
                interfaces = self._get_windows_interfaces()
            elif self.platform.is_macos():
                interfaces = self._get_macos_interfaces()
            elif self.platform.is_linux():
                interfaces = self._get_linux_interfaces()
        except Exception as e:
            self.logger.error(f"Failed to get network interfaces: {e}", 
                            component="NetworkDetect", operation="InterfaceCheck")
        
        return interfaces
    
    def _get_windows_interfaces(self):
        """Get Windows network interfaces"""
        interfaces = []
        try:
            result = subprocess.run(['ipconfig', '/all'], 
                                  capture_output=True, text=True, timeout=10)
            # Parse ipconfig output
            current_adapter = None
            for line in result.stdout.split('\n'):
                line = line.strip()
                if 'adapter' in line.lower() and ':' in line:
                    current_adapter = line.split(':')[0].strip()
                elif 'IPv4 Address' in line and current_adapter:
                    ip = line.split(':')[1].strip()
                    interfaces.append({'name': current_adapter, 'ip': ip, 'status': 'up'})
        except Exception as e:
            self.logger.error(f"Windows interface detection failed: {e}")
        
        return interfaces
    
    def _get_macos_interfaces(self):
        """Get macOS network interfaces"""
        interfaces = []
        try:
            result = subprocess.run(['ifconfig'], 
                                  capture_output=True, text=True, timeout=10)
            # Parse ifconfig output
            current_interface = None
            for line in result.stdout.split('\n'):
                if line and not line.startswith('\t') and not line.startswith(' '):
                    current_interface = line.split(':')[0]
                elif 'inet ' in line and current_interface:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        ip = parts[1]
                        interfaces.append({'name': current_interface, 'ip': ip, 'status': 'up'})
        except Exception as e:
            self.logger.error(f"macOS interface detection failed: {e}")
        
        return interfaces
    
    def _get_linux_interfaces(self):
        """Get Linux network interfaces"""
        interfaces = []
        try:
            result = subprocess.run(['ip', 'addr', 'show'], 
                                  capture_output=True, text=True, timeout=10)
            # Parse ip addr output
            current_interface = None
            for line in result.stdout.split('\n'):
                if ': ' in line and not line.startswith(' '):
                    parts = line.split(': ')
                    if len(parts) >= 2:
                        current_interface = parts[1].split('@')[0]
                elif 'inet ' in line and current_interface:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        ip = parts[1].split('/')[0]
                        interfaces.append({'name': current_interface, 'ip': ip, 'status': 'up'})
        except Exception as e:
            self.logger.error(f"Linux interface detection failed: {e}")
        
        return interfaces
    
    def test_gateway_reachability(self):
        """Test default gateway reachability"""
        self.logger.info("Testing default gateway reachability", 
                        component="NetworkDetect", operation="GatewayTest")
        
        gateway = self._get_default_gateway()
        if not gateway:
            self.issues.append("No default gateway configured")
            return False
        
        # Ping gateway
        try:
            if self.platform.is_windows():
                result = subprocess.run(['ping', '-n', '2', gateway], 
                                      capture_output=True, timeout=10)
            else:
                result = subprocess.run(['ping', '-c', '2', gateway], 
                                      capture_output=True, timeout=10)
            
            if result.returncode == 0:
                self.logger.info(f"Gateway {gateway} is reachable", 
                               component="NetworkDetect", operation="GatewayTest")
                return True
            else:
                self.issues.append(f"Default gateway {gateway} is unreachable")
                self.logger.warning(f"Gateway {gateway} is unreachable", 
                                  component="NetworkDetect", operation="GatewayTest")
                return False
        except Exception as e:
            self.logger.error(f"Gateway test failed: {e}", 
                            component="NetworkDetect", operation="GatewayTest")
            return False
    
    def _get_default_gateway(self):
        """Get default gateway (platform-specific)"""
        try:
            if self.platform.is_windows():
                result = subprocess.run(['route', 'print', '0.0.0.0'], 
                                      capture_output=True, text=True, timeout=10)
                for line in result.stdout.split('\n'):
                    if '0.0.0.0' in line:
                        parts = line.split()
                        if len(parts) >= 3:
                            return parts[2]
            
            elif self.platform.is_macos():
                result = subprocess.run(['route', '-n', 'get', 'default'], 
                                      capture_output=True, text=True, timeout=10)
                for line in result.stdout.split('\n'):
                    if 'gateway:' in line:
                        return line.split(':')[1].strip()
            
            elif self.platform.is_linux():
                result = subprocess.run(['ip', 'route', 'show', 'default'], 
                                      capture_output=True, text=True, timeout=10)
                parts = result.stdout.split()
                if len(parts) >= 3 and parts[0] == 'default':
                    return parts[2]
        
        except Exception as e:
            self.logger.error(f"Failed to get default gateway: {e}")
        
        return None
    
    def run_detection(self):
        """Run all network detection tests"""
        self.logger.info("Starting network connectivity detection", 
                        component="NetworkDetect", operation="RunDetection")
        
        self.issues = []
        
        # Run tests
        self.test_internet_connectivity()
        self.test_dns_resolution()
        self.test_gateway_reachability()
        
        # Check interfaces
        interfaces = self.get_network_interfaces()
        self.logger.info(f"Found {len(interfaces)} network interface(s)", 
                        component="NetworkDetect", operation="RunDetection")
        
        for interface in interfaces:
            self.logger.info(f"Interface: {interface['name']} - IP: {interface['ip']}", 
                           component="NetworkDetect", operation="RunDetection")
        
        self.logger.info(f"Network detection completed. Issues found: {len(self.issues)}", 
                        component="NetworkDetect", operation="RunDetection")
        
        return {
            'has_issues': len(self.issues) > 0,
            'issues': self.issues,
            'issue_count': len(self.issues),
            'interfaces': interfaces,
            'timestamp': str(platform.datetime.now()) if hasattr(platform, 'datetime') else None
        }

if __name__ == "__main__":
    # Test the network detector
    detector = NetworkDetector()
    result = detector.run_detection()
    
    print("\n" + "="*50)
    print("Network Detection Results")
    print("="*50)
    print(f"Has Issues: {result['has_issues']}")
    print(f"Issue Count: {result['issue_count']}")
    print(f"\nIssues:")
    for issue in result['issues']:
        print(f"  - {issue}")
    print(f"\nInterfaces:")
    for interface in result['interfaces']:
        print(f"  - {interface['name']}: {interface['ip']}")
