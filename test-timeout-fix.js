// 测试超时优化修复
const PROD_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testTimeoutFix() {
  console.log('⏱️ Testing Timeout Optimization Fix');
  console.log('🌐 Testing Production Environment:', PROD_API_URL);
  console.log('⏱️ New timeout setting: 300 seconds per request');
  console.log('🔄 Retry strategy: 1 retry with 10 second delay');
  
  try {
    // 步骤1: 登录demo用户
    console.log('\n🔐 Step 1: Login demo user...');
    const loginResponse = await fetch(`${PROD_API_URL}/api/auth/login`, {
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

    // 步骤2: 测试AI服务（重点测试之前经常失败的服务）
    console.log('\n🔮 Step 2: Test AI Services with New Timeout...');
    const services = [
      { 
        name: 'BaZi Analysis (Previously Failed)', 
        endpoint: '/api/fortune/bazi', 
        body: { language: 'zh' },
        expectedTime: '60-180 seconds'
      },
      { 
        name: 'Tarot Reading (Previously Failed)', 
        endpoint: '/api/fortune/tarot', 
        body: { question: '我的事业发展如何？', language: 'zh' },
        expectedTime: '90-240 seconds'
      },
      { 
        name: 'Daily Fortune (Usually Works)', 
        endpoint: '/api/fortune/daily', 
        body: { language: 'zh' },
        expectedTime: '30-90 seconds'
      },
      { 
        name: 'Lucky Items (Usually Works)', 
        endpoint: '/api/fortune/lucky', 
        body: { language: 'zh' },
        expectedTime: '30-90 seconds'
      }
    ];
    
    let successCount = 0;
    let totalTests = services.length;
    
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      console.log(`\n🔮 Testing ${service.name}...`);
      console.log(`⏱️ Expected time: ${service.expectedTime}`);
      
      try {
        const startTime = Date.now();
        console.log(`🚀 Request started at: ${new Date().toLocaleTimeString()}`);
        
        const response = await fetch(`${PROD_API_URL}${service.endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(service.body)
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        const durationSeconds = Math.round(duration / 1000);
        
        console.log(`⏱️ Actual response time: ${durationSeconds} seconds (${duration}ms)`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`🏁 Request completed at: ${new Date().toLocaleTimeString()}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${service.name} failed: ${errorText}`);
          
          // 分析失败原因
          if (response.status === 524) {
            console.error('💡 Analysis: 524 timeout - may need even longer timeout or API is down');
          } else if (response.status >= 500) {
            console.error('💡 Analysis: Server error - API service issue');
          } else {
            console.error('💡 Analysis: Client error - check request format');
          }
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ ${service.name} success: ${data.success}`);
        
        if (data.success && data.data?.analysis) {
          const analysis = data.data.analysis;
          console.log(`📝 Analysis length: ${analysis.length} characters`);
          console.log(`📄 Preview: ${analysis.substring(0, 150)}...`);
          
          // 性能评估
          if (durationSeconds < 60) {
            console.log('🚀 Performance: Excellent (< 1 minute)');
          } else if (durationSeconds < 120) {
            console.log('✅ Performance: Good (1-2 minutes)');
          } else if (durationSeconds < 240) {
            console.log('⚠️ Performance: Acceptable (2-4 minutes)');
          } else {
            console.log('🐌 Performance: Slow (> 4 minutes)');
          }
          
          successCount++;
        } else {
          console.error(`❌ ${service.name} returned success=false or no analysis data`);
          console.error('Response data:', JSON.stringify(data, null, 2));
        }
        
      } catch (serviceError) {
        console.error(`❌ ${service.name} error:`, serviceError.message);
        
        // 分析错误类型
        if (serviceError.name === 'AbortError') {
          console.error('💡 Analysis: Request was aborted - likely timeout');
        } else if (serviceError.message.includes('fetch')) {
          console.error('💡 Analysis: Network error - connection issue');
        } else {
          console.error('💡 Analysis: Unknown error - check logs');
        }
      }
      
      // 添加延迟避免API限制
      if (i < services.length - 1) {
        console.log('⏳ Waiting 15 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
    
    // 步骤3: 总结测试结果
    console.log('\n📊 Timeout Optimization Test Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successful services: ${successCount}/${totalTests}`);
    console.log(`❌ Failed services: ${totalTests - successCount}/${totalTests}`);
    console.log(`📈 Success rate: ${Math.round((successCount / totalTests) * 100)}%`);
    
    if (successCount === totalTests) {
      console.log('🎉 All AI services working with new timeout settings!');
      console.log('✅ 300-second timeout appears to be sufficient');
    } else if (successCount >= totalTests * 0.75) {
      console.log('✅ Most services working - significant improvement');
      console.log('💡 Remaining failures may be due to API instability');
    } else if (successCount > 0) {
      console.log('⚠️ Some improvement but still issues');
      console.log('💡 May need to investigate API service status');
    } else {
      console.log('❌ No improvement - API may be completely down');
      console.log('💡 Check API service status and network connectivity');
    }
    
    console.log('\n🎯 Timeout Optimization Testing Completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testTimeoutFix();
