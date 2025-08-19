# Durable Objects手动部署指南

## 📋 前提条件

### 1. 检查计划支持
Durable Objects需要**Workers Paid计划**（$5/月）或更高级别。

访问：https://dash.cloudflare.com/7590a463bab8766be0d1c1b181cecc44/workers/plans

### 2. 检查当前计划
```bash
# 检查当前账户信息
wrangler whoami

# 尝试部署测试（会显示计划限制）
wrangler deploy --dry-run
```

## 🚀 手动部署步骤

### 步骤1: 启用Durable Objects配置

编辑 `wrangler.toml`，取消注释Durable Objects配置：

```toml
# 启用Durable Objects配置
[[durable_objects.bindings]]
name = "AI_PROCESSOR"
class_name = "AIProcessor"

[[durable_objects.bindings]]
name = "BATCH_COORDINATOR"
class_name = "BatchCoordinator"

# Durable Objects迁移配置
[[migrations]]
tag = "v1"
new_classes = ["AIProcessor", "BatchCoordinator"]
```

### 步骤2: 验证配置语法
```bash
# 验证wrangler.toml语法
wrangler config validate

# 检查Durable Objects类导出
grep -n "export class" worker.ts
```

### 步骤3: 本地测试
```bash
# 本地测试Durable Objects
wrangler dev --local=false --port=8787

# 测试端点
curl http://localhost:8787/api/async-status
```

### 步骤4: 部署到生产环境
```bash
# 部署Worker（包含Durable Objects）
wrangler deploy

# 检查部署状态
wrangler deployments list
```

## 🔧 自动化脚本

### 创建部署脚本 `deploy-durable-objects.ps1`：

```powershell
# Durable Objects部署脚本
Write-Host "🚀 Deploying Durable Objects..." -ForegroundColor Green

# 步骤1: 备份当前配置
Copy-Item "wrangler.toml" "wrangler.toml.backup"
Write-Host "📋 Configuration backed up" -ForegroundColor Yellow

# 步骤2: 启用Durable Objects配置
$content = Get-Content "wrangler.toml" -Raw
$content = $content -replace "# \[\[durable_objects\.bindings\]\]", "[[durable_objects.bindings]]"
$content = $content -replace "# name = `"AI_PROCESSOR`"", "name = `"AI_PROCESSOR`""
$content = $content -replace "# class_name = `"AIProcessor`"", "class_name = `"AIProcessor`""
$content = $content -replace "# \[\[migrations\]\]", "[[migrations]]"
$content = $content -replace "# tag = `"v1`"", "tag = `"v1`""
$content = $content -replace "# new_classes = \[`"AIProcessor`", `"BatchCoordinator`"\]", "new_classes = [`"AIProcessor`", `"BatchCoordinator`"]"
$content | Set-Content "wrangler.toml" -NoNewline

Write-Host "✅ Durable Objects configuration enabled" -ForegroundColor Green

# 步骤3: 验证配置
Write-Host "🔍 Validating configuration..." -ForegroundColor Cyan
try {
    wrangler config validate
    Write-Host "✅ Configuration is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ Configuration validation failed: $($_.Exception.Message)" -ForegroundColor Red
    # 恢复备份
    Copy-Item "wrangler.toml.backup" "wrangler.toml"
    exit 1
}

# 步骤4: 部署
Write-Host "🚀 Deploying to Cloudflare..." -ForegroundColor Cyan
try {
    wrangler deploy
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    # 恢复备份
    Copy-Item "wrangler.toml.backup" "wrangler.toml"
    exit 1
}

# 步骤5: 验证部署
Write-Host "🔍 Verifying deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status" -TimeoutSec 30
    $data = $response.Content | ConvertFrom-Json

    if ($data.durableObjectsCheck.hasAIProcessor -eq $true) {
        Write-Host "✅ Durable Objects are working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Durable Objects may not be fully initialized yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Verification failed, but deployment may still be successful" -ForegroundColor Yellow
}

Write-Host "🎉 Durable Objects deployment completed!" -ForegroundColor Green
```

## 🔍 故障排除

### 常见错误1: 计划不支持
```
Error: Durable Objects are not available on the free plan
```
**解决方案**: 升级到Workers Paid计划
- 访问: https://dash.cloudflare.com/workers/plans
- 选择Workers Paid ($5/月)

### 常见错误2: 迁移错误
```
Error: Migration validation failed
```
**解决方案**: 检查migrations配置
```toml
[[migrations]]
tag = "v1"
new_classes = ["AIProcessor", "BatchCoordinator"]
```

### 常见错误3: 类导出错误
```
Error: Class AIProcessor not found
```
**解决方案**: 确认类正确导出
```typescript
export class AIProcessor {
  // 类实现
}
```

## 📊 验证部署成功

### 1. 检查部署状态
```bash
wrangler deployments list
```

### 2. 测试Durable Objects端点
```bash
# 检查异步状态
curl https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status

# 期望响应
{
  "durableObjectsCheck": {
    "hasAIProcessor": true,
    "hasBatchCoordinator": true
  }
}
```

### 3. 测试AI处理
```bash
# 测试AI流式支持检查
curl https://destiny-backend.wlk8s6v9y.workers.dev/api/ai-streaming-check
```

## 🔄 回滚方案

如果部署失败，可以快速回滚：

```bash
# 恢复备份配置
cp wrangler.toml.backup wrangler.toml

# 重新部署
wrangler deploy
```

## 📋 部署检查清单

- [ ] 账户已升级到Workers Paid计划
- [ ] wrangler.toml配置正确
- [ ] Durable Objects类正确导出
- [ ] 本地测试通过
- [ ] 部署成功
- [ ] 验证端点正常工作

## 🎯 下一步

部署成功后，您将获得：
- ✅ 分布式锁机制
- ✅ 批处理优化
- ✅ 更高的可靠性
- ✅ 更好的性能

现在可以开始手动部署Durable Objects了！🚀
