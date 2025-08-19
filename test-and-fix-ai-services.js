// 完整的AI服务测试和修复脚本
const PROD_API_URL = 'https://destiny-backend.wlk8s6v9y.workers.dev';

async function testAndFixAIServices() {
  console.log('🔧 AI服务完整测试和修复');
  console.log('='.repeat(60));
  
  try {
    // 步骤1: 检查系统状态
    console.log('\n📊 Step 1: 系统状态检查...');
    await checkSystemStatus();
    
    // 步骤2: 处理卡住的任务
    console.log('\n🔧 Step 2: 处理卡住的任务...');
    await processStuckTasks();
    
    // 步骤3: 测试新任务创建
    console.log('\n🧪 Step 3: 测试新任务创建...');
    await testTaskCreation();
    
    // 步骤4: 监控任务状态
    console.log('\n📊 Step 4: 任务状态监控...');
    await monitorTasks();
    
    console.log('\n✅ 测试和修复完成!');
    
  } catch (error) {
    console.error('❌ 测试和修复过程失败:', error);
  }
}

async function checkSystemStatus() {
  try {
    // API健康检查
    const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API健康状态:', healthData.status);
    
    // 异步处理状态
    const asyncResponse = await fetch(`${PROD_API_URL}/api/async-status`);
    const asyncData = await asyncResponse.json();
    console.log('✅ 异步处理状态:', asyncData.status);
    console.log('🎯 当前处理方法:', asyncData.currentMethod);
    
    // AI服务状态
    const aiResponse = await fetch(`${PROD_API_URL}/api/ai-status`);
    const aiData = await aiResponse.json();
    console.log('✅ AI服务状态:', aiData.status);
    
  } catch (error) {
    console.log('❌ 系统状态检查失败:', error.message);
  }
}

async function processStuckTasks() {
  try {
    const stuckResponse = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
    const stuckData = await stuckResponse.json();
    
    if (stuckData.success) {
      console.log(`✅ 处理了 ${stuckData.data.processed || 0} 个卡住的任务`);
      if (stuckData.data.details && stuckData.data.details.length > 0) {
        console.log('📋 处理详情:');
        stuckData.data.details.forEach(detail => {
          console.log(`  - ${detail.taskId}: ${detail.action}`);
        });
      }
    } else {
      console.log('⚠️ 卡住任务处理失败:', stuckData.message);
    }
    
  } catch (error) {
    console.log('❌ 处理卡住任务失败:', error.message);
  }
}

async function testTaskCreation() {
  try {
    // 尝试登录
    const loginResponse = await fetch(`${PROD_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123456'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('⚠️ 登录失败，跳过任务创建测试');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ 登录成功');
    
    // 测试创建BaZi任务
    const taskResponse = await fetch(`${PROD_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    if (taskResponse.ok) {
      const taskData = await taskResponse.json();
      const taskId = taskData.data.taskId;
      console.log(`✅ 任务创建成功: ${taskId}`);
      
      // 监控任务状态变化
      await monitorTaskProgress(token, taskId);
      
    } else {
      console.log('❌ 任务创建失败');
    }
    
  } catch (error) {
    console.log('❌ 任务创建测试失败:', error.message);
  }
}

async function monitorTaskProgress(token, taskId) {
  console.log(`🔍 监控任务 ${taskId} 的进度...`);
  
  for (let i = 0; i < 6; i++) { // 监控1分钟
    try {
      const statusResponse = await fetch(`${PROD_API_URL}/api/fortune/task/${taskId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.data.status;
        const resultLength = statusData.data.resultLength || 0;
        
        console.log(`📊 ${i * 10}s: 状态=${status}, 结果长度=${resultLength}`);
        
        if (status === 'completed') {
          console.log('🎉 任务完成!');
          break;
        } else if (status === 'failed') {
          console.log('❌ 任务失败');
          break;
        }
      }
      
      if (i < 5) await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
      
    } catch (error) {
      console.log(`❌ 状态检查失败: ${error.message}`);
    }
  }
}

async function monitorTasks() {
  try {
    const monitorResponse = await fetch(`${PROD_API_URL}/api/admin/task-monitor`);
    const monitorData = await monitorResponse.json();
    
    if (monitorData.success) {
      console.log('📊 24小时任务统计:');
      monitorData.data.stats.forEach(stat => {
        console.log(`  - ${stat.status}: ${stat.count}个任务, 平均耗时: ${stat.avg_duration_minutes?.toFixed(1) || 'N/A'}分钟`);
      });
      
      if (monitorData.data.longRunningTasks.length > 0) {
        console.log('\n⚠️ 长时间运行的任务:');
        monitorData.data.longRunningTasks.forEach(task => {
          console.log(`  - ${task.id}: ${task.status}, 运行时间: ${task.duration_minutes.toFixed(1)}分钟`);
        });
      }
      
      if (monitorData.data.failedTasks.length > 0) {
        console.log('\n❌ 最近失败的任务:');
        monitorData.data.failedTasks.forEach(task => {
          console.log(`  - ${task.id}: ${task.error_message}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ 任务监控失败:', error.message);
  }
}

// 运行测试和修复
testAndFixAIServices().catch(console.error);
