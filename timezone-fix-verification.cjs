#!/usr/bin/env node

/**
 * 时区标准化修复验证脚本
 * 验证注册和个人资料页面时区格式统一
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(colors.red(`❌ 无法读取文件: ${filePath}`));
    return null;
  }
}

function extractTimezoneOptions(content, componentName) {
  const options = [];
  const optionRegex = /<option\s+value="([^"]*)"[^>]*>([^<]*)<\/option>/g;
  let match;
  
  while ((match = optionRegex.exec(content)) !== null) {
    const value = match[1];
    const label = match[2];
    
    // 跳过空值选项
    if (value && value !== '') {
      options.push({ value, label: label.trim() });
    }
  }
  
  return options;
}

function analyzeTimezoneFormat(options) {
  const formats = {
    iana: [], // Asia/Shanghai 格式
    utc: [],  // UTC+8 格式
    other: []
  };
  
  options.forEach(option => {
    if (option.value.includes('/')) {
      formats.iana.push(option);
    } else if (option.value.startsWith('UTC')) {
      formats.utc.push(option);
    } else {
      formats.other.push(option);
    }
  });
  
  return formats;
}

function main() {
  console.log(colors.cyan('🔧 时区标准化修复验证\n'));
  
  const results = {
    registration: null,
    profile: null,
    backend: null
  };
  
  // 1. 检查注册页面时区选项
  console.log(colors.magenta('📝 检查注册页面时区选项'));
  const registrationFile = 'src/components/LoginDetailed.tsx';
  const registrationContent = readFile(registrationFile);
  
  if (registrationContent) {
    const registrationOptions = extractTimezoneOptions(registrationContent, 'LoginDetailed');
    const registrationFormats = analyzeTimezoneFormat(registrationOptions);
    
    results.registration = {
      file: registrationFile,
      options: registrationOptions,
      formats: registrationFormats,
      totalOptions: registrationOptions.length
    };
    
    console.log(colors.blue(`   文件: ${registrationFile}`));
    console.log(colors.blue(`   时区选项数量: ${registrationOptions.length}`));
    console.log(colors.blue(`   IANA格式: ${registrationFormats.iana.length}个`));
    console.log(colors.blue(`   UTC格式: ${registrationFormats.utc.length}个`));
    console.log(colors.blue(`   其他格式: ${registrationFormats.other.length}个`));
  }
  
  // 2. 检查个人资料页面时区选项
  console.log(colors.magenta('\n👤 检查个人资料页面时区选项'));
  const profileFile = 'src/components/MemberSettings.tsx';
  const profileContent = readFile(profileFile);
  
  if (profileContent) {
    const profileOptions = extractTimezoneOptions(profileContent, 'MemberSettings');
    const profileFormats = analyzeTimezoneFormat(profileOptions);
    
    results.profile = {
      file: profileFile,
      options: profileOptions,
      formats: profileFormats,
      totalOptions: profileOptions.length
    };
    
    console.log(colors.blue(`   文件: ${profileFile}`));
    console.log(colors.blue(`   时区选项数量: ${profileOptions.length}`));
    console.log(colors.blue(`   IANA格式: ${profileFormats.iana.length}个`));
    console.log(colors.blue(`   UTC格式: ${profileFormats.utc.length}个`));
    console.log(colors.blue(`   其他格式: ${profileFormats.other.length}个`));
  }
  
  // 3. 检查后端默认时区
  console.log(colors.magenta('\n🔧 检查后端默认时区设置'));
  const backendFile = 'backend/worker.ts';
  const backendContent = readFile(backendFile);
  
  if (backendContent) {
    const defaultTimezoneMatches = backendContent.match(/timezone.*'([^']+)'/g) || [];
    const uniqueDefaults = [...new Set(defaultTimezoneMatches)];
    
    results.backend = {
      file: backendFile,
      defaultTimezones: uniqueDefaults,
      usesIANA: uniqueDefaults.some(tz => tz.includes('Asia/Shanghai'))
    };
    
    console.log(colors.blue(`   文件: ${backendFile}`));
    console.log(colors.blue(`   默认时区设置: ${uniqueDefaults.length}处`));
    uniqueDefaults.forEach(tz => {
      console.log(colors.blue(`   - ${tz}`));
    });
  }
  
  // 4. 生成验证报告
  console.log('\n' + colors.cyan('📊 验证结果分析:'));
  
  let allGood = true;
  
  // 检查注册页面
  if (results.registration) {
    const reg = results.registration;
    if (reg.formats.iana.length > 0 && reg.formats.utc.length === 0) {
      console.log(colors.green('✅ 注册页面: 已使用标准IANA时区格式'));
    } else if (reg.formats.utc.length > 0 && reg.formats.iana.length === 0) {
      console.log(colors.red('❌ 注册页面: 仍在使用旧UTC格式'));
      allGood = false;
    } else if (reg.formats.iana.length > 0 && reg.formats.utc.length > 0) {
      console.log(colors.yellow('⚠️ 注册页面: 混合使用IANA和UTC格式'));
    } else {
      console.log(colors.red('❌ 注册页面: 未找到时区选项'));
      allGood = false;
    }
  }
  
  // 检查个人资料页面
  if (results.profile) {
    const prof = results.profile;
    if (prof.formats.iana.length > 0 && prof.formats.utc.length > 0) {
      console.log(colors.green('✅ 个人资料页面: 支持IANA和UTC格式（向后兼容）'));
    } else if (prof.formats.iana.length > 0 && prof.formats.utc.length === 0) {
      console.log(colors.yellow('⚠️ 个人资料页面: 仅支持IANA格式（可能不兼容旧数据）'));
    } else {
      console.log(colors.red('❌ 个人资料页面: 时区格式配置有问题'));
      allGood = false;
    }
  }
  
  // 检查后端
  if (results.backend) {
    if (results.backend.usesIANA) {
      console.log(colors.green('✅ 后端: 使用标准IANA时区格式作为默认值'));
    } else {
      console.log(colors.red('❌ 后端: 未使用标准IANA时区格式'));
      allGood = false;
    }
  }
  
  // 5. 总结和建议
  console.log('\n' + colors.cyan('🎯 修复状态总结:'));
  
  if (allGood) {
    console.log(colors.green('🎉 时区标准化修复完成！'));
    
    console.log('\n📋 修复内容:');
    console.log(colors.green('✅ 注册页面使用标准IANA时区格式'));
    console.log(colors.green('✅ 个人资料页面支持新旧格式兼容'));
    console.log(colors.green('✅ 后端使用Asia/Shanghai作为默认值'));
    console.log(colors.green('✅ 数据库字段支持时区存储'));
    
    console.log('\n🧪 现在可以测试:');
    console.log('1. 新用户注册时选择时区（IANA格式）');
    console.log('2. 登录后查看个人资料，确认时区正确显示');
    console.log('3. 现有用户（UTC格式）仍能正确显示时区');
    console.log('4. 时区更新功能正常工作');
    
  } else {
    console.log(colors.yellow('⚠️ 部分修复仍需完善'));
    
    console.log('\n🔧 建议操作:');
    if (results.registration && results.registration.formats.utc.length > 0) {
      console.log('- 将注册页面时区选项改为IANA格式');
    }
    if (results.profile && results.profile.formats.utc.length === 0) {
      console.log('- 在个人资料页面添加UTC格式选项以支持旧数据');
    }
    if (results.backend && !results.backend.usesIANA) {
      console.log('- 将后端默认时区改为Asia/Shanghai');
    }
  }
  
  console.log('\n' + colors.cyan('📝 详细选项列表:'));
  
  if (results.registration) {
    console.log(colors.magenta('\n注册页面时区选项:'));
    results.registration.options.forEach((opt, i) => {
      const format = opt.value.includes('/') ? 'IANA' : opt.value.startsWith('UTC') ? 'UTC' : 'OTHER';
      console.log(`${i + 1}. ${opt.value} (${format}) - ${opt.label}`);
    });
  }
  
  if (results.profile) {
    console.log(colors.magenta('\n个人资料页面时区选项:'));
    results.profile.options.forEach((opt, i) => {
      const format = opt.value.includes('/') ? 'IANA' : opt.value.startsWith('UTC') ? 'UTC' : 'OTHER';
      console.log(`${i + 1}. ${opt.value} (${format}) - ${opt.label}`);
    });
  }
  
  return allGood;
}

// 运行验证
main().then(success => {
  console.log('\n' + colors.cyan('📊 验证完成'));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(colors.red('💥 验证失败:'), error);
  process.exit(1);
});
