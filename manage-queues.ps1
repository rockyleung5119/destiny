# Cloudflare Queues管理脚本
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("status", "info", "pause", "resume", "purge", "help")]
    [string]$Action = "status"
)

Write-Host "🔄 Cloudflare Queues管理工具" -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

# 检查wrangler认证
try {
    $whoami = wrangler whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Wrangler未认证，请先运行: wrangler login" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 无法检查wrangler状态" -ForegroundColor Red
    exit 1
}

switch ($Action) {
    "status" {
        Write-Host "📊 检查队列状态..." -ForegroundColor Cyan
        Write-Host ""
        
        # 列出所有队列
        Write-Host "📋 所有队列列表:" -ForegroundColor Yellow
        wrangler queues list
        
        Write-Host ""
        
        # 检查主队列信息
        Write-Host "🎯 AI处理队列详情:" -ForegroundColor Yellow
        try {
            wrangler queues info ai-processing-queue
        } catch {
            Write-Host "⚠️ 无法获取ai-processing-queue信息" -ForegroundColor Yellow
        }
        
        Write-Host ""
        
        # 检查死信队列信息
        Write-Host "💀 死信队列详情:" -ForegroundColor Yellow
        try {
            wrangler queues info ai-processing-dlq
        } catch {
            Write-Host "⚠️ 无法获取ai-processing-dlq信息" -ForegroundColor Yellow
        }
    }
    
    "info" {
        Write-Host "ℹ️ 队列详细信息..." -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "🎯 AI处理队列 (ai-processing-queue):" -ForegroundColor Green
        wrangler queues info ai-processing-queue
        
        Write-Host ""
        Write-Host "💀 死信队列 (ai-processing-dlq):" -ForegroundColor Red
        wrangler queues info ai-processing-dlq
    }
    
    "pause" {
        Write-Host "⏸️ 暂停队列消息传递..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "暂停AI处理队列..."
        wrangler queues pause-delivery ai-processing-queue
        
        Write-Host "✅ 队列已暂停" -ForegroundColor Green
    }
    
    "resume" {
        Write-Host "▶️ 恢复队列消息传递..." -ForegroundColor Green
        Write-Host ""
        
        Write-Host "恢复AI处理队列..."
        wrangler queues resume-delivery ai-processing-queue
        
        Write-Host "✅ 队列已恢复" -ForegroundColor Green
    }
    
    "purge" {
        Write-Host "🗑️ 清空队列消息..." -ForegroundColor Red
        Write-Host ""
        
        $confirm = Read-Host "⚠️ 确定要清空ai-processing-queue中的所有消息吗？(y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Host "清空AI处理队列..."
            wrangler queues purge ai-processing-queue
            Write-Host "✅ 队列已清空" -ForegroundColor Green
        } else {
            Write-Host "❌ 操作已取消" -ForegroundColor Yellow
        }
    }
    
    "help" {
        Write-Host "📖 队列管理命令帮助:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "用法: .\manage-queues.ps1 [action]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "可用操作:" -ForegroundColor Green
        Write-Host "  status  - 显示队列状态 (默认)" -ForegroundColor White
        Write-Host "  info    - 显示详细队列信息" -ForegroundColor White
        Write-Host "  pause   - 暂停队列消息传递" -ForegroundColor White
        Write-Host "  resume  - 恢复队列消息传递" -ForegroundColor White
        Write-Host "  purge   - 清空队列消息" -ForegroundColor White
        Write-Host "  help    - 显示此帮助信息" -ForegroundColor White
        Write-Host ""
        Write-Host "示例:" -ForegroundColor Yellow
        Write-Host "  .\manage-queues.ps1 status" -ForegroundColor Gray
        Write-Host "  .\manage-queues.ps1 info" -ForegroundColor Gray
        Write-Host "  .\manage-queues.ps1 pause" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📊 队列架构概览:" -ForegroundColor Cyan
Write-Host "┌─────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "│ 客户端 → Worker → ai-processing-queue       │" -ForegroundColor Gray
Write-Host "│                    ↓                       │" -ForegroundColor Gray
Write-Host "│ Queue Consumer → AI处理 → 结果保存         │" -ForegroundColor Gray
Write-Host "│                    ↓                       │" -ForegroundColor Gray
Write-Host "│ 失败重试 → ai-processing-dlq (死信队列)    │" -ForegroundColor Gray
Write-Host "└─────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""

Write-Host "🔗 相关命令:" -ForegroundColor Yellow
Write-Host "  wrangler tail                    - 查看实时日志"
Write-Host "  wrangler deploy                  - 部署Worker"
Write-Host "  wrangler queues list             - 列出所有队列"
Write-Host ""
