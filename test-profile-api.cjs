const axios = require('axios');

async function testProfileAPI() {
  try {
    console.log('Testing profile API...');
    
    // 1. 先登录获取token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // 2. 获取用户资料
    console.log('2. Getting user profile...');
    const profileResponse = await axios.get('http://localhost:3001/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile API response:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProfileAPI();
