const axios = require('axios');

// 测试模态框集成功能
async function testModalIntegration() {
  console.log('🧪 测试模态框集成功能...\n');

  try {
    // 1. 测试登录
    console.log('1️⃣ 测试登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      
      // 2. 测试各种分析API
      const services = [
        { id: 'bazi-analysis', name: '八字精算', endpoint: 'bazi' },
        { id: 'daily-fortune', name: '每日运势', endpoint: 'daily' },
        { id: 'tarot-reading', name: '塔罗占卜', endpoint: 'tarot' },
        { id: 'lucky-items', name: '幸运物品', endpoint: 'lucky-items' }
      ];

      for (const service of services) {
        console.log(`\n🔮 测试 ${service.name}...`);
        
        try {
          const response = await axios.post(`http://localhost:3000/api/fortune/${service.endpoint}`, {
            name: '测试用户',
            gender: 'male',
            birthDate: '1990-01-01',
            birthPlace: '北京，中国'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            console.log(`✅ ${service.name} - API调用成功`);
            console.log(`📝 分析结果长度: ${response.data.data.analysis.length} 字符`);
            console.log(`🎯 分析预览: ${response.data.data.analysis.substring(0, 100)}...`);
            
            // 检查返回数据结构
            const data = response.data.data;
            if (data.overallScore) {
              console.log(`📊 综合评分: ${data.overallScore}/100`);
            }
            if (data.fortune) {
              console.log(`💼 事业运势: ${data.fortune.career?.score || 'N/A'}/100`);
              console.log(`💰 财富运势: ${data.fortune.wealth?.score || 'N/A'}/100`);
              console.log(`❤️ 感情运势: ${data.fortune.love?.score || 'N/A'}/100`);
              console.log(`🏥 健康运势: ${data.fortune.health?.score || 'N/A'}/100`);
            }
          } else {
            console.log(`❌ ${service.name} - API调用失败:`, response.data.message);
          }
        } catch (error) {
          if (error.response?.status === 429) {
            console.log(`⏰ ${service.name} - 请求过于频繁，跳过测试`);
          } else {
            console.log(`❌ ${service.name} - 请求错误:`, error.response?.data?.message || error.message);
          }
        }
        
        // 添加延迟避免频率限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 3. 测试前端页面访问
      console.log('\n🌐 测试前端页面访问...');
      try {
        const frontendResponse = await axios.get('http://localhost:5175');
        if (frontendResponse.status === 200) {
          console.log('✅ 前端页面访问成功');
          console.log(`📄 页面大小: ${Math.round(frontendResponse.data.length / 1024)}KB`);
        }
      } catch (error) {
        console.log('❌ 前端页面访问失败:', error.message);
      }

    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }

  console.log('\n🎉 模态框集成测试完成！');
  console.log('\n📋 使用说明:');
  console.log('1. 访问 http://localhost:5175');
  console.log('2. 滚动到 Services 部分');
  console.log('3. 点击任意服务的 "Start Analysis" 按钮');
  console.log('4. 如果未登录，会显示权限提示');
  console.log('5. 登录后，会弹出分析模态框');
  console.log('6. 填写表单信息并提交');
  console.log('7. 查看AI分析结果');
}

// 运行测试
testModalIntegration();
