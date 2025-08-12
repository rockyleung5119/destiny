const axios = require('axios');

async function testLanguageEndpoint() {
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
  
  // 测试中文语言检测
  console.log('\n🌟 测试中文语言检测...');
  try {
    const response = await axios.get(`${baseURL}/api/fortune/test-language`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Language': 'zh',
        'Accept-Language': 'zh-CN'
      }
    });
    
    console.log('📝 中文检测结果:', response.data);
    
  } catch (error) {
    console.error('❌ 中文检测出错:', error.response?.data || error.message);
  }
  
  // 测试英文语言检测
  console.log('\n🌟 测试英文语言检测...');
  try {
    const response = await axios.get(`${baseURL}/api/fortune/test-language`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Language': 'en',
        'Accept-Language': 'en-US'
      }
    });
    
    console.log('📝 英文检测结果:', response.data);
    
  } catch (error) {
    console.error('❌ 英文检测出错:', error.response?.data || error.message);
  }
}

testLanguageEndpoint().catch(console.error);
