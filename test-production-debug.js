// 测试生产环境demo用户的AI占卜服务以触发错误日志
const PRODUCTION_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testProductionDebug() {
  console.log('🔮 Testing Production Demo User to Debug Errors');
  
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
    
    // 步骤2: 测试BaZi分析（最可能出错的服务）
    console.log('\n🔮 Step 2: Testing BaZi Analysis...');
    const baziResponse = await fetch(`${PRODUCTION_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log('BaZi Response Status:', baziResponse.status);
    console.log('BaZi Response Headers:', Object.fromEntries(baziResponse.headers.entries()));
    
    const baziText = await baziResponse.text();
    console.log('BaZi Response Body:', baziText);
    
    if (!baziResponse.ok) {
      console.error(`❌ BaZi Analysis failed: ${baziResponse.status}`);
    } else {
      try {
        const baziData = JSON.parse(baziText);
        console.log('✅ BaZi Analysis response parsed:', baziData.success);
        if (!baziData.success) {
          console.error('❌ BaZi returned success=false:', baziData.message);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse BaZi response as JSON:', parseError.message);
      }
    }
    
    // 等待一下让日志显示
    console.log('\n⏳ Waiting 3 seconds for logs to appear...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 步骤3: 测试每日运势
    console.log('\n🌅 Step 3: Testing Daily Fortune...');
    const dailyResponse = await fetch(`${PRODUCTION_API_URL}/api/fortune/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log('Daily Fortune Status:', dailyResponse.status);
    const dailyText = await dailyResponse.text();
    console.log('Daily Fortune Response:', dailyText.substring(0, 200) + '...');
    
    console.log('\n🎉 Debug test completed! Check the wrangler tail logs for detailed error information.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testProductionDebug();
