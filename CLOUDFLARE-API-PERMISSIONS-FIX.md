# Cloudflare API权限问题解决指南

## 🔍 **问题确认**

您当前使用的API Token: `zyKp3o51oSfzzonILz_chlTEymI_Mq2Dn33MUJLB`

这个token可能存在以下问题：
1. **权限不足** - 缺少Durable Objects相关权限
2. **token过期** - 需要重新生成
3. **账户计划限制** - 免费计划不支持某些功能

## 🔧 **解决方案**

### 方案1: 检查和更新API Token权限

#### 步骤1: 访问Cloudflare API Token页面
https://dash.cloudflare.com/profile/api-tokens

#### 步骤2: 找到您的token并检查权限
需要确保token包含以下权限：
- ✅ **Zone:Zone:Read** (如果有自定义域名)
- ✅ **Zone:Zone Settings:Edit** (如果有自定义域名)
- ✅ **Account:Cloudflare Workers:Edit**
- ✅ **Account:Account Settings:Read**
- ✅ **User:User Details:Read**

#### 步骤3: 为Durable Objects添加特殊权限
- ✅ **Account:Workers KV Storage:Edit**
- ✅ **Account:Workers Scripts:Edit**
- ✅ **Account:Account Analytics:Read**

### 方案2: 创建新的API Token（推荐）

#### 步骤1: 创建自定义token
1. 访问: https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择 "Custom token"

#### 步骤2: 配置权限
```
Permissions:
- Account | Cloudflare Workers:Edit
- Account | Account Settings:Read  
- Account | Zone Settings:Edit
- Zone | Zone:Read
- User | User Details:Read

Account Resources:
- Include | All accounts

Zone Resources:
- Include | All zones (如果有域名)
```

#### 步骤3: 更新环境变量
```powershell
# 设置新的API Token
$env:CLOUDFLARE_API_TOKEN = "your_new_token_here"

# 或者永久设置
[Environment]::SetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "your_new_token_here", "User")
```

### 方案3: 使用OAuth登录（最简单）

#### 清除当前token并重新登录
```bash
# 清除环境变量
unset CLOUDFLARE_API_TOKEN
# 或在PowerShell中
Remove-Item Env:CLOUDFLARE_API_TOKEN

# 重新登录
wrangler logout
wrangler login
```

这会打开浏览器进行OAuth认证，自动获得所有必要权限。

## 🚀 **立即修复步骤**

### 快速修复1: 清除token使用OAuth
```powershell
# 1. 清除当前token
Remove-Item Env:CLOUDFLARE_API_TOKEN

# 2. 重新登录
wrangler logout
wrangler login

# 3. 测试连接
wrangler whoami

# 4. 部署
wrangler deploy
```

### 快速修复2: 检查账户计划
```bash
# 检查账户信息和计划
wrangler whoami
```

如果显示免费计划，需要升级到Workers Paid计划才能使用Durable Objects。

## 📋 **权限检查清单**

### 必需权限（Durable Objects）
- [ ] Account:Cloudflare Workers:Edit
- [ ] Account:Account Settings:Read
- [ ] User:User Details:Read
- [ ] Workers Paid计划已激活

### 可选权限（如果有自定义域名）
- [ ] Zone:Zone:Read
- [ ] Zone:Zone Settings:Edit

### 账户要求
- [ ] 已验证邮箱
- [ ] 已绑定支付方式（如果使用付费功能）
- [ ] Workers Paid计划（$5/月）

## 🔍 **诊断命令**

### 检查当前认证状态
```bash
# 检查是否使用token
echo $env:CLOUDFLARE_API_TOKEN

# 检查用户信息
wrangler whoami

# 检查账户权限
wrangler account list
```

### 测试API连接
```bash
# 测试基本连接
wrangler dev --dry-run

# 测试部署权限
wrangler deploy --dry-run
```

## ⚠️ **常见错误和解决方案**

### 错误1: "fetch failed"
**原因**: Token权限不足或过期
**解决**: 重新创建token或使用OAuth登录

### 错误2: "Durable Objects are not available"
**原因**: 免费计划限制
**解决**: 升级到Workers Paid计划

### 错误3: "Unauthorized"
**原因**: Token无效或权限不足
**解决**: 检查token权限或重新生成

### 错误4: "Account not found"
**原因**: Token关联的账户有问题
**解决**: 使用OAuth重新认证

## 🎯 **推荐解决流程**

### 流程1: OAuth重新认证（最简单）
```bash
Remove-Item Env:CLOUDFLARE_API_TOKEN
wrangler logout
wrangler login
wrangler deploy
```

### 流程2: 更新API Token权限
1. 访问API Token页面
2. 编辑现有token
3. 添加必要权限
4. 重新部署

### 流程3: 升级账户计划
1. 访问Workers计划页面
2. 升级到Paid计划
3. 重新部署

## 📊 **验证修复成功**

修复后，以下命令应该正常工作：
```bash
# 1. 用户信息
wrangler whoami

# 2. 账户列表
wrangler account list

# 3. 部署测试
wrangler deploy --dry-run

# 4. 实际部署
wrangler deploy
```

## 💡 **建议**

1. **立即尝试**: OAuth重新认证（最简单）
2. **如果失败**: 检查账户计划是否支持Durable Objects
3. **最后手段**: 创建新的API Token with完整权限

现在您可以根据情况选择最适合的修复方法！🚀
