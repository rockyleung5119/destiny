# Cloudflare资源预创建脚本
# 在部署Workers之前创建必要的Queues和其他资源

Write-Host "🚀 设置Cloudflare Workers必要资源" -ForegroundColor Green

# 切换到后端目录
Push-Location backend

try {
    Write-Host "`n🔍 检查当前Cloudflare资源..." -ForegroundColor Yellow
    
    # 检查当前队列
    Write-Host "📋 检查现有队列..." -ForegroundColor Cyan
    try {
        wrangler queues list
    } catch {
        Write-Host "⚠️ 无法列出队列，可能需要创建" -ForegroundColor Yellow
    }
    
    Write-Host "`n🔧 创建必要的Cloudflare Queues..." -ForegroundColor Blue
    
    # 创建AI处理队列
    Write-Host "创建 ai-processing-queue..." -ForegroundColor Yellow
    try {
        wrangler queues create ai-processing-queue
        Write-Host "✅ ai-processing-queue 创建成功" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ ai-processing-queue 可能已存在" -ForegroundColor Cyan
    }
    
    # 创建死信队列
    Write-Host "创建 ai-processing-dlq..." -ForegroundColor Yellow
    try {
        wrangler queues create ai-processing-dlq
        Write-Host "✅ ai-processing-dlq 创建成功" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ ai-processing-dlq 可能已存在" -ForegroundColor Cyan
    }
    
    Write-Host "`n🗄️ 检查D1数据库..." -ForegroundColor Blue
    try {
        wrangler d1 list
        Write-Host "✅ D1数据库列表获取成功" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 无法列出D1数据库" -ForegroundColor Yellow
    }
    
    Write-Host "`n📦 检查R2存储桶..." -ForegroundColor Blue
    try {
        wrangler r2 bucket list
        Write-Host "✅ R2存储桶列表获取成功" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 无法列出R2存储桶" -ForegroundColor Yellow
    }
    
    # 创建R2存储桶（如果不存在）
    Write-Host "创建 destiny-backups 存储桶..." -ForegroundColor Yellow
    try {
        wrangler r2 bucket create destiny-backups
        Write-Host "✅ destiny-backups 存储桶创建成功" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ destiny-backups 存储桶可能已存在" -ForegroundColor Cyan
    }
    
    Write-Host "`n🧪 测试部署配置..." -ForegroundColor Blue
    
    # 验证wrangler.toml配置
    if (Test-Path "wrangler.toml") {
        Write-Host "✅ wrangler.toml 文件存在" -ForegroundColor Green
        
        # 检查配置文件内容
        $config = Get-Content "wrangler.toml" -Raw
        
        if ($config -match "ai-processing-queue") {
            Write-Host "✅ AI处理队列配置已找到" -ForegroundColor Green
        } else {
            Write-Host "⚠️ AI处理队列配置未找到" -ForegroundColor Yellow
        }
        
        if ($config -match "AIProcessor") {
            Write-Host "✅ Durable Objects配置已找到" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Durable Objects配置未找到" -ForegroundColor Yellow
        }
        
        if ($config -match "destiny-db") {
            Write-Host "✅ D1数据库配置已找到" -ForegroundColor Green
        } else {
            Write-Host "⚠️ D1数据库配置未找到" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ wrangler.toml 文件不存在" -ForegroundColor Red
        exit 1
    }
    
    # 验证worker.ts文件
    if (Test-Path "worker.ts") {
        Write-Host "✅ worker.ts 文件存在" -ForegroundColor Green
        
        $workerContent = Get-Content "worker.ts" -Raw
        
        if ($workerContent -match "export class AIProcessor") {
            Write-Host "✅ AIProcessor类定义已找到" -ForegroundColor Green
        } else {
            Write-Host "⚠️ AIProcessor类定义未找到" -ForegroundColor Yellow
        }
        
        if ($workerContent -match "export class BatchCoordinator") {
            Write-Host "✅ BatchCoordinator类定义已找到" -ForegroundColor Green
        } else {
            Write-Host "⚠️ BatchCoordinator类定义未找到" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ worker.ts 文件不存在" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n🚀 尝试干运行部署..." -ForegroundColor Blue
    try {
        wrangler deploy --dry-run
        Write-Host "✅ 干运行部署成功，配置有效" -ForegroundColor Green
    } catch {
        Write-Host "❌ 干运行部署失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "这可能是导致GitHub Actions失败的原因" -ForegroundColor Yellow
    }
    
    Write-Host "`n📋 资源设置完成!" -ForegroundColor Green
    Write-Host "如果所有检查都通过，可以尝试部署:" -ForegroundColor Cyan
    Write-Host "wrangler deploy" -ForegroundColor White
    
} catch {
    Write-Host "❌ 设置过程中出现错误: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Pop-Location
}
