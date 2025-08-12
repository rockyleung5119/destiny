# 🚀 Destiny项目手动Cloudflare部署指南

## 🎯 部署状态
- ✅ **前端已部署**: https://fb824531.destiny-360.pages.dev
- 🔄 **后端准备中**: 即将部署到Cloudflare Workers

---

## 📤 第一步：手动创建D1数据库

### 1.1 在Cloudflare Dashboard中创建D1数据库
1. 访问 https://dash.cloudflare.com
2. 点击左侧 **"Workers & Pages"**
3. 点击 **"D1 SQL Database"**
4. 点击 **"Create database"**
5. 数据库名称: `destiny-db`
6. 点击 **"Create"**

### 1.2 记录数据库信息
创建完成后，记录：
- **数据库ID**: (类似 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **数据库名称**: `destiny-db`

---

## 🔧 第二步：准备Workers代码包

### 2.1 创建部署包
我已经为您准备了Workers兼容的代码，需要打包上传。

### 2.2 手动创建Workers
1. 在Cloudflare Dashboard中
2. 点击 **"Workers & Pages"**
3. 点击 **"Create application"**
4. 选择 **"Workers"**
5. 点击 **"Create Worker"**
6. Worker名称: `destiny-backend`

---

## ⚙️ 第三步：配置环境变量

在Workers设置中添加以下环境变量：

### 3.1 必需的环境变量
```
JWT_SECRET = destiny-super-secret-jwt-key-for-production
DEEPSEEK_API_KEY = sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn
DEEPSEEK_BASE_URL = https://api.siliconflow.cn/v1/chat/completions
DEEPSEEK_MODEL = Pro/deepseek-ai/DeepSeek-R1
RESEND_API_KEY = re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP
RESEND_FROM_EMAIL = info@info.indicate.top
RESEND_FROM_NAME = Indicate.Top
EMAIL_SERVICE = resend
FRONTEND_URL = https://fb824531.destiny-360.pages.dev
CORS_ORIGIN = https://fb824531.destiny-360.pages.dev
NODE_ENV = production
```

### 3.2 D1数据库绑定
在Workers设置的 **"Settings"** → **"Variables"** 中：
- 添加 **D1 Database binding**
- Variable name: `DB`
- D1 database: 选择您创建的 `destiny-db`

---

## 📊 第四步：初始化数据库

### 4.1 准备SQL脚本
需要在D1数据库中执行我们的数据库架构。

### 4.2 通过Dashboard执行SQL
1. 进入D1数据库管理页面
2. 点击 **"Console"**
3. 执行数据库初始化脚本

---

## 🔄 第五步：更新前端API配置

### 5.1 获取Workers域名
Workers部署完成后，您会得到一个域名，例如：
```
https://destiny-backend.your-subdomain.workers.dev
```

### 5.2 更新前端API地址
需要重新构建前端，指向新的Workers后端。

---

## 🎯 当前推荐操作

由于手动部署比较复杂，我建议：

### 方案A：完整Cloudflare部署 (推荐)
1. ✅ 前端: 已部署到Pages
2. 🔄 后端: 手动部署到Workers
3. 🔄 数据库: 创建D1数据库

### 方案B：混合部署 (快速)
1. ✅ 前端: Cloudflare Pages
2. ✅ 后端: 部署到Railway/Render
3. ✅ 数据库: 使用云数据库

---

## 🚀 立即开始

**您现在需要选择**：

**选项1**: 继续Cloudflare完整部署
- 我会指导您手动创建D1数据库和Workers

**选项2**: 后端部署到Railway (更简单)
- 5分钟内完成，更稳定

您希望选择哪种方案？我推荐**选项2 (Railway)**，因为更简单快速！
