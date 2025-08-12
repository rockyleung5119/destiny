const axios = require('axios');

// 验证AI原始输出修复
async function verifyRawOutput() {
  console.log('🔍 验证AI原始输出修复效果\n');

  try {
    // 获取token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ 登录失败');
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ 获取token成功');

    // 测试八字分析
    console.log('\n🔮 测试八字分析原始输出...');
    console.log('⏳ 请耐心等待AI分析（最多5分钟）...');
    
    const startTime = Date.now();
    
    const baziResponse = await axios.post('http://localhost:3001/api/fortune/bazi', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'zh',
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5分钟超时
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`\n✅ 八字分析完成！`);
    console.log(`⏱️ 响应时间: ${responseTime}ms (${(responseTime/1000).toFixed(1)}秒)`);
    
    if (baziResponse.data.success) {
      const data = baziResponse.data.data;
      console.log('\n📊 响应数据结构:');
      console.log('- success:', baziResponse.data.success);
      console.log('- message:', baziResponse.data.message);
      console.log('- data.type:', data.type);
      console.log('- data.analysisType:', data.analysisType);
      console.log('- data.analysis 长度:', data.analysis?.length || 0);
      console.log('- data.aiAnalysis 长度:', data.aiAnalysis?.length || 0);

      if (data.aiAnalysis) {
        const content = data.aiAnalysis;
        console.log(`\n📝 AI原始输出长度: ${content.length} 字符`);
        
        // 检查关键排盘信息
        const keyInfo = {
          '四柱排列': content.includes('四柱') || content.includes('年柱'),
          '天干地支': content.includes('天干') || content.includes('地支'),
          '五行分布': content.includes('五行') || content.includes('金木水火土'),
          '十神配置': content.includes('十神') || content.includes('正官'),
          '格局判断': content.includes('格局') || content.includes('格'),
          '用神喜忌': content.includes('用神') || content.includes('喜忌'),
          'Markdown符号': content.includes('#') || content.includes('**')
        };

        console.log('\n🔍 关键信息检查:');
        Object.entries(keyInfo).forEach(([key, exists]) => {
          console.log(`   ${exists ? '✅' : '❌'} ${key}: ${exists ? '存在' : '缺失'}`);
        });

        console.log('\n📝 AI输出预览 (前800字符):');
        console.log('='.repeat(60));
        console.log(content.substring(0, 800));
        console.log('='.repeat(60));

        if (content.includes('四柱') && content.includes('五行') && content.includes('十神')) {
          console.log('\n🎉 成功！AI原始输出包含完整的排盘信息！');
        } else {
          console.log('\n⚠️ 警告：AI输出可能仍缺少关键排盘信息');
        }

      } else {
        console.log('\n❌ 没有找到aiAnalysis字段');
      }

    } else {
      console.log('\n❌ 八字分析失败:', baziResponse.data.message);
    }

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('\n❌ 仍然超时 - 需要进一步优化');
    } else {
      console.log('\n❌ 测试失败:', error.message);
    }
  }

  console.log('\n🎯 修复总结:');
  console.log('✅ 后端: 完全移除所有清理函数');
  console.log('✅ 前端: 完全移除所有处理函数');
  console.log('✅ 超时: 增加到300秒（5分钟）');
  console.log('✅ 数据结构: 添加aiAnalysis字段');

  console.log('\n🔮 现在您应该能看到:');
  console.log('- 完整的八字排盘详解');
  console.log('- 详细的四柱天干地支组合');
  console.log('- 完整的五行分布分析');
  console.log('- 详细的十神配置');
  console.log('- 所有AI生成的专业术语');
  console.log('- 包括markdown格式的原始输出');
}

verifyRawOutput();
