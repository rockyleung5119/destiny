# Stripe支付系统部署和测试指南

## 🎯 概述

本指南将帮助您完成Stripe支付系统在Cloudflare生产环境中的部署和测试。

## 📋 部署前检查清单

### 1. 系统完整性检查
```bash
cd backend
node stripe-system-check.cjs
```

### 2. 必需的环境变量
确保以下环境变量已配置：

**Cloudflare Workers Secrets:**
- `STRIPE_SECRET_KEY` - Stripe密钥
- `STRIPE_WEBHOOK_SECRET` - Webhook密钥
- `JWT_SECRET` - JWT签名密钥
- `DEEPSEEK_API_KEY` - AI服务密钥
- `RESEND_API_KEY` - 邮件服务密钥

**前端环境变量 (.env):**
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe公钥
- `VITE_API_BASE_URL` - 后端API地址

### 3. 数据库迁移
```bash
# 添加Stripe相关字段
wrangler d1 execute destiny-db --file=./add-stripe-fields.sql
```

## 🚀 部署步骤

### 1. 检查网络连接
```bash
# 测试Cloudflare连接
ping cloudflare.com
```

### 2. 更新Wrangler（如果需要）
```bash
npm install -g wrangler@latest
```

### 3. 验证配置
```bash
# 检查secrets（可能需要重新配置）
wrangler secret list

# 如果需要重新设置secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. 部署到Cloudflare Workers
```bash
cd backend
wrangler deploy
```

### 5. 验证部署
```bash
# 测试健康检查
curl https://destiny-backend.rocky-liang.workers.dev/api/health
```

## 🧪 测试流程

### 1. 后端API测试
```bash
# 运行集成测试
node test-stripe-integration.js
```

### 2. 前端测试
1. 访问前端应用
2. 登录测试账户 (demo@example.com / password123)
3. 导航到支付测试页面
4. 使用测试卡号进行支付测试

### 3. Stripe测试卡号
- **成功支付:** 4242 4242 4242 4242
- **拒绝支付:** 4000 0000 0000 0002
- **需要3D验证:** 4000 0000 0000 3220
- **过期日期:** 任何未来日期
- **CVC:** 任何3位数字

## 🔧 故障排除

### 常见问题和解决方案

#### 1. 网络连接问题
```bash
# 检查代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 临时禁用代理（如果需要）
unset HTTP_PROXY
unset HTTPS_PROXY
```

#### 2. Stripe密钥问题
- 确保使用正确的测试/生产密钥
- 检查密钥格式（sk_test_... 或 sk_live_...）
- 验证密钥权限

#### 3. Webhook配置
- 在Stripe Dashboard中配置webhook端点
- 端点URL: `https://destiny-backend.rocky-liang.workers.dev/api/stripe/webhook`
- 监听事件: `payment_intent.succeeded`, `invoice.payment_succeeded`, `customer.subscription.deleted`

#### 4. CORS问题
- 检查wrangler.toml中的CORS配置
- 确保前端域名在允许列表中

### 日志查看
```bash
# 实时查看Workers日志
wrangler tail

# 查看特定时间段的日志
wrangler tail --since 1h
```

## 📊 监控和维护

### 1. 性能监控
- 使用Cloudflare Dashboard监控请求量
- 检查错误率和响应时间
- 监控数据库查询性能

### 2. 定期检查
- 每周运行系统完整性检查
- 监控Stripe webhook状态
- 检查支付成功率

### 3. 备份策略
- 定期备份D1数据库
- 保存重要配置文件
- 记录环境变量配置

## 🎉 成功标准

部署成功的标志：
- ✅ 健康检查返回200状态
- ✅ 用户可以成功登录
- ✅ 支付流程完整运行
- ✅ Webhook正确处理事件
- ✅ 会员状态正确更新

## 📞 支持

如果遇到问题：
1. 检查Cloudflare Workers日志
2. 验证Stripe Dashboard中的事件
3. 运行系统完整性检查
4. 查看本指南的故障排除部分

## 🔄 回滚计划

如果部署出现问题：
1. 使用之前的工作版本回滚
2. 检查并修复配置问题
3. 重新测试后再次部署

---

**注意:** 在生产环境中，请确保使用Stripe的生产密钥，并在Stripe Dashboard中配置正确的webhook端点。
