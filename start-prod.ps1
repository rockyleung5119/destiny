# Destiny Analysis System - Production Startup Script
param(
    [switch]$Stop,
    [switch]$Status
)

function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Port {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Stop-Services {
    Write-Info "Stopping services..."
    
    # Stop processes using ports 3000 and 3001
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
    foreach ($process in $processes) {
        try {
            Stop-Process -Id $process.Id -Force
        } catch {
            # Ignore errors
        }
    }
    
    Start-Sleep -Seconds 3
    Write-Success "Services stopped"
}

function Get-ServiceStatus {
    Write-Info "Checking service status..."
    
    $frontendRunning = Test-Port 3000
    $backendRunning = Test-Port 3001
    
    Write-Host "Service Status:" -ForegroundColor Cyan
    Write-Host "  Frontend (port 3000): " -NoNewline
    if ($frontendRunning) {
        Write-Host "Running" -ForegroundColor Green
    } else {
        Write-Host "Stopped" -ForegroundColor Red
    }
    
    Write-Host "  Backend (port 3001): " -NoNewline
    if ($backendRunning) {
        Write-Host "Running" -ForegroundColor Green
    } else {
        Write-Host "Stopped" -ForegroundColor Red
    }
    
    if ($frontendRunning -and $backendRunning) {
        Write-Success "All services are running"
        Write-Info "Access URL: http://localhost:3000"
    }
}

if ($Stop) {
    Stop-Services
} elseif ($Status) {
    Get-ServiceStatus
} else {
    Write-Info "=== Starting Destiny Analysis System in Production Mode ==="
    
    # Check if build exists
    if (-not (Test-Path "dist/index.html")) {
        Write-Info "Build not found, building frontend..."
        npm run build
    }
    
    # Start backend
    Write-Info "Starting backend service on port 3001..."
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd backend; node server.js" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    
    # Start frontend
    Write-Info "Starting frontend service on port 3000..."
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "npm run preview -- --port 3000 --host" -WindowStyle Minimized
    Start-Sleep -Seconds 8
    
    Get-ServiceStatus
    
    Write-Success "=== Startup Complete! ==="
    Write-Info "Frontend: http://localhost:3000"
    Write-Info "Backend API: http://localhost:3001/api"
    Write-Info ""
    Write-Info "Management commands:"
    Write-Info "  Check status: .\start-prod.ps1 -Status"
    Write-Info "  Stop services: .\start-prod.ps1 -Stop"
}
