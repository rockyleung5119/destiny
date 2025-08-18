// 验证生产环境AI错误处理修复
const PROD_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function verifyProductionFix() {
  console.log('🔍 Verifying Production AI Error Handling Fix...\n');

  try {
    // 步骤1: 检查当前卡住的任务
    console.log('📊 Step 1: Checking current stuck tasks...');
    const response = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📋 Current stuck tasks:', JSON.stringify(data, null, 2));

    // 步骤2: 测试新的错误处理
    console.log('\n🧪 Step 2: Testing improved error handling...');
    console.log('💡 The fix should now provide specific error messages instead of generic "AI service temporarily unavailable"');
    console.log('💡 Check the Worker logs for detailed error information');

    if (data.success) {
      if (data.total > 0) {
        console.log(`🔧 Found ${data.total} stuck tasks, processing ${data.processed} of them`);

        // 等待处理完成
        console.log('\n⏳ Waiting 60 seconds for smart processing to complete (5min timeout, 3min auto-recovery)...');
        await new Promise(resolve => setTimeout(resolve, 60000));

        // 再次检查
        console.log('\n🔄 Step 2: Checking after smart processing...');
        const checkResponse = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
        const checkData = await checkResponse.json();

        console.log('📋 After processing:', JSON.stringify(checkData, null, 2));

        if (checkData.total === 0) {
          console.log('🎉 All stuck tasks resolved! Smart processing is working!');
        } else if (checkData.total < data.total) {
          console.log(`✅ Progress made: ${data.total - checkData.total} tasks resolved`);
        } else {
          console.log('⚠️ No progress - may need further investigation');
        }
      } else {
        console.log('✅ No stuck tasks found - system is healthy');

        // 测试新任务创建
        console.log('\n🧪 Step 2: Testing new task creation...');
        console.log('💡 You can now test creating a new analysis to verify the fix');
        console.log('💡 Smart processing: 5min timeout + 3min auto-recovery should prevent stuck tasks');
      }
    } else {
      console.log('❌ Failed to check stuck tasks:', data.message);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('📋 Error details:', error);
  }
}

// 运行验证
verifyProductionFix();
