// 测试账户设置页面字段显示修复
const PROD_API_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testProfileFields() {
  console.log('🔧 Testing Profile Fields Display Fix');
  console.log('🌐 Testing Production Environment:', PROD_API_URL);
  
  try {
    // 步骤1: 登录demo用户
    console.log('\n🔐 Step 1: Login demo user...');
    const loginResponse = await fetch(`${PROD_API_URL}/api/auth/login`, {
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
    const profileResponse = await fetch(`${PROD_API_URL}/api/user/profile`, {
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
    
    // 检查基本信息字段
    console.log('📝 Basic Information:');
    console.log(`  Name: ${user.name || 'Not set'}`);
    console.log(`  Email: ${user.email || 'Not set'}`);
    console.log(`  Gender: ${user.gender || 'Not set'}`);
    console.log(`  Email Verified: ${user.is_email_verified ? 'Yes' : 'No'}`);
    console.log(`  Profile Updated Count: ${user.profile_updated_count || 0}`);
    
    // 检查出生信息字段（统一后的字段名）
    console.log('\n🎂 Birth Information (Unified Fields):');
    console.log(`  Birth Year: ${user.birth_year || 'Not set'}`);
    console.log(`  Birth Month: ${user.birth_month || 'Not set'}`);
    console.log(`  Birth Day: ${user.birth_day || 'Not set'}`);
    console.log(`  Birth Hour: ${user.birth_hour || 'Not set'}`);
    console.log(`  Birth Minute: ${user.birth_minute || 'Not set'}`);
    console.log(`  Birth Place: ${user.birth_place || 'Not set'}`);
    
    // 重点检查时区字段
    console.log('\n🌍 Timezone Information:');
    console.log(`  Timezone: ${user.timezone || 'Not set'}`);
    console.log(`  Timezone Type: ${typeof user.timezone}`);
    console.log(`  Timezone Value: "${user.timezone}"`);
    
    // 检查会员信息
    console.log('\n💳 Membership Information:');
    if (user.membership) {
      console.log(`  Plan ID: ${user.membership.planId || 'Not set'}`);
      console.log(`  Is Active: ${user.membership.isActive ? 'Yes' : 'No'}`);
      console.log(`  Expires At: ${user.membership.expiresAt || 'No expiration'}`);
      console.log(`  Remaining Credits: ${user.membership.remainingCredits || 0}`);
    } else {
      console.log('  No membership data');
    }
    
    // 步骤3: 验证字段完整性
    console.log('\n🔍 Step 3: Field Validation...');
    const requiredFields = [
      'id', 'name', 'email', 'gender', 
      'birth_year', 'birth_month', 'birth_day', 
      'birth_hour', 'birth_minute', 'birth_place', 
      'timezone', 'is_email_verified', 'profile_updated_count'
    ];
    
    let missingFields = [];
    let presentFields = [];
    
    for (const field of requiredFields) {
      if (user.hasOwnProperty(field)) {
        presentFields.push(field);
        console.log(`✅ Field present: ${field} = ${user[field]}`);
      } else {
        missingFields.push(field);
        console.log(`❌ Field missing: ${field}`);
      }
    }
    
    // 步骤4: 检查旧字段名是否还存在（应该不存在）
    console.log('\n🔍 Step 4: Check for old field names (should not exist)...');
    const oldFields = [
      'birthYear', 'birthMonth', 'birthDay', 
      'birthHour', 'birthMinute', 'birthPlace',
      'isEmailVerified', 'profileUpdatedCount'
    ];
    
    let oldFieldsFound = [];
    for (const oldField of oldFields) {
      if (user.hasOwnProperty(oldField)) {
        oldFieldsFound.push(oldField);
        console.log(`⚠️ Old field still present: ${oldField} = ${user[oldField]}`);
      } else {
        console.log(`✅ Old field correctly removed: ${oldField}`);
      }
    }
    
    // 步骤5: 总结验证结果
    console.log('\n📊 Validation Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Present fields: ${presentFields.length}/${requiredFields.length}`);
    console.log(`❌ Missing fields: ${missingFields.length}`);
    console.log(`⚠️ Old fields found: ${oldFieldsFound.length}`);
    
    if (missingFields.length === 0 && oldFieldsFound.length === 0) {
      console.log('🎉 All field names are correctly unified!');
      
      // 特别检查时区字段
      if (user.timezone === null || user.timezone === undefined || user.timezone === '') {
        console.log('✅ Timezone field is empty - will show "选择时区" in UI (correct)');
      } else {
        console.log(`✅ Timezone field has value: "${user.timezone}" - will show this value in UI`);
      }
      
      // 检查profile_updated_count
      if (typeof user.profile_updated_count === 'number') {
        console.log(`✅ Profile update count is numeric: ${user.profile_updated_count}`);
        if (user.profile_updated_count >= 1) {
          console.log('✅ Profile has been updated - fields should be disabled in UI');
        } else {
          console.log('✅ Profile not yet updated - fields should be editable in UI');
        }
      } else {
        console.log(`❌ Profile update count is not numeric: ${typeof user.profile_updated_count}`);
      }
      
    } else {
      console.log('❌ Field unification issues detected:');
      if (missingFields.length > 0) {
        console.log(`  Missing: ${missingFields.join(', ')}`);
      }
      if (oldFieldsFound.length > 0) {
        console.log(`  Old fields: ${oldFieldsFound.join(', ')}`);
      }
    }
    
    console.log('\n🎯 Profile Fields Testing Completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testProfileFields();
