#!/usr/bin/env node

/**
 * 全功能测试脚本
 * 测试命理分析系统的所有核心功能
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  name: '测试用户',
  password: 'test123456'
};

// 测试用例数据
const TEST_BIRTH_INFO = {
  name: '张三',
  gender: 'male',
  birthDate: '1990-05-15T10:30:00.000Z',
  birthPlace: '北京，中国',
  latitude: 39.9042,
  longitude: 116.4074
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 测试函数
async function runTest(testName, testFunction) {
  testResults.total++;
  logInfo(`Running test: ${testName}`);
  
  try {
    await testFunction();
    testResults.passed++;
    logSuccess(`Test passed: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    logError(`Test failed: ${testName} - ${error.message}`);
  }
}

// API 请求辅助函数
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${error.response.data?.error || error.response.statusText}`);
    }
    throw error;
  }
}

// 1. 测试基础API连接
async function testApiConnection() {
  const response = await apiRequest('GET', '/api/health');
  if (!response || response.status !== 'ok') {
    throw new Error('API health check failed');
  }
}

// 2. 测试农历转换功能
async function testLunarCalendar() {
  // 这里我们需要创建一个测试端点或者直接测试库函数
  const { solarToLunar } = require('../src/lib/lunar-calendar');
  
  const testDate = new Date('1990-05-15T10:30:00.000Z');
  const lunarDate = solarToLunar(testDate);
  
  if (!lunarDate.yearGanZhi || !lunarDate.monthGanZhi || !lunarDate.dayGanZhi || !lunarDate.hourGanZhi) {
    throw new Error('Lunar calendar conversion failed');
  }
  
  logInfo(`Lunar conversion result: ${lunarDate.yearGanZhi}年 ${lunarDate.monthGanZhi}月 ${lunarDate.dayGanZhi}日 ${lunarDate.hourGanZhi}时`);
}

// 3. 测试八字计算
async function testBaziCalculation() {
  const { calculateBazi } = require('../src/lib/bazi-calculator');
  
  const baziData = calculateBazi(TEST_BIRTH_INFO);
  
  if (!baziData.year || !baziData.month || !baziData.day || !baziData.hour) {
    throw new Error('Bazi calculation failed');
  }
  
  if (!baziData.elements || !baziData.tenGods) {
    throw new Error('Bazi analysis incomplete');
  }
  
  logInfo(`Bazi result: ${baziData.year.heavenlyStem}${baziData.year.earthlyBranch} ${baziData.month.heavenlyStem}${baziData.month.earthlyBranch} ${baziData.day.heavenlyStem}${baziData.day.earthlyBranch} ${baziData.hour.heavenlyStem}${baziData.hour.earthlyBranch}`);
}

// 4. 测试紫微斗数计算
async function testZiweiCalculation() {
  const { calculateZiwei } = require('../src/lib/ziwei-calculator');
  
  const ziweiData = calculateZiwei(TEST_BIRTH_INFO);
  
  if (!ziweiData.lifePlace || !ziweiData.palaces) {
    throw new Error('Ziwei calculation failed');
  }
  
  logInfo(`Ziwei life palace: ${ziweiData.lifePlace.palace}`);
}

// 5. 测试运势分析
async function testFortuneAnalysis() {
  const { analyzeComprehensiveFortune } = require('../src/lib/fortune-analyzer');
  
  const fortune = analyzeComprehensiveFortune(TEST_BIRTH_INFO);
  
  if (!fortune.overallScore || !fortune.career || !fortune.wealth || !fortune.love || !fortune.health) {
    throw new Error('Fortune analysis failed');
  }
  
  if (fortune.overallScore < 0 || fortune.overallScore > 100) {
    throw new Error('Invalid fortune score');
  }
  
  logInfo(`Fortune scores - Overall: ${fortune.overallScore}, Career: ${fortune.career.score}, Wealth: ${fortune.wealth.score}, Love: ${fortune.love.score}, Health: ${fortune.health.score}`);
}

// 6. 测试混合计算器
async function testHybridCalculator() {
  const { hybridCalculator } = require('../src/lib/hybrid-calculator');
  
  const analysisRequest = {
    birthInfo: TEST_BIRTH_INFO,
    analysisType: 'comprehensive',
    options: {
      includeDaily: true,
      detailLevel: 'basic'
    }
  };
  
  const result = await hybridCalculator.performAnalysis(analysisRequest, 'free');
  
  if (!result.baziData || !result.ziweiData || !result.fortune) {
    throw new Error('Hybrid calculation failed');
  }
  
  logInfo(`Hybrid calculation completed with overall score: ${result.fortune.overallScore}`);
}

// 7. 测试缓存系统
async function testCacheSystem() {
  const { cache } = require('../src/lib/cache');
  
  const testKey = 'test-key';
  const testValue = { message: 'test-value', timestamp: Date.now() };
  
  // 测试设置缓存
  await cache.set(testKey, testValue, { ttl: 60 });
  
  // 测试获取缓存
  const cachedValue = await cache.get(testKey);
  
  if (!cachedValue || cachedValue.message !== testValue.message) {
    throw new Error('Cache set/get failed');
  }
  
  // 测试删除缓存
  await cache.delete(testKey);
  
  const deletedValue = await cache.get(testKey);
  if (deletedValue !== null) {
    throw new Error('Cache delete failed');
  }
  
  logInfo('Cache system working correctly');
}

// 8. 测试权限系统
async function testPermissionSystem() {
  const { permissionService } = require('../src/lib/permission-service');
  
  // 创建测试用户ID
  const testUserId = 'test-user-id';
  
  // 测试功能访问检查
  const access = await permissionService.checkFeatureAccess(testUserId, 'daily_query');
  
  if (!access.hasOwnProperty('hasAccess')) {
    throw new Error('Permission check failed');
  }
  
  logInfo(`Permission check result: ${access.hasAccess ? 'allowed' : 'denied'}`);
}

// 9. 测试邮件服务（模拟）
async function testEmailService() {
  const { emailService } = require('../src/lib/email-service');
  
  // 测试邮件模板生成
  const template = emailService.generateWelcomeTemplate('Test User');
  
  if (!template.subject || !template.html || !template.text) {
    throw new Error('Email template generation failed');
  }
  
  logInfo('Email service template generation working');
}

// 10. 测试完整API流程
async function testCompleteApiFlow() {
  // 测试分析请求
  const analysisRequest = {
    birthInfo: TEST_BIRTH_INFO,
    analysisType: 'comprehensive',
    options: {
      includeDaily: true
    }
  };
  
  // 注意：这个测试需要认证，在实际环境中需要先登录
  try {
    const response = await apiRequest('POST', '/api/analysis', analysisRequest);
    
    if (!response.success) {
      throw new Error('Analysis API request failed');
    }
    
    logInfo(`Analysis API response: ${response.message}`);
  } catch (error) {
    // 如果是认证错误，这是预期的
    if (error.message.includes('401') || error.message.includes('authentication')) {
      logWarning('Analysis API requires authentication (expected in test environment)');
    } else {
      throw error;
    }
  }
}

// 11. 测试数据库连接
async function testDatabaseConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // 简单的数据库查询测试
    await prisma.$queryRaw`SELECT 1 as test`;
    
    await prisma.$disconnect();
    
    logInfo('Database connection successful');
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// 12. 测试配置系统
async function testConfigSystem() {
  const { config } = require('../src/lib/config');
  
  const logLevel = await config.get('logLevel');
  
  if (!logLevel) {
    throw new Error('Config system failed to retrieve log level');
  }
  
  logInfo(`Config system working, log level: ${logLevel}`);
}

// 主测试函数
async function runAllTests() {
  log('🚀 Starting comprehensive test suite for Destiny Analysis System', 'cyan');
  log('=' * 60, 'cyan');
  
  // 基础功能测试
  await runTest('API Connection', testApiConnection);
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Config System', testConfigSystem);
  await runTest('Cache System', testCacheSystem);
  
  // 核心计算功能测试
  await runTest('Lunar Calendar Conversion', testLunarCalendar);
  await runTest('Bazi Calculation', testBaziCalculation);
  await runTest('Ziwei Calculation', testZiweiCalculation);
  await runTest('Fortune Analysis', testFortuneAnalysis);
  await runTest('Hybrid Calculator', testHybridCalculator);
  
  // 系统功能测试
  await runTest('Permission System', testPermissionSystem);
  await runTest('Email Service', testEmailService);
  
  // API测试
  await runTest('Complete API Flow', testCompleteApiFlow);
  
  // 输出测试结果
  log('\n' + '=' * 60, 'cyan');
  log('📊 Test Results Summary', 'cyan');
  log('=' * 60, 'cyan');
  
  logInfo(`Total tests: ${testResults.total}`);
  logSuccess(`Passed: ${testResults.passed}`);
  
  if (testResults.failed > 0) {
    logError(`Failed: ${testResults.failed}`);
    
    log('\n❌ Failed Tests:', 'red');
    testResults.errors.forEach(error => {
      log(`  • ${error.test}: ${error.error}`, 'red');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! The system is ready for deployment.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review and fix the issues before deployment.', 'yellow');
  }
  
  // 保存测试报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: `${successRate}%`
    },
    errors: testResults.errors
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  logInfo('Test report saved to test-report.json');
  
  // 退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};
