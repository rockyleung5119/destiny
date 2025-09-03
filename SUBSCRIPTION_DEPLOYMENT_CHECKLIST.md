# 订阅Webhook修复 - 部署检查清单 ✅

## 🎯 修复目标
解决Monthly/Yearly订阅支付成功后，用户界面仍显示"Free Plan"的问题。

## 📋 修复内容检查

### ✅ 1. 核心修复
- [x] **增强`handlePaymentSucceeded`函数** (backend/worker.ts:710-860)
  - 多层级用户信息获取
  - 智能套餐类型推断
  - 详细错误处理和日志记录

- [x] **优化`updateUserMembership`函数** (backend/worker.ts:955-1061)
  - 先停用所有现有会员记录
  - 正确处理订阅会员创建
  - 积分累加逻辑优化

### ✅ 2. 调试工具
- [x] **用户状态调试端点** (`GET /api/debug/user/:userId/membership`)
- [x] **手动修复端点** (`POST /api/debug/user/:userId/fix-subscription`)
- [x] **Webhook事件监控** (`GET /api/debug/webhook-events`)
- [x] **Stripe订阅同步** (`POST /api/debug/sync-subscription/:subscriptionId`)

### ✅ 3. 增强日志记录
- [x] **Webhook接收日志** (backend/worker.ts:2994-3014)
- [x] **详细处理过程日志**
- [x] **错误记录到数据库**

## 🧪 部署前测试

### 1. 代码检查
```bash
# 检查语法错误
npx tsc --noEmit backend/worker.ts

# 检查关键函数存在
grep -n "handlePaymentSucceeded" backend/worker.ts
grep -n "updateUserMembership" backend/worker.ts
grep -n "/api/debug/" backend/worker.ts
```

### 2. 环境变量确认
确保以下环境变量已配置：
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DB` (Cloudflare D1数据库)

### 3. 数据库表检查
确保以下表存在：
- `users`
- `memberships`
- `payment_logs`
- `system_logs`

## 🚀 部署步骤

### 1. 推送代码到GitHub
```bash
git add .
git commit -m "fix: 修复订阅webhook处理逻辑，解决Monthly/Yearly支付后权限不更新问题"
git push origin main
```

### 2. 等待自动部署完成
- GitHub Actions自动部署到Cloudflare Workers
- 确认部署成功

### 3. 验证部署
```bash
# 检查API健康状态
curl https://api.indicate.top/api/stripe/health

# 检查新端点是否可用
curl https://api.indicate.top/api/debug/webhook-events
```

## 🔍 部署后验证

### 1. 使用验证脚本
```bash
# 设置JWT token
export JWT_TOKEN="your_jwt_token_here"

# 运行验证脚本
chmod +x verify-subscription-fix.sh
./verify-subscription-fix.sh
```

### 2. 手动验证步骤

#### A. 检查当前用户状态
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.indicate.top/api/membership/status
```

#### B. 查看调试信息
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.indicate.top/api/debug/user/7/membership
```

#### C. 监控webhook事件
```bash
curl https://api.indicate.top/api/debug/webhook-events
```

### 3. 实时日志监控
```bash
# 监控Workers日志
wrangler tail destiny-backend --format=pretty
```

## 🎯 预期结果

### 修复前
- 用户界面显示: "Free Plan" / "No Active Membership"
- 数据库: 无有效的monthly/yearly会员记录
- Webhook: 处理失败或信息缺失

### 修复后
- 用户界面显示: "Monthly Plan" / "Yearly Plan"
- 数据库: 正确的会员记录，remaining_credits=9999
- Webhook: 成功处理并记录详细日志

## 🔧 故障排除

### 1. 如果webhook仍然失败
```bash
# 检查webhook配置
curl https://api.indicate.top/api/debug/webhook-events

# 手动同步订阅
curl -X POST https://api.indicate.top/api/debug/sync-subscription/SUBSCRIPTION_ID
```

### 2. 如果用户状态仍然异常
```bash
# 手动修复用户订阅
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"monthly","subscriptionId":"sub_xxx"}' \
  https://api.indicate.top/api/debug/user/USER_ID/fix-subscription
```

### 3. 如果需要重新处理webhook
- 在Stripe Dashboard中重新发送webhook事件
- 或使用同步端点手动同步状态

## 📊 监控指标

部署后需要监控：
- Webhook成功处理率
- 订阅会员激活成功率
- 用户状态查询响应时间
- 错误日志数量

## ✅ 完成确认

- [ ] 代码已推送到GitHub
- [ ] 自动部署已完成
- [ ] API健康检查通过
- [ ] 调试端点可访问
- [ ] 验证脚本测试通过
- [ ] 实际订阅支付测试成功
- [ ] 用户界面显示正确
- [ ] 日志记录正常

## 📞 支持联系

如果遇到问题：
1. 查看实时日志: `wrangler tail destiny-backend`
2. 使用调试端点获取详细信息
3. 检查Stripe Dashboard的webhook事件
4. 必要时使用手动修复功能

---

**重要提醒**: 这个修复方案包含了完整的错误处理、日志记录和手动修复功能，应该能彻底解决订阅支付后权限不更新的问题。
