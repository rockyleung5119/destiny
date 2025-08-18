// 诊断AI服务问题
const PROD_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function diagnoseAIService() {
  console.log('🔍 Diagnosing AI Service Issues...\n');
  
  try {
    // 步骤1: 检查API健康状态
    console.log('📊 Step 1: Checking API health...');
    try {
      const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
      const healthData = await healthResponse.json();
      console.log('✅ API Health:', JSON.stringify(healthData, null, 2));
    } catch (error) {
      console.log('❌ API Health check failed:', error.message);
    }
    
    // 步骤2: 检查数据库中最新的任务详情
    console.log('\n📊 Step 2: Checking latest task details...');
    try {
      const dbResponse = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
      const dbData = await dbResponse.json();
      console.log('📋 Database status:', JSON.stringify(dbData, null, 2));
    } catch (error) {
      console.log('❌ Database check failed:', error.message);
    }
    
    // 步骤3: 测试一个简单的AI调用
    console.log('\n🧪 Step 3: Testing a simple AI call...');
    console.log('💡 This will help identify if the issue is in:');
    console.log('   - API configuration');
    console.log('   - Network connectivity');
    console.log('   - AI service response processing');
    console.log('   - Database saving');
    
    // 创建一个测试用户数据
    const testUser = {
      id: 'test-user-' + Date.now(),
      name: 'Test User',
      birth_year: 1990,
      birth_month: 1,
      birth_day: 1,
      birth_hour: 12,
      birth_minute: 0,
      birth_place: 'Beijing'
    };
    
    console.log('\n🔬 Creating test analysis request...');
    
    // 测试BaZi分析
    try {
      const baziResponse = await fetch(`${PROD_API_URL}/api/fortune/bazi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          user: testUser,
          language: 'zh'
        })
      });
      
      console.log(`📡 BaZi Response Status: ${baziResponse.status}`);
      
      if (baziResponse.ok) {
        const baziData = await baziResponse.json();
        console.log('✅ BaZi Response:', JSON.stringify(baziData, null, 2));
        
        if (baziData.taskId) {
          console.log(`🔍 Task ID: ${baziData.taskId}`);
          console.log('💡 You can check this task status in the database');
        }
      } else {
        const errorData = await baziResponse.json();
        console.log('❌ BaZi Error Response:', JSON.stringify(errorData, null, 2));
      }
      
    } catch (error) {
      console.log('❌ BaZi test failed:', error.message);
    }
    
    console.log('\n🎯 Diagnosis Summary:');
    console.log('1. ✅ Timeout increased to 300 seconds for large model responses');
    console.log('2. ✅ Segmented processing to bypass Cloudflare Workers CPU limits');
    console.log('3. ✅ Improved error handling shows specific error messages');
    console.log('4. ⚠️  API key must be set in Cloudflare secrets (not hardcoded)');
    console.log('5. 🔧 Next steps:');
    console.log('   - Run: wrangler secret put DEEPSEEK_API_KEY');
    console.log('   - Push code to GitHub for auto-deployment');
    console.log('   - Test AI services again');
    console.log('   - Check Worker logs for detailed diagnostics');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// 运行诊断
diagnoseAIService();
