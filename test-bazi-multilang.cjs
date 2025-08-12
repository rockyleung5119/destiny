const axios = require('axios');

async function testBaziMultilang() {
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
  
  // 测试英文八字分析
  console.log('\n📊 测试英文八字分析...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/bazi`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'en'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 英文八字分析成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前150个字符:', analysis.substring(0, 150));
      
      const hasEnglishFeatures = analysis.includes("BaZi (Eight Characters)") || 
                                analysis.includes("Detailed BaZi") ||
                                analysis.includes("Four Pillars");
      const hasChinese = /[\u4e00-\u9fff]/.test(analysis.substring(0, 500));
      
      console.log(`🔍 英文八字特征: ${hasEnglishFeatures}, 包含中文: ${hasChinese}`);
      
      if (hasEnglishFeatures && !hasChinese) {
        console.log('🎉 英文八字分析正确！');
      } else {
        console.log('⚠️ 英文八字分析可能有问题');
      }
    } else {
      console.log('❌ 英文八字分析失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 英文八字分析出错:', error.response?.data || error.message);
  }
  
  // 等待一秒避免限流
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试中文八字分析
  console.log('\n📊 测试中文八字分析...');
  try {
    const response = await axios.post(`${baseURL}/api/fortune/bazi`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Language': 'zh'
      }
    });
    
    if (response.data.success) {
      console.log('✅ 中文八字分析成功');
      const analysis = response.data.data.analysis || response.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前150个字符:', analysis.substring(0, 150));
      
      const hasChineseFeatures = analysis.includes("八字排盘") || 
                                analysis.includes("详细分析") ||
                                analysis.includes("五行分析");
      const hasEnglish = /[a-zA-Z]{10,}/.test(analysis.substring(0, 500));
      
      console.log(`🔍 中文八字特征: ${hasChineseFeatures}, 包含英文: ${hasEnglish}`);
      
      if (hasChineseFeatures && !hasEnglish) {
        console.log('🎉 中文八字分析正确！');
      } else {
        console.log('⚠️ 中文八字分析可能有问题');
      }
    } else {
      console.log('❌ 中文八字分析失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 中文八字分析出错:', error.response?.data || error.message);
  }
}

testBaziMultilang().catch(console.error);
