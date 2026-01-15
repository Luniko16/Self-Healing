#!/usr/bin/env python3
"""
Cross-Platform Disk Remediation Module
Cleans up disk space on Windows, macOS, and Linux
"""

import subprocess
import shutil
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

class DiskRemediator:
    """Cross-platform disk space cleanup"""
    
    def __init__(self):
        self.platform = platform_detector
        self.logger = get_logger()
        self.actions_taken = []
        self.space_freed_mb = 0
    
    def clean_temp_files(self):
        """Clean temporary files (platform-specific)"""
        self.logger.info("Cleaning temporary files", 
                        component="DiskFix", operation="CleanTemp")
        
        temp_dirs = []
        space_before = 0
        space_after = 0
        
        try:
            if self.platform.is_windows():
                temp_dirs = [
                    os.environ.get('TEMP', 'C:\\Windows\\Temp'),
                    os.environ.get('TMP', 'C:\\Windows\\Temp'),
                    'C:\\Windows\\Temp',
                    os.path.join(os.environ.get('USERPROFILE', ''), 'AppData', 'Local', 'Temp')
                ]
            elif self.platform.is_macos():
                temp_dirs = [
                    '/tmp',
                    '/var/tmp',
                    os.path.expanduser('~/Library/Caches')
                ]
            elif self.platform.is_linux():
                temp_dirs = [
                    '/tmp',
                    '/var/tmp',
                    os.path.expanduser('~/.cache')
                ]
            
            # Clean each temp directory
            for temp_dir in temp_dirs:
                if os.path.exists(temp_dir):
                    try:
                        # Get size before
                        space_before += self._get_dir_size(temp_dir)
                        
                        # Clean files older than 7 days
                        self._clean_old_files(temp_dir, days=7)
                        
                        # Get size after
                        space_after += self._get_dir_size(temp_dir)
                    except Exception as e:
                        self.logger.warning(f"Failed to clean {temp_dir}: {e}", 
                                          component="DiskFix", operation="CleanTemp")
            
            freed_mb = (space_before - space_after) / (1024 * 1024)
            self.space_freed_mb += freed_mb
            self.actions_taken.append(f"Cleaned temporary files ({freed_mb:.2f} MB freed)")
            
            self.logger.info(f"Temporary files cleaned. Space freed: {freed_mb:.2f} MB", 
                           component="DiskFix", operation="CleanTemp")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to clean temporary files: {e}", 
                            component="DiskFix", operation="CleanTemp")
            return False
    
    def clean_browser_cache(self):
        """Clean browser cache files"""
        self.logger.info("Cleaning browser cache", 
                        component="DiskFix", operation="CleanBrowser")
        
        cache_dirs = []
        space_before = 0
        space_after = 0
        
        try:
            if self.platform.is_windows():
                user_profile = os.environ.get('USERPROFILE', '')
                cache_dirs = [
                    os.path.join(user_profile, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
                    os.path.join(user_profile, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
                    os.path.join(user_profile, 'AppData', 'Local', 'Mozilla', 'Firefox', 'Profiles')
                ]
            elif self.platform.is_macos():
                cache_dirs = [
                    os.path.expanduser('~/Library/Caches/Google/Chrome'),
                    os.path.expanduser('~/Library/Caches/Firefox'),
                    os.path.expanduser('~/Library/Caches/com.apple.Safari')
                ]
            elif self.platform.is_linux():
                cache_dirs = [
                    os.path.expanduser('~/.cache/google-chrome'),
                    os.path.expanduser('~/.cache/mozilla/firefox'),
                    os.path.expanduser('~/.cache/chromium')
                ]
            
            # Clean each cache directory
            for cache_dir in cache_dirs:
                if os.path.exists(cache_dir):
                    try:
                        space_before += self._get_dir_size(cache_dir)
                        self._clean_old_files(cache_dir, days=30)
                        space_after += self._get_dir_size(cache_dir)
                    except Exception as e:
                        self.logger.warning(f"Failed to clean {cache_dir}: {e}", 
                                          component="DiskFix", operation="CleanBrowser")
            
            freed_mb = (space_before - space_after) / (1024 * 1024)
            self.space_freed_mb += freed_mb
            
            if freed_mb > 0:
                self.actions_taken.append(f"Cleaned browser cache ({freed_mb:.2f} MB freed)")
            
            self.logger.info(f"Browser cache cleaned. Space freed: {freed_mb:.2f} MB", 
                           component="DiskFix", operation="CleanBrowser")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to clean browser cache: {e}", 
                            component="DiskFix", operation="CleanBrowser")
            return False
    
    def clean_system_logs(self):
        """Clean old system logs"""
        self.logger.info("Cleaning system logs", 
                        component="DiskFix", operation="CleanLogs")
        
        log_dirs = []
        space_before = 0
        space_after = 0
        
        try:
            if self.platform.is_windows():
                log_dirs = [
                    'C:\\Windows\\Logs',
                    'C:\\Windows\\Temp'
                ]
            elif self.platform.is_macos():
                log_dirs = [
                    '/var/log',
                    os.path.expanduser('~/Library/Logs')
                ]
            elif self.platform.is_linux():
                log_dirs = [
                    '/var/log'
                ]
            
            # Clean old log files
            for log_dir in log_dirs:
                if os.path.exists(log_dir):
                    try:
                        space_before += self._get_dir_size(log_dir)
                        self._clean_old_files(log_dir, days=30, pattern='*.log')
                        space_after += self._get_dir_size(log_dir)
                    except Exception as e:
                        self.logger.warning(f"Failed to clean logs in {log_dir}: {e}", 
                                          component="DiskFix", operation="CleanLogs")
            
            freed_mb = (space_before - space_after) / (1024 * 1024)
            self.space_freed_mb += freed_mb
            
            if freed_mb > 0:
                self.actions_taken.append(f"Cleaned system logs ({freed_mb:.2f} MB freed)")
            
            self.logger.info(f"System logs cleaned. Space freed: {freed_mb:.2f} MB", 
                           component="DiskFix", operation="CleanLogs")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to clean system logs: {e}", 
                            component="DiskFix", operation="CleanLogs")
            return False
    
    def empty_recycle_bin(self):
        """Empty recycle bin / trash"""
        self.logger.info("Emptying recycle bin", 
                        component="DiskFix", operation="EmptyTrash")
        
        try:
            if self.platform.is_windows():
                # Use PowerShell to empty recycle bin
                subprocess.run(['powershell', '-Command', 
                              'Clear-RecycleBin -Force -ErrorAction SilentlyContinue'], 
                             capture_output=True, timeout=60, check=False)
                self.actions_taken.append("Emptied Recycle Bin")
            
            elif self.platform.is_macos():
                trash_dir = os.path.expanduser('~/.Trash')
                if os.path.exists(trash_dir):
                    space_before = self._get_dir_size(trash_dir)
                    shutil.rmtree(trash_dir, ignore_errors=True)
                    os.makedirs(trash_dir, exist_ok=True)
                    freed_mb = space_before / (1024 * 1024)
                    self.space_freed_mb += freed_mb
                    self.actions_taken.append(f"Emptied Trash ({freed_mb:.2f} MB freed)")
            
            elif self.platform.is_linux():
                trash_dir = os.path.expanduser('~/.local/share/Trash')
                if os.path.exists(trash_dir):
                    space_before = self._get_dir_size(trash_dir)
                    shutil.rmtree(trash_dir, ignore_errors=True)
                    os.makedirs(trash_dir, exist_ok=True)
                    freed_mb = space_before / (1024 * 1024)
                    self.space_freed_mb += freed_mb
                    self.actions_taken.append(f"Emptied Trash ({freed_mb:.2f} MB freed)")
            
            self.logger.info("Recycle bin emptied successfully", 
                           component="DiskFix", operation="EmptyTrash")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to empty recycle bin: {e}", 
                            component="DiskFix", operation="EmptyTrash")
            return False
    
    def _get_dir_size(self, path):
        """Get total size of directory in bytes"""
        total = 0
        try:
            for entry in os.scandir(path):
                if entry.is_file(follow_symlinks=False):
                    total += entry.stat().st_size
                elif entry.is_dir(follow_symlinks=False):
                    total += self._get_dir_size(entry.path)
        except (PermissionError, FileNotFoundError):
            pass
        return total
    
    def _clean_old_files(self, directory, days=7, pattern='*'):
        """Clean files older than specified days"""
        import time
        import glob
        
        cutoff_time = time.time() - (days * 86400)
        
        try:
            if pattern == '*':
                # Clean all files
                for entry in os.scandir(directory):
                    try:
                        if entry.is_file(follow_symlinks=False):
                            if entry.stat().st_mtime < cutoff_time:
                                os.remove(entry.path)
                    except (PermissionError, FileNotFoundError):
                        pass
            else:
                # Clean files matching pattern
                for file_path in glob.glob(os.path.join(directory, pattern)):
                    try:
                        if os.path.isfile(file_path):
                            if os.path.getmtime(file_path) < cutoff_time:
                                os.remove(file_path)
                    except (PermissionError, FileNotFoundError):
                        pass
        except Exception as e:
            self.logger.warning(f"Error cleaning files in {directory}: {e}")
    
    def run_remediation(self, issues):
        """Run disk cleanup based on detected issues"""
        self.logger.info(f"Starting disk remediation with {len(issues)} issue(s)", 
                        component="DiskFix", operation="RunRemediation")
        
        self.actions_taken = []
        self.space_freed_mb = 0
        
        try:
            # Run all cleanup operations
            self.clean_temp_files()
            self.clean_browser_cache()
            self.clean_system_logs()
            self.empty_recycle_bin()
            
            remediation_success = len(self.actions_taken) > 0
            
        except Exception as e:
            self.logger.error(f"Disk remediation failed: {e}", 
                            component="DiskFix", operation="RunRemediation")
            remediation_success = False
        
        self.logger.info(f"Disk remediation completed. Space freed: {self.space_freed_mb:.2f} MB", 
                        component="DiskFix", operation="RunRemediation")
        
        return {
            'success': remediation_success,
            'actions_taken': self.actions_taken,
            'action_count': len(self.actions_taken),
            'space_freed_mb': round(self.space_freed_mb, 2)
        }

if __name__ == "__main__":
    # Test the disk remediator
    remediator = DiskRemediator()
    test_issues = ["Low disk space on C: (8.5 GB free)"]
    result = remediator.run_remediation(test_issues)
    
    print("\n" + "="*50)
    print("Disk Remediation Results")
    print("="*50)
    print(f"Success: {result['success']}")
    print(f"Actions Taken: {result['action_count']}")
    print(f"Space Freed: {result['space_freed_mb']} MB")
    print(f"\nActions:")
    for action in result['actions_taken']:
        print(f"  - {action}")
