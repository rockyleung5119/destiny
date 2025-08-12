const axios = require('axios');

async function testMultilangSummary() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔐 登录测试用户...');
  const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (!loginResponse.data.success) {
    console.log('❌ 登录失败');
    return;
  }
  
  const token = loginResponse.data.token;
  console.log('✅ 登录成功');
  
  const results = {
    english: {},
    chinese: {}
  };
  
  // 测试功能列表
  const features = [
    { name: '每日运势', endpoint: '/daily', key: 'daily' },
    { name: '八字分析', endpoint: '/bazi', key: 'bazi' },
    { name: '塔罗占卜', endpoint: '/tarot', key: 'tarot', body: { question: "What should I focus on?" } },
    { name: '幸运物品', endpoint: '/lucky-items', key: 'lucky' }
  ];
  
  console.log('\n🌍 开始多语言功能测试...\n');
  
  for (const feature of features) {
    console.log(`📊 测试${feature.name}...`);
    
    // 测试英文版本
    try {
      const response = await axios.post(`${baseURL}/api/fortune${feature.endpoint}`, feature.body || {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Language': 'en'
        }
      });
      
      if (response.data.success) {
        const analysis = response.data.data.analysis || response.data.data;
        const hasChinese = /[\u4e00-\u9fff]/.test(analysis.substring(0, 500));
        const hasEnglish = /[a-zA-Z]{20,}/.test(analysis.substring(0, 500));
        
        results.english[feature.key] = {
          success: true,
          length: analysis.length,
          hasChinese: hasChinese,
          hasEnglish: hasEnglish,
          correct: hasEnglish && !hasChinese
        };
        
        console.log(`  ✅ 英文版本: ${results.english[feature.key].correct ? '正确' : '有问题'} (长度: ${analysis.length})`);
      } else {
        results.english[feature.key] = { success: false, error: response.data.message };
        console.log(`  ❌ 英文版本失败: ${response.data.message}`);
      }
    } catch (error) {
      results.english[feature.key] = { success: false, error: error.message };
      console.log(`  ❌ 英文版本出错: ${error.message}`);
    }
    
    // 等待避免限流
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 测试中文版本
    try {
      const response = await axios.post(`${baseURL}/api/fortune${feature.endpoint}`, feature.body ? { question: "我应该关注什么？" } : {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Language': 'zh'
        }
      });
      
      if (response.data.success) {
        const analysis = response.data.data.analysis || response.data.data;
        const hasChinese = /[\u4e00-\u9fff]/.test(analysis.substring(0, 500));
        const hasEnglish = /[a-zA-Z]{20,}/.test(analysis.substring(0, 500));
        
        results.chinese[feature.key] = {
          success: true,
          length: analysis.length,
          hasChinese: hasChinese,
          hasEnglish: hasEnglish,
          correct: hasChinese && !hasEnglish
        };
        
        console.log(`  ✅ 中文版本: ${results.chinese[feature.key].correct ? '正确' : '有问题'} (长度: ${analysis.length})`);
      } else {
        results.chinese[feature.key] = { success: false, error: response.data.message };
        console.log(`  ❌ 中文版本失败: ${response.data.message}`);
      }
    } catch (error) {
      results.chinese[feature.key] = { success: false, error: error.message };
      console.log(`  ❌ 中文版本出错: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 生成测试报告
  console.log('📋 多语言功能测试报告');
  console.log('='.repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const feature of features) {
    console.log(`\n${feature.name}:`);
    
    // 英文版本
    const enResult = results.english[feature.key];
    if (enResult && enResult.success) {
      totalTests++;
      if (enResult.correct) {
        passedTests++;
        console.log(`  🎉 英文版本: 正确`);
      } else {
        console.log(`  ⚠️ 英文版本: 语言混合问题`);
      }
    } else {
      totalTests++;
      console.log(`  ❌ 英文版本: 失败`);
    }
    
    // 中文版本
    const zhResult = results.chinese[feature.key];
    if (zhResult && zhResult.success) {
      totalTests++;
      if (zhResult.correct) {
        passedTests++;
        console.log(`  🎉 中文版本: 正确`);
      } else {
        console.log(`  ⚠️ 中文版本: 语言混合问题`);
      }
    } else {
      totalTests++;
      console.log(`  ❌ 中文版本: 失败`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过 (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有多语言功能测试通过！');
  } else {
    console.log('⚠️ 部分功能需要修复');
  }
}

testMultilangSummary().catch(console.error);
