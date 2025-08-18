const API_BASE_URL = 'http://127.0.0.1:8787';

async function testAsyncBaziAnalysis() {
  console.log('🔮 Testing Async BaZi Analysis Fix...\n');
  
  try {
    // 步骤1: 登录获取token
    console.log('🔐 Step 1: Login to get token...');
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
    console.log('📋 Login Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    const token = loginData.token;
    if (!token) {
      throw new Error('No token received from login');
    }
    console.log('✅ Login successful');
    
    // 步骤2: 启动八字分析异步任务
    console.log('\n🔮 Step 2: Start BaZi analysis async task...');
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
    console.log(`✅ BaZi task created: ${taskId}`);
    console.log(`⏱️ Estimated time: ${baziData.data.estimatedTime}`);
    
    // 步骤3: 轮询任务状态
    console.log('\n🔄 Step 3: Polling task status...');
    let attempts = 0;
    const maxAttempts = 60; // 5分钟
    
    while (attempts < maxAttempts) {
      console.log(`📊 Polling attempt ${attempts + 1}/${maxAttempts}...`);
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/fortune/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const statusData = await statusResponse.json();
      console.log(`📈 Status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'completed') {
        console.log('\n🎉 Task completed successfully!');
        console.log('📝 Analysis result preview:');
        const analysis = statusData.data.analysis;
        if (analysis) {
          // 显示前200个字符
          console.log(analysis.substring(0, 200) + '...');
          console.log(`\n📏 Full analysis length: ${analysis.length} characters`);
          
          // 检查是否包含AI分析内容
          if (analysis.includes('八字') || analysis.includes('命理') || analysis.includes('五行')) {
            console.log('✅ Analysis contains proper BaZi content');
          } else {
            console.log('⚠️ Analysis might not contain proper BaZi content');
          }
        }
        break;
      } else if (statusData.data.status === 'failed') {
        console.log('❌ Task failed:', statusData.data.error);
        break;
      } else {
        console.log(`⏳ Task status: ${statusData.data.status}, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Timeout: Task did not complete within 5 minutes');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📋 Error details:', error);
  }
}

// 运行测试
testAsyncBaziAnalysis();
