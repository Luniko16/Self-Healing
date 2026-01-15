#!/usr/bin/env python3
"""
Cross-Platform Printer Remediation Module
Fixes printer and print queue issues on Windows, macOS, and Linux
"""

import subprocess
import sys
import time
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

class PrinterRemediator:
    """Cross-platform printer remediation"""
    
    def __init__(self):
        self.platform = platform_detector
        self.logger = get_logger()
        self.actions_taken = []
    
    def restart_print_spooler_windows(self):
        """Restart Windows Print Spooler service"""
        self.logger.info("Restarting Print Spooler service", 
                        component="PrinterFix", operation="RestartSpooler")
        
        try:
            # Stop spooler
            subprocess.run(['net', 'stop', 'Spooler'], 
                         capture_output=True, timeout=30, check=False)
            time.sleep(2)
            
            # Clear print queue
            spool_dir = 'C:\\Windows\\System32\\spool\\PRINTERS'
            if os.path.exists(spool_dir):
                for file in os.listdir(spool_dir):
                    try:
                        os.remove(os.path.join(spool_dir, file))
                        self.logger.info(f"Deleted print job file: {file}", 
                                       component="PrinterFix", operation="ClearQueue")
                    except Exception as e:
                        self.logger.warning(f"Could not delete {file}: {e}", 
                                          component="PrinterFix", operation="ClearQueue")
            
            # Start spooler
            result = subprocess.run(['net', 'start', 'Spooler'], 
                                  capture_output=True, timeout=30, check=True)
            
            if result.returncode == 0:
                self.actions_taken.append("Restarted Print Spooler and cleared queue")
                self.logger.info("Print Spooler restarted successfully", 
                               component="PrinterFix", operation="RestartSpooler")
                return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to restart Print Spooler: {e}", 
                            component="PrinterFix", operation="RestartSpooler")
            return False
    
    def clear_print_queue_windows(self):
        """Clear stuck print jobs on Windows"""
        self.logger.info("Clearing Windows print queue", 
                        component="PrinterFix", operation="ClearQueue")
        
        try:
            # Use PowerShell to clear all print jobs
            ps_command = "Get-Printer | ForEach-Object { Get-PrintJob -PrinterName $_.Name | Remove-PrintJob }"
            
            result = subprocess.run(
                ['powershell', '-Command', ps_command],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.actions_taken.append("Cleared all print jobs from queue")
                self.logger.info("Print queue cleared", 
                               component="PrinterFix", operation="ClearQueue")
                return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to clear print queue: {e}", 
                            component="PrinterFix", operation="ClearQueue")
            return False
    
    def restart_cups_service(self):
        """Restart CUPS printing service"""
        self.logger.info("Restarting CUPS service", 
                        component="PrinterFix", operation="RestartCUPS")
        
        try:
            if self.platform.is_macos():
                # Stop CUPS
                subprocess.run(['sudo', 'launchctl', 'stop', 'org.cups.cupsd'], 
                             capture_output=True, timeout=10, check=False)
                time.sleep(2)
                
                # Start CUPS
                result = subprocess.run(['sudo', 'launchctl', 'start', 'org.cups.cupsd'], 
                                      capture_output=True, timeout=10, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append("Restarted CUPS printing service")
                    self.logger.info("CUPS restarted successfully", 
                                   component="PrinterFix", operation="RestartCUPS")
                    return True
            
            elif self.platform.is_linux():
                result = subprocess.run(['sudo', 'systemctl', 'restart', 'cups'], 
                                      capture_output=True, timeout=30, check=True)
                
                if result.returncode == 0:
                    self.actions_taken.append("Restarted CUPS printing service")
                    self.logger.info("CUPS restarted successfully", 
                                   component="PrinterFix", operation="RestartCUPS")
                    return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to restart CUPS: {e}", 
                            component="PrinterFix", operation="RestartCUPS")
            return False
    
    def clear_cups_queue(self):
        """Clear CUPS print queue"""
        self.logger.info("Clearing CUPS print queue", 
                        component="PrinterFix", operation="ClearCUPSQueue")
        
        try:
            # Cancel all print jobs
            result = subprocess.run(['cancel', '-a'], 
                                  capture_output=True, timeout=10, check=True)
            
            if result.returncode == 0:
                self.actions_taken.append("Cleared CUPS print queue")
                self.logger.info("CUPS queue cleared", 
                               component="PrinterFix", operation="ClearCUPSQueue")
                return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to clear CUPS queue: {e}", 
                            component="PrinterFix", operation="ClearCUPSQueue")
            return False
    
    def reset_printer_drivers_windows(self):
        """Reset printer drivers on Windows"""
        self.logger.info("Resetting printer drivers", 
                        component="PrinterFix", operation="ResetDrivers")
        
        try:
            # Use PowerShell to restart print drivers
            ps_command = "Restart-Service -Name Spooler -Force"
            
            result = subprocess.run(
                ['powershell', '-Command', ps_command],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.actions_taken.append("Reset printer drivers")
                self.logger.info("Printer drivers reset", 
                               component="PrinterFix", operation="ResetDrivers")
                return True
            
            return False
        
        except Exception as e:
            self.logger.error(f"Failed to reset printer drivers: {e}", 
                            component="PrinterFix", operation="ResetDrivers")
            return False
    
    def run_remediation(self, issues):
        """Run printer remediation based on detected issues"""
        self.logger.info(f"Starting printer remediation with {len(issues)} issue(s)", 
                        component="PrinterFix", operation="RunRemediation")
        
        self.actions_taken = []
        
        try:
            for issue in issues:
                issue_lower = issue.lower()
                
                if self.platform.is_windows():
                    # Windows-specific fixes
                    if 'spooler' in issue_lower or 'not running' in issue_lower:
                        self.restart_print_spooler_windows()
                    
                    elif 'stuck' in issue_lower or 'queue' in issue_lower or 'job' in issue_lower:
                        self.clear_print_queue_windows()
                        # Also restart spooler to ensure clean state
                        time.sleep(2)
                        self.restart_print_spooler_windows()
                    
                    elif 'no printers' in issue_lower:
                        self.logger.info("No printers installed - manual intervention required", 
                                       component="PrinterFix", operation="RunRemediation")
                        self.actions_taken.append("No printers installed - requires manual setup")
                
                elif self.platform.is_macos() or self.platform.is_linux():
                    # macOS/Linux-specific fixes
                    if 'cups' in issue_lower or 'not running' in issue_lower or 'not active' in issue_lower:
                        self.restart_cups_service()
                    
                    elif 'queue' in issue_lower or 'job' in issue_lower:
                        self.clear_cups_queue()
                        # Also restart CUPS to ensure clean state
                        time.sleep(2)
                        self.restart_cups_service()
                    
                    elif 'no printers' in issue_lower:
                        self.logger.info("No printers installed - manual intervention required", 
                                       component="PrinterFix", operation="RunRemediation")
                        self.actions_taken.append("No printers installed - requires manual setup")
            
            remediation_success = len(self.actions_taken) > 0
        
        except Exception as e:
            self.logger.error(f"Printer remediation failed: {e}", 
                            component="PrinterFix", operation="RunRemediation")
            remediation_success = False
        
        self.logger.info(f"Printer remediation completed. Actions taken: {len(self.actions_taken)}", 
                        component="PrinterFix", operation="RunRemediation")
        
        return {
            'success': remediation_success,
            'actions_taken': self.actions_taken,
            'action_count': len(self.actions_taken)
        }

if __name__ == "__main__":
    # Test the printer remediator
    remediator = PrinterRemediator()
    test_issues = ["Print Spooler service is not running", "2 stuck print job(s) in queue"]
    result = remediator.run_remediation(test_issues)
    
    print("\n" + "="*50)
    print("Printer Remediation Results")
    print("="*50)
    print(f"Success: {result['success']}")
    print(f"Actions Taken: {result['action_count']}")
    print(f"\nActions:")
    for action in result['actions_taken']:
        print(f"  - {action}")
