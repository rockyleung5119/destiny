# Cloudflare 部署脚本
# 用于部署前端到 Cloudflare Pages 和后端到 Cloudflare Workers

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "preview", "production")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackendOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$FrontendOnly
)

Write-Host "🚀 开始部署到 Cloudflare ($Environment 环境)" -ForegroundColor Green

# 检查必要的工具
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-Command "wrangler")) {
    Write-Host "❌ 错误: 未找到 wrangler CLI。请先安装: npm install -g wrangler" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ 错误: 未找到 npm。请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 部署后端
if (-not $FrontendOnly) {
    Write-Host "📦 部署后端到 Cloudflare Workers..." -ForegroundColor Yellow
    
    Set-Location backend
    
    try {
        if ($Environment -eq "production") {
            Write-Host "🔧 部署到生产环境..."
            wrangler deploy --env production
        } elseif ($Environment -eq "preview") {
            Write-Host "🔧 部署到预览环境..."
            wrangler deploy --env preview
        } else {
            Write-Host "🔧 部署到开发环境..."
            wrangler deploy
        }
        
        Write-Host "✅ 后端部署成功!" -ForegroundColor Green
    } catch {
        Write-Host "❌ 后端部署失败: $_" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
}

# 部署前端
if (-not $BackendOnly) {
    Write-Host "📦 部署前端到 Cloudflare Pages..." -ForegroundColor Yellow
    
    if (-not $SkipBuild) {
        Write-Host "🔨 构建前端..."
        try {
            if ($Environment -eq "production") {
                npm run build -- --mode production
            } else {
                npm run build -- --mode $Environment
            }
            Write-Host "✅ 前端构建成功!" -ForegroundColor Green
        } catch {
            Write-Host "❌ 前端构建失败: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "📤 上传到 Cloudflare Pages..."
    try {
        wrangler pages deploy dist --project-name destiny-frontend
        Write-Host "✅ 前端部署成功!" -ForegroundColor Green
    } catch {
        Write-Host "❌ 前端部署失败: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎉 部署完成!" -ForegroundColor Green
Write-Host "🌐 前端地址: https://destiny-frontend.pages.dev" -ForegroundColor Cyan
Write-Host "🔧 后端地址: https://destiny-backend.jerryliang5119.workers.dev" -ForegroundColor Cyan

# 显示环境变量提醒
Write-Host "`n📋 请确保在 Cloudflare Dashboard 中设置以下环境变量:" -ForegroundColor Yellow
Write-Host "Pages (前端):" -ForegroundColor White
Write-Host "  - VITE_API_BASE_URL=https://destiny-backend.jerryliang5119.workers.dev" -ForegroundColor Gray
Write-Host "  - VITE_STRIPE_PUBLISHABLE_KEY=pk_live_..." -ForegroundColor Gray
Write-Host "`nWorkers (后端):" -ForegroundColor White
Write-Host "  - 所有环境变量已在 wrangler.toml 中配置" -ForegroundColor Gray
