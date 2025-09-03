// 测试特定用户删除功能的脚本
// 专门针对 494159635@qq.com 账号的删除问题

const API_BASE_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

async function testUserDeletion() {
    console.log('🧪 开始测试用户删除功能修复...');
    console.log('📧 目标用户: 494159635@qq.com');
    
    try {
        // 1. 首先尝试登录
        console.log('\n1️⃣ 尝试登录...');
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: '494159635@qq.com',
                password: 'test123' // 请替换为实际密码
            })
        });

        const loginData = await loginResponse.json();
        console.log('登录响应:', loginData);

        if (!loginData.success) {
            console.log('❌ 登录失败，请检查邮箱和密码');
            return;
        }

        const token = loginData.token;
        console.log('✅ 登录成功，获取到token');

        // 2. 发送删除验证码
        console.log('\n2️⃣ 发送删除验证码...');
        const sendCodeResponse = await fetch(`${API_BASE_URL}/api/auth/send-delete-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const sendCodeData = await sendCodeResponse.json();
        console.log('发送验证码响应:', sendCodeData);

        if (!sendCodeData.success) {
            console.log('❌ 发送验证码失败:', sendCodeData.message);
            return;
        }

        console.log('✅ 验证码发送成功，请检查邮箱');
        console.log('📧 请从邮箱中获取6位验证码，然后手动调用删除函数');
        
        // 提供手动删除函数
        global.deleteWithCode = async function(verificationCode) {
            console.log('\n3️⃣ 执行账号删除...');
            console.log('🔐 使用验证码:', verificationCode);
            
            try {
                const deleteResponse = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ verificationCode })
                });

                const deleteData = await deleteResponse.json();
                console.log('删除账号响应:', deleteData);

                if (deleteData.success) {
                    console.log('✅ 账号删除成功！修复验证通过！');
                    console.log('🎉 问题已解决：494159635@qq.com 账号可以正常删除了');
                } else {
                    console.log('❌ 账号删除失败:', deleteData.message);
                    if (deleteData.error) {
                        console.log('错误详情:', deleteData.error);
                    }
                }
            } catch (error) {
                console.error('❌ 删除请求错误:', error);
            }
        };

        console.log('\n📝 使用说明:');
        console.log('1. 检查邮箱 494159635@qq.com 获取6位验证码');
        console.log('2. 在控制台中运行: deleteWithCode("123456") // 替换为实际验证码');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testUserDeletion };
    
    // 直接运行测试
    if (require.main === module) {
        testUserDeletion();
    }
} else {
    // 在浏览器环境中运行
    testUserDeletion();
}
