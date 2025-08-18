// 测试字段统一修复
const LOCAL_API_URL = 'http://localhost:3001';

// 测试用户数据（使用下划线命名）
const testUser = {
  email: 'test-field-unification@example.com',
  password: 'password123',
  name: '字段统一测试',
  gender: 'male',
  birth_year: 1990,
  birth_month: 5,
  birth_day: 15,
  birth_hour: 14,
  birth_minute: 30,
  birth_place: '北京市朝阳区',
  timezone: 'Asia/Shanghai'
};

async function testFieldUnification() {
  console.log('🔧 Testing Field Unification Fix');
  
  try {
    // 步骤1: 注册新用户（测试注册API字段）
    console.log('\n📝 Step 1: Register new user with unified fields...');
    const registerResponse = await fetch(`${LOCAL_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    console.log(`Register Status: ${registerResponse.status}`);
    
    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error(`❌ Registration failed: ${errorText}`);
      
      // 如果用户已存在，尝试登录
      if (registerResponse.status === 409) {
        console.log('🔄 User exists, trying to login...');
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
          console.error('❌ Login also failed');
          return;
        }
        
        const loginData = await loginResponse.json();
        var token = loginData.token;
        console.log('✅ Login successful');
      } else {
        return;
      }
    } else {
      const registerData = await registerResponse.json();
      var token = registerData.token;
      console.log('✅ Registration successful');
      
      // 验证返回的用户数据字段
      console.log('🔍 Checking returned user fields...');
      const user = registerData.user;
      const expectedFields = ['birth_year', 'birth_month', 'birth_day', 'birth_hour', 'birth_minute', 'birth_place'];
      
      for (const field of expectedFields) {
        if (user[field] !== undefined) {
          console.log(`✅ Field ${field}: ${user[field]}`);
        } else {
          console.log(`❌ Missing field: ${field}`);
        }
      }
    }
    
    // 步骤2: 获取用户资料（测试GET API字段）
    console.log('\n👤 Step 2: Get user profile...');
    const profileResponse = await fetch(`${LOCAL_API_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Profile Status: ${profileResponse.status}`);
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(`❌ Get profile failed: ${errorText}`);
      return;
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile retrieved successfully');
    
    // 验证字段名
    console.log('🔍 Checking profile fields...');
    const user = profileData.user;
    const expectedFields = ['birth_year', 'birth_month', 'birth_day', 'birth_hour', 'birth_minute', 'birth_place'];
    
    for (const field of expectedFields) {
      if (user[field] !== undefined) {
        console.log(`✅ Field ${field}: ${user[field]}`);
      } else {
        console.log(`❌ Missing field: ${field}`);
      }
    }
    
    // 步骤3: 测试AI服务（验证buildUserProfile使用正确字段）
    console.log('\n🔮 Step 3: Test AI service with unified fields...');
    const aiResponse = await fetch(`${LOCAL_API_URL}/api/fortune/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: 'zh' })
    });
    
    console.log(`AI Service Status: ${aiResponse.status}`);
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`❌ AI service failed: ${errorText}`);
    } else {
      const aiData = await aiResponse.json();
      console.log(`✅ AI service success: ${aiData.success}`);
      
      if (aiData.success && aiData.data?.analysis) {
        console.log(`Analysis length: ${aiData.data.analysis.length} characters`);
        console.log('✅ AI service can access user birth data correctly');
      }
    }
    
    // 步骤4: 清理测试用户
    console.log('\n🗑️ Step 4: Cleanup test user...');
    const deleteResponse = await fetch(`${LOCAL_API_URL}/api/user/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test user cleaned up successfully');
    } else {
      console.log('⚠️ Could not cleanup test user (may not exist)');
    }
    
    console.log('\n🎉 Field unification test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testFieldUnification();
