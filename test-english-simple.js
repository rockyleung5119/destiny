// 简单测试英文AI占卜服务
const LOCAL_API_URL = 'http://127.0.0.1:8787';

// 测试用户数据
const testUser = {
  email: 'test-en2@example.com',
  password: 'test123456',
  name: 'Jane Doe',
  gender: 'female',
  birth_year: 1992,
  birth_month: 9,
  birth_day: 15,
  birth_hour: 9,
  birth_place: 'Los Angeles'
};

async function testEnglishSimple() {
  console.log('🔮 Testing English AI Fortune Services (Simple)');
  
  try {
    // 注册和登录
    console.log('\n🔐 Registering and logging in...');
    
    await fetch(`${LOCAL_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const loginResponse = await fetch(`${LOCAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // 测试每日运势（英文）
    console.log('\n🌅 Testing Daily Fortune (English)...');
    const dailyResponse = await fetch(`${LOCAL_API_URL}/api/fortune/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'en' })
    });
    
    if (dailyResponse.ok) {
      const dailyData = await dailyResponse.json();
      console.log('✅ Daily Fortune success');
      console.log('Analysis length:', dailyData.data?.analysis?.length || 0, 'characters');
      
      if (dailyData.data?.analysis) {
        const analysis = dailyData.data.analysis;
        console.log('Analysis preview:', analysis.substring(0, 200) + '...');
        
        // 检查是否包含中文字符
        const hasChinese = /[\u4e00-\u9fff]/.test(analysis);
        console.log('Language check:', hasChinese ? '❌ Contains Chinese (should be English)' : '✅ English only (correct)');
        
        // 检查是否包含英文结构
        const hasEnglishStructure = /## 🌅 Overall Fortune|## 💼 Career & Work|## 💰 Financial Fortune/.test(analysis);
        console.log('Structure check:', hasEnglishStructure ? '✅ English structure found' : '❌ English structure missing');
      }
    } else {
      console.error('❌ Daily Fortune failed:', dailyResponse.status);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testEnglishSimple();
