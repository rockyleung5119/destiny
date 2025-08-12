const axios = require('axios');

async function testDebug() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔐 登录测试用户...');
  const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (!loginResponse.data.success) {
    console.log('❌ 登录失败');
    return;
  }
  
  const token = loginResponse.data.token;
  console.log('✅ 登录成功');
  
  // 测试中文每日运势
  console.log('\n🌟 测试中文每日运势...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/daily`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'zh'
      }
    });
    
    console.log('📝 响应状态:', response.status);
    console.log('📝 响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ 请求出错:', error.response?.data || error.message);
  }
}

testDebug().catch(console.error);
