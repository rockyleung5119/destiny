const axios = require('axios');

async function testLuckyItemsMultilang() {
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
  
  // 测试英文幸运物品
  console.log('\n🍀 测试英文幸运物品...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/lucky-items`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'en'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 英文幸运物品成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前150个字符:', analysis.substring(0, 150));
      
      const hasEnglishFeatures = analysis.includes("Lucky Items") || 
                                analysis.includes("Color Recommendations") ||
                                analysis.includes("Five Elements");
      const hasChinese = /[\u4e00-\u9fff]/.test(analysis.substring(0, 500));
      
      console.log(`🔍 英文幸运物品特征: ${hasEnglishFeatures}, 包含中文: ${hasChinese}`);
      
      if (hasEnglishFeatures && !hasChinese) {
        console.log('🎉 英文幸运物品正确！');
      } else {
        console.log('⚠️ 英文幸运物品可能有问题');
      }
    } else {
      console.log('❌ 英文幸运物品失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 英文幸运物品出错:', error.response?.data || error.message);
  }
  
  // 等待一秒避免限流
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试中文幸运物品
  console.log('\n🍀 测试中文幸运物品...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/lucky-items`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'zh'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 中文幸运物品成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前150个字符:', analysis.substring(0, 150));
      
      const hasChineseFeatures = analysis.includes("幸运物品") || 
                                analysis.includes("颜色推荐") ||
                                analysis.includes("五行属性");
      const hasEnglish = /[a-zA-Z]{10,}/.test(analysis.substring(0, 500));
      
      console.log(`🔍 中文幸运物品特征: ${hasChineseFeatures}, 包含英文: ${hasEnglish}`);
      
      if (hasChineseFeatures && !hasEnglish) {
        console.log('🎉 中文幸运物品正确！');
      } else {
        console.log('⚠️ 中文幸运物品可能有问题');
      }
    } else {
      console.log('❌ 中文幸运物品失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 中文幸运物品出错:', error.response?.data || error.message);
  }
}

testLuckyItemsMultilang().catch(console.error);
