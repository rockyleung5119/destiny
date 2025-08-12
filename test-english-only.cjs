const axios = require('axios');

async function testEnglishOnly() {
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
  
  // 测试英文每日运势
  console.log('\n🌟 测试英文每日运势...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/daily`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'en'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 请求成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前200个字符:', analysis.substring(0, 200));
      
      // 检查是否包含英文特征
      const hasToday = analysis.includes("Today's");
      const hasDetailed = analysis.includes("Detailed");
      const hasFortune = analysis.includes("Fortune");
      const hasChinese = /[\u4e00-\u9fff]/.test(analysis);
      
      console.log(`🔍 语言特征检测:`);
      console.log(`  - Today's: ${hasToday}`);
      console.log(`  - Detailed: ${hasDetailed}`);
      console.log(`  - Fortune: ${hasFortune}`);
      console.log(`  - 包含中文: ${hasChinese}`);
      
      if (hasToday && hasDetailed && hasFortune && !hasChinese) {
        console.log('🎉 英文版本完全正确！');
      } else if (hasChinese) {
        console.log('⚠️ 返回了中文内容，语言设置有问题');
      } else {
        console.log('⚠️ 英文特征不完整');
      }
    } else {
      console.log('❌ 请求失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 请求出错:', error.response?.data || error.message);
  }
}

testEnglishOnly().catch(console.error);
