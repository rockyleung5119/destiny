// Cloudflare Pages环境变量检查工具
// 使用wrangler pages命令检查环境变量设置

import { execSync } from 'child_process';
import fs from 'fs';

const CONFIG = {
    projectName: 'destiny-frontend',
    expectedKey: 'VITE_STRIPE_PUBLISHABLE_KEY',
    testStripeKey: 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um'
};

function log(level, message) {
    const colors = {
        info: '\x1b[36m',    // cyan
        success: '\x1b[32m', // green
        warning: '\x1b[33m', // yellow
        error: '\x1b[31m',   // red
        reset: '\x1b[0m'     // reset
    };
    
    console.log(`${colors[level]}${message}${colors.reset}`);
}

function runCommand(command, description) {
    try {
        log('info', `🔍 ${description}...`);
        const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
        log('success', `✅ ${description} 成功`);
        return { success: true, output: output.trim() };
    } catch (error) {
        log('error', `❌ ${description} 失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function checkCloudflarePages() {
    log('info', '🌐 Cloudflare Pages 环境变量检查');
    log('info', '=====================================');
    
    // 1. 检查wrangler是否可用
    const wranglerCheck = runCommand('wrangler --version', 'Wrangler版本检查');
    if (!wranglerCheck.success) {
        log('error', '请先安装wrangler: npm install -g wrangler');
        return;
    }
    
    log('info', `Wrangler版本: ${wranglerCheck.output}`);
    
    // 2. 检查是否已登录
    const authCheck = runCommand('wrangler whoami', '登录状态检查');
    if (!authCheck.success) {
        log('warning', '请先登录: wrangler login');
        return;
    }
    
    log('info', `当前用户: ${authCheck.output}`);
    
    // 3. 尝试列出Pages项目
    log('info', '\n📋 检查Pages项目...');
    const pagesListCheck = runCommand('wrangler pages project list', 'Pages项目列表');
    if (pagesListCheck.success) {
        log('info', 'Pages项目列表:');
        console.log(pagesListCheck.output);
        
        // 检查是否包含我们的项目
        if (pagesListCheck.output.includes(CONFIG.projectName)) {
            log('success', `✅ 找到项目: ${CONFIG.projectName}`);
        } else {
            log('warning', `⚠️ 未找到项目: ${CONFIG.projectName}`);
            log('info', '可用项目列表见上方输出');
        }
    }
    
    // 4. 检查本地环境文件
    log('info', '\n📁 检查本地环境文件...');
    const envFiles = ['.env', '.env.production', '.env.local'];
    
    envFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const hasStripeKey = content.includes('VITE_STRIPE_PUBLISHABLE_KEY');
            
            log(hasStripeKey ? 'success' : 'warning', 
                `${hasStripeKey ? '✅' : '⚠️'} ${file}: ${hasStripeKey ? '包含Stripe配置' : '缺少Stripe配置'}`);
                
            if (hasStripeKey) {
                // 提取密钥值
                const keyMatch = content.match(/VITE_STRIPE_PUBLISHABLE_KEY\s*=\s*(.+)/);
                if (keyMatch) {
                    const keyValue = keyMatch[1].replace(/['"]/g, '').trim();
                    log('info', `   密钥值: ${keyValue.substring(0, 20)}... (长度: ${keyValue.length})`);
                }
            }
        } else {
            log('warning', `⚠️ ${file}: 不存在`);
        }
    });
    
    // 5. 测试后端API
    log('info', '\n🔗 测试后端API连接...');
    try {
        const response = await fetch('https://api.indicate.top/api/stripe/health');
        const data = await response.json();
        
        if (data.success) {
            log('success', '✅ 后端API连接正常');
            log('info', `   Secret Key: ${data.stripe.backend.secretKeyConfigured ? '已配置' : '未配置'}`);
            log('info', `   支付系统: ${data.stripe.systemStatus.paymentSystemEnabled ? '启用' : '禁用'}`);
        } else {
            log('error', '❌ 后端API响应异常');
        }
    } catch (error) {
        log('error', `❌ 后端API连接失败: ${error.message}`);
    }
    
    // 6. 提供修复建议
    log('info', '\n🎯 修复建议:');
    log('info', '=============');
    
    log('warning', '方案1: 立即修复（临时）');
    log('info', '在生产网站浏览器控制台运行:');
    console.log(`localStorage.setItem('STRIPE_TEMP_KEY', '${CONFIG.testStripeKey}');`);
    console.log('location.reload();');
    
    log('warning', '\n方案2: 永久修复（推荐）');
    log('info', '在Cloudflare Pages Dashboard中设置:');
    log('info', '1. 访问 https://dash.cloudflare.com/');
    log('info', '2. Pages → destiny-frontend → Settings');
    log('info', '3. Environment variables → Add variable');
    log('info', `4. 变量名: ${CONFIG.expectedKey}`);
    log('info', `5. 值: ${CONFIG.testStripeKey}`);
    log('info', '6. 环境: Production');
    log('info', '7. 保存并等待重新部署');
    
    log('warning', '\n方案3: 使用wrangler设置（如果支持）');
    log('info', '注意: Cloudflare Pages环境变量通常需要在Dashboard中手动设置');
    
    log('success', '\n✅ 检查完成！');
}

// 运行检查
checkCloudflarePages().catch(error => {
    log('error', `❌ 检查过程出错: ${error.message}`);
    process.exit(1);
});
