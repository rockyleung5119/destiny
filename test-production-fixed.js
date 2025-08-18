// 测试修复后的生产环境demo用户AI占卜服务
const PRODUCTION_API_URL = 'https://destiny-backend.liangdemo.workers.dev';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testProductionFixed() {
  console.log('🔮 Testing Fixed Production Demo User AI Fortune Services');
  
  try {
    // 步骤1: 登录demo用户
    console.log('\n🔐 Step 1: Login demo user...');
    const loginResponse = await fetch(`${PRODUCTION_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(demoUser)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // 测试所有4个服务
    const services = [
      { name: 'Daily Fortune', endpoint: '/api/fortune/daily', body: { language: 'zh' } },
      { name: 'Lucky Items', endpoint: '/api/fortune/lucky', body: { language: 'zh' } },
      { name: 'Tarot Reading', endpoint: '/api/fortune/tarot', body: { question: '我的事业发展如何？', language: 'zh' } },
      { name: 'BaZi Analysis', endpoint: '/api/fortune/bazi', body: { language: 'zh' } }
    ];
    
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      console.log(`\n🔮 Step ${i + 2}: Testing ${service.name}...`);
      
      try {
        const response = await fetch(`${PRODUCTION_API_URL}${service.endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(service.body)
        });
        
        console.log(`${service.name} Status:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${service.name} failed:`, errorText);
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ ${service.name} success:`, data.success);
        
        if (data.success && data.data?.analysis) {
          console.log(`Analysis length: ${data.data.analysis.length} characters`);
          console.log(`Analysis preview: ${data.data.analysis.substring(0, 150)}...`);
        } else {
          console.error(`❌ ${service.name} returned success=false or no analysis data`);
          console.error('Response data:', JSON.stringify(data, null, 2));
        }
        
      } catch (serviceError) {
        console.error(`❌ ${service.name} error:`, serviceError.message);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testProductionFixed();
