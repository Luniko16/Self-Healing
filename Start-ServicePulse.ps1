#!/usr/bin/env powershell
<#
.SYNOPSIS
    Start ServicePulse Unified Application
.DESCRIPTION
    Builds React frontend and starts Flask backend server
.EXAMPLE
    .\Start-ServicePulse.ps1
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ServicePulse - Unified Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Starting ServicePulse unified application..." -ForegroundColor Green
Write-Host "This will build the React frontend and start the Flask backend." -ForegroundColor Yellow
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.7+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 14+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Building and starting application..." -ForegroundColor Cyan

# Run the build and start script
python build-and-run.py

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")