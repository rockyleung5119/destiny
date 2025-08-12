# 📧 AODSend 邮件服务配置指南

## 🔧 AODSend 配置

如果您选择使用AODSend作为邮件服务提供商，请按照以下步骤配置：

### 环境变量配置

在 `backend/.env` 文件中添加以下配置：

```env
# AODSend 邮件服务配置
EMAIL_SERVICE=aodsend
EMAIL_HOST=smtp.aodsend.com  # 请替换为实际的SMTP服务器地址
EMAIL_PORT=587               # 请替换为实际的端口号
EMAIL_SECURE=false           # 根据实际情况设置
EMAIL_USER=your-aodsend-username
EMAIL_PASS=your-aodsend-password

# 应用配置
APP_NAME=Indicate.Top
VERIFICATION_CODE_LENGTH=6
VERIFICATION_CODE_EXPIRES=300000  # 5分钟
MAX_VERIFICATION_ATTEMPTS=3
```

### 需要提供的信息

为了完成AODSend的配置，我需要您提供以下信息：

1. **SMTP服务器地址** - AODSend的SMTP服务器域名
2. **端口号** - SMTP服务端口（通常是587或465）
3. **加密方式** - 是否使用SSL/TLS加密
4. **认证方式** - 用户名/密码认证还是API密钥认证
5. **API文档** - AODSend的API文档链接（如果有）

### 配置示例

```javascript
// 在emailService.js中的AODSend配置
case 'aodsend':
  config.host = process.env.EMAIL_HOST || 'smtp.aodsend.com';
  config.port = parseInt(process.env.EMAIL_PORT) || 587;
  config.secure = process.env.EMAIL_SECURE === 'true';
  // 如果AODSend有特殊的认证方式，可以在这里添加
  break;
```

## 🧪 测试配置

配置完成后，运行测试脚本：

```bash
cd backend
node scripts/testEmail.js
```

## 📋 需要您提供的信息

请提供以下AODSend的配置信息：

### 基本信息
- [ ] SMTP服务器地址
- [ ] SMTP端口号
- [ ] 是否使用SSL/TLS
- [ ] 用户名格式
- [ ] 密码/API密钥格式

### API信息（如果支持）
- [ ] API端点URL
- [ ] API密钥获取方式
- [ ] API文档链接
- [ ] 请求格式（JSON/Form-data）

### 限制信息
- [ ] 每日发送限制
- [ ] 每小时发送限制
- [ ] 并发连接限制
- [ ] 邮件大小限制

### 功能支持
- [ ] 是否支持HTML邮件
- [ ] 是否支持附件
- [ ] 是否支持邮件追踪
- [ ] 是否支持退信处理

## 🔄 如果AODSend不可用

如果AODSend暂时不可用或配置有问题，我推荐以下备选方案：

### 1. SendGrid（推荐）
- 高稳定性和送达率
- 免费额度：100封/天
- 配置简单，文档完善

### 2. Amazon SES
- 成本低：$0.10/1000封
- AWS生态系统集成
- 高可靠性

### 3. Mailgun
- 开发者友好
- 免费额度：5000封/月
- 强大的API功能

## 📞 获取帮助

如果您需要帮助配置AODSend或其他邮件服务，请提供：

1. AODSend的官方文档或配置说明
2. 您的AODSend账户配置信息（请隐藏敏感信息）
3. 任何错误信息或日志

联系方式：support@indicate.top

---

**注意**: 请确保提供的配置信息准确无误，以保证邮件发送的稳定性。
