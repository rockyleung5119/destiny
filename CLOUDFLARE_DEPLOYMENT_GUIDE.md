# 🚀 Destiny项目 Cloudflare部署完整指南

## 📋 部署概览

本指南将帮助您将Destiny算命应用部署到Cloudflare，包括：
- **前端**: Cloudflare Pages (React + Vite)
- **后端**: Cloudflare Workers (Node.js API)
- **数据库**: Cloudflare D1 (SQLite)
- **邮件**: Resend API
- **AI服务**: DeepSeek API

---

## 🎯 第一步：创建Cloudflare账号

### 1.1 注册账号
1. 访问 [Cloudflare官网](https://www.cloudflare.com)
2. 点击 **"Sign Up"**
3. 输入邮箱和密码
4. 验证邮箱
5. 选择 **免费计划** (Free Plan)

### 1.2 验证功能
登录后确认可以看到：
- ✅ Dashboard主页
- ✅ Workers & Pages选项卡
- ✅ D1数据库选项

---

## 🛠️ 第二步：安装工具

### 2.1 安装Wrangler CLI
```bash
npm install -g wrangler
```

### 2.2 验证安装
```bash
wrangler --version
```

### 2.3 登录Cloudflare
```bash
wrangler login
```

---

## 📤 第三步：部署前端 (Cloudflare Pages)

### 3.1 构建前端
```bash
# 在项目根目录
npm run build
```

### 3.2 部署到Pages

**方法一：通过Dashboard上传**
1. 进入 **"Workers & Pages"**
2. 点击 **"Create application"**
3. 选择 **"Pages"**
4. 选择 **"Upload assets"**
5. 上传整个 `dist` 文件夹
6. 项目名称: `destiny-frontend`
7. 点击 **"Deploy site"**

**方法二：通过Git连接**
1. 将代码推送到GitHub
2. 在Pages中选择 **"Connect to Git"**
3. 选择仓库
4. 构建设置:
   - **构建命令**: `npm run build`
   - **输出目录**: `dist`
   - **Node.js版本**: `18`

---

## 🔧 第四步：部署后端 (Cloudflare Workers)

### 4.1 创建D1数据库
```bash
cd backend
wrangler d1 create destiny-db
```

记录返回的数据库ID，更新 `wrangler.toml` 中的 `database_id`。

### 4.2 初始化数据库
```bash
# 创建数据库表
wrangler d1 execute destiny-db --file=./database/schema.sql
```

### 4.3 部署Workers
```bash
wrangler deploy
```

---

## ⚙️ 第五步：配置环境变量

在Cloudflare Dashboard中设置以下环境变量：

### 5.1 Workers环境变量
进入 **Workers & Pages** → **destiny-backend** → **Settings** → **Variables**

```env
# JWT认证
JWT_SECRET=your-super-secure-jwt-secret-key-here

# DeepSeek AI
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.siliconflow.cn/v1/chat/completions
DEEPSEEK_MODEL=Pro/deepseek-ai/DeepSeek-R1

# 邮件服务
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Indicate.Top

# 应用配置
NODE_ENV=production
FRONTEND_URL=https://your-pages-domain.pages.dev
CORS_ORIGIN=https://your-pages-domain.pages.dev
```

### 5.2 获取API密钥

**DeepSeek API密钥**:
1. 访问 [硅基流动](https://siliconflow.cn)
2. 注册账号并获取API密钥
3. 当前密钥: `sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn`

**Resend API密钥**:
1. 访问 [Resend](https://resend.com)
2. 注册账号并获取API密钥
3. 配置发送域名

---

## 🌐 第六步：配置域名

### 6.1 自定义域名 (可选)
1. 在Pages项目中点击 **"Custom domains"**
2. 添加您的域名
3. 按照提示配置DNS记录

### 6.2 更新CORS配置
将前端域名更新到后端的CORS配置中。

---

## 🧪 第七步：测试部署

### 7.1 功能测试清单
- ✅ 前端页面加载
- ✅ 用户注册/登录
- ✅ 邮件验证
- ✅ 会员功能
- ✅ AI算命服务
- ✅ 支付功能

### 7.2 性能检查
- ✅ 页面加载速度
- ✅ API响应时间
- ✅ 移动端适配

---

## 📊 部署后配置

### 8.1 监控设置
在Cloudflare Dashboard中启用：
- **Analytics** - 流量分析
- **Speed** - 性能监控
- **Security** - 安全防护

### 8.2 缓存优化
配置缓存规则以提高性能。

---

## 🔧 故障排除

### 常见问题

**1. 前端路由404错误**
- 确认 `_redirects` 文件已正确配置
- 检查SPA路由设置

**2. API调用失败**
- 检查Workers环境变量
- 确认CORS配置正确

**3. 数据库连接错误**
- 验证D1数据库绑定
- 检查数据库表是否创建

**4. 邮件发送失败**
- 验证Resend API密钥
- 检查发送域名配置

---

## 💰 成本估算

**Cloudflare免费计划包含**:
- Pages: 500次构建/月
- Workers: 100,000次请求/天
- D1: 5GB存储 + 25M行读取/天

对于中小型应用完全免费！

---

## 🎉 部署完成

部署成功后，您将拥有：
- 🌐 全球CDN加速的前端
- ⚡ 边缘计算的后端API
- 🗄️ 高性能的D1数据库
- 📧 可靠的邮件服务
- 🔮 AI算命功能

**访问地址**: `https://your-project.pages.dev`

---

## 📞 技术支持

如果遇到问题，请检查：
1. Cloudflare Dashboard的错误日志
2. Workers的实时日志
3. 浏览器开发者工具

祝您部署顺利！🚀
