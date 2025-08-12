const axios = require('axios');

// 测试用户资料自动读取分析功能
async function testUserProfileAnalysis() {
  console.log('🧪 测试用户资料自动读取分析功能...\n');

  try {
    // 1. 测试登录
    console.log('1️⃣ 测试登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      const user = loginResponse.data.user;
      
      console.log(`👤 用户信息:`);
      console.log(`   姓名: ${user.name}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   性别: ${user.gender || '未设置'}`);
      console.log(`   出生年: ${user.birthYear || '未设置'}`);
      console.log(`   出生月: ${user.birthMonth || '未设置'}`);
      console.log(`   出生日: ${user.birthDay || '未设置'}`);
      console.log(`   出生地: ${user.birthPlace || '未设置'}`);

      // 2. 获取完整的用户资料
      console.log('\n2️⃣ 获取完整用户资料...');
      try {
        const profileResponse = await axios.get('http://localhost:3001/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.data.success) {
          console.log('✅ 用户资料获取成功');
          const profile = profileResponse.data.user;
          
          console.log(`📋 完整资料:`);
          console.log(`   ID: ${profile.id}`);
          console.log(`   姓名: ${profile.name}`);
          console.log(`   性别: ${profile.gender || '未设置'}`);
          console.log(`   出生年: ${profile.birthYear || '未设置'}`);
          console.log(`   出生月: ${profile.birthMonth || '未设置'}`);
          console.log(`   出生日: ${profile.birthDay || '未设置'}`);
          console.log(`   出生时辰: ${profile.birthHour || '未设置'}`);
          console.log(`   出生地: ${profile.birthPlace || '未设置'}`);
          console.log(`   邮箱验证: ${profile.isEmailVerified ? '已验证' : '未验证'}`);

          // 3. 检查资料完整性
          console.log('\n3️⃣ 检查资料完整性...');
          const isProfileComplete = profile.birthYear && profile.birthMonth && profile.birthDay;
          
          if (isProfileComplete) {
            console.log('✅ 用户资料完整，可以进行分析');
            
            // 4. 模拟自动分析流程
            console.log('\n4️⃣ 模拟自动分析流程...');
            const birthDate = `${profile.birthYear}-${String(profile.birthMonth).padStart(2, '0')}-${String(profile.birthDay).padStart(2, '0')}`;
            
            console.log(`📅 构建的出生日期: ${birthDate}`);
            console.log(`👤 分析用户: ${profile.name}`);
            console.log(`⚧ 性别: ${profile.gender || 'male'}`);
            console.log(`🌍 出生地: ${profile.birthPlace || '中国'}`);
            
            // 5. 测试实际分析API
            console.log('\n5️⃣ 测试实际分析API...');
            try {
              const analysisResponse = await axios.post('http://localhost:3001/api/fortune/bazi', {
                name: profile.name || '用户',
                gender: profile.gender || 'male',
                birthDate: birthDate,
                birthPlace: profile.birthPlace || '中国'
              }, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (analysisResponse.data.success) {
                console.log('✅ 自动分析成功！');
                const analysisData = analysisResponse.data.data;
                console.log(`📊 综合评分: ${analysisData.overallScore}/100`);
                console.log(`📝 分析长度: ${analysisData.analysis.length} 字符`);
                console.log(`🎯 分析预览: ${analysisData.analysis.substring(0, 150)}...`);
                
                if (analysisData.fortune) {
                  console.log(`💼 事业运势: ${analysisData.fortune.career?.score || 'N/A'}/100`);
                  console.log(`💰 财富运势: ${analysisData.fortune.wealth?.score || 'N/A'}/100`);
                  console.log(`❤️ 感情运势: ${analysisData.fortune.love?.score || 'N/A'}/100`);
                  console.log(`🏥 健康运势: ${analysisData.fortune.health?.score || 'N/A'}/100`);
                }
              } else {
                console.log('❌ 分析失败:', analysisResponse.data.message);
              }
            } catch (error) {
              if (error.response?.status === 429) {
                console.log('⏰ 请求过于频繁，但API连接正常');
              } else {
                console.log('❌ 分析请求错误:', error.response?.data?.message || error.message);
              }
            }
            
          } else {
            console.log('❌ 用户资料不完整，需要补充以下信息:');
            if (!profile.birthYear) console.log('   - 出生年份');
            if (!profile.birthMonth) console.log('   - 出生月份');
            if (!profile.birthDay) console.log('   - 出生日期');
            console.log('   用户需要先在设置中完善资料');
          }
          
        } else {
          console.log('❌ 用户资料获取失败:', profileResponse.data.message);
        }
      } catch (error) {
        console.log('❌ 获取用户资料时出错:', error.response?.data?.message || error.message);
      }

    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }

  console.log('\n🎉 用户资料自动读取测试完成！');
  console.log('\n📋 新功能说明:');
  console.log('1. 用户点击分析按钮后，系统自动读取已保存的用户资料');
  console.log('2. 如果资料完整，直接开始AI分析，无需重复填写表单');
  console.log('3. 如果资料不完整，提示用户前往设置页面完善信息');
  console.log('4. 分析过程中显示用户的基本信息，增加透明度');
  console.log('5. 整个流程更加流畅，用户体验大幅提升');
}

// 运行测试
testUserProfileAnalysis();
