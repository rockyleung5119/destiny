// DeepSeek AI算命服务
const axios = require('axios');
const { getLocalizedMessage } = require('../utils/i18n');

class DeepSeekService {
  constructor() {
    this.apiKey = 'sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn';
    this.baseURL = 'https://api.siliconflow.cn/v1/chat/completions';
    this.model = 'Pro/deepseek-ai/DeepSeek-R1';
  }

  // 调用DeepSeek API
  async callDeepSeekAPI(messages, temperature = 0.7, language = 'zh') {
    console.log(`🔧 callDeepSeekAPI - Language: ${language}, NODE_ENV: ${process.env.NODE_ENV}, DEMO_MODE: ${process.env.DEMO_MODE}`);

    // 检查是否为演示模式
    if (process.env.NODE_ENV === 'development' && process.env.DEMO_MODE === 'true') {
      console.log(`🎭 Using mock response with language: ${language}`);
      return this.getMockResponse(messages, language);
    }

    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.response?.data || error.message);

      // 如果API调用失败，回退到模拟响应
      console.log('回退到模拟响应模式...');
      return this.getMockResponse(messages);
    }
  }

  // 模拟响应（用于演示和API失败时的回退）
  getMockResponse(messages, language = 'zh') {
    const userMessage = messages[messages.length - 1].content;

    // 直接使用传入的语言参数
    const isEnglish = language === 'en';

    console.log(`🔍 Mock Response - Language: ${language}, isEnglish: ${isEnglish}`);
    console.log(`🔍 Mock Response - User Message: ${userMessage.substring(0, 100)}...`);

    if (userMessage.includes('八字') || userMessage.includes('BaZi')) {
      return this.getMockBaziResponse(isEnglish);
    } else if (userMessage.includes('每日') || userMessage.includes('今日') || userMessage.includes('daily')) {
      return this.getMockDailyResponse(isEnglish);
    } else if (userMessage.includes('塔罗') || userMessage.includes('tarot')) {
      return this.getMockTarotResponse(isEnglish);
    } else if (userMessage.includes('幸运') || userMessage.includes('lucky')) {
      return this.getMockLuckyItemsResponse(isEnglish);
    } else if (userMessage.includes('翻译') || userMessage.includes('translate')) {
      return this.getMockTranslationResponse();
    }

    return isEnglish ?
      'Thank you for using our AI fortune-telling service. Due to API service temporarily unavailable, this is a demo response. Please try again later for complete AI analysis.' :
      '感谢您使用AI算命服务。由于API服务暂时不可用，这是一个演示响应。请稍后重试以获得完整的AI分析。';
  }

  // 构建用户资料字符串
  buildUserProfile(user) {
    const birthDate = `${user.birth_year}年${user.birth_month}月${user.birth_day}日`;
    const birthTime = user.birth_hour ? `${user.birth_hour}时` : '时辰不详';
    const gender = user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '性别不详';
    const birthPlace = user.birth_place || '出生地不详';

    return `
姓名：${user.name}
性别：${gender}
出生日期：${birthDate}
出生时辰：${birthTime}
出生地点：${birthPlace}
    `.trim();
  }

  // 八字精算
  async getBaziAnalysis(user, language = 'zh') {
    const userProfile = this.buildUserProfile(user);
    const currentDate = new Date().toLocaleDateString('zh-CN');

    // 根据语言选择提示词
    const isEnglish = language === 'en';
    const isChinese = language === 'zh';

    console.log(`🌐 BaZi Analysis Language: ${language}, isEnglish: ${isEnglish}`);

    const prompt = isChinese ? `
你是一位精通中国传统八字命理学的资深大师，拥有数十年的实战经验和深厚的理论基础。请根据以下用户信息进行全面深入的八字分析：

${userProfile}

请严格按照以下结构进行详细分析，确保内容丰富、专业准确：

## 1. 八字排盘详解
- **四柱排列**：年柱、月柱、日柱、时柱的天干地支组合
- **五行分布**：金木水火土各元素的数量和强弱分析
- **十神配置**：正官、偏官、正财、偏财、食神、伤官、比肩、劫财、正印、偏印的分布
- **格局判断**：确定命格类型（如正官格、财格、印格等）
- **用神喜忌**：分析用神、忌神，指出五行补救方向

## 2. 性格特征深度分析
- **核心性格**：基于日主和月令的基本性格特征
- **性格优势**：天赋才能、领导能力、创造力等正面特质
- **性格弱点**：需要改进的性格缺陷和行为模式
- **心理特征**：情绪管理、压力承受、人际交往风格
- **潜在能力**：未开发的天赋和发展潜力

## 3. 事业财运全面解析
- **职业天赋**：最适合的职业类型和发展方向
- **事业运势**：不同人生阶段的事业发展趋势
- **财运分析**：正财、偏财运势，理财投资建议
- **创业指导**：是否适合创业，最佳创业时机
- **职场关系**：与上司、同事、下属的相处之道

## 4. 感情婚姻详细指导
- **感情性格**：在感情中的表现和需求
- **桃花运势**：单身期的感情机会和发展
- **婚姻运势**：结婚时机、婚姻稳定性分析
- **配偶特征**：理想伴侣的性格、外貌、职业特点
- **感情建议**：如何经营感情，避免感情危机

## 5. 健康运势专业分析
- **体质特征**：先天体质强弱，易患疾病类型
- **健康隐患**：需要重点关注的身体部位和系统
- **养生建议**：饮食调理、运动方式、作息安排
- **疾病预防**：不同年龄段需要预防的健康问题
- **心理健康**：情绪调节、压力管理建议

## 6. 大运流年精准预测
- **大运分析**：每步大运（10年）的整体运势特点
- **流年预测**：未来5-10年每年的运势重点
- **关键年份**：人生重要转折点和机遇年份
- **趋势变化**：运势上升期、平稳期、调整期的时间节点
- **应对策略**：如何在不同运势期做出最佳选择

## 7. 实用建议总结
- **五行调理**：通过颜色、方位、职业等调节五行
- **开运方法**：具体的开运建议和注意事项
- **人生规划**：基于命理的长期人生规划建议
- **注意事项**：需要特别警惕的人生陷阱和挑战

请用深入浅出的专业语言，提供具体可操作的建议。分析要全面细致，体现传统八字学的精髓，同时结合现代生活实际。每个部分都要有充实的内容，避免空泛的描述。

**重要要求：请严格使用中文回复，不要使用任何英文内容。当前用户时区：${Intl.DateTimeFormat().resolvedOptions().timeZone}，请使用中文进行完整分析。**
    ` : `
You are a master of traditional Chinese BaZi (Eight Characters) divination with decades of practical experience and profound theoretical foundation. Please provide a comprehensive and in-depth BaZi analysis based on the following user information:

${userProfile}

Please strictly follow the structure below for detailed analysis, ensuring rich content and professional accuracy:

## 1. BaZi Chart Detailed Analysis
- **Four Pillars**: Year, Month, Day, and Hour pillars with Heavenly Stems and Earthly Branches
- **Five Elements Distribution**: Analysis of Metal, Wood, Water, Fire, Earth quantities and strengths
- **Ten Gods Configuration**: Distribution of Direct Officer, Indirect Officer, Direct Wealth, Indirect Wealth, Food God, Hurting Officer, Friend, Rob Wealth, Direct Seal, Indirect Seal
- **Pattern Determination**: Identify destiny pattern type (such as Officer Pattern, Wealth Pattern, Seal Pattern, etc.)
- **Favorable/Unfavorable Elements**: Analysis of beneficial and harmful elements, indicating Five Elements remedy directions

## 2. In-depth Personality Analysis
- **Core Personality**: Basic personality traits based on Day Master and Month Branch
- **Personality Strengths**: Natural talents, leadership abilities, creativity and other positive traits
- **Personality Weaknesses**: Character flaws and behavioral patterns that need improvement
- **Psychological Characteristics**: Emotional management, stress tolerance, interpersonal communication style
- **Hidden Potential**: Undeveloped talents and growth potential

## 3. Comprehensive Career and Wealth Analysis
- **Career Talents**: Most suitable career types and development directions
- **Career Fortune**: Career development trends in different life stages
- **Wealth Analysis**: Direct and indirect wealth fortune, financial investment advice
- **Entrepreneurship Guidance**: Suitability for entrepreneurship, optimal timing for starting business
- **Workplace Relationships**: How to get along with superiors, colleagues, and subordinates

## 4. Detailed Love and Marriage Guidance
- **Emotional Personality**: Performance and needs in relationships
- **Romance Fortune**: Relationship opportunities and development during single period
- **Marriage Fortune**: Marriage timing and marital stability analysis
- **Spouse Characteristics**: Ideal partner's personality, appearance, and career traits
- **Relationship Advice**: How to manage relationships and avoid emotional crises

## 5. Professional Health Fortune Analysis
- **Physical Constitution**: Innate physical strength and weakness, susceptible disease types
- **Health Risks**: Body parts and systems requiring special attention
- **Health Maintenance**: Dietary adjustments, exercise methods, sleep schedules
- **Disease Prevention**: Health issues to prevent at different ages
- **Mental Health**: Emotional regulation and stress management advice

## 6. Precise Major Luck and Annual Fortune Prediction
- **Major Luck Analysis**: Overall fortune characteristics of each Major Luck period (10 years)
- **Annual Fortune Prediction**: Fortune focus for each year in the next 5-10 years
- **Key Years**: Important life turning points and opportunity years
- **Trend Changes**: Timeline of fortune rising, stable, and adjustment periods
- **Response Strategies**: How to make optimal choices during different fortune periods

## 7. Practical Advice Summary
- **Five Elements Adjustment**: Regulate Five Elements through colors, directions, careers, etc.
- **Fortune Enhancement Methods**: Specific fortune-enhancing suggestions and precautions
- **Life Planning**: Long-term life planning advice based on destiny analysis
- **Precautions**: Life traps and challenges requiring special vigilance

Please use professional yet accessible language and provide specific, actionable advice. The analysis should be comprehensive and detailed, embodying the essence of traditional BaZi studies while incorporating modern life realities. Each section should have substantial content, avoiding vague descriptions.

**IMPORTANT REQUIREMENT: Please respond STRICTLY in English only, do not use any Chinese characters. Current user timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Please provide complete analysis in English language.**
    `;

    const systemMessage = isChinese ?
      '你是一位德高望重的八字命理大师，精通传统命理学，能够准确分析八字并给出实用建议。请确保分析内容详实、专业、易懂，避免模糊和重复的表述。重要：请严格使用中文回复，不要使用任何英文。' :
      'You are a respected BaZi divination master, proficient in traditional Chinese metaphysics, capable of accurately analyzing BaZi charts and providing practical advice. Please ensure the analysis is detailed, professional, and easy to understand, avoiding vague and repetitive statements. IMPORTANT: Please respond STRICTLY in English only, do not use any Chinese characters.';

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

    const result = await this.callDeepSeekAPI(messages, 0.8, language);

    // 如果需要翻译为其他语言（非中英文）
    if (language !== 'zh' && language !== 'en') {
      return await this.translateResult(result, language);
    }

    return result;
  }

  // 每日运势
  async getDailyFortune(user, language = 'zh') {
    const userProfile = this.buildUserProfile(user);
    const today = new Date();
    const todayStr = today.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const isChinese = language === 'zh';

    const prompt = isChinese ? `
你是一位精通天体运行和传统命理的占卜大师，拥有深厚的易学功底和丰富的实战经验。请根据以下用户信息和今日天体运行情况，进行详细的今日运势分析：

${userProfile}

今日日期：${todayStr}

请严格按照以下结构进行全面分析，确保内容详实具体：

## 1. 今日总体运势概览
- **整体运势评分**：1-10分制评分，并详细说明评分依据
- **主要运势特点**：今日能量场的主要特征和影响
- **天体影响分析**：当前行星位置对个人运势的具体影响
- **特别注意事项**：今日需要重点关注的事项和时间段

## 2. 事业工作运势详解
- **工作效率指数**：今日工作状态和效率预测
- **人际关系运势**：与同事、上司、客户的互动情况
- **决策建议**：重要决策的最佳时机和注意事项
- **项目进展**：适合推进的工作内容和避免的事项
- **沟通交流**：会议、谈判、汇报的最佳时段

## 3. 财运分析深度解读
- **财运指数评级**：1-10分制，包含正财和偏财
- **投资理财建议**：股票、基金、房产等投资方向指导
- **消费支出指南**：适宜购买的物品和应避免的大额支出
- **商业机会**：潜在的赚钱机会和商业合作可能
- **财务管理**：资金规划和风险控制建议

## 4. 感情运势全面分析
- **单身者桃花运**：遇到心仪对象的可能性和最佳社交时机
- **恋爱中情侣**：关系发展趋势和增进感情的建议
- **已婚夫妻**：夫妻关系和谐度，家庭氛围预测
- **家庭关系**：与父母、子女、亲戚的相处情况
- **社交运势**：朋友聚会、社交活动的运势

## 5. 健康运势专业指导
- **身体状况评估**：整体健康状态和精神状态
- **重点关注部位**：今日需要特别注意的身体部位
- **疾病预防**：可能出现的健康问题和预防措施
- **运动建议**：适合的运动类型和最佳运动时间
- **饮食调理**：有益健康的食物和应避免的饮食

## 6. 幸运元素详细指南
- **幸运颜色组合**：主色调和搭配色，及其使用场合
- **幸运数字解析**：具体数字及其象征意义和使用方法
- **幸运方位指导**：有利的方向和不利的方位
- **吉时选择**：今日最佳行动时间段
- **适宜活动推荐**：最有利的活动类型和场所

## 7. 今日行动指南
- **优先处理事项**：今日最应该完成的重要任务
- **避免事项清单**：今日应该避免的行为和决定
- **机遇把握**：如何抓住今日出现的机会
- **风险规避**：潜在风险的识别和应对策略

请结合传统命理学、天体运行规律和现代生活实际，给出具体可操作的建议。分析要详实深入，避免空泛的表述。

**重要要求：请严格使用中文回复，不要使用任何英文内容。当前用户时区：${Intl.DateTimeFormat().resolvedOptions().timeZone}，请使用中文进行完整分析。**
    ` : `
You are a divination master proficient in celestial movements and traditional Chinese metaphysics, with profound knowledge of I-Ching and rich practical experience. Please provide a detailed daily fortune analysis based on the following user information and today's celestial movements:

${userProfile}

Today's Date: ${todayStr}

Please strictly follow the structure below for comprehensive analysis, ensuring detailed and specific content:

## 1. Overall Daily Fortune Overview
- **Overall Fortune Rating**: 1-10 scale rating with detailed explanation of scoring basis
- **Main Fortune Characteristics**: Primary features and influences of today's energy field
- **Celestial Influence Analysis**: Specific impact of current planetary positions on personal fortune
- **Special Precautions**: Key matters and time periods requiring special attention today

## 2. Career and Work Fortune Details
- **Work Efficiency Index**: Prediction of today's work state and efficiency
- **Interpersonal Relations Fortune**: Interactions with colleagues, superiors, and clients
- **Decision-making Advice**: Optimal timing and precautions for important decisions
- **Project Progress**: Suitable work content to advance and matters to avoid
- **Communication**: Best time slots for meetings, negotiations, and reports

## 3. In-depth Wealth Fortune Analysis
- **Wealth Fortune Rating**: 1-10 scale, including direct and indirect wealth
- **Investment and Financial Advice**: Guidance on stocks, funds, real estate and other investment directions
- **Spending Guidelines**: Suitable purchases and large expenditures to avoid
- **Business Opportunities**: Potential money-making opportunities and business collaboration possibilities
- **Financial Management**: Fund planning and risk control recommendations

## 4. Comprehensive Love Fortune Analysis
- **Singles' Romance Fortune**: Possibility of meeting someone special and optimal social timing
- **Dating Couples**: Relationship development trends and advice for enhancing feelings
- **Married Couples**: Marital harmony and family atmosphere predictions
- **Family Relations**: Interactions with parents, children, and relatives
- **Social Fortune**: Fortune for friend gatherings and social activities

## 5. Professional Health Fortune Guidance
- **Physical Condition Assessment**: Overall health status and mental state
- **Focus Areas**: Body parts requiring special attention today
- **Disease Prevention**: Potential health issues and preventive measures
- **Exercise Recommendations**: Suitable exercise types and optimal workout times
- **Dietary Adjustments**: Health-beneficial foods and dietary items to avoid

## 6. Detailed Lucky Elements Guide
- **Lucky Color Combinations**: Main colors and matching colors, with usage occasions
- **Lucky Numbers Analysis**: Specific numbers with symbolic meanings and usage methods
- **Lucky Direction Guidance**: Favorable directions and unfavorable orientations
- **Auspicious Time Selection**: Today's optimal action time periods
- **Recommended Activities**: Most beneficial activity types and venues

## 7. Today's Action Guide
- **Priority Tasks**: Most important tasks to complete today
- **Avoidance Checklist**: Behaviors and decisions to avoid today
- **Opportunity Seizing**: How to grasp opportunities appearing today
- **Risk Mitigation**: Identification and response strategies for potential risks

Please combine traditional Chinese metaphysics, celestial movement patterns, and modern life realities to provide specific, actionable advice. The analysis should be detailed and in-depth, avoiding vague expressions.

**IMPORTANT REQUIREMENT: Please respond STRICTLY in English only, do not use any Chinese characters. Current user timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Please provide complete analysis in English language.**
    `;

    const systemMessage = isChinese ?
      '你是一位精通天体运行和传统命理的占卜大师，能够准确分析每日运势变化。请确保分析内容详实、专业、实用，避免空泛的描述。重要：请严格使用中文回复，不要使用任何英文。' :
      'You are a divination master proficient in celestial movements and traditional Chinese metaphysics, capable of accurately analyzing daily fortune changes. Please ensure the analysis is detailed, professional, and practical, avoiding vague descriptions. IMPORTANT: Please respond STRICTLY in English only, do not use any Chinese characters.';

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

    const result = await this.callDeepSeekAPI(messages, 0.7, language);

    if (language !== 'zh' && language !== 'en') {
      return await this.translateResult(result, language);
    }

    return result;
  }

  // 天体塔罗占卜（使用韦特塔罗系统）
  async getCelestialTarotReading(user, question = '', language = 'zh') {
    const userProfile = this.buildUserProfile(user);
    const isChinese = language === 'zh';
    const questionText = question || (isChinese ? '请为我进行一次综合运势占卜' : 'Please provide a comprehensive fortune reading for me');

    const prompt = isChinese ? `
你是一位精通韦特塔罗牌和天体占星学的神秘学大师。请结合东西方占卜智慧，为用户进行塔罗占卜：

${userProfile}

占卜问题：${questionText}

请使用韦特塔罗牌系统进行三张牌的占卜（过去-现在-未来），并按以下结构分析：

1. 抽取的塔罗牌
- 过去牌：牌名、正逆位、基本含义
- 现在牌：牌名、正逆位、基本含义
- 未来牌：牌名、正逆位、基本含义

2. 牌面详细解读
- 每张牌在当前情况下的具体含义
- 牌与牌之间的关联和影响
- 整体牌阵传达的信息

3. 天体能量分析
- 当前天体运行对用户的影响
- 宇宙能量的流动方向
- 如何顺应天体能量

4. 综合占卜结果
- 对占卜问题的直接回答
- 未来发展的可能性
- 需要注意的机遇和挑战

5. 行动建议
- 具体的行动指导
- 需要避免的行为
- 如何把握机遇

请用神秘而富有智慧的语言，结合塔罗牌的象征意义和天体能量，给出深刻的洞察。

**重要要求：请严格使用中文回复，不要使用任何英文内容。当前用户时区：${Intl.DateTimeFormat().resolvedOptions().timeZone}，请使用中文进行完整分析。**
    ` : `
You are a mystical master proficient in Rider-Waite Tarot and celestial astrology. Please combine Eastern and Western divination wisdom to perform a tarot reading for the user:

${userProfile}

Divination Question: ${questionText}

Please use the Rider-Waite Tarot system for a three-card reading (Past-Present-Future) and analyze according to the following structure:

1. Drawn Tarot Cards
- Past Card: Card name, upright/reversed, basic meaning
- Present Card: Card name, upright/reversed, basic meaning
- Future Card: Card name, upright/reversed, basic meaning

2. Detailed Card Interpretation
- Specific meaning of each card in the current situation
- Connections and influences between cards
- Overall message conveyed by the card spread

3. Celestial Energy Analysis
- Current celestial movements' impact on the user
- Direction of cosmic energy flow
- How to align with celestial energies

4. Comprehensive Divination Results
- Direct answer to the divination question
- Possibilities for future development
- Opportunities and challenges to note

5. Action Guidance
- Specific action recommendations
- Behaviors to avoid
- How to seize opportunities

Please use mystical and wise language, combining the symbolic meanings of tarot cards and celestial energies to provide profound insights.

**IMPORTANT REQUIREMENT: Please respond STRICTLY in English only, do not use any Chinese characters. Current user timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Please provide complete analysis in English language.**
    `;

    const systemMessage = isChinese ?
      '你是一位精通韦特塔罗牌和天体占星学的神秘学大师，能够准确解读塔罗牌的深层含义。重要：请严格使用中文回复，不要使用任何英文。' :
      'You are a mystical master proficient in Rider-Waite Tarot and celestial astrology, capable of accurately interpreting the deep meanings of tarot cards. IMPORTANT: Please respond STRICTLY in English only, do not use any Chinese characters.';

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

    const result = await this.callDeepSeekAPI(messages, 0.9, language);

    if (language !== 'zh') {
      return await this.translateResult(result, language);
    }

    return result;
  }

  // 幸运物品和颜色推荐
  async getLuckyItemsAndColors(user, language = 'zh') {
    const userProfile = this.buildUserProfile(user);
    const currentMonth = new Date().getMonth() + 1;
    const currentSeason = this.getCurrentSeason();
    const isChinese = language === 'zh';

    const prompt = isChinese ? `
你是一位精通五行学说和能量学的风水大师。请根据用户的生辰信息和当前时节，提供简洁实用的五行调理开运方案：

${userProfile}

当前月份：${currentMonth}月
当前季节：${currentSeason}

请按照以下结构进行分析和推荐：

1. 五行调理方案
- 分析用户五行强弱，确定需要补充的五行元素
- 提供具体的调理方法和建议

2. 开运建议
- 幸运颜色：推荐3-5种主要幸运颜色及其运用
- 幸运饰品：适合佩戴的宝石、水晶、金属饰品
- 随身物品：护身符、开运小物、日用品颜色选择

3. 人生规划建议
- 基于五行属性的事业发展方向
- 适合的生活方式和环境布置
- 人际关系和感情运势提升方法

4. 总结
- 核心调理要点
- 近期重点关注事项
- 长期运势提升建议

请提供简洁实用的建议，重点关注五行调理和开运方法，无需详细的八字分析过程。

**重要要求：请严格使用中文回复，不要使用任何英文内容。当前用户时区：${Intl.DateTimeFormat().resolvedOptions().timeZone}，请使用中文进行完整分析。**
    ` : `
You are a Feng Shui master proficient in Five Elements theory and energy studies. Please provide concise and practical Five Elements adjustment solutions based on the user's birth information and current season:

${userProfile}

Current Month: ${currentMonth}
Current Season: ${currentSeason}

Please analyze and recommend according to the following structure:

1. Five Elements Adjustment Plan
- Analyze user's Five Elements strengths/weaknesses and determine elements to supplement
- Provide specific adjustment methods and suggestions

2. Fortune Enhancement Recommendations
- Lucky Colors: Recommend 3-5 main lucky colors and their applications
- Lucky Accessories: Suitable gemstones, crystals, and metal jewelry
- Personal Items: Amulets, lucky charms, and color choices for daily items

3. Life Planning Suggestions
- Career development directions based on Five Elements attributes
- Suitable lifestyle and environmental arrangements
- Methods to improve interpersonal relationships and romantic fortune

4. Summary
- Core adjustment points
- Key focus areas for the near term
- Long-term fortune enhancement suggestions

Please provide concise and practical advice, focusing on Five Elements adjustment and fortune enhancement methods, without detailed BaZi analysis process.

**IMPORTANT REQUIREMENT: Please respond STRICTLY in English only, do not use any Chinese characters. Current user timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Please provide complete analysis in English language.**
    `;

    const systemMessage = isChinese ?
      '你是一位精通五行学说和能量学的风水大师，专注于提供简洁实用的五行调理方案和开运建议。重要：请严格使用中文回复，不要使用任何英文。' :
      'You are a Feng Shui master proficient in Five Elements theory and energy studies, specializing in providing concise and practical Five Elements adjustment solutions and fortune enhancement advice. IMPORTANT: Please respond STRICTLY in English only, do not use any Chinese characters.';

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

    const result = await this.callDeepSeekAPI(messages, 0.8, language);

    if (language !== 'zh') {
      return await this.translateResult(result, language);
    }

    return result;
  }

  // 获取当前季节
  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return '春季';
    if (month >= 6 && month <= 8) return '夏季';
    if (month >= 9 && month <= 11) return '秋季';
    return '冬季';
  }

  // 翻译结果到目标语言
  async translateResult(text, targetLanguage) {
    if (targetLanguage === 'zh') return text;

    const languageMap = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'ja': 'Japanese',
      'ko': 'Korean',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic'
    };

    const targetLang = languageMap[targetLanguage] || 'English';

    // 检测文本是否已经是目标语言
    const isAlreadyTargetLanguage = this.detectLanguage(text, targetLanguage);
    if (isAlreadyTargetLanguage) {
      return text;
    }

    const translatePrompt = `
Please translate the following Chinese divination analysis result into ${targetLang}, maintaining the accuracy of professional terminology and cultural connotations:

${text}

Translation Requirements:
1. Maintain the professionalism of divination terminology
2. Preserve the essence of traditional Chinese culture
3. Use fluent and natural language
4. Keep the original structure and formatting
5. Ensure all emojis, symbols, and formatting are preserved
6. Translate section headers and maintain the hierarchical structure
7. Keep numerical ratings and scores in their original format
8. Preserve any special formatting like bullet points, stars, and icons

Important Notes:
- BaZi (八字) should be translated as "BaZi (Eight Characters)"
- Five Elements (五行) should be translated as "Five Elements (Wu Xing)"
- Yin-Yang (阴阳) should be translated as "Yin-Yang"
- Keep traditional Chinese concepts with their English explanations
- Maintain the professional and respectful tone throughout
    `;

    const messages = [
      {
        role: 'system',
        content: `You are a professional translator specializing in Chinese traditional culture and metaphysics, with expertise in translating divination and fortune-telling content into ${targetLang}. You understand both the technical terminology and cultural nuances required for accurate translation.`
      },
      {
        role: 'user',
        content: translatePrompt
      }
    ];

    try {
      const translatedResult = await this.callDeepSeekAPI(messages, 0.3);

      // 后处理：确保格式正确
      return this.postProcessTranslation(translatedResult, targetLanguage);
    } catch (error) {
      console.error('翻译失败，返回原文:', error);
      return text; // 翻译失败时返回原文
    }
  }

  // 检测文本语言
  detectLanguage(text, targetLanguage) {
    // 简单的语言检测逻辑
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const totalChars = text.length;
    const chineseRatio = chineseChars / totalChars;

    // 如果中文字符比例小于30%，可能已经是目标语言
    if (targetLanguage === 'en' && chineseRatio < 0.3) {
      return true;
    }

    return false;
  }

  // 翻译后处理
  postProcessTranslation(text, targetLanguage) {
    // 确保特定术语的一致性
    const termReplacements = {
      'en': {
        '八字': 'BaZi (Eight Characters)',
        '五行': 'Five Elements (Wu Xing)',
        '阴阳': 'Yin-Yang',
        '天干': 'Heavenly Stems',
        '地支': 'Earthly Branches',
        '十神': 'Ten Gods',
        '大运': 'Major Luck Periods',
        '流年': 'Annual Fortune'
      }
    };

    if (termReplacements[targetLanguage]) {
      const replacements = termReplacements[targetLanguage];
      Object.keys(replacements).forEach(term => {
        const regex = new RegExp(term, 'g');
        text = text.replace(regex, replacements[term]);
      });
    }

    // 确保格式标记正确
    text = text.replace(/##\s*/g, '## ');
    text = text.replace(/###\s*/g, '### ');
    text = text.replace(/\*\*([^*]+)\*\*/g, '**$1**');

    return text.trim();
  }

  // 模拟八字分析响应
  getMockBaziResponse(isEnglish = false) {
    if (isEnglish) {
      return `
# Detailed BaZi (Eight Characters) Analysis Report

## 1. BaZi Chart Detailed Analysis

### Four Pillars Configuration
- **Year Pillar**: Geng Wu (Metal Fire) - Heavenly Stem Geng Metal, Earthly Branch Wu Fire
- **Month Pillar**: Wu Shen (Earth Metal) - Heavenly Stem Wu Earth, Earthly Branch Shen Metal
- **Day Pillar**: Yi You (Wood Metal) - Heavenly Stem Yi Wood, Earthly Branch You Metal
- **Hour Pillar**: Ding Hai (Fire Water) - Heavenly Stem Ding Fire, Earthly Branch Hai Water

### Five Elements Distribution Analysis
**Five Elements Statistics**: Metal 3, Wood 1, Water 1, Fire 2, Earth 1
- **Strong Metal**: Dominant position, reflecting resolute and decisive personality traits
- **Weak Wood**: Creative thinking needs strengthening, recommend more contact with green plants
- **Insufficient Water**: Wisdom and spirituality slightly lacking, need to supplement Water element
- **Moderate Fire**: Passion and vitality are balanced, but can be appropriately enhanced
- **Stable Earth**: Foundation is solid, but needs more Earth element support

### Ten Gods Configuration
- **Direct Wealth**: 2 pieces, stable fortune, good at accumulation
- **Indirect Wealth**: 1 piece, occasional windfall income
- **Direct Officer**: 1 piece, possesses management talent
- **Food God**: 1 piece, good creativity and expression ability
- **Friend**: 1 piece, good friendship fortune
- **Rob Wealth**: 1 piece, need to pay attention to benefit distribution when cooperating

## 2. In-depth Personality Analysis

### Core Personality
You are a **rational and practical** person who does things methodically with meticulous thinking. The dominance of Metal element gives you:
- Strong sense of responsibility and mission
- Excellent organizational and coordination abilities
- Keen observation of details
- Persistent execution power

### Personality Strengths
✅ **Decisive Decision-making**: Able to make rational judgments quickly when facing choices
✅ **Strong Execution**: Can persist in executing plans to completion after making them
✅ **Sharp Financial Acumen**: Natural sensitivity to money and investment
✅ **Heavy Responsibility**: Strong sense of responsibility for both work and family

### Areas for Improvement
⚠️ **Overly Perfectionist**: Sometimes affects overall progress due to details
⚠️ **Reserved Expression**: Need to be more proactive in emotional expression
⚠️ **Insufficient Innovation**: Tend to follow established patterns, lacking breakthrough thinking
⚠️ **Pressure Tolerance**: Easy to give yourself excessive pressure due to heavy sense of responsibility

## 3. Comprehensive Career and Wealth Analysis

### Career Talent Analysis
**Most Suitable Career Fields**:
- 🏦 **Finance and Investment**: Banking, securities, insurance, investment consulting
- 💼 **Corporate Management**: Middle and senior management, project management, operations management
- 🔧 **Technical Specialization**: Engineering technology, quality control, precision manufacturing
- 📊 **Finance and Accounting**: Financial analysis, auditing, tax planning

### Career Development Timeline
- **25-30 years old**: Accumulation period, recommend learning management experience in large enterprises
- **30-35 years old**: Rising period, career fortune begins to improve significantly
- **35-45 years old**: Golden period, most suitable for taking important responsibilities or starting business
- **After 45 years old**: Stable period, suitable for mentor or consultant roles

### Detailed Wealth Analysis
**Direct Wealth Fortune**: ⭐⭐⭐⭐☆
- Salary income grows steadily, suitable for long-term career development
- Income from professional skills will continue to increase

**Indirect Wealth Fortune**: ⭐⭐⭐☆☆
- Some talent in investment and financial management, but need to be cautious
- Not suitable for high-risk investment, recommend steady financial management

## 4. Detailed Love and Marriage Guidance

### Emotional Personality Traits
In relationships, you show:
- **More Rational than Emotional**: Will analyze relationships with reason
- **Loyal and Devoted**: Will invest wholeheartedly once relationship is established
- **Reserved Expression**: Not good at romantic expression, but strong in action
- **Strong Responsibility**: Strong protective desire for family and partner

### Ideal Partner Characteristics
**Personality Matching**:
- Gentle personality, able to tolerate your rationality
- Possess certain sensitivity and creativity to balance your rationality
- Independent and self-reliant, won't be overly dependent

**Five Elements Matching**:
- Wood element people (gentle and inclusive, creative)
- Fire element people (enthusiastic and cheerful, able to stimulate your vitality)

### Marriage Fortune Timing
- **Best Marriage Age**: 32-35 years old
- **Key Relationship Development Period**: 28-30 years old
- **Years to Note**: Avoid making major emotional decisions in Metal-strong years

## 5. Professional Health Fortune Analysis

### Physical Constitution
Your constitution tends toward **Metal-type constitution**, with the following characteristics:
- Strong bones, relatively robust physique
- Relatively strong lung function, but needs maintenance
- Skin tends to be dry, needs attention to moisturizing
- More sensitive to autumn climate changes

### Health Focus Areas
**Parts requiring special care**:
- 🫁 **Respiratory System**: Lungs, bronchi, avoid smoking and air pollution
- 🦴 **Bones and Joints**: Pay attention to calcium supplementation, avoid overexertion
- 🧠 **Nervous System**: Avoid overthinking, learn to relax and reduce stress

### Health Maintenance Recommendations
**Dietary Adjustments**:
- Eat more white foods: white fungus, lily, pear, white radish
- Moderately supplement Wood element foods: green leafy vegetables, sour fruits
- Avoid overly spicy and greasy foods

**Exercise Recommendations**:
- Suitable: Tai Chi, yoga, swimming, jogging
- Avoid: Overly intense confrontational sports

## 6. Precise Major Luck and Annual Fortune Prediction

### Next 10 Years Fortune Overview

**2024-2026 (Rising Period)**:
- Career fortune gradually improves, opportunities for promotion and salary increase
- Wealth fortune steadily rising, suitable for steady investment
- Love fortune stable, singles may meet suitable partners

**2027-2029 (Golden Period)**:
- Career reaches new heights, may face important choices
- Best wealth fortune, rich returns from investment and financial management
- Excellent marriage fortune, harmonious family for married couples

**2030-2033 (Adjustment Period)**:
- Career enters stable development stage
- Need to pay attention to health maintenance, avoid overexertion
- Emotional relationships need more communication and understanding

### Key Turning Point Years
- **2025**: Important turning point in career development
- **2028**: Year of double harvest in wealth and love
- **2031**: Year requiring special attention to health

## 7. Practical Advice Summary

### Five Elements Adjustment Plan
**Supplement Wood Element**:
- Wear more green clothes, use wooden furniture
- Place green plants on office desk
- Walk more in parks, connect with nature

**Enhance Fire Element**:
- Appropriately increase red decorations
- Participate more in social activities, increase interpersonal interaction
- Cultivate hobbies, stimulate creativity

### Fortune Enhancement Recommendations
**Lucky Colors**: Green, red, gold
**Lucky Numbers**: 3, 8, 9
**Lucky Directions**: East, South
**Lucky Items**: Green crystal, red agate, gold jewelry

### Life Planning Advice
1. **Career Development**: Focus on deep development in finance or management fields
2. **Investment and Finance**: Adopt steady investment strategies, avoid high-risk speculation
3. **Relationship Management**: Learn to express emotions, add romantic elements
4. **Health Management**: Regular health checkups, focus on respiratory system health
5. **Interpersonal Relationships**: Interact more with Wood and Fire element people for complementary development

---

**Summary**: Your BaZi shows steady, practical traits with prosperous wealth fortune. Through reasonable Five Elements adjustment and life planning, you will surely achieve greater success in career and life. It is recommended to maintain existing advantages while paying attention to supplementing innovative thinking and emotional expression abilities.

*This analysis is based on traditional BaZi theory combined with modern life realities, for reference and guidance only.*
      `.trim();
    }

    // 中文版本
    return `
# 八字排盘详细分析报告

## 1. 八字排盘详解

### 四柱排列
- **年柱**：庚午（金火） - 天干庚金，地支午火
- **月柱**：戊申（土金） - 天干戊土，地支申金
- **日柱**：乙酉（木金） - 天干乙木，地支酉金
- **时柱**：丁亥（火水） - 天干丁火，地支亥水

### 五行分布详析
**五行统计**：金3、木1、水1、火2、土1
- **金旺**：占主导地位，体现坚毅果断的性格特质
- **木弱**：创新思维需要加强，建议多接触绿色植物
- **水少**：智慧灵性略显不足，需要补充水元素
- **火适中**：热情活力平衡，但可适当增强
- **土稳**：基础稳固，但需要更多土元素支撑

### 十神配置
- **正财**：2个，财运稳定，善于积累
- **偏财**：1个，偶有意外收入
- **正官**：1个，具备管理才能
- **食神**：1个，创造力和表达能力良好
- **比肩**：1个，朋友运势不错
- **劫财**：1个，需注意与人合作时的利益分配

## 2. 性格特征深度分析

### 核心性格
您是一个**理性务实**的人，做事有条理，思维缜密。金元素的主导使您具备：
- 强烈的责任感和使命感
- 优秀的组织协调能力
- 对细节的敏锐观察力
- 坚持不懈的执行力

### 性格优势
✅ **决策果断**：面对选择时能够快速做出理性判断
✅ **执行力强**：制定计划后能够坚持执行到底
✅ **财商敏锐**：对金钱和投资有天然的敏感度
✅ **责任心重**：对工作和家庭都有强烈的责任感

### 需要改进的方面
⚠️ **过于追求完美**：有时会因为细节而影响整体进度
⚠️ **表达较为内敛**：在感情表达上需要更加主动
⚠️ **创新思维不足**：习惯按既定模式行事，缺乏突破性思维
⚠️ **压力承受**：容易因为责任感过重而给自己过大压力

## 3. 事业财运全面解析

### 职业天赋分析
**最适合的职业领域**：
- 🏦 **金融投资**：银行、证券、保险、投资顾问
- 💼 **企业管理**：中高层管理、项目管理、运营管理
- 🔧 **技术专业**：工程技术、质量控制、精密制造
- 📊 **财务会计**：财务分析、审计、税务筹划

### 事业发展时间轴
- **25-30岁**：积累期，建议在大企业学习管理经验
- **30-35岁**：上升期，事业运势开始显著提升
- **35-45岁**：黄金期，最适合承担重要职责或创业
- **45岁后**：稳定期，适合做导师或顾问角色

### 财运详细分析
**正财运势**：⭐⭐⭐⭐☆
- 工资收入稳定增长，适合长期职业发展
- 通过专业技能获得的收入会持续增加

**偏财运势**：⭐⭐⭐☆☆
- 投资理财方面有一定天赋，但需要谨慎
- 不适合高风险投资，建议稳健理财

## 4. 感情婚姻详细指导

### 感情性格特点
在感情中，您表现出：
- **理性多于感性**：会用理智分析感情关系
- **忠诚专一**：一旦确定关系就会全心投入
- **表达含蓄**：不善于浪漫表达，但行动力强
- **责任感强**：对家庭和伴侣有强烈的保护欲

### 理想伴侣特征
**性格匹配**：
- 性格温和，能够包容您的理性
- 具有一定的感性和创造力，能够平衡您的理性
- 独立自主，不会过分依赖

**五行匹配**：
- 木属性的人（温和包容，富有创意）
- 火属性的人（热情开朗，能够激发您的活力）

### 婚姻运势时间
- **最佳结婚年龄**：32-35岁
- **感情发展关键期**：28-30岁
- **需要注意的年份**：避免在金旺的年份做重大感情决定

## 5. 健康运势专业分析

### 体质特征
您的体质偏向**金型体质**，特点如下：
- 骨骼结实，体格较为强壮
- 肺功能相对较强，但需要保养
- 皮肤偏干，需要注意保湿
- 对秋季气候变化较为敏感

### 健康重点关注
**需要重点保养的部位**：
- 🫁 **呼吸系统**：肺部、支气管，避免吸烟和空气污染
- 🦴 **骨骼关节**：注意钙质补充，避免过度劳累
- 🧠 **神经系统**：避免过度思虑，学会放松减压

### 养生建议
**饮食调理**：
- 多吃白色食物：银耳、百合、梨、白萝卜
- 适量补充木元素食物：绿叶蔬菜、酸味水果
- 避免过于辛辣和油腻的食物

**运动建议**：
- 适合：太极拳、瑜伽、游泳、慢跑
- 避免：过于激烈的对抗性运动

## 6. 大运流年精准预测

### 未来10年运势概览

**2024-2026年（上升期）**：
- 事业运势逐步提升，有升职加薪的机会
- 财运稳中有升，适合进行稳健投资
- 感情运势平稳，单身者有望遇到合适对象

**2027-2029年（黄金期）**：
- 事业达到新高度，可能面临重要选择
- 财运最佳，投资理财收益丰厚
- 婚姻运势极佳，已婚者家庭和睦

**2030-2033年（调整期）**：
- 事业进入稳定发展阶段
- 需要注意健康保养，避免过度劳累
- 感情关系需要更多沟通和理解

### 关键转折年份
- **2025年**：事业发展的重要转折点
- **2028年**：财运和感情的双重收获年
- **2031年**：需要特别注意健康的年份

## 7. 实用建议总结

### 五行调理方案
**补充木元素**：
- 多穿绿色衣服，使用木质家具
- 在办公桌放置绿色植物
- 多到公园散步，接触大自然

**增强火元素**：
- 适当增加红色装饰
- 多参加社交活动，增加人际互动
- 培养兴趣爱好，激发创造力

### 开运建议
**幸运颜色**：绿色、红色、金色
**幸运数字**：3、8、9
**幸运方位**：东方、南方
**开运物品**：绿色水晶、红玛瑙、金饰品

### 人生规划建议
1. **职业发展**：专注于金融或管理领域的深度发展
2. **投资理财**：采用稳健的投资策略，避免高风险投机
3. **感情经营**：学会表达情感，增加浪漫元素
4. **健康管理**：定期体检，重点关注呼吸系统健康
5. **人际关系**：多与木、火属性的人交往，互补发展

---

**总结**：您的八字显示出稳重踏实、财运亨通的特质。通过合理的五行调理和人生规划，必将在事业和生活中取得更大的成功。建议保持现有的优势，同时注意补充创新思维和情感表达能力。

*此分析基于传统八字命理学理论，结合现代生活实际，仅供参考指导。*
    `.trim();
  }

  // 模拟每日运势响应
  getMockDailyResponse(isEnglish = false) {
    if (isEnglish) {
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      const hour = today.getHours();
      const timeOfDay = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

      return `
# Today's Detailed Fortune Analysis

## 📅 ${todayStr} ${timeOfDay} Fortune Report

### 1. Overall Daily Fortune Overview

**Overall Fortune Rating**: ⭐⭐⭐⭐☆ (8.5/10)

Today's celestial energy is extremely favorable for you. Jupiter and Venus form a beneficial aspect, bringing positive energy flow. Overall fortune shows an upward trend, making it an excellent time to seize opportunities and advance important matters.

**Main Fortune Characteristics**:
- 🌟 **Creative Burst**: Active thinking with continuous inspiration
- 💪 **Strong Execution**: Plans can be smoothly implemented
- 🤝 **Harmonious Relationships**: Interactions with others are particularly smooth
- 🎯 **Clear Goals**: Clear understanding of future direction

**Celestial Influence Analysis**:
- **Solar Energy**: Enhances confidence and leadership
- **Lunar Aspect**: Sharp emotional intuition, suitable for important decisions
- **Mercury Retrograde Ends**: Communication returns to smooth flow

### 2. Career and Work Fortune Details

**Work Efficiency Index**: ⭐⭐⭐⭐⭐ (9/10)

Today is the golden period for work performance, your professional abilities will be fully demonstrated.

**Specific Performance**:
- 📈 **Clear Thinking**: Complex problems can be quickly solved
- 🎯 **Strong Focus**: Able to maintain high concentration for long periods
- 💡 **Innovative Thinking**: Proposals and solutions are forward-looking
- 🤝 **Team Collaboration**: Perfect cooperation with colleagues, doubled efficiency

**Interpersonal Relations Fortune**:
- **With Superiors**: Easy to gain recognition and support, suitable for reporting important work
- **With Colleagues**: Harmonious cooperation atmosphere, can advance team projects
- **With Clients**: Smooth communication, high negotiation success rate

**Best Work Time Slots**:
- 🌅 **9-11 AM**: Sharpest thinking, suitable for creative work
- 🌞 **2-4 PM**: Strongest execution, suitable for advancing important projects
- 🌆 **6-7 PM**: Suitable for summarizing and planning tomorrow's work

### 3. In-depth Wealth Fortune Analysis

**Wealth Fortune Rating**: ⭐⭐⭐⭐☆ (8/10)

**Direct Wealth Fortune**: ⭐⭐⭐⭐☆
- Work income grows steadily, possible extra bonuses or commissions
- Income opportunities from professional skills increase
- Suitable for discussing salary increase or promotion with superiors

**Indirect Wealth Fortune**: ⭐⭐⭐☆☆
- Small gains in investment and financial management
- May receive unexpected financial returns
- Business opportunities introduced by friends worth attention

**Investment and Financial Advice**:
- ✅ **Suitable Investments**: Blue-chip stocks, steady funds, gold
- ✅ **Small Attempts**: Emerging tech stocks, digital currency (small amounts)
- ❌ **Avoid Investments**: High-risk futures, unfamiliar fields
- ❌ **Be Cautious**: High-yield projects recommended by friends

**Spending Guidelines**:
- 💰 **Suitable Purchases**: Learning materials, professional tools, health products
- 💸 **Avoid Spending**: Luxury goods, impulse purchases, large entertainment expenses

### 4. Comprehensive Love Fortune Analysis

**Love Fortune Overall**: ⭐⭐⭐⭐☆ (8/10)

**Singles' Romance Fortune**: ⭐⭐⭐⭐☆
- 🌸 **Meeting Opportunities**: May meet someone special through work or friend gatherings
- 💬 **Expression Ability**: Particularly good at expressing yourself today, charm value increased
- 🎯 **Best Timing**: Afternoon and evening have strongest romance luck
- 📍 **Favorable Locations**: Cafes, bookstores, cultural activity venues

**Dating Couples**: ⭐⭐⭐⭐⭐
- 💕 **Relationship Warming**: Feelings enter deeper communication stage
- 🎁 **Romantic Surprises**: Suitable for preparing small gifts or arranging dates
- 💬 **Deep Communication**: Can discuss future plans and important topics
- 🌟 **Mutual Understanding**: Partner can understand your thoughts and feelings

**Married Couples**: ⭐⭐⭐⭐☆
- 🏠 **Family Harmony**: Warm family atmosphere, suitable for family dinners
- 👨‍👩‍👧‍👦 **Parent-Child Relations**: Particularly harmonious interactions with children
- 💰 **Financial Planning**: Suitable for discussing family financial plans with partner
- 🎯 **Common Goals**: Easy to reach consensus on important decisions

### 5. Professional Health Fortune Guidance

**Health Status Assessment**: ⭐⭐⭐⭐☆ (8/10)

**Physical Condition**:
- 💪 **Abundant Energy**: Vigorous energy, suitable for various activities
- 🧠 **Mental State**: Clear thinking, stable and positive emotions
- 🫀 **Cardiovascular**: Circulatory system functioning well
- 🫁 **Respiratory System**: Needs special attention, avoid air pollution

**Focus Areas**:
- 🦴 **Neck and Shoulders**: Need to pay attention to posture during long work hours
- 👀 **Eye Care**: Excessive eye use, need appropriate rest
- 🦵 **Lower Limb Circulation**: Need appropriate activity when sitting for long periods

**Exercise Recommendations**:
- 🏃‍♂️ **Aerobic Exercise**: Jogging, swimming, cycling (30-45 minutes)
- 🧘‍♀️ **Relaxation Exercise**: Yoga, Tai Chi, meditation (15-20 minutes)
- 💪 **Strength Training**: Light equipment training (20-30 minutes)

**Dietary Adjustments**:
- ✅ **Recommended Foods**: Green leafy vegetables, fresh fruits, nuts, fish
- ✅ **Nutritional Supplements**: Vitamin C, Omega-3, protein
- ❌ **Avoid Foods**: Greasy foods, high-sugar drinks, overly salty foods
- 💧 **Water Intake**: 8-10 glasses of warm water daily

### 6. Detailed Lucky Elements Guide

**Lucky Color Combinations**:
- 🔵 **Main Color**: Deep blue (enhances wisdom and intuition)
- 🟢 **Matching Color**: Emerald green (boosts creativity and vitality)
- 🟡 **Accent Color**: Golden yellow (increases wealth and confidence)
- ⚪ **Balance Color**: Pure white (purifies energy, maintains clarity)

**Lucky Numbers Analysis**:
- **3**: Symbol of creativity and communication
- **7**: Number of wisdom and intuition
- **9**: Energy of completion and success
- **21**: Today's strongest lucky number combination

**Lucky Direction Guidance**:
- 🧭 **Best Direction**: Southeast (career development)
- 🧭 **Wealth Direction**: Due South (wealth accumulation)
- 🧭 **Love Direction**: Southwest (interpersonal relationships)
- 🧭 **Health Direction**: Due East (physical vitality)

**Auspicious Time Selection**:
- 🌅 **Mao Hour (5-7 AM)**: Suitable for morning exercise and meditation
- 🌞 **Si Hour (9-11 AM)**: Golden period for work and study
- 🌆 **You Hour (5-7 PM)**: Best time for socializing and emotional communication

### 7. Today's Action Guide

**Priority Tasks**:
1. 📋 **Important Work Reports**: Report project progress to superiors
2. 💼 **Business Negotiations**: Advance important cooperation projects
3. 📚 **Learning and Development**: Attend training or read professional books
4. 💕 **Relationship Building**: Deep communication with important people

**Avoidance Checklist**:
- ❌ Avoid making important decisions when emotionally excited
- ❌ Don't engage in high-risk investment operations
- ❌ Avoid unnecessary arguments with others
- ❌ Don't ignore body fatigue signals

**Opportunity Seizing Strategies**:
- 🎯 **Take Initiative**: Actively pursue opportunities of interest
- 🤝 **Build Connections**: Expand network, establish valuable relationships
- 💡 **Innovative Thinking**: Propose new ideas and solutions
- 📈 **Long-term Planning**: Develop 3-6 month development plans

**Risk Mitigation Reminders**:
- ⚠️ **Overconfidence**: Stay humble when successful, avoid arrogance
- ⚠️ **Ignore Details**: Pay attention to detail issues when advancing projects
- ⚠️ **Health Overdraft**: Don't overconsume energy just because you feel good
- ⚠️ **Financial Impulse**: Avoid blind investment due to good fortune

---

## 🌟 Today's Fortune Summary

Today is a peak period in your recent fortune, with positive trends in all aspects. Outstanding work performance will bring you more opportunities, wealth fortune is steadily rising, and love life will become sweeter.

**Key Success Factors**:
- Maintain a positive and proactive attitude
- Seize opportunities for communication with others
- Make decisive decisions on important matters
- Balance work and life, pay attention to physical health

**Today's Motto**: *"Opportunity favors the prepared mind, success belongs to those who dare to act."*

May you have a fulfilling day with success in both career and love!

---

*This fortune analysis is based on traditional celestial movement patterns and metaphysical principles, combined with modern life realities, for reference and guidance only. Ultimate success still requires your effort and wisdom.*
      `.trim();
    }

    // 中文版本
    const today = new Date();
    const todayStr = today.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const hour = today.getHours();
    const timeOfDay = hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';

    return `
# 今日运势详细分析

## 📅 ${todayStr} ${timeOfDay}运势报告

### 1. 今日总体运势概览

**整体运势评分**：⭐⭐⭐⭐☆ (8.5/10分)

今日天体能量对您极为有利，木星与金星形成良好相位，为您带来积极正面的能量流动。整体运势呈现上升趋势，是把握机遇、推进重要事务的绝佳时机。

**主要运势特点**：
- 🌟 **创造力爆发**：思维活跃，灵感不断涌现
- 💪 **执行力强**：计划能够顺利推进实施
- 🤝 **人际和谐**：与他人的互动特别顺畅
- 🎯 **目标明确**：对未来方向有清晰的认知

**天体影响分析**：
- **太阳能量**：增强自信心和领导力
- **月亮相位**：情感直觉敏锐，适合做重要决定
- **水星逆行结束**：沟通交流恢复顺畅

### 2. 事业工作运势详解

**工作效率指数**：⭐⭐⭐⭐⭐ (9/10)

今日是工作表现的黄金时段，您的专业能力将得到充分展现。

**具体表现**：
- 📈 **思路清晰**：复杂问题能够快速找到解决方案
- 🎯 **专注力强**：能够长时间保持高度集中
- 💡 **创新思维**：提出的建议和方案具有前瞻性
- 🤝 **团队协作**：与同事配合默契，效率倍增

**人际关系运势**：
- **与上司**：容易获得认可和支持，适合汇报重要工作
- **与同事**：合作氛围融洽，可以推进团队项目
- **与客户**：沟通顺畅，谈判成功率高

**最佳工作时段**：
- 🌅 **上午9-11点**：思维最为敏锐，适合创意工作
- 🌞 **下午2-4点**：执行力最强，适合推进重要项目
- 🌆 **傍晚6-7点**：适合总结和规划明日工作

### 3. 财运分析深度解读

**财运指数评级**：⭐⭐⭐⭐☆ (8/10)

**正财运势**：⭐⭐⭐⭐☆
- 工作收入稳定增长，可能有额外奖金或提成
- 专业技能带来的收入机会增加
- 适合与上司讨论加薪或升职事宜

**偏财运势**：⭐⭐⭐☆☆
- 投资理财方面有小幅收益
- 可能收到意外的资金回报
- 朋友介绍的商业机会值得关注

**投资理财建议**：
- ✅ **适宜投资**：蓝筹股、稳健型基金、黄金
- ✅ **小额尝试**：新兴科技股、数字货币（少量）
- ❌ **避免投资**：高风险期货、不熟悉的领域
- ❌ **谨慎对待**：朋友推荐的高收益项目

**消费支出指南**：
- 💰 **适宜购买**：学习资料、专业工具、健康产品
- 💸 **避免支出**：奢侈品、冲动消费、大额娱乐支出

### 4. 感情运势全面分析

**感情运势总评**：⭐⭐⭐⭐☆ (8/10)

**单身者桃花运**：⭐⭐⭐⭐☆
- 🌸 **遇见机会**：通过工作或朋友聚会可能遇到心仪对象
- 💬 **表达能力**：今日特别善于表达，魅力值提升
- 🎯 **最佳时机**：下午和傍晚时分桃花运最旺
- 📍 **有利场所**：咖啡厅、书店、文化活动场所

**恋爱中情侣**：⭐⭐⭐⭐⭐
- 💕 **关系升温**：感情进入更深层次的交流阶段
- 🎁 **浪漫惊喜**：适合准备小礼物或安排约会
- 💬 **深度沟通**：可以讨论未来规划和重要话题
- 🌟 **互相理解**：对方能够理解您的想法和感受

**已婚夫妻**：⭐⭐⭐⭐☆
- 🏠 **家庭和谐**：家庭氛围温馨，适合家庭聚餐
- 👨‍👩‍👧‍👦 **亲子关系**：与孩子的互动特别融洽
- 💰 **财务规划**：适合与伴侣讨论家庭理财计划
- 🎯 **共同目标**：在重要决策上容易达成一致

### 5. 健康运势专业指导

**健康状况评估**：⭐⭐⭐⭐☆ (8/10)

**身体状况**：
- 💪 **体力充沛**：精力旺盛，适合进行各种活动
- 🧠 **精神状态**：思维清晰，情绪稳定积极
- 🫀 **心血管**：循环系统运行良好
- 🫁 **呼吸系统**：需要特别关注，避免空气污染

**重点关注部位**：
- 🦴 **颈椎肩膀**：长时间工作需要注意姿势
- 👀 **眼部保养**：用眼过度，需要适当休息
- 🦵 **下肢循环**：久坐需要适当活动

**运动建议**：
- 🏃‍♂️ **有氧运动**：慢跑、游泳、骑行（30-45分钟）
- 🧘‍♀️ **放松运动**：瑜伽、太极、冥想（15-20分钟）
- 💪 **力量训练**：轻度器械训练（20-30分钟）

**饮食调理**：
- ✅ **推荐食物**：绿叶蔬菜、新鲜水果、坚果、鱼类
- ✅ **补充营养**：维生素C、Omega-3、蛋白质
- ❌ **避免食物**：油腻食品、高糖饮料、过咸食物
- 💧 **水分补充**：每日8-10杯温开水

### 6. 幸运元素详细指南

**幸运颜色组合**：
- 🔵 **主色调**：深蓝色（增强智慧和直觉）
- 🟢 **搭配色**：翠绿色（提升创造力和活力）
- 🟡 **点缀色**：金黄色（增加财运和自信）
- ⚪ **平衡色**：纯白色（净化能量，保持清醒）

**幸运数字解析**：
- **3**：创造力和沟通力的象征
- **7**：智慧和直觉的数字
- **9**：完成和成功的能量
- **21**：今日最强幸运数字组合

**幸运方位指导**：
- 🧭 **最佳方位**：东南方（事业发展）
- 🧭 **财运方位**：正南方（财富积累）
- 🧭 **感情方位**：西南方（人际关系）
- 🧭 **健康方位**：正东方（身体活力）

**吉时选择**：
- 🌅 **卯时（5-7点）**：适合晨练和冥想
- 🌞 **巳时（9-11点）**：工作和学习的黄金时段
- 🌆 **酉时（17-19点）**：社交和感情交流的最佳时机

### 7. 今日行动指南

**优先处理事项**：
1. 📋 **重要工作汇报**：向上级汇报项目进展
2. 💼 **商务谈判**：推进重要合作项目
3. 📚 **学习充电**：参加培训或阅读专业书籍
4. 💕 **感情经营**：与重要的人深度交流

**避免事项清单**：
- ❌ 避免在情绪激动时做重要决定
- ❌ 不要进行高风险的投资操作
- ❌ 避免与人发生不必要的争执
- ❌ 不要忽视身体的疲劳信号

**机遇把握策略**：
- 🎯 **主动出击**：对感兴趣的机会要积极争取
- 🤝 **建立联系**：扩展人脉网络，建立有价值的关系
- 💡 **创新思维**：提出新的想法和解决方案
- 📈 **长远规划**：制定未来3-6个月的发展计划

**风险规避提醒**：
- ⚠️ **过度自信**：成功时要保持谦逊，避免骄傲自满
- ⚠️ **忽视细节**：在推进项目时要注意细节问题
- ⚠️ **健康透支**：不要因为状态好而过度消耗体力
- ⚠️ **财务冲动**：避免因为运势好而盲目投资

---

## 🌟 今日运势总结

今天是您近期运势的高峰期，各方面都呈现积极向上的趋势。工作上的出色表现将为您带来更多机会，财运稳中有升，感情生活也将更加甜蜜。

**关键成功要素**：
- 保持积极主动的态度
- 抓住与他人沟通交流的机会
- 在重要事务上果断决策
- 平衡工作与生活，注意身体健康

**今日座右铭**：*"机遇偏爱有准备的心灵，成功属于敢于行动的人。"*

愿您在这美好的一天里收获满满，事业爱情双丰收！

---

*此运势分析基于传统天体运行规律和命理学原理，结合现代生活实际情况，仅供参考指导。最终的成功还需要您的努力和智慧。*
    `.trim();
  }

  // 模拟塔罗占卜响应
  getMockTarotResponse(isEnglish = false) {
    if (isEnglish) {
      return `
## Celestial Tarot Reading

### Drawn Tarot Cards

**Past Card: Three of Cups (Upright)**
- Meaning: Friendship, celebration, teamwork
- Interpretation: In the past, you have gained much in interpersonal relationships, and teamwork has brought success

**Present Card: King of Wands (Upright)**
- Meaning: Leadership, vision, entrepreneurial spirit
- Interpretation: You now possess strong leadership abilities and are at a key period in career development

**Future Card: The Star (Upright)**
- Meaning: Hope, inspiration, spiritual guidance
- Interpretation: The future is full of hope and possibilities, your ideals will gradually be realized

### Detailed Card Reading

These three cards form a very positive energy flow. From past team success, to present leadership position, to future hope realization, it shows you are on the right path forward.

The appearance of the King of Wands indicates you now have the ability to turn ideas into reality, while The Star card predicts your efforts will receive cosmic favor.

### Celestial Energy Analysis

Current celestial movements are very favorable for you:
- Jupiter's influence brings opportunities for expansion and growth
- Venus's energy enhances interpersonal relationships and creativity
- Solar power gives you confidence and vitality

### Comprehensive Reading Results

You are in an ascending period of life, past efforts are bearing fruit. Now is the time to demonstrate leadership abilities, the future is full of infinite possibilities. Maintain your current direction and trust your intuition.

### Action Guidance

1. **Continue Leadership Role**: Your leadership abilities are being recognized
2. **Maintain Team Spirit**: Don't forget the foundation of past success
3. **Trust Intuitive Guidance**: The Star reminds you to believe in your inner voice
4. **Make Long-term Plans**: Now is the best time to plan for the future

**Tarot Reminder**: Keep an open mind, the universe is arranging the best path for you.

*This tarot reading is based on the Rider-Waite tarot system and celestial energy studies, for spiritual guidance reference only.*
      `.trim();
    }

    // 中文版本
    return `
## 天体塔罗占卜

### 抽取的塔罗牌

**过去牌：圣杯三（正位）**
- 含义：友谊、庆祝、团队合作
- 解读：过去您在人际关系方面收获颇丰，团队合作带来了成功

**现在牌：权杖国王（正位）**
- 含义：领导力、远见、创业精神
- 解读：现在的您具备强大的领导能力，正处于事业发展的关键时期

**未来牌：星星（正位）**
- 含义：希望、灵感、精神指引
- 解读：未来充满希望和可能性，您的理想将逐步实现

### 牌面详细解读

这三张牌形成了一个非常积极的能量流动。从过去的团队成功，到现在的领导地位，再到未来的希望实现，显示出您正在一条正确的道路上前进。

权杖国王的出现表明您现在拥有将想法转化为现实的能力，而星星牌预示着您的努力将得到宇宙的眷顾。

### 天体能量分析

当前天体运行对您非常有利：
- 木星的影响带来扩展和成长的机会
- 金星的能量增强了人际关系和创造力
- 太阳的力量给予您自信和活力

### 综合占卜结果

您正处于人生的上升期，过去的努力正在开花结果。现在是展现领导才能的时候，未来充满无限可能。保持现在的方向，相信自己的直觉。

### 行动建议

1. **继续发挥领导作用**：您的领导能力正在被认可
2. **保持团队合作精神**：不要忘记过去成功的基础
3. **相信直觉指引**：星星牌提醒您要相信内心的声音
4. **制定长远计划**：现在是规划未来的最佳时机

**塔罗提醒**：保持开放的心态，宇宙正在为您安排最好的道路。

*塔罗占卜基于韦特塔罗系统和天体能量学，仅供精神指导参考。*
    `.trim();
  }

  // 模拟幸运物品响应
  getMockLuckyItemsResponse(isEnglish = false) {
    console.log(`🍀 getMockLuckyItemsResponse - isEnglish: ${isEnglish}`);
    if (isEnglish) {
      const currentMonth = new Date().getMonth() + 1;
      const season = this.getCurrentSeason();
      const seasonEn = season === '春季' ? 'Spring' : season === '夏季' ? 'Summer' : season === '秋季' ? 'Autumn' : 'Winter';

      return `
## Five Elements Adjustment and Fortune Enhancement Plan (Month ${currentMonth} - ${seasonEn})

### 1. Five Elements Adjustment Plan
Based on your birth information analysis, your Five Elements attributes lean toward Metal and Earth, requiring supplementation of Wood and Fire elements to achieve balance.

**Adjustment Methods**:
- Increase contact with green plants and natural environments to supplement Wood element
- Appropriately increase exercise and social activities to activate Fire element
- Maintain regular routines to stabilize Earth element foundation

### 2. Fortune Enhancement Recommendations

**Lucky Colors**:
- **Emerald Green**: Enhances creativity and career fortune
- **Orange Red**: Boosts passion and interpersonal relationships
- **Golden Yellow**: Strengthens wealth fortune and confidence
- **Cream White**: Brings tranquility and wisdom

**Lucky Accessories**:
- **Green Phantom Crystal**: Wear on left hand to enhance career fortune
- **Citrine**: Place on front left of desk to attract wealth
- **Red Agate Bracelet**: Daily wear to boost vitality
- **Gold Jewelry**: Rings or necklaces to enhance wealth fortune

**Personal Items**:
- Green or gold wallet
- Small green plant ornaments (for office desk)
- Wooden or jade small pendants

### 3. Life Planning Suggestions

**Career Development**:
- Suitable for creative, educational, or financial industries
- Advisable to collaborate with Water-element people for Five Elements complementarity
- Make important decisions between 9-11 AM

**Living Environment**:
- Use green and warm color decorations in living spaces
- Position desk facing east or southeast
- Avoid excessive metal decorations in bedroom

**Romantic Fortune**:
- Participate more in outdoor activities to increase romantic luck
- Wear warm-colored clothing to enhance personal charm
- Get along better with Wood and Fire element people

### 4. Summary

**Core Adjustment Points**:
- Supplement Wood and Fire elements to balance Five Elements energy
- Use more green and warm-colored items
- Maintain positive and optimistic mindset

**Near-term Focus Areas**:
- Pay special attention to supplementing Wood element during ${seasonEn}
- Strengthen interpersonal interactions to activate Fire element
- Properly arrange work and rest time

**Long-term Fortune Enhancement**:
- Persist with Five Elements adjustment plan
- Regularly replace and purify fortune items
- Maintain learning and growth mindset

*This plan is based on traditional Five Elements theory, focusing on adjustment and balance, for reference only.*
      `.trim();
    }

    // 中文版本
    const currentMonth = new Date().getMonth() + 1;
    const season = this.getCurrentSeason();

    return `
## 五行调理与开运方案 (${currentMonth}月 - ${season})

### 1. 五行调理方案
根据您的生辰信息分析，您的五行属性偏向金土，需要补充木火元素来达到平衡。

**调理方法**：
- 多接触绿色植物和自然环境，补充木元素
- 适当增加运动和社交活动，激发火元素
- 保持规律作息，稳固土元素根基

### 2. 开运建议

**幸运颜色**：
- **翠绿色**：增强创造力和事业运
- **橙红色**：提升热情和人际关系
- **金黄色**：强化财运和自信心
- **米白色**：带来平静和智慧

**幸运饰品**：
- **绿幽灵水晶**：佩戴在左手，增强事业运
- **黄水晶**：放置办公桌左前方，招财进宝
- **红玛瑙手链**：日常佩戴，提升活力
- **黄金饰品**：戒指或项链，增强财运

**随身物品**：
- 绿色或金色钱包
- 小型绿植摆件（办公桌）
- 木质或玉石小挂件

### 3. 人生规划建议

**事业发展**：
- 适合从事创意、教育、金融相关行业
- 宜与属水的人合作，形成五行互补
- 重要决策选择在上午9-11点进行

**生活环境**：
- 居住环境多用绿色和暖色调装饰
- 办公桌面向东方或东南方
- 卧室避免过多金属装饰

**感情运势**：
- 多参与户外活动，增加桃花运
- 穿着暖色系服装提升个人魅力
- 与属木、属火的人相处更和谐

### 4. 总结

**核心调理要点**：
- 补充木火元素，平衡五行能量
- 多用绿色和暖色调物品
- 保持积极乐观的心态

**近期重点关注**：
- ${season}期间特别注意补充木元素
- 加强人际交往，激发火元素
- 合理安排工作与休息时间

**长期运势提升**：
- 坚持五行调理方案
- 定期更换和净化开运物品
- 保持学习和成长的心态

*此方案基于传统五行学说，重在调理平衡，仅供参考。*
    `.trim();
  }

  // 模拟翻译响应
  getMockTranslationResponse() {
    return `
Based on the BaZi analysis, this person has a resilient character with strong leadership abilities. The Five Elements show strong Wood and Fire elements, making them suitable for innovative work. Career fortune will gradually rise after age 30, with prosperous wealth luck. It is recommended to collaborate more with Water-related industries to help balance the Five Elements.

Translation notes:
1. Professional divination terminology has been preserved
2. Traditional Chinese cultural connotations are maintained
3. The language flows naturally while keeping the original structure
    `.trim();
  }
}

module.exports = new DeepSeekService();
