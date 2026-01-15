#!/usr/bin/env python3
"""
Cross-Platform Logging Module
Provides unified logging across Windows, macOS, and Linux
"""

import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from platform_detector import platform_detector

class AgentLogger:
    """Cross-platform logging for Self-Healing Agent"""
    
    def __init__(self, log_dir=None, log_level=logging.INFO):
        self.platform = platform_detector
        
        # Determine log directory
        if log_dir is None:
            log_dir = self.platform.get_log_directory()
        
        self.log_dir = Path(log_dir)
        self._ensure_log_directory()
        
        # Setup logging
        self.logger = logging.getLogger('SelfHealingAgent')
        self.logger.setLevel(log_level)
        
        # Remove existing handlers
        self.logger.handlers = []
        
        # File handler - daily log file
        log_file = self.log_dir / f"execution_{datetime.now().strftime('%Y-%m-%d')}.log"
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(log_level)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(component)-15s | %(operation)-20s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        # Platform-specific system logging
        self._setup_system_logging()
    
    def _ensure_log_directory(self):
        """Create log directory if it doesn't exist"""
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            # Fallback to user directory if no permissions
            fallback_dir = Path.home() / '.selfhealingagent' / 'logs'
            fallback_dir.mkdir(parents=True, exist_ok=True)
            self.log_dir = fallback_dir
            print(f"Warning: Using fallback log directory: {self.log_dir}")
    
    def _setup_system_logging(self):
        """Setup platform-specific system logging"""
        if self.platform.is_windows():
            self._setup_windows_event_log()
        elif self.platform.is_macos():
            self._setup_macos_syslog()
        elif self.platform.is_linux():
            self._setup_linux_syslog()
    
    def _setup_windows_event_log(self):
        """Setup Windows Event Log"""
        try:
            import win32evtlog
            import win32evtlogutil
            # Windows Event Log integration would go here
            # Requires pywin32 package
        except ImportError:
            pass  # pywin32 not available
    
    def _setup_macos_syslog(self):
        """Setup macOS syslog"""
        try:
            from logging.handlers import SysLogHandler
            syslog_handler = SysLogHandler(address='/var/run/syslog')
            syslog_handler.setLevel(logging.WARNING)
            self.logger.addHandler(syslog_handler)
        except:
            pass  # Syslog not available
    
    def _setup_linux_syslog(self):
        """Setup Linux syslog"""
        try:
            from logging.handlers import SysLogHandler
            syslog_handler = SysLogHandler(address='/dev/log')
            syslog_handler.setLevel(logging.WARNING)
            self.logger.addHandler(syslog_handler)
        except:
            pass  # Syslog not available
    
    def log(self, message, level='INFO', component='Agent', operation='General'):
        """Log a message with component and operation context"""
        extra = {'component': component, 'operation': operation}
        
        if level == 'DEBUG':
            self.logger.debug(message, extra=extra)
        elif level == 'INFO':
            self.logger.info(message, extra=extra)
        elif level == 'WARNING' or level == 'WARN':
            self.logger.warning(message, extra=extra)
        elif level == 'ERROR':
            self.logger.error(message, extra=extra)
        elif level == 'CRITICAL' or level == 'AUDIT':
            self.logger.critical(message, extra=extra)
    
    def info(self, message, component='Agent', operation='General'):
        """Log info message"""
        self.log(message, 'INFO', component, operation)
    
    def warning(self, message, component='Agent', operation='General'):
        """Log warning message"""
        self.log(message, 'WARNING', component, operation)
    
    def error(self, message, component='Agent', operation='General'):
        """Log error message"""
        self.log(message, 'ERROR', component, operation)
    
    def audit(self, message, component='Agent', operation='General'):
        """Log audit message"""
        self.log(message, 'AUDIT', component, operation)
    
    def debug(self, message, component='Agent', operation='General'):
        """Log debug message"""
        self.log(message, 'DEBUG', component, operation)

# Global logger instance
agent_logger = None

def get_logger(log_dir=None, log_level=logging.INFO):
    """Get or create global logger instance"""
    global agent_logger
    if agent_logger is None:
        agent_logger = AgentLogger(log_dir, log_level)
    return agent_logger

if __name__ == "__main__":
    # Test the logger
    logger = get_logger()
    logger.info("Self-Healing Agent started", component="Test", operation="Startup")
    logger.warning("This is a warning", component="Test", operation="Test")
    logger.error("This is an error", component="Test", operation="Test")
    logger.audit("This is an audit entry", component="Test", operation="Test")
    print(f"\nLog file created at: {logger.log_dir}")
