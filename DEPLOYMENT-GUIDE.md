# Cloudflare Workers 完整部署指南

## 📋 配置说明

### 环境变量 vs 机密变量

**环境变量（wrangler.toml中的[vars]）**：非敏感信息，可以公开
- NODE_ENV
- CORS_ORIGIN
- FRONTEND_URL
- DEEPSEEK_BASE_URL
- DEEPSEEK_MODEL
- EMAIL_SERVICE
- RESEND_FROM_EMAIL
- RESEND_FROM_NAME

**机密变量（wrangler secret）**：敏感信息，加密存储
- DEEPSEEK_API_KEY
- JWT_SECRET
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

## 🚀 部署步骤

### 方法1：使用脚本自动部署（推荐）

1. **设置机密变量**
   ```powershell
   .\setup-secrets.ps1
   ```

2. **创建队列**
   ```powershell
   .\setup-queues.ps1
   ```

3. **部署Worker**
   ```powershell
   cd backend
   wrangler deploy
   ```

### 方法2：手动操作

#### 步骤1：创建队列
```bash
cd backend
wrangler queues create ai-processing-queue
wrangler queues create ai-processing-dlq
```

#### 步骤2：设置机密变量
```bash
# AI服务配置
echo "your_deepseek_api_key" | wrangler secret put DEEPSEEK_API_KEY
echo "your_jwt_secret" | wrangler secret put JWT_SECRET

# 邮件服务配置
echo "your_resend_api_key" | wrangler secret put RESEND_API_KEY

# Stripe配置（可选）
echo "your_stripe_secret_key" | wrangler secret put STRIPE_SECRET_KEY
echo "your_stripe_publishable_key" | wrangler secret put STRIPE_PUBLISHABLE_KEY
echo "your_stripe_webhook_secret" | wrangler secret put STRIPE_WEBHOOK_SECRET
```

#### 步骤3：部署
```bash
wrangler deploy
```

## 🔧 配置验证

### 检查配置
```bash
# 查看环境变量
wrangler secret list

# 查看队列
wrangler queues list

# 查看部署状态
wrangler deployments list
```

### 测试端点
- 健康检查: `https://your-worker.workers.dev/api/health`
- AI状态: `https://your-worker.workers.dev/api/ai-status`
- 队列状态: `https://your-worker.workers.dev/api/queue-status`

## 📝 配置文件说明

### wrangler.toml结构
```toml
name = "destiny-backend"
main = "worker.ts"
compatibility_date = "2024-08-01"

# 非敏感环境变量
[vars]
NODE_ENV = "production"
CORS_ORIGIN = "https://your-frontend.pages.dev"
# ... 其他非敏感配置

# D1数据库
[[d1_databases]]
binding = "DB"
database_name = "destiny-db"
database_id = "your-database-id"

# 队列配置
[[queues.producers]]
binding = "AI_QUEUE"
queue = "ai-processing-queue"

[[queues.consumers]]
queue = "ai-processing-queue"
max_batch_size = 1
max_batch_timeout = 30
max_retries = 2
dead_letter_queue = "ai-processing-dlq"

# 定时任务
[triggers]
crons = ["*/2 * * * *"]
```

## 🔍 故障排除

### 常见问题

1. **队列创建失败**
   - 检查网络连接
   - 确认wrangler已登录：`wrangler whoami`

2. **机密变量设置失败**
   - 使用交互式设置：`wrangler secret put SECRET_NAME`
   - 检查权限和网络

3. **部署失败**
   - 检查wrangler.toml语法
   - 确认所有依赖的资源已创建

### 调试命令
```bash
# 本地测试
wrangler dev

# 查看日志
wrangler tail

# 检查配置
wrangler whoami
wrangler secret list
wrangler queues list
```

## 📊 监控和维护

### 定期检查
- 队列深度和处理速度
- 错误率和重试次数
- API响应时间
- 数据库连接状态

### 更新配置
- 环境变量：修改wrangler.toml后重新部署
- 机密变量：使用`wrangler secret put`更新
- 队列配置：修改wrangler.toml后重新部署

## 🎯 最佳实践

1. **安全性**
   - 敏感信息使用机密变量
   - 定期轮换API密钥
   - 使用最小权限原则

2. **可靠性**
   - 配置适当的重试策略
   - 监控死信队列
   - 设置告警机制

3. **性能**
   - 合理设置队列批次大小
   - 监控处理延迟
   - 优化AI调用超时

现在您可以根据这个指南进行完整的部署配置！🚀
