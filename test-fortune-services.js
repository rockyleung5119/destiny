// 测试AI占卜服务API端点
const API_BASE_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function testFortuneServices() {
  console.log('🔮 测试AI占卜服务API端点\n');

  try {
    // 步骤1: 登录获取token
    console.log('🔐 步骤1: 登录获取token...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '494159635@qq.com',
        password: 'password123'
      })
    });

    console.log(`🔐 登录响应状态: ${loginResponse.status}`);
    const loginData = await loginResponse.json();
    console.log(`🔐 登录响应:`, JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      console.log('❌ 登录失败，无法继续测试');
      return;
    }

    const token = loginData.token;
    console.log('✅ 登录成功，获得token');

    // 测试所有四个占卜服务
    const services = [
      { name: 'BaZi (八字精算)', endpoint: '/api/fortune/bazi', body: {} },
      { name: 'Daily Fortune (每日运势)', endpoint: '/api/fortune/daily', body: {} },
      { name: 'Celestial Tarot Reading (塔罗占卜)', endpoint: '/api/fortune/tarot', body: { question: '我的事业发展如何？' } },
      { name: 'Lucky Items & Colors (幸运物品)', endpoint: '/api/fortune/lucky', body: {} }
    ];

    for (const service of services) {
      console.log(`\n🔮 步骤${services.indexOf(service) + 2}: 测试 ${service.name}...`);
      
      try {
        const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(service.body)
        });

        console.log(`📊 ${service.name} 响应状态: ${response.status}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ ${service.name} 测试成功`);
          console.log(`📝 响应数据结构:`, {
            success: data.success,
            message: data.message,
            hasData: !!data.data,
            dataType: data.data?.type,
            analysisType: data.data?.analysisType,
            hasAnalysis: !!data.data?.analysis,
            analysisLength: data.data?.analysis?.length || 0
          });
          
          // 显示分析内容的前100个字符
          if (data.data?.analysis) {
            const preview = data.data.analysis.substring(0, 100) + '...';
            console.log(`📖 分析内容预览: ${preview}`);
          }
        } else {
          console.log(`❌ ${service.name} 测试失败`);
          console.log(`❌ 错误信息:`, data.message || '未知错误');
          console.log(`❌ 完整响应:`, JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.log(`❌ ${service.name} 请求失败:`, error.message);
      }
    }

    console.log('\n📊 测试总结:');
    console.log('='.repeat(60));
    console.log('✅ 如果所有服务都返回成功响应，说明API端点修复成功');
    console.log('❌ 如果有服务返回"API endpoint not found"，说明路由配置有问题');
    console.log('⚠️ 如果返回"Fortune reading failed"，说明DeepSeek API调用有问题');
    console.log('🔧 修复后的API应该返回包含analysis字段的完整响应数据');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testFortuneServices();
