const axios = require('axios');

async function testSimpleDaily() {
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
      console.log('📝 前100个字符:', analysis.substring(0, 100));

      // 检查是否包含英文特征
      const hasToday = analysis.includes("Today's");
      const hasDetailed = analysis.includes("Detailed");
      const hasFortune = analysis.includes("Fortune");

      console.log(`🔍 英文特征检测:`);
      console.log(`  - Today's: ${hasToday}`);
      console.log(`  - Detailed: ${hasDetailed}`);
      console.log(`  - Fortune: ${hasFortune}`);

      if (hasToday && hasDetailed && hasFortune) {
        console.log('🎉 英文版本正确！');
      } else {
        console.log('⚠️ 可能不是英文版本');
      }
    } else {
      console.log('❌ 请求失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 请求出错:', error.response?.data || error.message);
  }

  // 等待一秒避免限流
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
      console.log('📝 前100个字符:', analysis.substring(0, 100));

      // 检查是否包含中文特征
      const hasDetailedChinese = analysis.includes("今日运势详细分析");
      const hasOverview = analysis.includes("今日总体运势概览");
      const hasCareer = analysis.includes("事业工作运势详解");

      console.log(`🔍 中文特征检测:`);
      console.log(`  - 今日运势详细分析: ${hasDetailedChinese}`);
      console.log(`  - 今日总体运势概览: ${hasOverview}`);
      console.log(`  - 事业工作运势详解: ${hasCareer}`);

      if (hasDetailedChinese && hasOverview && hasCareer) {
        console.log('🎉 中文版本正确！');
      } else {
        console.log('⚠️ 可能不是中文版本');
      }
    } else {
      console.log('❌ 请求失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 请求出错:', error.response?.data || error.message);
  }
}

testSimpleDaily().catch(console.error);
