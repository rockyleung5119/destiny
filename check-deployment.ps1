# 部署状态检查脚本
# 用于验证GitHub Actions部署是否成功

Write-Host "🔍 检查部署状态..." -ForegroundColor Green

# 检查前端部署
Write-Host "`n🎨 检查前端部署状态..." -ForegroundColor Blue

$frontendUrls = @(
    "https://indicate.top",
    "https://destiny-frontend.pages.dev"
)

foreach ($url in $frontendUrls) {
    try {
        Write-Host "检查: $url" -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $url -Method HEAD -TimeoutSec 30 -ErrorAction Stop
        Write-Host "✅ $url - 状态码: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $url - 错误: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 检查后端部署
Write-Host "`n⚙️ 检查后端部署状态..." -ForegroundColor Blue

$backendEndpoints = @(
    "https://api.indicate.top/api/health",
    "https://api.indicate.top/api/stripe/health",
    "https://destiny-backend.jerryliang5119.workers.dev/api/health"
)

foreach ($endpoint in $backendEndpoints) {
    try {
        Write-Host "检查: $endpoint" -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 30 -ErrorAction Stop
        $content = $response.Content | ConvertFrom-Json
        Write-Host "✅ $endpoint - 状态码: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   响应: $($content | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ $endpoint - 错误: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 检查特定功能
Write-Host "`n🧪 检查特定功能..." -ForegroundColor Blue

# 检查Stripe配置
try {
    Write-Host "检查Stripe配置..." -ForegroundColor Yellow
    $stripeResponse = Invoke-WebRequest -Uri "https://api.indicate.top/api/stripe/health" -Method GET -TimeoutSec 30
    $stripeData = $stripeResponse.Content | ConvertFrom-Json
    
    if ($stripeData.stripe.secretKeyConfigured) {
        Write-Host "✅ Stripe后端密钥已配置" -ForegroundColor Green
    } else {
        Write-Host "❌ Stripe后端密钥未配置" -ForegroundColor Red
    }
    
    if ($stripeData.stripe.webhookSecretConfigured) {
        Write-Host "✅ Stripe Webhook密钥已配置" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Stripe Webhook密钥未配置" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Stripe配置检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 检查认证API
try {
    Write-Host "检查认证API..." -ForegroundColor Yellow
    $authResponse = Invoke-WebRequest -Uri "https://api.indicate.top/api/auth/health" -Method GET -TimeoutSec 30 -ErrorAction SilentlyContinue
    if ($authResponse.StatusCode -eq 200) {
        Write-Host "✅ 认证API可用" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 认证API响应异常: $($authResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ 认证API检查失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n📊 部署状态检查完成!" -ForegroundColor Green
Write-Host "如果发现问题，请运行 .\deploy-fix.ps1 进行修复" -ForegroundColor Cyan
