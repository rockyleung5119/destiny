const axios = require('axios');

// 测试前端与后端的集成
async function testFrontendIntegration() {
  console.log('🧪 测试前端与后端集成...\n');

  try {
    // 1. 测试登录
    console.log('1️⃣ 测试登录...');
    const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      
      // 2. 测试八字分析API调用
      console.log('\n2️⃣ 测试八字分析API...');
      const baziResponse = await axios.post('http://localhost:5173/api/fortune/bazi', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (baziResponse.data.success) {
        console.log('✅ 八字分析API调用成功');
        console.log(`📝 分析结果长度: ${baziResponse.data.data.analysis.length} 字符`);
        console.log(`🎯 分析预览: ${baziResponse.data.data.analysis.substring(0, 100)}...`);
      } else {
        console.log('❌ 八字分析API调用失败:', baziResponse.data.message);
      }

      // 3. 测试每日运势API
      console.log('\n3️⃣ 测试每日运势API...');
      const dailyResponse = await axios.post('http://localhost:5173/api/fortune/daily', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (dailyResponse.data.success) {
        console.log('✅ 每日运势API调用成功');
        console.log(`📝 分析结果长度: ${dailyResponse.data.data.analysis.length} 字符`);
        console.log(`🎯 分析预览: ${dailyResponse.data.data.analysis.substring(0, 100)}...`);
      } else {
        console.log('❌ 每日运势API调用失败:', dailyResponse.data.message);
      }

      // 4. 测试塔罗占卜API
      console.log('\n4️⃣ 测试塔罗占卜API...');
      const tarotResponse = await axios.post('http://localhost:5173/api/fortune/tarot', {
        question: '请为我进行综合运势占卜'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (tarotResponse.data.success) {
        console.log('✅ 塔罗占卜API调用成功');
        console.log(`📝 分析结果长度: ${tarotResponse.data.data.analysis.length} 字符`);
        console.log(`🎯 分析预览: ${tarotResponse.data.data.analysis.substring(0, 100)}...`);
      } else {
        console.log('❌ 塔罗占卜API调用失败:', tarotResponse.data.message);
      }

      // 5. 测试幸运物品API
      console.log('\n5️⃣ 测试幸运物品API...');
      const luckyResponse = await axios.post('http://localhost:5173/api/fortune/lucky-items', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (luckyResponse.data.success) {
        console.log('✅ 幸运物品API调用成功');
        console.log(`📝 分析结果长度: ${luckyResponse.data.data.analysis.length} 字符`);
        console.log(`🎯 分析预览: ${luckyResponse.data.data.analysis.substring(0, 100)}...`);
      } else {
        console.log('❌ 幸运物品API调用失败:', luckyResponse.data.message);
      }

    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }

  console.log('\n🎉 前端后端集成测试完成！');
}

// 运行测试
testFrontendIntegration();
