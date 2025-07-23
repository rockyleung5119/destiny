#!/usr/bin/env node

/**
 * 前后端连接测试脚本
 * 测试前端组件与后端 API 的集成
 */

const http = require('http');

console.log('🔮 命理分析系统 - 前后端连接测试');
console.log('=====================================');

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testData: {
    name: '张三',
    gender: 'male',
    birthDate: '1990-05-15T10:30:00.000Z',
    birthPlace: '北京，中国',
    analysisType: 'comprehensive'
  }
};

// 工具函数：发送 HTTP 请求
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// 测试函数
async function testHealthCheck() {
  console.log('\n📊 测试 1: 健康检查');
  console.log('-------------------');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ 健康检查通过');
      console.log('📄 响应:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ 健康检查失败');
      console.log('📄 状态码:', response.statusCode);
      console.log('📄 响应:', response.data);
    }
  } catch (error) {
    console.log('❌ 健康检查错误:', error.message);
  }
}

async function testAnalysisAPI() {
  console.log('\n🔮 测试 2: 分析 API');
  console.log('-------------------');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analysis',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(TEST_CONFIG.testData))
      }
    };

    console.log('📤 发送测试数据:', JSON.stringify(TEST_CONFIG.testData, null, 2));
    
    const response = await makeRequest(options, TEST_CONFIG.testData);
    
    if (response.statusCode === 200 && response.data?.success) {
      console.log('✅ 分析 API 测试通过');
      console.log('📊 综合评分:', response.data.data.overallScore);
      console.log('🏆 事业运势:', response.data.data.fortune.career.score);
      console.log('💰 财运:', response.data.data.fortune.wealth.score);
      console.log('💕 感情运势:', response.data.data.fortune.love.score);
      console.log('🏥 健康运势:', response.data.data.fortune.health.score);
      
      if (response.data.data.baziData) {
        console.log('📊 八字信息:');
        console.log('  年柱:', response.data.data.baziData.year?.heavenlyStem + response.data.data.baziData.year?.earthlyBranch);
        console.log('  月柱:', response.data.data.baziData.month?.heavenlyStem + response.data.data.baziData.month?.earthlyBranch);
        console.log('  日柱:', response.data.data.baziData.day?.heavenlyStem + response.data.data.baziData.day?.earthlyBranch);
        console.log('  时柱:', response.data.data.baziData.hour?.heavenlyStem + response.data.data.baziData.hour?.earthlyBranch);
      }
    } else {
      console.log('❌ 分析 API 测试失败');
      console.log('📄 状态码:', response.statusCode);
      console.log('📄 响应:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ 分析 API 错误:', error.message);
  }
}

async function testFrontendPages() {
  console.log('\n🌐 测试 3: 前端页面');
  console.log('-------------------');
  
  const pages = [
    { name: '主页', path: '/' },
    { name: '演示页面', path: '/demo' },
    { name: '分析表单', path: '/analysis-form' },
    { name: '测试页面', path: '/test' }
  ];

  for (const page of pages) {
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: page.path,
        method: 'GET'
      };

      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${page.name} (${page.path}) - 可访问`);
      } else {
        console.log(`❌ ${page.name} (${page.path}) - 状态码: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${page.name} (${page.path}) - 错误: ${error.message}`);
    }
  }
}

async function checkServerStatus() {
  console.log('\n🔍 检查服务器状态');
  console.log('-------------------');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Next.js 开发服务器正在运行');
      console.log('🌐 访问地址: http://localhost:3000');
      return true;
    } else {
      console.log('❌ 服务器响应异常，状态码:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ 无法连接到服务器');
    console.log('💡 请确保运行了 npm run dev');
    console.log('📝 错误详情:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始前后端连接测试...\n');
  
  // 检查服务器状态
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('\n❌ 测试终止：服务器未运行');
    console.log('💡 请先运行: npm run dev');
    process.exit(1);
  }

  // 运行所有测试
  await testHealthCheck();
  await testAnalysisAPI();
  await testFrontendPages();

  console.log('\n🎉 测试完成！');
  console.log('=====================================');
  console.log('💡 如果所有测试都通过，说明前后端连接正常');
  console.log('🌐 你可以在浏览器中访问: http://localhost:3000');
  console.log('🔮 尝试使用分析功能: http://localhost:3000/demo');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testAnalysisAPI,
  testFrontendPages
};
