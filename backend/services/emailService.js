const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { dbRun, dbGet } = require('../config/database');
const path = require('path');
const fs = require('fs');

// 创建 Resend 客户端
const createResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required for Resend email service');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

// 创建邮件传输器（用于非Resend服务）
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  // 根据邮件服务提供商设置特定配置
  switch (process.env.EMAIL_SERVICE) {
    case 'gmail':
      config.service = 'gmail';
      break;
    case 'qq':
      config.host = 'smtp.qq.com';
      config.port = 587;
      config.secure = false;
      break;
    case '163':
      config.host = 'smtp.163.com';
      config.port = 587;
      config.secure = false;
      break;
    case 'sendgrid':
      config.host = 'smtp.sendgrid.net';
      config.port = 587;
      config.secure = false;
      break;
    case 'mailgun':
      config.host = 'smtp.mailgun.org';
      config.port = 587;
      config.secure = false;
      break;
    case 'ses':
      // AWS SES配置
      config.host = process.env.EMAIL_HOST || 'email-smtp.us-east-1.amazonaws.com';
      config.port = 587;
      config.secure = false;
      break;
    case 'aodsend':
      // 如果aodsend有特定的SMTP配置，在这里添加
      config.host = process.env.EMAIL_HOST || 'smtp.aodsend.com';
      config.port = parseInt(process.env.EMAIL_PORT) || 587;
      config.secure = process.env.EMAIL_SECURE === 'true';
      break;
    default:
      // 使用自定义配置
      break;
  }

  return nodemailer.createTransport(config);
};

// 生成验证码
const generateVerificationCode = () => {
  const length = parseInt(process.env.VERIFICATION_CODE_LENGTH) || 6;
  return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1))).toString();
};

// 生成英文邮件模板（与网站LOGO一致）
const generateEmailTemplate = (code, language = 'en') => {
  const appName = 'Indicate.Top';
  const subtitle = 'Ancient Divination Arts';

  // 只支持英文邮件模板
  const content = {
    subject: `${appName} - Email Verification Code`,
    title: 'Email Verification Code',
    description: 'Please use the following verification code to complete email verification:',
    expiry: `Verification code expires in ${Math.floor((parseInt(process.env.VERIFICATION_CODE_EXPIRES) || 300000) / 60000)} minutes`,
    securityTitle: 'Security Tips:',
    securityTips: [
      'Do not share this verification code with others',
      'If this was not requested by you, please ignore this email',
      'This code is only for email verification purposes'
    ],
    footer: `This email was sent automatically, please do not reply<br>© ${new Date().getFullYear()} ${appName}. All rights reserved.`
  };

  // 五颜六色的白色底色渐变
  const colorfulWhiteGradient = `linear-gradient(
    135deg,
    #ffffff 0%,
    #fff5f5 8%,    /* 红色白 */
    #fef3c7 16%,   /* 琥珀白 */
    #ecfdf5 24%,   /* 翡翠白 */
    #eff6ff 32%,   /* 蓝色白 */
    #f3e8ff 40%,   /* 紫色白 */
    #fdf4ff 48%,   /* 紫红白 */
    #fff1f2 56%,   /* 玫瑰白 */
    #fffbeb 64%,   /* 橙色白 */
    #f0fdf4 72%,   /* 绿色白 */
    #f0f9ff 80%,   /* 天蓝白 */
    #faf5ff 88%,   /* 紫罗兰白 */
    #ffffff 100%
  )`;

  return {
    subject: content.subject,
    html: `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
        <style>
          /* 移动端优化样式 */
          @media only screen and (max-width: 600px) {
            .email-container {
              margin: 0 5px !important;
              border-radius: 15px !important;
            }
            .header-section {
              padding: 30px 15px 20px 15px !important;
            }
            .brand-title {
              font-size: 24px !important;
            }
            .brand-subtitle {
              font-size: 16px !important;
            }
            .content-section {
              padding: 30px 15px !important;
            }
            .verification-container {
              padding: 20px 15px !important;
              margin: 20px 0 !important;
            }
            .verification-code-box {
              padding: 16px 20px !important;
            }
            .verification-code {
              font-size: 28px !important;
              letter-spacing: 4px !important;
            }
            .security-section {
              padding: 30px 15px !important;
            }
            .footer-section {
              padding: 20px 15px !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100vh; padding: 10px;">
        <div class="email-container" style="max-width: 600px; margin: 0 auto; background: ${colorfulWhiteGradient}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <div class="header-section" style="text-align: center; padding: 40px 20px 30px 20px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px);">
            <!-- 品牌名称 -->
            <h1 class="brand-title" style="color: #1f2937; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #1f2937 0%, #4f46e5 50%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${appName}</h1>
            <p class="brand-subtitle" style="color: #6b7280; margin: 8px 0 4px 0; font-size: 18px; font-weight: 600;">${subtitle}</p>
            <p style="color: #9ca3af; margin: 0; font-size: 14px; font-style: italic; opacity: 0.8;">Illuminating paths through celestial wisdom</p>
          </div>

          <!-- Main Content -->
          <div class="content-section" style="background: rgba(255, 255, 255, 0.6); padding: 50px 30px; text-align: center; color: #1f2937; position: relative; overflow: hidden;">
            <!-- 装饰性背景元素 -->
            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 20px; opacity: 0.6;">✨</span>
            </div>
            <div style="position: absolute; top: 60px; right: 30px; width: 24px; height: 24px; background: rgba(251, 191, 36, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 12px; opacity: 0.5;">🌙</span>
            </div>
            <div style="position: absolute; bottom: 30px; left: 50px; width: 32px; height: 32px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 16px; opacity: 0.4;">⭐</span>
            </div>

            <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${content.title}</h2>
            <p style="color: #4b5563; margin: 0 0 40px 0; font-size: 18px; line-height: 1.6;">${content.description}</p>

            <!-- Verification Code -->
            <div class="verification-container" style="background: rgba(255,255,255,0.8); padding: 30px 20px; border-radius: 20px; margin: 30px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; backdrop-filter: blur(10px);">
              <div class="verification-code-box" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #1f2937; display: inline-block; padding: 20px 30px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 2px solid rgba(139, 92, 246, 0.2); max-width: 100%; overflow: hidden;">
                <span class="verification-code" style="font-size: 36px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', monospace; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; word-break: break-all; display: inline-block; max-width: 100%;">${code}</span>
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 14px; font-weight: 500;">${content.expiry}</p>
            </div>
          </div>

          <!-- Security Tips -->
          <div class="security-section" style="padding: 40px 30px; background: rgba(255, 255, 255, 0.7);">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; text-align: center;">${content.securityTitle}</h3>
            <div style="background: rgba(255,255,255,0.8); padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <ul style="color: #4b5563; margin: 0; padding-left: 0; list-style: none; line-height: 1.8;">
                ${content.securityTips.map((tip, index) => `
                  <li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px;">
                    <span style="flex-shrink: 0; width: 24px; height: 24px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">${index + 1}</span>
                    <span style="flex: 1; font-size: 15px;">${tip}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-section" style="text-align: center; padding: 30px; background: rgba(255, 255, 255, 0.8); border-top: 1px solid rgba(229, 231, 235, 0.3);">
            <div style="background: rgba(255,255,255,0.7); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px);">
              <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">${content.footer}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// 通用邮件发送函数
const sendEmail = async (to, subject, textContent, htmlContent) => {
  // 如果使用 Resend 服务
  if (process.env.EMAIL_SERVICE === 'resend') {
    try {
      const resend = createResendClient();

      const result = await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log('✅ Email sent via Resend:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error);
      throw error;
    }
  }

  // 使用传统 SMTP 服务
  const transporter = createTransporter();

  const mailOptions = {
    from: {
      name: 'Indicate.Top',
      address: process.env.EMAIL_USER
    },
    to: to,
    subject: subject,
    text: textContent,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email via SMTP:', error);
    throw error;
  }
};

// 发送验证码邮件
const sendVerificationEmail = async (email, code, language = 'en') => {
  const template = generateEmailTemplate(code, language);
  return await sendEmail(email, template.subject, `Your verification code is: ${code}`, template.html);
};

// 保存验证码到数据库
const saveVerificationCode = async (email, code) => {
  const expiresAt = new Date(Date.now() + (parseInt(process.env.VERIFICATION_CODE_EXPIRES) || 300000));
  
  // 删除该邮箱的旧验证码
  await dbRun('DELETE FROM email_verifications WHERE email = ?', [email]);
  
  // 插入新验证码
  const result = await dbRun(
    'INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)',
    [email, code, expiresAt.toISOString()]
  );
  
  return result;
};

// 验证验证码
const verifyCode = async (email, inputCode) => {
  // 查找有效的验证码
  const verification = await dbGet(`
    SELECT * FROM email_verifications 
    WHERE email = ? AND is_used = FALSE AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `, [email]);

  if (!verification) {
    return {
      success: false,
      message: 'Verification code does not exist or has expired'
    };
  }

  // 检查尝试次数
  const maxAttempts = parseInt(process.env.MAX_VERIFICATION_ATTEMPTS) || 3;
  if (verification.attempts >= maxAttempts) {
    return {
      success: false,
      message: 'Too many incorrect attempts, please request a new verification code'
    };
  }

  // 验证码错误
  if (verification.code !== inputCode.trim()) {
    // 增加尝试次数
    await dbRun(
      'UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?',
      [verification.id]
    );
    
    return {
      success: false,
      message: `Incorrect verification code. ${maxAttempts - verification.attempts - 1} attempts remaining`
    };
  }

  // 验证成功，标记为已使用
  await dbRun(
    'UPDATE email_verifications SET is_used = TRUE WHERE id = ?',
    [verification.id]
  );

  return {
    success: true,
    message: 'Email verification successful'
  };
};

// 验证验证码但不标记为已使用（用于重置密码流程）
const verifyCodeForReset = async (email, inputCode) => {
  // 查找有效的验证码
  const verification = await dbGet(`
    SELECT * FROM email_verifications
    WHERE email = ? AND is_used = FALSE AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `, [email]);

  if (!verification) {
    return {
      success: false,
      message: 'Verification code does not exist or has expired'
    };
  }

  // 检查尝试次数
  const maxAttempts = parseInt(process.env.MAX_VERIFICATION_ATTEMPTS) || 3;
  if (verification.attempts >= maxAttempts) {
    return {
      success: false,
      message: 'Too many incorrect attempts, please request a new verification code'
    };
  }

  // 验证码错误
  if (verification.code !== inputCode.trim()) {
    // 增加尝试次数
    await dbRun(
      'UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?',
      [verification.id]
    );

    return {
      success: false,
      message: `Incorrect verification code. ${maxAttempts - verification.attempts - 1} attempts remaining`
    };
  }

  // 验证成功，但不标记为已使用，返回验证记录ID以便后续标记
  return {
    success: true,
    message: 'Email verification successful',
    verificationId: verification.id
  };
};

// 标记验证码为已使用
const markCodeAsUsed = async (verificationId) => {
  await dbRun(
    'UPDATE email_verifications SET is_used = TRUE WHERE id = ?',
    [verificationId]
  );
};

// 清理过期验证码
const cleanupExpiredCodes = async () => {
  try {
    const result = await dbRun(
      'DELETE FROM email_verifications WHERE expires_at < datetime("now")'
    );
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} expired verification codes`);
    }
  } catch (error) {
    console.error('Error cleaning up expired codes:', error);
  }
};

// 定期清理过期验证码（每小时执行一次）
setInterval(cleanupExpiredCodes, 60 * 60 * 1000);

module.exports = {
  sendEmail,
  sendVerificationEmail,
  saveVerificationCode,
  verifyCode,
  verifyCodeForReset,
  markCodeAsUsed,
  generateVerificationCode,
  cleanupExpiredCodes
};
