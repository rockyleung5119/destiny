# GitHub Actions 部署故障排除指南

## 🚨 常见部署失败原因

### 1. Cloudflare API Token 问题
**症状**: Actions失败，错误信息包含 "Authentication failed" 或 "Invalid API token"

**解决方案**:
```bash
# 1. 检查GitHub Secrets是否正确设置
# 访问: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions

# 2. 重新生成Cloudflare API Token
# 访问: https://dash.cloudflare.com/profile/api-tokens
# 权限需要包括:
# - Zone:Zone:Read
# - Zone:Zone Settings:Edit  
# - Account:Cloudflare Workers:Edit
# - Account:Account Settings:Read
# - Zone:Page Rules:Edit

# 3. 更新GitHub Secrets
CLOUDFLARE_API_TOKEN=your_new_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

### 2. 依赖安装失败
**症状**: npm install 或 npm ci 失败

**解决方案**:
```bash
# 本地测试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 如果本地正常，检查GitHub Actions中的Node.js版本
# 确保与本地开发环境一致
```

### 3. 构建失败
**症状**: npm run build 失败，通常是内存不足或依赖问题

**解决方案**:
```bash
# 本地测试构建
npm run build

# 检查构建输出
ls -la dist/

# 如果本地正常，可能是GitHub Actions内存限制
# 已在vite.config.ts中优化构建配置
```

### 4. Wrangler 部署失败
**症状**: wrangler deploy 命令失败

**解决方案**:
```bash
# 检查wrangler配置
cd backend
cat wrangler.toml

# 手动测试部署
wrangler deploy --dry-run

# 检查环境变量
wrangler secret list
```

## 🛠️ 手动部署步骤

### 前端部署
```bash
# 1. 构建前端
npm ci
npm run build

# 2. 部署到Cloudflare Pages
npx wrangler pages deploy dist --project-name=destiny-frontend

# 3. 验证部署
curl -I https://indicate.top
```

### 后端部署
```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 部署到Cloudflare Workers
npx wrangler deploy

# 4. 验证部署
curl https://api.indicate.top/api/health
```

## 🔧 使用提供的脚本

### PowerShell 脚本 (Windows)
```powershell
# 检查部署状态
.\check-deployment.ps1

# 手动部署（测试模式）
.\deploy-fix.ps1 -Test

# 手动部署前端
.\deploy-fix.ps1 -Target frontend

# 手动部署后端  
.\deploy-fix.ps1 -Target backend

# 完整部署
.\deploy-fix.ps1 -Target both -Verbose
```

### Bash 脚本 (Linux/Mac)
```bash
# 如果需要，可以创建对应的bash版本
# 或者使用npm scripts

npm run deploy:frontend
npm run deploy:backend
```

## 📊 部署验证清单

### ✅ 前端验证
- [ ] https://indicate.top 可访问
- [ ] https://destiny-frontend.pages.dev 可访问
- [ ] 页面正常加载，无JavaScript错误
- [ ] 登录功能正常
- [ ] 支付页面可访问

### ✅ 后端验证
- [ ] https://api.indicate.top/api/health 返回200
- [ ] https://api.indicate.top/api/stripe/health 返回200
- [ ] Stripe配置正确
- [ ] 认证API正常工作
- [ ] CORS配置正确

## 🚨 紧急修复步骤

如果GitHub Actions完全无法工作，按以下步骤紧急修复:

1. **立即手动部署**:
   ```bash
   # 使用PowerShell脚本
   .\deploy-fix.ps1 -Target both
   ```

2. **检查服务状态**:
   ```bash
   .\check-deployment.ps1
   ```

3. **验证功能**:
   - 访问 https://indicate.top
   - 测试登录功能
   - 测试支付功能

4. **修复GitHub Actions**:
   - 检查Secrets配置
   - 更新API Token
   - 重新触发工作流

## 📞 获取帮助

如果以上步骤都无法解决问题:

1. 查看GitHub Actions日志的详细错误信息
2. 检查Cloudflare Dashboard中的部署日志
3. 使用 `deployment-diagnostic.html` 工具进行全面诊断
4. 查看浏览器控制台的错误信息

## 🔄 恢复策略

如果新部署出现问题，可以:

1. **回滚到上一个工作版本**:
   ```bash
   # 在Cloudflare Dashboard中回滚部署
   # 或者重新部署上一个稳定的commit
   ```

2. **使用备用域名**:
   - 主域名: https://indicate.top
   - 备用域名: https://destiny-frontend.pages.dev

3. **紧急维护模式**:
   - 临时显示维护页面
   - 通知用户系统正在维护
