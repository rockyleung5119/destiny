# Cloudflare Queues创建脚本 - 标准异步架构
Write-Host "🔄 Creating Cloudflare Queues for AI processing..." -ForegroundColor Green
Write-Host ""

# 检查当前目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 检查wrangler登录状态
Write-Host "🔍 Checking wrangler authentication..." -ForegroundColor Cyan
try {
    $whoami = wrangler whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Wrangler authenticated successfully" -ForegroundColor Green
        Write-Host $whoami
    } else {
        Write-Host "❌ Wrangler authentication failed" -ForegroundColor Red
        Write-Host "Please run: wrangler login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Failed to check wrangler status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 创建AI处理队列
Write-Host "📤 Creating AI processing queue..." -ForegroundColor Cyan
try {
    $result = wrangler queues create ai-processing-queue 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AI processing queue created successfully" -ForegroundColor Green
        Write-Host $result
    } else {
        if ($result -match "already exists") {
            Write-Host "⚠️ AI processing queue already exists" -ForegroundColor Yellow
        } else {
            throw "Failed to create AI processing queue: $result"
        }
    }
} catch {
    Write-Host "❌ Failed to create AI processing queue: $($_.Exception.Message)" -ForegroundColor Red
    
    # 检查是否是计划限制问题
    if ($_.Exception.Message -match "not available on the free plan") {
        Write-Host ""
        Write-Host "💡 解决方案:" -ForegroundColor Cyan
        Write-Host "1. 升级到Workers Paid计划 ($5/月)" -ForegroundColor Yellow
        Write-Host "2. 访问: https://dash.cloudflare.com/workers/plans" -ForegroundColor Yellow
        Write-Host "3. 或者使用免费的Durable Objects方案" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# 创建死信队列
Write-Host "💀 Creating dead letter queue..." -ForegroundColor Cyan
try {
    $result = wrangler queues create ai-processing-dlq 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dead letter queue created successfully" -ForegroundColor Green
        Write-Host $result
    } else {
        if ($result -match "already exists") {
            Write-Host "⚠️ Dead letter queue already exists" -ForegroundColor Yellow
        } else {
            throw "Failed to create dead letter queue: $result"
        }
    }
} catch {
    Write-Host "❌ Failed to create dead letter queue: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 列出所有队列
Write-Host "📋 Listing all queues..." -ForegroundColor Cyan
try {
    $queues = wrangler queues list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Current queues:" -ForegroundColor Green
        Write-Host $queues
    } else {
        Write-Host "⚠️ Failed to list queues: $queues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Failed to list queues: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# 验证配置
Write-Host "🔍 Verifying wrangler.toml configuration..." -ForegroundColor Cyan
try {
    $config = Get-Content "wrangler.toml" -Raw
    if ($config -match "ai-processing-queue" -and $config -match "ai-processing-dlq") {
        Write-Host "✅ wrangler.toml configuration looks correct" -ForegroundColor Green
    } else {
        Write-Host "⚠️ wrangler.toml may need queue configuration" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not verify wrangler.toml" -ForegroundColor Yellow
}

Write-Host ""

# 部署建议
Write-Host "🚀 Next steps:" -ForegroundColor Green
Write-Host "1. 队列已创建，现在可以部署Worker" -ForegroundColor Yellow
Write-Host "2. 运行: wrangler deploy" -ForegroundColor Yellow
Write-Host "3. 测试队列状态: /api/async-status" -ForegroundColor Yellow
Write-Host "4. 测试AI服务: /api/ai-status" -ForegroundColor Yellow
Write-Host ""

# 架构说明
Write-Host "📊 Cloudflare异步架构已配置:" -ForegroundColor Cyan
Write-Host "┌─────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "│ 客户端 → 前端Worker → Cloudflare Queue     │" -ForegroundColor Gray
Write-Host "│                    ↓                       │" -ForegroundColor Gray
Write-Host "│ 后端Worker → D1数据库 → AI推理(分片处理)   │" -ForegroundColor Gray
Write-Host "└─────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Cloudflare Queues setup completed!" -ForegroundColor Green
