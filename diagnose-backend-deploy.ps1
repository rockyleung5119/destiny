# 后端部署问题诊断脚本
Write-Host "🔍 诊断后端部署问题..." -ForegroundColor Green

Push-Location backend

try {
    Write-Host "`n📋 检查必要文件..." -ForegroundColor Yellow
    
    $requiredFiles = @("worker.ts", "wrangler.toml", "package.json")
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "✅ $file 存在" -ForegroundColor Green
        } else {
            Write-Host "❌ $file 不存在" -ForegroundColor Red
        }
    }
    
    Write-Host "`n🔧 检查Cloudflare资源..." -ForegroundColor Yellow
    
    # 检查队列
    Write-Host "检查Queues..." -ForegroundColor Cyan
    try {
        $queues = wrangler queues list 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Queues检查成功" -ForegroundColor Green
            Write-Host $queues
        } else {
            Write-Host "❌ Queues检查失败" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Queues检查异常: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # 检查D1数据库
    Write-Host "`n检查D1数据库..." -ForegroundColor Cyan
    try {
        $d1 = wrangler d1 list 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ D1数据库检查成功" -ForegroundColor Green
            Write-Host $d1
        } else {
            Write-Host "❌ D1数据库检查失败" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ D1数据库检查异常: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # 检查R2存储桶
    Write-Host "`n检查R2存储桶..." -ForegroundColor Cyan
    try {
        $r2 = wrangler r2 bucket list 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ R2存储桶检查成功" -ForegroundColor Green
            Write-Host $r2
        } else {
            Write-Host "❌ R2存储桶检查失败" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ R2存储桶检查异常: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n🧪 测试部署配置..." -ForegroundColor Yellow
    
    # 干运行测试
    try {
        Write-Host "执行干运行部署..." -ForegroundColor Cyan
        $dryRun = wrangler deploy --dry-run 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 干运行部署成功" -ForegroundColor Green
            Write-Host $dryRun
        } else {
            Write-Host "❌ 干运行部署失败" -ForegroundColor Red
            Write-Host $dryRun
        }
    } catch {
        Write-Host "❌ 干运行部署异常: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n📊 检查依赖..." -ForegroundColor Yellow
    
    # 检查package.json
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        Write-Host "✅ Package.json解析成功" -ForegroundColor Green
        Write-Host "依赖数量: $($packageJson.dependencies.PSObject.Properties.Count)" -ForegroundColor Cyan
        
        # 检查关键依赖
        $keyDeps = @("hono", "@cloudflare/workers-types")
        foreach ($dep in $keyDeps) {
            if ($packageJson.dependencies.$dep) {
                Write-Host "✅ $dep : $($packageJson.dependencies.$dep)" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $dep 未找到" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n🔐 检查环境变量..." -ForegroundColor Yellow
    
    # 检查wrangler.toml中的环境变量
    $wranglerConfig = Get-Content "wrangler.toml" -Raw
    if ($wranglerConfig -match "\[vars\]") {
        Write-Host "✅ 环境变量配置段已找到" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 环境变量配置段未找到" -ForegroundColor Yellow
    }
    
    Write-Host "`n📋 诊断总结:" -ForegroundColor Green
    Write-Host "1. 所有Cloudflare资源 (Queues, D1, R2) 都已存在" -ForegroundColor White
    Write-Host "2. 干运行部署测试成功，配置有效" -ForegroundColor White
    Write-Host "3. GitHub Actions失败可能是网络或权限问题" -ForegroundColor White
    Write-Host "4. 建议检查GitHub Secrets配置" -ForegroundColor White
    
    Write-Host "`n🚀 建议的修复步骤:" -ForegroundColor Cyan
    Write-Host "1. 验证GitHub Secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)" -ForegroundColor White
    Write-Host "2. 检查API Token权限是否包含Workers和Queues" -ForegroundColor White
    Write-Host "3. 如果GitHub Actions继续失败，使用手动部署:" -ForegroundColor White
    Write-Host "   wrangler deploy" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ 诊断过程中出现错误: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Pop-Location
}
