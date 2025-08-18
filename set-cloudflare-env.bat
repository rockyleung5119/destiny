@echo off
echo Setting Cloudflare Workers Environment Variables...
echo.

cd backend

echo Setting CORS_ORIGIN...
wrangler secret put CORS_ORIGIN --text "https://destiny-frontend.pages.dev"

echo Setting DEEPSEEK_API_KEY...
wrangler secret put DEEPSEEK_API_KEY --text "sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn"

echo Setting DEEPSEEK_BASE_URL...
wrangler secret put DEEPSEEK_BASE_URL --text "https://api.siliconflow.cn/v1/chat/completions"

echo Setting DEEPSEEK_MODEL...
wrangler secret put DEEPSEEK_MODEL --text "Pro/deepseek-ai/DeepSeek-R1"

echo Setting FRONTEND_URL...
wrangler secret put FRONTEND_URL --text "https://destiny-frontend.pages.dev"

echo Setting JWT_SECRET...
wrangler secret put JWT_SECRET --text "wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA"

echo Setting RESEND_API_KEY...
wrangler secret put RESEND_API_KEY --text "re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP"

echo Setting RESEND_FROM_EMAIL...
wrangler secret put RESEND_FROM_EMAIL --text "info@info.indicate.top"

echo Setting RESEND_FROM_NAME...
wrangler secret put RESEND_FROM_NAME --text "indicate.top"

echo Setting STRIPE_PUBLISHABLE_KEY...
wrangler secret put STRIPE_PUBLISHABLE_KEY --text "sk_test_your_stripe_secret_key_here"

echo Setting STRIPE_SECRET_KEY...
wrangler secret put STRIPE_SECRET_KEY --text "pk_test_your_stripe_publishable_key_here"

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
