#!/usr/bin/env python3
"""
Security Compliance Module
Checks system security configuration
"""

import subprocess
import platform
import json
from typing import Dict, Any, List
from datetime import datetime

class SecurityCompliance:
    """Checks security compliance status"""
    
    def __init__(self):
        self.platform = platform.system()
    
    def check_windows_updates(self) -> Dict[str, Any]:
        """Check Windows Update status"""
        try:
            ps_cmd = """
            $UpdateSession = New-Object -ComObject Microsoft.Update.Session
            $UpdateSearcher = $UpdateSession.CreateUpdateSearcher()
            $Updates = $UpdateSearcher.Search("IsInstalled=0")
            @{
                PendingUpdates = $Updates.Updates.Count
                LastSearchTime = (Get-Date).ToString()
            } | ConvertTo-Json
            """
            
            result = subprocess.run(['powershell', '-Command', ps_cmd],
                                  capture_output=True, text=True, timeout=30)
            
            if result.stdout:
                data = json.loads(result.stdout)
                return {
                    'status': 'compliant' if data.get('PendingUpdates', 0) == 0 else 'non_compliant',
                    'pending_updates': data.get('PendingUpdates', 0),
                    'last_check': data.get('LastSearchTime'),
                    'severity': 'high' if data.get('PendingUpdates', 0) > 10 else 'medium'
                }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
        
        return {'status': 'unknown'}
    
    def check_antivirus_status(self) -> Dict[str, Any]:
        """Check antivirus status"""
        if self.platform == 'Windows':
            try:
                ps_cmd = """
                Get-MpComputerStatus | Select-Object AntivirusEnabled, 
                    RealTimeProtectionEnabled, AntivirusSignatureLastUpdated | 
                    ConvertTo-Json
                """
                
                result = subprocess.run(['powershell', '-Command', ps_cmd],
                                      capture_output=True, text=True, timeout=30)
                
                if result.stdout:
                    data = json.loads(result.stdout)
                    enabled = data.get('AntivirusEnabled', False)
                    realtime = data.get('RealTimeProtectionEnabled', False)
                    
                    return {
                        'status': 'compliant' if (enabled and realtime) else 'non_compliant',
                        'antivirus_enabled': enabled,
                        'realtime_protection': realtime,
                        'last_signature_update': data.get('AntivirusSignatureLastUpdated'),
                        'severity': 'critical' if not enabled else 'low'
                    }
            except Exception as e:
                return {'status': 'error', 'message': str(e)}
        
        return {'status': 'not_applicable'}
    
    def check_firewall_status(self) -> Dict[str, Any]:
        """Check firewall status"""
        if self.platform == 'Windows':
            try:
                ps_cmd = """
                Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json
                """
                
                result = subprocess.run(['powershell', '-Command', ps_cmd],
                                      capture_output=True, text=True, timeout=30)
                
                if result.stdout:
                    data = json.loads(result.stdout)
                    if isinstance(data, dict):
                        data = [data]
                    
                    profiles = {p['Name']: p['Enabled'] for p in data}
                    all_enabled = all(profiles.values())
                    
                    return {
                        'status': 'compliant' if all_enabled else 'non_compliant',
                        'profiles': profiles,
                        'severity': 'critical' if not all_enabled else 'low'
                    }
            except Exception as e:
                return {'status': 'error', 'message': str(e)}
        
        return {'status': 'not_applicable'}
    
    def check_bitlocker_status(self) -> Dict[str, Any]:
        """Check BitLocker encryption status"""
        if self.platform == 'Windows':
            try:
                ps_cmd = """
                Get-BitLockerVolume | Select-Object MountPoint, ProtectionStatus, 
                    EncryptionPercentage | ConvertTo-Json
                """
                
                result = subprocess.run(['powershell', '-Command', ps_cmd],
                                      capture_output=True, text=True, timeout=30)
                
                if result.stdout:
                    data = json.loads(result.stdout)
                    if isinstance(data, dict):
                        data = [data]
                    
                    volumes = []
                    for vol in data:
                        volumes.append({
                            'drive': vol.get('MountPoint'),
                            'protected': vol.get('ProtectionStatus') == 'On',
                            'encryption_percent': vol.get('EncryptionPercentage', 0)
                        })
                    
                    all_protected = all(v['protected'] for v in volumes if v['drive'] == 'C:')
                    
                    return {
                        'status': 'compliant' if all_protected else 'non_compliant',
                        'volumes': volumes,
                        'severity': 'high' if not all_protected else 'low'
                    }
            except Exception as e:
                return {'status': 'error', 'message': str(e)}
        
        return {'status': 'not_applicable'}
    
    def check_password_policy(self) -> Dict[str, Any]:
        """Check password policy settings"""
        if self.platform == 'Windows':
            try:
                result = subprocess.run(['net', 'accounts'],
                                      capture_output=True, text=True, timeout=30)
                
                policy = {}
                for line in result.stdout.split('\n'):
                    if 'Minimum password length' in line:
                        policy['min_length'] = int(line.split(':')[-1].strip())
                    elif 'Maximum password age' in line:
                        policy['max_age'] = line.split(':')[-1].strip()
                    elif 'Minimum password age' in line:
                        policy['min_age'] = line.split(':')[-1].strip()
                
                compliant = policy.get('min_length', 0) >= 8
                
                return {
                    'status': 'compliant' if compliant else 'non_compliant',
                    'policy': policy,
                    'severity': 'medium' if not compliant else 'low'
                }
            except Exception as e:
                return {'status': 'error', 'message': str(e)}
        
        return {'status': 'not_applicable'}
    
    def get_compliance_report(self) -> Dict[str, Any]:
        """Generate complete compliance report"""
        checks = {
            'windows_updates': self.check_windows_updates(),
            'antivirus': self.check_antivirus_status(),
            'firewall': self.check_firewall_status(),
            'bitlocker': self.check_bitlocker_status(),
            'password_policy': self.check_password_policy()
        }
        
        # Calculate overall compliance
        total_checks = len(checks)
        compliant_checks = sum(1 for c in checks.values() if c.get('status') == 'compliant')
        compliance_score = (compliant_checks / total_checks) * 100 if total_checks > 0 else 0
        
        # Identify critical issues
        critical_issues = [
            name for name, check in checks.items() 
            if check.get('severity') == 'critical'
        ]
        
        return {
            'timestamp': datetime.now().isoformat(),
            'platform': self.platform,
            'compliance_score': round(compliance_score, 1),
            'total_checks': total_checks,
            'compliant_checks': compliant_checks,
            'critical_issues': critical_issues,
            'checks': checks
        }

if __name__ == '__main__':
    compliance = SecurityCompliance()
    print(json.dumps(compliance.get_compliance_report(), indent=2))
