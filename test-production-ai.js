const PROD_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function testProductionAI() {
  console.log('🔮 Testing Production AI Service...\n');
  
  try {
    // 步骤1: 检查AI服务状态
    console.log('🤖 Step 1: Check AI Service Status...');
    const aiStatusResponse = await fetch(`${PROD_API_URL}/api/ai-status`);
    const aiStatusData = await aiStatusResponse.json();
    console.log('📋 AI Status Response:', JSON.stringify(aiStatusData, null, 2));
    
    // 步骤2: 登录获取token
    console.log('\n🔐 Step 2: Login to get token...');
    const loginResponse = await fetch(`${PROD_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📋 Login Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // 步骤3: 启动八字分析异步任务
    console.log('\n🔮 Step 3: Start BaZi analysis async task...');
    const baziResponse = await fetch(`${PROD_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        language: 'zh'
      })
    });
    
    const baziData = await baziResponse.json();
    console.log('📋 BaZi Response:', JSON.stringify(baziData, null, 2));
    
    if (!baziData.success) {
      throw new Error(`BaZi analysis failed: ${baziData.message}`);
    }
    
    const taskId = baziData.data.taskId;
    console.log(`✅ BaZi task created: ${taskId}`);
    
    // 步骤4: 检查任务状态（只检查几次，不等待完成）
    console.log('\n🔄 Step 4: Check task status...');
    for (let i = 0; i < 3; i++) {
      console.log(`📊 Checking attempt ${i + 1}/3...`);
      
      const statusResponse = await fetch(`${PROD_API_URL}/api/fortune/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const statusData = await statusResponse.json();
      console.log(`📈 Status: ${statusData.data.status}`);
      console.log('📋 Full Status Response:', JSON.stringify(statusData, null, 2));
      
      if (statusData.data.status === 'completed') {
        console.log('\n🎉 Task completed successfully!');
        break;
      } else if (statusData.data.status === 'failed') {
        console.log('❌ Task failed:', statusData.data.error);
        break;
      }
      
      if (i < 2) {
        console.log('⏳ Waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📋 Error details:', error);
  }
}

// 运行测试
testProductionAI();
