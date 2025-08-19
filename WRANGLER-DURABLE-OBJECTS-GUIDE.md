# wrangler部署Durable Objects完整指南

## 🚨 当前问题分析

您遇到的`fetch failed`错误通常是由以下原因造成的：
1. **网络连接问题**（代理设置）
2. **wrangler版本过旧**（当前4.29.1，最新4.31.0）
3. **认证token过期**

## 🔧 解决方案

### 方案1: 解决网络问题

#### 检查代理设置
```bash
# 检查代理环境变量
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 如果有代理，可能需要配置wrangler
```

#### 更新wrangler到最新版本
```bash
npm install -g wrangler@latest
# 或
npm update -g wrangler
```

#### 重新认证
```bash
wrangler logout
wrangler login
```

### 方案2: 使用Cloudflare Dashboard部署

如果wrangler命令行有问题，可以使用Dashboard：

1. **访问Cloudflare Dashboard**
   - https://dash.cloudflare.com/
   - 登录您的账户

2. **进入Workers & Pages**
   - 点击左侧菜单"Workers & Pages"
   - 找到"destiny-backend"

3. **上传新版本**
   - 点击"Edit code"
   - 复制worker.ts的内容
   - 粘贴到编辑器
   - 点击"Save and Deploy"

4. **配置Durable Objects**
   - 在Worker设置中找到"Settings"
   - 点击"Variables"
   - 添加Durable Objects绑定

### 方案3: 修复wrangler配置

#### 步骤1: 检查当前配置
```bash
# 检查wrangler版本
wrangler --version

# 检查配置文件
cat wrangler.toml
```

#### 步骤2: 修复网络问题
```bash
# 清除wrangler缓存
rm -rf ~/.wrangler
# 或在Windows上
rmdir /s %USERPROFILE%\.wrangler

# 重新初始化
wrangler login
```

#### 步骤3: 使用本地模式测试
```bash
# 本地测试（不需要网络）
wrangler dev --local=true --port=8787

# 测试Durable Objects
curl http://localhost:8787/api/async-status
```

## 🚀 正确的Durable Objects部署步骤

### 1. 确保配置正确

您的wrangler.toml应该包含：
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

### 2. 确保类正确导出

worker.ts应该包含：
```typescript
export class AIProcessor {
  // 类实现
}

export class BatchCoordinator {
  // 类实现
}
```

### 3. 部署命令
```bash
# 基本部署
wrangler deploy

# 带详细输出的部署
wrangler deploy --verbose

# 干运行（测试配置）
wrangler deploy --dry-run
```

## 🔍 故障排除

### 错误1: fetch failed
**原因**: 网络连接问题
**解决**: 
- 检查网络连接
- 更新wrangler版本
- 重新认证

### 错误2: Durable Objects not available
**原因**: 免费计划限制
**解决**: 升级到Workers Paid计划

### 错误3: Class not found
**原因**: TypeScript导出问题
**解决**: 确认export语句正确

### 错误4: Migration failed
**原因**: 配置语法错误
**解决**: 检查wrangler.toml语法

## 📋 部署检查清单

- [ ] wrangler版本最新（4.31.0+）
- [ ] 网络连接正常
- [ ] 已登录Cloudflare账户
- [ ] Workers Paid计划已激活
- [ ] wrangler.toml配置正确
- [ ] TypeScript类正确导出
- [ ] 本地测试通过

## 🎯 推荐的部署流程

### 流程1: 修复网络问题后部署
```bash
# 1. 更新wrangler
npm install -g wrangler@latest

# 2. 重新认证
wrangler logout
wrangler login

# 3. 测试连接
wrangler whoami

# 4. 部署
wrangler deploy
```

### 流程2: 使用GitHub Actions部署
如果本地网络有问题，可以推送到GitHub让Actions部署：
```bash
git add .
git commit -m "启用Durable Objects配置"
git push
```

### 流程3: 使用Dashboard手动部署
1. 复制worker.ts内容
2. 在Cloudflare Dashboard中粘贴
3. 手动配置Durable Objects绑定

## 📊 验证部署成功

部署成功后，访问：
```
https://destiny-backend.wlk8s6v9y.workers.dev/api/async-status
```

期望响应：
```json
{
  "status": "healthy",
  "durableObjectsCheck": {
    "hasAIProcessor": true,
    "hasBatchCoordinator": true
  }
}
```

## 🔄 当前状态

✅ **已完成**:
- Durable Objects配置已启用
- TypeScript类已正确导出
- 配置文件语法正确

⚠️ **待解决**:
- wrangler网络连接问题
- 可能需要更新wrangler版本

## 💡 建议

1. **立即尝试**: 更新wrangler版本
2. **备选方案**: 使用GitHub Actions部署
3. **最后手段**: 使用Cloudflare Dashboard手动部署

现在您可以根据网络情况选择最适合的部署方法！🚀
