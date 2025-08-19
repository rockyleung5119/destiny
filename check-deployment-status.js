// 检查部署状态的脚本
const WORKER_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function checkDeploymentStatus() {
  console.log('🔍 检查部署状态...');
  console.log('='.repeat(50));
  
  const tests = [
    {
      name: '健康检查',
      url: `${WORKER_URL}/api/health`,
      expectedStatus: 200,
      expectedContent: 'status'
    },
    {
      name: '异步状态检查',
      url: `${WORKER_URL}/api/async-status`,
      expectedStatus: 200,
      expectedContent: 'queueAvailable'
    },
    {
      name: 'AI状态检查',
      url: `${WORKER_URL}/api/ai-status`,
      expectedStatus: 200,
      expectedContent: 'config'
    },
    {
      name: '任务监控',
      url: `${WORKER_URL}/api/admin/task-monitor`,
      expectedStatus: 200,
      expectedContent: 'stats'
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 测试: ${test.name}`);
      console.log(`📡 URL: ${test.url}`);
      
      const response = await fetch(test.url);
      const responseText = await response.text();
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ 状态码正确: ${response.status}`);
        
        if (responseText.includes(test.expectedContent)) {
          console.log(`✅ 内容验证通过: 包含 "${test.expectedContent}"`);
          passedTests++;
        } else {
          console.log(`❌ 内容验证失败: 不包含 "${test.expectedContent}"`);
          console.log(`📄 响应内容: ${responseText.substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ 状态码错误: 期望 ${test.expectedStatus}, 实际 ${response.status}`);
        console.log(`📄 响应内容: ${responseText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
    }
  }
  
  console.log('\n📊 测试总结:');
  console.log('='.repeat(30));
  console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
  console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！部署成功！');
    console.log('\n🚀 可用功能:');
    console.log('  ✅ Cloudflare Workers');
    console.log('  ✅ Durable Objects');
    console.log('  ✅ Cloudflare Queues');
    console.log('  ✅ 长时间AI处理支持');
    console.log('  ✅ 异步任务处理');
    console.log('  ✅ 自动任务恢复');
    
    return true;
  } else {
    console.log('\n❌ 部分测试失败，请检查部署配置');
    console.log('\n🔧 故障排除建议:');
    console.log('  1. 检查环境变量配置');
    console.log('  2. 验证Cloudflare API权限');
    console.log('  3. 检查wrangler.toml配置');
    console.log('  4. 查看GitHub Actions日志');
    
    return false;
  }
}

// 如果作为脚本直接运行
if (require.main === module) {
  checkDeploymentStatus()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 检查过程失败:', error);
      process.exit(1);
    });
}

module.exports = { checkDeploymentStatus };
