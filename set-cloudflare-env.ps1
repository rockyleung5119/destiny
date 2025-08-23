Write-Host "Setting Cloudflare Workers Environment Variables..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "Setting CORS_ORIGIN..." -ForegroundColor Yellow
echo "https://destiny-frontend.pages.dev" | wrangler secret put CORS_ORIGIN

Write-Host "Setting DEEPSEEK_API_KEY..." -ForegroundColor Yellow
echo "YOUR_DEEPSEEK_API_KEY_HERE" | wrangler secret put DEEPSEEK_API_KEY

Write-Host "Setting DEEPSEEK_BASE_URL..." -ForegroundColor Yellow
echo "https://api.siliconflow.cn/v1/chat/completions" | wrangler secret put DEEPSEEK_BASE_URL

Write-Host "Setting DEEPSEEK_MODEL..." -ForegroundColor Yellow
echo "Pro/deepseek-ai/DeepSeek-R1" | wrangler secret put DEEPSEEK_MODEL

Write-Host "Setting FRONTEND_URL..." -ForegroundColor Yellow
echo "https://destiny-frontend.pages.dev" | wrangler secret put FRONTEND_URL

Write-Host "Setting JWT_SECRET..." -ForegroundColor Yellow
echo "YOUR_JWT_SECRET_HERE" | wrangler secret put JWT_SECRET

Write-Host "Setting RESEND_API_KEY..." -ForegroundColor Yellow
echo "YOUR_RESEND_API_KEY_HERE" | wrangler secret put RESEND_API_KEY

Write-Host "Setting RESEND_FROM_EMAIL..." -ForegroundColor Yellow
echo "info@info.indicate.top" | wrangler secret put RESEND_FROM_EMAIL

Write-Host "Setting RESEND_FROM_NAME..." -ForegroundColor Yellow
echo "indicate.top" | wrangler secret put RESEND_FROM_NAME

Write-Host "Setting STRIPE_SECRET_KEY..." -ForegroundColor Yellow
echo "YOUR_STRIPE_SECRET_KEY_HERE" | wrangler secret put STRIPE_SECRET_KEY

Write-Host "Setting STRIPE_PUBLISHABLE_KEY..." -ForegroundColor Yellow
echo "YOUR_STRIPE_PUBLISHABLE_KEY_HERE" | wrangler secret put STRIPE_PUBLISHABLE_KEY

Write-Host "Setting STRIPE_WEBHOOK_SECRET..." -ForegroundColor Yellow
echo "whsec_test_placeholder" | wrangler secret put STRIPE_WEBHOOK_SECRET

Write-Host "Setting EMAIL_SERVICE..." -ForegroundColor Yellow
echo "resend" | wrangler secret put EMAIL_SERVICE

Write-Host "Setting NODE_ENV..." -ForegroundColor Yellow
echo "production" | wrangler secret put NODE_ENV

Write-Host ""
Write-Host "All environment variables have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: VITE_API_BASE_URL is for frontend only, not needed in Cloudflare Workers." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"
