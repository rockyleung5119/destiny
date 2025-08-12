// 测试算命API功能
const axios = require('./backend/node_modules/axios').default;

const BASE_URL = 'http://localhost:3001/api';

// 测试用户数据
const testUser = {
  name: '张三',
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  gender: 'male',
  birthYear: 1990,
  birthMonth: 5,
  birthDay: 15,
  birthHour: 10
};

let authToken = '';

async function registerAndLogin() {
  try {
    console.log('📝 注册测试用户...');
    
    // 注册用户
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (registerResponse.data.success) {
      authToken = registerResponse.data.token;
      console.log('✅ 用户注册成功');
      console.log('🔑 获得认证令牌');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  用户已存在，尝试登录...');
      
      // 用户已存在，尝试登录
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        
        if (loginResponse.data.success) {
          authToken = loginResponse.data.token;
          console.log('✅ 用户登录成功');
          console.log('🔑 获得认证令牌');
          return true;
        }
      } catch (loginError) {
        console.error('❌ 登录失败:', loginError.response?.data || loginError.message);
        return false;
      }
    } else {
      console.error('❌ 注册失败:', error.response?.data || error.message);
      return false;
    }
  }
  return false;
}

async function testFortuneAPI(endpoint, name, data = {}) {
  try {
    console.log(`\n🔮 测试${name}...`);
    
    const response = await axios.post(`${BASE_URL}/fortune/${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept-Language': 'zh',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log(`✅ ${name}测试成功`);
      console.log('📊 分析结果预览:');
      const preview = response.data.data.analysis.substring(0, 200) + '...';
      console.log(preview);
      console.log(`📅 生成时间: ${response.data.data.timestamp}`);
      return true;
    } else {
      console.log(`❌ ${name}测试失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${name}测试出错:`, error.response?.data || error.message);
    return false;
  }
}

async function testMembershipStatus() {
  try {
    console.log('\n👑 测试会员状态查询...');
    
    const response = await axios.get(`${BASE_URL}/membership/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ 会员状态查询成功');
      console.log('📋 会员信息:', {
        plan: response.data.data.plan,
        isActive: response.data.data.isActive,
        features: response.data.data.features
      });
      return true;
    } else {
      console.log('❌ 会员状态查询失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 会员状态查询出错:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 开始测试DeepSeek算命API功能...\n');
  
  // 1. 注册/登录用户
  const loginSuccess = await registerAndLogin();
  if (!loginSuccess) {
    console.error('❌ 无法获得认证，测试终止');
    return;
  }
  
  // 2. 测试会员状态
  await testMembershipStatus();
  
  // 3. 测试各种算命功能
  const tests = [
    { endpoint: 'bazi', name: '八字精算' },
    { endpoint: 'daily', name: '每日运势' },
    { endpoint: 'tarot', name: '天体塔罗占卜', data: { question: '我的事业发展如何？' } },
    { endpoint: 'lucky-items', name: '幸运物品推荐' }
  ];
  
  let successCount = 0;
  for (const test of tests) {
    const success = await testFortuneAPI(test.endpoint, test.name, test.data);
    if (success) successCount++;
    
    // 等待一秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 测试总结:');
  console.log(`✅ 成功: ${successCount}/${tests.length} 个算命功能`);
  console.log('🎉 DeepSeek算命API测试完成!');
  
  if (successCount === tests.length) {
    console.log('\n🌟 所有功能测试通过，系统运行正常！');
    console.log('💡 提示: 当前使用模拟响应模式，实际部署时请确保API密钥有足够余额');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试过程中发生错误:', error);
});
