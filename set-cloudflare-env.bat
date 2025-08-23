@echo off
echo Setting Cloudflare Workers Environment Variables...
echo.

cd backend

echo Setting CORS_ORIGIN...
wrangler secret put CORS_ORIGIN --text "https://destiny-frontend.pages.dev"

echo Setting DEEPSEEK_API_KEY...
wrangler secret put DEEPSEEK_API_KEY --text "YOUR_DEEPSEEK_API_KEY_HERE"

echo Setting DEEPSEEK_BASE_URL...
wrangler secret put DEEPSEEK_BASE_URL --text "https://api.siliconflow.cn/v1/chat/completions"

echo Setting DEEPSEEK_MODEL...
wrangler secret put DEEPSEEK_MODEL --text "Pro/deepseek-ai/DeepSeek-R1"

echo Setting FRONTEND_URL...
wrangler secret put FRONTEND_URL --text "https://destiny-frontend.pages.dev"

echo Setting JWT_SECRET...
wrangler secret put JWT_SECRET --text "YOUR_JWT_SECRET_HERE"

echo Setting RESEND_API_KEY...
wrangler secret put RESEND_API_KEY --text "YOUR_RESEND_API_KEY_HERE"

echo Setting RESEND_FROM_EMAIL...
wrangler secret put RESEND_FROM_EMAIL --text "info@info.indicate.top"

echo Setting RESEND_FROM_NAME...
wrangler secret put RESEND_FROM_NAME --text "indicate.top"

echo Setting STRIPE_SECRET_KEY...
wrangler secret put STRIPE_SECRET_KEY --text "YOUR_STRIPE_SECRET_KEY_HERE"

echo Setting STRIPE_PUBLISHABLE_KEY...
wrangler secret put STRIPE_PUBLISHABLE_KEY --text "YOUR_STRIPE_PUBLISHABLE_KEY_HERE"

echo Setting STRIPE_WEBHOOK_SECRET...
wrangler secret put STRIPE_WEBHOOK_SECRET --text "whsec_your_webhook_secret_here"

echo Setting EMAIL_SERVICE...
wrangler secret put EMAIL_SERVICE --text "resend"

echo Setting NODE_ENV...
wrangler secret put NODE_ENV --text "production"

echo.
echo All environment variables have been set!
echo.
echo Note: VITE_API_BASE_URL is for frontend only, not needed in Cloudflare Workers.
echo.
pause
