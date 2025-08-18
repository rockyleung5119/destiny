# 部署前检查清单

## 🔍 部署前必须执行的步骤

### 1. 数据库迁移（必须先执行）

```bash
# 创建async_tasks表
wrangler d1 execute destiny-db --remote --file=./create-async-tasks-table.sql

# 验证表创建成功
wrangler d1 execute destiny-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='async_tasks';"
```

### 2. 本地验证

```bash
# 检查语法
wrangler deploy --dry-run

# 检查依赖
npm install

# 检查文件大小（应该在200KB以内）
# 当前: 180.07 KiB / gzip: 38.11 KiB ✅
```

### 3. GitHub推送

```bash
git add .
git commit -m "Fix: 修复GitHub自动部署问题，移除数据库迁移步骤"
git push origin main
```

## ✅ 检查清单

- [ ] 数据库async_tasks表已创建
- [ ] `wrangler deploy --dry-run` 成功
- [ ] `npm install` 无错误
- [ ] 文件大小合理
- [ ] GitHub Actions配置已简化
- [ ] 移除了数据库迁移步骤

## 🚀 部署后验证

1. 检查Worker是否部署成功
2. 测试健康检查: `GET /api/health`
3. 测试异步任务API:
   ```bash
   # 登录获取token
   POST /api/auth/login
   
   # 调用算命API
   POST /api/fortune/bazi
   
   # 查询任务状态
   GET /api/fortune/task/{taskId}
   ```

## 🔧 如果部署失败

1. 检查GitHub Actions日志
2. 确认Cloudflare API Token和Account ID正确
3. 检查wrangler.toml配置
4. 尝试本地部署: `wrangler deploy`

## 📋 常见问题

**Q: 为什么移除数据库迁移？**
A: GitHub Actions中的数据库迁移经常失败，改为手动执行更可靠。

**Q: async_tasks表必须先创建吗？**
A: 是的，否则异步任务功能会失败。

**Q: 如何回滚？**
A: 可以通过Cloudflare Dashboard回滚到之前的版本。
