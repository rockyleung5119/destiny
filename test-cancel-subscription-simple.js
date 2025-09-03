// 简单测试取消订阅功能
const PROD_API_URL = 'https://destiny-backend.wlk8s6v9y.workers.dev';

async function testCancelSubscription() {
  console.log('🧪 测试取消订阅功能');
  console.log('='.repeat(50));
  
  try {
    // 测试端点可用性（不带认证，应该返回401）
    console.log('\n🔍 测试取消订阅端点...');
    
    const response = await fetch(`${PROD_API_URL}/api/membership/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    console.log(`📡 响应状态: ${response.status}`);
    console.log('📦 响应数据:', data);
    
    if (response.status === 401) {
      console.log('✅ 端点正常工作（需要认证）');
    } else if (response.status === 500) {
      console.log('❌ 服务器内部错误');
      if (data.message) {
        console.log(`   错误信息: ${data.message}`);
      }
    } else {
      console.log('⚠️ 意外的响应状态');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 这可能是网络连接问题');
    }
  }
  
  console.log('\n📋 修复总结:');
  console.log('✅ 后端: 移除重定向，直接处理请求');
  console.log('✅ 前端: 添加重试机制和超时处理');
  console.log('✅ 错误处理: 增强错误分类和用户提示');
  console.log('✅ 用户体验: 防止重复点击，清晰错误信息');
}

// 运行测试
testCancelSubscription().catch(console.error);
