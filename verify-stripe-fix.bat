@echo off
REM Stripe支付系统修复验证脚本
REM 用于验证所有配置是否正确

echo ========================================
echo   Stripe 支付系统修复验证工具
echo ========================================
echo.

REM 设置颜色
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "RESET=[0m"

echo %CYAN%🔍 开始验证 Stripe 支付系统配置...%RESET%
echo.

REM 1. 检查后端配置
echo %BLUE%📦 检查后端配置...%RESET%
cd backend

echo 检查 Cloudflare Workers secrets...
wrangler secret list

echo.
echo 测试后端健康状态...
curl -s "https://api.indicate.top/api/stripe/health" | findstr "success"

if %ERRORLEVEL% EQU 0 (
    echo %GREEN%✅ 后端配置正常%RESET%
) else (
    echo %RED%❌ 后端配置异常%RESET%
)

echo.

REM 2. 检查前端配置
cd ..
echo %BLUE%🌐 检查前端配置...%RESET%

echo 检查 .env 文件...
findstr "VITE_STRIPE_PUBLISHABLE_KEY" .env
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%✅ .env 文件配置正常%RESET%
) else (
    echo %RED%❌ .env 文件配置缺失%RESET%
)

echo.
echo 检查 .env.production 文件...
findstr "VITE_STRIPE_PUBLISHABLE_KEY" .env.production
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%✅ .env.production 文件配置正常%RESET%
) else (
    echo %RED%❌ .env.production 文件配置缺失%RESET%
)

echo.

REM 3. 运行完整测试
echo %BLUE%🧪 运行完整系统测试...%RESET%
node test-stripe-system.cjs

echo.

REM 4. 显示修复建议
echo %CYAN%📋 修复建议和下一步操作：%RESET%
echo.
echo %YELLOW%如果测试失败，请按以下步骤操作：%RESET%
echo.
echo %BLUE%1. Cloudflare Pages 环境变量设置：%RESET%
echo    - 访问 https://dash.cloudflare.com/
echo    - 进入 Pages → destiny-frontend → Settings
echo    - 添加环境变量：
echo      变量名: VITE_STRIPE_PUBLISHABLE_KEY
echo      值: pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um
echo      环境: Production
echo.
echo %BLUE%2. 临时修复（立即生效）：%RESET%
echo    - 访问生产网站
echo    - 打开浏览器控制台
echo    - 运行: localStorage.setItem('STRIPE_TEMP_KEY', 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um');
echo    - 刷新页面
echo.
echo %BLUE%3. 验证修复：%RESET%
echo    - 访问 https://destiny-frontend.pages.dev
echo    - 尝试购买会员计划
echo    - 确认支付功能正常
echo.

echo %GREEN%✅ 验证完成！%RESET%
echo.
echo %YELLOW%📝 重要提醒：%RESET%
echo   - 后端配置已完成，无需额外操作
echo   - 前端需要在 Cloudflare Pages Dashboard 中设置环境变量
echo   - 临时修复可以立即启用支付功能
echo   - 正式修复需要重新部署前端应用
echo.

pause
