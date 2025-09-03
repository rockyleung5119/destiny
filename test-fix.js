#!/usr/bin/env node

/**
 * 测试取消订阅修复的脚本
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_URL = 'http://127.0.0.1:8787';

async function testCancelSubscriptionFix() {
  console.log('🧪 测试取消订阅修复...\n');

  try {
    // 1. 测试调试端点是否可用
    console.log('=== 1. 测试调试端点 ===');
    const debugResponse = await fetch(`${LOCAL_URL}/api/debug/test-cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: '1',
        subscriptionId: 'sub_test123',
        immediate: false
      })
    });

    console.log('调试端点状态:', debugResponse.status);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ 调试端点可用');
      console.log('响应:', JSON.stringify(debugData, null, 2));
    } else {
      const errorText = await debugResponse.text();
      console.log('❌ 调试端点失败:', errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 测试Stripe API客户端的修复
    console.log('=== 2. 验证Stripe API修复 ===');
    
    // 检查代码是否包含正确的修复
    
    const workerPath = path.join(__dirname, 'backend', 'worker.ts');
    const workerContent = fs.readFileSync(workerPath, 'utf8');
    
    // 检查关键修复点
    const checks = [
      {
        name: 'cancel_at_period_end布尔值修复',
        test: workerContent.includes('cancel_at_period_end: true'),
        expected: true
      },
      {
        name: '立即取消方法修复',
        test: workerContent.includes('/subscriptions/${subscriptionId}/cancel'),
        expected: true
      },
      {
        name: '参数处理修复',
        test: workerContent.includes('formData.append(key, String(value))'),
        expected: true
      },
      {
        name: '错误处理增强',
        test: workerContent.includes('STRIPE_SUBSCRIPTION_NOT_FOUND'),
        expected: true
      }
    ];

    checks.forEach(check => {
      const status = check.test === check.expected ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.test ? '通过' : '失败'}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 测试前端错误处理修复
    console.log('=== 3. 验证前端错误处理修复 ===');
    
    const frontendPath = path.join(__dirname, 'src', 'components', 'MemberSettings.tsx');
    const frontendContent = fs.readFileSync(frontendPath, 'utf8');
    
    const frontendChecks = [
      {
        name: '错误代码处理',
        test: frontendContent.includes('data.code === \'ALREADY_CANCELLED\''),
        expected: true
      },
      {
        name: '网络错误处理',
        test: frontendContent.includes('NETWORK_ERROR'),
        expected: true
      },
      {
        name: '认证错误处理',
        test: frontendContent.includes('AUTH_ERROR'),
        expected: true
      }
    ];

    frontendChecks.forEach(check => {
      const status = check.test === check.expected ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.test ? '通过' : '失败'}`);
    });

    console.log('\n🏁 修复验证完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testCancelSubscriptionFix().catch(console.error);
