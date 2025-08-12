// 为demo用户添加年费会员权限
const { dbRun, dbGet } = require('./backend/config/database');

async function addMembershipToDemo() {
  console.log('💎 为demo用户添加年费会员权限...\n');

  try {
    // 1. 查找demo用户
    console.log('🔍 查找demo用户...');
    const user = await dbGet('SELECT id, email, name FROM users WHERE email = ?', ['demo@example.com']);
    
    if (!user) {
      console.log('❌ 未找到demo用户');
      return;
    }

    console.log('✅ 找到用户:');
    console.log('- ID:', user.id);
    console.log('- 姓名:', user.name);
    console.log('- 邮箱:', user.email);

    // 2. 检查是否已有会员记录
    console.log('\n🔍 检查现有会员记录...');
    const existingMembership = await dbGet(
      'SELECT * FROM memberships WHERE user_id = ? AND is_active = TRUE',
      [user.id]
    );

    if (existingMembership) {
      console.log('⚠️  用户已有激活的会员记录:');
      console.log('- 计划ID:', existingMembership.plan_id);
      console.log('- 到期时间:', existingMembership.expires_at);
      console.log('- 剩余积分:', existingMembership.remaining_credits);
      
      // 更新现有会员记录
      console.log('\n📝 更新现有会员记录...');
      const newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1); // 延长1年
      
      await dbRun(`
        UPDATE memberships 
        SET plan_id = 'annual', 
            expires_at = ?, 
            remaining_credits = 1000,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_active = TRUE
      `, [newExpiryDate.toISOString(), user.id]);
      
      console.log('✅ 会员记录更新成功');
      
    } else {
      // 3. 创建新的年费会员记录
      console.log('\n📝 创建年费会员记录...');
      
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1年后到期
      
      const result = await dbRun(`
        INSERT INTO memberships (
          user_id, plan_id, is_active, expires_at, remaining_credits
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        user.id,
        'annual',           // 年费计划
        true,              // 激活状态
        expiryDate.toISOString(), // 到期时间
        1000               // 剩余积分
      ]);

      console.log('✅ 年费会员记录创建成功');
      console.log('- 会员ID:', result.lastID);
    }

    // 4. 验证会员记录
    console.log('\n🔍 验证会员记录...');
    const membership = await dbGet(`
      SELECT plan_id, is_active, expires_at, remaining_credits, created_at
      FROM memberships 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY created_at DESC LIMIT 1
    `, [user.id]);

    if (membership) {
      console.log('✅ 会员记录验证成功:');
      console.log('- 计划ID:', membership.plan_id);
      console.log('- 状态:', membership.is_active ? '激活' : '未激活');
      console.log('- 到期时间:', membership.expires_at);
      console.log('- 剩余积分:', membership.remaining_credits);
      console.log('- 创建时间:', membership.created_at);

      // 5. 测试API获取会员信息
      console.log('\n🧪 测试API获取会员信息...');
      const axios = require('axios');
      
      try {
        // 登录获取token
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
          email: 'demo@example.com',
          password: 'password123'
        });

        if (loginResponse.data.success) {
          const token = loginResponse.data.data.token;
          
          // 获取用户信息（包含会员信息）
          const profileResponse = await axios.get('http://localhost:3001/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (profileResponse.data.success && profileResponse.data.user.membership) {
            const membershipData = profileResponse.data.user.membership;
            console.log('✅ API会员信息获取成功:');
            console.log('- 计划ID:', membershipData.plan_id);
            console.log('- 状态:', membershipData.is_active ? '激活' : '未激活');
            console.log('- 到期时间:', membershipData.expires_at);
            console.log('- 剩余积分:', membershipData.remaining_credits);

            console.log('\n🎉 demo用户现在拥有年费会员权限！');
            console.log('💡 可以测试以下功能:');
            console.log('- AI算命功能');
            console.log('- 高级占卜服务');
            console.log('- 会员专属功能');
            console.log('🔑 登录信息: demo@example.com / password123');

          } else {
            console.log('❌ API未返回会员信息');
          }
        } else {
          console.log('❌ 登录失败，无法测试API');
        }

      } catch (apiError) {
        console.log('❌ API测试失败:', apiError.message);
      }

    } else {
      console.log('❌ 会员记录验证失败');
    }

  } catch (error) {
    console.error('❌ 添加会员权限时出错:', error.message);
  }
}

addMembershipToDemo();
