// 测试生产环境API调用
const axios = require('axios');

async function testProductionAPI() {
  console.log('🚀 测试生产环境API调用...\n');

  try {
    // 1. 测试登录
    console.log('1️⃣ 测试登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'demo@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }

    console.log('✅ 登录成功');
    const token = loginResponse.data.data.token;
    console.log('🔑 Token获取成功');

    // 2. 测试八字分析API
    console.log('\n2️⃣ 测试八字分析API...');
    const startTime = Date.now();
    
    const baziResponse = await axios.post('http://localhost:3001/api/fortune/bazi', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'en'
      },
      timeout: 120000 // 2分钟超时
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('✅ 八字分析请求成功');
    console.log('📊 响应分析:');
    console.log('- 响应状态:', baziResponse.data.success);
    console.log('- 响应时间:', responseTime + 'ms');
    console.log('- 内容长度:', baziResponse.data.data?.analysis?.length || 0);
    
    const content = baziResponse.data.data?.analysis || '';
    console.log('- 内容开头:', content.substring(0, 100));
    
    // 检查是否是真实AI响应
    if (content.length > 0) {
      const hasVariableContent = !content.includes('八字排盘详细分析报告') || content.length !== 2737;
      console.log('- 是否为真实AI响应:', hasVariableContent ? '✅ 是' : '❌ 否（可能是固定模拟响应）');
    }

    // 3. 测试每日运势API
    console.log('\n3️⃣ 测试每日运势API...');
    const dailyStartTime = Date.now();
    
    const dailyResponse = await axios.post('http://localhost:3001/api/fortune/daily', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'zh'
      },
      timeout: 120000
    });

    const dailyEndTime = Date.now();
    const dailyResponseTime = dailyEndTime - dailyStartTime;

    console.log('✅ 每日运势请求成功');
    console.log('📊 响应分析:');
    console.log('- 响应状态:', dailyResponse.data.success);
    console.log('- 响应时间:', dailyResponseTime + 'ms');
    console.log('- 内容长度:', dailyResponse.data.data?.analysis?.length || 0);
    
    const dailyContent = dailyResponse.data.data?.analysis || '';
    console.log('- 内容开头:', dailyContent.substring(0, 100));

    console.log('\n🎉 生产环境API测试完成！');
    console.log('📋 总结:');
    console.log('- 八字分析响应时间:', responseTime + 'ms');
    console.log('- 每日运势响应时间:', dailyResponseTime + 'ms');
    console.log('- 所有API调用均成功');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 建议: 请确保后端服务器正在运行 (npm start)');
    } else if (error.code === 'ECONNRESET' || error.message.includes('timeout')) {
      console.log('💡 建议: API调用超时，可能是网络问题或AI服务响应慢');
    }
  }
}

// 运行测试
testProductionAPI();
