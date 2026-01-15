#!/usr/bin/env python3
"""
Platform Detection Module
Detects operating system and provides platform-specific utilities
"""

import platform
import sys
import os
from enum import Enum

class OSType(Enum):
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"
    UNKNOWN = "unknown"

class PlatformDetector:
    """Detects and provides information about the current platform"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.release = platform.release()
        self.version = platform.version()
        self.machine = platform.machine()
        self.python_version = sys.version
        
    def get_os_type(self) -> OSType:
        """Returns the operating system type"""
        if self.system == "windows":
            return OSType.WINDOWS
        elif self.system == "darwin":
            return OSType.MACOS
        elif self.system == "linux":
            return OSType.LINUX
        else:
            return OSType.UNKNOWN
    
    def is_windows(self) -> bool:
        """Check if running on Windows"""
        return self.get_os_type() == OSType.WINDOWS
    
    def is_macos(self) -> bool:
        """Check if running on macOS"""
        return self.get_os_type() == OSType.MACOS
    
    def is_linux(self) -> bool:
        """Check if running on Linux"""
        return self.get_os_type() == OSType.LINUX
    
    def get_linux_distro(self) -> str:
        """Get Linux distribution name"""
        if not self.is_linux():
            return None
        
        try:
            import distro
            return distro.name()
        except ImportError:
            # Fallback for systems without distro package
            if os.path.exists('/etc/os-release'):
                with open('/etc/os-release', 'r') as f:
                    for line in f:
                        if line.startswith('NAME='):
                            return line.split('=')[1].strip().strip('"')
            return "Unknown Linux"
    
    def is_admin(self) -> bool:
        """Check if running with administrator/root privileges"""
        if self.is_windows():
            try:
                import ctypes
                return ctypes.windll.shell32.IsUserAnAdmin() != 0
            except:
                return False
        else:
            # Unix-like systems (macOS, Linux)
            return os.geteuid() == 0
    
    def get_home_directory(self) -> str:
        """Get user home directory"""
        return os.path.expanduser("~")
    
    def get_temp_directory(self) -> str:
        """Get temporary directory"""
        import tempfile
        return tempfile.gettempdir()
    
    def get_agent_directory(self) -> str:
        """Get platform-specific agent installation directory"""
        if self.is_windows():
            return os.path.join(os.environ.get('ProgramFiles', 'C:\\Program Files'), 'SelfHealingAgent')
        elif self.is_macos():
            return '/Library/Application Support/SelfHealingAgent'
        else:  # Linux
            return '/opt/selfhealingagent'
    
    def get_log_directory(self) -> str:
        """Get platform-specific log directory"""
        if self.is_windows():
            return os.path.join(self.get_agent_directory(), 'Logs')
        elif self.is_macos():
            return '/var/log/selfhealingagent'
        else:  # Linux
            return '/var/log/selfhealingagent'
    
    def get_config_directory(self) -> str:
        """Get platform-specific configuration directory"""
        if self.is_windows():
            return os.path.join(self.get_agent_directory(), 'Config')
        elif self.is_macos():
            return '/etc/selfhealingagent'
        else:  # Linux
            return '/etc/selfhealingagent'
    
    def get_service_name(self) -> str:
        """Get platform-specific service name"""
        if self.is_windows():
            return "SelfHealingAgent"
        else:
            return "selfhealingagent"
    
    def get_info(self) -> dict:
        """Get comprehensive platform information"""
        info = {
            'os_type': self.get_os_type().value,
            'system': self.system,
            'release': self.release,
            'version': self.version,
            'machine': self.machine,
            'python_version': self.python_version,
            'is_admin': self.is_admin(),
            'home_directory': self.get_home_directory(),
            'temp_directory': self.get_temp_directory(),
            'agent_directory': self.get_agent_directory(),
            'log_directory': self.get_log_directory(),
            'config_directory': self.get_config_directory(),
        }
        
        if self.is_linux():
            info['linux_distro'] = self.get_linux_distro()
        
        return info
    
    def __str__(self):
        """String representation"""
        os_type = self.get_os_type().value
        if self.is_linux():
            return f"{os_type} ({self.get_linux_distro()})"
        return os_type

# Global instance
platform_detector = PlatformDetector()

if __name__ == "__main__":
    # Test the platform detector
    detector = PlatformDetector()
    print("Platform Information:")
    print("=" * 50)
    for key, value in detector.get_info().items():
        print(f"{key:20s}: {value}")
