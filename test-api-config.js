// 测试API配置
const axios = require('axios');

async function testAPIConfig() {
  console.log('🔍 Testing API Configuration...\n');
  
  // 从worker.ts中提取的默认配置
  const config = {
    apiKey: 'sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn',
    baseURL: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'Pro/deepseek-ai/DeepSeek-R1'
  };
  
  console.log('📊 Testing configuration:');
  console.log('- API Key:', config.apiKey.substring(0, 10) + '...');
  console.log('- Base URL:', config.baseURL);
  console.log('- Model:', config.model);
  console.log('');
  
  try {
    console.log('🧪 Testing simple API call...');
    
    const requestData = {
      model: config.model,
      messages: [
        { role: 'system', content: '你是一个测试助手。' },
        { role: 'user', content: '请简单回复"测试成功"' }
      ],
      temperature: 0.7,
      max_tokens: 100,
      stream: false
    };
    
    console.log('📤 Sending request...');
    const startTime = Date.now();
    
    const response = await axios.post(config.baseURL, requestData, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ API call successful in ${duration}ms`);
    console.log('📊 Response status:', response.status);
    console.log('📝 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content;
      console.log('💬 AI Response:', content);
      console.log('💰 Token usage:', response.data.usage);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.response) {
      console.error('📊 Error details:');
      console.error('- Status:', error.response.status);
      console.error('- Status Text:', error.response.statusText);
      console.error('- Data:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout - API is too slow');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 DNS resolution failed - check URL');
    } else {
      console.error('🔧 Other error:', error.code);
    }
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('1. If successful: API configuration is working');
  console.log('2. If timeout: API is too slow for production use');
  console.log('3. If 401/403: API key is invalid or expired');
  console.log('4. If 404: Model or URL is incorrect');
  console.log('5. If 429: Rate limit exceeded');
}

// 运行测试
testAPIConfig();
