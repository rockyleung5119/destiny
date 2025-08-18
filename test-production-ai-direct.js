// 直接测试生产环境AI服务配置
const PROD_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function testProductionAIDirect() {
  console.log('🔍 Testing Production AI Service Configuration...\n');
  
  try {
    // 步骤1: 检查健康状态
    console.log('🏥 Step 1: Check API Health...');
    const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData.status);
    console.log('📊 Environment:', healthData.environment);
    console.log('💾 Database:', healthData.database);

    // 步骤2: 检查AI服务状态
    console.log('\n🤖 Step 2: Check AI Service Status...');
    try {
      const aiStatusResponse = await fetch(`${PROD_API_URL}/api/ai-status`);
      if (aiStatusResponse.ok) {
        const aiStatusData = await aiStatusResponse.json();
        console.log('📋 AI Status Response:', JSON.stringify(aiStatusData, null, 2));
      } else {
        console.log('❌ AI Status endpoint returned:', aiStatusResponse.status, aiStatusResponse.statusText);
      }
    } catch (error) {
      console.log('❌ AI Status endpoint error:', error.message);
    }

    // 步骤3: 登录获取token
    console.log('\n🔐 Step 3: Login to get token...');
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
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');

    // 步骤4: 启动一个简单的八字分析任务
    console.log('\n🔮 Step 4: Start BaZi analysis task...');
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
    console.log(`✅ Task created: ${taskId}`);

    // 步骤5: 立即检查任务状态
    console.log('\n📊 Step 5: Check initial task status...');
    const statusResponse = await fetch(`${PROD_API_URL}/api/fortune/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const statusData = await statusResponse.json();
    console.log('📈 Initial Status:', statusData.data.status);
    console.log('📋 Full Status Response:', JSON.stringify(statusData, null, 2));

    // 步骤6: 监控任务状态直到完成
    console.log('\n⏳ Step 6: Monitor task until completion (up to 5 minutes)...');
    const maxChecks = 50; // 50次检查 x 6秒 = 5分钟
    let finalStatus = statusData.data.status;
    let completed = false;

    for (let i = 0; i < maxChecks; i++) {
      console.log(`📊 Check ${i + 1}/${maxChecks} (${(i * 6)}s elapsed)...`);

      const statusResponse2 = await fetch(`${PROD_API_URL}/api/fortune/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const statusData2 = await statusResponse2.json();
      finalStatus = statusData2.data.status;
      console.log(`📈 Status: ${finalStatus}`);

      if (finalStatus === 'completed') {
        console.log('🎉 Task completed successfully!');
        console.log('📝 Result preview:', statusData2.data.analysis?.substring(0, 200) + '...');
        completed = true;
        break;
      } else if (finalStatus === 'failed') {
        console.log('❌ Task failed:', statusData2.data.error);
        completed = true;
        break;
      }

      if (i < maxChecks - 1) {
        console.log('⏳ Waiting 6 seconds...');
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }

    console.log('\n📝 Summary:');
    console.log(`- Task ID: ${taskId}`);
    console.log(`- Initial Status: ${statusData.data.status}`);
    console.log(`- Final Status: ${finalStatus}`);
    console.log(`- Completed: ${completed ? 'Yes' : 'No (timeout after 5 minutes)'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📋 Error details:', error);
  }
}

// 运行测试
testProductionAIDirect();
