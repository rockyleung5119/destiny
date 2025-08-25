# Cloudflare Pages 环境变量设置指南

## 🎯 问题分析

当前生产环境Stripe支付系统报错的根本原因：
- ✅ `VITE_STRIPE_PUBLISHABLE_KEY` 在Cloudflare Pages中设置了，但值仍是占位符
- ❌ 环境变量没有正确传递到前端应用

## 🔧 正确的设置方法

### 方法1: 通过Cloudflare Dashboard (推荐)

1. **访问Cloudflare Pages Dashboard**
   - 登录 https://dash.cloudflare.com/
   - 选择 "Pages" 
   - 找到 "destiny-frontend" 项目

2. **设置环境变量**
   - 点击项目名称进入项目详情
   - 选择 "Settings" 标签
   - 找到 "Environment variables" 部分
   - 点击 "Add variable"

3. **添加Stripe密钥**
   ```
   Variable name: VITE_STRIPE_PUBLISHABLE_KEY
   Value: pk_live_YOUR_PRODUCTION_STRIPE_KEY_HERE
   Environment: Production
   ```

4. **保存并重新部署**
   - 点击 "Save"
   - 触发新的部署以使环境变量生效

### 方法2: 通过wrangler命令行 (备选)

```bash
# 注意：Pages项目的环境变量设置方式与Workers不同
# 需要使用特定的wrangler pages命令

# 检查当前项目
wrangler pages project list

# 设置环境变量 (如果支持)
wrangler pages project env set VITE_STRIPE_PUBLISHABLE_KEY pk_live_YOUR_KEY --project-name=destiny-frontend

# 或者通过部署时设置
wrangler pages deploy dist --project-name=destiny-frontend --env VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
```

## 🔑 生产环境Stripe密钥

### 获取生产Stripe密钥

1. **登录Stripe Dashboard**
   - 访问 https://dashboard.stripe.com/
   - 确保切换到 "Live" 模式（不是Test模式）

2. **获取Publishable Key**
   - 在左侧菜单选择 "Developers" → "API keys"
   - 复制 "Publishable key" (以 `pk_live_` 开头)

3. **安全注意事项**
   - 生产密钥以 `pk_live_` 开头
   - 测试密钥以 `pk_test_` 开头
   - 确保使用正确的环境密钥

## 🧪 验证配置

### 检查环境变量是否生效

在浏览器控制台中运行：
```javascript
// 检查环境变量
console.log('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
console.log('Environment:', import.meta.env.MODE);
```

### 预期结果
```javascript
// 正确配置应该显示：
VITE_STRIPE_PUBLISHABLE_KEY: "pk_live_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um"
Environment: "production"
```

## 🚨 当前问题的解决方案

基于诊断结果，当前问题是：
1. **环境变量值仍是占位符** - 需要设置真实的Stripe密钥
2. **环境变量未正确传递** - 可能需要重新部署

### 立即修复步骤

1. **通过Cloudflare Dashboard设置**
   - 访问 Cloudflare Pages → destiny-frontend → Settings → Environment variables
   - 设置 `VITE_STRIPE_PUBLISHABLE_KEY` 为真实的生产密钥

2. **触发重新部署**
   - 在Cloudflare Pages Dashboard中点击 "Create deployment"
   - 或者推送代码到GitHub触发自动部署

3. **验证修复**
   - 访问 https://indicate.top/membership
   - 点击支付按钮
   - 查看Stripe诊断结果

## 📋 生产环境标准清单

- [ ] 使用 `pk_live_` 开头的生产Stripe密钥
- [ ] 在Cloudflare Pages Dashboard中正确设置环境变量
- [ ] 移除代码中的硬编码测试密钥
- [ ] 确保环境变量在部署后生效
- [ ] 验证支付功能在生产环境正常工作

## 🔗 相关链接

- [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Cloudflare Pages环境变量文档](https://developers.cloudflare.com/pages/configuration/build-configuration/)
