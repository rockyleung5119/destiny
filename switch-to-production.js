// 快速切换到生产模式的脚本 (CommonJS)
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'src/config/stripe.ts');

// 生产模式的支付链接
const PRODUCTION_URLS = {
  single: 'https://buy.stripe.com/3cI4gBfcd9OmbLB8Tc9AA00',  // Single Reading
  monthly: 'https://buy.stripe.com/fZu8wR4xzgcK4j94CW9AA01', // Monthly Plan
  yearly: 'https://buy.stripe.com/8x29AV6FHaSq16X1qK9AA02'   // Yearly Plan
};

// 测试模式的支付链接
const TEST_URLS = {
  single: 'https://buy.stripe.com/test_00w5kCewC7OY4D7g0Mfw400',  // Single Reading (测试)
  monthly: 'https://buy.stripe.com/test_3cI7sK88eglu1qVdSEfw401', // Monthly Plan (测试)
  yearly: 'https://buy.stripe.com/8x29AV6FHaSq16X1qK9AA02'       // Yearly Plan (生产)
};

function switchToProduction() {
  console.log('🔄 切换到生产模式...');
  
  try {
    // 读取配置文件
    let configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    
    // 替换测试链接为生产链接
    const testPattern = /checkoutUrls:\s*\{[^}]+\}/s;
    const productionConfig = `checkoutUrls: {
    single: '${PRODUCTION_URLS.single}',  // Single Reading (生产)
    monthly: '${PRODUCTION_URLS.monthly}', // Monthly Plan (生产)
    yearly: '${PRODUCTION_URLS.yearly}'   // Yearly Plan (生产)
  }`;
    
    configContent = configContent.replace(testPattern, productionConfig);
    
    // 更新注释
    configContent = configContent.replace(
      '// 套餐对应的预构建支付页面URL (测试模式)',
      '// 套餐对应的预构建支付页面URL (生产模式)'
    );
    
    // 写回文件
    fs.writeFileSync(CONFIG_FILE, configContent, 'utf8');
    
    console.log('✅ 已切换到生产模式');
    console.log('📋 生产模式配置:');
    Object.entries(PRODUCTION_URLS).forEach(([plan, url]) => {
      console.log(`  ${plan}: ${url}`);
    });
    
  } catch (error) {
    console.error('❌ 切换失败:', error.message);
  }
}

function switchToTest() {
  console.log('🧪 切换到测试模式...');
  
  try {
    // 读取配置文件
    let configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    
    // 替换生产链接为测试链接
    const productionPattern = /checkoutUrls:\s*\{[^}]+\}/s;
    const testConfig = `checkoutUrls: {
    single: '${TEST_URLS.single}',  // Single Reading (测试)
    monthly: '${TEST_URLS.monthly}', // Monthly Plan (测试)
    yearly: '${TEST_URLS.yearly}'       // Yearly Plan (生产，暂未提供测试链接)
  }`;
    
    configContent = configContent.replace(productionPattern, testConfig);
    
    // 更新注释
    configContent = configContent.replace(
      '// 套餐对应的预构建支付页面URL (生产模式)',
      '// 套餐对应的预构建支付页面URL (测试模式)'
    );
    
    // 写回文件
    fs.writeFileSync(CONFIG_FILE, configContent, 'utf8');
    
    console.log('✅ 已切换到测试模式');
    console.log('📋 测试模式配置:');
    Object.entries(TEST_URLS).forEach(([plan, url]) => {
      console.log(`  ${plan}: ${url}`);
    });
    
  } catch (error) {
    console.error('❌ 切换失败:', error.message);
  }
}

function showCurrentMode() {
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    
    if (configContent.includes('test_')) {
      console.log('🧪 当前模式: 测试模式');
    } else {
      console.log('🚀 当前模式: 生产模式');
    }
    
    // 提取当前URL
    const urlMatch = configContent.match(/checkoutUrls:\s*\{([^}]+)\}/s);
    if (urlMatch) {
      console.log('📋 当前配置:');
      const urls = urlMatch[1];
      const singleMatch = urls.match(/single:\s*'([^']+)'/);
      const monthlyMatch = urls.match(/monthly:\s*'([^']+)'/);
      const yearlyMatch = urls.match(/yearly:\s*'([^']+)'/);
      
      if (singleMatch) console.log(`  single: ${singleMatch[1]}`);
      if (monthlyMatch) console.log(`  monthly: ${monthlyMatch[1]}`);
      if (yearlyMatch) console.log(`  yearly: ${yearlyMatch[1]}`);
    }
    
  } catch (error) {
    console.error('❌ 读取配置失败:', error.message);
  }
}

// 命令行参数处理
const command = process.argv[2];

switch (command) {
  case 'production':
  case 'prod':
    switchToProduction();
    break;
  case 'test':
    switchToTest();
    break;
  case 'status':
  case 'show':
    showCurrentMode();
    break;
  default:
    console.log('🔧 Stripe支付模式切换工具');
    console.log('');
    console.log('使用方法:');
    console.log('  node switch-to-production.js production  # 切换到生产模式');
    console.log('  node switch-to-production.js test        # 切换到测试模式');
    console.log('  node switch-to-production.js status      # 查看当前模式');
    console.log('');
    showCurrentMode();
}
