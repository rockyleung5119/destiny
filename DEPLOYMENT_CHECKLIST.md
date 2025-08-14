# 🚀 Cloudflare 部署完整检查清单

## 📋 部署前准备

### 1. 账号和工具
- [ ] Cloudflare 账号已创建
- [ ] Wrangler CLI 已安装 (`npm install -g wrangler`)
- [ ] 已登录 Cloudflare (`wrangler login`)
- [ ] 获取 Account ID: `7590a463bab8766be0d1c1b181cecc44`
- [ ] 获取 API Token: `LO3MbO19EQOB6cI_0webBt3FRj9NJ-eF3kJk1hMo`

### 2. API 密钥准备
- [ ] DeepSeek API Key: `sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn`
- [ ] Resend API Key: `re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP`
- [ ] JWT Secret: 生成强密码
- [ ] Stripe Keys (如需支付功能)

## 🗄️ 数据库部署

### 1. 创建 D1 数据库
```bash
cd backend
wrangler d1 create destiny-db
```

### 2. 记录数据库 ID
- [ ] 复制返回的 database_id
- [ ] 更新 `backend/wrangler.toml` 中的 `database_id`

### 3. 初始化数据库
```bash
wrangler d1 execute destiny-db --file=./d1-schema.sql
```

## 🔧 后端部署 (Cloudflare Workers)

### 1. 配置文件检查
- [ ] `backend/wrangler.toml` 配置正确
- [ ] `backend/worker.js` 使用 Hono 框架
- [ ] `backend/workers-package.json` 依赖正确

### 2. 部署 Workers
```bash
cd backend
npm install
wrangler deploy
```

### 3. 配置环境变量
在 Cloudflare Dashboard → Workers & Pages → destiny-backend → Settings → Variables:

```env
JWT_SECRET=your-super-secure-jwt-secret-key-here
DEEPSEEK_API_KEY=sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn
DEEPSEEK_BASE_URL=https://api.siliconflow.cn/v1/chat/completions
DEEPSEEK_MODEL=Pro/deepseek-ai/DeepSeek-R1
RESEND_API_KEY=re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP
RESEND_FROM_EMAIL=info@info.indicate.top
RESEND_FROM_NAME=Indicate.Top
EMAIL_SERVICE=resend
FRONTEND_URL=https://your-pages-domain.pages.dev
CORS_ORIGIN=https://your-pages-domain.pages.dev
```

## 🌐 前端部署 (Cloudflare Pages)

### 1. 构建前端
```bash
npm install
npm run build
```

### 2. 部署到 Pages
**方法一：手动上传**
1. 进入 Cloudflare Dashboard
2. Workers & Pages → Create application → Pages
3. Upload assets → 选择 `dist` 文件夹
4. 项目名称: `destiny-frontend`
5. Deploy site

**方法二：Git 连接**
1. 推送代码到 GitHub
2. Pages → Connect to Git
3. 选择仓库
4. 构建设置:
   - 构建命令: `npm run build`
   - 输出目录: `dist`
   - Node.js 版本: `18`

### 3. 配置环境变量
在 Pages 项目 → Settings → Environment variables:
```env
VITE_API_BASE_URL=https://destiny-backend.your-account.workers.dev
NODE_ENV=production
```

## 🔗 域名和 CORS 配置

### 1. 获取部署 URL
- [ ] Workers URL: `https://destiny-backend.your-account.workers.dev`
- [ ] Pages URL: `https://your-project.pages.dev`

### 2. 更新 CORS 配置
- [ ] 在 Workers 环境变量中更新 `FRONTEND_URL` 和 `CORS_ORIGIN`
- [ ] 在前端环境变量中更新 `VITE_API_BASE_URL`

### 3. 自定义域名 (可选)
- [ ] 在 Pages 中添加自定义域名
- [ ] 配置 DNS 记录
- [ ] 更新所有相关的 URL 配置

## 🧪 部署后测试

### 1. 基础功能测试
- [ ] 前端页面正常加载
- [ ] API 健康检查: `/api/health`
- [ ] 用户注册功能
- [ ] 用户登录功能
- [ ] JWT 认证功能

### 2. 核心功能测试
- [ ] 用户资料更新
- [ ] 邮件发送功能
- [ ] AI 算命功能
- [ ] 数据库读写操作

### 3. 性能和安全测试
- [ ] 页面加载速度
- [ ] API 响应时间
- [ ] CORS 配置正确
- [ ] 安全头配置

## 🔧 故障排除

### 常见问题
1. **Workers 部署失败**
   - 检查 wrangler.toml 配置
   - 确认已登录 Cloudflare
   - 检查代码语法错误

2. **数据库连接失败**
   - 确认 D1 数据库已创建
   - 检查 database_id 是否正确
   - 确认数据库表已初始化

3. **CORS 错误**
   - 检查 Workers 中的 CORS 配置
   - 确认前端 URL 在允许列表中
   - 检查环境变量设置

4. **API 调用失败**
   - 检查 API 密钥是否正确
   - 确认环境变量已设置
   - 查看 Workers 日志

## 📊 监控和维护

### 1. 设置监控
- [ ] 启用 Cloudflare Analytics
- [ ] 配置错误日志监控
- [ ] 设置性能监控

### 2. 定期维护
- [ ] 检查 API 密钥有效期
- [ ] 更新依赖包
- [ ] 备份数据库
- [ ] 监控使用量和成本

## 🎉 部署完成

恭喜！你的 Destiny 项目已成功部署到 Cloudflare！

**访问地址:**
- 前端: https://your-project.pages.dev
- API: https://destiny-backend.your-account.workers.dev

**下一步:**
1. 测试所有功能
2. 配置自定义域名
3. 设置监控和备份
4. 优化性能和安全性
