# Cloudflare Stripe配置检查和修复脚本
# PowerShell版本

param(
    [switch]$Fix,
    [switch]$Verbose
)

Write-Host "🌐 Cloudflare Stripe配置检查工具" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$testStripeKey = "pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um"

# 1. 检查后端配置
Write-Host "📦 检查后端配置..." -ForegroundColor Blue
Set-Location backend

Write-Host "检查Cloudflare Workers secrets..."
try {
    $secretsList = wrangler secret list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Wrangler连接正常" -ForegroundColor Green
        Write-Host $secretsList
    } else {
        Write-Host "❌ Wrangler连接失败" -ForegroundColor Red
        Write-Host $secretsList
    }
} catch {
    Write-Host "❌ 无法运行wrangler命令" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "测试后端API健康状态..."
try {
    $healthResponse = Invoke-RestMethod -Uri "https://api.indicate.top/api/stripe/health" -Method Get -TimeoutSec 10
    if ($healthResponse.success) {
        Write-Host "✅ 后端API正常" -ForegroundColor Green
        Write-Host "   - Secret Key: $($healthResponse.stripe.backend.secretKeyConfigured ? '已配置' : '未配置')"
        Write-Host "   - Webhook Secret: $($healthResponse.stripe.backend.webhookSecretConfigured ? '已配置' : '未配置')"
        Write-Host "   - 支付系统: $($healthResponse.stripe.systemStatus.paymentSystemEnabled ? '启用' : '禁用')"
    } else {
        Write-Host "❌ 后端API异常" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 无法连接后端API" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)"
}

# 2. 检查前端配置
Set-Location ..
Write-Host ""
Write-Host "🌐 检查前端配置..." -ForegroundColor Blue

Write-Host "检查本地环境文件..."
$envFiles = @('.env', '.env.production', '.env.local')
foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile | Select-String "VITE_STRIPE_PUBLISHABLE_KEY"
        if ($envContent) {
            Write-Host "✅ $envFile 配置正常" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "   内容: $($envContent.Line)"
            }
        } else {
            Write-Host "⚠️ $envFile 缺少Stripe配置" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ $envFile 不存在" -ForegroundColor Yellow
    }
}

# 3. 获取前端配置指导
Write-Host ""
Write-Host "📋 获取前端配置指导..." -ForegroundColor Blue
try {
    $configResponse = Invoke-RestMethod -Uri "https://api.indicate.top/api/stripe/frontend-config" -Method Get -TimeoutSec 10
    if ($configResponse.success) {
        Write-Host "✅ 配置指导获取成功" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🔧 Cloudflare Pages 设置步骤:" -ForegroundColor Yellow
        foreach ($step in $configResponse.cloudflarePages.setupSteps) {
            Write-Host "   $step"
        }
        
        Write-Host ""
        Write-Host "⚡ 临时修复代码:" -ForegroundColor Yellow
        Write-Host "   $($configResponse.temporaryFix.code)"
    }
} catch {
    Write-Host "❌ 无法获取配置指导" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)"
}

# 4. 测试前端应用
Write-Host ""
Write-Host "🌐 测试前端应用..." -ForegroundColor Blue
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://destiny-frontend.pages.dev" -Method Get -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ 前端应用可访问" -ForegroundColor Green
        Write-Host "   URL: https://destiny-frontend.pages.dev"
        Write-Host "   状态码: $($frontendResponse.StatusCode)"
    } else {
        Write-Host "❌ 前端应用访问异常" -ForegroundColor Red
        Write-Host "   状态码: $($frontendResponse.StatusCode)"
    }
} catch {
    Write-Host "❌ 前端应用连接失败" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)"
}

# 5. 修复选项
Write-Host ""
Write-Host "🎯 修复选项:" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan

if ($Fix) {
    Write-Host ""
    Write-Host "🔧 应用自动修复..." -ForegroundColor Blue
    
    # 检查是否有wrangler权限
    try {
        Write-Host "尝试通过wrangler设置前端环境变量..."
        # 注意：这需要Cloudflare Pages的wrangler支持
        Write-Host "⚠️ Cloudflare Pages环境变量需要在Dashboard中手动设置" -ForegroundColor Yellow
        Write-Host "   自动设置功能暂不可用"
    } catch {
        Write-Host "❌ 自动修复失败" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "选项1: 立即修复（临时）" -ForegroundColor Green
    Write-Host "在生产网站浏览器控制台运行:"
    Write-Host "localStorage.setItem('STRIPE_TEMP_KEY', '$testStripeKey');" -ForegroundColor Yellow
    Write-Host "location.reload();" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "选项2: 永久修复（推荐）" -ForegroundColor Green
    Write-Host "在Cloudflare Pages Dashboard中设置:"
    Write-Host "1. 访问 https://dash.cloudflare.com/" -ForegroundColor Yellow
    Write-Host "2. Pages → destiny-frontend → Settings" -ForegroundColor Yellow
    Write-Host "3. Environment variables → Add variable" -ForegroundColor Yellow
    Write-Host "4. 变量名: VITE_STRIPE_PUBLISHABLE_KEY" -ForegroundColor Yellow
    Write-Host "5. 值: $testStripeKey" -ForegroundColor Yellow
    Write-Host "6. 环境: Production" -ForegroundColor Yellow
    Write-Host "7. 保存并等待重新部署" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "选项3: 运行自动修复" -ForegroundColor Green
    Write-Host "重新运行此脚本并添加 -Fix 参数:" -ForegroundColor Yellow
    Write-Host ".\check-cloudflare-stripe.ps1 -Fix" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 诊断完成!" -ForegroundColor Green
Write-Host "详细日志已输出，请根据建议进行修复。" -ForegroundColor Green

# 运行JavaScript诊断工具
Write-Host ""
Write-Host "🔍 运行详细诊断..." -ForegroundColor Blue
try {
    node cloudflare-env-diagnostic.js
} catch {
    Write-Host "⚠️ 无法运行JavaScript诊断工具" -ForegroundColor Yellow
    Write-Host "   请确保已安装Node.js"
}
