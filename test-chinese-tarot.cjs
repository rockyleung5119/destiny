const axios = require('axios');

async function testChineseTarot() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔐 登录测试用户...');
  const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (!loginResponse.data.success) {
    console.log('❌ 登录失败');
    return;
  }
  
  const token = loginResponse.data.token;
  console.log('✅ 登录成功');
  
  // 测试中文塔罗占卜
  console.log('\n🔮 测试中文塔罗占卜...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/tarot`, {
      question: "我在事业上应该关注什么？"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'zh'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 中文塔罗占卜成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前200个字符:', analysis.substring(0, 200));
      
      const hasChineseFeatures = analysis.includes("天体塔罗") || 
                                analysis.includes("塔罗占卜") ||
                                analysis.includes("抽取的塔罗牌");
      const hasEnglish = /[a-zA-Z]{10,}/.test(analysis.substring(0, 500));
      
      console.log(`🔍 中文塔罗特征: ${hasChineseFeatures}, 包含英文: ${hasEnglish}`);
      
      if (hasChineseFeatures && !hasEnglish) {
        console.log('🎉 中文塔罗占卜正确！');
      } else {
        console.log('⚠️ 中文塔罗占卜可能有问题');
      }
    } else {
      console.log('❌ 中文塔罗占卜失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 中文塔罗占卜出错:', error.response?.data || error.message);
  }
}

testChineseTarot().catch(console.error);
