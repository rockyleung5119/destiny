const axios = require('axios');

async function testAIAnalysis() {
  const baseURL = 'http://localhost:3001';
  
  // 测试用户登录
  console.log('🔐 测试用户登录...');
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      
      // 测试八字分析
      console.log('\n📊 测试八字分析...');
      const baziResponse = await axios.post(`${baseURL}/api/fortune/bazi`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (baziResponse.data.success) {
        console.log('✅ 八字分析成功');
        console.log('📝 分析结果预览:');
        const analysis = baziResponse.data.data.analysis || baziResponse.data.data;
        console.log(analysis.substring(0, 200) + '...');
      } else {
        console.log('❌ 八字分析失败:', baziResponse.data.message);
      }
      
      // 测试每日运势
      console.log('\n🌟 测试每日运势...');
      const dailyResponse = await axios.post(`${baseURL}/api/fortune/daily`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (dailyResponse.data.success) {
        console.log('✅ 每日运势成功');
        console.log('📝 运势结果预览:');
        const analysis = dailyResponse.data.data.analysis || dailyResponse.data.data;
        console.log(analysis.substring(0, 200) + '...');
      } else {
        console.log('❌ 每日运势失败:', dailyResponse.data.message);
      }
      
      // 测试塔罗占卜
      console.log('\n🔮 测试塔罗占卜...');
      const tarotResponse = await axios.post(`${baseURL}/api/fortune/tarot`, {
        question: '请为我进行综合运势占卜'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (tarotResponse.data.success) {
        console.log('✅ 塔罗占卜成功');
        console.log('📝 占卜结果预览:');
        const analysis = tarotResponse.data.data.analysis || tarotResponse.data.data;
        console.log(analysis.substring(0, 200) + '...');
      } else {
        console.log('❌ 塔罗占卜失败:', tarotResponse.data.message);
      }
      
      // 测试幸运物品
      console.log('\n🍀 测试幸运物品...');
      const luckyResponse = await axios.post(`${baseURL}/api/fortune/lucky-items`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (luckyResponse.data.success) {
        console.log('✅ 幸运物品成功');
        console.log('📝 推荐结果预览:');
        const analysis = luckyResponse.data.data.analysis || luckyResponse.data.data;
        console.log(analysis.substring(0, 200) + '...');
      } else {
        console.log('❌ 幸运物品失败:', luckyResponse.data.message);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAIAnalysis().then(() => {
  console.log('\n🎉 测试完成');
}).catch(error => {
  console.error('💥 测试出错:', error);
});
