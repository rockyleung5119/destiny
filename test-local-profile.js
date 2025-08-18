// 测试本地环境的用户资料字段
const LOCAL_API_URL = 'http://127.0.0.1:8787';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'demo123'
};

async function testLocalProfile() {
  console.log('🔧 Testing Local Profile Fields');
  console.log('🌐 Local API:', LOCAL_API_URL);
  
  try {
    // 步骤1: 登录demo用户
    console.log('\n🔐 Step 1: Login demo user...');
    const loginResponse = await fetch(`${LOCAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(demoUser)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`❌ Login failed: ${loginResponse.status} - ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // 步骤2: 获取用户资料
    console.log('\n👤 Step 2: Get user profile...');
    const profileResponse = await fetch(`${LOCAL_API_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(`❌ Profile fetch failed: ${profileResponse.status} - ${errorText}`);
      return;
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile fetch successful');
    
    if (!profileData.success || !profileData.user) {
      console.error('❌ Invalid profile response format:', profileData);
      return;
    }
    
    const user = profileData.user;
    console.log('\n📋 User Profile Data:');
    console.log('='.repeat(50));
    
    // 检查关键字段
    console.log('📝 Key Fields:');
    console.log(`  Name: "${user.name}"`);
    console.log(`  Gender: "${user.gender}"`);
    console.log(`  Birth Year: ${user.birth_year}`);
    console.log(`  Birth Month: ${user.birth_month}`);
    console.log(`  Birth Day: ${user.birth_day}`);
    console.log(`  Birth Hour: ${user.birth_hour}`);
    console.log(`  Birth Minute: ${user.birth_minute}`);
    console.log(`  Birth Place: "${user.birth_place}"`);
    console.log(`  Timezone: "${user.timezone}"`);
    console.log(`  Profile Updated Count: ${user.profile_updated_count}`);
    
    // 检查字段类型
    console.log('\n🔍 Field Types:');
    console.log(`  timezone type: ${typeof user.timezone}`);
    console.log(`  profile_updated_count type: ${typeof user.profile_updated_count}`);
    
    // 验证时区匹配
    console.log('\n🌍 Timezone Validation:');
    if (user.timezone === 'Asia/Shanghai') {
      console.log('✅ Timezone matches IANA format: Asia/Shanghai');
    } else if (user.timezone === 'UTC+8') {
      console.log('✅ Timezone matches UTC format: UTC+8');
    } else if (!user.timezone) {
      console.log('⚠️ Timezone is empty - should show "选择时区"');
    } else {
      console.log(`⚠️ Timezone has unexpected value: "${user.timezone}"`);
    }
    
    // 验证更新状态
    console.log('\n📊 Update Status:');
    if (user.profile_updated_count >= 1) {
      console.log(`✅ Profile has been updated ${user.profile_updated_count} times - fields should be disabled`);
    } else {
      console.log('✅ Profile not yet updated - fields should be editable');
    }
    
    console.log('\n🎯 Local Profile Test Completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testLocalProfile();
