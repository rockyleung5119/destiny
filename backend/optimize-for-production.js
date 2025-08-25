// 生产环境优化脚本 - 移除调试日志以减少文件大小
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 开始优化worker.ts用于生产环境部署...');

const workerPath = path.join(__dirname, 'worker.ts');
const backupPath = path.join(__dirname, 'worker.ts.backup');

// 备份原文件
if (fs.existsSync(workerPath)) {
  fs.copyFileSync(workerPath, backupPath);
  console.log('✅ 已备份原文件到 worker.ts.backup');
}

// 读取文件内容
let content = fs.readFileSync(workerPath, 'utf8');
const originalSize = content.length;
const originalLines = content.split('\n').length;

console.log(`📊 原文件大小: ${originalSize} 字符, ${originalLines} 行`);

// 优化规则
const optimizations = [
  {
    name: '移除详细console.log',
    pattern: /\s*console\.log\([^)]*\);\s*\n/g,
    replacement: ''
  },
  {
    name: '保留错误日志但简化',
    pattern: /console\.error\('❌[^']*',\s*([^)]+)\);/g,
    replacement: 'console.error($1);'
  },
  {
    name: '移除多行注释中的调试信息',
    pattern: /\/\*[\s\S]*?调试[\s\S]*?\*\//g,
    replacement: ''
  },
  {
    name: '移除空行（连续3行以上）',
    pattern: /\n\s*\n\s*\n\s*\n/g,
    replacement: '\n\n'
  },
  {
    name: '移除详细的错误堆栈日志',
    pattern: /\s*console\.error\('❌ Error stack:'[^)]*\);\s*\n/g,
    replacement: ''
  },
  {
    name: '简化成功日志',
    pattern: /console\.log\('✅[^']*'\);\s*\n/g,
    replacement: ''
  },
  {
    name: '移除进度日志',
    pattern: /console\.log\('🔄[^']*'\);\s*\n/g,
    replacement: ''
  },
  {
    name: '移除详细的请求日志',
    pattern: /console\.log\('📝 Request[^']*'[^)]*\);\s*\n/g,
    replacement: ''
  }
];

// 应用优化
let optimizedContent = content;
let totalReductions = 0;

optimizations.forEach(opt => {
  const beforeLength = optimizedContent.length;
  optimizedContent = optimizedContent.replace(opt.pattern, opt.replacement);
  const reduction = beforeLength - optimizedContent.length;
  totalReductions += reduction;
  
  if (reduction > 0) {
    console.log(`✅ ${opt.name}: 减少 ${reduction} 字符`);
  }
});

// 特殊处理：保留关键错误日志
const criticalLogs = [
  'console.error(\'❌ Database not available\');',
  'console.error(\'❌ JWT验证失败:\', jwtError);',
  'console.error(\'❌ Stripe secret key not configured\');',
  'console.error(\'❌ DEEPSEEK_API_KEY not found\');'
];

// 确保关键日志被保留
criticalLogs.forEach(log => {
  if (!optimizedContent.includes(log)) {
    console.log(`⚠️ 关键日志可能被误删: ${log.substring(0, 50)}...`);
  }
});

const optimizedSize = optimizedContent.length;
const optimizedLines = optimizedContent.split('\n').length;
const sizeReduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

console.log(`📊 优化结果:`);
console.log(`   原大小: ${originalSize} 字符, ${originalLines} 行`);
console.log(`   新大小: ${optimizedSize} 字符, ${optimizedLines} 行`);
console.log(`   减少: ${totalReductions} 字符 (${sizeReduction}%)`);

// 写入优化后的文件
fs.writeFileSync(workerPath, optimizedContent, 'utf8');
console.log('✅ 优化完成，已保存到 worker.ts');

// 验证语法
console.log('🔍 验证优化后的文件语法...');
try {
  // 简单的语法检查
  const lines = optimizedContent.split('\n');
  let braceCount = 0;
  let hasErrors = false;
  
  lines.forEach((line, index) => {
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    // 检查是否有明显的语法错误
    if (line.includes('console.log(') && !line.includes(');')) {
      console.log(`⚠️ 第${index + 1}行可能有语法问题: ${line.trim()}`);
      hasErrors = true;
    }
  });
  
  if (braceCount !== 0) {
    console.log(`⚠️ 大括号不匹配，差异: ${braceCount}`);
    hasErrors = true;
  }
  
  if (!hasErrors) {
    console.log('✅ 基本语法检查通过');
  }
  
} catch (error) {
  console.error('❌ 语法验证失败:', error.message);
}

console.log('🎯 优化完成！现在可以尝试部署了。');
console.log('💡 如果需要恢复原文件，运行: cp worker.ts.backup worker.ts');
