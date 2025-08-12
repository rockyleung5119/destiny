// 为完整用户添加会员权限
const axios = require('axios');

async function addMembershipToCompleteUser() {
  console.log('🔧 为完整用户添加会员权限...\n');

  try {
    // 1. 登录获取用户ID
    console.log('1️⃣ 登录获取用户信息...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'complete@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }

    console.log('✅ 登录成功');
    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    
    console.log('- 用户ID:', userId);
    console.log('- 用户姓名:', loginResponse.data.data.user.name);

    // 2. 添加会员权限
    console.log('\n2️⃣ 添加会员权限...');
    
    // 创建会员记录
    const membershipData = {
      userId: userId,
      type: 'premium',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年后
      features: ['bazi', 'daily', 'tarot', 'luckyitems']
    };

    // 由于没有直接的会员API，我们需要通过后端脚本添加
    console.log('💡 需要通过后端脚本添加会员权限');
    console.log('📝 建议的SQL插入语句:');
    console.log(`
INSERT INTO memberships (user_id, type, status, start_date, end_date, features, created_at, updated_at)
VALUES (${userId}, 'premium', 'active', datetime('now'), datetime('now', '+1 year'), 'bazi,daily,tarot,luckyitems', datetime('now'), datetime('now'));
    `);

    // 3. 验证会员状态
    console.log('\n3️⃣ 验证会员状态...');
    
    try {
      const membershipResponse = await axios.get('http://localhost:3001/api/membership/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (membershipResponse.data.success) {
        console.log('✅ 会员状态查询成功');
        console.log('- 会员类型:', membershipResponse.data.membership?.type);
        console.log('- 会员状态:', membershipResponse.data.membership?.status);
        console.log('- 可用功能:', membershipResponse.data.membership?.features);
      } else {
        console.log('❌ 会员状态查询失败:', membershipResponse.data.message);
      }
    } catch (error) {
      console.log('❌ 会员状态查询失败:', error.response?.data?.message || error.message);
    }

    console.log('\n💡 如果会员权限添加成功，可以重新测试所有功能');

  } catch (error) {
    console.error('❌ 添加会员权限失败:', error.response?.data || error.message);
  }
}

// 运行添加
addMembershipToCompleteUser();
