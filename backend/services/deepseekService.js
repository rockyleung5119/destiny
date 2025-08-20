// DeepSeek AI算命服务 - 简化版
const axios = require('axios');

class DeepSeekService {
  constructor() {
    // 使用DeepSeek官方API，速度更快，响应更稳定
    this.apiKey = 'sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn';
    this.baseURL = 'https://api.deepseek.com/v1/chat/completions';
    this.model = 'deepseek-chat'; // 使用官方模型，速度更快
  }

  // 获取语言名称（中文）
  getLanguageName(language) {
    const languageNames = {
      'zh': '中文',
      'en': '英语',
      'es': '西班牙语',
      'fr': '法语',
      'ja': '日语'
    };
    return languageNames[language] || '英语';
  }



  // 构建用户档案
  buildUserProfile(user, userTimezone = null) {
    // 兼容数据库字段名（snake_case）和前端字段名（camelCase）
    const name = user.name;
    const gender = user.gender;
    const birthYear = user.birth_year || user.birthYear;
    const birthMonth = user.birth_month || user.birthMonth;
    const birthDay = user.birth_day || user.birthDay;
    const birthHour = user.birth_hour || user.birthHour;
    const birthPlace = user.birth_place || user.birthPlace;

    const genderText = gender === 'male' ? '男' : '女';
    const birthTime = birthHour ? `${birthHour}时` : '未知';
    const timezone = userTimezone || user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentDate = new Date().toLocaleDateString('zh-CN', { timeZone: timezone });
    const currentTime = new Date().toLocaleTimeString('zh-CN', { timeZone: timezone });

    return `
姓名：${name}
性别：${genderText}
出生日期：${birthYear}年${birthMonth}月${birthDay}日
出生时辰：${birthTime}
出生地点：${birthPlace}
用户时区：${timezone}
当前日期：${currentDate}
当前时间：${currentTime}
    `.trim();
  }

  // 过滤AI模型标识信息，保留其他内容
  cleanAIOutput(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    // 过滤掉AI模型标识信息，但保留其他所有内容
    let cleanedContent = content
      // 过滤DeepSeek相关标识
      .replace(/以上内容由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/本分析由\s*DeepSeek\s*AI\s*提供[，。]?.*$/gim, '')
      .replace(/.*DeepSeek\s*AI\s*模型生成.*$/gim, '')
      .replace(/.*内容由.*AI.*大模型.*生成.*$/gim, '')
      .replace(/本文内容由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/.*内容由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/.*本文内容由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*文内容由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*内容由DeepSeek生成.*$/gim, '')
      .replace(/此分析由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/.*此分析由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*分析由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*DeepSeek\s*生成.*$/gim, '')
      // 过滤其他AI模型标识
      .replace(/以上内容由.*AI.*生成[，。]?.*$/gim, '')
      .replace(/以上内容由.*AI.*提供[，。]?.*$/gim, '')
      .replace(/本分析由.*AI.*提供[，。]?.*$/gim, '')
      .replace(/.*由.*人工智能.*生成.*$/gim, '')
      .replace(/.*AI.*模型.*生成.*内容.*$/gim, '')
      .replace(/.*内容由.*AI.*生成.*$/gim, '')
      .replace(/.*由.*AI.*模型.*生成.*$/gim, '')
      .replace(/.*此.*由.*AI.*生成.*$/gim, '')
      .replace(/.*分析由.*AI.*生成.*$/gim, '')
      .replace(/.*由.*大模型.*生成.*$/gim, '')
      .replace(/.*由.*语言模型.*生成.*$/gim, '')
      .replace(/.*AI.*提供[，。]?.*$/gim, '')
      // 过滤其他常见AI模型名称
      .replace(/.*由.*ChatGPT.*生成.*$/gim, '')
      .replace(/.*由.*GPT.*生成.*$/gim, '')
      .replace(/.*由.*Claude.*生成.*$/gim, '')
      .replace(/.*由.*文心一言.*生成.*$/gim, '')
      .replace(/.*由.*通义千问.*生成.*$/gim, '')
      .replace(/.*由.*智谱.*生成.*$/gim, '')
      .replace(/.*由.*百川.*生成.*$/gim, '')
      // 过滤免责声明相关
      .replace(/仅供娱乐参考[，。]?.*$/gim, '')
      .replace(/仅供文化参考[，。]?.*$/gim, '')
      .replace(/命理之说玄妙[，。]?.*$/gim, '')
      .replace(/但人生的画笔始终掌握在您自己手中[，。]?.*$/gim, '')
      .replace(/愿您以开放的心态看待这些分析[，。]?.*$/gim, '')
      .replace(/更以坚定的行动书写属于自己的精彩篇章[，。]?.*$/gim, '')
      .replace(/切勿轻信盲从[，。]?.*$/gim, '')
      .replace(/生活决策请以现实需求为准[，。]?.*$/gim, '')
      .replace(/请以理性态度对待[，。]?.*$/gim, '')
      .replace(/仅作参考[，。]?.*$/gim, '')
      // 过滤包含多个关键词的长句子
      .replace(/.*以上建议基于.*实际效果.*个人行动.*风水布局.*简洁自然.*避免过度堆砌.*$/gim, '')
      .replace(/.*本文内容由.*生成.*仅供.*参考.*切勿轻信.*生活决策.*现实需求.*$/gim, '')
      .replace(/.*基于.*命理.*实际效果.*配合.*行动.*布局.*简洁.*避免.*堆砌.*内容由.*生成.*参考.*轻信.*决策.*现实.*$/gim, '')
      // 清理多余的空行和标点
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/[，。]\s*$/, '')
      // 清理空的引用块
      .replace(/>\s*$/gm, '')
      .replace(/>\s*\n/g, '\n')
      // 清理连续的空行
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleanedContent;
  }

  // 八字专用 - 过滤AI标识，保留100%原始排盘信息
  cleanBaziOutput(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    // 使用通用清理函数，过滤AI标识但保留所有排盘信息
    return this.cleanAIOutput(content);
  }

  // 调用DeepSeek API（Cloudflare Workers 30秒限制优化）
  async callDeepSeekAPI(messages, temperature = 0.7, language = 'zh', cleaningType = 'default', maxTokens = 1500) {
    try {
      console.log(`🔧 callDeepSeekAPI - Language: ${language}`);
      console.log(`🌐 API URL: ${this.baseURL}`);
      console.log(`🤖 Model: ${this.model}`);
      console.log(`📝 Messages:`, JSON.stringify(messages, null, 2));

      const requestData = {
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      };

      console.log(`📤 发送请求到DeepSeek官方API...`);
      const startTime = Date.now();

      // Cloudflare Workers有30秒执行限制，设置25秒超时留出处理时间
      const timeout = 25000;

      const response = await axios.post(this.baseURL, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: timeout
      });

      const endTime = Date.now();
      console.log(`⏱️ API响应时间: ${endTime - startTime}ms`);

      if (response.data && response.data.choices && response.data.choices[0]) {
        const rawContent = response.data.choices[0].message.content;
        console.log('✅ DeepSeek API调用成功');
        console.log(`📊 原始响应长度: ${rawContent.length} 字符`);
        console.log(`📝 原始响应开头: ${rawContent.substring(0, 100)}...`);

        // 根据清理类型选择清理方式
        let cleanedContent;
        if (cleaningType === 'bazi') {
          cleanedContent = this.cleanBaziOutput(rawContent);
          console.log(`🔧 八字专用清理完成，长度: ${cleanedContent.length} 字符`);
        } else {
          cleanedContent = this.cleanAIOutput(rawContent);
          console.log(`� 通用清理完成，长度: ${cleanedContent.length} 字符`);
        }

        console.log(`💰 Token使用:`, response.data.usage);

        return cleanedContent;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error(`❌ DeepSeek API调用失败:`, error.message);
      console.error('📊 错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // 不重试，直接返回错误（符合Cloudflare Workers 30秒限制）
      let userFriendlyMessage = 'AI服务暂时不可用，请稍后重试';
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        userFriendlyMessage = 'AI分析超时（25秒），请稍后重试';
      } else if (error.response?.status === 429) {
        userFriendlyMessage = 'API调用频率过高，请稍后重试';
      } else if (error.response?.status >= 500) {
        userFriendlyMessage = 'AI服务器暂时不可用，请稍后重试';
      } else if (error.response?.status === 401) {
        userFriendlyMessage = 'AI服务认证失败，请联系管理员';
      }

      throw new Error(userFriendlyMessage);
    }
  }

  // 八字精算（专业版）
  async getBaziAnalysis(user, language = 'zh') {
    const userTimezone = user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userProfile = this.buildUserProfile(user, userTimezone);

    console.log(`🌐 BaZi Analysis Language: ${language}, Timezone: ${userTimezone}`);

    const targetLanguage = this.getLanguageName(language);

    const prompt = `请根据以下用户信息进行八字命理分析：

${userProfile}

请严格按照以下结构进行详细分析，确保内容丰富、专业准确：
1. 八字排盘详解
四柱排列：年柱、月柱、日柱、时柱的天干地支组合
五行分布：金木水火土各元素的数量和强弱分析
十神配置：正官、偏官、正财、偏财、食神、伤官、比肩、劫财、正印、偏印的分布
格局判断：确定命格类型（如正官格、财格、印格等）
用神喜忌：分析用神、忌神，指出五行补救方向

2. 性格特征深度分析
核心性格：基于日主和月令的基本性格特征
性格优势：天赋才能、领导能力、创造力等正面特质
性格弱点：需要改进的性格缺陷和行为模式
心理特征：情绪管理、压力承受、人际交往风格
潜在能力：未开发的天赋和发展潜力

3. 事业财运全面解析
职业天赋：最适合的职业类型和发展方向
事业运势：不同人生阶段的事业发展趋势
财运分析：正财、偏财运势，理财投资建议
创业指导：是否适合创业，最佳创业时机
职场关系：与上司、同事、下属的相处之道

4. 感情婚姻详细指导
感情性格：在感情中的表现和需求
桃花运势：单身期的感情机会和发展
婚姻运势：结婚时机、婚姻稳定性分析
配偶特征：理想伴侣的性格、外貌、职业特点
感情建议：如何经营感情，避免感情危机

5. 健康运势专业分析
体质特征：先天体质强弱，易患疾病类型
健康隐患：需要重点关注的身体部位和系统
养生建议：饮食调理、运动方式、作息安排
疾病预防：不同年龄段需要预防的健康问题
心理健康：情绪调节、压力管理建议

6. 大运流年精准预测
大运分析：每步大运（10年）的整体运势特点
流年预测：未来5-10年每年的运势重点
关键年份：人生重要转折点和机遇年份
趋势变化：运势上升期、平稳期、调整期的时间节点
应对策略：如何在不同运势期做出最佳选择

7. 实用建议总结
五行平衡：分析五行强弱，提供平衡建议
人生规划：基于命理的长期人生规划建议
发展方向：最适合的发展道路和时机选择
注意事项：需要特别警惕的人生陷阱和挑战

请用深入浅出的专业语言，提供具体可操作的建议。分析要全面细致，体现传统八字学的精髓。

要求：使用传统八字术语，提供实用建议。用${targetLanguage}回复。`;

    const systemMessage = `你是有数十年经验资深八字命理大师，精通子平八字、五行生克、十神配置、大运流年等传统命理学。请基于正统八字理论进行专业分析，用${targetLanguage}回复。`;

    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 'bazi', 2000);
  }

  // 每日运势（专业版）
  async getDailyFortune(user, language = 'zh') {
    const userTimezone = user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userProfile = this.buildUserProfile(user, userTimezone);

    console.log(`🌐 Daily Fortune Language: ${language}, Timezone: ${userTimezone}`);

    const targetLanguage = this.getLanguageName(language);

    const prompt = `请根据以下用户信息分析今日运势：

${userProfile}

请分析：
1. 整体运势：结合八字分析今日运势走向
2. 事业工作：jinri工作状态和人际关系建议
3. 财运状况：财运分析和理财建议
4. 感情运势：感情状况和情感建议
5. 健康运势：基于五行的健康建议

要求：使用传统命理术语，提供实用建议。用${targetLanguage}回复。`;

    const systemMessage = `你是有数十年经验资深命理师，精通八字、五行、天干地支、流年运势等传统命理学。请基于正统命理理论结合现代生活实际，提供专业而实用的每日运势分析，用${targetLanguage}回复。`;

    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 'default');
  }

  // 塔罗占卜（专业版）
  async getCelestialTarotReading(user, question = '', language = 'zh') {
    const userTimezone = user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userProfile = this.buildUserProfile(user, userTimezone);

    console.log(`🌐 Tarot Reading Language: ${language}, Timezone: ${userTimezone}`);

    const targetLanguage = this.getLanguageName(language);

    const prompt = `请根据以下用户信息进行塔罗占卜：

${userProfile}

**占卜问题：** ${question || '请为我进行综合运势塔罗占卜'}

**占卜要求：**
1. 抽牌过程：描述抽取的塔罗牌（牌名、正逆位）
2. 牌面解读：每张牌的含义和象征，正逆位解释
3. 综合解读：结合用户情况进行整体分析
4. 行动建议：提供具体可行的指导
5. 注意事项：提醒需要注意的事项

要求：使用专业塔罗术语但通俗易懂，提供深度分析和具体建议。用${targetLanguage}回复。`;

    const systemMessage = `你是有数十年经验资深塔罗占卜师，精通韦特塔罗、马赛塔罗等各种塔罗体系，深谙塔罗牌的象征意义、数字学、占星学关联。请基于正统塔罗理论进行专业占卜，用${targetLanguage}回复。`;

    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 'default');
  }

  // 幸运物品（专业版）
  async getLuckyItems(user, language = 'zh') {
    const userTimezone = user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userProfile = this.buildUserProfile(user, userTimezone);

    console.log(`🌐 Lucky Items Language: ${language}, Timezone: ${userTimezone}`);

    const targetLanguage = this.getLanguageName(language);

    const prompt = `请根据以下用户信息推荐开运物品：

${userProfile}

**分析要求：**
1. 幸运颜色：推荐主要幸运色及五行属性
2. 开运饰品：推荐适合的材质和饰品类型
3. 风水物品：推荐办公/家居摆放的开运物品
4. 方位指引：今日最佳方位和朝向建议
5. 幸运数字：推荐幸运数字组合

要求：基于五行理论，提供具体实用的建议，贴近现代生活。用${targetLanguage}回复。`;

    const systemMessage = `你是有数十年经验资深风水命理师，精通五行学说、八字命理、风水布局、开运化煞等传统文化。请基于正统五行理论和风水学原理，提供专业的开运物品建议，用${targetLanguage}回复。`;

    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 'default');
  }
}

module.exports = DeepSeekService;
