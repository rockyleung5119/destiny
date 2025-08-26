// Cloudflare Pages环境变量调试工具
// 在生产网站控制台运行此代码来诊断问题

console.log('🔍 Cloudflare Pages Stripe环境变量调试');
console.log('=====================================');

// 1. 检查所有环境变量
console.log('\n📊 环境变量总览:');
if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    const allEnvKeys = Object.keys(import.meta.env);
    console.log(`总环境变量数量: ${allEnvKeys.length}`);
    
    // 显示所有VITE_和REACT_APP_变量
    const cloudflareVars = allEnvKeys.filter(key => 
        key.startsWith('VITE_') || key.startsWith('REACT_APP_')
    );
    console.log(`Cloudflare环境变量数量: ${cloudflareVars.length}`);
    console.log('Cloudflare环境变量列表:', cloudflareVars);
    
    // 显示所有Stripe相关变量
    const stripeVars = allEnvKeys.filter(key => 
        key.includes('STRIPE') || key.includes('stripe')
    );
    console.log(`Stripe相关变量数量: ${stripeVars.length}`);
    console.log('Stripe相关变量列表:', stripeVars);
} else {
    console.log('❌ 无法访问 import.meta.env');
}

// 2. 检查具体的Stripe密钥
console.log('\n🔑 Stripe密钥检查:');
const viteKey = typeof import !== 'undefined' && import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY;
const reactKey = typeof import !== 'undefined' && import.meta?.env?.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');

console.log('VITE_STRIPE_PUBLISHABLE_KEY:');
console.log(`  存在: ${!!viteKey}`);
console.log(`  类型: ${typeof viteKey}`);
console.log(`  长度: ${viteKey?.length || 0}`);
console.log(`  前缀: ${viteKey?.substring(0, 10) || 'none'}`);
console.log(`  完整值: ${viteKey || 'undefined'}`);

console.log('\nREACT_APP_STRIPE_PUBLISHABLE_KEY:');
console.log(`  存在: ${!!reactKey}`);
console.log(`  类型: ${typeof reactKey}`);
console.log(`  长度: ${reactKey?.length || 0}`);
console.log(`  前缀: ${reactKey?.substring(0, 10) || 'none'}`);

console.log('\nlocalStorage STRIPE_TEMP_KEY:');
console.log(`  存在: ${!!tempKey}`);
console.log(`  类型: ${typeof tempKey}`);
console.log(`  长度: ${tempKey?.length || 0}`);
console.log(`  前缀: ${tempKey?.substring(0, 10) || 'none'}`);

// 3. 密钥验证测试
console.log('\n🧪 密钥验证测试:');

function testKeyValidation(key, source) {
    if (!key) {
        console.log(`${source}: ❌ 密钥不存在`);
        return false;
    }
    
    const hasValidPrefix = key.startsWith('pk_test_') || key.startsWith('pk_live_');
    const hasValidLength = key.length >= 100;
    
    const invalidPatterns = [
        'MUST_BE_SET',
        'placeholder',
        'your-stripe',
        'undefined',
        'null',
        'REPLACE_WITH'
    ];
    
    const isPlaceholder = invalidPatterns.some(pattern => 
        key.toLowerCase().includes(pattern.toLowerCase())
    );
    
    const isValid = hasValidPrefix && hasValidLength && !isPlaceholder;
    
    console.log(`${source}:`);
    console.log(`  ✓ 前缀检查: ${hasValidPrefix ? '通过' : '失败'} (${key.substring(0, 10)})`);
    console.log(`  ✓ 长度检查: ${hasValidLength ? '通过' : '失败'} (${key.length}/100)`);
    console.log(`  ✓ 占位符检查: ${!isPlaceholder ? '通过' : '失败'}`);
    console.log(`  🎯 最终结果: ${isValid ? '✅ 有效' : '❌ 无效'}`);
    
    return isValid;
}

const viteValid = testKeyValidation(viteKey, 'VITE_STRIPE_PUBLISHABLE_KEY');
const reactValid = testKeyValidation(reactKey, 'REACT_APP_STRIPE_PUBLISHABLE_KEY');
const tempValid = testKeyValidation(tempKey, 'localStorage临时密钥');

// 4. 最终状态
console.log('\n🎯 最终状态:');
const hasAnyValidKey = viteValid || reactValid || tempValid;
console.log(`支付系统状态: ${hasAnyValidKey ? '✅ 可用' : '❌ 不可用'}`);

if (!hasAnyValidKey) {
    console.log('\n🔧 修复建议:');
    console.log('1. 检查Cloudflare Pages Dashboard中的环境变量设置');
    console.log('2. 确保变量名为: VITE_STRIPE_PUBLISHABLE_KEY');
    console.log('3. 确保密钥值完整且正确');
    console.log('4. 确保在Production环境中设置');
    console.log('5. 保存后等待重新部署');
    
    console.log('\n⚡ 临时修复:');
    console.log('localStorage.setItem("STRIPE_TEMP_KEY", "pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um");');
    console.log('location.reload();');
}

// 5. 环境信息
console.log('\n📊 环境信息:');
console.log(`当前域名: ${window.location.hostname}`);
console.log(`是否Cloudflare Pages: ${window.location.hostname.includes('pages.dev')}`);
console.log(`用户代理: ${navigator.userAgent}`);
console.log(`当前时间: ${new Date().toISOString()}`);

// 导出调试数据
window.stripeDebugData = {
    timestamp: new Date().toISOString(),
    environment: {
        hostname: window.location.hostname,
        userAgent: navigator.userAgent,
        isCloudflarePages: window.location.hostname.includes('pages.dev')
    },
    keys: {
        vite: { exists: !!viteKey, length: viteKey?.length || 0, valid: viteValid },
        react: { exists: !!reactKey, length: reactKey?.length || 0, valid: reactValid },
        temp: { exists: !!tempKey, length: tempKey?.length || 0, valid: tempValid }
    },
    systemStatus: hasAnyValidKey
};

console.log('\n💾 调试数据已保存到 window.stripeDebugData');
console.log('可以通过 console.log(window.stripeDebugData) 查看完整信息');
