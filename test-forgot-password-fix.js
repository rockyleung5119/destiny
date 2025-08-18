// 测试修复后的忘记密码功能
const API_BASE_URL = 'https://destiny-backend.jerryliang5119.workers.dev';
const TEST_EMAIL = 'demo@example.com';

async function testForgotPasswordFlow() {
  console.log('🧪 测试修复后的忘记密码功能\n');

  try {
    // 步骤1: 发送密码重置验证码
    console.log('📧 步骤1: 发送密码重置验证码...');
    const forgotResponse = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });

    console.log(`📧 响应状态: ${forgotResponse.status}`);
    const forgotData = await forgotResponse.json();
    console.log(`📧 响应数据:`, forgotData);

    if (!forgotData.success) {
      console.log('❌ 发送验证码失败:', forgotData.message);
      return;
    }

    console.log('✅ 验证码发送成功！');
    console.log('\n⚠️  请检查邮箱获取验证码，然后手动测试重置密码功能');
    console.log('📝 测试步骤:');
    console.log('1. 检查邮箱获取6位验证码');
    console.log('2. 在前端页面输入验证码');
    console.log('3. 设置新密码');
    console.log('4. 验证是否能用新密码登录');

    // 步骤2: 模拟重置密码（需要真实验证码）
    console.log('\n🔐 步骤2: 模拟重置密码请求（使用示例验证码）...');
    const resetResponse = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        verificationCode: '123456', // 示例验证码
        newPassword: 'newpassword123'
      })
    });

    console.log(`🔐 重置密码响应状态: ${resetResponse.status}`);
    const resetData = await resetResponse.json();
    console.log(`🔐 重置密码响应:`, resetData);

    if (resetData.success) {
      console.log('✅ 密码重置成功！');
    } else {
      console.log('❌ 密码重置失败（预期的，因为使用了示例验证码）:', resetData.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testForgotPasswordFlow();
