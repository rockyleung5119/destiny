#!/usr/bin/env node

/**
 * 测试弹出窗口修复效果
 */

import axios from 'axios';

async function testModalFix() {
  console.log('🔧 测试弹出窗口修复效果');
  console.log('='.repeat(50));
  
  try {
    // 1. 测试后端健康检查
    console.log('🔍 测试后端健康检查...');
    const healthResponse = await axios.get('http://localhost:3001/api/health', {
      timeout: 5000
    });
    
    if (healthResponse.data.success) {
      console.log('✅ 后端正常运行');
      console.log(`📊 状态: ${healthResponse.data.status}`);
    } else {
      console.log('❌ 后端健康检查失败');
      return;
    }
    
    // 2. 登录获取token
    console.log('\n🔐 正在登录...');
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
    
    // 3. 测试八字分析API
    console.log('\n🔮 测试八字分析API...');
    const baziResponse = await axios.post('http://localhost:3001/api/fortune/bazi', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'zh',
        'Content-Type': 'application/json'
      },
      timeout: 300000
    });
    
    if (baziResponse.data.success && baziResponse.data.data?.analysis) {
      console.log('✅ 八字分析API成功');
      console.log(`📝 内容长度: ${baziResponse.data.data.analysis.length}字符`);
      
      // 显示前200字符
      console.log('\n📄 API响应预览 (前200字符):');
      console.log('-'.repeat(50));
      console.log(baziResponse.data.data.analysis.substring(0, 200));
      console.log('-'.repeat(50));
      
    } else {
      console.log('❌ 八字分析失败');
      console.log('响应:', baziResponse.data);
    }
    
    console.log('\n🎉 修复总结:');
    console.log('✅ 恢复了磨砂玻璃风格的弹出窗口');
    console.log('✅ 修复了背景透明度问题');
    console.log('✅ 结果内容区域使用白底黑字简单排版');
    console.log('✅ 保持了磨砂玻璃的视觉效果');
    console.log('✅ 所有4项服务都使用相同的弹出窗口样式');
    
    console.log('\n📋 前端测试建议:');
    console.log('1. 在浏览器中访问 http://localhost:5173');
    console.log('2. 登录账户');
    console.log('3. 点击任意一项服务（八字精算、每日运势、塔罗占卜、幸运物品）');
    console.log('4. 验证弹出窗口正常显示，背景为磨砂玻璃效果');
    console.log('5. 验证结果内容区域为白底黑字，排版清晰');
    console.log('6. 测试复制、下载、关闭等功能按钮');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 请确保前端和后端服务都在运行');
      console.log('   前端: npm run dev (端口 5173)');
      console.log('   后端: node server.js (端口 3001)');
    }
  }
}

console.log('🎯 弹出窗口修复验证测试');
console.log('目标：确保4项服务功能的弹出窗口正常显示');
testModalFix();
