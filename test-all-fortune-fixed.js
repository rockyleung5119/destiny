// 测试所有AI占卜服务 - 修复版本
const LOCAL_API_URL = 'http://127.0.0.1:8787';

// 测试用户数据
const testUser = {
  email: 'test3@example.com',
  password: 'test123456',
  name: '王五',
  gender: 'male',
  birth_year: 1988,
  birth_month: 12,
  birth_day: 25,
  birth_hour: 8,
  birth_place: '广州市'
};

async function testAllFortuneServices() {
  console.log('🔮 测试所有AI占卜服务 - 修复版本');
  
  try {
    // 步骤1: 注册用户
    console.log('\n🔐 步骤1: 注册测试用户...');
    const registerResponse = await fetch(`${LOCAL_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      console.log('用户可能已存在，尝试登录...');
    }
    
    // 步骤2: 登录获取token
    console.log('\n🔐 步骤2: 登录获取token...');
    const loginResponse = await fetch(`${LOCAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 登录成功，获得token');
    
    // 步骤3: 测试八字精算
    console.log('\n🔮 步骤3: 测试八字精算...');
    const baziResponse = await fetch(`${LOCAL_API_URL}/api/fortune/bazi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    if (!baziResponse.ok) {
      console.error(`❌ 八字精算失败: ${baziResponse.status}`);
      const errorText = await baziResponse.text();
      console.error('错误详情:', errorText);
    } else {
      const baziData = await baziResponse.json();
      console.log('✅ 八字精算成功');
      console.log('分析长度:', baziData.data?.analysis?.length || 0, '字符');
      if (baziData.data?.analysis) {
        console.log('分析预览:', baziData.data.analysis.substring(0, 200) + '...');
      }
    }
    
    // 步骤4: 测试每日运势
    console.log('\n🌅 步骤4: 测试每日运势...');
    const dailyResponse = await fetch(`${LOCAL_API_URL}/api/fortune/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    if (!dailyResponse.ok) {
      console.error(`❌ 每日运势失败: ${dailyResponse.status}`);
      const errorText = await dailyResponse.text();
      console.error('错误详情:', errorText);
    } else {
      const dailyData = await dailyResponse.json();
      console.log('✅ 每日运势成功');
      console.log('分析长度:', dailyData.data?.analysis?.length || 0, '字符');
    }
    
    // 步骤5: 测试塔罗占卜
    console.log('\n🃏 步骤5: 测试塔罗占卜...');
    const tarotResponse = await fetch(`${LOCAL_API_URL}/api/fortune/tarot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: '我的事业发展如何', language: 'zh' })
    });
    
    if (!tarotResponse.ok) {
      console.error(`❌ 塔罗占卜失败: ${tarotResponse.status}`);
      const errorText = await tarotResponse.text();
      console.error('错误详情:', errorText);
    } else {
      const tarotData = await tarotResponse.json();
      console.log('✅ 塔罗占卜成功');
      console.log('分析长度:', tarotData.data?.analysis?.length || 0, '字符');
    }
    
    // 步骤6: 测试幸运物品
    console.log('\n🍀 步骤6: 测试幸运物品...');
    const luckyResponse = await fetch(`${LOCAL_API_URL}/api/fortune/lucky`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    if (!luckyResponse.ok) {
      console.error(`❌ 幸运物品失败: ${luckyResponse.status}`);
      const errorText = await luckyResponse.text();
      console.error('错误详情:', errorText);
    } else {
      const luckyData = await luckyResponse.json();
      console.log('✅ 幸运物品成功');
      console.log('分析长度:', luckyData.data?.analysis?.length || 0, '字符');
    }
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testAllFortuneServices();
