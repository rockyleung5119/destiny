#!/usr/bin/env node

/**
 * 订阅Webhook测试脚本
 * 用于测试Monthly/Yearly订阅支付后的webhook处理
 */

const API_BASE = 'https://api.indicate.top';

// 测试用户信息
const TEST_USER = {
  id: 7,
  email: '494159635@qq.com',
  jwt: 'YOUR_JWT_TOKEN_HERE' // 需要替换为实际的JWT token
};

// 模拟的Stripe webhook事件数据
const MOCK_WEBHOOK_EVENTS = {
  // 订阅创建完成事件
  checkoutSessionCompleted: {
    "object": {
      "id": "cs_test_a1r06m3Q1OdOLMe7azhsldaDgUhuOidDakYDCnpRarEeWsoO2sVlzYGCFf",
      "object": "checkout.session",
      "client_reference_id": "user_7_plan_monthly_1756821120220",
      "customer": "cus_SysND1Mn70R8iA",
      "customer_details": {
        "email": "494159635@qq.com",
        "name": "rocky"
      },
      "mode": "subscription",
      "payment_status": "paid",
      "status": "complete",
      "subscription": "sub_1S2ud8Bb9puAdbwBmaCfXzVY",
      "amount_total": 1990,
      "currency": "usd"
    }
  },

  // 订阅支付成功事件
  invoicePaymentSucceeded: {
    "object": {
      "id": "in_1S2ud5Bb9puAdbwBfvwjCpu1",
      "object": "invoice",
      "amount_paid": 1990,
      "customer": "cus_SysND1Mn70R8iA",
      "subscription": "sub_1S2ud8Bb9puAdbwBmaCfXzVY",
      "status": "paid",
      "metadata": {
        "userId": "7",
        "planId": "monthly"
      }
    }
  }
};

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_USER.jwt}`,
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function testMembershipStatus() {
  console.log('🔍 检查用户会员状态...');
  
  const result = await makeRequest('/api/membership/status');
  
  console.log('会员状态:', {
    status: result.status,
    planId: result.data?.data?.planId,
    isActive: result.data?.data?.isActive,
    remainingCredits: result.data?.data?.remainingCredits,
    expiresAt: result.data?.data?.expiresAt
  });
  
  return result;
}

async function testDebugEndpoint() {
  console.log('🔍 检查调试信息...');
  
  const result = await makeRequest(`/api/debug/user/${TEST_USER.id}/membership`);
  
  if (result.status === 200) {
    const data = result.data.data;
    console.log('调试信息:', {
      memberships: data.memberships?.length || 0,
      paymentLogs: data.paymentLogs?.length || 0,
      systemLogs: data.systemLogs?.length || 0,
      userInfo: data.userInfo
    });
    
    // 显示最新的会员记录
    if (data.memberships && data.memberships.length > 0) {
      console.log('最新会员记录:', data.memberships[0]);
    }
    
    // 显示最新的支付日志
    if (data.paymentLogs && data.paymentLogs.length > 0) {
      console.log('最新支付日志:', data.paymentLogs[0]);
    }
  } else {
    console.error('调试端点错误:', result);
  }
  
  return result;
}

async function testManualFix() {
  console.log('🔧 测试手动修复订阅...');
  
  const result = await makeRequest(`/api/debug/user/${TEST_USER.id}/fix-subscription`, {
    method: 'POST',
    body: JSON.stringify({
      planId: 'monthly',
      subscriptionId: 'sub_1S2ud8Bb9puAdbwBmaCfXzVY'
    })
  });
  
  console.log('手动修复结果:', result);
  return result;
}

async function testWebhookEvents() {
  console.log('🔍 检查webhook事件...');
  
  const result = await makeRequest('/api/debug/webhook-events');
  
  if (result.status === 200) {
    const data = result.data.data;
    console.log('Webhook事件:', {
      webhookLogs: data.webhookLogs?.length || 0,
      recentPayments: data.recentPayments?.length || 0
    });
    
    // 显示最新的webhook日志
    if (data.webhookLogs && data.webhookLogs.length > 0) {
      console.log('最新webhook日志:', data.webhookLogs.slice(0, 3));
    }
  } else {
    console.error('Webhook事件查询错误:', result);
  }
  
  return result;
}

async function runTests() {
  console.log('🚀 开始测试订阅webhook修复...\n');
  
  try {
    // 1. 检查当前会员状态
    console.log('=== 1. 当前会员状态 ===');
    await testMembershipStatus();
    console.log('');
    
    // 2. 检查调试信息
    console.log('=== 2. 调试信息 ===');
    await testDebugEndpoint();
    console.log('');
    
    // 3. 检查webhook事件
    console.log('=== 3. Webhook事件 ===');
    await testWebhookEvents();
    console.log('');
    
    // 4. 如果会员状态不正确，尝试手动修复
    console.log('=== 4. 手动修复测试 ===');
    const membershipResult = await testMembershipStatus();
    
    if (!membershipResult.data?.data?.isActive || membershipResult.data?.data?.planId !== 'monthly') {
      console.log('会员状态异常，尝试手动修复...');
      await testManualFix();
      
      // 再次检查状态
      console.log('修复后状态:');
      await testMembershipStatus();
    } else {
      console.log('✅ 会员状态正常，无需修复');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 检查是否提供了JWT token
if (TEST_USER.jwt === 'YOUR_JWT_TOKEN_HERE') {
  console.error('❌ 请先设置有效的JWT token');
  console.log('使用方法:');
  console.log('1. 登录系统获取JWT token');
  console.log('2. 修改脚本中的TEST_USER.jwt');
  console.log('3. 运行: node test-subscription-webhook.js');
  process.exit(1);
}

// 运行测试
runTests();
