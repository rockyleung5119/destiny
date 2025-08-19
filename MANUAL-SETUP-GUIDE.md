# 手动操作指南 - Cloudflare Workers配置

## 🎯 概述

这个指南将教您如何手动配置Cloudflare Workers的环境变量、机密和队列。

## 📋 需要的资料

请准备以下信息：

### 1. AI服务配置
- **DEEPSEEK_API_KEY**: `sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn`
- **DEEPSEEK_BASE_URL**: `https://api.siliconflow.cn/v1/chat/completions`
- **DEEPSEEK_MODEL**: `Pro/deepseek-ai/DeepSeek-R1`

### 2. 应用配置
- **JWT_SECRET**: `wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA`
- **CORS_ORIGIN**: `https://destiny-frontend.pages.dev`
- **FRONTEND_URL**: `https://destiny-frontend.pages.dev`

### 3. 邮件服务配置
- **RESEND_API_KEY**: `re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP`
- **RESEND_FROM_EMAIL**: `info@info.indicate.top`
- **RESEND_FROM_NAME**: `indicate.top`

## 🔧 方法1：使用Cloudflare Dashboard（推荐）

### 步骤1：访问Cloudflare Dashboard
1. 打开浏览器，访问 https://dash.cloudflare.com/
2. 登录您的Cloudflare账户
3. 点击左侧菜单的 "Workers & Pages"
4. 找到并点击 "destiny-backend" worker

### 步骤2：设置环境变量
1. 点击 "Settings" 标签
2. 点击 "Variables" 子标签
3. 在 "Environment Variables" 部分点击 "Add variable"

**添加以下环境变量**（选择 "Plaintext"）：
```
NODE_ENV = production
CORS_ORIGIN = https://destiny-frontend.pages.dev
FRONTEND_URL = https://destiny-frontend.pages.dev
DEEPSEEK_BASE_URL = https://api.siliconflow.cn/v1/chat/completions
DEEPSEEK_MODEL = Pro/deepseek-ai/DeepSeek-R1
EMAIL_SERVICE = resend
RESEND_FROM_EMAIL = info@info.indicate.top
RESEND_FROM_NAME = indicate.top
```

### 步骤3：设置机密变量
在同一个页面，添加以下变量（选择 "Encrypt"）：
```
DEEPSEEK_API_KEY = sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn
JWT_SECRET = wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA
RESEND_API_KEY = re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP
```

### 步骤4：创建队列
1. 在Cloudflare Dashboard中，点击左侧菜单的 "Queues"
2. 点击 "Create queue" 按钮
3. 创建第一个队列：
   - **Queue name**: `ai-processing-queue`
   - 点击 "Create queue"
4. 创建第二个队列：
   - **Queue name**: `ai-processing-dlq`
   - 点击 "Create queue"

### 步骤5：保存并部署
1. 点击 "Save and deploy" 按钮
2. 等待部署完成

## 🔧 方法2：使用命令行工具

### 前提条件
1. 确保已安装wrangler：`npm install -g wrangler`
2. 登录Cloudflare：`wrangler login`
3. 进入项目目录：`cd backend`

### 步骤1：创建队列
```bash
# 创建AI处理队列
wrangler queues create ai-processing-queue

# 创建死信队列
wrangler queues create ai-processing-dlq

# 验证队列创建
wrangler queues list
```

### 步骤2：设置机密变量
```bash
# 方式1：交互式设置（推荐）
wrangler secret put DEEPSEEK_API_KEY
# 然后输入：sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn

wrangler secret put JWT_SECRET
# 然后输入：wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA

wrangler secret put RESEND_API_KEY
# 然后输入：re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP

# 方式2：使用管道（如果交互式有问题）
echo "sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn" | wrangler secret put DEEPSEEK_API_KEY
echo "wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA" | wrangler secret put JWT_SECRET
echo "re_DsCfph4T_PPAMJQnhoSiAv3AjYUy5f9HP" | wrangler secret put RESEND_API_KEY
```

### 步骤3：验证配置
```bash
# 查看已设置的机密
wrangler secret list

# 查看队列
wrangler queues list

# 本地测试
wrangler dev
```

### 步骤4：部署
```bash
wrangler deploy
```

## ✅ 验证部署

### 检查端点
部署完成后，访问以下URL验证：

1. **健康检查**
   ```
   https://destiny-backend.wlk8s6v9y.workers.dev/api/health
   ```
   应该返回：`{"status":"ok",...}`

2. **AI状态检查**
   ```
   https://destiny-backend.wlk8s6v9y.workers.dev/api/ai-status
   ```
   应该返回：`{"status":"healthy",...}`

3. **队列状态检查**
   ```
   https://destiny-backend.wlk8s6v9y.workers.dev/api/queue-status
   ```
   应该返回：`{"status":"healthy",...}`

## 🔍 故障排除

### 常见问题

1. **"Queue not found" 错误**
   - 确认队列已创建：`wrangler queues list`
   - 检查wrangler.toml中的队列配置

2. **"Environment variable not found" 错误**
   - 检查变量名拼写
   - 确认机密变量已设置：`wrangler secret list`

3. **部署失败**
   - 检查网络连接
   - 确认已登录：`wrangler whoami`
   - 检查wrangler.toml语法

### 调试命令
```bash
# 查看当前用户
wrangler whoami

# 查看部署历史
wrangler deployments list

# 查看实时日志
wrangler tail

# 本地开发模式
wrangler dev --local=false
```

## 📝 配置检查清单

- [ ] 队列已创建（ai-processing-queue, ai-processing-dlq）
- [ ] 环境变量已设置（NODE_ENV, CORS_ORIGIN等）
- [ ] 机密变量已设置（API keys, secrets）
- [ ] Worker已部署
- [ ] 健康检查通过
- [ ] AI状态检查通过
- [ ] 队列状态检查通过

完成以上步骤后，您的Cloudflare Workers应该就能正常工作了！🎉
