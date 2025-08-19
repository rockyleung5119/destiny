# Cloudflare队列创建指南

## 🎯 问题说明

部署失败的原因是wrangler.toml中引用了还不存在的队列。需要先创建队列，然后启用配置。

## 🚀 解决方案

### 方法1：使用脚本（推荐）

#### 步骤1：创建队列
```powershell
.\create-queues.ps1
```

#### 步骤2：启用队列配置
```powershell
.\enable-queues.ps1
```

#### 步骤3：重新部署
```powershell
cd backend
wrangler deploy
```

### 方法2：手动操作

#### 步骤1：创建队列
```bash
cd backend

# 检查登录状态
wrangler whoami

# 如果没有登录
wrangler login

# 创建队列
wrangler queues create ai-processing-queue
wrangler queues create ai-processing-dlq

# 验证创建
wrangler queues list
```

#### 步骤2：手动启用队列配置
编辑 `backend/wrangler.toml`，找到注释的队列配置部分：

```toml
# 将这些注释的行：
# [[queues.producers]]
# binding = "AI_QUEUE"
# queue = "ai-processing-queue"

# 改为：
[[queues.producers]]
binding = "AI_QUEUE"
queue = "ai-processing-queue"
```

对所有队列配置行执行相同操作。

#### 步骤3：重新部署
```bash
wrangler deploy
```

## 🔍 验证步骤

### 1. 检查队列状态
```bash
wrangler queues list
```
应该看到：
- ai-processing-queue
- ai-processing-dlq

### 2. 检查部署状态
```bash
wrangler deployments list
```

### 3. 测试端点
访问以下URL验证：
- `/api/health` - 健康检查
- `/api/queue-status` - 队列状态
- `/api/ai-status` - AI服务状态

## 🔧 故障排除

### 问题1：wrangler未登录
```bash
wrangler login
```

### 问题2：队列创建失败
- 检查网络连接
- 确认Cloudflare账户权限
- 重试创建命令

### 问题3：部署仍然失败
1. 检查wrangler.toml语法
2. 确认队列配置已正确启用
3. 查看部署日志：`wrangler tail`

### 问题4：队列配置未生效
1. 确认队列已创建：`wrangler queues list`
2. 检查wrangler.toml中的队列配置
3. 重新部署：`wrangler deploy`

## 📋 完整的wrangler.toml队列配置

队列创建后，wrangler.toml应该包含：

```toml
# Cloudflare Queues配置
[[queues.producers]]
binding = "AI_QUEUE"
queue = "ai-processing-queue"

[[queues.consumers]]
queue = "ai-processing-queue"
max_batch_size = 1
max_batch_timeout = 30
max_retries = 2
dead_letter_queue = "ai-processing-dlq"

[[queues.producers]]
binding = "AI_DLQ"
queue = "ai-processing-dlq"
```

## 🎉 成功标志

部署成功后，您应该能够：
1. 访问 `/api/queue-status` 看到 `"status": "healthy"`
2. 在Cloudflare Dashboard中看到两个队列
3. AI异步处理正常工作

按照这个指南操作，应该能解决部署失败的问题！🚀
