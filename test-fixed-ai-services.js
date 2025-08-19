// 测试修复后的AI服务
// 验证简化的异步处理能够正常工作

const API_BASE = 'https://destiny-backend.wlk8s6v9y.workers.dev';

// 测试用户凭据（demo用户）
const TEST_CREDENTIALS = {
  email: 'demo@example.com',
  password: 'password123'
};

// 获取认证token
async function getAuthToken() {
  console.log('🔐 Logging in to get auth token...');
  
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Login failed: ${data.message}`);
  }

  console.log('✅ Login successful');
  return data.token;
}

// 检查AI服务状态
async function checkAIStatus() {
  console.log('🤖 Checking AI service status...');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai-status`);
    const data = await response.json();
    
    console.log('📊 AI Status:', data);
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ AI status check failed:', error.message);
    return false;
  }
}

// 启动AI分析任务
async function startAIAnalysis(token, analysisType, language = 'zh') {
  console.log(`🔮 Starting ${analysisType} analysis...`);
  
  const endpoints = {
    bazi: '/api/fortune/bazi',
    daily: '/api/fortune/daily',
    tarot: '/api/fortune/tarot',
    lucky: '/api/fortune/lucky'
  };

  const endpoint = endpoints[analysisType];
  if (!endpoint) {
    throw new Error(`Unknown analysis type: ${analysisType}`);
  }

  const requestBody = { language };
  if (analysisType === 'tarot') {
    requestBody.question = 'What should I focus on in my career this month?';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Failed to start ${analysisType} analysis: ${data.message}`);
  }

  console.log(`✅ ${analysisType} analysis started, task ID: ${data.data.taskId}`);
  return data.data.taskId;
}

// 检查任务状态
async function checkTaskStatus(token, taskId) {
  const response = await fetch(`${API_BASE}/api/fortune/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Failed to check task status: ${data.message}`);
  }

  return data.data;
}

// 等待任务完成
async function waitForTaskCompletion(token, taskId, maxWaitTime = 360000) { // 6分钟最大等待时间，适应4分钟AI处理
  console.log(`⏳ Waiting for task ${taskId} to complete...`);
  
  const startTime = Date.now();
  const checkInterval = 5000; // 每5秒检查一次
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkTaskStatus(token, taskId);
    
    console.log(`📊 Task ${taskId} status: ${status.status}`);
    
    if (status.status === 'completed') {
      console.log(`✅ Task ${taskId} completed successfully!`);
      console.log(`📝 Analysis length: ${status.analysis?.length || 0} characters`);
      return status;
    } else if (status.status === 'failed') {
      throw new Error(`Task ${taskId} failed: ${status.error || 'Unknown error'}`);
    }
    
    // 等待下次检查
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  throw new Error(`Task ${taskId} timeout after ${maxWaitTime/1000} seconds (6 minutes)`);
}

// 测试单个分析类型
async function testAnalysisType(token, analysisType) {
  console.log(`\n🧪 Testing ${analysisType} analysis...`);
  
  try {
    const taskId = await startAIAnalysis(token, analysisType);
    const result = await waitForTaskCompletion(token, taskId);
    
    console.log(`✅ ${analysisType} analysis completed successfully!`);
    console.log(`📊 Result preview: ${result.analysis?.substring(0, 200)}...`);
    
    return {
      success: true,
      analysisType,
      taskId,
      resultLength: result.analysis?.length || 0,
      completedAt: result.completedAt
    };
    
  } catch (error) {
    console.error(`❌ ${analysisType} analysis failed:`, error.message);
    
    return {
      success: false,
      analysisType,
      error: error.message
    };
  }
}

// 主测试函数
async function runFixedAITest() {
  console.log('🚀 Starting fixed AI services test...');
  console.log('🎯 Testing with 4-minute AI timeout, 2-minute scheduled recovery, and improved error handling');
  
  try {
    // 检查AI服务状态
    const aiHealthy = await checkAIStatus();
    if (!aiHealthy) {
      console.log('⚠️ AI service appears unhealthy, but continuing with test...');
    }
    
    // 获取认证token
    const token = await getAuthToken();
    
    // 测试所有分析类型
    const analysisTypes = ['bazi', 'daily', 'tarot', 'lucky'];
    const results = [];
    
    for (const analysisType of analysisTypes) {
      const result = await testAnalysisType(token, analysisType);
      results.push(result);
      
      // 在测试之间稍作等待，避免过载
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 汇总结果
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successful analyses:');
      successful.forEach(result => {
        console.log(`  - ${result.analysisType}: ${result.resultLength} chars, completed at ${result.completedAt}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed analyses:');
      failed.forEach(result => {
        console.log(`  - ${result.analysisType}: ${result.error}`);
      });
    }
    
    // 判断测试是否成功
    if (successful.length === results.length) {
      console.log('\n🎉 All tests passed! Fixed AI processing is working correctly.');
      return true;
    } else if (successful.length > 0) {
      console.log('\n⚠️ Partial success. Some analyses completed.');
      return false;
    } else {
      console.log('\n💥 All tests failed. Further debugging needed.');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    return false;
  }
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFixedAITest };
} else {
  // 在浏览器中运行
  runFixedAITest().then(success => {
    console.log(`\n🏁 Test completed. Success: ${success}`);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
  });
}
