# 创建Cloudflare队列的脚本
Write-Host "🔄 Creating Cloudflare Queues..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 检查wrangler登录状态
Write-Host "🔍 Checking wrangler login status..." -ForegroundColor Cyan
wrangler whoami

Write-Host ""
Write-Host "📤 Creating AI processing queue..." -ForegroundColor Cyan
wrangler queues create ai-processing-queue

Write-Host ""
Write-Host "💀 Creating dead letter queue..." -ForegroundColor Cyan
wrangler queues create ai-processing-dlq

Write-Host ""
Write-Host "📋 Listing all queues..." -ForegroundColor Cyan
wrangler queues list

Write-Host ""
Write-Host "✅ Queue creation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. 队列已创建，现在可以启用wrangler.toml中的队列配置"
Write-Host "2. 取消注释wrangler.toml中的队列配置部分"
Write-Host "3. 运行 'wrangler deploy' 重新部署"
Write-Host "4. 测试队列状态: '/api/queue-status'"
Write-Host ""
