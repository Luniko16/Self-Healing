#!/usr/bin/env python3
"""
Software Inventory Module
Tracks installed applications and updates
"""

import subprocess
import platform
import json
from typing import List, Dict, Any
from datetime import datetime

class SoftwareInventory:
    """Manages software inventory and updates"""
    
    def __init__(self):
        self.platform = platform.system()
    
    def get_installed_software_windows(self) -> List[Dict[str, Any]]:
        """Get installed software on Windows"""
        software = []
        
        # Query registry for installed programs
        reg_paths = [
            r"HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall",
            r"HKLM\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
        ]
        
        for reg_path in reg_paths:
            try:
                cmd = f'reg query "{reg_path}" /s'
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
                
                # Parse registry output
                current_app = {}
                for line in result.stdout.split('\n'):
                    line = line.strip()
                    if line.startswith('HKEY'):
                        if current_app.get('DisplayName'):
                            software.append(current_app)
                        current_app = {}
                    elif 'DisplayName' in line and 'REG_SZ' in line:
                        current_app['name'] = line.split('REG_SZ')[-1].strip()
                    elif 'DisplayVersion' in line and 'REG_SZ' in line:
                        current_app['version'] = line.split('REG_SZ')[-1].strip()
                    elif 'Publisher' in line and 'REG_SZ' in line:
                        current_app['publisher'] = line.split('REG_SZ')[-1].strip()
                    elif 'InstallDate' in line and 'REG_SZ' in line:
                        current_app['install_date'] = line.split('REG_SZ')[-1].strip()
                
                if current_app.get('name'):
                    software.append(current_app)
                    
            except Exception as e:
                print(f"Error querying registry: {e}")
        
        return software
    
    def get_installed_software_linux(self) -> List[Dict[str, Any]]:
        """Get installed software on Linux"""
        software = []
        
        try:
            # Try dpkg (Debian/Ubuntu)
            result = subprocess.run(['dpkg', '-l'], capture_output=True, text=True, timeout=30)
            for line in result.stdout.split('\n')[5:]:  # Skip header
                parts = line.split()
                if len(parts) >= 3 and parts[0] == 'ii':
                    software.append({
                        'name': parts[1],
                        'version': parts[2],
                        'publisher': 'Unknown'
                    })
        except FileNotFoundError:
            pass
        
        if not software:
            try:
                # Try rpm (RedHat/CentOS)
                result = subprocess.run(['rpm', '-qa', '--queryformat', '%{NAME}|%{VERSION}|%{VENDOR}\n'],
                                      capture_output=True, text=True, timeout=30)
                for line in result.stdout.split('\n'):
                    if '|' in line:
                        name, version, vendor = line.split('|')
                        software.append({
                            'name': name,
                            'version': version,
                            'publisher': vendor
                        })
            except FileNotFoundError:
                pass
        
        return software
    
    def get_installed_software(self) -> List[Dict[str, Any]]:
        """Get installed software for current platform"""
        if self.platform == 'Windows':
            return self.get_installed_software_windows()
        elif self.platform == 'Linux':
            return self.get_installed_software_linux()
        else:
            return []
    
    def check_outdated_software(self) -> List[Dict[str, Any]]:
        """Check for outdated software (simplified)"""
        # This would integrate with update APIs in production
        outdated = []
        
        common_apps = {
            'Google Chrome': 'https://www.google.com/chrome/',
            'Mozilla Firefox': 'https://www.mozilla.org/firefox/',
            'Adobe Reader': 'https://get.adobe.com/reader/',
            '7-Zip': 'https://www.7-zip.org/',
            'VLC': 'https://www.videolan.org/'
        }
        
        installed = self.get_installed_software()
        
        for app in installed:
            app_name = app.get('name', '')
            for common_app in common_apps:
                if common_app.lower() in app_name.lower():
                    outdated.append({
                        'name': app_name,
                        'current_version': app.get('version', 'Unknown'),
                        'update_url': common_apps[common_app],
                        'severity': 'medium'
                    })
        
        return outdated
    
    def get_inventory_report(self) -> Dict[str, Any]:
        """Generate complete software inventory report"""
        software = self.get_installed_software()
        outdated = self.check_outdated_software()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'platform': self.platform,
            'total_installed': len(software),
            'outdated_count': len(outdated),
            'software': software[:50],  # Limit to 50 for performance
            'outdated': outdated
        }

if __name__ == '__main__':
    inventory = SoftwareInventory()
    print(json.dumps(inventory.get_inventory_report(), indent=2))
