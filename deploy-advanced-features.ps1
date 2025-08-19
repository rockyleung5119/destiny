# Cloudflare Workers高级功能部署脚本
# 按正确顺序部署Durable Objects和Queues

Write-Host "🚀 开始部署Cloudflare Workers高级功能" -ForegroundColor Green
Write-Host "=" * 60

# 切换到backend目录
Set-Location backend

# 步骤1: 检查wrangler登录状态
Write-Host "`n📋 Step 1: 检查wrangler登录状态..." -ForegroundColor Yellow
try {
    $whoami = wrangler whoami
    Write-Host "✅ Wrangler已登录: $whoami" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler未登录，请先运行: wrangler login" -ForegroundColor Red
    exit 1
}

# 步骤2: 创建Cloudflare Queues
Write-Host "`n📋 Step 2: 创建Cloudflare Queues..." -ForegroundColor Yellow

Write-Host "🔄 创建主处理队列: ai-processing-queue"
try {
    wrangler queues create ai-processing-queue
    Write-Host "✅ ai-processing-queue 创建成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️ ai-processing-queue 可能已存在，继续..." -ForegroundColor Yellow
}

Write-Host "🔄 创建死信队列: ai-processing-dlq"
try {
    wrangler queues create ai-processing-dlq
    Write-Host "✅ ai-processing-dlq 创建成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️ ai-processing-dlq 可能已存在，继续..." -ForegroundColor Yellow
}

# 步骤3: 验证队列创建
Write-Host "`n📋 Step 3: 验证队列创建..." -ForegroundColor Yellow
try {
    $queues = wrangler queues list
    Write-Host "📊 当前队列列表:"
    Write-Host $queues
} catch {
    Write-Host "⚠️ 无法获取队列列表，但继续部署..." -ForegroundColor Yellow
}

# 步骤4: 部署Worker（包含Durable Objects）
Write-Host "`n📋 Step 4: 部署Worker（包含Durable Objects）..." -ForegroundColor Yellow

Write-Host "🔄 部署Worker到Cloudflare..."
try {
    wrangler deploy
    Write-Host "✅ Worker部署成功！" -ForegroundColor Green
} catch {
    Write-Host "❌ Worker部署失败" -ForegroundColor Red
    Write-Host "错误信息: $_" -ForegroundColor Red
    
    # 尝试获取更详细的错误信息
    Write-Host "`n🔍 尝试详细部署以获取更多信息..."
    wrangler deploy --verbose
    exit 1
}

# 步骤5: 验证Durable Objects
Write-Host "`n📋 Step 5: 验证Durable Objects..." -ForegroundColor Yellow
try {
    # 检查Worker状态
    $workers = wrangler list
    Write-Host "📊 当前Workers:"
    Write-Host $workers
} catch {
    Write-Host "⚠️ 无法获取Workers列表" -ForegroundColor Yellow
}

# 步骤6: 测试部署结果
Write-Host "`n📋 Step 6: 测试部署结果..." -ForegroundColor Yellow

$workerUrl = "https://destiny-backend.wlk8s6v9y.workers.dev"

Write-Host "🧪 测试健康检查端点..."
try {
    $healthResponse = Invoke-RestMethod -Uri "$workerUrl/api/health" -Method GET
    Write-Host "✅ 健康检查成功: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ 健康检查失败: $_" -ForegroundColor Red
}

Write-Host "🧪 测试异步状态端点..."
try {
    $asyncResponse = Invoke-RestMethod -Uri "$workerUrl/api/async-status" -Method GET
    Write-Host "✅ 异步状态检查成功" -ForegroundColor Green
    Write-Host "   - 当前方法: $($asyncResponse.currentMethod)"
    Write-Host "   - 队列可用: $($asyncResponse.processingCheck.queueAvailable)"
    Write-Host "   - Durable Objects可用: $($asyncResponse.processingCheck.durableObjectsAvailable)"
} catch {
    Write-Host "❌ 异步状态检查失败: $_" -ForegroundColor Red
}

Write-Host "🧪 测试AI状态端点..."
try {
    $aiResponse = Invoke-RestMethod -Uri "$workerUrl/api/ai-status" -Method GET
    Write-Host "✅ AI状态检查成功: $($aiResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ AI状态检查失败: $_" -ForegroundColor Red
}

# 步骤7: 显示部署总结
Write-Host "`n📋 Step 7: 部署总结" -ForegroundColor Yellow
Write-Host "=" * 60
Write-Host "🎉 高级功能部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 已部署的功能:"
Write-Host "  ✅ Cloudflare Queues (ai-processing-queue, ai-processing-dlq)"
Write-Host "  ✅ Durable Objects (AIProcessor, BatchCoordinator)"
Write-Host "  ✅ 完整Worker应用"
Write-Host "  ✅ 定时任务 (每2分钟)"
Write-Host ""
Write-Host "🔗 Worker URL: $workerUrl"
Write-Host ""
Write-Host "🛠️ 下一步:"
Write-Host "  1. 运行测试脚本验证功能: node test-complete-ai-flow.js"
Write-Host "  2. 检查Worker日志: wrangler tail"
Write-Host "  3. 监控任务状态: node monitor-ai-services.js"
Write-Host ""
Write-Host "💡 如果遇到问题:"
Write-Host "  - 检查环境变量是否正确设置"
Write-Host "  - 使用 wrangler tail 查看实时日志"
Write-Host "  - 运行 node fix-524-timeout-errors.js 修复超时问题"

Write-Host "`n🎯 部署脚本执行完成！" -ForegroundColor Green
