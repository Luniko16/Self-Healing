#!/usr/bin/env python3
"""
Cross-Platform Printer Detection Module
Detects printer and print queue issues on Windows, macOS, and Linux
"""

import subprocess
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

class PrinterDetector:
    """Cross-platform printer detection"""
    
    def __init__(self):
        self.platform = platform_detector
        self.logger = get_logger()
        self.issues = []
    
    def check_print_spooler_windows(self):
        """Check Windows Print Spooler service"""
        try:
            result = subprocess.run(
                ['sc', 'query', 'Spooler'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                if 'RUNNING' not in result.stdout:
                    self.issues.append("Print Spooler service is not running")
                    self.logger.warning("Print Spooler service is not running", 
                                      component="PrinterDetect", operation="CheckSpooler")
                    return False
                else:
                    self.logger.info("Print Spooler service is running", 
                                   component="PrinterDetect", operation="CheckSpooler")
                    return True
            else:
                self.issues.append("Print Spooler service not found")
                return False
        except Exception as e:
            self.logger.error(f"Failed to check Print Spooler: {e}", 
                            component="PrinterDetect", operation="CheckSpooler")
            return False
    
    def check_print_queue_windows(self):
        """Check for stuck print jobs on Windows"""
        try:
            # Use PowerShell to check print queue
            ps_command = "Get-Printer | ForEach-Object { Get-PrintJob -PrinterName $_.Name -ErrorAction SilentlyContinue } | Measure-Object | Select-Object -ExpandProperty Count"
            
            result = subprocess.run(
                ['powershell', '-Command', ps_command],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                job_count = int(result.stdout.strip())
                
                if job_count > 0:
                    self.issues.append(f"{job_count} stuck print job(s) in queue")
                    self.logger.warning(f"{job_count} print jobs in queue", 
                                      component="PrinterDetect", operation="CheckQueue")
                    return False
                else:
                    self.logger.info("Print queue is clear", 
                                   component="PrinterDetect", operation="CheckQueue")
                    return True
            return True
        except Exception as e:
            self.logger.error(f"Failed to check print queue: {e}", 
                            component="PrinterDetect", operation="CheckQueue")
            return True  # Don't report as issue if we can't check
    
    def check_cups_macos_linux(self):
        """Check CUPS printing service on macOS/Linux"""
        try:
            # Check if CUPS is running
            if self.platform.is_macos():
                result = subprocess.run(
                    ['launchctl', 'list', 'org.cups.cupsd'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode != 0:
                    self.issues.append("CUPS printing service is not running")
                    self.logger.warning("CUPS service not running", 
                                      component="PrinterDetect", operation="CheckCUPS")
                    return False
            
            elif self.platform.is_linux():
                result = subprocess.run(
                    ['systemctl', 'is-active', 'cups'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.stdout.strip() != 'active':
                    self.issues.append("CUPS printing service is not active")
                    self.logger.warning("CUPS service not active", 
                                      component="PrinterDetect", operation="CheckCUPS")
                    return False
            
            self.logger.info("CUPS service is running", 
                           component="PrinterDetect", operation="CheckCUPS")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to check CUPS: {e}", 
                            component="PrinterDetect", operation="CheckCUPS")
            return True  # Don't report as issue if we can't check
    
    def check_print_queue_cups(self):
        """Check for stuck print jobs in CUPS"""
        try:
            result = subprocess.run(
                ['lpstat', '-o'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0 and result.stdout.strip():
                job_count = len(result.stdout.strip().split('\n'))
                self.issues.append(f"{job_count} print job(s) in CUPS queue")
                self.logger.warning(f"{job_count} jobs in CUPS queue", 
                                  component="PrinterDetect", operation="CheckCUPSQueue")
                return False
            
            self.logger.info("CUPS queue is clear", 
                           component="PrinterDetect", operation="CheckCUPSQueue")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to check CUPS queue: {e}", 
                            component="PrinterDetect", operation="CheckCUPSQueue")
            return True
    
    def check_printers_installed(self):
        """Check if any printers are installed"""
        try:
            if self.platform.is_windows():
                result = subprocess.run(
                    ['powershell', '-Command', 'Get-Printer | Measure-Object | Select-Object -ExpandProperty Count'],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0:
                    printer_count = int(result.stdout.strip())
                    
                    if printer_count == 0:
                        self.issues.append("No printers installed")
                        self.logger.warning("No printers installed", 
                                          component="PrinterDetect", operation="CheckInstalled")
                        return False
                    else:
                        self.logger.info(f"{printer_count} printer(s) installed", 
                                       component="PrinterDetect", operation="CheckInstalled")
                        return True
            
            elif self.platform.is_macos() or self.platform.is_linux():
                result = subprocess.run(
                    ['lpstat', '-p'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0 and result.stdout.strip():
                    printer_count = len([line for line in result.stdout.split('\n') if line.startswith('printer')])
                    
                    if printer_count == 0:
                        self.issues.append("No printers installed")
                        self.logger.warning("No printers installed", 
                                          component="PrinterDetect", operation="CheckInstalled")
                        return False
                    else:
                        self.logger.info(f"{printer_count} printer(s) installed", 
                                       component="PrinterDetect", operation="CheckInstalled")
                        return True
                else:
                    self.issues.append("No printers installed")
                    return False
            
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to check installed printers: {e}", 
                            component="PrinterDetect", operation="CheckInstalled")
            return True
    
    def run_detection(self):
        """Run printer detection"""
        self.logger.info("Starting printer detection", 
                        component="PrinterDetect", operation="RunDetection")
        
        self.issues = []
        
        if self.platform.is_windows():
            self.check_print_spooler_windows()
            self.check_print_queue_windows()
            self.check_printers_installed()
        
        elif self.platform.is_macos() or self.platform.is_linux():
            self.check_cups_macos_linux()
            self.check_print_queue_cups()
            self.check_printers_installed()
        
        self.logger.info(f"Printer detection completed. Issues found: {len(self.issues)}", 
                        component="PrinterDetect", operation="RunDetection")
        
        return {
            'has_issues': len(self.issues) > 0,
            'issues': self.issues,
            'issue_count': len(self.issues)
        }

if __name__ == "__main__":
    # Test the printer detector
    detector = PrinterDetector()
    result = detector.run_detection()
    
    print("\n" + "="*50)
    print("Printer Detection Results")
    print("="*50)
    print(f"Has Issues: {result['has_issues']}")
    print(f"Issue Count: {result['issue_count']}")
    print(f"\nIssues:")
    for issue in result['issues']:
        print(f"  - {issue}")
