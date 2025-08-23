# Stripe 完整配置指南

## 🔑 需要的 Stripe 密钥

### 1. Stripe Publishable Key (前端使用)
- **格式**: `pk_test_...` (测试) 或 `pk_live_...` (生产)
- **获取位置**: Stripe Dashboard → Developers → API keys
- **用途**: 前端初始化 Stripe.js
- **配置位置**: `.env` 文件中的 `VITE_STRIPE_PUBLISHABLE_KEY`

### 2. Stripe Secret Key (后端使用)
- **格式**: `sk_test_...` (测试) 或 `sk_live_...` (生产)
- **获取位置**: Stripe Dashboard → Developers → API keys
- **用途**: 后端调用 Stripe API
- **配置位置**: Cloudflare Workers Secret `STRIPE_SECRET_KEY`

### 3. Stripe Webhook Secret (后端使用)
- **格式**: `whsec_...`
- **获取位置**: Stripe Dashboard → Developers → Webhooks → 选择端点 → Signing secret
- **用途**: 验证 webhook 请求的真实性
- **配置位置**: Cloudflare Workers Secret `STRIPE_WEBHOOK_SECRET`

## 📋 详细设置步骤

### Step 1: 获取 API 密钥
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** → **API keys**
3. 复制 **Publishable key** 和 **Secret key**

### Step 2: 创建 Webhook 端点
1. 进入 **Developers** → **Webhooks**
2. 点击 **Add endpoint**
3. 设置端点 URL: `https://destiny-backend.rocky-liang.workers.dev/api/stripe/webhook`
4. 选择事件:
   ```
   ✅ payment_intent.succeeded
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ customer.subscription.deleted
   ✅ customer.subscription.updated
   ```
5. 点击 **Add endpoint**

### Step 3: 获取 Webhook Secret
1. 点击刚创建的 webhook 端点
2. 在 **Signing secret** 部分点击 **Reveal**
3. 复制完整的密钥 (以 `whsec_` 开头)

### Step 4: 配置环境变量

#### 前端配置 (.env 文件)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

#### 后端配置 (Cloudflare Workers Secrets)
```bash
# 设置 Secret Key
wrangler secret put STRIPE_SECRET_KEY
# 输入: sk_test_your_secret_key_here

# 设置 Webhook Secret  
wrangler secret put STRIPE_WEBHOOK_SECRET
# 输入: whsec_your_webhook_secret_here
```

## 🧪 验证配置

### 检查前端配置
在浏览器控制台中运行:
```javascript
console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### 检查后端配置
```bash
# 列出所有 secrets
wrangler secret list

# 应该看到:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
```

### 测试 Webhook
1. 在 Stripe Dashboard 的 webhook 页面
2. 点击 **Send test webhook**
3. 选择 `payment_intent.succeeded` 事件
4. 检查是否收到 200 响应

## 🔒 安全注意事项

### ⚠️ 重要提醒
- **Never** 将 Secret Key 放在前端代码中
- **Never** 将 Webhook Secret 暴露在公开代码中
- **Always** 使用 `wrangler secret put` 设置敏感信息
- **Always** 在生产环境使用 `live` 密钥

### 🛡️ 最佳实践
1. **测试环境**: 使用 `pk_test_` 和 `sk_test_` 密钥
2. **生产环境**: 使用 `pk_live_` 和 `sk_live_` 密钥
3. **定期轮换**: 定期更新 API 密钥
4. **监控使用**: 在 Stripe Dashboard 监控 API 调用

## 🚨 常见问题

### Q: Webhook Secret 在哪里找？
A: Stripe Dashboard → Developers → Webhooks → 选择端点 → Signing secret → Reveal

### Q: 为什么需要 Webhook Secret？
A: 验证 webhook 请求确实来自 Stripe，防止恶意请求

### Q: 测试环境和生产环境的密钥一样吗？
A: 不一样，测试环境用 `test` 密钥，生产环境用 `live` 密钥

### Q: 如何知道配置是否正确？
A: 运行我们的测试脚本 `node stripe-payment-fix-test.cjs`

## 📞 获取帮助

如果遇到问题：
1. 检查 Stripe Dashboard 中的 Logs
2. 查看 Cloudflare Workers 日志: `wrangler tail`
3. 运行测试脚本验证配置
4. 查看浏览器控制台错误信息
