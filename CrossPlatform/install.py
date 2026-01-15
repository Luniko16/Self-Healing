#!/usr/bin/env python3
"""
Self-Healing Agent Installation Script
Cross-platform installer for Windows, macOS, and Linux
"""

import sys
import os
import shutil
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.7+"""
    if sys.version_info < (3, 7):
        print("❌ Error: Python 3.7 or higher is required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print(f"✓ Python version: {sys.version.split()[0]}")

def check_privileges():
    """Check if running with administrator/root privileges"""
    if os.name == 'nt':  # Windows
        try:
            import ctypes
            is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
        except:
            is_admin = False
    else:  # Unix-like
        is_admin = os.geteuid() == 0
    
    if not is_admin:
        print("⚠️  Warning: Not running with administrator/root privileges")
        print("   Some installation steps may fail")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    else:
        print("✓ Running with administrator/root privileges")

def detect_platform():
    """Detect operating system"""
    system = sys.platform
    if system.startswith('win'):
        return 'windows'
    elif system == 'darwin':
        return 'macos'
    elif system.startswith('linux'):
        return 'linux'
    else:
        return 'unknown'

def get_install_directory(platform):
    """Get platform-specific installation directory"""
    if platform == 'windows':
        return Path(os.environ.get('ProgramFiles', 'C:\\Program Files')) / 'SelfHealingAgent'
    elif platform == 'macos':
        return Path('/Library/Application Support/SelfHealingAgent')
    else:  # Linux
        return Path('/opt/selfhealingagent')

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    
    requirements_file = Path(__file__).parent / 'requirements.txt'
    
    if requirements_file.exists():
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)],
                         check=True)
            print("✓ Dependencies installed successfully")
        except subprocess.CalledProcessError:
            print("⚠️  Warning: Some dependencies failed to install")
            print("   The agent may still work with reduced functionality")
    else:
        print("⚠️  requirements.txt not found, skipping dependency installation")

def create_directories(install_dir):
    """Create necessary directories"""
    print(f"\n📁 Creating directories in {install_dir}...")
    
    directories = [
        install_dir,
        install_dir / 'src',
        install_dir / 'modules',
        install_dir / 'config',
        install_dir / 'logs',
        install_dir / 'reports'
    ]
    
    for directory in directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"   ✓ {directory}")
        except PermissionError:
            print(f"   ❌ Failed to create {directory} (permission denied)")
            return False
    
    return True

def copy_files(install_dir):
    """Copy agent files to installation directory"""
    print(f"\n📋 Copying agent files...")
    
    source_dir = Path(__file__).parent
    
    # Files and directories to copy
    items_to_copy = [
        ('src', 'src'),
        ('modules', 'modules'),
        ('config', 'config'),
        ('agent.py', 'agent.py'),
        ('requirements.txt', 'requirements.txt'),
        ('README.md', 'README.md')
    ]
    
    for source, dest in items_to_copy:
        source_path = source_dir / source
        dest_path = install_dir / dest
        
        try:
            if source_path.is_dir():
                if dest_path.exists():
                    shutil.rmtree(dest_path)
                shutil.copytree(source_path, dest_path)
            else:
                shutil.copy2(source_path, dest_path)
            print(f"   ✓ {source}")
        except Exception as e:
            print(f"   ❌ Failed to copy {source}: {e}")
            return False
    
    return True

def create_default_config(install_dir):
    """Create default configuration file"""
    print(f"\n⚙️  Creating default configuration...")
    
    config_file = install_dir / 'config' / 'agent_config.json'
    
    default_config = {
        "check_interval_hours": 4,
        "business_hours_start": 9,
        "business_hours_end": 18,
        "disk_cleanup_threshold_gb": 10,
        "disk_cleanup_critical_gb": 5,
        "max_remediations_per_day": 5,
        "enabled_modules": ["network", "disk", "service"],
        "enable_safety_checks": True,
        "log_level": "INFO",
        "version": "1.0.0"
    }
    
    try:
        import json
        with open(config_file, 'w') as f:
            json.dump(default_config, f, indent=2)
        print(f"   ✓ Configuration file created: {config_file}")
        return True
    except Exception as e:
        print(f"   ❌ Failed to create configuration: {e}")
        return False

def setup_service(platform, install_dir):
    """Setup platform-specific service"""
    print(f"\n🔧 Setting up background service...")
    
    if platform == 'windows':
        print("   ℹ️  Windows service setup:")
        print(f"      Run: python {install_dir}\\install_service.py")
    elif platform == 'macos':
        print("   ℹ️  macOS LaunchDaemon setup:")
        print(f"      Run: sudo python3 {install_dir}/install_service.py")
    else:  # Linux
        print("   ℹ️  Linux systemd service setup:")
        print(f"      Run: sudo python3 {install_dir}/install_service.py")
    
    return True

def main():
    """Main installation function"""
    print("="*60)
    print("Self-Healing Agent - Cross-Platform Installation")
    print("="*60)
    
    # Check Python version
    check_python_version()
    
    # Detect platform
    platform = detect_platform()
    print(f"✓ Platform detected: {platform}")
    
    if platform == 'unknown':
        print("❌ Unsupported platform")
        sys.exit(1)
    
    # Check privileges
    check_privileges()
    
    # Get installation directory
    install_dir = get_install_directory(platform)
    print(f"✓ Installation directory: {install_dir}")
    
    # Install dependencies
    install_dependencies()
    
    # Create directories
    if not create_directories(install_dir):
        print("\n❌ Installation failed: Could not create directories")
        sys.exit(1)
    
    # Copy files
    if not copy_files(install_dir):
        print("\n❌ Installation failed: Could not copy files")
        sys.exit(1)
    
    # Create default config
    if not create_default_config(install_dir):
        print("\n⚠️  Warning: Could not create default configuration")
    
    # Setup service
    setup_service(platform, install_dir)
    
    # Success message
    print("\n" + "="*60)
    print("✅ Installation completed successfully!")
    print("="*60)
    print(f"\nInstallation directory: {install_dir}")
    print(f"Configuration file: {install_dir}/config/agent_config.json")
    print(f"Log directory: {install_dir}/logs")
    
    print("\n📖 Next steps:")
    print("   1. Review and customize the configuration file")
    print("   2. Test the agent:")
    if platform == 'windows':
        print(f"      python {install_dir}\\agent.py --test-only")
    else:
        print(f"      python3 {install_dir}/agent.py --test-only")
    print("   3. Setup background service (see above)")
    print("   4. Run the agent:")
    if platform == 'windows':
        print(f"      python {install_dir}\\agent.py")
    else:
        print(f"      sudo python3 {install_dir}/agent.py")
    
    print("\n📚 Documentation: See README.md for detailed usage")
    print("")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Installation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Installation failed: {e}")
        sys.exit(1)
