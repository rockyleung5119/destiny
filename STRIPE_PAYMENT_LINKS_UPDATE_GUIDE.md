# 🔗 Stripe真实Payment Link更新指南

## 📍 需要更新的文件位置

### 🎯 主要文件：`src/config/stripe.ts`

这是**最重要**的文件，包含所有Stripe预构建支付页面链接。

**当前配置（测试模式）：**
```typescript
// 套餐对应的预构建支付页面URL (测试模式)
checkoutUrls: {
  single: 'https://buy.stripe.com/test_00w5kCewC7OY4D7g0Mfw400',  // Single Reading (测试)
  monthly: 'https://buy.stripe.com/test_3cI7sK88eglu1qVdSEfw401', // Monthly Plan (测试)
  yearly: 'https://buy.stripe.com/8x29AV6FHaSq16X1qK9AA02'       // Yearly Plan (生产，暂未提供测试链接)
}
```

**需要更新为生产模式：**
```typescript
// 套餐对应的预构建支付页面URL (生产模式)
checkoutUrls: {
  single: 'https://buy.stripe.com/YOUR_LIVE_SINGLE_LINK',   // Single Reading (生产)
  monthly: 'https://buy.stripe.com/YOUR_LIVE_MONTHLY_LINK', // Monthly Plan (生产)
  yearly: 'https://buy.stripe.com/YOUR_LIVE_YEARLY_LINK'    // Yearly Plan (生产)
}
```

### 🔧 辅助文件：`backend/worker.ts`

**当前配置：**
```typescript
const SUBSCRIPTION_PLANS = {
  single: {
    name: 'Single Reading',
    price: 1.99,
    type: 'one_time'
  },
  monthly: {
    name: 'Monthly Plan',
    price: 19.9,
    type: 'subscription',
    interval: 'month'
  },
  yearly: {
    name: 'Yearly Plan',
    price: 199.0,  // 需要确认年度价格
    type: 'subscription',
    interval: 'year'
  }
};
```

## 🚀 如何获取真实的Payment Link

### 第1步：登录Stripe Dashboard
1. 访问 https://dashboard.stripe.com/
2. 确保切换到**生产模式**（右上角开关）

### 第2步：创建产品和价格
1. 进入 **产品** → **添加产品**
2. 为每个套餐创建产品：

**Single Reading（单次占卜）**
- 产品名称：Single Reading
- 价格：$1.99
- 类型：一次性付费

**Monthly Plan（月度套餐）**
- 产品名称：Monthly Plan
- 价格：$19.90
- 类型：订阅
- 计费周期：每月

**Yearly Plan（年度套餐）**
- 产品名称：Yearly Plan
- 价格：$199.00（或您设定的年度价格）
- 类型：订阅
- 计费周期：每年

### 第3步：创建Payment Link
1. 进入 **Payment Links** → **创建Payment Link**
2. 为每个产品创建Payment Link：

**配置选项：**
- ✅ 收集客户信息：邮箱地址
- ✅ 收集账单地址
- ✅ 允许促销代码（可选）
- ✅ 自定义成功页面：`https://indicate.top/success`
- ✅ 自定义取消页面：`https://indicate.top/payment/cancel`

### 第4步：获取Payment Link URL
创建完成后，复制每个Payment Link的URL，格式类似：
```
https://buy.stripe.com/live_XXXXXXXXXX
```

## 📝 更新步骤

### 1. 更新前端配置
编辑 `src/config/stripe.ts` 文件：

```typescript
// 将测试链接替换为生产链接
checkoutUrls: {
  single: 'https://buy.stripe.com/live_YOUR_SINGLE_LINK',
  monthly: 'https://buy.stripe.com/live_YOUR_MONTHLY_LINK', 
  yearly: 'https://buy.stripe.com/live_YOUR_YEARLY_LINK'
}
```

### 2. 更新价格信息（如需要）
如果价格有变化，同时更新：

**前端** - `src/config/stripe.ts`：
```typescript
export const PLAN_DETAILS = {
  single: {
    name: '单次占卜',
    price: '$1.99',  // 确认价格
    description: '一次性访问任何服务',
    type: 'one-time'
  },
  monthly: {
    name: '月度套餐', 
    price: '$19.90', // 确认价格
    description: '无限算命功能，每月自动续费',
    type: 'subscription'
  },
  yearly: {
    name: '年度套餐',
    price: '$199.00', // 确认年度价格
    description: '无限算命功能，每年自动续费',
    type: 'subscription'
  }
};
```

**后端** - `backend/worker.ts`：
```typescript
const SUBSCRIPTION_PLANS = {
  single: {
    name: 'Single Reading',
    price: 1.99,     // 确认价格
    type: 'one_time'
  },
  monthly: {
    name: 'Monthly Plan',
    price: 19.9,     // 确认价格
    type: 'subscription',
    interval: 'month'
  },
  yearly: {
    name: 'Yearly Plan',
    price: 199.0,    // 确认年度价格
    type: 'subscription',
    interval: 'year'
  }
};
```

## ✅ 验证步骤

### 1. 本地测试
```bash
# 启动本地开发服务器
npm run dev

# 访问定价页面，测试支付链接
```

### 2. 生产部署
```bash
# 推送到GitHub自动部署
git add .
git commit -m "Update Stripe payment links to production mode"
git push origin main
```

### 3. 功能验证
- ✅ 点击每个套餐的支付按钮
- ✅ 确认跳转到正确的Stripe支付页面
- ✅ 验证价格和产品信息正确
- ✅ 测试支付流程（小额测试）

## ⚠️ 重要注意事项

### 安全提醒
1. **备份当前配置**：更新前先备份测试模式的链接
2. **分步测试**：先更新一个套餐进行测试
3. **监控支付**：密切关注Stripe Dashboard中的支付状态

### 回滚计划
如果出现问题，可以快速回滚到测试模式：
```typescript
// 恢复测试链接
checkoutUrls: {
  single: 'https://buy.stripe.com/test_00w5kCewC7OY4D7g0Mfw400',
  monthly: 'https://buy.stripe.com/test_3cI7sK88eglu1qVdSEfw401',
  yearly: 'https://buy.stripe.com/8x29AV6FHaSq16X1qK9AA02'
}
```

## 📞 支持

如果遇到问题：
1. 检查Stripe Dashboard中的Payment Link状态
2. 验证产品和价格配置
3. 查看浏览器控制台错误信息
4. 检查网络请求是否正常

---

**🎯 关键文件：`src/config/stripe.ts` - 这是唯一需要更新Payment Link的文件！**
