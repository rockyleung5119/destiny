// 最终修复验证测试
const PROD_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testFinalFix() {
  console.log('🔧 Testing Final Fix for AI Services');
  console.log('🌐 Testing Production Environment:', PROD_API_URL);
  
  try {
    // 步骤1: 检查API健康状态
    console.log('\n🏥 Step 1: Check API Health...');
    const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData.status);
    console.log('📊 Environment:', healthData.environment);
    console.log('💾 Database:', healthData.database);

    // 步骤2: 检查AI服务状态
    console.log('\n🤖 Step 2: Check AI Service Status...');
    const aiStatusResponse = await fetch(`${PROD_API_URL}/api/ai-status`);
    const aiStatusData = await aiStatusResponse.json();
    console.log('🔮 AI Service Status:', aiStatusData.status);
    console.log('🌐 AI Endpoint:', aiStatusData.endpoint);
    console.log('🤖 AI Model:', aiStatusData.model);

    // 步骤3: 登录demo用户
    console.log('\n🔐 Step 3: Login demo user...');
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
    
    // 验证返回的用户数据字段
    console.log('🔍 Checking login response fields...');
    const user = loginData.user;
    const expectedFields = ['birth_year', 'birth_month', 'birth_day', 'birth_hour', 'birth_minute', 'birth_place'];
    
    let fieldErrors = 0;
    for (const field of expectedFields) {
      if (user[field] !== undefined) {
        console.log(`✅ Field ${field}: ${user[field]}`);
      } else {
        console.log(`❌ Missing field: ${field}`);
        fieldErrors++;
      }
    }
    
    if (fieldErrors === 0) {
      console.log('✅ All fields present with correct naming');
    } else {
      console.log(`❌ ${fieldErrors} field naming issues found`);
    }

    // 步骤4: 测试所有AI服务
    console.log('\n🔮 Step 4: Test All AI Services...');
    const services = [
      { 
        name: 'BaZi Analysis', 
        endpoint: '/api/fortune/bazi', 
        body: { language: 'en' }
      },
      { 
        name: 'Daily Fortune', 
        endpoint: '/api/fortune/daily', 
        body: { language: 'en' }
      },
      { 
        name: 'Tarot Reading', 
        endpoint: '/api/fortune/tarot', 
        body: { question: 'How will my career develop?', language: 'en' }
      },
      { 
        name: 'Lucky Items', 
        endpoint: '/api/fortune/lucky', 
        body: { language: 'en' }
      }
    ];
    
    let successCount = 0;
    let totalTests = services.length;
    
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      console.log(`\n🔮 Testing ${service.name}...`);
      
      try {
        const startTime = Date.now();
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
        
        console.log(`⏱️ Response time: ${duration}ms`);
        console.log(`📊 Status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${service.name} failed: ${errorText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ ${service.name} success: ${data.success}`);
        
        if (data.success && data.data?.analysis) {
          const analysis = data.data.analysis;
          console.log(`📝 Analysis length: ${analysis.length} characters`);
          console.log(`📄 Preview: ${analysis.substring(0, 100)}...`);
          
          // 语言检查
          const chineseChars = analysis.match(/[\u4e00-\u9fa5]/g);
          const englishWords = analysis.match(/[a-zA-Z]+/g);
          const chineseCount = chineseChars ? chineseChars.length : 0;
          const englishWordCount = englishWords ? englishWords.length : 0;
          
          if (englishWordCount > chineseCount) {
            console.log('✅ Language check: English content (correct)');
          } else {
            console.log('❌ Language check: Expected English but got Chinese');
          }
          
          successCount++;
        } else {
          console.error(`❌ ${service.name} returned success=false or no analysis data`);
          console.error('Response data:', JSON.stringify(data, null, 2));
        }
        
      } catch (serviceError) {
        console.error(`❌ ${service.name} error:`, serviceError.message);
      }
      
      // 添加延迟避免API限制
      if (i < services.length - 1) {
        console.log('⏳ Waiting 5 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // 步骤5: 总结测试结果
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successful services: ${successCount}/${totalTests}`);
    console.log(`❌ Failed services: ${totalTests - successCount}/${totalTests}`);
    console.log(`📈 Success rate: ${Math.round((successCount / totalTests) * 100)}%`);
    
    if (successCount === totalTests) {
      console.log('🎉 All AI services are working correctly!');
    } else if (successCount > 0) {
      console.log('⚠️ Some services are working, API may be unstable');
    } else {
      console.log('❌ All services failed, check API status');
    }
    
    console.log('\n🎯 Final Fix Testing Completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testFinalFix();
