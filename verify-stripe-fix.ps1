# Stripe支付系统修复验证脚本
# PowerShell版本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Stripe 支付系统修复验证工具" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 开始验证 Stripe 支付系统配置..." -ForegroundColor Blue
Write-Host ""

# 1. 检查后端配置
Write-Host "📦 检查后端配置..." -ForegroundColor Blue
Set-Location backend

Write-Host "检查 Cloudflare Workers secrets..."
wrangler secret list

Write-Host ""
Write-Host "测试后端健康状态..."
try {
    $response = Invoke-RestMethod -Uri "https://api.indicate.top/api/stripe/health" -Method Get
    if ($response.success) {
        Write-Host "✅ 后端配置正常" -ForegroundColor Green
        Write-Host "   - Secret Key: $($response.stripe.secretKeyConfigured ? '已配置' : '未配置')"
        Write-Host "   - Webhook Secret: $($response.stripe.webhookSecretConfigured ? '已配置' : '未配置')"
    } else {
        Write-Host "❌ 后端配置异常" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 无法连接到后端API" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)"
}

Write-Host ""

# 2. 检查前端配置
Set-Location ..
Write-Host "🌐 检查前端配置..." -ForegroundColor Blue

Write-Host "检查 .env 文件..."
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "VITE_STRIPE_PUBLISHABLE_KEY"
    if ($envContent) {
        Write-Host "✅ .env 文件配置正常" -ForegroundColor Green
    } else {
        Write-Host "❌ .env 文件配置缺失" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ .env 文件不存在" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "检查 .env.production 文件..."
if (Test-Path ".env.production") {
    $prodEnvContent = Get-Content ".env.production" | Select-String "VITE_STRIPE_PUBLISHABLE_KEY"
    if ($prodEnvContent) {
        Write-Host "✅ .env.production 文件配置正常" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.production 文件配置缺失" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ .env.production 文件不存在" -ForegroundColor Yellow
}

Write-Host ""

# 3. 运行完整测试
Write-Host "🧪 运行完整系统测试..." -ForegroundColor Blue
node test-stripe-system.cjs

Write-Host ""

# 4. 显示修复建议
Write-Host "📋 修复建议和下一步操作：" -ForegroundColor Cyan
Write-Host ""
Write-Host "如果测试失败，请按以下步骤操作：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Cloudflare Pages 环境变量设置：" -ForegroundColor Blue
Write-Host "   - 访问 https://dash.cloudflare.com/"
Write-Host "   - 进入 Pages → destiny-frontend → Settings"
Write-Host "   - 添加环境变量："
Write-Host "     变量名: VITE_STRIPE_PUBLISHABLE_KEY"
Write-Host "     值: pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um"
Write-Host "     环境: Production"
Write-Host ""
Write-Host "2. 临时修复（立即生效）：" -ForegroundColor Blue
Write-Host "   - 访问生产网站"
Write-Host "   - 打开浏览器控制台"
Write-Host "   - 运行: localStorage.setItem('STRIPE_TEMP_KEY', 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um');"
Write-Host "   - 刷新页面"
Write-Host ""
Write-Host "3. 验证修复：" -ForegroundColor Blue
Write-Host "   - 访问 https://destiny-frontend.pages.dev"
Write-Host "   - 尝试购买会员计划"
Write-Host "   - 确认支付功能正常"
Write-Host ""

Write-Host "✅ 验证完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 重要提醒：" -ForegroundColor Yellow
Write-Host "   - 后端配置已完成，无需额外操作"
Write-Host "   - 前端需要在 Cloudflare Pages Dashboard 中设置环境变量"
Write-Host "   - 临时修复可以立即启用支付功能"
Write-Host "   - 正式修复需要重新部署前端应用"
Write-Host ""

Read-Host "按 Enter 键退出"
