const axios = require('axios');

async function testLanguageDetection() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔐 测试用户登录...');
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      
      // 测试中文每日运势
      console.log('\n🌟 测试中文每日运势...');
      const chineseResponse = await axios.post(`${baseURL}/api/fortune/daily`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'zh',
          'X-Language': 'zh'
        }
      });
      
      if (chineseResponse.data.success) {
        console.log('✅ 中文每日运势成功');
        const analysis = chineseResponse.data.data.analysis || chineseResponse.data.data;
        console.log('📝 分析结果预览:');
        console.log(analysis.substring(0, 200) + '...');
        
        const hasEnglish = /[a-zA-Z]/.test(analysis);
        const hasChinese = /[\u4e00-\u9fff]/.test(analysis);
        console.log(`🔍 语言检测: 英文=${hasEnglish}, 中文=${hasChinese}`);
      }
      
      // 等待一秒避免限流
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 测试英文每日运势
      console.log('\n🌟 测试英文每日运势...');
      const englishResponse = await axios.post(`${baseURL}/api/fortune/daily`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
          'X-Language': 'en'
        }
      });
      
      if (englishResponse.data.success) {
        console.log('✅ 英文每日运势成功');
        const analysis = englishResponse.data.data.analysis || englishResponse.data.data;
        console.log('📝 分析结果预览:');
        console.log(analysis.substring(0, 200) + '...');
        
        const hasEnglish = /[a-zA-Z]/.test(analysis);
        const hasChinese = /[\u4e00-\u9fff]/.test(analysis);
        console.log(`🔍 语言检测: 英文=${hasEnglish}, 中文=${hasChinese}`);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testLanguageDetection().then(() => {
  console.log('\n🎉 测试完成');
}).catch(error => {
  console.error('💥 测试出错:', error);
});
