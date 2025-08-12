// 专门测试会员状态API
const axios = require('./backend/node_modules/axios').default;

const BASE_URL = 'http://localhost:3001/api';

async function testMembershipAPI() {
  try {
    console.log('🔐 登录获取token...');
    
    // 登录获取token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ 登录成功，获得token');
    
    // 测试会员状态API
    console.log('\n👑 测试会员状态API...');
    const membershipResponse = await axios.get(`${BASE_URL}/membership/status`, { headers });
    
    console.log('📊 API响应状态:', membershipResponse.status);
    console.log('🔍 完整响应数据:');
    console.log(JSON.stringify(membershipResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testMembershipAPI();
