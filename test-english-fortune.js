// 测试英文AI占卜服务
const LOCAL_API_URL = 'http://127.0.0.1:8787';

// 测试用户数据
const testUser = {
  email: 'test-en@example.com',
  password: 'test123456',
  name: 'John Smith',
  gender: 'male',
  birth_year: 1990,
  birth_month: 6,
  birth_day: 15,
  birth_hour: 14,
  birth_place: 'New York'
};

async function testEnglishFortuneServices() {
  console.log('🔮 Testing English AI Fortune Services');
  
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
    
    // 步骤3: 测试每日运势（英文）
    console.log('\n🌅 Step 3: Testing Daily Fortune (English)...');
    const dailyResponse = await fetch(`${LOCAL_API_URL}/api/fortune/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'en' })
    });
    
    if (!dailyResponse.ok) {
      console.error(`❌ Daily Fortune failed: ${dailyResponse.status}`);
      const errorText = await dailyResponse.text();
      console.error('Error details:', errorText);
    } else {
      const dailyData = await dailyResponse.json();
      console.log('✅ Daily Fortune success');
      console.log('Analysis length:', dailyData.data?.analysis?.length || 0, 'characters');
      if (dailyData.data?.analysis) {
        console.log('Analysis preview:', dailyData.data.analysis.substring(0, 300) + '...');
        // 检查是否包含中文字符
        const hasChinese = /[\u4e00-\u9fff]/.test(dailyData.data.analysis);
        console.log('Contains Chinese characters:', hasChinese ? '❌ YES (should be English)' : '✅ NO (correct)');
      }
    }
    
    // 步骤4: 测试幸运物品（英文）
    console.log('\n🍀 Step 4: Testing Lucky Items (English)...');
    const luckyResponse = await fetch(`${LOCAL_API_URL}/api/fortune/lucky`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'en' })
    });
    
    if (!luckyResponse.ok) {
      console.error(`❌ Lucky Items failed: ${luckyResponse.status}`);
      const errorText = await luckyResponse.text();
      console.error('Error details:', errorText);
    } else {
      const luckyData = await luckyResponse.json();
      console.log('✅ Lucky Items success');
      console.log('Analysis length:', luckyData.data?.analysis?.length || 0, 'characters');
      if (luckyData.data?.analysis) {
        console.log('Analysis preview:', luckyData.data.analysis.substring(0, 300) + '...');
        // 检查是否包含中文字符
        const hasChinese = /[\u4e00-\u9fff]/.test(luckyData.data.analysis);
        console.log('Contains Chinese characters:', hasChinese ? '❌ YES (should be English)' : '✅ NO (correct)');
      }
    }
    
    // 步骤5: 测试塔罗占卜（英文）
    console.log('\n🃏 Step 5: Testing Tarot Reading (English)...');
    const tarotResponse = await fetch(`${LOCAL_API_URL}/api/fortune/tarot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: 'What about my career development?', language: 'en' })
    });
    
    if (!tarotResponse.ok) {
      console.error(`❌ Tarot Reading failed: ${tarotResponse.status}`);
      const errorText = await tarotResponse.text();
      console.error('Error details:', errorText);
    } else {
      const tarotData = await tarotResponse.json();
      console.log('✅ Tarot Reading success');
      console.log('Analysis length:', tarotData.data?.analysis?.length || 0, 'characters');
      if (tarotData.data?.analysis) {
        console.log('Analysis preview:', tarotData.data.analysis.substring(0, 300) + '...');
        // 检查是否包含中文字符
        const hasChinese = /[\u4e00-\u9fff]/.test(tarotData.data.analysis);
        console.log('Contains Chinese characters:', hasChinese ? '❌ YES (should be English)' : '✅ NO (correct)');
      }
    }
    
    // 步骤6: 测试八字精算（英文）
    console.log('\n🔮 Step 6: Testing BaZi Analysis (English)...');
    const baziResponse = await fetch(`${LOCAL_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'en' })
    });
    
    if (!baziResponse.ok) {
      console.error(`❌ BaZi Analysis failed: ${baziResponse.status}`);
      const errorText = await baziResponse.text();
      console.error('Error details:', errorText);
    } else {
      const baziData = await baziResponse.json();
      console.log('✅ BaZi Analysis success');
      console.log('Analysis length:', baziData.data?.analysis?.length || 0, 'characters');
      if (baziData.data?.analysis) {
        console.log('Analysis preview:', baziData.data.analysis.substring(0, 300) + '...');
        // 检查是否包含中文字符
        const hasChinese = /[\u4e00-\u9fff]/.test(baziData.data.analysis);
        console.log('Contains Chinese characters:', hasChinese ? '❌ YES (should be English)' : '✅ NO (correct)');
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testEnglishFortuneServices();
