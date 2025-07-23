import { BaziData, ZiweiData, FortuneAnalysis, DailyFortune, BirthInfo } from '@/types';
import { calculateBazi, analyzeBaziStrength, calculateFavorableElements } from './bazi-calculator';
import { calculateZiwei } from './ziwei-calculator';
import { solarToLunar } from './lunar-calendar';
import { formatDate, getCurrentDate } from './utils';

/**
 * 综合分析运势
 */
export function analyzeComprehensiveFortune(
  birthInfo: BirthInfo,
  baziData?: BaziData,
  ziweiData?: ZiweiData
): FortuneAnalysis {
  // 如果没有提供八字数据，则计算
  if (!baziData) {
    baziData = calculateBazi(birthInfo);
  }
  
  // 如果没有提供紫微斗数数据，则计算
  if (!ziweiData) {
    ziweiData = calculateZiwei(birthInfo);
  }

  // 分析八字强弱
  const baziStrength = analyzeBaziStrength(baziData);
  const favorableElements = calculateFavorableElements(baziData);

  // 计算各项运势分数
  const careerAnalysis = analyzeCareerFortune(baziData, ziweiData, baziStrength);
  const wealthAnalysis = analyzeWealthFortune(baziData, ziweiData, favorableElements);
  const loveAnalysis = analyzeLoveFortune(baziData, ziweiData, birthInfo.gender);
  const healthAnalysis = analyzeHealthFortune(baziData, ziweiData, baziStrength);

  // 计算综合分数
  const overallScore = Math.round(
    (careerAnalysis.score + wealthAnalysis.score + loveAnalysis.score + healthAnalysis.score) / 4
  );

  return {
    overallScore,
    career: careerAnalysis,
    wealth: wealthAnalysis,
    love: loveAnalysis,
    health: healthAnalysis
  };
}

/**
 * 分析事业运势
 */
function analyzeCareerFortune(
  baziData: BaziData,
  ziweiData: ZiweiData,
  baziStrength: { strength: string; score: number; analysis: string }
): {
  score: number;
  analysis: string;
  advice: string;
  luckyElements: string[];
} {
  let score = 50; // 基础分数
  let analysis = '';
  let advice = '';
  const luckyElements: string[] = [];

  // 基于八字分析事业运
  const { tenGods } = baziData;
  
  // 正官、七杀主事业
  if (tenGods.favorable.includes('正官')) {
    score += 15;
    analysis += '命中有正官，利于从事管理、公务员等职业。';
    advice += '适合在大企业或政府部门发展，注重规则和秩序。';
  }
  
  if (tenGods.unfavorable.includes('七杀')) {
    score += 10;
    analysis += '命中有七杀，适合竞争激烈的行业。';
    advice += '可从事销售、军警、体育等需要竞争力的职业。';
  }

  // 食神、伤官主才华
  if (tenGods.favorable.includes('食神')) {
    score += 12;
    analysis += '命中有食神，有艺术天赋和创造力。';
    advice += '适合从事创意、艺术、教育等行业。';
  }

  // 基于紫微斗数分析
  const careerPalace = ziweiData.palaces['官禄宫'];
  if (careerPalace) {
    if (careerPalace.stars.includes('紫微')) {
      score += 20;
      analysis += '官禄宫有紫微星，天生领导才能。';
      advice += '适合担任领导职务，发挥管理才能。';
    }
    
    if (careerPalace.stars.includes('武曲')) {
      score += 15;
      analysis += '官禄宫有武曲星，适合财经、金融行业。';
      advice += '可从事银行、投资、会计等财务相关工作。';
    }
    
    if (careerPalace.stars.includes('天机')) {
      score += 12;
      analysis += '官禄宫有天机星，智慧聪明，适合技术工作。';
      advice += '可从事IT、研发、咨询等智力密集型工作。';
    }
  }

  // 根据八字强弱调整
  if (baziStrength.strength === 'strong') {
    score += 5;
    luckyElements.push('金', '水'); // 克泄耗的五行
  } else if (baziStrength.strength === 'weak') {
    score -= 5;
    luckyElements.push('木', '火'); // 生扶的五行
  }

  // 确保分数在合理范围内
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    analysis: analysis || '事业运势平稳，需要持续努力。',
    advice: advice || '保持积极态度，抓住机遇，稳步发展。',
    luckyElements
  };
}

/**
 * 分析财运
 */
function analyzeWealthFortune(
  baziData: BaziData,
  ziweiData: ZiweiData,
  favorableElements: { favorable: string[]; unfavorable: string[]; analysis: string }
): {
  score: number;
  analysis: string;
  advice: string;
  luckyNumbers: number[];
} {
  let score = 50;
  let analysis = '';
  let advice = '';
  const luckyNumbers: number[] = [];

  // 基于八字分析财运
  const { tenGods } = baziData;
  
  if (tenGods.favorable.includes('正财')) {
    score += 18;
    analysis += '命中有正财，财运稳定，适合正当经营。';
    advice += '通过正当途径积累财富，避免投机取巧。';
    luckyNumbers.push(1, 6);
  }
  
  if (tenGods.favorable.includes('偏财')) {
    score += 15;
    analysis += '命中有偏财，有意外之财，适合投资。';
    advice += '可适当进行投资理财，但要控制风险。';
    luckyNumbers.push(2, 7);
  }

  // 基于紫微斗数分析
  const wealthPalace = ziweiData.palaces['财帛宫'];
  if (wealthPalace) {
    if (wealthPalace.stars.includes('武曲')) {
      score += 20;
      analysis += '财帛宫有武曲星，财运亨通。';
      advice += '适合从事金融、投资相关工作。';
      luckyNumbers.push(4, 9);
    }
    
    if (wealthPalace.stars.includes('天府')) {
      score += 15;
      analysis += '财帛宫有天府星，财库丰厚。';
      advice += '善于理财，能够积累财富。';
      luckyNumbers.push(5, 10);
    }
    
    if (wealthPalace.stars.includes('贪狼')) {
      score += 12;
      analysis += '财帛宫有贪狼星，财运多变。';
      advice += '财运起伏较大，需要谨慎理财。';
      luckyNumbers.push(3, 8);
    }
  }

  // 根据喜用神调整
  if (favorableElements.favorable.includes('金')) {
    score += 8;
    luckyNumbers.push(4, 9);
  }
  if (favorableElements.favorable.includes('水')) {
    score += 6;
    luckyNumbers.push(1, 6);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    analysis: analysis || '财运平稳，需要合理规划。',
    advice: advice || '开源节流，理性投资，稳健理财。',
    luckyNumbers: [...new Set(luckyNumbers)].slice(0, 5)
  };
}

/**
 * 分析感情运势
 */
function analyzeLoveFortune(
  baziData: BaziData,
  ziweiData: ZiweiData,
  gender: 'male' | 'female'
): {
  score: number;
  analysis: string;
  advice: string;
  compatibility: string[];
} {
  let score = 50;
  let analysis = '';
  let advice = '';
  const compatibility: string[] = [];

  // 基于八字分析感情运
  const { spirits } = baziData;
  
  if (spirits.includes('桃花')) {
    score += 15;
    analysis += '命中有桃花星，异性缘佳。';
    advice += '感情机会较多，要慎重选择。';
  }
  
  if (spirits.includes('红鸾')) {
    score += 12;
    analysis += '命中有红鸾星，利于婚姻。';
    advice += '适合结婚的年份，感情稳定。';
  }

  // 基于紫微斗数分析
  const marriagePalace = ziweiData.palaces['夫妻宫'];
  if (marriagePalace) {
    if (marriagePalace.stars.includes('紫微')) {
      score += 18;
      analysis += '夫妻宫有紫微星，配偶条件优秀。';
      advice += '另一半可能是有地位或能力的人。';
      compatibility.push('天府', '天相');
    }
    
    if (marriagePalace.stars.includes('天同')) {
      score += 15;
      analysis += '夫妻宫有天同星，感情和谐。';
      advice += '夫妻关系融洽，家庭幸福。';
      compatibility.push('太阴', '天梁');
    }
    
    if (marriagePalace.stars.includes('廉贞')) {
      score -= 5;
      analysis += '夫妻宫有廉贞星，感情多波折。';
      advice += '需要更多沟通和理解，避免冲突。';
    }
  }

  // 根据性别调整
  if (gender === 'female') {
    // 女性看官杀星
    if (baziData.tenGods.favorable.includes('正官')) {
      score += 10;
      compatibility.push('正官型');
    }
  } else {
    // 男性看财星
    if (baziData.tenGods.favorable.includes('正财')) {
      score += 10;
      compatibility.push('正财型');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    analysis: analysis || '感情运势平稳，需要主动经营。',
    advice: advice || '真诚待人，用心经营感情关系。',
    compatibility: compatibility.slice(0, 3)
  };
}

/**
 * 分析健康运势
 */
function analyzeHealthFortune(
  baziData: BaziData,
  ziweiData: ZiweiData,
  baziStrength: { strength: string; score: number; analysis: string }
): {
  score: number;
  analysis: string;
  advice: string;
  cautions: string[];
} {
  let score = 70; // 健康基础分数较高
  let analysis = '';
  let advice = '';
  const cautions: string[] = [];

  // 基于八字五行平衡分析健康
  const { elements } = baziData;
  const totalElements = Object.values(elements).reduce((sum, count) => sum + count, 0);
  
  // 检查五行缺失
  Object.entries(elements).forEach(([element, count]) => {
    if (count === 0) {
      score -= 10;
      const elementMap: Record<string, { organ: string; advice: string }> = {
        wood: { organ: '肝胆', advice: '注意肝胆保养，多吃绿色蔬菜' },
        fire: { organ: '心脏', advice: '注意心血管健康，适度运动' },
        earth: { organ: '脾胃', advice: '注意脾胃调理，规律饮食' },
        metal: { organ: '肺部', advice: '注意呼吸系统，避免吸烟' },
        water: { organ: '肾脏', advice: '注意肾脏保养，多喝水' }
      };
      
      const info = elementMap[element];
      if (info) {
        analysis += `五行缺${element}，需注意${info.organ}健康。`;
        advice += info.advice + '。';
        cautions.push(info.organ);
      }
    }
  });

  // 基于八字强弱
  if (baziStrength.strength === 'weak') {
    score -= 15;
    analysis += '八字偏弱，体质较弱。';
    advice += '注意休息，加强营养，适度锻炼。';
    cautions.push('体质虚弱');
  } else if (baziStrength.strength === 'strong') {
    score += 5;
    analysis += '八字偏强，体质较好。';
    advice += '身体强健，但要注意不要过度劳累。';
  }

  // 基于紫微斗数分析
  const healthPalace = ziweiData.palaces['疾厄宫'];
  if (healthPalace) {
    if (healthPalace.stars.includes('天同')) {
      score += 10;
      analysis += '疾厄宫有天同星，身体健康。';
    }
    
    if (healthPalace.stars.includes('巨门')) {
      score -= 8;
      analysis += '疾厄宫有巨门星，注意口腔、消化系统。';
      cautions.push('消化系统');
    }
    
    if (healthPalace.stars.includes('火星') || healthPalace.stars.includes('铃星')) {
      score -= 10;
      analysis += '疾厄宫有火星或铃星，注意外伤、炎症。';
      cautions.push('外伤风险');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    analysis: analysis || '健康状况良好，注意保养。',
    advice: advice || '保持良好的生活习惯，定期体检。',
    cautions: [...new Set(cautions)].slice(0, 3)
  };
}

/**
 * 计算每日运势
 */
export function calculateDailyFortune(
  birthInfo: BirthInfo,
  date: Date = getCurrentDate()
): DailyFortune {
  const baziData = calculateBazi(birthInfo);
  const lunarDate = solarToLunar(date);
  
  // 基于日干支计算当日运势
  const dayGanZhi = lunarDate.dayGanZhi;
  const dayMaster = baziData.day.heavenlyStem;
  
  // 计算当日五行力量
  const dayElement = baziData.day.element;
  let overallLuck = 50;
  
  // 根据日干支与命主的关系调整运势
  if (dayGanZhi[0] === dayMaster) {
    overallLuck += 20; // 比肩日
  }
  
  // 计算幸运元素
  const luckyColor = getLuckyColor(dayElement);
  const luckyDirection = getLuckyDirection(dayElement);
  const luckyNumbers = getLuckyNumbers(dayElement);
  
  // 生成适宜和忌讳事项
  const suitable = getSuitableActivities(dayElement, overallLuck);
  const avoid = getAvoidActivities(dayElement, overallLuck);
  
  // 生成时辰运势
  const hourlyFortune = generateHourlyFortune(dayGanZhi, dayMaster);

  return {
    date: formatDate(date, 'YYYY-MM-DD'),
    overallLuck,
    luckyColor,
    luckyDirection,
    luckyNumbers,
    suitable,
    avoid,
    hourlyFortune
  };
}

// 辅助函数
function getLuckyColor(element: string): string {
  const colorMap: Record<string, string> = {
    '木': 'green', '火': 'red', '土': 'yellow', '金': 'white', '水': 'black'
  };
  return colorMap[element] || 'blue';
}

function getLuckyDirection(element: string): string {
  const directionMap: Record<string, string> = {
    '木': 'east', '火': 'south', '土': 'center', '金': 'west', '水': 'north'
  };
  return directionMap[element] || 'east';
}

function getLuckyNumbers(element: string): number[] {
  const numberMap: Record<string, number[]> = {
    '木': [3, 8], '火': [2, 7], '土': [5, 10], '金': [4, 9], '水': [1, 6]
  };
  return numberMap[element] || [1, 6];
}

function getSuitableActivities(element: string, luck: number): string[] {
  const activities = ['工作', '学习', '投资', '出行', '社交'];
  return activities.slice(0, Math.floor(luck / 20) + 1);
}

function getAvoidActivities(element: string, luck: number): string[] {
  const activities = ['争吵', '冒险', '大额消费', '重要决策'];
  return activities.slice(0, Math.floor((100 - luck) / 25) + 1);
}

function generateHourlyFortune(dayGanZhi: string, dayMaster: string): Array<{
  hour: string;
  luck: number;
  advice: string;
}> {
  const hours = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'];
  
  return hours.map((hour, index) => ({
    hour,
    luck: 40 + Math.random() * 40, // 简化的随机运势
    advice: `${hour}适宜休息调养`
  }));
}
