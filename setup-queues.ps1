# Cloudflare Queues 设置脚本
# 这个脚本用于创建AI异步处理所需的队列

Write-Host "🔄 Setting up Cloudflare Queues..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 创建AI处理队列
Write-Host "📤 Creating AI processing queue..." -ForegroundColor Cyan
wrangler queues create ai-processing-queue

Write-Host ""
Write-Host "💀 Creating dead letter queue..." -ForegroundColor Cyan
wrangler queues create ai-processing-dlq

Write-Host ""
Write-Host "📋 Listing all queues..." -ForegroundColor Cyan
wrangler queues list

Write-Host ""
Write-Host "✅ Queue setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Queues are now created and configured in wrangler.toml"
Write-Host "2. Deploy the worker with 'wrangler deploy'"
Write-Host "3. Test queue status with '/api/queue-status' endpoint"
Write-Host ""
