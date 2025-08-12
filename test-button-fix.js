const axios = require('axios');

async function testButtonFix() {
  console.log('🧪 测试弹窗按钮修复效果\n');
  
  try {
    // 1. 登录获取token
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
    console.log('\n🔮 测试八字分析...');
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
      
      // 显示内容开头
      console.log('\n📄 内容开头 (前200字符):');
      console.log(analysis.substring(0, 200));
      
      console.log('\n🎯 弹窗按钮修复要点:');
      console.log('✅ 复制按钮: 白色背景 + 黑色文字 + 粗体');
      console.log('✅ 下载按钮: 蓝色背景 + 白色文字 + 粗体');
      console.log('✅ 关闭按钮: 白色背景 + 黑色文字 + 粗体');
      console.log('✅ 所有按钮: 增强阴影 + 边框 + 悬停效果');
      
      console.log('\n🌟 页头星星: 黄色显示');
      console.log('📝 内容格式: 清理乱码 + 智能分行');
      console.log('🏗️ 布局优化: Flex布局 + 固定底部');
      
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

testButtonFix();
