# Stripe支付系统修复指南

## 问题描述
项目在Cloudflare生产环境中Stripe支付系统无法正常工作，需要修复环境变量配置和集成问题。

## 修复内容

### 1. 已修复的问题

#### ✅ Cloudflare Workers环境变量配置
- 在 `backend/index.js` 中添加了Stripe环境变量设置
- 确保Workers能够访问Stripe密钥

#### ✅ 环境变量配置脚本更新
- 更新了 `set-cloudflare-env.ps1` 脚本
- 添加了正确的Stripe测试密钥

#### ✅ 前端Stripe配置
- 更新了 `.env.production` 文件中的Stripe公钥
- 确保前端使用正确的测试密钥

### 2. Stripe密钥配置

⚠️ **安全提醒**: 请使用您自己的Stripe密钥，不要使用示例中的密钥。

```
Secret Key: 您的Stripe密钥 (sk_test_... 或 sk_live_...)
Publishable Key: 您的Stripe公钥 (pk_test_... 或 pk_live_...)
```

## 部署步骤

### 步骤1: 设置Stripe环境变量

运行专用的Stripe环境变量设置脚本：

```powershell
.\set-stripe-env.ps1
```

或者手动设置（请替换为您的真实密钥）：

```powershell
cd backend
echo "您的Stripe密钥" | wrangler secret put STRIPE_SECRET_KEY
echo "您的Stripe公钥" | wrangler secret put STRIPE_PUBLISHABLE_KEY
echo "您的Stripe Webhook密钥" | wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 步骤2: 部署后端

```powershell
cd backend
wrangler deploy
```

### 步骤3: 设置前端环境变量

在Cloudflare Pages项目设置中添加以下环境变量（请替换为您的真实公钥）：

```
VITE_STRIPE_PUBLISHABLE_KEY=您的Stripe公钥
REACT_APP_STRIPE_PUBLISHABLE_KEY=您的Stripe公钥
ENABLE_PAYMENTS=true
```

### 步骤4: 测试配置

运行测试脚本验证Stripe配置：

```bash
node test-stripe-config.js
```

## 验证步骤

1. **检查环境变量**
   ```powershell
   cd backend
   wrangler secret list
   ```

2. **测试支付功能**
   - 访问前端应用
   - 尝试选择会员套餐
   - 验证支付模态框是否正常显示
   - 使用Stripe测试卡号进行测试

3. **检查日志**
   ```powershell
   wrangler tail
   ```

## 测试卡号

使用以下Stripe测试卡号进行测试：

- **成功支付**: 4242 4242 4242 4242
- **需要验证**: 4000 0025 0000 3155
- **被拒绝**: 4000 0000 0000 0002

## 注意事项

1. **安全性**: 当前使用的是测试密钥，生产环境需要使用真实的Stripe密钥
2. **Webhook**: 如需要Webhook功能，需要在Stripe Dashboard中配置Webhook端点
3. **监控**: 建议在Stripe Dashboard中监控支付状态和错误日志

## 故障排除

### 常见问题

1. **支付功能暂时不可用**
   - 检查前端环境变量是否正确设置
   - 确认Stripe公钥格式正确

2. **Stripe secret key not configured**
   - 检查后端环境变量是否正确设置
   - 运行 `wrangler secret list` 确认密钥已设置

3. **支付处理失败**
   - 检查网络连接
   - 验证Stripe密钥是否有效
   - 查看Cloudflare Workers日志

### 联系支持

如果问题仍然存在，请检查：
1. Cloudflare Workers日志
2. Stripe Dashboard中的日志
3. 浏览器开发者工具中的网络请求
