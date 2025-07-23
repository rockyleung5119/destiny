const { sendVerificationEmail, generateVerificationCode } = require('../services/emailService');
require('dotenv').config();

const testEmail = async () => {
  console.log('🧪 测试邮件发送功能...\n');
  
  // 检查环境变量
  console.log('📧 邮件配置:');
  console.log(`- 服务商: ${process.env.EMAIL_SERVICE}`);
  console.log(`- SMTP主机: ${process.env.EMAIL_HOST}`);
  console.log(`- 端口: ${process.env.EMAIL_PORT}`);
  console.log(`- 发送邮箱: ${process.env.EMAIL_USER}`);
  console.log(`- 授权码: ${process.env.EMAIL_PASS ? '已配置' : '❌ 未配置'}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ 请先配置邮箱用户名和授权码！');
    process.exit(1);
  }

  // 生成测试验证码
  const testCode = generateVerificationCode();
  const testEmail = process.env.EMAIL_USER; // 发送给自己进行测试

  try {
    console.log(`📤 正在发送测试邮件到: ${testEmail}`);
    console.log(`🔢 验证码: ${testCode}\n`);

    const result = await sendVerificationEmail(testEmail, testCode);
    
    if (result.success) {
      console.log('✅ 邮件发送成功！');
      console.log(`📨 消息ID: ${result.messageId}`);
      console.log('\n🎉 QQ邮箱SMTP配置正确！');
      console.log('💡 提示: 请检查收件箱（可能在垃圾邮件中）');
    } else {
      console.log('❌ 邮件发送失败');
    }
  } catch (error) {
    console.error('❌ 邮件发送错误:', error.message);
    
    // 提供常见错误的解决方案
    if (error.code === 'EAUTH') {
      console.log('\n🔧 解决方案:');
      console.log('1. 检查QQ邮箱地址是否正确');
      console.log('2. 检查授权码是否正确（16位字符）');
      console.log('3. 确认已开启IMAP/SMTP服务');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 解决方案:');
      console.log('1. 检查网络连接');
      console.log('2. 检查SMTP服务器地址');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 解决方案:');
      console.log('1. 检查端口号是否正确');
      console.log('2. 检查防火墙设置');
    }
  }
};

// 运行测试
testEmail();
