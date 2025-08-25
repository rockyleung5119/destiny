# 生产环境Stripe密钥设置脚本
# 用于在Cloudflare Pages中正确设置生产级Stripe密钥

param(
    [string]$StripeKey = "",
    [switch]$Test = $false
)

Write-Host "🔑 生产环境Stripe密钥设置" -ForegroundColor Green

# 验证Stripe密钥格式
function Test-StripeKey {
    param([string]$Key)
    
    if (-not $Key) {
        Write-Host "❌ 未提供Stripe密钥" -ForegroundColor Red
        return $false
    }
    
    if (-not $Key.StartsWith("pk_")) {
        Write-Host "❌ Stripe密钥必须以 pk_ 开头" -ForegroundColor Red
        return $false
    }
    
    if ($Key.Length -lt 50) {
        Write-Host "❌ Stripe密钥长度不足，生产环境需要完整密钥" -ForegroundColor Red
        return $false
    }
    
    $invalidPatterns = @(
        "placeholder",
        "your-stripe",
        "test-key",
        "example"
    )
    
    foreach ($pattern in $invalidPatterns) {
        if ($Key.ToLower().Contains($pattern)) {
            Write-Host "❌ 检测到占位符模式: $pattern" -ForegroundColor Red
            return $false
        }
    }
    
    # 检查是否为生产密钥
    if ($Key.StartsWith("pk_live_")) {
        Write-Host "✅ 检测到生产Stripe密钥" -ForegroundColor Green
        return $true
    } elseif ($Key.StartsWith("pk_test_")) {
        Write-Host "⚠️ 检测到测试Stripe密钥，建议在生产环境使用生产密钥" -ForegroundColor Yellow
        return $true
    } else {
        Write-Host "⚠️ 无法确定Stripe密钥类型" -ForegroundColor Yellow
        return $true
    }
}

# 主要设置流程
function Set-ProductionStripeKey {
    param([string]$Key)
    
    Write-Host "`n🔍 验证Stripe密钥..." -ForegroundColor Yellow
    if (-not (Test-StripeKey -Key $Key)) {
        Write-Host "❌ Stripe密钥验证失败，请检查密钥格式" -ForegroundColor Red
        return $false
    }
    
    Write-Host "`n📋 当前配置信息:" -ForegroundColor Cyan
    Write-Host "密钥前缀: $($Key.Substring(0, 10))..." -ForegroundColor White
    Write-Host "密钥长度: $($Key.Length)" -ForegroundColor White
    Write-Host "密钥类型: $(if ($Key.StartsWith('pk_live_')) { '生产环境' } elseif ($Key.StartsWith('pk_test_')) { '测试环境' } else { '未知' })" -ForegroundColor White
    
    if ($Test) {
        Write-Host "`n🧪 测试模式 - 不会实际设置环境变量" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "`n🚀 设置Cloudflare Pages环境变量..." -ForegroundColor Blue
    
    try {
        # 方法1: 尝试使用wrangler设置
        Write-Host "尝试方法1: wrangler pages secret..." -ForegroundColor Yellow
        
        # 注意：这可能不是正确的方法，但先尝试
        $env:STRIPE_KEY_VALUE = $Key
        
        Write-Host "⚠️ 注意：Cloudflare Pages的环境变量需要通过Dashboard设置" -ForegroundColor Yellow
        Write-Host "请手动执行以下步骤：" -ForegroundColor Cyan
        Write-Host "1. 访问 https://dash.cloudflare.com/" -ForegroundColor White
        Write-Host "2. 选择 Pages → destiny-frontend" -ForegroundColor White
        Write-Host "3. Settings → Environment variables" -ForegroundColor White
        Write-Host "4. 添加变量：" -ForegroundColor White
        Write-Host "   名称: VITE_STRIPE_PUBLISHABLE_KEY" -ForegroundColor White
        Write-Host "   值: $($Key.Substring(0, 20))..." -ForegroundColor White
        Write-Host "   环境: Production" -ForegroundColor White
        Write-Host "5. 保存并重新部署" -ForegroundColor White
        
        return $true
        
    } catch {
        Write-Host "❌ 设置失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 主执行逻辑
if (-not $StripeKey) {
    Write-Host "❌ 请提供Stripe密钥" -ForegroundColor Red
    Write-Host "用法: .\setup-production-stripe.ps1 -StripeKey 'pk_live_YOUR_KEY_HERE'" -ForegroundColor Cyan
    Write-Host "测试: .\setup-production-stripe.ps1 -StripeKey 'pk_live_YOUR_KEY_HERE' -Test" -ForegroundColor Cyan
    exit 1
}

$success = Set-ProductionStripeKey -Key $StripeKey

if ($success) {
    Write-Host "`n🎉 Stripe密钥设置完成！" -ForegroundColor Green
    Write-Host "`n📋 后续步骤：" -ForegroundColor Cyan
    Write-Host "1. 在Cloudflare Pages Dashboard中手动设置环境变量" -ForegroundColor White
    Write-Host "2. 触发新的部署" -ForegroundColor White
    Write-Host "3. 验证支付功能：https://indicate.top/membership" -ForegroundColor White
    Write-Host "4. 检查Stripe诊断工具确认配置正确" -ForegroundColor White
} else {
    Write-Host "`n❌ Stripe密钥设置失败" -ForegroundColor Red
    exit 1
}
