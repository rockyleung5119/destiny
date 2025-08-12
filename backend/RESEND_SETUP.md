# 📧 Resend 邮件服务配置指南

## 🎯 为什么选择 Resend？

Resend 是一个现代化的邮件发送服务，具有以下优势：
- ✅ **高送达率** - 专业的邮件基础设施
- ✅ **开发者友好** - 简洁的 API 和优秀的文档
- ✅ **实时监控** - 详细的发送统计和日志
- ✅ **合理定价** - 免费额度 3000 封/月，付费计划从 $20/月开始
- ✅ **快速集成** - 简单的 SDK 和 API

## 🔧 配置步骤

### 1. 注册 Resend 账户
1. 访问 [resend.com](https://resend.com)
2. 注册账户并验证邮箱
3. 登录到控制台

### 2. 添加发送域名
1. 在 Resend 控制台中点击 "Domains"
2. 点击 "Add Domain"
3. 输入您的域名（如：yourdomain.com）
4. 按照指示配置 DNS 记录：
   - SPF 记录
   - DKIM 记录
   - DMARC 记录（可选但推荐）

### 3. 获取 API Key
1. 在控制台中点击 "API Keys"
2. 点击 "Create API Key"
3. 选择权限（推荐：Send emails）
4. 复制生成的 API Key

### 4. 配置环境变量

在 `backend/.env` 文件中添加以下配置：

```env
# Resend 邮件服务配置
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Indicate.Top

# 应用配置
APP_NAME=Indicate.Top
VERIFICATION_CODE_EXPIRES=300000  # 5分钟
VERIFICATION_CODE_LENGTH=6
MAX_VERIFICATION_ATTEMPTS=3
```

## 📋 需要提供的信息

请提供以下信息以完成配置：

1. **Resend API Key** - 您的 Resend API 密钥
   ```
   格式：re_xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **发送域名** - 您要使用的发送邮箱地址
   ```
   示例：noreply@yourdomain.com
   或：support@yourdomain.com
   ```

3. **发送者名称** - 邮件发送者显示名称
   ```
   示例：Indicate.Top
   或：Indicate.Top Support
   ```

## 🧪 测试配置

配置完成后，运行测试脚本：

```bash
cd backend
node scripts/testResendEmail.js
```

## 📊 Resend 优势对比

| 功能 | Resend | 传统SMTP |
|------|--------|----------|
| 配置复杂度 | 简单 | 复杂 |
| 送达率 | 高 | 中等 |
| 实时监控 | 是 | 否 |
| 错误处理 | 详细 | 基础 |
| 开发体验 | 优秀 | 一般 |

## 🔒 安全最佳实践

1. **API Key 安全**：
   - 不要在代码中硬编码 API Key
   - 使用环境变量存储敏感信息
   - 定期轮换 API Key

2. **域名验证**：
   - 确保正确配置 SPF、DKIM 记录
   - 监控域名声誉
   - 使用专用的发送域名

3. **发送限制**：
   - 遵守发送频率限制
   - 实施适当的速率限制
   - 监控发送统计

## 📈 监控和分析

Resend 提供详细的发送统计：
- 发送成功率
- 打开率
- 点击率
- 退信率
- 投诉率

## 🆘 故障排除

### 常见问题：

1. **API Key 无效**
   - 检查 API Key 是否正确
   - 确认 API Key 权限设置

2. **域名未验证**
   - 检查 DNS 记录配置
   - 等待 DNS 传播（最多 48 小时）

3. **发送失败**
   - 检查收件人邮箱格式
   - 确认发送配额未超限
   - 查看 Resend 控制台错误日志

## 📞 支持

如果遇到问题，可以：
- 查看 [Resend 文档](https://resend.com/docs)
- 联系 Resend 支持团队
- 查看项目的故障排除指南
