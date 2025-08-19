# 启用wrangler.toml中的队列配置
Write-Host "🔧 Enabling queue configuration in wrangler.toml..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

# 备份原文件
Copy-Item "wrangler.toml" "wrangler.toml.backup"
Write-Host "📋 Backup created: wrangler.toml.backup" -ForegroundColor Yellow

# 读取文件内容
$content = Get-Content "wrangler.toml" -Raw

# 取消注释队列配置
$content = $content -replace "# \[\[queues\.producers\]\]", "[[queues.producers]]"
$content = $content -replace "# binding = `"AI_QUEUE`"", "binding = `"AI_QUEUE`""
$content = $content -replace "# queue = `"ai-processing-queue`"", "queue = `"ai-processing-queue`""
$content = $content -replace "# \[\[queues\.consumers\]\]", "[[queues.consumers]]"
$content = $content -replace "# queue = `"ai-processing-queue`"", "queue = `"ai-processing-queue`""
$content = $content -replace "# max_batch_size = 1", "max_batch_size = 1"
$content = $content -replace "# max_batch_timeout = 30", "max_batch_timeout = 30"
$content = $content -replace "# max_retries = 2", "max_retries = 2"
$content = $content -replace "# dead_letter_queue = `"ai-processing-dlq`"", "dead_letter_queue = `"ai-processing-dlq`""
$content = $content -replace "# binding = `"AI_DLQ`"", "binding = `"AI_DLQ`""
$content = $content -replace "# queue = `"ai-processing-dlq`"", "queue = `"ai-processing-dlq`""

# 写回文件
$content | Set-Content "wrangler.toml" -NoNewline

Write-Host "✅ Queue configuration enabled!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. 运行 'wrangler deploy' 重新部署"
Write-Host "2. 测试队列状态: '/api/queue-status'"
Write-Host "3. 如有问题，可以恢复备份: 'Copy-Item wrangler.toml.backup wrangler.toml'"
Write-Host ""
