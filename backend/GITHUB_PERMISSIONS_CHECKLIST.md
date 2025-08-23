
# GitHub Actions权限检查清单

## 必需的GitHub Secrets
请在GitHub仓库设置中添加以下Secrets：

### 1. CLOUDFLARE_API_TOKEN
- 获取方式：Cloudflare Dashboard → My Profile → API Tokens
- 权限要求：
  ✅ Zone:Zone:Read
  ✅ Zone:Zone Settings:Edit  
  ✅ Account:Cloudflare Workers:Edit
  ✅ Account:Account Settings:Read
  ✅ Account:D1:Edit
  ✅ Account:Durable Objects:Edit
  ✅ Account:Queues:Edit
  ✅ Account:R2:Edit

### 2. CLOUDFLARE_ACCOUNT_ID
- 获取方式：Cloudflare Dashboard → 右侧边栏 → Account ID
- 格式：32位十六进制字符串

## Cloudflare资源检查
确保以下资源已在Cloudflare中创建：

### D1数据库
- 名称：destiny-db
- ID：500716dc-3ac2-4b4a-a2ee-ad79b301228d
- 检查命令：wrangler d1 list

### Queues队列
- ai-processing-queue
- ai-processing-dlq
- 检查命令：wrangler queues list

### R2存储桶
- 名称：destiny-backups
- 检查命令：wrangler r2 bucket list

### Durable Objects
- AIProcessor
- BatchCoordinator
- 注意：首次部署时会自动创建

## 常见问题解决

### 问题1：Authentication failed
解决：检查CLOUDFLARE_API_TOKEN是否正确设置

### 问题2：Account not found
解决：检查CLOUDFLARE_ACCOUNT_ID是否正确

### 问题3：D1 database not found
解决：运行 wrangler d1 create destiny-db

### 问题4：Queue not found
解决：运行 wrangler queues create ai-processing-queue

### 问题5：R2 bucket not found
解决：运行 wrangler r2 bucket create destiny-backups

### 问题6：Durable Objects migration failed
解决：确保worker.ts中包含AIProcessor和BatchCoordinator类定义
