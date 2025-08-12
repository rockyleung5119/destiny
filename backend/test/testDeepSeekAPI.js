// DeepSeek API测试脚本
const axios = require('axios');

const API_KEY = 'sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn';
const BASE_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL = 'Pro/deepseek-ai/DeepSeek-R1';

async function testDeepSeekAPI() {
  console.log('🧪 Testing DeepSeek API Configuration...\n');

  try {
    // 测试基本API连接
    console.log('1. Testing basic API connection...');
    
    const testMessage = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的AI助手，请用中文回答问题。'
        },
        {
          role: 'user',
          content: '请简单介绍一下你自己，并确认你可以进行中文对话。'
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    const response = await axios.post(BASE_URL, testMessage, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ API Connection successful!');
    console.log('📝 Response:', response.data.choices[0].message.content);
    console.log('📊 Usage:', response.data.usage);
    console.log('');

    // 测试算命功能
    console.log('2. Testing fortune telling capability...');
    
    const fortuneMessage = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位精通中国传统八字命理学的大师，拥有数十年的实战经验。'
        },
        {
          role: 'user',
          content: `
请根据以下用户信息进行简要的八字分析：

姓名：张三
性别：男
出生日期：1990年5月15日
出生时辰：10时
出生地点：北京

请简要分析此人的性格特征和事业运势（限制在200字以内）。
          `
        }
      ],
      temperature: 0.8,
      max_tokens: 800
    };

    const fortuneResponse = await axios.post(BASE_URL, fortuneMessage, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Fortune telling test successful!');
    console.log('🔮 Fortune Analysis:');
    console.log(fortuneResponse.data.choices[0].message.content);
    console.log('📊 Usage:', fortuneResponse.data.usage);
    console.log('');

    // 测试多语言翻译
    console.log('3. Testing translation capability...');
    
    const translationMessage = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的翻译专家，特别擅长翻译中国传统文化和命理学内容。'
        },
        {
          role: 'user',
          content: `
请将以下中文算命分析结果翻译成English，保持专业术语的准确性：

根据八字分析，此人性格坚毅，具有领导才能。五行中木旺火相，适合从事创新性工作。事业运势在30岁后逐渐上升，财运亨通。建议多与水相关的行业合作，有助于平衡五行。

翻译要求：
1. 保持算命术语的专业性
2. 保留中国传统文化的内涵
3. 语言要流畅自然
          `
        }
      ],
      temperature: 0.3,
      max_tokens: 600
    };

    const translationResponse = await axios.post(BASE_URL, translationMessage, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Translation test successful!');
    console.log('🌐 Translated Result:');
    console.log(translationResponse.data.choices[0].message.content);
    console.log('📊 Usage:', translationResponse.data.usage);
    console.log('');

    // 测试每日运势
    console.log('4. Testing daily fortune capability...');
    
    const dailyFortuneMessage = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位精通天体运行和传统命理的占卜大师，能够准确分析每日运势变化。'
        },
        {
          role: 'user',
          content: `
请根据以下用户信息分析今日运势：

姓名：李四
性别：女
出生日期：1985年8月20日
出生时辰：14时
出生地点：上海

今日日期：${new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long', 
  day: 'numeric',
  weekday: 'long'
})}

请简要分析今日的整体运势、事业运势和感情运势（限制在150字以内）。
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    };

    const dailyResponse = await axios.post(BASE_URL, dailyFortuneMessage, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Daily fortune test successful!');
    console.log('📅 Daily Fortune:');
    console.log(dailyResponse.data.choices[0].message.content);
    console.log('📊 Usage:', dailyResponse.data.usage);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('✅ DeepSeek API is properly configured and ready for fortune telling services.');

  } catch (error) {
    console.error('❌ API Test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check if the API key is correct');
    console.log('2. Verify the API endpoint URL');
    console.log('3. Ensure you have sufficient API credits');
    console.log('4. Check your internet connection');
    console.log('5. Verify the model name is correct');
  }
}

// 运行测试
if (require.main === module) {
  testDeepSeekAPI();
}

module.exports = { testDeepSeekAPI };
