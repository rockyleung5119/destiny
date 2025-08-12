const axios = require('axios');

async function testEnglishAnalysis() {
  const baseURL = 'http://localhost:3001';
  
  // 测试用户登录
  console.log('🔐 Testing user login...');
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // 测试英文八字分析
      console.log('\n📊 Testing BaZi analysis in English...');
      const baziResponse = await axios.post(`${baseURL}/api/fortune/bazi`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
          'X-Language': 'en'
        }
      });
      
      if (baziResponse.data.success) {
        console.log('✅ BaZi analysis successful');
        console.log('📝 Analysis preview:');
        const analysis = baziResponse.data.data.analysis || baziResponse.data.data;
        console.log(analysis.substring(0, 300) + '...');
        
        // 检查是否包含英文内容
        const hasEnglish = /[a-zA-Z]/.test(analysis);
        const hasChinese = /[\u4e00-\u9fff]/.test(analysis);
        console.log(`🔍 Language detection: English=${hasEnglish}, Chinese=${hasChinese}`);
      } else {
        console.log('❌ BaZi analysis failed:', baziResponse.data.message);
      }
      
      // 测试英文每日运势
      console.log('\n🌟 Testing daily fortune in English...');
      const dailyResponse = await axios.post(`${baseURL}/api/fortune/daily`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
          'X-Language': 'en'
        }
      });
      
      if (dailyResponse.data.success) {
        console.log('✅ Daily fortune successful');
        console.log('📝 Fortune preview:');
        const analysis = dailyResponse.data.data.analysis || dailyResponse.data.data;
        console.log(analysis.substring(0, 300) + '...');
        
        // 检查是否包含英文内容
        const hasEnglish = /[a-zA-Z]/.test(analysis);
        const hasChinese = /[\u4e00-\u9fff]/.test(analysis);
        console.log(`🔍 Language detection: English=${hasEnglish}, Chinese=${hasChinese}`);
      } else {
        console.log('❌ Daily fortune failed:', dailyResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// 运行测试
testEnglishAnalysis().then(() => {
  console.log('\n🎉 Test completed');
}).catch(error => {
  console.error('💥 Test error:', error);
});
