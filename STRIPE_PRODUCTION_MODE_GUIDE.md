# 🚀 Stripe生产模式切换完整指南

## 📋 概述
本指南详细说明如何将Stripe支付系统从测试模式切换到生产模式，包括所需资料、环境变量配置和验证步骤。

## 🔑 前提条件

### 1. Stripe账户要求
- ✅ 已完成Stripe账户验证
- ✅ 已提供银行账户信息
- ✅ 已完成身份验证（KYC）
- ✅ 账户状态为"Active"

### 2. 业务信息要求
- ✅ 公司/个人信息完整
- ✅ 业务描述清晰
- ✅ 网站URL已验证
- ✅ 客服联系方式

## 📄 所需资料清单

### 个人账户
1. **身份证明文件**
   - 护照或身份证
   - 驾驶执照（某些地区）

2. **地址证明**
   - 银行对账单
   - 水电费账单
   - 政府文件

3. **银行信息**
   - 银行账户详情
   - 路由号码（美国）
   - IBAN（欧洲）

### 企业账户
1. **公司注册文件**
   - 营业执照
   - 公司章程
   - 税务登记证

2. **授权人员信息**
   - 法定代表人身份证明
   - 授权书（如适用）

3. **财务信息**
   - 公司银行账户
   - 税务识别号

## 🔧 环境变量配置

### 当前测试模式配置
```bash
# 测试模式密钥
STRIPE_SECRET_KEY=sk_test_51RySLYBb9puAdbwB...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RySLYBb9puAdbwB...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 生产模式配置
```bash
# 生产模式密钥（需要从Stripe Dashboard获取）
STRIPE_SECRET_KEY=sk_live_51RySLYBb9puAdbwB...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RySLYBb9puAdbwB...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

## 📝 切换步骤

### 第1步：获取生产模式密钥

1. **登录Stripe Dashboard**
   - 访问 https://dashboard.stripe.com/
   - 确保账户已激活

2. **切换到生产模式**
   - 在左上角切换开关从"Test"改为"Live"
   - 确认切换到生产环境

3. **获取API密钥**
   ```
   开发者 → API密钥 → 生产模式
   - 可发布密钥: pk_live_...
   - 秘密密钥: sk_live_...
   ```

### 第2步：配置Webhook端点

1. **创建生产Webhook**
   ```
   开发者 → Webhooks → 添加端点
   端点URL: https://destiny-backend.jerryliang5119.workers.dev/api/stripe/webhook
   ```

2. **选择事件类型**
   ```
   必需事件:
   ✅ checkout.session.completed
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ payment_intent.succeeded
   ```

3. **获取Webhook密钥**
   ```
   点击创建的Webhook → 签名密钥
   复制: whsec_live_...
   ```

### 第3步：更新Cloudflare Worker环境变量

1. **后端Worker配置**
   ```bash
   # 使用wrangler命令更新
   wrangler secret put STRIPE_SECRET_KEY
   # 输入: sk_live_51RySLYBb9puAdbwB...
   
   wrangler secret put STRIPE_WEBHOOK_SECRET
   # 输入: whsec_live_...
   ```

2. **或者在Cloudflare Dashboard中配置**
   ```
   Workers & Pages → destiny-backend → Settings → Variables
   添加环境变量:
   - STRIPE_SECRET_KEY: sk_live_...
   - STRIPE_WEBHOOK_SECRET: whsec_live_...
   ```

### 第4步：更新前端环境变量

1. **Cloudflare Pages配置**
   ```
   Pages → destiny-frontend → Settings → Environment variables
   更新变量:
   - VITE_STRIPE_PUBLISHABLE_KEY: pk_live_...
   ```

2. **本地开发环境**
   ```bash
   # .env.local 文件
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RySLYBb9puAdbwB...
   ```

### 第5步：更新产品和价格ID

1. **在Stripe Dashboard中创建生产产品**
   ```
   产品 → 添加产品
   - Single Reading: $1.99
   - Monthly Plan: $19.90/月
   - Yearly Plan: $199.00/年
   ```

2. **更新代码中的价格ID**
   ```typescript
   // backend/worker.ts 中的 SUBSCRIPTION_PLANS
   const SUBSCRIPTION_PLANS = {
     single: {
       name: 'Single Reading',
       price: 1.99,
       stripePriceId: 'price_live_...' // 生产模式价格ID
     },
     monthly: {
       name: 'Monthly Plan', 
       price: 19.9,
       stripePriceId: 'price_live_...' // 生产模式价格ID
     },
     yearly: {
       name: 'Yearly Plan',
       price: 199.0,
       stripePriceId: 'price_live_...' // 生产模式价格ID
     }
   };
   ```

## ✅ 验证步骤

### 1. 健康检查
```bash
# 检查后端配置
curl https://destiny-backend.jerryliang5119.workers.dev/api/stripe/health

# 预期响应包含:
{
  "stripe": {
    "backend": {
      "secretKeyConfigured": true,
      "webhookSecretConfigured": true,
      "secretKeyPrefix": "sk_live"
    }
  }
}
```

### 2. 前端配置检查
```bash
# 检查前端配置
curl https://destiny-backend.jerryliang5119.workers.dev/api/stripe/frontend-config

# 确认返回生产模式可发布密钥
```

### 3. 小额测试支付
- 使用真实信用卡进行小额测试（$0.50）
- 验证支付流程完整性
- 检查Webhook事件接收

### 4. 订阅测试
- 创建测试订阅
- 验证取消订阅功能
- 确认Webhook正确处理

## ⚠️ 重要注意事项

### 安全考虑
1. **密钥保护**
   - 生产密钥绝不能暴露在前端代码中
   - 使用环境变量存储所有敏感信息
   - 定期轮换密钥

2. **Webhook安全**
   - 始终验证Webhook签名
   - 使用HTTPS端点
   - 实现幂等性处理

### 合规要求
1. **PCI DSS合规**
   - 不存储信用卡信息
   - 使用Stripe托管的支付表单
   - 定期安全审计

2. **数据保护**
   - 遵守GDPR/CCPA要求
   - 实现数据删除功能
   - 加密敏感数据

### 监控和日志
1. **支付监控**
   - 设置Stripe Dashboard警报
   - 监控失败率和争议
   - 跟踪关键指标

2. **错误处理**
   - 实现详细的错误日志
   - 设置异常通知
   - 定期检查系统日志

## 🔄 回滚计划

如果生产部署出现问题，可以快速回滚到测试模式：

1. **恢复测试密钥**
   ```bash
   wrangler secret put STRIPE_SECRET_KEY
   # 输入测试密钥: sk_test_...
   ```

2. **更新前端配置**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **验证回滚**
   - 检查健康检查端点
   - 确认密钥前缀为"sk_test"

## 📞 支持和帮助

### Stripe支持
- 文档: https://stripe.com/docs
- 支持: https://support.stripe.com/
- 社区: https://github.com/stripe

### 技术支持
- 检查系统日志
- 使用测试工具验证
- 联系开发团队

---

**⚠️ 重要提醒：切换到生产模式前，请确保所有测试都已通过，并且已经充分了解Stripe的费用结构和政策。生产模式下的所有交易都是真实的，会产生实际的费用和收入。**
