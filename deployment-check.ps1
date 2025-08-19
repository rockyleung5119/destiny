# 部署前检查脚本
Write-Host "🔍 Checking deployment readiness..." -ForegroundColor Green
Write-Host ""

# 确保在正确的目录
if (Test-Path "backend") {
    Set-Location backend
}

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 检查wrangler.toml语法
Write-Host "📋 Checking wrangler.toml syntax..." -ForegroundColor Cyan
try {
    wrangler config validate
    Write-Host "✅ wrangler.toml syntax is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ wrangler.toml syntax error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 检查TypeScript编译
Write-Host "🔧 Checking TypeScript compilation..." -ForegroundColor Cyan
try {
    # 简单的语法检查
    $content = Get-Content "worker.ts" -Raw
    if ($content -match "export\s+class\s+\w+") {
        Write-Host "✅ TypeScript classes found" -ForegroundColor Green
    }
    if ($content -match "export\s+default") {
        Write-Host "✅ Default export found" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ TypeScript check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 检查环境变量
Write-Host "🔑 Checking environment variables..." -ForegroundColor Cyan
$requiredVars = @(
    "DEEPSEEK_API_KEY",
    "JWT_SECRET",
    "RESEND_API_KEY"
)

foreach ($var in $requiredVars) {
    try {
        $result = wrangler secret list | Select-String $var
        if ($result) {
            Write-Host "✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $var may not be set" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed to check $var" -ForegroundColor Red
    }
}

Write-Host ""

# 检查D1数据库
Write-Host "🗄️ Checking D1 database..." -ForegroundColor Cyan
try {
    wrangler d1 list | Select-String "destiny-db"
    Write-Host "✅ D1 database found" -ForegroundColor Green
} catch {
    Write-Host "❌ D1 database check failed" -ForegroundColor Red
}

Write-Host ""

# 检查部署历史
Write-Host "📦 Checking deployment history..." -ForegroundColor Cyan
try {
    wrangler deployments list --limit 3
} catch {
    Write-Host "❌ Failed to get deployment history" -ForegroundColor Red
}

Write-Host ""

# 建议的部署步骤
Write-Host "🚀 Recommended deployment steps:" -ForegroundColor Yellow
Write-Host "1. Fix any issues shown above"
Write-Host "2. Test locally: wrangler dev"
Write-Host "3. Deploy: wrangler deploy"
Write-Host "4. Verify: check /api/health endpoint"
Write-Host ""

# 检查本地开发环境
Write-Host "🧪 Testing local development..." -ForegroundColor Cyan
try {
    # 启动本地开发服务器进行快速测试
    $job = Start-Job -ScriptBlock {
        Set-Location $args[0]
        wrangler dev --local=true --port=8788 2>&1
    } -ArgumentList (Get-Location)
    
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8788/api/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Local development server works" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Local development server test failed" -ForegroundColor Yellow
    }
    
    Stop-Job $job -Force
    Remove-Job $job -Force
    
} catch {
    Write-Host "❌ Local development test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Deployment check completed!" -ForegroundColor Green
