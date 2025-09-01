# Stripe预构建支付页面集成指南

## 🎯 概述

已成功将项目的Stripe支付系统从API动态创建模式改为使用Stripe预构建支付页面模式。这种方式更稳定、更简单，避免了JSON解析错误。

## 🔧 当前配置

### 1. 预构建支付页面URL
- **单次占卜**: `https://buy.stripe.com/3cI4gBfcd9OmbLB8Tc9AA00`
- **月度套餐**: `https://buy.stripe.com/fZu8wR4xzgcK4j94CW9AA01`
- **年度套餐**: `https://buy.stripe.com/8x29AV6FHaSq16X1qK9AA02`

### 2. 重定向URL配置
- **成功页面**: `https://indicate.top/payment/success`
- **取消页面**: `https://indicate.top/payment/cancel`

## 📋 需要在Stripe后台配置的内容

### 为每个套餐创建专门的预构建支付页面

1. **登录Stripe Dashboard**
2. **进入Payment Links页面**
3. **为每个套餐创建支付链接**:

#### 单次占卜 ($1.99)
- 产品名称: "单次占卜"
- 价格: $1.99 USD
- 类型: 一次性付费
- 成功URL: `https://indicate.top/payment/success`
- 取消URL: `https://indicate.top/payment/cancel`

#### 月度套餐 ($19.90)
- 产品名称: "月度套餐"
- 价格: $19.90 USD
- 类型: 订阅 (每月)
- 成功URL: `https://indicate.top/payment/success`
- 取消URL: `https://indicate.top/payment/cancel`

#### 年度套餐 ($188)
- 产品名称: "年度套餐"
- 价格: $188 USD
- 类型: 订阅 (每年)
- 成功URL: `https://indicate.top/payment/success`
- 取消URL: `https://indicate.top/payment/cancel`

## 🔄 更新配置文件

创建好新的支付链接后，更新 `src/config/stripe.ts` 文件中的URL:

```typescript
export const STRIPE_PREBUILT_CONFIG = {
  checkoutUrls: {
    single: 'https://buy.stripe.com/YOUR_SINGLE_PAYMENT_LINK',
    monthly: 'https://buy.stripe.com/YOUR_MONTHLY_PAYMENT_LINK', 
    yearly: 'https://buy.stripe.com/YOUR_YEARLY_PAYMENT_LINK'
  }
};
```

## 🧪 测试

### 1. 使用测试组件
在开发环境中可以使用 `StripePrebuiltTest` 组件进行测试:

```tsx
import StripePrebuiltTest from './components/StripePrebuiltTest';

// 在适当的地方渲染测试组件
<StripePrebuiltTest />
```

### 2. 测试流程
1. 用户点击支付按钮
2. 重定向到Stripe预构建支付页面
3. 完成支付后重定向回成功页面
4. 系统自动识别支付状态并更新用户权限

## 🔍 支付验证

### 自动验证
- 系统会检查URL参数中的支付状态
- 支持 `redirect_status=succeeded` 参数
- 支持传统的 `session_id` 参数
- 从localStorage恢复支付信息

### 手动验证
如果需要更严格的验证，可以配置Stripe Webhook来验证支付状态。

## 🚀 优势

1. **稳定性**: 避免了API调用可能出现的JSON解析错误
2. **简单性**: 不需要复杂的后端API处理
3. **安全性**: 支付完全在Stripe安全环境中处理
4. **用户体验**: Stripe预构建页面支持多种支付方式和语言
5. **维护性**: 减少了后端代码复杂度

## 📝 注意事项

1. **URL参数**: 确保在Stripe后台正确配置成功和取消URL
2. **客户信息**: 系统会自动填充用户邮箱到支付页面
3. **订阅管理**: 订阅套餐的管理仍需要通过Stripe Dashboard或API
4. **测试模式**: 在测试环境中使用Stripe测试密钥和测试支付链接

## 🔧 故障排除

### 支付后没有正确重定向
- 检查Stripe后台的重定向URL配置
- 确保域名正确 (https://indicate.top)

### 支付状态验证失败
- 检查localStorage中的支付信息
- 查看浏览器控制台的错误日志
- 确认URL参数是否正确传递

### 用户权限没有更新
- 检查支付成功页面的处理逻辑
- 确认refreshUser函数正常工作
- 查看后端日志确认权限更新
