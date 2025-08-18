// 测试单个AI占卜服务
const LOCAL_API_URL = 'http://127.0.0.1:8787';

// 测试用户数据
const testUser = {
  email: 'test2@example.com',
  password: 'test123456',
  name: '李四',
  gender: 'female',
  birth_year: 1995,
  birth_month: 8,
  birth_day: 20,
  birth_hour: 10,
  birth_place: '上海市'
};

async function testSingleFortune() {
  console.log('🔮 测试单个AI占卜服务');
  
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
    
    // 步骤3: 测试每日运势（最简单的服务）
    console.log('\n🌅 步骤3: 测试每日运势...');
    const dailyResponse = await fetch(`${LOCAL_API_URL}/api/fortune/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log('响应状态:', dailyResponse.status);
    
    if (!dailyResponse.ok) {
      const errorText = await dailyResponse.text();
      console.error(`❌ 每日运势失败: ${dailyResponse.status}`);
      console.error('错误详情:', errorText);
    } else {
      const dailyData = await dailyResponse.json();
      console.log('✅ 每日运势成功');
      console.log('响应数据:', JSON.stringify(dailyData, null, 2));
      if (dailyData.data?.analysis) {
        console.log('分析长度:', dailyData.data.analysis.length, '字符');
        console.log('分析预览:', dailyData.data.analysis.substring(0, 300) + '...');
      }
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testSingleFortune();
