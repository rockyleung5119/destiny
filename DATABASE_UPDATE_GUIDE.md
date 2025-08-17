# 数据库更新指南 - 修复 Member Settings 页面

## 问题描述

Member Settings 页面出现 "Internal server error" 错误，原因是数据库中缺少 `birth_minute` 字段，导致后端查询失败。

## 解决方案

需要在 D1 数据库中添加缺失的 `birth_minute` 字段。

## 步骤 1: 检查当前数据库状态

首先，让我们检查当前的数据库结构：

```bash
# 使用 wrangler 连接到 D1 数据库
npx wrangler d1 execute destiny-db --command="PRAGMA table_info(users);"
```

您应该看到类似这样的输出，但可能缺少 `birth_minute` 字段：
```
cid | name                    | type    | notnull | dflt_value      | pk
----|-------------------------|---------|---------|-----------------|----
0   | id                      | INTEGER | 1       |                 | 1
1   | email                   | TEXT    | 1       |                 | 0
2   | password_hash           | TEXT    | 1       |                 | 0
3   | name                    | TEXT    | 1       |                 | 0
4   | gender                  | TEXT    | 0       |                 | 0
5   | birth_year              | INTEGER | 0       |                 | 0
6   | birth_month             | INTEGER | 0       |                 | 0
7   | birth_day               | INTEGER | 0       |                 | 0
8   | birth_hour              | INTEGER | 0       |                 | 0
9   | birth_place             | TEXT    | 0       |                 | 0
10  | timezone                | TEXT    | 0       | 'Asia/Shanghai' | 0
11  | is_email_verified       | INTEGER | 0       | 0               | 0
12  | profile_updated_count   | INTEGER | 0       | 0               | 0
13  | created_at              | TEXT    | 0       | CURRENT_TIMESTAMP| 0
14  | updated_at              | TEXT    | 0       | CURRENT_TIMESTAMP| 0
```

## 步骤 2: 添加缺失的字段

执行以下命令添加 `birth_minute` 字段：

```bash
# 添加 birth_minute 字段
npx wrangler d1 execute destiny-db --command="ALTER TABLE users ADD COLUMN birth_minute INTEGER;"
```

## 步骤 3: 更新现有用户数据

为现有用户设置默认的 birth_minute 值：

```bash
# 为现有用户设置默认值（0表示整点）
npx wrangler d1 execute destiny-db --command="UPDATE users SET birth_minute = 0 WHERE birth_minute IS NULL;"
```

## 步骤 4: 验证更新

验证字段添加成功：

```bash
# 检查表结构
npx wrangler d1 execute destiny-db --command="PRAGMA table_info(users);"

# 检查用户数据
npx wrangler d1 execute destiny-db --command="SELECT id, name, email, birth_year, birth_month, birth_day, birth_hour, birth_minute FROM users LIMIT 5;"
```

现在您应该看到 `birth_minute` 字段已经添加到表结构中。

## 步骤 5: 使用迁移文件（可选）

如果您想使用迁移文件，可以执行：

```bash
# 使用迁移文件
npx wrangler d1 execute destiny-db --file=backend/migrations/add-birth-minute-field.sql
```

## 完整的一键更新命令

如果您想一次性执行所有更新，可以使用以下命令：

```bash
# 一键更新数据库
npx wrangler d1 execute destiny-db --command="
ALTER TABLE users ADD COLUMN birth_minute INTEGER;
UPDATE users SET birth_minute = 0 WHERE birth_minute IS NULL;
"
```

## 验证修复

更新完成后，您可以测试 Member Settings 页面：

1. 访问您的网站
2. 登录账户
3. 进入 Member Settings 页面
4. 确认页面正常加载，不再显示 "Internal server error"

## 预期结果

修复后，您应该能够：
- ✅ 正常访问 Member Settings 页面
- ✅ 查看完整的个人资料信息
- ✅ 看到所有出生信息字段（包括分钟）
- ✅ 正常编辑和保存个人资料

## 注意事项

1. **备份数据**: 在执行任何数据库更改之前，建议先备份数据
2. **测试环境**: 如果可能，先在测试环境中验证这些更改
3. **不影响其他功能**: 这些更改只添加字段，不会影响现有功能
4. **算命精准性**: 添加 birth_minute 字段后，算命服务将更加精准

## 故障排除

如果遇到问题：

1. **权限错误**: 确保您有 D1 数据库的写权限
2. **字段已存在**: 如果提示字段已存在，可以忽略错误继续
3. **连接问题**: 检查网络连接和 Cloudflare 账户状态

## 后续步骤

数据库更新完成后：
1. 重新部署后端（如果需要）
2. 测试所有相关功能
3. 通知用户可以更新他们的出生时间信息以获得更精准的算命结果
