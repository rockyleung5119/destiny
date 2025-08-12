# 📧 邮件服务提供商配置指南

本指南将帮助您配置不同的邮件服务提供商，以确保邮件发送的稳定性和可靠性。

## 🎯 推荐的邮件服务提供商

### 1. Resend (强烈推荐 - 现代化)
**优势**: 开发者友好、高送达率、实时监控、简洁API
**价格**: 免费额度3000封/月，付费计划从$20/月开始

```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Indicate.Top
```

### 2. SendGrid (推荐 - 高稳定性)
**优势**: 高送达率、详细的分析报告、API友好
**价格**: 免费额度100封/天，付费计划从$14.95/月开始

```env
EMAIL_SERVICE=sendgrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### 2. Amazon SES (推荐 - 成本效益)
**优势**: 成本低、高可靠性、AWS生态系统集成
**价格**: $0.10/1000封邮件

```env
EMAIL_SERVICE=ses
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
```

### 3. Mailgun (推荐 - 开发者友好)
**优势**: 强大的API、详细的日志、易于集成
**价格**: 免费额度5000封/月，付费计划从$35/月开始

```env
EMAIL_SERVICE=mailgun
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-mailgun-smtp-username
EMAIL_PASS=your-mailgun-smtp-password
```

### 4. QQ邮箱 (国内用户)
**优势**: 国内用户熟悉、配置简单
**限制**: 每日发送限制、可能被标记为垃圾邮件

```env
EMAIL_SERVICE=qq
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-qq-email@qq.com
EMAIL_PASS=your-qq-authorization-code
```

### 5. 163邮箱 (国内用户)
**优势**: 国内稳定、配置简单
**限制**: 每日发送限制

```env
EMAIL_SERVICE=163
EMAIL_HOST=smtp.163.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-163-email@163.com
EMAIL_PASS=your-163-authorization-code
```

## 🔧 配置步骤

### SendGrid 配置步骤
1. 注册 [SendGrid](https://sendgrid.com/) 账户
2. 验证您的发送域名
3. 创建API密钥：Settings > API Keys > Create API Key
4. 选择"Restricted Access"，启用"Mail Send"权限
5. 复制API密钥到环境变量

### Amazon SES 配置步骤
1. 登录AWS控制台，进入SES服务
2. 验证您的发送域名或邮箱地址
3. 创建SMTP凭证：SMTP Settings > Create My SMTP Credentials
4. 下载凭证文件，配置到环境变量
5. 如果在沙盒模式，需要申请生产访问权限

### Mailgun 配置步骤
1. 注册 [Mailgun](https://www.mailgun.com/) 账户
2. 添加并验证您的域名
3. 获取SMTP凭证：Domains > 选择域名 > SMTP
4. 配置DNS记录以提高送达率
5. 将凭证配置到环境变量

## 📋 环境变量配置

在 `backend/.env` 文件中添加以下配置：

```env
# 邮件服务配置
EMAIL_SERVICE=sendgrid  # 选择服务提供商
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-api-key

# 应用配置
APP_NAME=Indicate.Top
VERIFICATION_CODE_LENGTH=6
VERIFICATION_CODE_EXPIRES=300000  # 5分钟 (毫秒)
MAX_VERIFICATION_ATTEMPTS=3
```

## 🧪 测试邮件发送

运行测试脚本验证配置：

```bash
cd backend
node scripts/testEmail.js
```

## 📊 邮件模板特性

我们的邮件模板包含以下特性：

### ✨ 设计特点
- 🎨 专业的品牌视觉设计
- 📱 响应式设计，支持移动设备
- 🌍 多语言支持（中文/英文）
- 🔒 安全提示和用户指导
- 🔢 清晰的验证码显示
- 🏢 品牌一致性

### 📁 模板文件
- `verification-email-zh.html` - 中文邮件模板
- `verification-email-en.html` - 英文邮件模板
- `template-config.json` - 配置信息

## 🚀 部署建议

### 生产环境推荐
1. **SendGrid** - 适合中小型应用，配置简单
2. **Amazon SES** - 适合大规模应用，成本低
3. **Mailgun** - 适合需要详细分析的应用

### 备用方案
配置多个邮件服务提供商，实现故障转移：

```javascript
// 在emailService.js中实现故障转移逻辑
const providers = ['sendgrid', 'ses', 'mailgun'];
let currentProvider = 0;

const sendEmailWithFailover = async (email, code) => {
  for (let i = 0; i < providers.length; i++) {
    try {
      process.env.EMAIL_SERVICE = providers[currentProvider];
      await sendVerificationEmail(email, code);
      return;
    } catch (error) {
      console.log(`Provider ${providers[currentProvider]} failed, trying next...`);
      currentProvider = (currentProvider + 1) % providers.length;
    }
  }
  throw new Error('All email providers failed');
};
```

## ❓ 常见问题

### Q: 邮件进入垃圾箱怎么办？
A: 
1. 配置SPF、DKIM、DMARC记录
2. 使用专业邮件服务提供商
3. 避免垃圾邮件关键词
4. 保持良好的发送声誉

### Q: 如何提高送达率？
A:
1. 验证发送域名
2. 使用专用IP地址
3. 监控退信率和投诉率
4. 定期清理无效邮箱

### Q: 如何监控邮件发送状态？
A:
1. 使用提供商的Webhook功能
2. 记录发送日志
3. 监控退信和投诉
4. 设置告警机制

## 🔐 安全建议

1. **API密钥安全**: 使用环境变量存储，定期轮换
2. **访问控制**: 限制API密钥权限
3. **监控异常**: 监控发送量异常
4. **备份配置**: 保存配置备份

---

需要更多帮助？请联系技术支持：support@indicate.top
