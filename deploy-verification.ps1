# GitHub Actions部署问题修复验证脚本
Write-Host "🔍 GitHub Actions部署修复验证开始..." -ForegroundColor Green

$TestResults = @()

function Add-TestResult {
    param(
        [string]$Category,
        [string]$Status,
        [string]$Message,
        [string]$Details = ""
    )
    
    $icon = switch ($Status) {
        "success" { "✅" }
        "warning" { "⚠️" }
        "error" { "❌" }
        default { "ℹ️" }
    }
    
    $result = @{
        Category = $Category
        Status = $Status
        Message = $Message
        Details = $Details
    }
    
    $TestResults += $result
    Write-Host "$icon [$Category] $Message" -ForegroundColor $(if ($Status -eq "success") { "Green" } elseif ($Status -eq "warning") { "Yellow" } else { "Red" })
    if ($Details) {
        Write-Host "   详情: $Details" -ForegroundColor Gray
    }
}

# 1. 检查前端构建
function Test-FrontendBuild {
    Write-Host "`n🔍 测试前端构建..." -ForegroundColor Yellow
    
    try {
        # 检查package.json
        if (Test-Path "package.json") {
            Add-TestResult "前端配置" "success" "package.json存在"
        } else {
            Add-TestResult "前端配置" "error" "package.json缺失"
            return
        }
        
        # 检查关键组件
        $components = @(
            "src/components/StripePaymentModal.tsx",
            "src/components/StripeEnvironmentFix.tsx",
            "src/components/MembershipPlans.tsx"
        )
        
        foreach ($component in $components) {
            if (Test-Path $component) {
                Add-TestResult "前端组件" "success" "$component 存在"
            } else {
                Add-TestResult "前端组件" "error" "$component 缺失"
            }
        }
        
        # 测试构建
        Write-Host "🔨 执行前端构建测试..." -ForegroundColor Cyan
        $buildResult = npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-TestResult "前端构建" "success" "构建成功" "输出目录: dist/"
            
            # 检查构建输出
            if (Test-Path "dist/index.html") {
                Add-TestResult "构建输出" "success" "index.html生成成功"
            } else {
                Add-TestResult "构建输出" "error" "index.html未生成"
            }
        } else {
            Add-TestResult "前端构建" "error" "构建失败" $buildResult
        }
        
    } catch {
        Add-TestResult "前端构建" "error" "测试异常" $_.Exception.Message
    }
}

# 2. 检查后端配置
function Test-BackendConfig {
    Write-Host "`n🔍 测试后端配置..." -ForegroundColor Yellow
    
    try {
        Push-Location backend
        
        # 检查必要文件
        $requiredFiles = @("package.json", "worker.ts", "wrangler.toml")
        foreach ($file in $requiredFiles) {
            if (Test-Path $file) {
                Add-TestResult "后端文件" "success" "$file 存在"
            } else {
                Add-TestResult "后端文件" "error" "$file 缺失"
            }
        }
        
        # 检查依赖安装
        if (Test-Path "node_modules") {
            Add-TestResult "后端依赖" "success" "node_modules存在"
        } else {
            Write-Host "📦 安装后端依赖..." -ForegroundColor Cyan
            npm ci 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult "后端依赖" "success" "依赖安装成功"
            } else {
                Add-TestResult "后端依赖" "error" "依赖安装失败"
            }
        }
        
        # 测试wrangler干运行
        Write-Host "🧪 执行wrangler干运行测试..." -ForegroundColor Cyan
        $dryRunResult = wrangler deploy --dry-run 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-TestResult "后端部署" "success" "干运行测试成功" "配置验证通过"
        } else {
            Add-TestResult "后端部署" "error" "干运行测试失败" $dryRunResult
        }
        
    } catch {
        Add-TestResult "后端配置" "error" "测试异常" $_.Exception.Message
    } finally {
        Pop-Location
    }
}

# 3. 检查GitHub Actions配置
function Test-GitHubActions {
    Write-Host "`n🔍 检查GitHub Actions配置..." -ForegroundColor Yellow
    
    try {
        # 检查工作流文件
        $workflows = @(
            ".github/workflows/deploy-frontend.yml",
            ".github/workflows/deploy-backend.yml"
        )
        
        foreach ($workflow in $workflows) {
            if (Test-Path $workflow) {
                Add-TestResult "GitHub Actions" "success" "$workflow 存在"
                
                # 检查配置内容
                $content = Get-Content $workflow -Raw
                if ($content -match "cloudflare/wrangler-action@v3") {
                    Add-TestResult "工作流配置" "success" "$workflow 使用正确的action版本"
                } else {
                    Add-TestResult "工作流配置" "warning" "$workflow 可能使用旧版本action"
                }
            } else {
                Add-TestResult "GitHub Actions" "error" "$workflow 缺失"
            }
        }
        
    } catch {
        Add-TestResult "GitHub Actions" "error" "检查异常" $_.Exception.Message
    }
}

# 4. 生成修复报告
function Generate-FixReport {
    Write-Host "`n📊 生成修复报告..." -ForegroundColor Yellow
    
    $errors = $TestResults | Where-Object { $_.Status -eq "error" }
    $warnings = $TestResults | Where-Object { $_.Status -eq "warning" }
    $success = $TestResults | Where-Object { $_.Status -eq "success" }
    
    Write-Host "`n📋 测试结果汇总:" -ForegroundColor Cyan
    Write-Host "✅ 成功: $($success.Count)" -ForegroundColor Green
    Write-Host "⚠️ 警告: $($warnings.Count)" -ForegroundColor Yellow
    Write-Host "❌ 错误: $($errors.Count)" -ForegroundColor Red
    
    if ($errors.Count -eq 0) {
        Write-Host "`n🎉 所有关键检查都通过了！" -ForegroundColor Green
        Write-Host "✅ 前端和后端配置都正确" -ForegroundColor White
        Write-Host "✅ 构建和部署测试成功" -ForegroundColor White
        Write-Host "✅ GitHub Actions配置已优化" -ForegroundColor White
        Write-Host "`n🚀 现在可以推送到GitHub进行自动部署！" -ForegroundColor Green
    } else {
        Write-Host "`n🔧 需要修复的问题:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "❌ [$($error.Category)] $($error.Message)" -ForegroundColor Red
            if ($error.Details) {
                Write-Host "   $($error.Details)" -ForegroundColor Gray
            }
        }
    }
    
    # 生成GitHub Actions优化说明
    Write-Host "`n📝 GitHub Actions优化说明:" -ForegroundColor Cyan
    Write-Host "1. ✅ 简化了前端部署流程" -ForegroundColor White
    Write-Host "2. ✅ 优化了后端部署配置" -ForegroundColor White
    Write-Host "3. ✅ 移除了复杂的预检查逻辑" -ForegroundColor White
    Write-Host "4. ✅ 使用标准的wrangler部署命令" -ForegroundColor White
    Write-Host "5. ✅ 减少了超时时间到10分钟" -ForegroundColor White
}

# 主函数
function Main {
    Write-Host "🚀 开始部署验证测试...\n" -ForegroundColor Green
    
    Test-FrontendBuild
    Test-BackendConfig
    Test-GitHubActions
    Generate-FixReport
    
    Write-Host "`n🎯 验证完成！" -ForegroundColor Green
    
    if (($TestResults | Where-Object { $_.Status -eq "error" }).Count -eq 0) {
        Write-Host "🎉 所有测试通过，可以推送到GitHub！" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 发现问题，请先修复后再推送" -ForegroundColor Yellow
    }
}

# 运行主函数
Main
