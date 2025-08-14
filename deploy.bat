@echo off
chcp 65001 >nul
echo 🚀 开始部署Destiny到Cloudflare
echo ==================================

echo 📦 构建前端...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建成功

echo 📤 部署后端到Cloudflare Workers...
cd backend

echo 📦 安装后端依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

echo 🔐 检查 Wrangler 登录状态...
call wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 请先登录 Cloudflare:
    call wrangler login
    if %errorlevel% neq 0 (
        echo ❌ Cloudflare 登录失败
        pause
        exit /b 1
    )
)

echo 📊 初始化数据库表...
call wrangler d1 execute destiny-db --file=./d1-schema.sql
if %errorlevel% neq 0 (
    echo ⚠️ 数据库表初始化失败，可能表已存在
)

echo 🚀 部署 Workers...
call wrangler deploy
if %errorlevel% neq 0 (
    echo ❌ 后端部署失败
    pause
    exit /b 1
)
echo ✅ 后端部署成功

cd ..

echo.
echo 🎯 部署完成检查清单:
echo ==================================
echo ✅ 前端已构建
echo ✅ 后端已部署到 Workers
echo ⏳ 前端需要手动上传到 Pages
echo.
echo 📋 后续配置步骤:
echo 1. 在 Cloudflare Dashboard 中配置 Workers 环境变量
echo 2. 上传前端到 Cloudflare Pages
echo 3. 配置自定义域名（可选）
echo 4. 更新前端 API 地址指向 Workers URL
echo 5. 测试所有功能
echo.
echo 📤 前端部署步骤:
echo 1. 进入 Cloudflare Dashboard
echo 2. Workers ^& Pages → Create application → Pages
echo 3. Upload assets → 选择 'dist' 文件夹
echo 4. 项目名称: destiny-frontend
echo 5. Deploy site
echo.
echo 📖 详细配置请参考: DEPLOYMENT_CHECKLIST.md
echo.
echo 🎉 部署脚本执行完成！
pause
