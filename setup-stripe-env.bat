@echo off
echo 🔧 Setting up Stripe environment variables for Cloudflare Workers...
echo.

echo ⚠️  IMPORTANT: You need to get your real Stripe API keys from:
echo    https://dashboard.stripe.com/test/apikeys
echo.

echo 📋 Please enter your Stripe API keys:
echo.

set /p STRIPE_SECRET_KEY="Enter your Stripe Secret Key (sk_test_...): "
if "%STRIPE_SECRET_KEY%"=="" (
    echo ❌ Stripe Secret Key is required!
    pause
    exit /b 1
)

set /p STRIPE_WEBHOOK_SECRET="Enter your Stripe Webhook Secret (whsec_...): "
if "%STRIPE_WEBHOOK_SECRET%"=="" (
    echo ❌ Stripe Webhook Secret is required!
    pause
    exit /b 1
)

echo.
echo 🚀 Setting Cloudflare Workers secrets...

echo Setting STRIPE_SECRET_KEY...
wrangler secret put STRIPE_SECRET_KEY --env production
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to set STRIPE_SECRET_KEY
    pause
    exit /b 1
)

echo Setting STRIPE_WEBHOOK_SECRET...
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to set STRIPE_WEBHOOK_SECRET
    pause
    exit /b 1
)

echo.
echo ✅ Stripe environment variables set successfully!
echo.
echo 📋 Next steps:
echo 1. Update your .env file with the Stripe Publishable Key
echo 2. Configure webhook endpoint in Stripe Dashboard:
echo    URL: https://destiny-backend.rocky-liang.workers.dev/api/stripe/webhook
echo    Events: payment_intent.succeeded, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted
echo 3. Test the payment system
echo.
pause
