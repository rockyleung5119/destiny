const axios = require('axios');

async function testTarotMultilang() {
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
  
  // 测试英文塔罗占卜
  console.log('\n🔮 测试英文塔罗占卜...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/tarot`, {
      question: "What should I focus on in my career?"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'en'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 英文塔罗占卜成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前150个字符:', analysis.substring(0, 150));
      
      const hasEnglishFeatures = analysis.includes("Celestial Tarot") || 
                                analysis.includes("Tarot Reading") ||
                                analysis.includes("Drawn Tarot Cards");
      const hasChinese = /[\u4e00-\u9fff]/.test(analysis.substring(0, 500));
      
      console.log(`🔍 英文塔罗特征: ${hasEnglishFeatures}, 包含中文: ${hasChinese}`);
      
      if (hasEnglishFeatures && !hasChinese) {
        console.log('🎉 英文塔罗占卜正确！');
      } else {
        console.log('⚠️ 英文塔罗占卜可能有问题');
      }
    } else {
      console.log('❌ 英文塔罗占卜失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 英文塔罗占卜出错:', error.response?.data || error.message);
  }
  
  // 等待一秒避免限流
  await new Promise(resolve => setTimeout(resolve, 1000));
  
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
      console.log('📝 前150个字符:', analysis.substring(0, 150));
      
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

testTarotMultilang().catch(console.error);
