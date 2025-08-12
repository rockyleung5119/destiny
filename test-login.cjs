const axios = require('axios');

async function testLogin() {
  console.log('🧪 测试用户登录...\n');

  const baseURL = 'http://localhost:3001';
  
  try {
    // 1. 先创建测试用户
    console.log('👤 创建测试用户...');
    const registerData = {
      name: '张三',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      gender: 'male',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 15,
      birthHour: 14
    };

    try {
      const registerResponse = await axios.post(`${baseURL}/api/auth/register`, registerData);
      console.log('✅ 用户注册成功');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ 用户已存在，跳过注册');
      } else {
        console.log('❌ 用户注册失败:', error.response?.data?.message || error.message);
      }
    }

    // 2. 测试登录
    console.log('\n🔐 测试登录...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, loginData);
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const user = loginResponse.data.data.user;
      const token = loginResponse.data.data.token;
      
      console.log('👤 用户信息:');
      console.log(`   ID: ${user.id}`);
      console.log(`   姓名: ${user.name}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   性别: ${user.gender}`);
      console.log(`   出生年: ${user.birth_year}`);
      console.log(`   出生月: ${user.birth_month}`);
      console.log(`   出生日: ${user.birth_day}`);
      console.log(`   出生时: ${user.birth_hour}`);
      
      // 3. 测试获取用户资料
      console.log('\n📋 获取用户资料...');
      const profileResponse = await axios.get(`${baseURL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ 用户资料获取成功');
        const profile = profileResponse.data.data;
        console.log('📝 完整资料:');
        console.log(`   姓名: ${profile.name}`);
        console.log(`   性别: ${profile.gender}`);
        console.log(`   出生地: ${profile.birth_place || '未设置'}`);
        console.log(`   时区: ${profile.timezone || '未设置'}`);
        console.log(`   邮箱验证: ${profile.is_email_verified}`);
      } else {
        console.log('❌ 用户资料获取失败:', profileResponse.data.message);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 运行测试
testLogin();
