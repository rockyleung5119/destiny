// 测试生产环境demo用户的AI占卜服务
const PRODUCTION_API_URL = 'https://destiny-backend.liangdemo.workers.dev';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testProductionDemo() {
  console.log('🔮 Testing Production Demo User AI Fortune Services');
  
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
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // 步骤2: 测试每日运势
    console.log('\n🌅 Step 2: Testing Daily Fortune...');
    const dailyResponse = await fetch(`${PRODUCTION_API_URL}/api/fortune/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log('Daily Fortune Status:', dailyResponse.status);
    if (!dailyResponse.ok) {
      const errorText = await dailyResponse.text();
      console.error('❌ Daily Fortune failed:', errorText);
    } else {
      const dailyData = await dailyResponse.json();
      console.log('✅ Daily Fortune success:', dailyData.success);
      if (dailyData.data?.analysis) {
        console.log('Analysis length:', dailyData.data.analysis.length, 'characters');
      }
    }
    
    // 步骤3: 测试幸运物品
    console.log('\n🍀 Step 3: Testing Lucky Items...');
    const luckyResponse = await fetch(`${PRODUCTION_API_URL}/api/fortune/lucky`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log('Lucky Items Status:', luckyResponse.status);
    if (!luckyResponse.ok) {
      const errorText = await luckyResponse.text();
      console.error('❌ Lucky Items failed:', errorText);
    } else {
      const luckyData = await luckyResponse.json();
      console.log('✅ Lucky Items success:', luckyData.success);
      if (luckyData.data?.analysis) {
        console.log('Analysis length:', luckyData.data.analysis.length, 'characters');
      }
    }
    
    // 步骤4: 测试塔罗占卜
    console.log('\n🃏 Step 4: Testing Tarot Reading...');
    const tarotResponse = await fetch(`${PRODUCTION_API_URL}/api/fortune/tarot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: '我的事业发展如何？', language: 'zh' })
    });
    
    console.log('Tarot Reading Status:', tarotResponse.status);
    if (!tarotResponse.ok) {
      const errorText = await tarotResponse.text();
      console.error('❌ Tarot Reading failed:', errorText);
    } else {
      const tarotData = await tarotResponse.json();
      console.log('✅ Tarot Reading success:', tarotData.success);
      if (tarotData.data?.analysis) {
        console.log('Analysis length:', tarotData.data.analysis.length, 'characters');
      }
    }
    
    // 步骤5: 测试八字精算
    console.log('\n🔮 Step 5: Testing BaZi Analysis...');
    const baziResponse = await fetch(`${PRODUCTION_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log('BaZi Analysis Status:', baziResponse.status);
    if (!baziResponse.ok) {
      const errorText = await baziResponse.text();
      console.error('❌ BaZi Analysis failed:', errorText);
    } else {
      const baziData = await baziResponse.json();
      console.log('✅ BaZi Analysis success:', baziData.success);
      if (baziData.data?.analysis) {
        console.log('Analysis length:', baziData.data.analysis.length, 'characters');
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testProductionDemo();
