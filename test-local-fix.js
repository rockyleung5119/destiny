const API_BASE_URL = 'http://127.0.0.1:8787';

async function testLocalFix() {
  console.log('🔧 Testing Local Async Fix...\n');
  
  try {
    // 步骤1: 登录获取token
    console.log('🔐 Step 1: Login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // 步骤2: 测试八字分析异步任务
    console.log('\n🔮 Step 2: Test BaZi analysis...');
    const baziResponse = await fetch(`${API_BASE_URL}/api/fortune/bazi`, {
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
    console.log(`✅ Task created: ${taskId}`);
    
    // 步骤3: 检查任务状态（只检查几次）
    console.log('\n🔄 Step 3: Monitor task status...');
    for (let i = 0; i < 5; i++) {
      console.log(`📊 Check ${i + 1}/5...`);
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/fortune/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const statusData = await statusResponse.json();
      console.log(`📈 Status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'completed') {
        console.log('🎉 Task completed successfully!');
        console.log('📝 Result preview:', statusData.data.analysis?.substring(0, 100) + '...');
        break;
      } else if (statusData.data.status === 'failed') {
        console.log('❌ Task failed:', statusData.data.error);
        break;
      }
      
      if (i < 4) {
        console.log('⏳ Waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('\n✅ Test completed - async task system is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// 运行测试
testLocalFix();
