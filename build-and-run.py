#!/usr/bin/env python3
"""
Build and Run Script for Unified ServicePulse Application
Builds React frontend and starts Flask backend
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return success status"""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, shell=True, cwd=cwd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        return False

def build_react_app():
    """Build the React application"""
    print("=" * 60)
    print("Building React Frontend...")
    print("=" * 60)
    
    # Check if node_modules exists
    if not Path("node_modules").exists():
        print("Installing Node.js dependencies...")
        if not run_command("npm install"):
            return False
    
    # Build React app
    print("Building React application...")
    if not run_command("npm run build"):
        return False
    
    print("✅ React build completed successfully!")
    return True

def start_flask_server():
    """Start the Flask server"""
    print("=" * 60)
    print("Starting Flask Backend Server...")
    print("=" * 60)
    
    # Install Python dependencies
    print("Installing Python dependencies...")
    if not run_command("pip install -r requirements.txt"):
        print("⚠️  Warning: Could not install Python dependencies")
    
    # Start Flask server
    print("Starting unified ServicePulse application...")
    print("🚀 Application will be available at: http://localhost:5000")
    print("📱 React frontend served by Flask backend")
    print("🔧 API endpoints available at: http://localhost:5000/api/*")
    print("🔄 Legacy Flask templates at: http://localhost:5000/legacy/*")
    print("")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    # Change to the correct directory and run Flask
    os.chdir("CrossPlatform/web")
    run_command("python dashboard.py")

def main():
    """Main build and run process"""
    print("🔧 ServicePulse - Unified Application Builder")
    print("Building React frontend and starting Flask backend...")
    print("")
    
    # Check if we're in the right directory
    if not Path("package.json").exists():
        print("❌ Error: package.json not found. Please run this script from the project root.")
        sys.exit(1)
    
    # Build React app
    if not build_react_app():
        print("❌ Failed to build React application")
        sys.exit(1)
    
    # Start Flask server
    start_flask_server()

if __name__ == "__main__":
    main()