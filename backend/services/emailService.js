const nodemailer = require('nodemailer');
const { dbRun, dbGet } = require('../config/database');

// 创建邮件传输器
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

// 发送验证码邮件
const sendVerificationEmail = async (email, code) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: process.env.APP_NAME || 'Destiny Fortune Telling',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: `${process.env.APP_NAME || 'Destiny'} - Email Verification Code`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8b5cf6; margin: 0;">🔮 ${process.env.APP_NAME || 'Destiny'}</h1>
          <p style="color: #666; margin: 10px 0;">Fortune Telling & Spiritual Guidance</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h2 style="margin: 0 0 20px 0;">Email Verification Code</h2>
          <p style="margin: 0 0 20px 0; opacity: 0.9;">Please use the following verification code to complete email verification:</p>

          <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fff;">${code}</span>
          </div>

          <p style="margin: 20px 0 0 0; font-size: 14px; opacity: 0.8;">
            Verification code expires in ${Math.floor((parseInt(process.env.VERIFICATION_CODE_EXPIRES) || 300000) / 60000)} minutes
          </p>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="color: #333; margin: 0 0 15px 0;">Security Tips:</h3>
          <ul style="color: #666; margin: 0; padding-left: 20px;">
            <li>Do not share this verification code with others</li>
            <li>If this was not requested by you, please ignore this email</li>
            <li>This code is only for email verification purposes</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This email was sent automatically, please do not reply<br>
            © ${new Date().getFullYear()} ${process.env.APP_NAME || 'Destiny Fortune Telling'}. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
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
  sendVerificationEmail,
  saveVerificationCode,
  verifyCode,
  generateVerificationCode,
  cleanupExpiredCodes
};
