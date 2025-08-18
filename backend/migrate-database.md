# 数据库迁移指南

## 🗄️ 手动数据库迁移步骤

由于GitHub Actions中的数据库迁移可能导致部署失败，我们将数据库迁移改为手动执行。

### 1. 检查当前数据库状态

```bash
# 查看所有表
wrangler d1 execute destiny-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# 查看特定表结构
wrangler d1 execute destiny-db --remote --command "PRAGMA table_info(users);"
wrangler d1 execute destiny-db --remote --command "PRAGMA table_info(async_tasks);"
```

### 2. 创建async_tasks表（如果不存在）

```bash
# 创建async_tasks表
wrangler d1 execute destiny-db --remote --command "CREATE TABLE IF NOT EXISTS async_tasks (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data TEXT,
  result TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);"
```

### 3. 验证表创建

```bash
# 检查async_tasks表是否创建成功
wrangler d1 execute destiny-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='async_tasks';"

# 查看表结构
wrangler d1 execute destiny-db --remote --command "PRAGMA table_info(async_tasks);"
```

### 4. 测试表功能

```bash
# 插入测试数据
wrangler d1 execute destiny-db --remote --command "INSERT INTO async_tasks (id, user_id, task_type, status, created_at, updated_at) VALUES ('test_123', 1, 'bazi', 'pending', datetime('now'), datetime('now'));"

# 查询测试数据
wrangler d1 execute destiny-db --remote --command "SELECT * FROM async_tasks WHERE id='test_123';"

# 删除测试数据
wrangler d1 execute destiny-db --remote --command "DELETE FROM async_tasks WHERE id='test_123';"
```

## 🔧 完整迁移脚本

如果需要完整重建数据库，可以执行：

```bash
# 执行完整的schema文件
wrangler d1 execute destiny-db --remote --file=./d1-schema.sql
```

## ⚠️ 注意事项

1. **备份数据**: 在执行迁移前，建议备份重要数据
2. **分步执行**: 建议分步执行命令，而不是一次性执行整个schema
3. **验证结果**: 每步执行后都要验证结果
4. **网络问题**: 如果遇到网络错误，请重试

## 🚀 部署后验证

数据库迁移完成后，部署应用并测试：

1. 推送代码到GitHub（现在不会执行数据库迁移）
2. 等待部署完成
3. 测试异步任务API：
   - 调用任何算命API
   - 检查是否返回taskId
   - 使用taskId查询状态

## 📋 常用命令

```bash
# 查看所有表
wrangler d1 execute destiny-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# 查看表数据量
wrangler d1 execute destiny-db --remote --command "SELECT 
  'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'async_tasks', COUNT(*) FROM async_tasks
  UNION ALL  
  SELECT 'memberships', COUNT(*) FROM memberships;"

# 清理旧的异步任务（可选）
wrangler d1 execute destiny-db --remote --command "DELETE FROM async_tasks WHERE created_at < datetime('now', '-7 days');"
```
