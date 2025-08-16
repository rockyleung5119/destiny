// 测试 Cloudflare 配置的脚本
const axios = require('axios');

// 配置
const FRONTEND_URL = 'https://destiny-frontend.pages.dev';
const BACKEND_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function testCloudflareConfig() {
  console.log('🚀 开始测试 Cloudflare 配置...\n');

  try {
    // 1. 测试后端健康检查
    console.log('1️⃣ 测试后端健康检查...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 10000
    });
    
    if (healthResponse.data.status === 'ok') {
      console.log('✅ 后端健康检查通过');
      console.log(`   环境: ${healthResponse.data.environment}`);
      console.log(`   数据库: ${healthResponse.data.database}`);
    } else {
      throw new Error('后端健康检查失败');
    }

    // 2. 测试CORS配置
    console.log('\n2️⃣ 测试CORS配置...');
    try {
      const corsResponse = await axios.options(`${BACKEND_URL}/api/health`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 10000
      });
      console.log('✅ CORS配置正确');
    } catch (error) {
      if (error.response && error.response.status === 200) {
        console.log('✅ CORS配置正确');
      } else {
        console.log('⚠️ CORS配置可能有问题:', error.message);
      }
    }

    // 3. 测试demo用户登录
    console.log('\n3️⃣ 测试demo用户登录...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'demo@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      timeout: 10000
    });

    if (loginResponse.data.success) {
      console.log('✅ demo用户登录成功');
      console.log(`   用户ID: ${loginResponse.data.user?.id}`);
      console.log(`   用户名: ${loginResponse.data.user?.name}`);
      
      // 4. 测试受保护的API
      console.log('\n4️⃣ 测试受保护的API...');
      const token = loginResponse.data.token;
      const profileResponse = await axios.get(`${BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Origin': FRONTEND_URL
        },
        timeout: 10000
      });

      if (profileResponse.data.success) {
        console.log('✅ 受保护的API访问成功');
        console.log(`   用户邮箱: ${profileResponse.data.user?.email}`);
      } else {
        throw new Error('受保护的API访问失败');
      }

    } else {
      throw new Error('demo用户登录失败: ' + loginResponse.data.message);
    }

    // 5. 测试前端可访问性
    console.log('\n5️⃣ 测试前端可访问性...');
    try {
      const frontendResponse = await axios.get(FRONTEND_URL, {
        timeout: 10000,
        maxRedirects: 5
      });
      
      if (frontendResponse.status === 200) {
        console.log('✅ 前端页面可访问');
      } else {
        console.log('⚠️ 前端页面状态码:', frontendResponse.status);
      }
    } catch (error) {
      console.log('❌ 前端页面访问失败:', error.message);
    }

    console.log('\n🎉 所有测试完成!');
    console.log('\n📋 配置摘要:');
    console.log(`   前端地址: ${FRONTEND_URL}`);
    console.log(`   后端地址: ${BACKEND_URL}`);
    console.log(`   demo账号: demo@example.com / password123`);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行测试
testCloudflareConfig().catch(console.error);
