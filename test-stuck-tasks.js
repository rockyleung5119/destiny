// 测试处理卡住的任务
const API_BASE_URL = 'http://127.0.0.1:8787';

async function testStuckTaskProcessing() {
  console.log('🔧 Testing Stuck Task Processing...\n');
  
  try {
    // 步骤1: 检查卡住的任务
    console.log('📊 Step 1: Check for stuck tasks...');
    const response = await fetch(`${API_BASE_URL}/api/admin/process-stuck-tasks`);
    const data = await response.json();
    
    console.log('📋 Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`✅ Successfully processed ${data.processed} out of ${data.total} stuck tasks`);
    } else {
      console.log('❌ Failed to process stuck tasks:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// 运行测试
testStuckTaskProcessing();
