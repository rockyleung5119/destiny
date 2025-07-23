import OpenAI from 'openai';
import { AIAnalysisRequest, AIAnalysisResponse, BaziData, ZiweiData, FortuneAnalysis } from '@/types';
import { AI_MODELS } from './constants';
import { config } from './config';
import { cache, CacheKeys } from './cache';
import { logger } from './logger';
import { retry } from './utils';

// Initialize OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

/**
 * AI分析服务类
 */
export class AIAnalysisService {
  private static instance: AIAnalysisService;

  static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  /**
   * 使用AI分析八字命理
   */
  async analyzeBaziWithAI(
    baziData: BaziData,
    userInfo: { name: string; gender: string; birthDate: Date },
    options: { detailLevel?: 'basic' | 'detailed' | 'premium' } = {}
  ): Promise<AIAnalysisResponse> {
    const prompt = this.buildBaziAnalysisPrompt(baziData, userInfo, options.detailLevel || 'basic');
    
    return this.callAI({
      prompt,
      model: await this.selectModel(options.detailLevel || 'basic'),
      maxTokens: this.getMaxTokens(options.detailLevel || 'basic'),
      temperature: 0.7
    });
  }

  /**
   * 使用AI分析紫微斗数
   */
  async analyzeZiweiWithAI(
    ziweiData: ZiweiData,
    userInfo: { name: string; gender: string; birthDate: Date },
    options: { detailLevel?: 'basic' | 'detailed' | 'premium' } = {}
  ): Promise<AIAnalysisResponse> {
    const prompt = this.buildZiweiAnalysisPrompt(ziweiData, userInfo, options.detailLevel || 'basic');
    
    return this.callAI({
      prompt,
      model: await this.selectModel(options.detailLevel || 'basic'),
      maxTokens: this.getMaxTokens(options.detailLevel || 'basic'),
      temperature: 0.7
    });
  }

  /**
   * 使用AI生成综合运势分析
   */
  async generateComprehensiveAnalysis(
    baziData: BaziData,
    ziweiData: ZiweiData,
    fortuneAnalysis: FortuneAnalysis,
    userInfo: { name: string; gender: string; birthDate: Date },
    options: { detailLevel?: 'basic' | 'detailed' | 'premium' } = {}
  ): Promise<AIAnalysisResponse> {
    const prompt = this.buildComprehensiveAnalysisPrompt(
      baziData, 
      ziweiData, 
      fortuneAnalysis, 
      userInfo, 
      options.detailLevel || 'basic'
    );
    
    return this.callAI({
      prompt,
      model: await this.selectModel(options.detailLevel || 'basic'),
      maxTokens: this.getMaxTokens(options.detailLevel || 'basic'),
      temperature: 0.8
    });
  }

  /**
   * 使用AI生成每日运势
   */
  async generateDailyFortune(
    baziData: BaziData,
    date: Date,
    userInfo: { name: string; gender: string }
  ): Promise<AIAnalysisResponse> {
    const prompt = this.buildDailyFortunePrompt(baziData, date, userInfo);
    
    return this.callAI({
      prompt,
      model: 'gpt-3.5-turbo',
      maxTokens: 800,
      temperature: 0.6
    });
  }

  /**
   * 核心AI调用方法
   */
  private async callAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const cacheKey = CacheKeys.aiResponse(request.prompt);
    
    // 尝试从缓存获取
    const cached = await cache.get<AIAnalysisResponse>(cacheKey);
    if (cached) {
      logger.info('AI response served from cache');
      return cached;
    }

    try {
      const response = await retry(async () => {
        const client = getOpenAIClient();
        
        const completion = await client.chat.completions.create({
          model: request.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: request.maxTokens,
          temperature: request.temperature
        });

        return completion;
      }, 3, 1000);

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;
      
      if (!usage) {
        throw new Error('No usage information returned from OpenAI');
      }

      // 计算成本
      const modelConfig = AI_MODELS[request.model];
      const cost = (usage.prompt_tokens * modelConfig.inputCost + 
                   usage.completion_tokens * modelConfig.outputCost) / 1000;

      const result: AIAnalysisResponse = {
        content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        cost
      };

      // 缓存结果
      await cache.set(cacheKey, result, { ttl: 7 * 24 * 60 * 60 }); // 7天

      logger.info('AI analysis completed', {
        model: request.model,
        tokens: usage.total_tokens,
        cost
      });

      return result;

    } catch (error) {
      logger.error('AI analysis failed', error as Error);
      throw error;
    }
  }

  /**
   * 选择合适的AI模型
   */
  private async selectModel(detailLevel: 'basic' | 'detailed' | 'premium'): Promise<'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo'> {
    const defaultModel = await config.get('defaultAiModel');
    
    switch (detailLevel) {
      case 'basic':
        return 'gpt-3.5-turbo';
      case 'detailed':
        return defaultModel === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo';
      case 'premium':
        return 'gpt-4-turbo';
      default:
        return 'gpt-3.5-turbo';
    }
  }

  /**
   * 获取最大token数
   */
  private getMaxTokens(detailLevel: 'basic' | 'detailed' | 'premium'): number {
    switch (detailLevel) {
      case 'basic': return 1000;
      case 'detailed': return 2000;
      case 'premium': return 3000;
      default: return 1000;
    }
  }

  /**
   * 系统提示词
   */
  private getSystemPrompt(): string {
    return `你是一位精通中国传统命理学的专业大师，擅长八字命理、紫微斗数等传统预测术。

你的特点：
1. 深厚的命理学理论基础和丰富的实践经验
2. 能够准确解读八字、紫微斗数等命理信息
3. 提供的分析既专业又通俗易懂
4. 给出的建议实用且积极正面
5. 尊重传统文化，同时结合现代生活实际

请根据提供的命理数据，给出专业、准确、有建设性的分析和建议。分析应该包括：
- 命理特点解读
- 性格特征分析  
- 运势趋势预测
- 实用的改运建议
- 注意事项提醒

回答要求：
- 使用专业但易懂的语言
- 结构清晰，条理分明
- 积极正面，给人希望
- 避免过于绝对的表述
- 结合现代生活实际情况`;
  }

  /**
   * 构建八字分析提示词
   */
  private buildBaziAnalysisPrompt(
    baziData: BaziData,
    userInfo: { name: string; gender: string; birthDate: Date },
    detailLevel: 'basic' | 'detailed' | 'premium'
  ): string {
    const { year, month, day, hour, elements, tenGods, spirits } = baziData;
    
    let prompt = `请分析以下八字命理信息：

基本信息：
- 姓名：${userInfo.name}
- 性别：${userInfo.gender === 'male' ? '男' : '女'}
- 出生日期：${userInfo.birthDate.toLocaleDateString()}

八字四柱：
- 年柱：${year.heavenlyStem}${year.earthlyBranch}（${year.element}）
- 月柱：${month.heavenlyStem}${month.earthlyBranch}（${month.element}）
- 日柱：${day.heavenlyStem}${day.earthlyBranch}（${day.element}）
- 时柱：${hour.heavenlyStem}${hour.earthlyBranch}（${hour.element}）

五行分布：
- 木：${elements.wood}个
- 火：${elements.fire}个
- 土：${elements.earth}个
- 金：${elements.metal}个
- 水：${elements.water}个

十神关系：
- 日主：${tenGods.dayMaster}
- 有利十神：${tenGods.favorable.join('、') || '无'}
- 不利十神：${tenGods.unfavorable.join('、') || '无'}

神煞：${spirits.join('、') || '无'}`;

    if (detailLevel === 'detailed' || detailLevel === 'premium') {
      prompt += `

请提供详细分析，包括：
1. 八字格局判断
2. 日主强弱分析
3. 喜用神确定
4. 性格特征解读
5. 事业财运分析
6. 感情婚姻分析
7. 健康状况分析
8. 大运流年趋势`;
    }

    if (detailLevel === 'premium') {
      prompt += `
9. 具体的改运建议
10. 重要年份提醒
11. 适合的职业方向
12. 风水调理建议`;
    }

    return prompt;
  }

  /**
   * 构建紫微斗数分析提示词
   */
  private buildZiweiAnalysisPrompt(
    ziweiData: ZiweiData,
    userInfo: { name: string; gender: string; birthDate: Date },
    detailLevel: 'basic' | 'detailed' | 'premium'
  ): string {
    const { lifePlace, palaces, majorPeriods } = ziweiData;
    
    let prompt = `请分析以下紫微斗数命盘：

基本信息：
- 姓名：${userInfo.name}
- 性别：${userInfo.gender === 'male' ? '男' : '女'}
- 出生日期：${userInfo.birthDate.toLocaleDateString()}

命宫信息：
- 命宫：${lifePlace.palace}
- 主星：${lifePlace.mainStars.join('、') || '无主星'}
- 辅星：${lifePlace.auxiliaryStars.join('、') || '无'}
- 四化：${lifePlace.fourTransforms.join('、') || '无'}

十二宫位星曜分布：`;

    Object.entries(palaces).forEach(([palace, data]) => {
      prompt += `\n- ${palace}：${data.stars.join('、') || '空宫'}`;
    });

    if (detailLevel === 'detailed' || detailLevel === 'premium') {
      prompt += `

大限运势：`;
      majorPeriods.slice(0, 6).forEach(period => {
        prompt += `\n- ${period.age}-${period.age + 9}岁：${period.palace}`;
      });
    }

    return prompt;
  }

  /**
   * 构建综合分析提示词
   */
  private buildComprehensiveAnalysisPrompt(
    baziData: BaziData,
    ziweiData: ZiweiData,
    fortuneAnalysis: FortuneAnalysis,
    userInfo: { name: string; gender: string; birthDate: Date },
    detailLevel: 'basic' | 'detailed' | 'premium'
  ): string {
    return `请结合八字命理和紫微斗数，为${userInfo.name}（${userInfo.gender === 'male' ? '男' : '女'}）提供综合命理分析。

当前运势评分：
- 综合评分：${fortuneAnalysis.overallScore}分
- 事业运：${fortuneAnalysis.career.score}分
- 财运：${fortuneAnalysis.wealth.score}分  
- 感情运：${fortuneAnalysis.love.score}分
- 健康运：${fortuneAnalysis.health.score}分

请提供：
1. 整体命运格局分析
2. 性格特质深度解读
3. 人生发展趋势预测
4. 各方面运势详细分析
5. 实用的人生建议
6. 需要注意的问题
7. 改运方法指导`;
  }

  /**
   * 构建每日运势提示词
   */
  private buildDailyFortunePrompt(
    baziData: BaziData,
    date: Date,
    userInfo: { name: string; gender: string }
  ): string {
    return `请为${userInfo.name}（${userInfo.gender === 'male' ? '男' : '女'}）分析${date.toLocaleDateString()}的运势。

日主：${baziData.day.heavenlyStem}${baziData.day.earthlyBranch}

请提供：
1. 今日整体运势
2. 事业工作运势
3. 财运投资建议
4. 感情人际关系
5. 健康注意事项
6. 吉时吉方
7. 适宜和忌讳的事项

要求简洁实用，适合日常参考。`;
  }
}

// 导出单例实例
export const aiService = AIAnalysisService.getInstance();
