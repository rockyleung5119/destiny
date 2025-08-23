# 部署修复脚本 - 解决GitHub Actions部署问题
# PowerShell脚本，用于本地测试和手动部署

param(
    [string]$Target = "both",  # frontend, backend, both
    [switch]$Test = $false,    # 仅测试，不实际部署
    [switch]$Verbose = $false  # 详细输出
)

Write-Host "🚀 部署修复脚本启动" -ForegroundColor Green
Write-Host "目标: $Target" -ForegroundColor Cyan

# 检查必要工具
function Test-Prerequisites {
    Write-Host "`n🔍 检查部署前提条件..." -ForegroundColor Yellow
    
    # 检查Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js 未安装或不在PATH中" -ForegroundColor Red
        return $false
    }
    
    # 检查npm
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm 未安装或不在PATH中" -ForegroundColor Red
        return $false
    }
    
    # 检查wrangler
    try {
        $wranglerVersion = wrangler --version
        Write-Host "✅ wrangler: $wranglerVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ wrangler 未安装，正在安装..." -ForegroundColor Yellow
        npm install -g wrangler@latest
    }
    
    return $true
}

# 部署前端
function Deploy-Frontend {
    Write-Host "`n🎨 部署前端到Cloudflare Pages..." -ForegroundColor Blue
    
    try {
        # 安装依赖
        Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
        npm ci --prefer-offline --no-audit
        
        # 构建
        Write-Host "🔨 构建前端..." -ForegroundColor Yellow
        npm run build
        
        # 检查构建输出
        if (Test-Path "dist") {
            Write-Host "✅ 构建成功，输出目录:" -ForegroundColor Green
            Get-ChildItem dist | Format-Table Name, Length, LastWriteTime
        } else {
            Write-Host "❌ 构建失败，未找到dist目录" -ForegroundColor Red
            return $false
        }
        
        if (-not $Test) {
            # 部署到Cloudflare Pages
            Write-Host "🚀 部署到Cloudflare Pages..." -ForegroundColor Yellow
            wrangler pages deploy dist --project-name=destiny-frontend --compatibility-date=2024-08-01
            
            # 验证部署
            Write-Host "🧪 验证部署..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            
            try {
                $response = Invoke-WebRequest -Uri "https://indicate.top" -Method GET -TimeoutSec 30
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ 前端部署成功，网站可访问" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ 前端部署完成，但响应码: $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️ 前端部署完成，但验证失败: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        return $true
    } catch {
        Write-Host "❌ 前端部署失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 部署后端
function Deploy-Backend {
    Write-Host "`n⚙️ 部署后端到Cloudflare Workers..." -ForegroundColor Blue
    
    try {
        # 切换到后端目录
        Push-Location backend
        
        # 检查必要文件
        Write-Host "📋 检查后端文件..." -ForegroundColor Yellow
        if (-not (Test-Path "worker.ts")) {
            Write-Host "❌ worker.ts 文件不存在" -ForegroundColor Red
            return $false
        }
        
        if (-not (Test-Path "wrangler.toml")) {
            Write-Host "❌ wrangler.toml 文件不存在" -ForegroundColor Red
            return $false
        }
        
        # 准备package.json
        if (-not (Test-Path "package.json")) {
            if (Test-Path "workers-package.json") {
                Write-Host "📦 使用 workers-package.json 作为 package.json" -ForegroundColor Yellow
                Copy-Item "workers-package.json" "package.json"
            } else {
                Write-Host "❌ 未找到 package.json 或 workers-package.json" -ForegroundColor Red
                return $false
            }
        }
        
        # 安装依赖
        Write-Host "📦 安装后端依赖..." -ForegroundColor Yellow
        Remove-Item -Path "node_modules", "package-lock.json" -Recurse -Force -ErrorAction SilentlyContinue
        npm install
        
        # 验证配置
        Write-Host "🔍 验证后端配置..." -ForegroundColor Yellow
        $workerContent = Get-Content "worker.ts" -Raw
        if ($workerContent -match "StripeAPIClient") {
            Write-Host "✅ Stripe API客户端已找到" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 未找到Stripe API客户端" -ForegroundColor Yellow
        }
        
        if (-not $Test) {
            # 部署
            Write-Host "🚀 部署到Cloudflare Workers..." -ForegroundColor Yellow
            wrangler deploy --compatibility-date=2024-08-01 --minify=false --keep-vars
            
            # 验证部署
            Write-Host "🧪 验证后端部署..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
            
            try {
                $healthResponse = Invoke-WebRequest -Uri "https://api.indicate.top/api/health" -Method GET -TimeoutSec 30
                if ($healthResponse.StatusCode -eq 200) {
                    Write-Host "✅ 后端健康检查通过" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ 后端健康检查响应码: $($healthResponse.StatusCode)" -ForegroundColor Yellow
                }
                
                $stripeResponse = Invoke-WebRequest -Uri "https://api.indicate.top/api/stripe/health" -Method GET -TimeoutSec 30
                if ($stripeResponse.StatusCode -eq 200) {
                    Write-Host "✅ Stripe健康检查通过" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ Stripe健康检查响应码: $($stripeResponse.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️ 后端部署完成，但验证失败: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        return $true
    } catch {
        Write-Host "❌ 后端部署失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    } finally {
        Pop-Location
    }
}

# 主执行逻辑
function Main {
    if (-not (Test-Prerequisites)) {
        Write-Host "❌ 前提条件检查失败，退出" -ForegroundColor Red
        exit 1
    }
    
    $success = $true
    
    if ($Target -eq "frontend" -or $Target -eq "both") {
        $success = $success -and (Deploy-Frontend)
    }
    
    if ($Target -eq "backend" -or $Target -eq "both") {
        $success = $success -and (Deploy-Backend)
    }
    
    if ($success) {
        Write-Host "`n🎉 部署完成！" -ForegroundColor Green
        Write-Host "🔗 前端: https://indicate.top" -ForegroundColor Cyan
        Write-Host "🔗 后端: https://api.indicate.top" -ForegroundColor Cyan
        Write-Host "🔗 健康检查: https://api.indicate.top/api/health" -ForegroundColor Cyan
        Write-Host "🔗 Stripe检查: https://api.indicate.top/api/stripe/health" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ 部署过程中出现错误" -ForegroundColor Red
        exit 1
    }
}

# 执行主函数
Main
