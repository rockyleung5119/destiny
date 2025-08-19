# Durable Objects手动部署步骤

## 🎯 简化手动部署

基于您的账户状态，这里是最简单的手动部署步骤：

### 步骤1: 启用Durable Objects配置

编辑 `backend/wrangler.toml`，找到注释的Durable Objects配置部分，取消注释：

**将这些行：**
```toml
# [[durable_objects.bindings]]
# name = "AI_PROCESSOR"
# class_name = "AIProcessor"

# [[durable_objects.bindings]]
# name = "BATCH_COORDINATOR"
# class_name = "BatchCoordinator"

# [[migrations]]
# tag = "v1"
# new_classes = ["AIProcessor", "BatchCoordinator"]
```

**改为：**
```toml
[[durable_objects.bindings]]
name = "AI_PROCESSOR"
class_name = "AIProcessor"

[[durable_objects.bindings]]
name = "BATCH_COORDINATOR"
class_name = "BatchCoordinator"

[[migrations]]
tag = "v1"
new_classes = ["AIProcessor", "BatchCoordinator"]
```

### 步骤2: 验证配置
```bash
cd backend
wrangler config validate
```

### 步骤3: 本地测试（可选）
```bash
wrangler dev --local=false --port=8787
```
然后访问：http://localhost:8787/api/async-status

### 步骤4: 部署
```bash
wrangler deploy
```

### 步骤5: 验证部署
访问：https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status

期望看到：
```json
{
  "durableObjectsCheck": {
    "hasAIProcessor": true,
    "hasBatchCoordinator": true
  }
}
```

## 🚀 使用自动化脚本

如果您想使用自动化脚本：

### Windows PowerShell:
```powershell
.\deploy-durable-objects.ps1
```

### 手动命令序列:
```bash
# 1. 备份配置
cp wrangler.toml wrangler.toml.backup

# 2. 启用Durable Objects（手动编辑wrangler.toml）

# 3. 验证
wrangler config validate

# 4. 部署
wrangler deploy

# 5. 验证
curl https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status
```

## ⚠️ 重要注意事项

### 1. 计划要求
- Durable Objects需要**Workers Paid计划**（$5/月）
- 如果您使用免费计划，部署会失败

### 2. 首次部署
- 首次部署Durable Objects可能需要几分钟才能完全初始化
- 如果立即测试失败，等待5-10分钟后重试

### 3. 回滚方案
如果部署失败：
```bash
cp wrangler.toml.backup wrangler.toml
wrangler deploy
```

## 🔍 故障排除

### 错误1: "Durable Objects are not available"
**原因**: 免费计划不支持
**解决**: 升级到Workers Paid计划

### 错误2: "Migration validation failed"
**原因**: 配置语法错误
**解决**: 检查wrangler.toml语法

### 错误3: "Class not found"
**原因**: TypeScript类导出问题
**解决**: 确认worker.ts中有正确的export语句

## 📊 成功标志

部署成功后，您将看到：

1. **部署输出显示Durable Objects绑定**
2. **async-status端点返回hasAIProcessor: true**
3. **AI处理使用Durable Objects而不是回退方案**

## 🎉 部署后的优势

启用Durable Objects后，您将获得：
- ✅ 分布式锁机制（防止重复处理）
- ✅ 批处理优化（提高效率）
- ✅ 更高的可靠性
- ✅ 更好的性能监控

现在您可以开始手动部署了！选择最适合您的方法。🚀
