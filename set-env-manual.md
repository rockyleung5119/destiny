# Cloudflare Workers 环境变量设置指南

由于wrangler命令行工具可能有网络问题，建议通过Cloudflare Dashboard手动设置环境变量。

## 访问Cloudflare Dashboard

1. 登录 https://dash.cloudflare.com/
2. 进入 Workers & Pages
3. 找到 `destiny-backend` worker
4. 点击 Settings -> Variables

## 需要设置的环境变量

### AI服务配置
- **DEEPSEEK_API_KEY**: `sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn`
- **DEEPSEEK_BASE_URL**: `https://api.siliconflow.cn/v1/chat/completions`
- **DEEPSEEK_MODEL**: `Pro/deepseek-ai/DeepSeek-R1`

### 应用配置
- **JWT_SECRET**: `wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA`
- **CORS_ORIGIN**: `https://destiny-frontend.pages.dev`
- **FRONTEND_URL**: `https://destiny-frontend.pages.dev`
- **NODE_ENV**: `production`

### 邮件服务配置
- **RESEND_API_KEY**: `re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP`
- **RESEND_FROM_EMAIL**: `info@info.indicate.top`
- **RESEND_FROM_NAME**: `indicate.top`
- **EMAIL_SERVICE**: `resend`

### Stripe配置（测试用）
- **STRIPE_SECRET_KEY**: `pk_test_your_stripe_publishable_key_here`
- **STRIPE_PUBLISHABLE_KEY**: `sk_test_your_stripe_secret_key_here`
- **STRIPE_WEBHOOK_SECRET**: `whsec_your_webhook_secret_here`

## 设置步骤

1. 在Variables页面，点击 "Add variable"
2. 选择 "Encrypt" 对于敏感信息（API keys, secrets）
3. 输入变量名和值
4. 点击 "Save and deploy"

## 验证设置

设置完成后，访问以下URL验证：
- https://destiny-backend.wlk8s6v9y.workers.dev/api/health
- https://destiny-backend.wlk8s6v9y.workers.dev/api/ai-status

如果AI状态显示 "healthy"，说明配置成功。
