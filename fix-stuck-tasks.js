// 快速修复卡住的任务
const PROD_API_URL = 'https://destiny-backend.wlk8s6v9y.workers.dev';

async function fixStuckTasks() {
  console.log('🔧 快速修复卡住的任务');
  console.log('='.repeat(50));
  
  try {
    // 步骤1: 触发卡住任务处理
    console.log('\n📊 Step 1: 触发卡住任务处理...');
    const stuckResponse = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
    const stuckData = await stuckResponse.json();
    
    console.log('✅ 卡住任务处理结果:', JSON.stringify(stuckData, null, 2));
    
    if (stuckData.success && stuckData.data.processed > 0) {
      console.log(`🎉 成功处理了 ${stuckData.data.processed} 个卡住的任务`);
    } else {
      console.log('ℹ️ 没有发现卡住的任务');
    }
    
    // 步骤2: 检查异步处理状态
    console.log('\n📊 Step 2: 检查异步处理状态...');
    try {
      const asyncResponse = await fetch(`${PROD_API_URL}/api/async-status`);
      const asyncData = await asyncResponse.json();
      console.log('✅ 异步处理状态:', asyncData.status);
      console.log('🎯 当前处理方法:', asyncData.currentMethod);
      
      if (asyncData.processingCheck) {
        console.log('📋 处理能力检查:');
        console.log(`  - Queue可用: ${asyncData.processingCheck.queueAvailable}`);
        console.log(`  - Durable Objects可用: ${asyncData.processingCheck.durableObjectsAvailable}`);
        console.log(`  - 直接处理可用: ${asyncData.processingCheck.directProcessingAvailable}`);
      }
    } catch (error) {
      console.log('❌ 异步状态检查失败:', error.message);
    }
    
    // 步骤3: 检查AI服务状态
    console.log('\n📊 Step 3: 检查AI服务状态...');
    try {
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
      console.log('❌ AI服务检查失败:', error.message);
    }
    
    console.log('\n📋 修复总结:');
    console.log('✅ 已触发卡住任务处理');
    console.log('✅ 已检查异步处理状态');
    console.log('✅ 已检查AI服务状态');
    
    console.log('\n💡 如果问题仍然存在:');
    console.log('1. 检查Worker日志: wrangler tail');
    console.log('2. 重新部署Worker: wrangler deploy');
    console.log('3. 检查环境变量配置');
    console.log('4. 联系技术支持');
    
  } catch (error) {
    console.error('❌ 修复过程失败:', error);
  }
}

// 运行修复
fixStuckTasks().catch(console.error);
