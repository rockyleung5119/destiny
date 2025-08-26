// 生产环境变量调试脚本
// 请在 https://destiny-frontend.pages.dev 的浏览器控制台运行

console.log('🌐 生产环境Stripe配置调试');
console.log('==========================');
console.log(`时间: ${new Date().toLocaleString()}`);
console.log(`位置: ${window.location.href}`);
console.log('');

// 1. 检查环境变量可用性
console.log('📊 环境变量系统检查:');
try {
    if (typeof import !== 'undefined' && import.meta && import.meta.env) {
        console.log('✅ import.meta.env 可用');
        
        const env = import.meta.env;
        const allKeys = Object.keys(env);
        console.log(`   总变量数量: ${allKeys.length}`);
        
        // 显示所有环境变量（隐藏敏感值）
        console.log('   所有环境变量:');
        allKeys.forEach(key => {
            const value = env[key];
            const displayValue = typeof value === 'string' && value.length > 20 
                ? `${value.substring(0, 10)}...` 
                : value;
            console.log(`     ${key}: ${displayValue}`);
        });
        
    } else {
        console.log('❌ import.meta.env 不可用');
    }
} catch (error) {
    console.log(`❌ 环境变量检查失败: ${error.message}`);
}

// 2. 专门检查Stripe密钥
console.log('\n🔑 Stripe密钥详细检查:');
try {
    const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');
    
    console.log('VITE_STRIPE_PUBLISHABLE_KEY:');
    console.log(`   存在: ${!!viteKey}`);
    console.log(`   类型: ${typeof viteKey}`);
    console.log(`   长度: ${viteKey?.length || 0}`);
    console.log(`   前10字符: ${viteKey?.substring(0, 10) || 'none'}`);
    console.log(`   后10字符: ${viteKey?.substring(viteKey.length - 10) || 'none'}`);
    console.log(`   完整值: "${viteKey || 'undefined'}"`);
    
    console.log('\nREACT_APP_STRIPE_PUBLISHABLE_KEY:');
    console.log(`   存在: ${!!reactKey}`);
    console.log(`   类型: ${typeof reactKey}`);
    console.log(`   长度: ${reactKey?.length || 0}`);
    console.log(`   完整值: "${reactKey || 'undefined'}"`);
    
    console.log('\nlocalStorage STRIPE_TEMP_KEY:');
    console.log(`   存在: ${!!tempKey}`);
    console.log(`   类型: ${typeof tempKey}`);
    console.log(`   长度: ${tempKey?.length || 0}`);
    console.log(`   完整值: "${tempKey || 'undefined'}"`);
    
} catch (error) {
    console.log(`❌ 密钥检查失败: ${error.message}`);
}

// 3. 密钥验证测试
console.log('\n🧪 密钥验证测试:');

function validateStripeKey(key, source) {
    if (!key) {
        console.log(`${source}: ❌ 密钥不存在`);
        return false;
    }
    
    // 非常宽松的验证
    const hasPrefix = key.startsWith('pk_');
    const hasMinLength = key.length >= 20;
    const notPlaceholder = !key.includes('MUST_BE_SET') && 
                          !key.includes('placeholder') && 
                          !key.includes('your-stripe');
    
    const isValid = hasPrefix && hasMinLength && notPlaceholder;
    
    console.log(`${source}:`);
    console.log(`   前缀检查: ${hasPrefix ? '✅' : '❌'} (${key.substring(0, 5)})`);
    console.log(`   长度检查: ${hasMinLength ? '✅' : '❌'} (${key.length}字符)`);
    console.log(`   占位符检查: ${notPlaceholder ? '✅' : '❌'}`);
    console.log(`   最终结果: ${isValid ? '✅ 有效' : '❌ 无效'}`);
    
    return isValid;
}

try {
    const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');
    
    const viteValid = validateStripeKey(viteKey, 'VITE_STRIPE_PUBLISHABLE_KEY');
    const reactValid = validateStripeKey(reactKey, 'REACT_APP_STRIPE_PUBLISHABLE_KEY');
    const tempValid = validateStripeKey(tempKey, 'localStorage临时密钥');
    
    const hasValidKey = viteValid || reactValid || tempValid;
    
    console.log('\n🎯 最终状态:');
    console.log(`支付系统: ${hasValidKey ? '✅ 应该可用' : '❌ 不可用'}`);
    
    if (!hasValidKey) {
        console.log('\n🔧 立即修复代码:');
        console.log('localStorage.setItem("STRIPE_TEMP_KEY", "pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um");');
        console.log('location.reload();');
        
        console.log('\n📋 Cloudflare Pages设置检查:');
        console.log('1. 确认变量名: VITE_STRIPE_PUBLISHABLE_KEY');
        console.log('2. 确认环境: Production');
        console.log('3. 确认密钥完整性（107字符）');
        console.log('4. 保存后等待重新部署');
    }
    
} catch (error) {
    console.log(`❌ 验证过程出错: ${error.message}`);
}

console.log('\n💾 调试完成！');
console.log('如果问题仍然存在，请检查Cloudflare Pages Dashboard中的环境变量设置。');
