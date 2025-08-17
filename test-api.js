// 测试API连接的脚本
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔄 测试健康检查API...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData);

    console.log('\n🔄 测试用户资料API...');
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsImlhdCI6MTc1NTQ0MTMzNywiZXhwIjoxNzU1NDQ0OTM3fQ.GIBlNaS3Gj03iMIQjUpzSVM2xNyfMBdWMT0wSk4DlQM';
    
    const profileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 响应状态:', profileResponse.status, profileResponse.statusText);
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ 用户资料:', JSON.stringify(profileData, null, 2));
    } else {
      const errorData = await profileResponse.text();
      console.log('❌ 错误响应:', errorData);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAPI();
