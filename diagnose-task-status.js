// 任务状态诊断工具
const PROD_API_URL = 'https://destiny-backend.wlk8s6v9y.workers.dev';

async function diagnoseTaskStatus() {
  console.log('🔍 AI任务状态诊断工具');
  console.log('='.repeat(50));
  
  try {
    // 步骤1: 检查API健康状态
    console.log('\n📊 Step 1: 检查API健康状态...');
    try {
      const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
      const healthData = await healthResponse.json();
      console.log('✅ API健康状态:', healthData.status);
    } catch (error) {
      console.log('❌ API健康检查失败:', error.message);
    }
    
    // 步骤2: 检查异步处理状态
    console.log('\n📊 Step 2: 检查异步处理状态...');
    try {
      const asyncResponse = await fetch(`${PROD_API_URL}/api/async-status`);
      const asyncData = await asyncResponse.json();
      console.log('✅ 异步处理状态:', asyncData.status);
      console.log('🎯 当前处理方法:', asyncData.currentMethod);
      console.log('📋 处理能力:', JSON.stringify(asyncData.processingCheck, null, 2));
    } catch (error) {
      console.log('❌ 异步状态检查失败:', error.message);
    }
    
    // 步骤3: 检查AI服务状态
    console.log('\n📊 Step 3: 检查AI服务状态...');
    try {
      const aiResponse = await fetch(`${PROD_API_URL}/api/ai-status`);
      const aiData = await aiResponse.json();
      console.log('✅ AI服务状态:', aiData.status);
      console.log('🔧 AI配置:', JSON.stringify(aiData.config, null, 2));
    } catch (error) {
      console.log('❌ AI服务检查失败:', error.message);
    }
    
    // 步骤4: 检查定时任务处理
    console.log('\n📊 Step 4: 触发卡住任务处理...');
    try {
      const stuckResponse = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
      const stuckData = await stuckResponse.json();
      console.log('✅ 卡住任务处理结果:', JSON.stringify(stuckData, null, 2));
    } catch (error) {
      console.log('❌ 卡住任务处理失败:', error.message);
    }
    
    // 步骤5: 模拟登录并测试任务创建
    console.log('\n📊 Step 5: 测试任务创建和状态查询...');
    try {
      // 模拟登录
      const loginResponse = await fetch(`${PROD_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test123456'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        const token = loginData.data.token;
        console.log('✅ 登录成功');
        
        // 创建测试任务
        const taskResponse = await fetch(`${PROD_API_URL}/api/fortune/bazi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            language: 'zh'
          })
        });
        
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          const taskId = taskData.data.taskId;
          console.log(`✅ 任务创建成功: ${taskId}`);
          
          // 立即检查任务状态
          const statusResponse = await fetch(`${PROD_API_URL}/api/fortune/task/${taskId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('📊 初始任务状态:', JSON.stringify(statusData.data, null, 2));
            
            // 等待30秒后再次检查
            console.log('\n⏳ 等待30秒后再次检查...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            const status2Response = await fetch(`${PROD_API_URL}/api/fortune/task/${taskId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (status2Response.ok) {
              const status2Data = await status2Response.json();
              console.log('📊 30秒后任务状态:', JSON.stringify(status2Data.data, null, 2));
              
              // 分析状态变化
              if (statusData.data.status === status2Data.data.status) {
                console.log('⚠️ 任务状态未发生变化，可能存在处理问题');
              } else {
                console.log('✅ 任务状态正常变化');
              }
            }
          }
        } else {
          console.log('❌ 任务创建失败');
        }
      } else {
        console.log('⚠️ 登录失败，跳过任务测试');
      }
    } catch (error) {
      console.log('❌ 任务测试失败:', error.message);
    }
    
    console.log('\n📋 诊断总结:');
    console.log('1. 检查API健康状态');
    console.log('2. 检查异步处理配置');
    console.log('3. 检查AI服务配置');
    console.log('4. 触发卡住任务处理');
    console.log('5. 测试任务创建和状态查询');
    console.log('\n💡 如果任务卡在pending或processing状态:');
    console.log('- 检查队列是否正常工作');
    console.log('- 检查Durable Objects是否可用');
    console.log('- 检查AI API密钥是否有效');
    console.log('- 查看Worker日志: wrangler tail');
    
  } catch (error) {
    console.error('❌ 诊断过程失败:', error);
  }
}

// 运行诊断
diagnoseTaskStatus().catch(console.error);
