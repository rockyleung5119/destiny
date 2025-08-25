# 手动后端部署脚本
# 当GitHub Actions失败时使用此脚本手动部署

Write-Host "🚀 手动部署后端到Cloudflare Workers" -ForegroundColor Green

# 切换到后端目录
Push-Location backend

try {
    Write-Host "`n📋 预部署检查..." -ForegroundColor Yellow
    
    # 检查必要文件
    $files = @("worker.ts", "wrangler-github.toml", "package.json")
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Host "✅ $file" -ForegroundColor Green
        } else {
            Write-Host "❌ $file 缺失" -ForegroundColor Red
            throw "必要文件缺失: $file"
        }
    }
    
    # 检查文件大小
    $workerSize = (Get-Item "worker.ts").Length
    Write-Host "📊 worker.ts 大小: $([math]::Round($workerSize/1KB, 2)) KB" -ForegroundColor Cyan
    
    if ($workerSize -gt 1MB) {
        Write-Host "⚠️ worker.ts文件较大，可能影响部署速度" -ForegroundColor Yellow
    }
    
    Write-Host "`n🔍 检查Cloudflare资源..." -ForegroundColor Yellow
    
    # 检查认证
    try {
        $whoami = wrangler whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Cloudflare认证正常" -ForegroundColor Green
            Write-Host $whoami
        } else {
            Write-Host "❌ Cloudflare认证失败" -ForegroundColor Red
            Write-Host "请运行: wrangler login" -ForegroundColor Yellow
            throw "认证失败"
        }
    } catch {
        Write-Host "❌ 认证检查异常: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
    
    # 检查队列
    Write-Host "`n检查Queues..." -ForegroundColor Cyan
    try {
        $queues = wrangler queues list 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Queues正常" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Queues检查失败，但继续部署" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Queues检查异常，但继续部署" -ForegroundColor Yellow
    }
    
    # 检查D1数据库
    Write-Host "检查D1数据库..." -ForegroundColor Cyan
    try {
        $d1 = wrangler d1 list 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ D1数据库正常" -ForegroundColor Green
        } else {
            Write-Host "⚠️ D1数据库检查失败，但继续部署" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ D1数据库检查异常，但继续部署" -ForegroundColor Yellow
    }
    
    Write-Host "`n🧪 干运行测试..." -ForegroundColor Yellow
    try {
        $dryRun = wrangler deploy --dry-run --config wrangler-github.toml 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 干运行测试成功" -ForegroundColor Green
        } else {
            Write-Host "❌ 干运行测试失败" -ForegroundColor Red
            Write-Host $dryRun
            throw "干运行测试失败"
        }
    } catch {
        Write-Host "❌ 干运行测试异常: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
    
    Write-Host "`n🚀 开始部署..." -ForegroundColor Blue
    Write-Host "使用配置: wrangler-github.toml" -ForegroundColor Cyan
    Write-Host "保持所有功能: Durable Objects, Queues, D1, R2, Cron" -ForegroundColor Cyan
    
    # 实际部署
    try {
        Write-Host "`n执行部署命令..." -ForegroundColor Yellow
        $deployResult = wrangler deploy --config wrangler-github.toml --compatibility-date=2024-08-01 --no-bundle --minify=false 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 后端部署成功！" -ForegroundColor Green
            Write-Host $deployResult
            
            Write-Host "`n🧪 验证部署..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
            
            # 测试健康检查
            try {
                $health = Invoke-RestMethod -Uri "https://destiny-backend.jerryliang5119.workers.dev/api/health" -Method GET -TimeoutSec 10
                Write-Host "✅ 健康检查通过: $($health | ConvertTo-Json)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ 健康检查失败，但部署可能成功: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            
            Write-Host "`n🎉 部署完成！" -ForegroundColor Green
            Write-Host "🔗 Backend URL: https://destiny-backend.jerryliang5119.workers.dev" -ForegroundColor Cyan
            
        } else {
            Write-Host "❌ 部署失败" -ForegroundColor Red
            Write-Host $deployResult
            throw "部署失败"
        }
        
    } catch {
        Write-Host "❌ 部署异常: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
    
} catch {
    Write-Host "`n❌ 手动部署失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 故障排除建议:" -ForegroundColor Yellow
    Write-Host "1. 检查网络连接" -ForegroundColor White
    Write-Host "2. 验证Cloudflare认证: wrangler whoami" -ForegroundColor White
    Write-Host "3. 重新登录: wrangler logout && wrangler login" -ForegroundColor White
    Write-Host "4. 检查账户配额和权限" -ForegroundColor White
    Write-Host "5. 尝试简化配置部署" -ForegroundColor White
    exit 1
} finally {
    Pop-Location
}
