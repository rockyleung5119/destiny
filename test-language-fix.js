// 测试语言修复后的AI服务
const LOCAL_API_URL = 'http://localhost:3001';

// demo用户登录信息
const demoUser = {
  email: 'demo@example.com',
  password: 'password123'
};

async function testLanguageFix() {
  console.log('🌍 Testing Language Fix for AI Services');
  
  try {
    // 步骤1: 登录demo用户
    console.log('\n🔐 Step 1: Login demo user...');
    const loginResponse = await fetch(`${LOCAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(demoUser)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`❌ Login failed: ${loginResponse.status} - ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // 测试两种语言的所有服务
    const languages = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ];
    
    const services = [
      { 
        name: 'BaZi Analysis', 
        endpoint: '/api/fortune/bazi', 
        body: (lang) => ({ language: lang })
      },
      { 
        name: 'Daily Fortune', 
        endpoint: '/api/fortune/daily', 
        body: (lang) => ({ language: lang })
      },
      { 
        name: 'Tarot Reading', 
        endpoint: '/api/fortune/tarot', 
        body: (lang) => ({ question: lang === 'zh' ? '我的事业发展如何？' : 'How will my career develop?', language: lang })
      },
      { 
        name: 'Lucky Items', 
        endpoint: '/api/fortune/lucky', 
        body: (lang) => ({ language: lang })
      }
    ];
    
    for (const language of languages) {
      console.log(`\n🌍 Testing ${language.name} (${language.code}):`);
      console.log('='.repeat(50));
      
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        console.log(`\n🔮 ${service.name} (${language.code})...`);
        
        try {
          const response = await fetch(`${LOCAL_API_URL}${service.endpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept-Language': language.code
            },
            body: JSON.stringify(service.body(language.code))
          });
          
          console.log(`Status: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ ${service.name} failed: ${errorText}`);
            continue;
          }
          
          const data = await response.json();
          console.log(`✅ ${service.name} success: ${data.success}`);
          
          if (data.success && data.data?.analysis) {
            const analysis = data.data.analysis;
            console.log(`Analysis length: ${analysis.length} characters`);
            console.log(`Analysis preview: ${analysis.substring(0, 100)}...`);
            
            // 语言检查
            const chineseChars = analysis.match(/[\u4e00-\u9fa5]/g);
            const englishWords = analysis.match(/[a-zA-Z]+/g);
            const chineseCount = chineseChars ? chineseChars.length : 0;
            const englishWordCount = englishWords ? englishWords.length : 0;
            
            if (language.code === 'zh') {
              if (chineseCount > englishWordCount) {
                console.log('✅ Language check: Chinese content (correct)');
              } else {
                console.log('❌ Language check: Expected Chinese but got English');
              }
            } else if (language.code === 'en') {
              if (englishWordCount > chineseCount) {
                console.log('✅ Language check: English content (correct)');
              } else {
                console.log('❌ Language check: Expected English but got Chinese');
              }
            }
          } else {
            console.error(`❌ ${service.name} returned success=false or no analysis data`);
            console.error('Response data:', JSON.stringify(data, null, 2));
          }
          
        } catch (serviceError) {
          console.error(`❌ ${service.name} error:`, serviceError.message);
        }
        
        // 添加延迟避免API限制
        if (i < services.length - 1) {
          console.log('⏳ Waiting 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    console.log('\n🎉 Language fix testing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// 运行测试
testLanguageFix();
