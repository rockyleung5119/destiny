// 简单测试JSON解析修复
const API_BASE = 'http://127.0.0.1:8787';

async function testJSONParsing() {
  console.log('🧪 测试JSON解析修复...');
  
  // 测试各种API端点的JSON响应
  const endpoints = [
    '/api/health',
    '/api/stripe/create-checkout-session',
    '/api/auth/login'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 测试端点: ${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: 'data'
        })
      });

      console.log(`📊 状态: ${response.status} ${response.statusText}`);
      
      // 使用我们修复的方法测试JSON解析
      const responseText = await response.text();
      console.log(`📝 响应长度: ${responseText.length} 字符`);
      
      if (!responseText || responseText.trim() === '') {
        console.log('❌ 空响应 - 这是导致JSON错误的原因！');
        continue;
      }

      try {
        const data = JSON.parse(responseText);
        console.log('✅ JSON解析成功');
        console.log(`📋 响应类型: ${typeof data}`);
        if (data.message || data.error) {
          console.log(`💬 消息: ${data.message || data.error}`);
        }
      } catch (jsonError) {
        console.log('❌ JSON解析失败:', jsonError.message);
        console.log('📄 原始响应前100字符:', responseText.substring(0, 100));
      }
      
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
  }
}

// 测试健康检查端点
async function testHealthEndpoint() {
  console.log('\n🏥 测试健康检查端点...');
  
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    console.log(`📊 状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📝 响应: ${responseText}`);
    
    if (responseText) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ 健康检查JSON解析成功');
        console.log('📋 数据:', JSON.stringify(data, null, 2));
      } catch (jsonError) {
        console.log('❌ 健康检查JSON解析失败:', jsonError.message);
      }
    }
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testHealthEndpoint();
  await testJSONParsing();
  
  console.log('\n🎯 测试总结:');
  console.log('- 修复了StripeAPIClient的makeRequest方法，增加了空响应检查');
  console.log('- 修复了前端StripeCheckoutButton的JSON解析错误处理');
  console.log('- 增加了详细的错误日志和调试信息');
  console.log('- 现在应该能够正确显示具体的错误信息而不是"Unexpected end of JSON input"');
}

runTests();
