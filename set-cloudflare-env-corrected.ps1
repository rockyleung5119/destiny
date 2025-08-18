Write-Host "Setting Cloudflare Workers Environment Variables..." -ForegroundColor Green
Write-Host ""

Set-Location backend

Write-Host "Setting CORS_ORIGIN..." -ForegroundColor Yellow
wrangler secret put CORS_ORIGIN --text "https://destiny-frontend.pages.dev"

Write-Host "Setting DEEPSEEK_API_KEY..." -ForegroundColor Yellow
wrangler secret put DEEPSEEK_API_KEY --text "sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn"

Write-Host "Setting DEEPSEEK_BASE_URL..." -ForegroundColor Yellow
wrangler secret put DEEPSEEK_BASE_URL --text "https://api.siliconflow.cn/v1/chat/completions"

Write-Host "Setting DEEPSEEK_MODEL..." -ForegroundColor Yellow
wrangler secret put DEEPSEEK_MODEL --text "Pro/deepseek-ai/DeepSeek-R1"

Write-Host "Setting FRONTEND_URL..." -ForegroundColor Yellow
wrangler secret put FRONTEND_URL --text "https://destiny-frontend.pages.dev"

Write-Host "Setting JWT_SECRET..." -ForegroundColor Yellow
wrangler secret put JWT_SECRET --text "wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA"

Write-Host "Setting RESEND_API_KEY..." -ForegroundColor Yellow
wrangler secret put RESEND_API_KEY --text "re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP"

Write-Host "Setting RESEND_FROM_EMAIL..." -ForegroundColor Yellow
wrangler secret put RESEND_FROM_EMAIL --text "info@info.indicate.top"

Write-Host "Setting RESEND_FROM_NAME..." -ForegroundColor Yellow
wrangler secret put RESEND_FROM_NAME --text "indicate.top"

Write-Host "Setting STRIPE_SECRET_KEY (corrected)..." -ForegroundColor Yellow
wrangler secret put STRIPE_SECRET_KEY --text "sk_test_your_stripe_secret_key_here"

Write-Host "Setting STRIPE_PUBLISHABLE_KEY (corrected)..." -ForegroundColor Yellow
wrangler secret put STRIPE_PUBLISHABLE_KEY --text "pk_test_your_stripe_publishable_key_here"

Write-Host "Setting STRIPE_WEBHOOK_SECRET..." -ForegroundColor Yellow
wrangler secret put STRIPE_WEBHOOK_SECRET --text "whsec_your_webhook_secret_here"

Write-Host "Setting EMAIL_SERVICE..." -ForegroundColor Yellow
wrangler secret put EMAIL_SERVICE --text "resend"

Write-Host "Setting NODE_ENV..." -ForegroundColor Yellow
wrangler secret put NODE_ENV --text "production"

Write-Host ""
Write-Host "All environment variables have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: " -ForegroundColor Cyan -NoNewline
Write-Host "VITE_API_BASE_URL is for frontend only, not needed in Cloudflare Workers." -ForegroundColor White
Write-Host "Stripe keys have been corrected: SECRET_KEY starts with 'sk_', PUBLISHABLE_KEY starts with 'pk_'" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"
