// 测试登录和权限功能
const axios = require('./backend/node_modules/axios').default;

const BASE_URL = 'http://localhost:3001/api';

async function testLoginAndPermissions() {
  try {
    console.log('🔐 测试登录功能...\n');
    
    // 1. 登录测试账号
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ 登录成功');
    console.log('👤 用户:', loginResponse.data.user.name);
    console.log('📧 邮箱:', loginResponse.data.user.email);
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // 2. 检查会员状态
    console.log('\n👑 检查会员状态...');
    const membershipResponse = await axios.get(`${BASE_URL}/membership/status`, { headers });
    
    if (membershipResponse.data.success) {
      const membership = membershipResponse.data.membership;
      console.log('✅ 会员状态查询成功');
      console.log('📊 会员等级:', membership.planId || '无会员');
      console.log('🔓 激活状态:', membership.isActive ? '已激活' : '未激活');
      console.log('📅 到期时间:', membership.expiresAt || '无');
      console.log('💎 会员计划:', membership.plan?.name || '未知');
      console.log('🎯 功能权限:', membership.plan?.features?.join(', ') || '无');
    } else {
      console.error('❌ 会员状态查询失败:', membershipResponse.data.message);
    }
    
    // 3. 测试算命功能权限
    console.log('\n🔮 测试算命功能权限...');
    
    const fortuneTests = [
      { name: '八字精算', endpoint: '/fortune/bazi', data: { birthYear: 1990, birthMonth: 5, birthDay: 15, birthHour: 10 } },
      { name: '每日运势', endpoint: '/fortune/daily', data: {} },
      { name: '天体塔罗', endpoint: '/fortune/tarot', data: { question: '我的事业发展如何？' } },
      { name: '幸运物品', endpoint: '/fortune/lucky-items', data: {} }
    ];
    
    for (const test of fortuneTests) {
      try {
        console.log(`\n🎯 测试 ${test.name}...`);
        const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.data, { headers });
        
        if (response.data.success) {
          console.log(`✅ ${test.name} - 权限验证通过`);
          const analysis = response.data.data?.analysis || response.data.result || '';
          console.log(`📝 分析结果长度: ${analysis.length} 字符`);
          if (analysis.length > 0) {
            console.log(`🎯 分析预览: ${analysis.substring(0, 100)}...`);
          }
        } else {
          console.log(`❌ ${test.name} - ${response.data.message}`);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`🚫 ${test.name} - 权限不足: ${error.response.data.message}`);
        } else if (error.response?.status === 429) {
          console.log(`⏰ ${test.name} - 请求过于频繁: ${error.response.data.message}`);
        } else {
          console.log(`❌ ${test.name} - 错误: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.message || error.message);
  }
}

// 运行测试
testLoginAndPermissions();
