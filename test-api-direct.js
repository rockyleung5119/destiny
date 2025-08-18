// 直接测试API端点
const LOCAL_API_URL = 'http://127.0.0.1:8787';

async function testAPIDirectly() {
  console.log('🔧 Testing API Endpoints Directly');
  console.log('🌐 Local API:', LOCAL_API_URL);
  
  try {
    // 测试健康检查
    console.log('\n🏥 Testing health check...');
    const healthResponse = await fetch(`${LOCAL_API_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // 测试数据库查询（通过API）
    console.log('\n🗄️ Testing database query...');
    const testResponse = await fetch(`${LOCAL_API_URL}/api/test/users`);
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('Test users data:', testData);
    } else {
      console.log('Test endpoint not available');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testAPIDirectly();
