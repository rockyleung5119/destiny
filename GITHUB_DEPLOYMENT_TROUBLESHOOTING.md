# GitHub自动部署故障排除指南

## 🚨 常见部署失败原因

### 1. GitHub Secrets配置问题
检查以下secrets是否正确配置：

**必需的Secrets:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API令牌
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare账户ID

**检查方法:**
1. 进入GitHub仓库 → Settings → Secrets and variables → Actions
2. 确认上述secrets存在且值正确

### 2. Package.json问题
**症状:** `npm install` 失败
**解决方案:**
```bash
# 在backend目录下确保有正确的package.json
cd backend
cp workers-package.json package.json  # 如果需要
```

### 3. Wrangler配置问题
**症状:** 部署时配置错误
**检查项目:**
- `wrangler.toml` 文件存在
- `name` 字段正确
- `main` 字段指向正确的入口文件

### 4. TypeScript编译问题
**症状:** Worker代码编译失败
**解决方案:**
- 检查 `worker.ts` 语法
- 确保所有导入的模块存在
- 验证类型定义正确

## 🔧 快速修复步骤

### 步骤1: 检查GitHub Actions日志
1. 进入GitHub仓库
2. 点击 "Actions" 标签
3. 查看最新的失败构建
4. 点击失败的job查看详细日志

### 步骤2: 本地验证
```bash
cd backend

# 检查文件结构
ls -la

# 验证wrangler配置
npx wrangler whoami
npx wrangler deploy --dry-run

# 测试TypeScript编译
npx tsc --noEmit worker.ts
```

### 步骤3: 手动部署测试
```bash
cd backend

# 安装依赖
npm install

# 手动部署
npx wrangler deploy
```

## 🎯 特定错误解决方案

### 错误: "Authentication failed"
**原因:** Cloudflare API令牌无效
**解决:**
1. 重新生成Cloudflare API令牌
2. 确保令牌有正确的权限
3. 更新GitHub Secrets

### 错误: "Package not found"
**原因:** package.json缺失或配置错误
**解决:**
```bash
cd backend
# 使用workers专用的package.json
cp workers-package.json package.json
git add package.json
git commit -m "Add package.json for deployment"
git push
```

### 错误: "Wrangler command failed"
**原因:** wrangler.toml配置问题
**解决:**
1. 检查wrangler.toml语法
2. 验证所有必需字段
3. 确保兼容性日期正确

### 错误: "TypeScript compilation failed"
**原因:** TypeScript代码错误
**解决:**
1. 检查worker.ts中的语法错误
2. 确保所有导入正确
3. 验证类型定义

## 🚀 推荐的部署流程

### 1. 预部署检查
```bash
# 运行系统检查
cd backend
node stripe-system-check.cjs

# 验证配置
npx wrangler deploy --dry-run
```

### 2. 使用新的部署工作流
推送代码时会触发 `deploy-backend-stripe.yml`，它包含：
- 更好的错误处理
- 详细的验证步骤
- Stripe特定的检查

### 3. 监控部署
```bash
# 查看实时日志
npx wrangler tail

# 测试部署结果
curl https://destiny-backend.rocky-liang.workers.dev/api/health
```

## 📊 部署状态检查

### 健康检查端点
```bash
curl https://destiny-backend.rocky-liang.workers.dev/api/health
```

**期望响应:**
```json
{
  "status": "ok",
  "message": "Destiny API Server is running on Cloudflare Workers",
  "timestamp": "2025-08-23T...",
  "version": "1.0.5-final",
  "environment": "production"
}
```

### Stripe端点检查
```bash
# 检查Stripe webhook端点（应该返回400，因为缺少签名）
curl -X POST https://destiny-backend.rocky-liang.workers.dev/api/stripe/webhook
```

## 🔄 回滚策略

如果部署失败：

### 1. 快速回滚
```bash
# 回滚到上一个工作版本
git revert HEAD
git push
```

### 2. 手动修复
```bash
# 本地修复问题
# 测试修复
npx wrangler deploy --dry-run

# 推送修复
git add .
git commit -m "Fix deployment issues"
git push
```

## 📞 获取帮助

### 查看详细日志
1. GitHub Actions页面查看构建日志
2. Cloudflare Dashboard查看Workers日志
3. 使用 `wrangler tail` 查看实时日志

### 常用调试命令
```bash
# 检查wrangler状态
npx wrangler whoami

# 查看Workers列表
npx wrangler list

# 查看环境变量
npx wrangler secret list

# 查看D1数据库
npx wrangler d1 list
```

## ✅ 成功部署标志

部署成功后应该看到：
- ✅ GitHub Actions构建通过
- ✅ 健康检查端点返回200
- ✅ Stripe端点可访问
- ✅ 无TypeScript编译错误
- ✅ Cloudflare Dashboard显示Workers运行正常

---

**提示:** 如果问题持续存在，可以暂时禁用自动部署，使用手动部署直到问题解决。
