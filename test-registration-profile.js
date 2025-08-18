// 测试注册时个人资料信息是否正确保存
const API_BASE_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function testRegistrationWithProfile() {
  console.log('🧪 测试注册时个人资料信息保存\n');

  // 生成测试用户数据
  const testUser = {
    name: 'Test User Profile',
    email: `test-profile-${Date.now()}@example.com`,
    password: 'testpassword123',
    confirmPassword: 'testpassword123',
    gender: 'male',
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 15,
    birthHour: 14,
    birthMinute: 30,
    birthPlace: 'Beijing, China',
    timezone: 'Asia/Shanghai'
  };

  try {
    // 步骤1: 注册新用户
    console.log('📝 步骤1: 注册新用户...');
    console.log('📝 注册数据:', JSON.stringify(testUser, null, 2));
    
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    console.log(`📝 注册响应状态: ${registerResponse.status}`);
    const registerData = await registerResponse.json();
    console.log(`📝 注册响应数据:`, JSON.stringify(registerData, null, 2));

    if (!registerData.success) {
      console.log('❌ 注册失败:', registerData.message);
      return;
    }

    console.log('✅ 注册成功！');
    const token = registerData.token;
    const registeredUser = registerData.user;

    // 验证注册返回的用户信息是否包含个人资料
    console.log('\n🔍 验证注册返回的用户信息:');
    console.log('- 姓名:', registeredUser.name);
    console.log('- 性别:', registeredUser.gender);
    console.log('- 出生年份:', registeredUser.birthYear);
    console.log('- 出生月份:', registeredUser.birthMonth);
    console.log('- 出生日期:', registeredUser.birthDay);
    console.log('- 出生小时:', registeredUser.birthHour);
    console.log('- 出生分钟:', registeredUser.birthMinute);
    console.log('- 出生地点:', registeredUser.birthPlace);
    console.log('- 时区:', registeredUser.timezone);

    // 步骤2: 获取用户资料
    console.log('\n👤 步骤2: 获取用户资料...');
    const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`👤 资料响应状态: ${profileResponse.status}`);
    const profileData = await profileResponse.json();
    console.log(`👤 资料响应数据:`, JSON.stringify(profileData, null, 2));

    if (!profileData.success) {
      console.log('❌ 获取资料失败:', profileData.message);
      return;
    }

    const userProfile = profileData.user;
    console.log('\n🔍 验证数据库中的用户资料:');
    console.log('- 姓名:', userProfile.name);
    console.log('- 性别:', userProfile.gender);
    console.log('- 出生年份:', userProfile.birthYear);
    console.log('- 出生月份:', userProfile.birthMonth);
    console.log('- 出生日期:', userProfile.birthDay);
    console.log('- 出生小时:', userProfile.birthHour);
    console.log('- 出生分钟:', userProfile.birthMinute);
    console.log('- 出生地点:', userProfile.birthPlace);
    console.log('- 时区:', userProfile.timezone);

    // 步骤3: 验证数据完整性
    console.log('\n✅ 步骤3: 验证数据完整性...');
    const checks = [
      { field: 'name', expected: testUser.name, actual: userProfile.name },
      { field: 'gender', expected: testUser.gender, actual: userProfile.gender },
      { field: 'birthYear', expected: testUser.birthYear, actual: userProfile.birthYear },
      { field: 'birthMonth', expected: testUser.birthMonth, actual: userProfile.birthMonth },
      { field: 'birthDay', expected: testUser.birthDay, actual: userProfile.birthDay },
      { field: 'birthHour', expected: testUser.birthHour, actual: userProfile.birthHour },
      { field: 'birthMinute', expected: testUser.birthMinute, actual: userProfile.birthMinute },
      { field: 'birthPlace', expected: testUser.birthPlace, actual: userProfile.birthPlace },
      { field: 'timezone', expected: testUser.timezone, actual: userProfile.timezone }
    ];

    let allPassed = true;
    for (const check of checks) {
      const passed = check.expected === check.actual;
      console.log(`${passed ? '✅' : '❌'} ${check.field}: 期望 "${check.expected}", 实际 "${check.actual}"`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 所有个人资料字段都正确保存到数据库！');
      console.log('🔧 修复成功：注册时的个人资料信息现在可以正确保存和显示了。');
    } else {
      console.log('\n❌ 部分个人资料字段保存失败，需要进一步检查。');
    }

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testRegistrationWithProfile();
