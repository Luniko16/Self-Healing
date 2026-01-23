#!/usr/bin/env python3
"""
ServicePulse Application Startup Script
Starts the unified Flask + React application
"""

import sys
import os
import subprocess
from pathlib import Path

def check_build():
    """Check if React build exists"""
    build_path = Path(__file__).parent / 'build'
    if not build_path.exists() or not (build_path / 'index.html').exists():
        print("⚠️  React build not found. Building now...")
        try:
            result = subprocess.run(['npm', 'run', 'build'], 
                                  capture_output=True, text=True, timeout=120)
            if result.returncode == 0:
                print("✓ React build completed successfully")
            else:
                print(f"❌ React build failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("⚠️  Build is taking longer than expected, but continuing...")
        except Exception as e:
            print(f"❌ Build error: {e}")
            return False
    else:
        print("✓ React build found")
    return True

def start_dashboard():
    """Start the Flask dashboard"""
    print("🚀 Starting ServicePulse Dashboard...")
    print("="*60)
    
    # Add paths for imports
    dashboard_path = Path(__file__).parent / 'CrossPlatform' / 'web'
    sys.path.insert(0, str(dashboard_path))
    
    try:
        from dashboard import main
        main()
    except KeyboardInterrupt:
        print("\n👋 ServicePulse Dashboard stopped by user")
    except Exception as e:
        print(f"❌ Error starting dashboard: {e}")
        return False
    
    return True

def main():
    """Main startup function"""
    print("="*60)
    print("ServicePulse - Unified IT Management Dashboard")
    print("="*60)
    
    # Check React build
    if not check_build():
        print("❌ Cannot start without React build")
        sys.exit(1)
    
    # Start dashboard
    if not start_dashboard():
        sys.exit(1)

if __name__ == "__main__":
    main()