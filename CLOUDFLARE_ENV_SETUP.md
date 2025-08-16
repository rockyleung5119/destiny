# Cloudflare 环境变量配置指南

## 概述

本项目使用 Cloudflare Pages (前端) 和 Cloudflare Workers (后端) 进行部署。环境变量配置分为本地开发和生产环境两套方案。

## 本地开发环境

### 前端环境变量 (.env.local)
```bash
# 前端API配置
VITE_API_BASE_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:5173
NEXTAUTH_URL=http://localhost:5173

# 功能开关
ENABLE_AI_ANALYSIS=true
ENABLE_PAYMENTS=true
ENABLE_PUSH_NOTIFICATIONS=false

# Stripe 配置 (测试环境)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef

# 环境
NODE_ENV=development
```

### 后端环境变量 (backend/.env.local)
```bash
# 服务器配置
PORT=3001
NODE_ENV=development
DEMO_MODE=false

# 数据库配置 - 本地使用SQLite
DB_PATH=./database/destiny.db
DATABASE_URL=file:./database/destiny.db

# JWT配置
JWT_SECRET=destiny-super-secret-jwt-key-for-development-only

# DeepSeek AI配置
DEEPSEEK_API_KEY=sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn
DEEPSEEK_BASE_URL=https://api.siliconflow.cn/v1/chat/completions
DEEPSEEK_MODEL=Pro/deepseek-ai/DeepSeek-R1

# 邮件服务配置 - Resend
EMAIL_SERVICE=resend
RESEND_API_KEY=re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP
RESEND_FROM_EMAIL=info@info.indicate.top
RESEND_FROM_NAME=Indicate.Top

# Stripe支付配置 (测试环境)
STRIPE_SECRET_KEY=sk_test_51234567890abcdef
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890abcdef

# 应用配置
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

## Cloudflare 生产环境配置

### Cloudflare Pages 环境变量设置

在 Cloudflare Dashboard > Pages > destiny-frontend > Settings > Environment variables 中设置：

#### 生产环境 (Production)
```bash
VITE_API_BASE_URL=https://destiny-backend.jerryliang5119.workers.dev
REACT_APP_API_BASE_URL=https://destiny-backend.jerryliang5119.workers.dev
NEXT_PUBLIC_APP_URL=https://destiny-frontend.pages.dev
NEXTAUTH_URL=https://destiny-frontend.pages.dev
ENABLE_AI_ANALYSIS=true
ENABLE_PAYMENTS=true
ENABLE_PUSH_NOTIFICATIONS=false
NODE_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key_here
```

#### 预览环境 (Preview)
```bash
VITE_API_BASE_URL=https://destiny-backend-preview.jerryliang5119.workers.dev
REACT_APP_API_BASE_URL=https://destiny-backend-preview.jerryliang5119.workers.dev
NEXT_PUBLIC_APP_URL=https://destiny-frontend.pages.dev
ENABLE_AI_ANALYSIS=true
ENABLE_PAYMENTS=true
ENABLE_PUSH_NOTIFICATIONS=false
NODE_ENV=preview
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
```

### Cloudflare Workers 环境变量

后端环境变量已在 `backend/wrangler.toml` 中配置，包含：

- **开发环境**: 默认配置，使用测试API密钥
- **预览环境**: `[env.preview]` 配置，使用测试API密钥
- **生产环境**: `[env.production]` 配置，使用生产API密钥

## 数据库配置

### 本地开发
- 使用 SQLite 数据库 (`./database/destiny.db`)
- 自动创建测试用户 `demo@example.com`

### Cloudflare D1 生产环境
- 使用 Cloudflare D1 数据库
- 数据库ID: `500716dc-3ac2-4b4a-a2ee-ad79b301228d`
- 自动确保 `demo@example.com` 测试账号存在

## 部署命令

### 本地开发
```bash
# 前端
npm run dev

# 后端
cd backend
npm run dev
```

### 部署到 Cloudflare
```bash
# 使用部署脚本
./deploy-cloudflare.ps1 -Environment production

# 或手动部署
# 后端
cd backend
wrangler deploy --env production

# 前端
npm run build -- --mode production
wrangler pages deploy dist --project-name destiny-frontend
```

## 环境变量安全说明

1. **敏感信息**: 所有API密钥和密码都应该在 Cloudflare Dashboard 中设置，不要提交到代码仓库
2. **本地开发**: `.env.local` 文件已被 `.gitignore` 忽略
3. **生产环境**: 使用 Cloudflare 的环境变量管理，确保安全性

## 故障排除

### 前后端连接问题
1. 检查 CORS 配置是否正确
2. 确认 API URL 是否正确指向后端域名
3. 验证环境变量是否正确设置

### 数据库连接问题
1. 确认 D1 数据库已创建并绑定
2. 检查数据库 ID 是否正确
3. 验证数据库表结构是否已初始化

### API 调用失败
1. 检查 API 密钥是否有效
2. 确认网络连接和防火墙设置
3. 查看 Cloudflare Workers 日志
