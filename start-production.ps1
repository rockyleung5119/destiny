# Destiny Analysis System - 生产环境启动脚本
# Production Environment Startup Script

param(
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Status,
    [switch]$Logs
)

# 颜色输出函数
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检查端口是否被占用
function Test-Port {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# 停止服务
function Stop-Services {
    Write-Info "正在停止服务..."
    
    # 停止前端服务 (端口 3000)
    $frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*preview*" }
    if ($frontendProcess) {
        Stop-Process -Id $frontendProcess.Id -Force
        Write-Success "前端服务已停止"
    }
    
    # 停止后端服务 (端口 3001)
    $backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" }
    if ($backendProcess) {
        Stop-Process -Id $backendProcess.Id -Force
        Write-Success "后端服务已停止"
    }
    
    # 等待端口释放
    Start-Sleep -Seconds 3
}

# 启动后端服务
function Start-Backend {
    Write-Info "启动后端服务..."
    
    if (Test-Port 3001) {
        Write-Warning "端口 3001 已被占用，正在尝试停止现有服务..."
        Stop-Services
    }
    
    # 切换到后端目录并启动
    Push-Location backend
    try {
        Write-Info "在端口 3001 启动后端服务..."
        Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
        Start-Sleep -Seconds 5
        
        if (Test-Port 3001) {
            Write-Success "后端服务启动成功 (http://localhost:3001)"
        } else {
            Write-Error "后端服务启动失败"
            return $false
        }
    } finally {
        Pop-Location
    }
    return $true
}

# 启动前端服务
function Start-Frontend {
    Write-Info "启动前端服务..."
    
    if (Test-Port 3000) {
        Write-Warning "端口 3000 已被占用，正在尝试停止现有服务..."
        Stop-Services
    }
    
    Write-Info "在端口 3000 启动前端服务..."
    Start-Process -FilePath "npm" -ArgumentList "run", "preview", "--", "--port", "3000", "--host" -WindowStyle Hidden
    Start-Sleep -Seconds 8
    
    if (Test-Port 3000) {
        Write-Success "前端服务启动成功 (http://localhost:3000)"
        return $true
    } else {
        Write-Error "前端服务启动失败"
        return $false
    }
}

# 检查服务状态
function Get-ServiceStatus {
    Write-Info "检查服务状态..."
    
    $frontendRunning = Test-Port 3000
    $backendRunning = Test-Port 3001
    
    Write-Host "服务状态:" -ForegroundColor Cyan
    Write-Host "  前端服务 (端口 3000): " -NoNewline
    if ($frontendRunning) {
        Write-Host "运行中" -ForegroundColor Green
    } else {
        Write-Host "已停止" -ForegroundColor Red
    }
    
    Write-Host "  后端服务 (端口 3001): " -NoNewline
    if ($backendRunning) {
        Write-Host "运行中" -ForegroundColor Green
    } else {
        Write-Host "已停止" -ForegroundColor Red
    }
    
    if ($frontendRunning -and $backendRunning) {
        Write-Success "所有服务正常运行"
        Write-Info "访问地址: http://localhost:3000"
    } else {
        Write-Warning "部分服务未运行"
    }
}

# 显示日志
function Show-Logs {
    Write-Info "显示服务日志..."
    Write-Warning "注意: 此脚本启动的服务在后台运行，日志可能不可见"
    Write-Info "建议使用以下命令查看详细日志:"
    Write-Host "  前端: npm run preview -- --port 3000 --host" -ForegroundColor Yellow
    Write-Host "  后端: cd backend; node server.js" -ForegroundColor Yellow
}

# 主逻辑
if ($Stop) {
    Stop-Services
    Write-Success "所有服务已停止"
} elseif ($Restart) {
    Stop-Services
    Start-Sleep -Seconds 2
    if (Start-Backend) {
        if (Start-Frontend) {
            Write-Success "所有服务重启成功!"
            Get-ServiceStatus
        }
    }
} elseif ($Status) {
    Get-ServiceStatus
} elseif ($Logs) {
    Show-Logs
} else {
    # 默认启动服务
    Write-Info "=== Destiny Analysis System 生产环境启动 ==="
    Write-Info "正在启动生产环境服务..."
    
    # 检查构建文件
    if (-not (Test-Path "dist/index.html")) {
        Write-Warning "未找到构建文件，正在构建前端..."
        npm run build
    }
    
    # 启动服务
    if (Start-Backend) {
        if (Start-Frontend) {
            Write-Success "=== 启动完成! ==="
            Write-Info "前端地址: http://localhost:3000"
            Write-Info "后端API: http://localhost:3001/api"
            Write-Info ""
            Write-Info "使用以下命令管理服务:"
            Write-Info "  查看状态: .\start-production.ps1 -Status"
            Write-Info "  停止服务: .\start-production.ps1 -Stop"
            Write-Info "  重启服务: .\start-production.ps1 -Restart"
            Write-Info "  查看日志: .\start-production.ps1 -Logs"
        }
    }
}
