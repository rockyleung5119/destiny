const axios = require('axios');

async function testUserProfile() {
  console.log('🧪 测试用户资料恢复...\n');

  const baseURL = 'http://localhost:3001';
  
  // 测试用户登录信息
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };

  try {
    // 1. 登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, loginData);
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ 登录成功');
    console.log('👤 用户信息:', {
      name: user.name,
      email: user.email,
      gender: user.gender,
      birth_year: user.birth_year,
      birth_month: user.birth_month,
      birth_day: user.birth_day,
      birth_hour: user.birth_hour,
      birth_place: user.birth_place,
      timezone: user.timezone
    });

    // 2. 获取用户资料
    console.log('\n📋 获取用户资料...');
    const profileResponse = await axios.get(`${baseURL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileResponse.data.success) {
      console.log('✅ 用户资料获取成功');
      const profile = profileResponse.data.data;
      console.log('📝 详细资料:', {
        name: profile.name,
        gender: profile.gender,
        birth_date: `${profile.birth_year}-${profile.birth_month}-${profile.birth_day}`,
        birth_hour: profile.birth_hour,
        birth_place: profile.birth_place,
        timezone: profile.timezone,
        is_email_verified: profile.is_email_verified,
        profile_updated_count: profile.profile_updated_count
      });
      
      // 检查必要字段是否存在
      const hasRequiredFields = profile.name && profile.gender && 
                               profile.birth_year && profile.birth_month && 
                               profile.birth_day && profile.birth_hour && 
                               profile.birth_place;
      
      if (hasRequiredFields) {
        console.log('🎉 用户资料完整，可以进行算命！');
      } else {
        console.log('⚠️ 用户资料不完整，需要补充信息');
      }
    } else {
      console.log('❌ 用户资料获取失败:', profileResponse.data.message);
    }

    // 3. 获取会员信息
    console.log('\n💎 获取会员信息...');
    const membershipResponse = await axios.get(`${baseURL}/user/membership`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (membershipResponse.data.success) {
      console.log('✅ 会员信息获取成功');
      const membership = membershipResponse.data.data;
      console.log('💳 会员详情:', {
        plan_id: membership.plan_id,
        is_active: membership.is_active,
        remaining_credits: membership.remaining_credits,
        expires_at: membership.expires_at
      });
    } else {
      console.log('❌ 会员信息获取失败:', membershipResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.response?.data?.message || error.message);
  }
}

// 运行测试
testUserProfile();
