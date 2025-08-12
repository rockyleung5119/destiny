// 强制同步数据库并测试登录
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function forceDatabaseSync() {
  console.log('🔧 强制同步数据库并测试登录...\n');

  try {
    // 1. 检查当前数据库状态
    console.log('📁 检查数据库文件状态:');
    
    const sourceDb = path.join(__dirname, 'backend', 'database', 'destiny.db');
    const targetDb = path.join(__dirname, 'backend', 'destiny.db');
    
    console.log('- 源文件 (backend/database/destiny.db):');
    if (fs.existsSync(sourceDb)) {
      const sourceStats = fs.statSync(sourceDb);
      console.log(`  ✅ 存在，大小: ${sourceStats.size} bytes`);
    } else {
      console.log('  ❌ 不存在');
      return;
    }
    
    console.log('- 目标文件 (backend/destiny.db):');
    if (fs.existsSync(targetDb)) {
      const targetStats = fs.statSync(targetDb);
      console.log(`  ⚠️  存在，大小: ${targetStats.size} bytes`);
      console.log('  🗑️  删除旧文件...');
      fs.unlinkSync(targetDb);
    } else {
      console.log('  ✅ 不存在（这是好的）');
    }

    // 2. 复制数据库文件到后端期望的位置
    console.log('\n📋 复制数据库文件...');
    fs.copyFileSync(sourceDb, targetDb);
    
    const newStats = fs.statSync(targetDb);
    console.log(`✅ 复制完成，新文件大小: ${newStats.size} bytes`);

    // 3. 等待一下让后端检测到文件变化
    console.log('\n⏳ 等待后端检测文件变化...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. 测试登录
    console.log('\n🔐 测试登录...');
    
    const loginData = {
      email: 'demo@example.com',
      password: 'password123'
    };

    console.log('📝 发送登录请求...');
    const response = await axios.post('http://localhost:3001/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500; // 不要抛出4xx错误
      }
    });

    console.log('📊 登录响应:');
    console.log('- 状态码:', response.status);
    console.log('- 成功:', response.data.success);
    console.log('- 消息:', response.data.message);

    if (response.data.success) {
      console.log('\n🎉 登录成功！');
      const token = response.data.data.token;
      const user = response.data.data.user;
      
      console.log('👤 用户信息:');
      console.log('- ID:', user.id);
      console.log('- 姓名:', user.name);
      console.log('- 邮箱:', user.email);

      // 测试获取详细用户信息
      console.log('\n📋 获取详细用户信息...');
      const profileResponse = await axios.get('http://localhost:3001/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.data.success) {
        const profile = profileResponse.data.user;
        console.log('✅ 用户详细信息获取成功:');
        console.log('- 姓名:', profile.name);
        console.log('- 性别:', profile.gender);
        console.log('- 出生:', `${profile.birthYear}-${profile.birthMonth}-${profile.birthDay} ${profile.birthHour}时`);
        console.log('- 地点:', profile.birthPlace);
        console.log('- 时区:', profile.timezone);
        console.log('- 邮箱验证:', profile.isEmailVerified ? '已验证' : '未验证');

        console.log('\n🎯 前端现在应该能正常登录和显示用户信息！');
        console.log('🔗 请在浏览器中刷新页面并重试登录');
        console.log('🔑 账号: demo@example.com / password123');
      }

    } else {
      console.log('\n❌ 登录仍然失败');
      console.log('💡 可能需要重启后端服务器');
      
      // 提供重启建议
      console.log('\n🔄 重启后端服务器的步骤:');
      console.log('1. 停止当前后端服务器 (Ctrl+C)');
      console.log('2. 在 backend 目录中运行: npm start');
      console.log('3. 等待服务器启动完成');
      console.log('4. 重新测试登录');
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    if (error.response) {
      console.error('- 响应状态:', error.response.status);
      console.error('- 响应数据:', error.response.data);
    }
  }
}

forceDatabaseSync();
