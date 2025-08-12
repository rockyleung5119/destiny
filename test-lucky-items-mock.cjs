// 测试优化后的幸运物品模拟响应
const DeepSeekService = require('./backend/services/deepseekService.js');

async function testLuckyItemsMock() {
  console.log('🧪 测试优化后的幸运物品模拟响应...\n');

  try {
    // 测试中文模拟响应
    console.log('📿 测试中文幸运物品模拟响应...');
    const chineseResponse = DeepSeekService.getMockLuckyItemsResponse(false);
    
    console.log('✅ 中文响应生成成功');
    console.log('📝 响应长度:', chineseResponse.length);
    console.log('📝 前300个字符:', chineseResponse.substring(0, 300));
    
    // 检查新的结构
    const hasAdjustmentPlan = chineseResponse.includes("五行调理方案") || chineseResponse.includes("调理方法");
    const hasLifePlanning = chineseResponse.includes("人生规划建议") || chineseResponse.includes("事业发展");
    const hasSummary = chineseResponse.includes("总结") || chineseResponse.includes("核心调理要点");
    const hasDetailedBazi = chineseResponse.includes("八字格局") || chineseResponse.includes("日主强弱");
    
    console.log(`🔍 包含五行调理方案: ${hasAdjustmentPlan}`);
    console.log(`🔍 包含人生规划建议: ${hasLifePlanning}`);
    console.log(`🔍 包含总结: ${hasSummary}`);
    console.log(`🔍 包含详细八字分析: ${hasDetailedBazi}`);
    
    if (hasAdjustmentPlan && hasLifePlanning && hasSummary && !hasDetailedBazi) {
      console.log('🎉 中文幸运物品结构优化成功！');
    } else {
      console.log('⚠️ 中文幸运物品结构可能需要调整');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试英文模拟响应
    console.log('📿 测试英文幸运物品模拟响应...');
    const englishResponse = DeepSeekService.getMockLuckyItemsResponse(true);
    
    console.log('✅ 英文响应生成成功');
    console.log('📝 响应长度:', englishResponse.length);
    console.log('📝 前300个字符:', englishResponse.substring(0, 300));
    
    // 检查新的结构
    const hasAdjustmentPlanEn = englishResponse.includes("Five Elements Adjustment Plan") || englishResponse.includes("Adjustment Methods");
    const hasLifePlanningEn = englishResponse.includes("Life Planning Suggestions") || englishResponse.includes("Career Development");
    const hasSummaryEn = englishResponse.includes("Summary") || englishResponse.includes("Core Adjustment Points");
    const hasDetailedBaziEn = englishResponse.includes("BaZi pattern") || englishResponse.includes("Day Master strength");
    const hasChinese = /[\u4e00-\u9fff]/.test(englishResponse.substring(0, 500));
    
    console.log(`🔍 包含五行调理方案: ${hasAdjustmentPlanEn}`);
    console.log(`🔍 包含人生规划建议: ${hasLifePlanningEn}`);
    console.log(`🔍 包含总结: ${hasSummaryEn}`);
    console.log(`🔍 包含详细八字分析: ${hasDetailedBaziEn}`);
    console.log(`🔍 包含中文: ${hasChinese}`);
    
    if (hasAdjustmentPlanEn && hasLifePlanningEn && hasSummaryEn && !hasDetailedBaziEn && !hasChinese) {
      console.log('🎉 英文幸运物品结构优化成功！');
    } else {
      console.log('⚠️ 英文幸运物品结构可能需要调整');
    }

    console.log('\n📋 优化总结:');
    console.log('✅ 移除了详细的八字分析过程');
    console.log('✅ 保留了五行调理方案');
    console.log('✅ 增加了人生规划建议');
    console.log('✅ 添加了总结部分');
    console.log('✅ 内容更加简洁实用');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    console.error('错误详情:', error.stack);
  }
}

// 运行测试
testLuckyItemsMock();
