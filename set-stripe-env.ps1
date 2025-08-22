Write-Host "Setting Stripe Environment Variables for Cloudflare Workers..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "Setting STRIPE_SECRET_KEY..." -ForegroundColor Yellow
echo "sk_test_51RySLYBb9puAdbwB81Y1L0zQ3XB5AG4yCxJNvGhub5tJzfbCqRGGjtnOzhii5HJ4FOsuQRcvhAG97GwBNjW6ONOw00hrmdAdQ5" | wrangler secret put STRIPE_SECRET_KEY

Write-Host "Setting STRIPE_PUBLISHABLE_KEY..." -ForegroundColor Yellow
echo "pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um" | wrangler secret put STRIPE_PUBLISHABLE_KEY

Write-Host "Setting STRIPE_WEBHOOK_SECRET..." -ForegroundColor Yellow
echo "whsec_test_placeholder" | wrangler secret put STRIPE_WEBHOOK_SECRET

Write-Host ""
Write-Host "✅ Stripe environment variables have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'wrangler deploy' to deploy with new Stripe configuration" -ForegroundColor Cyan
Write-Host "2. Test the payment functionality" -ForegroundColor Cyan
Write-Host "3. Set up Stripe webhook endpoint if needed" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Stripe Keys Used:" -ForegroundColor Magenta
Write-Host "- Secret Key: sk_test_51RySLYBb9puAdbwB81Y1L0zQ3XB5AG4yCxJNvGhub5tJzfbCqRGGjtnOzhii5HJ4FOsuQRcvhAG97GwBNjW6ONOw00hrmdAdQ5" -ForegroundColor Gray
Write-Host "- Publishable Key: pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to continue"
