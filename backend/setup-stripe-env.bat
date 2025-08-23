@echo off
REM Stripe环境变量设置脚本

echo 🔧 设置Cloudflare Workers环境变量...

REM 设置Stripe密钥（请替换为真实的密钥）
echo 设置STRIPE_SECRET_KEY...
wrangler secret put STRIPE_SECRET_KEY

echo 设置STRIPE_WEBHOOK_SECRET...
wrangler secret put STRIPE_WEBHOOK_SECRET

echo ✅ 环境变量设置完成！

REM 验证设置
echo 📋 当前环境变量列表：
wrangler secret list

echo 🧪 测试部署...
wrangler deploy --dry-run

echo 🚀 如果测试通过，运行以下命令部署：
echo wrangler deploy
pause
