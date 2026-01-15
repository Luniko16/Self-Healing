#!/usr/bin/env python3
"""
Cross-Platform Disk Detection Module
Detects low disk space on Windows, macOS, and Linux
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

try:
    import psutil
except ImportError:
    print("Warning: psutil not installed. Install with: pip install psutil")
    psutil = None

class DiskDetector:
    """Cross-platform disk space detection"""
    
    def __init__(self, warning_threshold_gb=10, critical_threshold_gb=5):
        self.platform = platform_detector
        self.logger = get_logger()
        self.warning_threshold = warning_threshold_gb * (1024**3)  # Convert to bytes
        self.critical_threshold = critical_threshold_gb * (1024**3)
        self.issues = []
    
    def get_disk_usage(self):
        """Get disk usage for all mounted filesystems"""
        self.logger.info("Checking disk space", 
                        component="DiskDetect", operation="GetDiskUsage")
        
        if psutil is None:
            self.logger.error("psutil not available, cannot check disk space")
            return []
        
        disks = []
        
        try:
            partitions = psutil.disk_partitions()
            
            for partition in partitions:
                # Skip special filesystems
                if self.platform.is_linux() and partition.fstype in ['tmpfs', 'devtmpfs', 'squashfs']:
                    continue
                
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    
                    disk_info = {
                        'device': partition.device,
                        'mountpoint': partition.mountpoint,
                        'fstype': partition.fstype,
                        'total_gb': round(usage.total / (1024**3), 2),
                        'used_gb': round(usage.used / (1024**3), 2),
                        'free_gb': round(usage.free / (1024**3), 2),
                        'percent_used': usage.percent
                    }
                    
                    disks.append(disk_info)
                    
                    self.logger.info(
                        f"{partition.mountpoint}: {disk_info['free_gb']}GB free / {disk_info['total_gb']}GB total ({100-usage.percent:.1f}% free)",
                        component="DiskDetect", operation="GetDiskUsage"
                    )
                    
                except PermissionError:
                    self.logger.warning(f"Permission denied accessing {partition.mountpoint}")
                    continue
        
        except Exception as e:
            self.logger.error(f"Failed to get disk usage: {e}", 
                            component="DiskDetect", operation="GetDiskUsage")
        
        return disks
    
    def check_disk_space(self):
        """Check disk space and identify issues"""
        self.logger.info("Starting disk space detection", 
                        component="DiskDetect", operation="CheckDiskSpace")
        
        disks = self.get_disk_usage()
        
        for disk in disks:
            free_bytes = disk['free_gb'] * (1024**3)
            
            if free_bytes < self.critical_threshold:
                issue = f"CRITICAL: {disk['mountpoint']} has only {disk['free_gb']}GB free ({100-disk['percent_used']:.1f}%)"
                self.issues.append(issue)
                self.logger.warning(issue, component="DiskDetect", operation="CheckDiskSpace")
            
            elif free_bytes < self.warning_threshold:
                issue = f"WARNING: {disk['mountpoint']} has only {disk['free_gb']}GB free ({100-disk['percent_used']:.1f}%)"
                self.issues.append(issue)
                self.logger.warning(issue, component="DiskDetect", operation="CheckDiskSpace")
        
        self.logger.info(f"Disk space detection completed. Issues found: {len(self.issues)}", 
                        component="DiskDetect", operation="CheckDiskSpace")
        
        return disks
    
    def run_detection(self):
        """Run disk space detection"""
        disks = self.check_disk_space()
        
        return {
            'has_issues': len(self.issues) > 0,
            'issues': self.issues,
            'issue_count': len(self.issues),
            'disks': disks,
            'warning_threshold_gb': self.warning_threshold / (1024**3),
            'critical_threshold_gb': self.critical_threshold / (1024**3)
        }

if __name__ == "__main__":
    # Test the disk detector
    detector = DiskDetector()
    result = detector.run_detection()
    
    print("\n" + "="*50)
    print("Disk Detection Results")
    print("="*50)
    print(f"Has Issues: {result['has_issues']}")
    print(f"Issue Count: {result['issue_count']}")
    print(f"\nIssues:")
    for issue in result['issues']:
        print(f"  - {issue}")
    print(f"\nDisks:")
    for disk in result['disks']:
        print(f"  - {disk['mountpoint']}: {disk['free_gb']}GB free / {disk['total_gb']}GB total")
