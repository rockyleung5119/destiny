# Cloudflare Workers 机密变量设置脚本
# 这个脚本用于设置敏感的环境变量（API Keys, Secrets等）

Write-Host "🔐 Setting up Cloudflare Workers Secrets..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 设置机密变量（敏感信息）
Write-Host "🔑 Setting DEEPSEEK_API_KEY..." -ForegroundColor Cyan
echo "sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn" | wrangler secret put DEEPSEEK_API_KEY

Write-Host "🔑 Setting JWT_SECRET..." -ForegroundColor Cyan
echo "wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA" | wrangler secret put JWT_SECRET

Write-Host "📧 Setting RESEND_API_KEY..." -ForegroundColor Cyan
echo "re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP" | wrangler secret put RESEND_API_KEY

Write-Host "💳 Setting STRIPE_SECRET_KEY..." -ForegroundColor Cyan
echo "sk_test_your_stripe_secret_key_here" | wrangler secret put STRIPE_SECRET_KEY

Write-Host "💳 Setting STRIPE_PUBLISHABLE_KEY..." -ForegroundColor Cyan
echo "pk_test_your_stripe_publishable_key_here" | wrangler secret put STRIPE_PUBLISHABLE_KEY

Write-Host "🔗 Setting STRIPE_WEBHOOK_SECRET..." -ForegroundColor Cyan
echo "whsec_your_webhook_secret_here" | wrangler secret put STRIPE_WEBHOOK_SECRET

Write-Host ""
Write-Host "✅ All secrets have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'wrangler deploy' to deploy with new configuration"
Write-Host "2. Test with 'wrangler dev' for local development"
Write-Host "3. Verify with '/api/health' and '/api/ai-status' endpoints"
Write-Host ""
