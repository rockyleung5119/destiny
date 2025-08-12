const { sendVerificationEmail, generateVerificationCode } = require('../services/emailService');
require('dotenv').config();

const testEmailTemplate = async () => {
  console.log('🧪 测试新的邮件模板...\n');
  
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

  console.log(`📨 准备发送测试邮件到: ${testEmail}`);
  console.log(`🔢 测试验证码: ${testCode}\n`);

  try {
    // 测试中文模板
    console.log('📧 测试中文邮件模板...');
    await sendVerificationEmail(testEmail, testCode, 'zh');
    console.log('✅ 中文邮件发送成功！\n');

    // 等待2秒
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 测试英文模板
    console.log('📧 测试英文邮件模板...');
    await sendVerificationEmail(testEmail, testCode, 'en');
    console.log('✅ 英文邮件发送成功！\n');

    console.log('🎉 所有测试完成！');
    console.log('📬 请检查您的邮箱，应该收到两封测试邮件：');
    console.log('   1. 中文版本的验证码邮件');
    console.log('   2. 英文版本的验证码邮件');
    console.log('\n📋 邮件特性:');
    console.log('   ✨ 专业的Indicate.Top品牌设计');
    console.log('   📱 响应式设计，支持移动设备');
    console.log('   🌍 多语言支持');
    console.log('   🔒 安全提示');
    console.log('   🎨 渐变色彩设计');

  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 认证失败，请检查邮箱用户名和授权码');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 网络连接失败，请检查SMTP服务器地址');
    } else if (error.code === 'ECONNECTION') {
      console.error('🔌 连接失败，请检查端口和安全设置');
    }
    
    console.error('\n🔧 解决方案:');
    console.error('1. 检查.env文件中的邮件配置');
    console.error('2. 确认SMTP服务已启用');
    console.error('3. 验证授权码是否正确');
    console.error('4. 检查网络连接');
  }
};

// 运行测试
testEmailTemplate();
