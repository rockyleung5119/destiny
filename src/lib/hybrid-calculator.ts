import { AnalysisRequest, AnalysisResult, BaziData, ZiweiData, FortuneAnalysis } from '@/types';
import { calculateBazi } from './bazi-calculator';
import { calculateZiwei } from './ziwei-calculator';
import { analyzeComprehensiveFortune, calculateDailyFortune } from './fortune-analyzer';
import { aiService } from './ai-service';
import { cache, CacheKeys } from './cache';
import { logger } from './logger';
import { config } from './config';
import { sleep, generateRandomString } from './utils';

/**
 * 混合计算策略服务
 * 结合本地计算和AI分析，提供完整的命理分析服务
 */
export class HybridCalculatorService {
  private static instance: HybridCalculatorService;

  static getInstance(): HybridCalculatorService {
    if (!HybridCalculatorService.instance) {
      HybridCalculatorService.instance = new HybridCalculatorService();
    }
    return HybridCalculatorService.instance;
  }

  /**
   * 执行完整的命理分析
   */
  async performAnalysis(
    request: AnalysisRequest,
    userSubscription: 'free' | 'regular' | 'annual' | 'lifetime' = 'free'
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisId = generateRandomString(12);
    
    logger.info('Starting hybrid analysis', {
      analysisId,
      type: request.analysisType,
      subscription: userSubscription
    });

    try {
      // 第一阶段：本地基础计算
      const localResults = await this.performLocalCalculations(request);
      
      // 第二阶段：AI增强分析（根据订阅类型决定）
      const aiResults = await this.performAIAnalysis(request, localResults, userSubscription);
      
      // 第三阶段：结果整合
      const finalResult = await this.integrateResults(
        request,
        localResults,
        aiResults,
        analysisId
      );

      const duration = Date.now() - startTime;
      logger.info('Analysis completed', {
        analysisId,
        duration,
        subscription: userSubscription
      });

      return finalResult;

    } catch (error) {
      logger.error('Analysis failed', error as Error, {
        analysisId,
        type: request.analysisType
      });
      throw error;
    }
  }

  /**
   * 执行本地计算
   */
  private async performLocalCalculations(request: AnalysisRequest): Promise<{
    baziData?: BaziData;
    ziweiData?: ZiweiData;
    fortune: FortuneAnalysis;
    dailyFortune?: any;
  }> {
    const { birthInfo, analysisType, options } = request;
    
    // 检查缓存
    const cacheKey = this.generateLocalCacheKey(birthInfo, analysisType);
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.info('Local calculations served from cache');
      return cached;
    }

    const results: any = {};

    // 计算八字
    if (analysisType === 'bazi' || analysisType === 'comprehensive') {
      logger.info('Calculating Bazi');
      results.baziData = calculateBazi(birthInfo);
    }

    // 计算紫微斗数
    if (analysisType === 'ziwei' || analysisType === 'comprehensive') {
      logger.info('Calculating Ziwei');
      results.ziweiData = calculateZiwei(birthInfo);
    }

    // 计算综合运势
    logger.info('Analyzing comprehensive fortune');
    results.fortune = analyzeComprehensiveFortune(
      birthInfo,
      results.baziData,
      results.ziweiData
    );

    // 计算每日运势
    if (options?.includeDaily || analysisType === 'daily') {
      logger.info('Calculating daily fortune');
      results.dailyFortune = calculateDailyFortune(birthInfo);
    }

    // 缓存结果
    await cache.set(cacheKey, results, { ttl: 24 * 60 * 60 }); // 24小时

    return results;
  }

  /**
   * 执行AI分析
   */
  private async performAIAnalysis(
    request: AnalysisRequest,
    localResults: any,
    userSubscription: string
  ): Promise<{
    baziAnalysis?: string;
    ziweiAnalysis?: string;
    comprehensiveAnalysis?: string;
    dailyAnalysis?: string;
  }> {
    const aiEnabled = await config.get('enableAiAnalysis');
    if (!aiEnabled) {
      logger.info('AI analysis disabled');
      return {};
    }

    // 根据订阅类型决定AI分析级别
    const detailLevel = this.getAIDetailLevel(userSubscription);
    const shouldUseAI = this.shouldUseAI(userSubscription);

    if (!shouldUseAI) {
      logger.info('AI analysis not available for subscription level', { userSubscription });
      return {};
    }

    // 为免费用户添加延迟
    if (userSubscription === 'free') {
      await this.addDelayForFreeUsers();
    }

    const { birthInfo, analysisType } = request;
    const userInfo = {
      name: birthInfo.name,
      gender: birthInfo.gender,
      birthDate: birthInfo.birthDate
    };

    const aiResults: any = {};

    try {
      // AI八字分析
      if (localResults.baziData && (analysisType === 'bazi' || analysisType === 'comprehensive')) {
        logger.info('Performing AI Bazi analysis');
        const response = await aiService.analyzeBaziWithAI(
          localResults.baziData,
          userInfo,
          { detailLevel }
        );
        aiResults.baziAnalysis = response.content;
      }

      // AI紫微斗数分析
      if (localResults.ziweiData && (analysisType === 'ziwei' || analysisType === 'comprehensive')) {
        logger.info('Performing AI Ziwei analysis');
        const response = await aiService.analyzeZiweiWithAI(
          localResults.ziweiData,
          userInfo,
          { detailLevel }
        );
        aiResults.ziweiAnalysis = response.content;
      }

      // AI综合分析
      if (analysisType === 'comprehensive' && localResults.baziData && localResults.ziweiData) {
        logger.info('Performing AI comprehensive analysis');
        const response = await aiService.generateComprehensiveAnalysis(
          localResults.baziData,
          localResults.ziweiData,
          localResults.fortune,
          userInfo,
          { detailLevel }
        );
        aiResults.comprehensiveAnalysis = response.content;
      }

      // AI每日运势
      if (localResults.dailyFortune && localResults.baziData) {
        logger.info('Performing AI daily fortune analysis');
        const response = await aiService.generateDailyFortune(
          localResults.baziData,
          new Date(),
          userInfo
        );
        aiResults.dailyAnalysis = response.content;
      }

    } catch (error) {
      logger.error('AI analysis failed, falling back to local results', error as Error);
      // AI失败时不影响整体分析，继续使用本地结果
    }

    return aiResults;
  }

  /**
   * 整合分析结果
   */
  private async integrateResults(
    request: AnalysisRequest,
    localResults: any,
    aiResults: any,
    analysisId: string
  ): Promise<AnalysisResult> {
    const { birthInfo, analysisType } = request;

    // 构建预测信息
    const predictions = this.generatePredictions(localResults, aiResults);

    // 构建建议信息
    const advice = this.generateAdvice(localResults, aiResults);

    const result: AnalysisResult = {
      id: analysisId,
      analysisType,
      baziData: localResults.baziData,
      ziweiData: localResults.ziweiData,
      fortune: localResults.fortune,
      dailyFortune: localResults.dailyFortune,
      predictions,
      advice,
      createdAt: new Date()
    };

    return result;
  }

  /**
   * 生成预测信息
   */
  private generatePredictions(localResults: any, aiResults: any): {
    nextMonth: string;
    nextYear: string;
    majorEvents: string[];
  } {
    // 基于本地计算和AI分析生成预测
    const predictions = {
      nextMonth: '运势平稳，适合稳步发展',
      nextYear: '整体向好，有新的机遇出现',
      majorEvents: ['事业发展', '人际关系改善', '财运提升']
    };

    // 如果有AI分析结果，可以从中提取更精确的预测
    if (aiResults.comprehensiveAnalysis) {
      // 这里可以添加从AI分析中提取预测信息的逻辑
    }

    return predictions;
  }

  /**
   * 生成建议信息
   */
  private generateAdvice(localResults: any, aiResults: any): {
    general: string;
    career: string;
    wealth: string;
    love: string;
    health: string;
  } {
    const advice = {
      general: '保持积极心态，顺应自然规律发展',
      career: localResults.fortune.career.advice,
      wealth: localResults.fortune.wealth.advice,
      love: localResults.fortune.love.advice,
      health: localResults.fortune.health.advice
    };

    // 如果有AI分析，可以提供更个性化的建议
    if (aiResults.comprehensiveAnalysis) {
      advice.general = '根据您的命理特点，建议' + advice.general;
    }

    return advice;
  }

  /**
   * 根据订阅类型获取AI分析详细程度
   */
  private getAIDetailLevel(subscription: string): 'basic' | 'detailed' | 'premium' {
    switch (subscription) {
      case 'free':
        return 'basic';
      case 'regular':
        return 'basic';
      case 'annual':
        return 'detailed';
      case 'lifetime':
        return 'premium';
      default:
        return 'basic';
    }
  }

  /**
   * 判断是否应该使用AI分析
   */
  private shouldUseAI(subscription: string): boolean {
    // 免费用户也可以使用AI，但有延迟和限制
    return true;
  }

  /**
   * 为免费用户添加延迟
   */
  private async addDelayForFreeUsers(): Promise<void> {
    const delays = [
      { duration: 5000, message: 'Analyzing birth chart...' },
      { duration: 8000, message: 'Calculating destiny patterns...' },
      { duration: 10000, message: 'Generating fortune report...' },
      { duration: 7000, message: 'Almost complete...' }
    ];

    for (const delay of delays) {
      logger.info(`Free user delay: ${delay.message}`);
      await sleep(delay.duration);
    }
  }

  /**
   * 生成本地计算缓存键
   */
  private generateLocalCacheKey(birthInfo: any, analysisType: string): string {
    const key = `${birthInfo.birthDate.toISOString()}_${birthInfo.birthPlace}_${analysisType}`;
    return CacheKeys.baziAnalysis(key, 'local');
  }

  /**
   * 批量处理分析请求
   */
  async batchAnalysis(
    requests: AnalysisRequest[],
    userSubscription: string = 'free'
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    
    // 并行处理多个请求（限制并发数）
    const concurrency = userSubscription === 'free' ? 1 : 3;
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(request => this.performAnalysis(request, userSubscription))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 获取分析统计信息
   */
  async getAnalysisStats(): Promise<{
    totalAnalyses: number;
    aiAnalyses: number;
    cacheHitRate: number;
    averageProcessingTime: number;
  }> {
    // 这里应该从数据库或缓存中获取统计信息
    // 暂时返回模拟数据
    return {
      totalAnalyses: 1000,
      aiAnalyses: 800,
      cacheHitRate: 0.65,
      averageProcessingTime: 15000 // 毫秒
    };
  }
}

// 导出单例实例
export const hybridCalculator = HybridCalculatorService.getInstance();
