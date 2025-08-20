# Cloudflare D1数据库自动备份服务

## 📋 概述

这是一个完整的Cloudflare D1数据库自动备份解决方案，支持：
- 每日自动备份（凌晨2点UTC）
- 手动备份触发
- 备份文件管理和清理
- 数据库恢复功能
- 备份监控和健康检查

## 🏗️ 架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   D1 Database   │───▶│  Backup Service  │───▶│   R2 Storage    │
│   (destiny-db)  │    │  (Worker Cron)   │    │ (destiny-backups)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   API Endpoints  │
                       │  (Manual Control)│
                       └──────────────────┘
```

## 🚀 快速开始

### 1. 设置服务
```bash
# 运行设置脚本
powershell -ExecutionPolicy Bypass -File setup-backup-service.ps1

# 或者手动部署
wrangler deploy
```

### 2. 验证配置
```bash
# 检查R2存储桶
wrangler r2 bucket list

# 测试备份服务
node monitor-backup-service.js
```

### 3. 手动备份测试
```bash
# 执行手动备份
node monitor-backup-service.js --test-backup
```

## 📅 自动备份计划

- **频率**: 每日一次
- **时间**: 凌晨2:00 AM UTC
- **保留期**: 30天（自动清理旧备份）
- **压缩**: gzip压缩
- **命名**: `destiny-db-backup-YYYY-MM-DDTHH-mm-ss-sssZ.sql`

## 🔧 API端点

### 手动备份
```http
POST /api/admin/backup-database
Content-Type: application/json

Response:
{
  "success": true,
  "message": "Database backup completed: destiny-db-backup-2024-08-20T02-00-00-000Z.sql",
  "backupInfo": {
    "fileName": "destiny-db-backup-2024-08-20T02-00-00-000Z.sql",
    "timestamp": "2024-08-20T02:00:00.000Z",
    "size": 1048576,
    "tables": ["users", "async_tasks", "verification_codes"],
    "success": true
  }
}
```

### 获取备份列表
```http
GET /api/admin/backups

Response:
{
  "success": true,
  "backups": [
    {
      "fileName": "destiny-db-backup-2024-08-20T02-00-00-000Z.sql",
      "size": 1048576,
      "uploaded": "2024-08-20T02:00:00.000Z",
      "etag": "abc123..."
    }
  ]
}
```

### 恢复数据库
```http
POST /api/admin/restore-database
Content-Type: application/json

{
  "backupFileName": "destiny-db-backup-2024-08-20T02-00-00-000Z.sql"
}

Response:
{
  "success": true,
  "message": "Database restored from destiny-db-backup-2024-08-20T02-00-00-000Z.sql"
}
```

## 🛠️ 管理工具

### 备份监控
```bash
# 检查备份状态
node monitor-backup-service.js

# 包含手动备份测试
node monitor-backup-service.js --test-backup
```

### 数据库恢复
```bash
# 列出可用备份
node restore-database.js --list-only

# 恢复最新备份
node restore-database.js --latest --force

# 恢复指定备份
node restore-database.js "destiny-db-backup-2024-08-20T02-00-00-000Z.sql" --force
```

### 查看备份文件
```bash
# 列出R2存储中的备份
wrangler r2 object list destiny-backups

# 下载备份文件
wrangler r2 object get destiny-backups/destiny-db-backup-2024-08-20T02-00-00-000Z.sql --file backup.sql.gz
```

## 📊 监控和日志

### 查看实时日志
```bash
# 查看Worker日志
wrangler tail --format pretty

# 过滤备份相关日志
wrangler tail --format pretty | grep -i backup
```

### 备份健康检查
监控脚本会检查：
- ✅ 最近备份时间（25小时内）
- ✅ 备份大小一致性
- ✅ 备份频率正常
- ✅ 保留期策略执行

## 🔐 安全考虑

### 访问控制
- 备份API端点仅限管理员访问
- R2存储桶访问受Cloudflare账户权限控制
- 备份文件包含敏感数据，需谨慎处理

### 数据保护
- 备份文件使用gzip压缩
- 自动清理30天以上的旧备份
- 恢复前自动创建安全备份

## 🚨 故障排除

### 常见问题

**1. 备份失败 - R2存储桶不存在**
```bash
# 创建R2存储桶
wrangler r2 bucket create destiny-backups
```

**2. 备份失败 - 权限问题**
```bash
# 检查wrangler.toml配置
cat wrangler.toml | grep -A 3 "r2_buckets"
```

**3. 定时备份不执行**
```bash
# 检查cron触发器配置
cat wrangler.toml | grep -A 2 "triggers"

# 查看Worker日志
wrangler tail
```

**4. 备份文件损坏**
```bash
# 测试备份文件完整性
node monitor-backup-service.js --test-backup
```

### 日志分析
```bash
# 查找备份相关错误
wrangler tail | grep -E "(backup|error|failed)"

# 查看备份成功日志
wrangler tail | grep "backup.*success"
```

## 📈 性能优化

### 备份优化
- 使用gzip压缩减少存储空间
- 分批处理大型表数据
- 异步上传到R2存储

### 恢复优化
- 分批执行SQL语句
- 事务处理确保数据一致性
- 恢复前验证备份文件完整性

## 🔄 升级和维护

### 定期维护任务
1. **每周**: 检查备份状态和健康度
2. **每月**: 测试数据库恢复流程
3. **每季度**: 审查备份保留策略
4. **每年**: 更新备份和恢复文档

### 升级步骤
1. 测试新版本的备份服务
2. 在测试环境验证恢复功能
3. 部署到生产环境
4. 验证自动备份正常运行

## 📞 支持

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查Worker日志：`wrangler tail`
3. 运行监控脚本：`node monitor-backup-service.js`
4. 检查R2存储状态：`wrangler r2 bucket list`

## 📝 更新日志

### v1.0.0 (2024-08-20)
- ✅ 初始版本发布
- ✅ 每日自动备份功能
- ✅ 手动备份API
- ✅ 数据库恢复功能
- ✅ 备份监控工具
- ✅ 自动清理旧备份
