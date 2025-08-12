/**
 * 邮件服务切换脚本
 * 用于在不同邮件服务提供商之间切换
 */

const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 邮件服务配置模板
const emailConfigs = {
  resend: {
    EMAIL_SERVICE: 'resend',
    // Resend 特定配置
    RESEND_API_KEY: 'your_resend_api_key_here',
    RESEND_FROM_EMAIL: 'noreply@yourdomain.com',
    RESEND_FROM_NAME: 'Indicate.Top',
    // 清除其他服务的配置
    EMAIL_HOST: '',
    EMAIL_PORT: '',
    EMAIL_SECURE: '',
    EMAIL_USER: '',
    EMAIL_PASS: ''
  },
  qq: {
    EMAIL_SERVICE: 'qq',
    EMAIL_HOST: 'smtp.qq.com',
    EMAIL_PORT: '587',
    EMAIL_SECURE: 'false',
    EMAIL_USER: 'indicate.top@foxmail.com',
    EMAIL_PASS: 'oidulwiygxccbjbe',
    // 清除 Resend 配置
    RESEND_API_KEY: '',
    RESEND_FROM_EMAIL: '',
    RESEND_FROM_NAME: ''
  },
  sendgrid: {
    EMAIL_SERVICE: 'sendgrid',
    EMAIL_HOST: 'smtp.sendgrid.net',
    EMAIL_PORT: '587',
    EMAIL_SECURE: 'false',
    EMAIL_USER: 'apikey',
    EMAIL_PASS: 'your_sendgrid_api_key_here',
    // 清除 Resend 配置
    RESEND_API_KEY: '',
    RESEND_FROM_EMAIL: '',
    RESEND_FROM_NAME: ''
  }
};

function readEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.log(colors.red('❌ 无法读取 .env 文件:'), error.message);
    return null;
  }
}

function writeEnvFile(env) {
  const envPath = path.join(__dirname, '../.env');
  
  try {
    let content = '';
    
    // 按类别组织环境变量
    const categories = {
      '# 服务器配置': ['PORT', 'NODE_ENV', 'DEMO_MODE'],
      '# 数据库配置': ['DB_PATH'],
      '# JWT配置': ['JWT_SECRET', 'JWT_EXPIRES_IN'],
      '# 邮件服务配置': ['EMAIL_SERVICE', 'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_SECURE', 'EMAIL_USER', 'EMAIL_PASS', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'RESEND_FROM_NAME'],
      '# 应用配置': ['APP_NAME', 'APP_URL', 'FRONTEND_URL'],
      '# 验证码配置': ['VERIFICATION_CODE_EXPIRES', 'VERIFICATION_CODE_LENGTH', 'MAX_VERIFICATION_ATTEMPTS'],
      '# 速率限制配置': ['RATE_LIMIT_WINDOW', 'RATE_LIMIT_MAX_REQUESTS'],
      '# DeepSeek AI配置': ['DEEPSEEK_API_KEY', 'DEEPSEEK_BASE_URL', 'DEEPSEEK_MODEL'],
      '# Stripe支付配置 (测试环境)': ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET']
    };
    
    for (const [category, keys] of Object.entries(categories)) {
      content += category + '\n';
      
      keys.forEach(key => {
        const value = env[key] || '';
        if (value || ['EMAIL_SERVICE', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'RESEND_FROM_NAME', 'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'].includes(key)) {
          content += `${key}=${value}\n`;
        }
      });
      
      content += '\n';
    }
    
    fs.writeFileSync(envPath, content, 'utf8');
    return true;
  } catch (error) {
    console.log(colors.red('❌ 无法写入 .env 文件:'), error.message);
    return false;
  }
}

function switchEmailService(serviceName) {
  console.log(colors.cyan(`🔄 切换到 ${serviceName} 邮件服务...\n`));
  
  // 检查服务是否支持
  if (!emailConfigs[serviceName]) {
    console.log(colors.red(`❌ 不支持的邮件服务: ${serviceName}`));
    console.log(colors.yellow('支持的服务: ' + Object.keys(emailConfigs).join(', ')));
    return false;
  }
  
  // 读取当前环境变量
  const currentEnv = readEnvFile();
  if (!currentEnv) {
    return false;
  }
  
  // 应用新的邮件服务配置
  const newConfig = emailConfigs[serviceName];
  const updatedEnv = { ...currentEnv, ...newConfig };
  
  // 写入更新后的环境变量
  if (!writeEnvFile(updatedEnv)) {
    return false;
  }
  
  console.log(colors.green(`✅ 已切换到 ${serviceName} 邮件服务`));
  console.log(colors.blue('📋 当前邮件服务配置:'));
  
  Object.entries(newConfig).forEach(([key, value]) => {
    if (value) {
      // 隐藏敏感信息
      const displayValue = ['EMAIL_PASS', 'RESEND_API_KEY'].includes(key) ? 
        (value.length > 8 ? `${value.substring(0, 8)}...` : '***') : value;
      console.log(colors.cyan(`   ${key}: ${displayValue}`));
    }
  });
  
  if (serviceName === 'resend') {
    console.log(colors.yellow('\n⚠️  请确保已配置正确的 Resend API Key 和发送邮箱'));
    console.log(colors.blue('📖 参考文档: backend/RESEND_SETUP.md'));
    console.log(colors.blue('🧪 测试命令: npm run test:resend'));
  }
  
  console.log(colors.green('\n🎉 邮件服务切换完成！'));
  console.log(colors.yellow('💡 请重启应用以使配置生效'));
  
  return true;
}

// 命令行接口
if (require.main === module) {
  const serviceName = process.argv[2];
  
  if (!serviceName) {
    console.log(colors.cyan('📧 邮件服务切换工具\n'));
    console.log(colors.blue('使用方法:'));
    console.log('  node switchEmailService.js <service_name>\n');
    console.log(colors.blue('支持的服务:'));
    Object.keys(emailConfigs).forEach(service => {
      console.log(colors.green(`  - ${service}`));
    });
    console.log(colors.blue('\n示例:'));
    console.log('  node switchEmailService.js resend');
    console.log('  node switchEmailService.js qq');
    process.exit(0);
  }
  
  const success = switchEmailService(serviceName);
  process.exit(success ? 0 : 1);
}

module.exports = { switchEmailService };
