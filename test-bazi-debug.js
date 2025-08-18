// 测试BaZi服务调试
const LOCAL_API_URL = 'http://127.0.0.1:8787';

// 测试用户数据 - 包含完整的出生信息（使用正确的字段名）
const testUser = {
  email: 'test-bazi2@example.com',
  password: 'test123456',
  name: 'Test User 2',
  gender: 'male',
  birthYear: 1990,
  birthMonth: 6,
  birthDay: 15,
  birthHour: 14,
  birthMinute: 30,
  birthPlace: 'Beijing'
};

async function testBaziService() {
  console.log('🔮 Testing BaZi Service Debug');
  
  try {
    // 步骤1: 注册用户
    console.log('\n🔐 Step 1: Register test user...');
    const registerResponse = await fetch(`${LOCAL_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      console.log('User may already exist, trying to login...');
    }
    
    // 步骤2: 登录获取token
    console.log('\n🔐 Step 2: Login to get token...');
    const loginResponse = await fetch(`${LOCAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // 步骤3: 测试BaZi分析（中文）
    console.log('\n🔮 Step 3: Testing BaZi Analysis (Chinese)...');
    const baziResponse = await fetch(`${LOCAL_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log('Response status:', baziResponse.status);
    console.log('Response headers:', Object.fromEntries(baziResponse.headers.entries()));
    
    if (!baziResponse.ok) {
      console.error(`❌ BaZi Analysis failed: ${baziResponse.status}`);
      const errorText = await baziResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const baziData = await baziResponse.json();
    console.log('✅ BaZi Analysis success');
    console.log('Response structure:', Object.keys(baziData));
    
    if (baziData.success) {
      console.log('Success:', baziData.success);
      console.log('Message:', baziData.message);
      
      if (baziData.data) {
        console.log('Data keys:', Object.keys(baziData.data));
        console.log('Analysis type:', baziData.data.analysisType);
        console.log('Analysis length:', baziData.data.analysis?.length || 0, 'characters');
        
        if (baziData.data.analysis) {
          console.log('Analysis preview:', baziData.data.analysis.substring(0, 300) + '...');
        }
      }
    } else {
      console.error('❌ Response indicates failure:', baziData.message);
    }
    
    // 步骤4: 测试BaZi分析（英文）
    console.log('\n🔮 Step 4: Testing BaZi Analysis (English)...');
    const baziEnResponse = await fetch(`${LOCAL_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'en' })
    });
    
    console.log('English Response status:', baziEnResponse.status);
    
    if (!baziEnResponse.ok) {
      console.error(`❌ BaZi Analysis (English) failed: ${baziEnResponse.status}`);
      const errorText = await baziEnResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const baziEnData = await baziEnResponse.json();
    console.log('✅ BaZi Analysis (English) success');
    
    if (baziEnData.success && baziEnData.data?.analysis) {
      console.log('English Analysis length:', baziEnData.data.analysis.length, 'characters');
      console.log('English Analysis preview:', baziEnData.data.analysis.substring(0, 300) + '...');
      
      // 检查是否包含中文字符
      const hasChinese = /[\u4e00-\u9fff]/.test(baziEnData.data.analysis);
      console.log('Contains Chinese characters:', hasChinese ? '❌ YES (should be English)' : '✅ NO (correct)');
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testBaziService();
