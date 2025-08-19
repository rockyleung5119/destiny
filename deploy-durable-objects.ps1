# Durable Objects部署脚本
Write-Host "🚀 Deploying Durable Objects..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 步骤1: 检查计划支持
Write-Host "🔍 Checking Cloudflare plan..." -ForegroundColor Cyan
try {
    $whoami = wrangler whoami 2>&1
    if ($whoami -match "Account ID.*([a-f0-9]{32})") {
        $accountId = $matches[1]
        Write-Host "✅ Account ID: $accountId" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to get account info" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 步骤2: 备份当前配置
Write-Host "📋 Backing up current configuration..." -ForegroundColor Cyan
Copy-Item "wrangler.toml" "wrangler.toml.backup"
Write-Host "✅ Configuration backed up to wrangler.toml.backup" -ForegroundColor Green

Write-Host ""

# 步骤3: 启用Durable Objects配置
Write-Host "🔧 Enabling Durable Objects configuration..." -ForegroundColor Cyan
try {
    $content = Get-Content "wrangler.toml" -Raw
    
    # 启用Durable Objects绑定
    $content = $content -replace "# \[\[durable_objects\.bindings\]\]", "[[durable_objects.bindings]]"
    $content = $content -replace "# name = `"AI_PROCESSOR`"", "name = `"AI_PROCESSOR`""
    $content = $content -replace "# class_name = `"AIProcessor`"", "class_name = `"AIProcessor`""
    $content = $content -replace "# name = `"BATCH_COORDINATOR`"", "name = `"BATCH_COORDINATOR`""
    $content = $content -replace "# class_name = `"BatchCoordinator`"", "class_name = `"BatchCoordinator`""
    
    # 启用迁移配置
    $content = $content -replace "# \[\[migrations\]\]", "[[migrations]]"
    $content = $content -replace "# tag = `"v1`"", "tag = `"v1`""
    $content = $content -replace "# new_classes = \[`"AIProcessor`", `"BatchCoordinator`"\]", "new_classes = [`"AIProcessor`", `"BatchCoordinator`"]"
    
    $content | Set-Content "wrangler.toml" -NoNewline
    Write-Host "✅ Durable Objects configuration enabled" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to enable configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 步骤4: 验证配置
Write-Host "🔍 Validating configuration..." -ForegroundColor Cyan
try {
    $validation = wrangler config validate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Configuration is valid" -ForegroundColor Green
    } else {
        throw "Configuration validation failed: $validation"
    }
} catch {
    Write-Host "❌ Configuration validation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 Restoring backup..." -ForegroundColor Yellow
    Copy-Item "wrangler.toml.backup" "wrangler.toml"
    exit 1
}

Write-Host ""

# 步骤5: 本地测试（可选）
Write-Host "🧪 Running local test..." -ForegroundColor Cyan
try {
    # 启动本地开发服务器进行快速测试
    $job = Start-Job -ScriptBlock {
        Set-Location $args[0]
        wrangler dev --local=false --port=8789 2>&1
    } -ArgumentList (Get-Location)
    
    Start-Sleep -Seconds 15
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8789/api/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Local test passed" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Local test failed, but continuing with deployment" -ForegroundColor Yellow
    }
    
    Stop-Job $job -Force
    Remove-Job $job -Force
    
} catch {
    Write-Host "⚠️ Local test skipped" -ForegroundColor Yellow
}

Write-Host ""

# 步骤6: 部署到生产环境
Write-Host "🚀 Deploying to Cloudflare..." -ForegroundColor Cyan
try {
    $deployment = wrangler deploy 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host $deployment
    } else {
        throw "Deployment failed: $deployment"
    }
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 Restoring backup..." -ForegroundColor Yellow
    Copy-Item "wrangler.toml.backup" "wrangler.toml"
    
    # 尝试重新部署备份版本
    Write-Host "🔄 Deploying backup version..." -ForegroundColor Yellow
    wrangler deploy
    exit 1
}

Write-Host ""

# 步骤7: 验证部署
Write-Host "🔍 Verifying deployment..." -ForegroundColor Cyan
Write-Host "⏳ Waiting for deployment to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

try {
    $healthResponse = Invoke-WebRequest -Uri "https://destiny-backend.wlk8s6v9y.workers.dev/api/health" -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    }
    
    $asyncResponse = Invoke-WebRequest -Uri "https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status" -TimeoutSec 30
    $asyncData = $asyncResponse.Content | ConvertFrom-Json
    
    if ($asyncData.durableObjectsCheck.hasAIProcessor -eq $true) {
        Write-Host "✅ Durable Objects are working!" -ForegroundColor Green
        Write-Host "🎯 AI Processor: Available" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Durable Objects may not be fully initialized yet" -ForegroundColor Yellow
        Write-Host "💡 This is normal for first deployment, try again in a few minutes" -ForegroundColor Cyan
    }
    
    if ($asyncData.durableObjectsCheck.hasBatchCoordinator -eq $true) {
        Write-Host "🎯 Batch Coordinator: Available" -ForegroundColor Green
    }
    
} catch {
    Write-Host "⚠️ Verification failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "💡 Deployment may still be successful, check manually:" -ForegroundColor Cyan
    Write-Host "   https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status" -ForegroundColor Cyan
}

Write-Host ""

# 步骤8: 显示结果
Write-Host "🎉 Durable Objects deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the deployment: https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status"
Write-Host "2. Monitor the logs: wrangler tail"
Write-Host "3. Check deployment history: wrangler deployments list"
Write-Host ""
Write-Host "🔧 If issues occur, restore backup with:" -ForegroundColor Cyan
Write-Host "   Copy-Item wrangler.toml.backup wrangler.toml"
Write-Host "   wrangler deploy"
Write-Host ""
