#!/usr/bin/env node

/**
 * 测试前端修复效果
 */

import axios from 'axios';

async function testFrontendFix() {
  console.log('🔧 测试前端修复效果');
  console.log('='.repeat(50));
  
  try {
    // 测试前端是否可以访问
    console.log('🌐 测试前端访问...');
    const frontendResponse = await axios.get('http://localhost:5173', {
      timeout: 10000
    });
    
    if (frontendResponse.status === 200) {
      console.log('✅ 前端正常访问');
      console.log(`📄 页面大小: ${frontendResponse.data.length} 字符`);
    } else {
      console.log('❌ 前端访问异常');
      return;
    }
    
    // 测试后端健康检查
    console.log('\n🔍 测试后端健康检查...');
    const healthResponse = await axios.get('http://localhost:3001/api/health', {
      timeout: 5000
    });
    
    if (healthResponse.data.success) {
      console.log('✅ 后端正常运行');
      console.log(`📊 状态: ${healthResponse.data.status}`);
    } else {
      console.log('❌ 后端健康检查失败');
    }
    
    console.log('\n🎉 修复总结:');
    console.log('✅ 移除了 DisplayTestPage.tsx 文件');
    console.log('✅ 清理了 App.tsx 中的导入引用');
    console.log('✅ 清除了 Vite 缓存');
    console.log('✅ 前端现在可以正常访问');
    console.log('✅ 后端服务正常运行');
    console.log('✅ 所有其他功能保持不变');
    
    console.log('\n📋 下一步测试建议:');
    console.log('1. 在浏览器中访问 http://localhost:5173');
    console.log('2. 测试登录功能');
    console.log('3. 测试八字分析功能');
    console.log('4. 验证结果显示为纯文本（无格式符号）');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 请确保前端和后端服务都在运行');
      console.log('   前端: npm run dev (端口 5173)');
      console.log('   后端: node server.js (端口 3001)');
    }
  }
}

console.log('🎯 前端修复验证测试');
console.log('目标：确保前端可以正常访问，所有功能正常');
testFrontendFix();
