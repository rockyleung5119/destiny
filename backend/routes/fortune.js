// 算命功能路由 - 简化版
const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseekService');
const { authenticateToken } = require('../middleware/auth');
const { checkMembership } = require('../middleware/membership');
const rateLimit = require('express-rate-limit');

// 简单限流 - 每小时5次
const fortuneRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5,
  message: {
    success: false,
    message: 'Too many fortune requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 获取语言设置
function getLanguageFromRequest(req) {
  return req.headers['x-language'] || 
         req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
         'zh';
}

// 八字精算
router.post('/bazi', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    console.log(`🔮 BaZi Analysis Request - Language: ${language}`);

    const service = new deepseekService();
    const analysis = await service.getBaziAnalysis(req.user, language);

    res.json({
      success: true,
      message: 'BaZi analysis completed successfully',
      data: {
        type: 'bazi',
        analysis: analysis,
        aiAnalysis: analysis, // 前端期望的字段名
        analysisType: 'bazi',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ BaZi analysis error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate BaZi analysis',
      error: error.message
    });
  }
});

// 每日运势
router.post('/daily', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    console.log(`🔮 Daily Fortune Request - Language: ${language}`);

    const service = new deepseekService();
    const fortune = await service.getDailyFortune(req.user, language);

    res.json({
      success: true,
      message: 'Daily fortune completed successfully',
      data: {
        type: 'daily',
        analysis: fortune,
        aiAnalysis: fortune, // 前端期望的字段名
        analysisType: 'daily',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Daily fortune error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily fortune',
      error: error.message
    });
  }
});

// 塔罗占卜
router.post('/tarot', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    const { question } = req.body;
    console.log(`🔮 Tarot Reading Request - Language: ${language}`);

    const service = new deepseekService();
    const reading = await service.getCelestialTarotReading(req.user, question, language);

    res.json({
      success: true,
      message: 'Tarot reading completed successfully',
      data: {
        type: 'tarot',
        analysis: reading,
        aiAnalysis: reading, // 前端期望的字段名
        analysisType: 'tarot',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Tarot reading error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tarot reading',
      error: error.message
    });
  }
});

// 幸运物品
router.post('/lucky', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    console.log(`🔮 Lucky Items Request - Language: ${language}`);

    const service = new deepseekService();
    const items = await service.getLuckyItems(req.user, language);

    res.json({
      success: true,
      message: 'Lucky items analysis completed successfully',
      data: {
        type: 'lucky',
        analysis: items,
        aiAnalysis: items, // 前端期望的字段名
        analysisType: 'lucky',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Lucky items error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate lucky items',
      error: error.message
    });
  }
});

module.exports = router;
