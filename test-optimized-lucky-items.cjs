const axios = require('axios');

async function testOptimizedLuckyItems() {
  console.log('🧪 测试优化后的幸运物品功能...\n');

  const baseURL = 'http://localhost:3001';
  
  // 测试用户登录信息
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };

  try {
    // 1. 登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 测试中文幸运物品
    console.log('\n📿 测试中文幸运物品...');
    const chineseResponse = await axios.post(`${baseURL}/fortune/lucky-items`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'zh'
      }
    });
    
    if (chineseResponse.data.success) {
      console.log('✅ 中文幸运物品成功');
      const analysis = chineseResponse.data.data.analysis || chineseResponse.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前300个字符:', analysis.substring(0, 300));
      
      // 检查是否包含新的结构
      const hasAdjustmentPlan = analysis.includes("五行调理方案") || analysis.includes("调理方法");
      const hasLifePlanning = analysis.includes("人生规划建议") || analysis.includes("事业发展");
      const hasSummary = analysis.includes("总结") || analysis.includes("核心调理要点");
      const hasDetailedBazi = analysis.includes("八字格局") || analysis.includes("日主强弱");
      
      console.log(`🔍 包含五行调理方案: ${hasAdjustmentPlan}`);
      console.log(`🔍 包含人生规划建议: ${hasLifePlanning}`);
      console.log(`🔍 包含总结: ${hasSummary}`);
      console.log(`🔍 包含详细八字分析: ${hasDetailedBazi}`);
      
      if (hasAdjustmentPlan && hasLifePlanning && hasSummary && !hasDetailedBazi) {
        console.log('🎉 中文幸运物品结构优化成功！');
      } else {
        console.log('⚠️ 中文幸运物品结构可能需要调整');
      }
    } else {
      console.log('❌ 中文幸运物品失败:', chineseResponse.data.message);
    }

    // 3. 测试英文幸运物品
    console.log('\n📿 测试英文幸运物品...');
    const englishResponse = await axios.post(`${baseURL}/fortune/lucky-items`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'en'
      }
    });
    
    if (englishResponse.data.success) {
      console.log('✅ 英文幸运物品成功');
      const analysis = englishResponse.data.data.analysis || englishResponse.data.data;
      console.log('📝 分析结果长度:', analysis.length);
      console.log('📝 前300个字符:', analysis.substring(0, 300));
      
      // 检查是否包含新的结构
      const hasAdjustmentPlan = analysis.includes("Five Elements Adjustment Plan") || analysis.includes("Adjustment Methods");
      const hasLifePlanning = analysis.includes("Life Planning Suggestions") || analysis.includes("Career Development");
      const hasSummary = analysis.includes("Summary") || analysis.includes("Core Adjustment Points");
      const hasDetailedBazi = analysis.includes("BaZi pattern") || analysis.includes("Day Master strength");
      const hasChinese = /[\u4e00-\u9fff]/.test(analysis.substring(0, 500));
      
      console.log(`🔍 包含五行调理方案: ${hasAdjustmentPlan}`);
      console.log(`🔍 包含人生规划建议: ${hasLifePlanning}`);
      console.log(`🔍 包含总结: ${hasSummary}`);
      console.log(`🔍 包含详细八字分析: ${hasDetailedBazi}`);
      console.log(`🔍 包含中文: ${hasChinese}`);
      
      if (hasAdjustmentPlan && hasLifePlanning && hasSummary && !hasDetailedBazi && !hasChinese) {
        console.log('🎉 英文幸运物品结构优化成功！');
      } else {
        console.log('⚠️ 英文幸运物品结构可能需要调整');
      }
    } else {
      console.log('❌ 英文幸运物品失败:', englishResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.response?.data?.message || error.message);
  }
}

// 运行测试
testOptimizedLuckyItems();
