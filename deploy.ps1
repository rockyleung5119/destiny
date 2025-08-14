# Destiny项目Cloudflare完整部署脚本 (Windows PowerShell)

Write-Host "🚀 开始部署Destiny到Cloudflare" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# 检查必要工具
Write-Host "🔍 检查部署工具..." -ForegroundColor Yellow

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查 Wrangler CLI
try {
    $wranglerVersion = wrangler --version
    Write-Host "✅ Wrangler 版本: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler CLI 未安装，正在安装..." -ForegroundColor Yellow
    npm install -g wrangler
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Wrangler 安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ 部署工具检查完成" -ForegroundColor Green

# 1. 构建前端
Write-Host "📦 构建前端..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端依赖安装失败" -ForegroundColor Red
    exit 1
}

npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 前端构建成功" -ForegroundColor Green
} else {
    Write-Host "❌ 前端构建失败" -ForegroundColor Red
    exit 1
}

# 2. 部署后端到Workers
Write-Host "📤 部署后端到Cloudflare Workers..." -ForegroundColor Yellow
Set-Location backend

# 检查是否已登录 Cloudflare
Write-Host "🔐 检查 Cloudflare 登录状态..." -ForegroundColor Yellow
try {
    wrangler whoami | Out-Null
    Write-Host "✅ 已登录 Cloudflare" -ForegroundColor Green
} catch {
    Write-Host "请先登录 Cloudflare:" -ForegroundColor Yellow
    wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cloudflare 登录失败" -ForegroundColor Red
        exit 1
    }
}

# 安装后端依赖
Write-Host "📦 安装后端依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 后端依赖安装失败" -ForegroundColor Red
    exit 1
}

# 检查数据库配置
Write-Host "🗄️ 检查 D1 数据库配置..." -ForegroundColor Yellow
if (Test-Path "wrangler.toml") {
    $wranglerContent = Get-Content "wrangler.toml" -Raw
    if ($wranglerContent -match 'database_id = "([^"]+)"') {
        $databaseId = $matches[1]
        Write-Host "✅ 找到数据库 ID: $databaseId" -ForegroundColor Green
        
        # 初始化数据库表
        Write-Host "📊 初始化数据库表..." -ForegroundColor Yellow
        wrangler d1 execute destiny-db --file=./d1-schema.sql
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 数据库表初始化成功" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 数据库表初始化失败，可能表已存在" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ 未找到数据库 ID，请先创建数据库:" -ForegroundColor Red
        Write-Host "   wrangler d1 create destiny-db" -ForegroundColor Yellow
        Write-Host "   然后更新 wrangler.toml 中的 database_id" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ 未找到 wrangler.toml 文件" -ForegroundColor Red
    exit 1
}

# 部署 Workers
Write-Host "🚀 部署 Workers..." -ForegroundColor Yellow
wrangler deploy
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 后端部署成功" -ForegroundColor Green
} else {
    Write-Host "❌ 后端部署失败" -ForegroundColor Red
    exit 1
}

Set-Location ..

# 3. 显示部署结果和后续步骤
Write-Host ""
Write-Host "🎯 部署完成检查清单:" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "✅ 前端已构建" -ForegroundColor Green
Write-Host "✅ 后端已部署到 Workers" -ForegroundColor Green
Write-Host "⏳ 前端需要手动上传到 Pages" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 后续配置步骤:" -ForegroundColor Cyan
Write-Host "1. 在 Cloudflare Dashboard 中配置 Workers 环境变量" -ForegroundColor White
Write-Host "2. 上传前端到 Cloudflare Pages" -ForegroundColor White
Write-Host "3. 配置自定义域名（可选）" -ForegroundColor White
Write-Host "4. 更新前端 API 地址指向 Workers URL" -ForegroundColor White
Write-Host "5. 测试所有功能" -ForegroundColor White

Write-Host ""
Write-Host "📤 前端部署步骤:" -ForegroundColor Cyan
Write-Host "1. 进入 Cloudflare Dashboard" -ForegroundColor White
Write-Host "2. Workers & Pages → Create application → Pages" -ForegroundColor White
Write-Host "3. Upload assets → 选择 'dist' 文件夹" -ForegroundColor White
Write-Host "4. 项目名称: destiny-frontend" -ForegroundColor White
Write-Host "5. Deploy site" -ForegroundColor White

Write-Host ""
Write-Host "🌐 预期访问地址:" -ForegroundColor Cyan
Write-Host "- Workers API: https://destiny-backend.你的账号.workers.dev" -ForegroundColor White
Write-Host "- Pages 前端: https://你的项目.pages.dev" -ForegroundColor White

Write-Host ""
Write-Host "📖 详细配置请参考: DEPLOYMENT_CHECKLIST.md" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 部署脚本执行完成！" -ForegroundColor Green
