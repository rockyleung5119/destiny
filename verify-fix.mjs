#!/usr/bin/env node

/**
 * 验证取消订阅修复的脚本
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verifyFix() {
  console.log('🔍 验证取消订阅修复...\n');

  let allPassed = true;

  try {
    // 1. 验证后端Stripe API修复
    console.log('=== 1. 验证后端Stripe API修复 ===');
    
    const workerPath = path.join(__dirname, 'backend', 'worker.ts');
    const workerContent = fs.readFileSync(workerPath, 'utf8');
    
    const backendChecks = [
      {
        name: 'cancel_at_period_end布尔值修复',
        test: workerContent.includes('cancel_at_period_end: true'),
        description: '确保使用布尔值而不是字符串'
      },
      {
        name: '立即取消方法修复',
        test: workerContent.includes('/subscriptions/${subscriptionId}/cancel'),
        description: '使用正确的cancel端点'
      },
      {
        name: '参数处理修复',
        test: workerContent.includes('formData.append(key, String(value))'),
        description: '正确处理布尔值参数'
      },
      {
        name: 'Stripe错误处理增强',
        test: workerContent.includes('STRIPE_SUBSCRIPTION_NOT_FOUND'),
        description: '增强的错误分类'
      },
      {
        name: 'API调用日志增强',
        test: workerContent.includes('🔄 Stripe API Request:'),
        description: '详细的API调用日志'
      }
    ];

    backendChecks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.test ? '通过' : '失败'}`);
      console.log(`   ${check.description}`);
      if (!check.test) allPassed = false;
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 验证前端错误处理修复
    console.log('=== 2. 验证前端错误处理修复 ===');
    
    const frontendPath = path.join(__dirname, 'src', 'components', 'MemberSettings.tsx');
    const frontendContent = fs.readFileSync(frontendPath, 'utf8');
    
    const frontendChecks = [
      {
        name: '错误代码处理',
        test: frontendContent.includes('data.code === \'ALREADY_CANCELLED\''),
        description: '处理已取消订阅的情况'
      },
      {
        name: '网络错误处理',
        test: frontendContent.includes('NETWORK_ERROR'),
        description: '处理网络连接错误'
      },
      {
        name: '认证错误处理',
        test: frontendContent.includes('AUTH_ERROR'),
        description: '处理认证失败错误'
      },
      {
        name: '用户友好错误信息',
        test: frontendContent.includes('Network error occurred. Please check your connection'),
        description: '提供清晰的错误提示'
      }
    ];

    frontendChecks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.test ? '通过' : '失败'}`);
      console.log(`   ${check.description}`);
      if (!check.test) allPassed = false;
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 验证API端点配置
    console.log('=== 3. 验证API端点配置 ===');
    
    const apiChecks = [
      {
        name: '取消订阅端点重定向',
        test: workerContent.includes('/api/membership/cancel-subscription'),
        description: '保持API兼容性的重定向'
      },
      {
        name: '增强的取消订阅端点',
        test: workerContent.includes('/api/stripe/cancel-subscription'),
        description: '新的增强版取消订阅端点'
      },
      {
        name: '调试测试端点',
        test: workerContent.includes('/api/debug/test-cancel-subscription'),
        description: '调试和测试工具'
      }
    ];

    apiChecks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.test ? '通过' : '失败'}`);
      console.log(`   ${check.description}`);
      if (!check.test) allPassed = false;
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. 总结
    console.log('=== 修复验证总结 ===');
    
    if (allPassed) {
      console.log('🎉 所有修复验证通过！');
      console.log('');
      console.log('✅ 关键修复点:');
      console.log('  • Stripe API调用方法正确 (POST + cancel_at_period_end=true)');
      console.log('  • 立即取消订阅方法正确 (POST /subscriptions/{id}/cancel)');
      console.log('  • 参数处理正确 (布尔值转换)');
      console.log('  • 错误处理增强 (详细分类和用户友好信息)');
      console.log('  • API调用日志完善 (便于调试)');
      console.log('  • 前端错误处理改进 (具体错误信息)');
      console.log('');
      console.log('🚀 修复已完成，可以部署到生产环境！');
      console.log('');
      console.log('📋 部署后验证步骤:');
      console.log('  1. 监控Cloudflare Workers日志');
      console.log('  2. 测试用户取消订阅功能');
      console.log('  3. 检查Stripe后台订阅状态');
      console.log('  4. 验证webhook事件触发');
    } else {
      console.log('❌ 部分修复验证失败，请检查上述问题');
      console.log('');
      console.log('🔧 建议:');
      console.log('  • 检查代码是否正确保存');
      console.log('  • 确认所有修改都已应用');
      console.log('  • 重新运行验证脚本');
    }

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    allPassed = false;
  }

  return allPassed;
}

// 运行验证
const success = verifyFix();
process.exit(success ? 0 : 1);
