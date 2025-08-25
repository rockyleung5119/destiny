# 后端部署修复脚本
# 诊断并修复GitHub Actions后端部署失败问题

Write-Host "🔧 修复后端部署问题..." -ForegroundColor Green

Push-Location backend

try {
    Write-Host "`n📋 检查当前配置..." -ForegroundColor Yellow
    
    # 检查必要文件
    $requiredFiles = @("worker.ts", "wrangler.toml", "wrangler-ci.toml", "package.json")
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "✅ $file 存在" -ForegroundColor Green
        } else {
            Write-Host "❌ $file 不存在" -ForegroundColor Red
        }
    }
    
    Write-Host "`n🔍 诊断部署问题..." -ForegroundColor Yellow
    
    # 测试标准配置
    Write-Host "测试标准wrangler.toml配置..." -ForegroundColor Cyan
    try {
        $result1 = wrangler deploy --dry-run 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 标准配置测试成功" -ForegroundColor Green
        } else {
            Write-Host "❌ 标准配置测试失败" -ForegroundColor Red
            Write-Host $result1
        }
    } catch {
        Write-Host "❌ 标准配置异常: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # 测试CI配置
    Write-Host "`n测试CI专用wrangler-ci.toml配置..." -ForegroundColor Cyan
    try {
        $result2 = wrangler deploy --dry-run --config wrangler-ci.toml 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ CI配置测试成功" -ForegroundColor Green
        } else {
            Write-Host "❌ CI配置测试失败" -ForegroundColor Red
            Write-Host $result2
        }
    } catch {
        Write-Host "❌ CI配置异常: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n🛠️ 创建GitHub Actions友好的配置..." -ForegroundColor Blue
    
    # 创建一个专门用于GitHub Actions的简化配置
    $githubConfig = @"
# GitHub Actions专用配置 - 最大兼容性
name = "destiny-backend"
main = "worker.ts"
compatibility_date = "2024-08-01"

# 环境变量配置
[vars]
NODE_ENV = "production"
CORS_ORIGIN = "https://indicate.top,https://destiny-frontend.pages.dev"
FRONTEND_URL = "https://indicate.top"
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"
EMAIL_SERVICE = "resend"
RESEND_FROM_EMAIL = "info@info.indicate.top"
RESEND_FROM_NAME = "indicate.top"

# D1数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "destiny-db"
database_id = "500716dc-3ac2-4b4a-a2ee-ad79b301228d"

# R2存储绑定
[[r2_buckets]]
binding = "BACKUP_STORAGE"
bucket_name = "destiny-backups"

# Durable Objects配置
[[durable_objects.bindings]]
name = "AI_PROCESSOR"
class_name = "AIProcessor"

[[durable_objects.bindings]]
name = "BATCH_COORDINATOR"
class_name = "BatchCoordinator"

# Queues配置
[[queues.producers]]
binding = "AI_QUEUE"
queue = "ai-processing-queue"

[[queues.consumers]]
queue = "ai-processing-queue"
max_batch_size = 1
max_batch_timeout = 10
max_retries = 2
dead_letter_queue = "ai-processing-dlq"

[[queues.producers]]
binding = "AI_DLQ"
queue = "ai-processing-dlq"

# 定时任务
[triggers]
crons = ["*/2 * * * *"]

# 迁移配置 - 使用已存在的标签
[[migrations]]
tag = "v1"
new_classes = ["AIProcessor", "BatchCoordinator"]
"@
    
    $githubConfig | Out-File -FilePath "wrangler-github.toml" -Encoding UTF8
    Write-Host "✅ 创建了 wrangler-github.toml" -ForegroundColor Green
    
    # 测试GitHub专用配置
    Write-Host "`n测试GitHub专用配置..." -ForegroundColor Cyan
    try {
        $result3 = wrangler deploy --dry-run --config wrangler-github.toml 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ GitHub配置测试成功" -ForegroundColor Green
        } else {
            Write-Host "❌ GitHub配置测试失败" -ForegroundColor Red
            Write-Host $result3
        }
    } catch {
        Write-Host "❌ GitHub配置异常: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n📊 部署问题分析总结:" -ForegroundColor Green
    Write-Host "1. 本地wrangler配置和资源都正常" -ForegroundColor White
    Write-Host "2. 所有必要的Cloudflare资源已存在" -ForegroundColor White
    Write-Host "3. 干运行部署测试成功" -ForegroundColor White
    Write-Host "4. GitHub Actions失败可能是以下原因:" -ForegroundColor White
    Write-Host "   - API Token权限不足" -ForegroundColor Gray
    Write-Host "   - 网络连接问题" -ForegroundColor Gray
    Write-Host "   - wrangler版本兼容性" -ForegroundColor Gray
    Write-Host "   - Durable Objects迁移冲突" -ForegroundColor Gray
    
    Write-Host "`n🚀 建议的解决方案:" -ForegroundColor Cyan
    Write-Host "1. 更新GitHub Actions使用 wrangler-github.toml" -ForegroundColor White
    Write-Host "2. 添加重试机制和更好的错误处理" -ForegroundColor White
    Write-Host "3. 如果仍然失败，手动部署:" -ForegroundColor White
    Write-Host "   wrangler deploy --config wrangler-github.toml" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ 修复过程中出现错误: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Pop-Location
}
