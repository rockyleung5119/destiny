const axios = require('axios');

// 测试完整的用户流程
async function testCompleteFlow() {
  console.log('🎯 测试完整的用户资料自动读取分析流程...\n');

  try {
    // 1. 检查前端服务器
    console.log('1️⃣ 检查前端服务器状态...');
    try {
      const frontendResponse = await axios.get('http://localhost:5173', { timeout: 5000 });
      if (frontendResponse.status === 200) {
        console.log('✅ 前端服务器运行正常 (http://localhost:5173)');
        console.log(`📄 页面大小: ${Math.round(frontendResponse.data.length / 1024)}KB`);
      }
    } catch (error) {
      console.log('❌ 前端服务器无法访问:', error.message);
      console.log('请确保运行: npm run dev');
      return;
    }

    // 2. 检查后端服务器
    console.log('\n2️⃣ 检查后端服务器状态...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
      if (healthResponse.status === 200) {
        console.log('✅ 后端服务器运行正常 (http://localhost:3001)');
        console.log(`🏥 健康状态: ${healthResponse.data.status}`);
      }
    } catch (error) {
      console.log('❌ 后端服务器无法访问:', error.message);
      console.log('请确保在backend目录运行: npm start');
      return;
    }

    // 3. 测试用户登录
    console.log('\n3️⃣ 测试用户登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ 用户登录成功');
      const token = loginResponse.data.token;
      const user = loginResponse.data.user;
      
      console.log(`👤 用户信息:`);
      console.log(`   姓名: ${user.name}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   性别: ${user.gender || '未设置'}`);
      console.log(`   出生信息: ${user.birthYear || '?'}年${user.birthMonth || '?'}月${user.birthDay || '?'}日`);

      // 4. 获取完整用户资料
      console.log('\n4️⃣ 获取完整用户资料...');
      const profileResponse = await axios.get('http://localhost:3001/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.data.success) {
        console.log('✅ 用户资料获取成功');
        const profile = profileResponse.data.user;
        
        // 5. 检查资料完整性
        console.log('\n5️⃣ 检查资料完整性...');
        const isComplete = profile.birthYear && profile.birthMonth && profile.birthDay;
        
        if (isComplete) {
          console.log('✅ 用户资料完整，可以进行自动分析');
          
          // 6. 模拟前端自动分析流程
          console.log('\n6️⃣ 模拟前端自动分析流程...');
          const birthDate = `${profile.birthYear}-${String(profile.birthMonth).padStart(2, '0')}-${String(profile.birthDay).padStart(2, '0')}`;
          
          console.log('📋 分析参数:');
          console.log(`   姓名: ${profile.name}`);
          console.log(`   性别: ${profile.gender}`);
          console.log(`   出生日期: ${birthDate}`);
          console.log(`   出生地: ${profile.birthPlace || '中国'}`);
          
          // 7. 测试AI分析
          console.log('\n7️⃣ 测试AI分析...');
          try {
            const analysisResponse = await axios.post('http://localhost:3001/api/fortune/bazi', {
              name: profile.name,
              gender: profile.gender,
              birthDate: birthDate,
              birthPlace: profile.birthPlace || '中国'
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (analysisResponse.data.success) {
              console.log('✅ AI分析成功完成！');
              const data = analysisResponse.data.data;
              
              console.log('\n📊 分析结果摘要:');
              console.log(`   综合评分: ${data.overallScore || 'N/A'}/100`);
              console.log(`   分析长度: ${data.analysis.length} 字符`);
              console.log(`   分析预览: ${data.analysis.substring(0, 100)}...`);
              
              if (data.fortune) {
                console.log('\n🔮 运势详情:');
                console.log(`   💼 事业运势: ${data.fortune.career?.score || 'N/A'}/100`);
                console.log(`   💰 财富运势: ${data.fortune.wealth?.score || 'N/A'}/100`);
                console.log(`   ❤️ 感情运势: ${data.fortune.love?.score || 'N/A'}/100`);
                console.log(`   🏥 健康运势: ${data.fortune.health?.score || 'N/A'}/100`);
              }
              
              console.log('\n🎉 完整流程测试成功！');
              
            } else {
              console.log('❌ AI分析失败:', analysisResponse.data.message);
            }
          } catch (error) {
            if (error.response?.status === 429) {
              console.log('⏰ 请求频率限制，但API连接正常');
              console.log('🎉 完整流程测试成功（除频率限制外）！');
            } else {
              console.log('❌ AI分析请求错误:', error.response?.data?.message || error.message);
            }
          }
          
        } else {
          console.log('❌ 用户资料不完整');
          console.log('需要补充的信息:');
          if (!profile.birthYear) console.log('   - 出生年份');
          if (!profile.birthMonth) console.log('   - 出生月份');
          if (!profile.birthDay) console.log('   - 出生日期');
        }
        
      } else {
        console.log('❌ 获取用户资料失败:', profileResponse.data.message);
      }

    } else {
      console.log('❌ 用户登录失败:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }

  console.log('\n🎯 完整流程测试结束！');
  console.log('\n📋 用户操作指南:');
  console.log('1. 打开浏览器访问: http://localhost:5173');
  console.log('2. 点击右上角"登录"按钮');
  console.log('3. 使用测试账号登录: test@example.com / password123');
  console.log('4. 滚动到"Services"部分');
  console.log('5. 点击任意服务的"Start Analysis"按钮');
  console.log('6. 系统自动读取您的资料并开始AI分析');
  console.log('7. 查看详细的个性化分析结果');
  console.log('\n✨ 享受无需填表的流畅分析体验！');
}

// 运行测试
testCompleteFlow();
