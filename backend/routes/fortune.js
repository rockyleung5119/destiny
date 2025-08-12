// 算命功能路由
const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseekService');
const { authenticateToken } = require('../middleware/auth');
const { checkMembership } = require('../middleware/membership');
const { dbGet, dbRun, dbAll } = require('../config/database');
const { getLanguageFromRequest } = require('../utils/i18n');
const rateLimit = require('express-rate-limit');

// 测试端点
router.get('/test-language', authenticateToken, (req, res) => {
  const language = getLanguageFromRequest(req);
  console.log(`🧪 Test Language Endpoint - Detected language: ${language}`);
  res.json({
    success: true,
    language: language,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// 算命功能限流 - 付费用户每小时10次，免费用户每天1次
const fortuneRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: async (req) => {
    // 检查用户会员状态
    const membership = await dbGet(`
      SELECT plan_id, is_active FROM memberships 
      WHERE user_id = ? AND is_active = TRUE
    `, [req.user.id]);
    
    return membership ? 10 : 1; // 付费用户10次/小时，免费用户1次/小时
  },
  message: {
    success: false,
    message: 'Too many fortune requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 记录API使用情况
async function logApiUsage(userId, endpoint, success, tokens = 0, error = null) {
  try {
    await dbRun(`
      INSERT INTO api_usage (user_id, endpoint, method, tokens, success, error, created_at)
      VALUES (?, ?, 'POST', ?, ?, ?, datetime('now'))
    `, [userId, endpoint, tokens, success, error]);
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

// 检查用户是否有完整的生辰信息
function validateUserProfile(user) {
  if (!user.birth_year || !user.birth_month || !user.birth_day) {
    return {
      valid: false,
      message: 'Please complete your birth information in profile settings for accurate fortune analysis.'
    };
  }
  return { valid: true };
}

// 八字精算
router.post('/bazi', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    
    // 获取用户完整信息
    const user = await dbGet(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day, birth_hour, birth_place
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 验证用户资料完整性
    const profileValidation = validateUserProfile(user);
    if (!profileValidation.valid) {
      return res.status(400).json({
        success: false,
        message: profileValidation.message
      });
    }

    // 调用DeepSeek AI进行八字分析
    const analysis = await deepseekService.getBaziAnalysis(user, language);

    // 保存分析记录
    await dbRun(`
      INSERT INTO fortune_readings (user_id, reading_type, result, language, created_at)
      VALUES (?, 'bazi', ?, ?, datetime('now'))
    `, [user.id, analysis, language]);

    // 记录API使用
    await logApiUsage(user.id, '/fortune/bazi', true, 2000);

    res.json({
      success: true,
      message: 'BaZi analysis completed successfully',
      data: {
        type: 'bazi',
        analysis: analysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('BaZi analysis error:', error);
    
    // 记录API使用失败
    await logApiUsage(req.user?.id, '/fortune/bazi', false, 0, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate BaZi analysis. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 每日运势
router.post('/daily', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    console.log(`🌟 Daily Fortune Route - Language: ${language}`);
    
    const user = await dbGet(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day, birth_hour, birth_place
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profileValidation = validateUserProfile(user);
    if (!profileValidation.valid) {
      return res.status(400).json({
        success: false,
        message: profileValidation.message
      });
    }

    // 检查今日是否已经生成过该语言的运势（避免重复消耗）
    const today = new Date().toISOString().split('T')[0];
    const existingReading = await dbGet(`
      SELECT result FROM fortune_readings
      WHERE user_id = ? AND reading_type = 'daily'
      AND date(created_at) = date(?)
      AND (language = ? OR language IS NULL)
      ORDER BY created_at DESC LIMIT 1
    `, [user.id, today, language]);

    let analysis;
    if (existingReading) {
      // 返回今日已生成的运势
      analysis = existingReading.result;
    } else {
      // 生成新的每日运势
      console.log(`🔮 Calling getDailyFortune with language: ${language}`);
      analysis = await deepseekService.getDailyFortune(user, language);
      
      // 保存分析记录
      await dbRun(`
        INSERT INTO fortune_readings (user_id, reading_type, result, language, created_at)
        VALUES (?, 'daily', ?, ?, datetime('now'))
      `, [user.id, analysis, language]);

      // 记录API使用
      await logApiUsage(user.id, '/fortune/daily', true, 1500);
    }

    res.json({
      success: true,
      message: 'Daily fortune analysis completed successfully',
      data: {
        type: 'daily',
        analysis: analysis,
        date: today,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Daily fortune error:', error);
    await logApiUsage(req.user?.id, '/fortune/daily', false, 0, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily fortune. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 天体塔罗占卜
router.post('/tarot', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    const { question } = req.body; // 用户可以提出具体问题
    
    const user = await dbGet(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day, birth_hour, birth_place
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profileValidation = validateUserProfile(user);
    if (!profileValidation.valid) {
      return res.status(400).json({
        success: false,
        message: profileValidation.message
      });
    }

    // 生成塔罗占卜
    const analysis = await deepseekService.getCelestialTarotReading(user, question, language);

    // 保存分析记录
    await dbRun(`
      INSERT INTO fortune_readings (user_id, reading_type, question, result, language, created_at)
      VALUES (?, 'tarot', ?, ?, ?, datetime('now'))
    `, [user.id, question || '', analysis, language]);

    // 记录API使用
    await logApiUsage(user.id, '/fortune/tarot', true, 1800);

    res.json({
      success: true,
      message: 'Celestial tarot reading completed successfully',
      data: {
        type: 'tarot',
        question: question || 'General fortune reading',
        analysis: analysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Tarot reading error:', error);
    await logApiUsage(req.user?.id, '/fortune/tarot', false, 0, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate tarot reading. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 幸运物品和颜色
router.post('/lucky-items', authenticateToken, checkMembership, fortuneRateLimit, async (req, res) => {
  try {
    const language = getLanguageFromRequest(req);
    
    const user = await dbGet(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day, birth_hour, birth_place
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profileValidation = validateUserProfile(user);
    if (!profileValidation.valid) {
      return res.status(400).json({
        success: false,
        message: profileValidation.message
      });
    }

    // 检查本月是否已经生成过推荐（每月更新一次）
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const existingReading = await dbGet(`
      SELECT result FROM fortune_readings 
      WHERE user_id = ? AND reading_type = 'lucky_items' 
      AND strftime('%Y-%m', created_at) = ?
      ORDER BY created_at DESC LIMIT 1
    `, [user.id, currentMonth]);

    let analysis;
    if (existingReading) {
      // 返回本月已生成的推荐
      analysis = existingReading.result;
    } else {
      // 生成新的幸运物品推荐
      analysis = await deepseekService.getLuckyItemsAndColors(user, language);
      
      // 保存分析记录
      await dbRun(`
        INSERT INTO fortune_readings (user_id, reading_type, result, language, created_at)
        VALUES (?, 'lucky_items', ?, ?, datetime('now'))
      `, [user.id, analysis, language]);

      // 记录API使用
      await logApiUsage(user.id, '/fortune/lucky-items', true, 1600);
    }

    res.json({
      success: true,
      message: 'Lucky items and colors analysis completed successfully',
      data: {
        type: 'lucky_items',
        analysis: analysis,
        month: currentMonth,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Lucky items analysis error:', error);
    await logApiUsage(req.user?.id, '/fortune/lucky-items', false, 0, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate lucky items analysis. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取用户的算命历史记录
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { type, limit = 10, offset = 0 } = req.query;
    
    let query = `
      SELECT reading_type, question, result, created_at
      FROM fortune_readings 
      WHERE user_id = ?
    `;
    let params = [req.user.id];

    if (type) {
      query += ` AND reading_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const readings = await dbAll(query, params); // Use dbAll for multiple results

    res.json({
      success: true,
      data: readings.map(reading => ({
        type: reading.reading_type,
        question: reading.question,
        result: reading.result,
        createdAt: reading.created_at
      }))
    });

  } catch (error) {
    console.error('Get fortune history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fortune history'
    });
  }
});

module.exports = router;
