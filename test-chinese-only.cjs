const axios = require('axios');

async function testChineseOnly() {
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
  
  // 先清除缓存
  console.log('\n🗑️ 清除缓存...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试中文每日运势
  console.log('\n🌟 测试中文每日运势...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/daily`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'zh'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 请求成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前200个字符:', analysis.substring(0, 200));
      
      // 检查是否包含中文特征
      const hasDetailedChinese = analysis.includes("今日运势详细分析");
      const hasOverview = analysis.includes("今日总体运势概览");
      const hasCareer = analysis.includes("事业工作运势详解");
      const hasEnglish = /[a-zA-Z]{10,}/.test(analysis.substring(0, 500)); // 检查前500字符是否有连续英文
      
      console.log(`🔍 语言特征检测:`);
      console.log(`  - 今日运势详细分析: ${hasDetailedChinese}`);
      console.log(`  - 今日总体运势概览: ${hasOverview}`);
      console.log(`  - 事业工作运势详解: ${hasCareer}`);
      console.log(`  - 包含英文内容: ${hasEnglish}`);
      
      if (hasDetailedChinese && hasOverview && hasCareer && !hasEnglish) {
        console.log('🎉 中文版本完全正确！');
      } else if (hasEnglish) {
        console.log('⚠️ 返回了英文内容，语言设置有问题');
      } else {
        console.log('⚠️ 中文特征不完整');
      }
    } else {
      console.log('❌ 请求失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 请求出错:', error.response?.data || error.message);
  }
}

testChineseOnly().catch(console.error);
