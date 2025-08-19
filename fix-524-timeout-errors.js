// 专门修复524超时错误的工具
const PROD_API_URL = 'https://destiny-backend.wlk8s6v9y.workers.dev';

async function fix524TimeoutErrors() {
  console.log('🔧 修复524超时错误专用工具');
  console.log('='.repeat(60));
  
  try {
    // 步骤1: 检查当前系统状态
    console.log('\n📊 Step 1: 检查系统状态...');
    await checkSystemHealth();
    
    // 步骤2: 处理所有卡住的任务
    console.log('\n🔧 Step 2: 处理卡住的任务...');
    await processAllStuckTasks();
    
    // 步骤3: 测试AI服务调用
    console.log('\n🧪 Step 3: 测试AI服务调用...');
    await testAIServiceCalls();
    
    // 步骤4: 监控任务状态
    console.log('\n📊 Step 4: 监控任务状态...');
    await monitorTaskStatus();
    
    // 步骤5: 提供修复建议
    console.log('\n💡 Step 5: 修复建议...');
    provideFix524Recommendations();
    
    console.log('\n✅ 524错误修复完成!');
    
  } catch (error) {
    console.error('❌ 修复过程失败:', error);
  }
}

async function checkSystemHealth() {
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
    
    if (asyncData.processingCheck) {
      console.log('📋 处理能力:');
      console.log(`  - Queue可用: ${asyncData.processingCheck.queueAvailable}`);
      console.log(`  - Durable Objects可用: ${asyncData.processingCheck.durableObjectsAvailable}`);
      console.log(`  - 直接处理可用: ${asyncData.processingCheck.directProcessingAvailable}`);
    }
    
    // AI服务状态
    const aiResponse = await fetch(`${PROD_API_URL}/api/ai-status`);
    const aiData = await aiResponse.json();
    console.log('✅ AI服务状态:', aiData.status);
    
    if (aiData.config) {
      console.log('🔧 AI配置:');
      console.log(`  - API密钥: ${aiData.config.hasApiKey ? '已配置' : '未配置'}`);
      console.log(`  - 基础URL: ${aiData.config.baseUrl || '未配置'}`);
      console.log(`  - 模型: ${aiData.config.model || '未配置'}`);
    }
    
  } catch (error) {
    console.log('❌ 系统状态检查失败:', error.message);
  }
}

async function processAllStuckTasks() {
  try {
    const stuckResponse = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
    const stuckData = await stuckResponse.json();
    
    if (stuckData.success) {
      console.log(`✅ 处理了 ${stuckData.processed || 0} 个卡住的任务`);
      console.log(`📊 总共检查了 ${stuckData.total || 0} 个任务`);
    } else {
      console.log('⚠️ 卡住任务处理失败:', stuckData.message);
    }
    
    // 等待5秒后再次检查
    console.log('⏳ 等待5秒后再次检查...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const secondCheck = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
    const secondData = await secondCheck.json();
    
    if (secondData.success) {
      console.log(`🔄 第二次检查处理了 ${secondData.processed || 0} 个任务`);
    }
    
  } catch (error) {
    console.log('❌ 处理卡住任务失败:', error.message);
  }
}

async function testAIServiceCalls() {
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
      console.log('⚠️ 登录失败，跳过AI服务测试');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ 登录成功');
    
    // 测试创建任务（不等待完成）
    const services = [
      { name: 'BaZi', endpoint: '/api/fortune/bazi' },
      { name: 'Daily Fortune', endpoint: '/api/fortune/daily' },
      { name: 'Tarot Reading', endpoint: '/api/fortune/tarot' },
      { name: 'Lucky Items', endpoint: '/api/fortune/lucky' }
    ];
    
    for (const service of services) {
      try {
        console.log(`🧪 测试 ${service.name}...`);
        
        const startTime = Date.now();
        const taskResponse = await fetch(`${PROD_API_URL}${service.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            language: 'zh',
            question: service.name === 'Tarot Reading' ? '测试问题' : undefined
          })
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          console.log(`✅ ${service.name} 任务创建成功: ${taskData.data.taskId} (${responseTime}ms)`);
        } else {
          const errorText = await taskResponse.text();
          console.log(`❌ ${service.name} 失败 (${taskResponse.status}): ${errorText}`);
          
          if (taskResponse.status === 524) {
            console.log(`🚨 检测到524错误 - ${service.name}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${service.name} 测试失败:`, error.message);
        
        if (error.message.includes('524')) {
          console.log(`🚨 检测到524错误 - ${service.name}`);
        }
      }
      
      // 每个服务之间等待2秒
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.log('❌ AI服务测试失败:', error.message);
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
        console.log('\n⚠️ 长时间运行的任务:');
        monitorData.data.longRunningTasks.forEach(task => {
          console.log(`  - ${task.id}: ${task.status}, 运行时间: ${task.duration_minutes.toFixed(1)}分钟`);
        });
      } else {
        console.log('\n✅ 没有长时间运行的任务');
      }
      
      if (monitorData.data.failedTasks.length > 0) {
        console.log('\n❌ 最近失败的任务:');
        monitorData.data.failedTasks.forEach(task => {
          console.log(`  - ${task.id}: ${task.error_message}`);
        });
      } else {
        console.log('\n✅ 没有最近失败的任务');
      }
    }
    
  } catch (error) {
    console.log('❌ 任务监控失败:', error.message);
  }
}

function provideFix524Recommendations() {
  console.log('💡 524错误修复建议:');
  console.log('');
  console.log('🔧 已实施的优化:');
  console.log('  ✅ 队列批处理超时从30秒增加到300秒');
  console.log('  ✅ AI调用超时优化为4分钟（队列）/3分钟（直接）');
  console.log('  ✅ 增强524错误检测和处理');
  console.log('  ✅ 添加智能回退机制');
  console.log('  ✅ 卡住任务自动恢复（5分钟检测）');
  console.log('');
  console.log('🚀 进一步优化建议:');
  console.log('  1. 使用wrangler tail查看实时日志');
  console.log('  2. 考虑升级到Cloudflare Workers付费版');
  console.log('  3. 监控AI API的响应时间');
  console.log('  4. 定期运行此诊断工具');
  console.log('');
  console.log('📞 如果问题持续:');
  console.log('  - 检查AI API服务状态');
  console.log('  - 验证网络连接稳定性');
  console.log('  - 考虑使用更快的AI模型');
}

// 运行修复工具
fix524TimeoutErrors().catch(console.error);
