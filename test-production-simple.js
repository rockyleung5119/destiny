// 简单测试生产环境AI服务
const PRODUCTION_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testProduction() {
  console.log('🔮 Testing Production AI Services');
  
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
      console.error(`❌ Login failed: ${loginResponse.status} - ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // 步骤2: 测试BaZi分析
    console.log('\n🔮 Step 2: Testing BaZi Analysis...');
    const baziResponse = await fetch(`${PRODUCTION_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log(`BaZi Status: ${baziResponse.status}`);
    const baziText = await baziResponse.text();
    
    if (!baziResponse.ok) {
      console.error(`❌ BaZi failed: ${baziText}`);
    } else {
      try {
        const baziData = JSON.parse(baziText);
        console.log(`✅ BaZi success: ${baziData.success}`);
        if (!baziData.success) {
          console.error(`❌ BaZi returned error: ${baziData.message}`);
        }
      } catch (e) {
        console.error(`❌ BaZi parse error: ${e.message}`);
      }
    }
    
    console.log('\n⏳ Waiting for logs...');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testProduction();
