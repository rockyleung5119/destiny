@echo off
REM Cloudflare Stripe环境变量设置脚本
REM 用于修复生产环境支付系统问题

echo ========================================
echo   Cloudflare Stripe 环境变量设置工具
echo ========================================
echo.

REM 设置颜色
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo %BLUE%🔧 正在设置Cloudflare环境变量...%RESET%
echo.

REM 1. 设置Cloudflare Workers环境变量（后端）
echo %YELLOW%📦 设置Cloudflare Workers环境变量（后端）...%RESET%
cd backend

echo 设置 STRIPE_SECRET_KEY...
echo %YELLOW%请输入Stripe Secret Key (sk_test_... 或 sk_live_...):%RESET%
wrangler secret put STRIPE_SECRET_KEY

echo.
echo 设置 STRIPE_WEBHOOK_SECRET...
echo %YELLOW%请输入Stripe Webhook Secret (whsec_...):%RESET%
wrangler secret put STRIPE_WEBHOOK_SECRET

echo.
echo 设置 STRIPE_PUBLISHABLE_KEY...
echo %YELLOW%请输入Stripe Publishable Key (pk_test_... 或 pk_live_...):%RESET%
wrangler secret put STRIPE_PUBLISHABLE_KEY

echo.
echo %GREEN%✅ Cloudflare Workers环境变量设置完成！%RESET%

REM 验证Workers环境变量
echo.
echo %BLUE%📋 验证Cloudflare Workers环境变量...%RESET%
wrangler secret list

echo.
echo %YELLOW%⚠️  重要提醒：%RESET%
echo %YELLOW%   Cloudflare Pages前端环境变量需要在Dashboard中手动设置：%RESET%
echo.
echo %BLUE%🌐 Cloudflare Pages环境变量设置步骤：%RESET%
echo   1. 访问 https://dash.cloudflare.com/
echo   2. 进入 Pages → destiny-frontend → Settings
echo   3. 找到 Environment variables 部分
echo   4. 点击 "Add variable"
echo   5. 设置以下变量：
echo.
echo %GREEN%   变量名: VITE_STRIPE_PUBLISHABLE_KEY%RESET%
echo %GREEN%   值: [刚才输入的Publishable Key]%RESET%
echo %GREEN%   环境: Production%RESET%
echo.
echo   6. 点击 "Save"
echo   7. 重新部署前端应用
echo.

REM 测试部署
echo %BLUE%🧪 测试后端部署...%RESET%
wrangler deploy --dry-run

echo.
echo %GREEN%✅ 设置完成！%RESET%
echo.
echo %YELLOW%📝 下一步操作：%RESET%
echo   1. 在Cloudflare Pages Dashboard中设置前端环境变量
echo   2. 重新部署前端应用
echo   3. 测试支付功能
echo.

pause
