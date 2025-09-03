#!/usr/bin/env node

/**
 * 调试生产环境会员状态
 * 检查用户7的会员记录和支付日志
 */

const API_BASE = 'https://api.indicate.top';

async function debugMembership() {
  console.log('🔍 调试生产环境会员状态...\n');

  try {
    // 1. 检查调试端点是否可用
    console.log('=== 1. 检查调试端点 ===');
    const debugResponse = await fetch(`${API_BASE}/api/debug/webhook-events`);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ 调试端点可用');
      console.log('Webhook日志数量:', debugData.data?.webhookLogs?.length || 0);
      console.log('最近支付数量:', debugData.data?.recentPayments?.length || 0);
      
      // 显示最新的webhook日志
      if (debugData.data?.webhookLogs?.length > 0) {
        console.log('\n最新Webhook事件:');
        debugData.data.webhookLogs.slice(0, 3).forEach((log, index) => {
          console.log(`${index + 1}. ${log.event_type} - ${log.status} (${log.created_at})`);
          if (log.details) {
            try {
              const details = JSON.parse(log.details);
              console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
            } catch (e) {
              console.log(`   详情: ${log.details}`);
            }
          }
        });
      }
    } else {
      console.log('❌ 调试端点不可用:', debugResponse.status);
    }

    // 2. 检查用户7的会员状态
    console.log('\n=== 2. 检查用户7会员状态 ===');
    const membershipResponse = await fetch(`${API_BASE}/api/debug/user/7/membership`);
    
    if (membershipResponse.ok) {
      const membershipData = await membershipResponse.json();
      console.log('✅ 用户会员状态查询成功');
      console.log('会员记录数:', membershipData.data?.memberships?.length || 0);
      console.log('支付日志数:', membershipData.data?.paymentLogs?.length || 0);
      console.log('系统日志数:', membershipData.data?.systemLogs?.length || 0);
      
      // 显示会员记录
      if (membershipData.data?.memberships?.length > 0) {
        console.log('\n会员记录:');
        membershipData.data.memberships.forEach((membership, index) => {
          console.log(`${index + 1}. 套餐: ${membership.plan_id}, 激活: ${membership.is_active}, 积分: ${membership.remaining_credits}, 到期: ${membership.expires_at}`);
        });
      } else {
        console.log('❌ 没有找到会员记录');
      }
      
      // 显示支付日志
      if (membershipData.data?.paymentLogs?.length > 0) {
        console.log('\n支付日志:');
        membershipData.data.paymentLogs.slice(0, 5).forEach((payment, index) => {
          console.log(`${index + 1}. 套餐: ${payment.plan_id}, 状态: ${payment.status}, 金额: ${payment.amount}, 时间: ${payment.created_at}`);
        });
      }
      
      // 显示系统日志
      if (membershipData.data?.systemLogs?.length > 0) {
        console.log('\n最新系统日志:');
        membershipData.data.systemLogs.slice(0, 3).forEach((log, index) => {
          console.log(`${index + 1}. [${log.level}] ${log.message} (${log.created_at})`);
          if (log.details) {
            try {
              const details = JSON.parse(log.details);
              console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
            } catch (e) {
              console.log(`   详情: ${log.details}`);
            }
          }
        });
      }
    } else {
      console.log('❌ 用户会员状态查询失败:', membershipResponse.status);
    }

    // 3. 检查API健康状态
    console.log('\n=== 3. 检查API健康状态 ===');
    const healthResponse = await fetch(`${API_BASE}/api/stripe/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API健康检查通过');
      console.log('Stripe配置:', healthData.stripe ? '✅' : '❌');
      console.log('数据库连接:', healthData.database ? '✅' : '❌');
    } else {
      console.log('❌ API健康检查失败:', healthResponse.status);
    }

    // 4. 检查数据库表结构
    console.log('\n=== 4. 检查数据库表结构 ===');
    const tablesResponse = await fetch(`${API_BASE}/api/debug/database-info`);
    
    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      console.log('✅ 数据库表信息获取成功');
      console.log('表结构:', JSON.stringify(tablesData, null, 2));
    } else {
      console.log('❌ 数据库表信息获取失败:', tablesResponse.status);
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
  }
}

// 运行调试
debugMembership().then(() => {
  console.log('\n🏁 调试完成');
}).catch(error => {
  console.error('❌ 调试失败:', error);
});
