/**
 * Resend 邮件服务测试脚本
 * 用于测试 Resend 邮件发送功能
 */

require('dotenv').config();
const { Resend } = require('resend');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

async function testResendConfiguration() {
  console.log(colors.cyan('🔧 测试 Resend 邮件服务配置...\n'));

  // 1. 检查环境变量
  console.log(colors.blue('1️⃣ 检查环境变量配置...'));
  
  const requiredEnvVars = {
    'EMAIL_SERVICE': process.env.EMAIL_SERVICE,
    'RESEND_API_KEY': process.env.RESEND_API_KEY,
    'RESEND_FROM_EMAIL': process.env.RESEND_FROM_EMAIL,
    'RESEND_FROM_NAME': process.env.RESEND_FROM_NAME
  };

  let configValid = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      console.log(colors.red(`❌ 缺少环境变量: ${key}`));
      configValid = false;
    } else {
      // 隐藏敏感信息
      const displayValue = key === 'RESEND_API_KEY' ? 
        `${value.substring(0, 8)}...` : value;
      console.log(colors.green(`✅ ${key}: ${displayValue}`));
    }
  }

  if (!configValid) {
    console.log(colors.red('\n❌ 配置不完整，请检查 .env 文件'));
    console.log(colors.yellow('📋 需要的环境变量:'));
    console.log('EMAIL_SERVICE=resend');
    console.log('RESEND_API_KEY=re_your_api_key_here');
    console.log('RESEND_FROM_EMAIL=noreply@yourdomain.com');
    console.log('RESEND_FROM_NAME=Indicate.Top');
    return;
  }

  // 2. 测试 Resend 连接
  console.log(colors.blue('\n2️⃣ 测试 Resend API 连接...'));
  
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // 测试 API Key 有效性（通过获取域名列表）
    const domains = await resend.domains.list();
    console.log(colors.green('✅ Resend API 连接成功'));
    console.log(colors.cyan(`📊 已配置域名数量: ${domains.data?.length || 0}`));
    
    if (domains.data && domains.data.length > 0) {
      console.log(colors.cyan('📋 已验证的域名:'));
      domains.data.forEach(domain => {
        const status = domain.status === 'verified' ? 
          colors.green('✅ 已验证') : 
          colors.yellow('⏳ 待验证');
        console.log(`   - ${domain.name}: ${status}`);
      });
    }
  } catch (error) {
    console.log(colors.red('❌ Resend API 连接失败:'));
    console.log(colors.red(`   错误: ${error.message}`));
    return;
  }

  // 3. 生成测试邮件模板
  console.log(colors.blue('\n3️⃣ 生成邮件模板...'));

  try {
    const testCode = '123456';
    // 简单的测试邮件模板
    const template = {
      subject: 'Indicate.Top - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Email Verification Code</h2>
          <p style="color: #666; text-align: center;">Please use the following verification code:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px;">${testCode}</span>
          </div>
          <p style="color: #666; text-align: center; font-size: 14px;">This code expires in 5 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; text-align: center; font-size: 12px;">© 2025 Indicate.Top. All rights reserved.</p>
        </div>
      `
    };
    console.log(colors.green('✅ 邮件模板生成成功'));
    console.log(colors.cyan(`📧 邮件主题: ${template.subject}`));
  } catch (error) {
    console.log(colors.red('❌ 邮件模板生成失败:'));
    console.log(colors.red(`   错误: ${error.message}`));
    return;
  }

  // 4. 发送测试邮件
  console.log(colors.blue('\n4️⃣ 发送测试邮件...'));
  
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  console.log(colors.yellow(`📮 测试邮箱: ${testEmail}`));
  console.log(colors.yellow('💡 提示: 设置 TEST_EMAIL 环境变量来指定测试邮箱'));

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const testCode = '123456';
    // 使用相同的模板生成逻辑
    const template = {
      subject: 'Indicate.Top - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Email Verification Code</h2>
          <p style="color: #666; text-align: center;">Please use the following verification code:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px;">${testCode}</span>
          </div>
          <p style="color: #666; text-align: center; font-size: 14px;">This code expires in 5 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; text-align: center; font-size: 12px;">© 2025 Indicate.Top. All rights reserved.</p>
        </div>
      `
    };

    const result = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(colors.green('✅ 测试邮件发送成功!'));
    console.log(colors.cyan(`📧 邮件ID: ${result.data?.id}`));
    console.log(colors.cyan(`📬 收件人: ${testEmail}`));
    console.log(colors.cyan(`🔢 验证码: ${testCode}`));
    
  } catch (error) {
    console.log(colors.red('❌ 测试邮件发送失败:'));
    console.log(colors.red(`   错误: ${error.message}`));
    
    // 提供常见错误的解决建议
    if (error.message.includes('domain')) {
      console.log(colors.yellow('💡 建议: 检查发送域名是否已验证'));
    } else if (error.message.includes('api_key')) {
      console.log(colors.yellow('💡 建议: 检查 API Key 是否正确'));
    } else if (error.message.includes('rate')) {
      console.log(colors.yellow('💡 建议: 发送频率过高，请稍后重试'));
    }
    return;
  }

  // 5. 测试完成
  console.log(colors.green('\n🎉 Resend 邮件服务测试完成!'));
  console.log(colors.cyan('📋 测试结果总结:'));
  console.log(colors.green('   ✅ 环境变量配置正确'));
  console.log(colors.green('   ✅ Resend API 连接成功'));
  console.log(colors.green('   ✅ 邮件模板生成正常'));
  console.log(colors.green('   ✅ 测试邮件发送成功'));
  
  console.log(colors.blue('\n📧 现在您可以在应用中使用 Resend 发送邮件了!'));
  console.log(colors.yellow('💡 记得检查测试邮箱的收件箱（包括垃圾邮件文件夹）'));
}

// 运行测试
if (require.main === module) {
  testResendConfiguration().catch(error => {
    console.error(colors.red('❌ 测试过程中发生错误:'), error);
    process.exit(1);
  });
}

module.exports = { testResendConfiguration };
