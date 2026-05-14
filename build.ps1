# Build and Package the Electron Application
# Usage: .\build.ps1 [-Target win|mac|linux|all] [-Mode build|pack|dist]

param(
    [ValidateSet("win", "mac", "linux", "all")]
    [string]$Target = "win",
    
    [ValidateSet("build", "pack", "dist")]
    [string]$Mode = "dist"
)

function Write-Step {
    param([string]$Message)
    Write-Host "`n=> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "`n✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "`n✗ $Message" -ForegroundColor Red
}

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "npm is not installed or not in PATH"
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Step "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to install dependencies"
        exit 1
    }
}

switch ($Mode) {
    "build" {
        Write-Step "Building the application..."
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build completed successfully"
        } else {
            Write-Error-Custom "Build failed"
            exit 1
        }
    }
    "pack" {
        Write-Step "Building and packing the application (unpacked)..."
        switch ($Target) {
            "win" { npm run pack:win }
            "mac" { npm run pack:mac }
            "linux" { npm run pack:linux }
            "all" { npm run pack }
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Packing completed successfully"
            Write-Host "Output directory: dist/" -ForegroundColor Yellow
        } else {
            Write-Error-Custom "Packing failed"
            exit 1
        }
    }
    "dist" {
        Write-Step "Building and distributing the application (installer)..."
        switch ($Target) {
            "win" { npm run dist:win }
            "mac" { npm run dist:mac }
            "linux" { npm run dist:linux }
            "all" { npm run dist }
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Distribution completed successfully"
            Write-Host "Output directory: dist/" -ForegroundColor Yellow
        } else {
            Write-Error-Custom "Distribution failed"
            exit 1
        }
    }
}
