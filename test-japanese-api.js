const axios = require('axios');

async function testJapaneseAPI() {
  try {
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      
      console.log('🧪 测试日语八字分析API...');
      const jaResponse = await axios.post('http://localhost:3001/api/fortune/bazi', {}, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'X-Language': 'ja'
        }
      });
      
      if (jaResponse.data.success) {
        console.log('✅ 日语八字分析API调用成功');
        const analysis = jaResponse.data.data.analysis;
        console.log('📝 分析结果前300字符:');
        console.log(analysis.substring(0, 300));
        console.log('...');
        
        // 检查语言特征
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(analysis);
        
        if (hasJapanese) {
          console.log('✅ 检测到日语字符！');
          if (analysis.includes('八字排盤詳細分析レポート')) {
            console.log('✅ 确认返回了日语版本的八字分析！');
          } else {
            console.log('⚠️  包含日语字符但可能不是完整的日语版本');
          }
        } else {
          console.log('❌ 未检测到日语字符，仍然是中文输出');
        }
        
        // 检查是否包含中文
        if (analysis.includes('八字排盘详细分析报告')) {
          console.log('❌ 检测到中文标题，返回的是中文版本');
        }
        
      } else {
        console.log('❌ API调用失败:', jaResponse.data.message);
      }
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
  }
}

testJapaneseAPI();
