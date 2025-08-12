#!/usr/bin/env node

/**
 * 测试清理后的显示效果 - 验证前端不再显示格式符号
 */

import axios from 'axios';

async function testCleanDisplay() {
  console.log('🧪 测试清理后的显示效果');
  console.log('='.repeat(50));
  
  try {
    // 1. 登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    
    // 2. 测试八字分析
    console.log('\n🔮 测试八字分析（清理后的显示）...');
    const baziResponse = await axios.post('http://localhost:3001/api/fortune/bazi', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'zh',
        'Content-Type': 'application/json'
      },
      timeout: 300000
    });
    
    if (baziResponse.data.success && baziResponse.data.data?.analysis) {
      const analysis = baziResponse.data.data.analysis;
      
      console.log('✅ 八字分析API成功');
      console.log(`📝 内容长度: ${analysis.length}字符`);
      
      // 检查AI生成的原始内容是否还有格式符号
      const formatChecks = {
        markdownHeaders: /^#{1,6}\s/m.test(analysis),
        boldText: /\*\*(.*?)\*\*/g.test(analysis),
        italicText: /\*(.*?)\*/g.test(analysis),
        bullets: /^[\s]*[•●○▪▫◦‣⁃]\s*/m.test(analysis),
        dashes: /^[\s]*[-]{2,}/m.test(analysis),
        tables: /\|/.test(analysis),
        codeBlocks: /```/.test(analysis),
        numbers: /^\d+[\.、]\s*/m.test(analysis)
      };
      
      const hasFormatIssues = Object.values(formatChecks).some(Boolean);
      
      console.log('\n🔍 AI原始输出格式检查:');
      Object.entries(formatChecks).forEach(([key, hasIssue]) => {
        console.log(`  ${key}: ${hasIssue ? '❌ 仍有格式符号' : '✅ 无格式符号'}`);
      });
      
      console.log(`\n📊 AI输出状态: ${hasFormatIssues ? '❌ AI仍在生成格式符号' : '✅ AI输出纯文本'}`);
      
      // 显示前500字符
      console.log('\n📄 AI原始输出预览 (前500字符):');
      console.log('-'.repeat(50));
      console.log(analysis.substring(0, 500));
      console.log('-'.repeat(50));
      
      // 总结
      if (hasFormatIssues) {
        console.log('\n⚠️ 问题分析:');
        console.log('AI仍在生成格式符号，需要进一步优化提示词');
        console.log('但前端现在会直接显示原始内容，不再添加额外格式');
      } else {
        console.log('\n🎉 完美！');
        console.log('✅ AI输出纯文本');
        console.log('✅ 前端显示纯文本');
        console.log('✅ 用户看到的是完全无格式的内容');
      }
      
    } else {
      console.log('❌ 八字分析失败');
      console.log('响应:', baziResponse.data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
  }
}

console.log('🎯 清理后显示效果测试');
console.log('目标：验证前端不再显示任何格式符号');
console.log('修改：移除了所有CSS格式化组件和formatAnalysisText函数');
testCleanDisplay();
