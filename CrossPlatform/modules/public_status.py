#!/usr/bin/env python3
"""
Public Status Module
Provides simplified service status for public consumption
"""

import subprocess
import platform
import json
from typing import Dict, List, Any
from datetime import datetime

class PublicStatusProvider:
    """Provides public-facing service status"""
    
    def __init__(self):
        self.platform = platform.system()
    
    def get_service_status(self, service_name: str) -> Dict[str, Any]:
        """Get status of a Windows service"""
        try:
            ps_cmd = f"""
            Get-Service -Name '{service_name}' -ErrorAction SilentlyContinue | 
            Select-Object DisplayName, Status | ConvertTo-Json
            """
            
            result = subprocess.run(['powershell', '-Command', ps_cmd],
                                  capture_output=True, text=True, timeout=10)
            
            if result.stdout:
                data = json.loads(result.stdout)
                return {
                    'name': data.get('DisplayName', service_name),
                    'status': data.get('Status', 'Unknown'),
                    'operational': data.get('Status') == 'Running'
                }
        except Exception:
            pass
        
        return {'name': service_name, 'status': 'Unknown', 'operational': False}
    
    def get_network_status(self) -> Dict[str, Any]:
        """Check internet connectivity"""
        try:
            if self.platform == 'Windows':
                result = subprocess.run(['ping', '-n', '2', '8.8.8.8'],
                                      capture_output=True, timeout=10)
            else:
                result = subprocess.run(['ping', '-c', '2', '8.8.8.8'],
                                      capture_output=True, timeout=10)
            
            operational = result.returncode == 0
            return {
                'name': 'Internet Connectivity',
                'status': 'Connected' if operational else 'Disconnected',
                'type': 'Network',
                'operational': operational
            }
        except Exception:
            return {
                'name': 'Internet Connectivity',
                'status': 'Unable to check',
                'type': 'Network',
                'operational': False
            }
    
    def get_disk_status(self) -> List[Dict[str, Any]]:
        """Get disk space status"""
        disks = []
        
        try:
            ps_cmd = """
            Get-PSDrive -PSProvider FileSystem | 
            Where-Object {$_.Used -ne $null -and $_.Name -match '^[A-Z]$'} |
            Select-Object Name, 
                @{N='FreeGB';E={[math]::Round($_.Free/1GB,1)}},
                @{N='TotalGB';E={[math]::Round(($_.Used+$_.Free)/1GB,1)}},
                @{N='PercentUsed';E={[math]::Round(($_.Used/($_.Used+$_.Free))*100,1)}} |
            ConvertTo-Json
            """
            
            result = subprocess.run(['powershell', '-Command', ps_cmd],
                                  capture_output=True, text=True, timeout=10)
            
            if result.stdout:
                data = json.loads(result.stdout)
                if isinstance(data, dict):
                    data = [data]
                
                for disk in data:
                    percent = disk.get('PercentUsed', 0) or 0
                    free_gb = disk.get('FreeGB', 0) or 0
                    total_gb = disk.get('TotalGB', 0) or 0
                    
                    disks.append({
                        'name': f"Drive {disk.get('Name')}:",
                        'status': f"{free_gb}GB free of {total_gb}GB",
                        'type': 'Storage',
                        'operational': percent < 90 if percent is not None else True,
                        'percent_used': percent
                    })
        except Exception as e:
            print(f"Error getting disk status: {e}")
        
        return disks
    
    def get_print_service_status(self) -> Dict[str, Any]:
        """Get print spooler status"""
        service = self.get_service_status('Spooler')
        return {
            'name': 'Print Services',
            'status': 'Available' if service['operational'] else 'Unavailable',
            'type': 'Printing',
            'operational': service['operational']
        }
    
    def get_file_sharing_status(self) -> Dict[str, Any]:
        """Get file sharing service status"""
        service = self.get_service_status('LanmanServer')
        return {
            'name': 'File Sharing',
            'status': 'Available' if service['operational'] else 'Unavailable',
            'type': 'Network',
            'operational': service['operational']
        }
    
    def get_dns_status(self) -> Dict[str, Any]:
        """Get DNS service status"""
        service = self.get_service_status('Dnscache')
        return {
            'name': 'DNS Services',
            'status': 'Resolving names' if service['operational'] else 'Not available',
            'type': 'Network',
            'operational': service['operational']
        }
    
    def get_all_public_status(self) -> Dict[str, Any]:
        """Get all public-facing service status"""
        services = []
        
        # Core services
        services.append(self.get_network_status())
        services.append(self.get_print_service_status())
        services.append(self.get_file_sharing_status())
        services.append(self.get_dns_status())
        
        # Disk status
        services.extend(self.get_disk_status())
        
        # Calculate overall health
        total = len(services)
        operational = sum(1 for s in services if s.get('operational', False))
        health_pct = (operational / total * 100) if total > 0 else 0
        
        # Determine status
        if health_pct >= 90:
            overall_status = 'operational'
            status_message = 'All Systems Operational'
        elif health_pct >= 70:
            overall_status = 'degraded'
            status_message = 'Some Services Degraded'
        else:
            overall_status = 'outage'
            status_message = 'Service Disruption'
        
        return {
            'timestamp': datetime.now().isoformat(),
            'overall_status': overall_status,
            'status_message': status_message,
            'health_percentage': round(health_pct, 1),
            'total_services': total,
            'operational_services': operational,
            'services': services
        }
    
    def search_services(self, query: str) -> List[Dict[str, Any]]:
        """Search for services matching query"""
        all_services = self.get_all_public_status()['services']
        
        if not query:
            return all_services
        
        query_lower = query.lower()
        return [
            s for s in all_services 
            if query_lower in s.get('name', '').lower() or 
               query_lower in s.get('type', '').lower() or
               query_lower in s.get('status', '').lower()
        ]

if __name__ == '__main__':
    provider = PublicStatusProvider()
    print(json.dumps(provider.get_all_public_status(), indent=2))
