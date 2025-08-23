@echo off
echo 🚀 快速部署Stripe支付修复...
echo.

echo 📋 当前修复内容:
echo ✅ 更新了真实的Stripe测试密钥
echo ✅ 优化了GitHub Actions工作流
echo ✅ 创建了测试和验证工具
echo.

echo 🔍 检查Git状态...
git status --porcelain

echo.
echo 📦 添加所有更改...
git add .

echo.
echo 💾 提交更改...
git commit -m "Fix: Update Stripe payment system with real test keys

- Update .env with real Stripe publishable key
- Optimize GitHub Actions workflows (merge 4 into 1)
- Add Stripe configuration and testing tools
- Remove duplicate deployment workflows
- Add environment setup scripts

This should fix the 'payment temporarily unavailable' issue."

echo.
echo 🚀 推送到GitHub (触发自动部署)...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ 部署成功启动!
    echo.
    echo 📊 监控部署状态:
    echo 🔗 GitHub Actions: https://github.com/YOUR_USERNAME/destiny/actions
    echo 🔗 Frontend: https://destiny-frontend.pages.dev
    echo 🔗 Backend: https://destiny-backend.rocky-liang.workers.dev
    echo.
    echo ⏱️ 预计部署时间: 3-5分钟
    echo.
    echo 🧪 部署完成后测试:
    echo 1. 访问前端查看支付计划是否可用
    echo 2. 运行: node test-stripe-production.js
    echo 3. 检查支付流程是否正常
    echo.
    echo 🔧 如果仍有问题，需要设置后端密钥:
    echo    wrangler secret put STRIPE_SECRET_KEY
    echo    wrangler secret put STRIPE_WEBHOOK_SECRET
) else (
    echo.
    echo ❌ 推送失败! 请检查:
    echo 1. Git配置是否正确
    echo 2. 网络连接是否正常
    echo 3. GitHub仓库权限是否足够
    echo.
    echo 💡 手动推送命令:
    echo    git push origin main
)

echo.
pause
