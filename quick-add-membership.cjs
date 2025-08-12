// 快速为demo用户添加会员权限
const axios = require('axios');

async function quickAddMembership() {
  console.log('🔧 快速为demo用户添加会员权限...\n');

  try {
    // 1. 获取demo用户ID
    console.log('1️⃣ 获取demo用户信息...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'demo@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }

    const userId = loginResponse.data.data.user.id;
    console.log('✅ 获取用户ID:', userId);

    // 2. 直接通过HTTP请求添加会员记录
    console.log('\n2️⃣ 添加会员记录...');
    
    // 创建一个临时的添加会员的API调用
    // 由于我们无法直接操作数据库，我们需要通过其他方式
    
    console.log('💡 需要手动添加会员权限');
    console.log('📝 SQL语句:');
    console.log(`
-- 删除现有会员记录
DELETE FROM memberships WHERE user_id = ${userId};

-- 添加新的会员记录
INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits, created_at, updated_at)
VALUES (${userId}, 'monthly', 1, datetime('now', '+1 year'), null, datetime('now'), datetime('now'));
    `);

    console.log('\n💡 或者，我们可以修改后端代码临时跳过会员检查');
    console.log('🔧 建议：在fortune.js路由中临时注释掉checkMembership中间件');

    console.log('\n3️⃣ 测试当前会员状态...');
    const token = loginResponse.data.data.token;
    
    try {
      const membershipResponse = await axios.get('http://localhost:3001/api/membership/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 当前会员状态:', membershipResponse.data);
    } catch (error) {
      console.log('❌ 会员状态查询失败:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.response?.data || error.message);
  }
}

// 运行操作
quickAddMembership();
