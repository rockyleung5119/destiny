// 完整AI服务流程测试工具 - 验证300秒超时配置
const PROD_API_URL = 'https://destiny-backend.wlk8s6v9y.workers.dev';

async function testCompleteAIFlow() {
  console.log('🧪 完整AI服务流程测试');
  console.log('='.repeat(60));
  console.log('📊 测试配置: 统一300秒超时，适应AI大模型2-5分钟推理时间');
  console.log('');
  
  try {
    // 步骤1: 系统健康检查
    console.log('📊 Step 1: 系统健康检查...');
    await checkSystemHealth();
    
    // 步骤2: 登录获取token
    console.log('\n🔐 Step 2: 用户登录...');
    const token = await loginUser();
    
    if (!token) {
      console.log('❌ 登录失败，无法继续测试');
      return;
    }
    
    // 步骤3: 测试所有AI服务
    console.log('\n🧪 Step 3: 测试所有AI服务...');
    await testAllAIServices(token);
    
    // 步骤4: 监控任务状态
    console.log('\n📊 Step 4: 监控任务状态...');
    await monitorTaskStatus();
    
    console.log('\n✅ 完整流程测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程失败:', error);
  }
}

async function checkSystemHealth() {
  try {
    const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ API健康状态: ${healthData.status}`);
    
    const asyncResponse = await fetch(`${PROD_API_URL}/api/async-status`);
    const asyncData = await asyncResponse.json();
    console.log(`✅ 异步处理状态: ${asyncData.status}`);
    console.log(`🎯 当前处理方法: ${asyncData.currentMethod}`);
    
    const aiResponse = await fetch(`${PROD_API_URL}/api/ai-status`);
    const aiData = await aiResponse.json();
    console.log(`✅ AI服务状态: ${aiData.status}`);
    
  } catch (error) {
    console.log('❌ 系统健康检查失败:', error.message);
  }
}

async function loginUser() {
  try {
    const loginResponse = await fetch(`${PROD_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123456'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ 登录成功');
      return loginData.data.token;
    } else {
      console.log('❌ 登录失败');
      return null;
    }
  } catch (error) {
    console.log('❌ 登录错误:', error.message);
    return null;
  }
}

async function testAllAIServices(token) {
  const services = [
    { name: 'BaZi (八字精算)', endpoint: '/api/fortune/bazi', body: { language: 'zh' } },
    { name: 'Daily Fortune (每日运势)', endpoint: '/api/fortune/daily', body: { language: 'zh' } },
    { name: 'Tarot Reading (塔罗占卜)', endpoint: '/api/fortune/tarot', body: { language: 'zh', question: '我的事业发展如何？' } },
    { name: 'Lucky Items (幸运物品)', endpoint: '/api/fortune/lucky', body: { language: 'zh' } }
  ];
  
  const taskIds = [];
  
  // 创建所有任务
  for (const service of services) {
    try {
      console.log(`\n🚀 创建任务: ${service.name}`);
      
      const startTime = Date.now();
      const response = await fetch(`${PROD_API_URL}${service.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(service.body)
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const taskId = data.data.taskId;
        taskIds.push({ taskId, name: service.name, createdAt: Date.now() });
        console.log(`✅ ${service.name} 任务创建成功: ${taskId} (${responseTime}ms)`);
        console.log(`⏱️ 预计处理时间: ${data.data.estimatedTime}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ ${service.name} 创建失败 (${response.status}): ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ ${service.name} 创建错误:`, error.message);
    }
    
    // 每个任务之间等待2秒
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (taskIds.length === 0) {
    console.log('❌ 没有成功创建任何任务');
    return;
  }
  
  console.log(`\n📊 成功创建 ${taskIds.length} 个任务，开始监控...`);
  
  // 监控所有任务直到完成
  await monitorAllTasks(token, taskIds);
}

async function monitorAllTasks(token, taskIds) {
  const maxMonitorTime = 8 * 60 * 1000; // 8分钟监控时间
  const checkInterval = 10000; // 每10秒检查一次
  const startTime = Date.now();
  
  let completedTasks = new Set();
  let failedTasks = new Set();
  
  while (Date.now() - startTime < maxMonitorTime && completedTasks.size + failedTasks.size < taskIds.length) {
    console.log(`\n🔍 检查任务状态 (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)...`);
    
    for (const task of taskIds) {
      if (completedTasks.has(task.taskId) || failedTasks.has(task.taskId)) {
        continue; // 跳过已完成或失败的任务
      }
      
      try {
        const statusResponse = await fetch(`${PROD_API_URL}/api/fortune/task/${task.taskId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const status = statusData.data.status;
          const resultLength = statusData.data.resultLength || 0;
          const progressMessage = statusData.data.progressMessage;
          
          console.log(`📊 ${task.name}: ${status}, 结果长度: ${resultLength}`);
          if (progressMessage) {
            console.log(`   💬 ${progressMessage}`);
          }
          
          if (status === 'completed' && statusData.data.analysis) {
            completedTasks.add(task.taskId);
            const duration = Math.floor((Date.now() - task.createdAt) / 1000);
            console.log(`🎉 ${task.name} 完成! 耗时: ${duration}秒, 结果长度: ${statusData.data.analysis.length}`);
          } else if (status === 'failed') {
            failedTasks.add(task.taskId);
            console.log(`❌ ${task.name} 失败: ${statusData.data.error}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${task.name} 状态检查失败:`, error.message);
      }
    }
    
    // 等待下次检查
    if (completedTasks.size + failedTasks.size < taskIds.length) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
  
  // 最终统计
  console.log('\n📊 最终统计:');
  console.log(`✅ 完成任务: ${completedTasks.size}/${taskIds.length}`);
  console.log(`❌ 失败任务: ${failedTasks.size}/${taskIds.length}`);
  console.log(`⏳ 未完成任务: ${taskIds.length - completedTasks.size - failedTasks.size}/${taskIds.length}`);
  
  const successRate = (completedTasks.size / taskIds.length) * 100;
  console.log(`📈 成功率: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 75) {
    console.log('🎉 测试结果良好!');
  } else if (successRate >= 50) {
    console.log('⚠️ 测试结果一般，需要优化');
  } else {
    console.log('❌ 测试结果较差，需要检查系统');
  }
}

async function monitorTaskStatus() {
  try {
    const monitorResponse = await fetch(`${PROD_API_URL}/api/admin/task-monitor`);
    const monitorData = await monitorResponse.json();
    
    if (monitorData.success) {
      console.log('📊 24小时任务统计:');
      monitorData.data.stats.forEach(stat => {
        console.log(`  - ${stat.status}: ${stat.count}个任务, 平均耗时: ${stat.avg_duration_minutes?.toFixed(1) || 'N/A'}分钟`);
      });
      
      if (monitorData.data.longRunningTasks.length > 0) {
        console.log(`\n⚠️ 长时间运行的任务: ${monitorData.data.longRunningTasks.length}个`);
      }
      
      if (monitorData.data.failedTasks.length > 0) {
        console.log(`\n❌ 最近失败的任务: ${monitorData.data.failedTasks.length}个`);
      }
    }
    
  } catch (error) {
    console.log('❌ 任务监控失败:', error.message);
  }
}

// 运行完整测试
testCompleteAIFlow().catch(console.error);
