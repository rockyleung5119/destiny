# 🚀 Cloudflare Pages 环境变量设置指南

## 🎯 当前状态
- ✅ 后端 Cloudflare Workers 配置完成
- ✅ 所有 Stripe secrets 已设置
- ❌ 前端 Cloudflare Pages 环境变量需要设置

## 🔧 立即修复步骤

### 1. 访问 Cloudflare Dashboard
```
https://dash.cloudflare.com/
```

### 2. 导航到 Pages 项目
1. 点击左侧菜单的 "Pages"
2. 找到并点击 "destiny-frontend" 项目
3. 点击 "Settings" 标签

### 3. 设置环境变量
1. 在页面中找到 "Environment variables" 部分
2. 点击 "Add variable" 按钮
3. 填写以下信息：

```
Variable name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um
Environment: Production (生产环境)
```

4. 点击 "Save" 保存

### 4. 触发重新部署
设置环境变量后，需要重新部署才能生效：

**方法1: 自动部署（推荐）**
- 推送任何代码更改到 GitHub
- Cloudflare Pages 会自动重新部署

**方法2: 手动部署**
- 在 Cloudflare Pages 项目页面
- 点击 "Deployments" 标签
- 点击 "Retry deployment" 或 "Create deployment"

## 🧪 验证设置

### 1. 检查环境变量
部署完成后，访问生产网站，打开浏览器控制台：
```javascript
console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

应该显示：
```
Stripe Key: pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um
```

### 2. 测试支付功能
1. 访问 https://destiny-frontend.pages.dev
2. 尝试购买会员计划
3. 确认支付模态框正常显示
4. 确认没有"支付功能暂时不可用"错误

### 3. 后端连接测试
```bash
curl https://api.indicate.top/api/stripe/health
```

## 🔍 故障排除

### 如果环境变量仍然无效：

1. **检查变量名**
   - 确保使用 `VITE_STRIPE_PUBLISHABLE_KEY`
   - 注意大小写敏感

2. **检查环境设置**
   - 确保在 "Production" 环境中设置
   - 不要在 "Preview" 环境中设置

3. **清除缓存**
   - 清除浏览器缓存
   - 使用无痕模式测试

4. **强制重新部署**
   - 推送一个小的代码更改
   - 或在 Cloudflare Pages 中手动触发部署

## 🛠️ 临时修复方案

如果需要立即测试支付功能，可以使用临时修复：

1. 访问生产网站
2. 打开浏览器控制台
3. 运行以下命令：
```javascript
localStorage.setItem('STRIPE_TEMP_KEY', 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um');
location.reload();
```

## 📝 技术说明

### 为什么使用 VITE_ 前缀？
- Vite 只会将以 `VITE_` 开头的环境变量暴露给客户端
- `REACT_APP_` 前缀是 Create React App 的约定，在 Vite 中需要特殊配置

### 环境变量优先级
```typescript
1. VITE_STRIPE_PUBLISHABLE_KEY (推荐)
2. REACT_APP_STRIPE_PUBLISHABLE_KEY (备选)
3. localStorage.STRIPE_TEMP_KEY (临时修复)
```

### 安全注意事项
- Stripe Publishable Key 是公开的，可以安全地暴露给客户端
- Secret Key 绝不能暴露给客户端，只能在服务器端使用

## ✅ 完成检查清单

- [ ] Cloudflare Pages 环境变量已设置
- [ ] 应用已重新部署
- [ ] 浏览器控制台显示正确的 Stripe Key
- [ ] 支付模态框正常显示
- [ ] 测试支付流程完整

---

**最后更新**: 2025-08-25  
**状态**: 等待 Cloudflare Pages 环境变量设置
