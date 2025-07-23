import { solarToLunar, LunarDate } from './lunar-calendar';
import { BaziData, BirthInfo } from '@/types';
import { 
  HEAVENLY_STEMS, 
  EARTHLY_BRANCHES, 
  STEM_ELEMENTS, 
  BRANCH_ELEMENTS,
  TEN_GODS 
} from './constants';

// 十神关系表
const TEN_GODS_RELATIONS: Record<string, Record<string, string>> = {
  '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
  '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
  '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' },
  '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀' },
  '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
  '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
  '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
  '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
  '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
  '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' }
};

// 神煞表
const SPIRITS_MAP: Record<string, string[]> = {
  '甲': ['华盖', '文昌'],
  '乙': ['桃花', '红鸾'],
  '丙': ['天德', '月德'],
  '丁': ['天乙贵人', '太极贵人'],
  '戊': ['国印', '学堂'],
  '己': ['驿马', '咸池'],
  '庚': ['羊刃', '飞刃'],
  '辛': ['天医', '福星'],
  '壬': ['亡神', '劫煞'],
  '癸': ['孤辰', '寡宿']
};

// 纳音五行表
const NAYIN_MAP: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
  '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
};

/**
 * 计算八字
 */
export function calculateBazi(birthInfo: BirthInfo): BaziData {
  const { birthDate } = birthInfo;
  const lunarDate = solarToLunar(birthDate);
  
  // 提取四柱干支
  const yearStem = lunarDate.yearGanZhi[0];
  const yearBranch = lunarDate.yearGanZhi[1];
  const monthStem = lunarDate.monthGanZhi[0];
  const monthBranch = lunarDate.monthGanZhi[1];
  const dayStem = lunarDate.dayGanZhi[0];
  const dayBranch = lunarDate.dayGanZhi[1];
  const hourStem = lunarDate.hourGanZhi[0];
  const hourBranch = lunarDate.hourGanZhi[1];

  // 计算五行数量
  const elements = calculateElements([
    yearStem, yearBranch, monthStem, monthBranch,
    dayStem, dayBranch, hourStem, hourBranch
  ]);

  // 计算十神
  const tenGods = calculateTenGods(dayStem, [yearStem, monthStem, hourStem]);

  // 计算神煞
  const spirits = calculateSpirits(lunarDate);

  return {
    year: {
      heavenlyStem: yearStem,
      earthlyBranch: yearBranch,
      element: STEM_ELEMENTS[yearStem]
    },
    month: {
      heavenlyStem: monthStem,
      earthlyBranch: monthBranch,
      element: STEM_ELEMENTS[monthStem]
    },
    day: {
      heavenlyStem: dayStem,
      earthlyBranch: dayBranch,
      element: STEM_ELEMENTS[dayStem]
    },
    hour: {
      heavenlyStem: hourStem,
      earthlyBranch: hourBranch,
      element: STEM_ELEMENTS[hourStem]
    },
    elements,
    tenGods,
    spirits
  };
}

/**
 * 计算五行数量
 */
function calculateElements(ganZhi: string[]): Record<string, number> {
  const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  
  ganZhi.forEach(char => {
    const element = STEM_ELEMENTS[char] || BRANCH_ELEMENTS[char];
    if (element) {
      switch (element) {
        case '木': elements.wood++; break;
        case '火': elements.fire++; break;
        case '土': elements.earth++; break;
        case '金': elements.metal++; break;
        case '水': elements.water++; break;
      }
    }
  });

  return elements;
}

/**
 * 计算十神关系
 */
function calculateTenGods(dayMaster: string, otherStems: string[]): {
  dayMaster: string;
  favorable: string[];
  unfavorable: string[];
} {
  const dayMasterElement = STEM_ELEMENTS[dayMaster];
  const favorable: string[] = [];
  const unfavorable: string[] = [];

  otherStems.forEach(stem => {
    const relation = TEN_GODS_RELATIONS[dayMaster]?.[stem];
    if (relation) {
      // 简化的吉凶判断
      if (['正官', '正财', '正印', '食神'].includes(relation)) {
        favorable.push(relation);
      } else if (['七杀', '劫财', '伤官'].includes(relation)) {
        unfavorable.push(relation);
      }
    }
  });

  return {
    dayMaster: dayMasterElement,
    favorable,
    unfavorable
  };
}

/**
 * 计算神煞
 */
function calculateSpirits(lunarDate: LunarDate): string[] {
  const spirits: string[] = [];
  
  // 基于日干计算神煞
  const dayStem = lunarDate.dayGanZhi[0];
  const daySpirits = SPIRITS_MAP[dayStem] || [];
  spirits.push(...daySpirits);

  // 基于年支计算生肖相关神煞
  const yearBranch = lunarDate.yearGanZhi[1];
  const dayBranch = lunarDate.dayGanZhi[1];
  
  // 桃花星
  const peachBlossoms = ['子', '卯', '午', '酉'];
  if (peachBlossoms.includes(dayBranch)) {
    spirits.push('桃花');
  }

  // 华盖星
  const huaGai = ['辰', '戌', '丑', '未'];
  if (huaGai.includes(dayBranch)) {
    spirits.push('华盖');
  }

  return [...new Set(spirits)]; // 去重
}

/**
 * 分析八字强弱
 */
export function analyzeBaziStrength(baziData: BaziData): {
  strength: 'strong' | 'weak' | 'balanced';
  score: number;
  analysis: string;
} {
  const { elements, tenGods } = baziData;
  const dayMasterElement = baziData.day.element;
  
  // 计算日主五行力量
  let dayMasterPower = 0;
  
  // 同类五行加分
  switch (dayMasterElement) {
    case '木': dayMasterPower += elements.wood * 2; break;
    case '火': dayMasterPower += elements.fire * 2; break;
    case '土': dayMasterPower += elements.earth * 2; break;
    case '金': dayMasterPower += elements.metal * 2; break;
    case '水': dayMasterPower += elements.water * 2; break;
  }

  // 生助五行加分
  const supportElements = getSupportElements(dayMasterElement);
  supportElements.forEach(element => {
    switch (element) {
      case '木': dayMasterPower += elements.wood; break;
      case '火': dayMasterPower += elements.fire; break;
      case '土': dayMasterPower += elements.earth; break;
      case '金': dayMasterPower += elements.metal; break;
      case '水': dayMasterPower += elements.water; break;
    }
  });

  // 克制五行减分
  const restraintElements = getRestraintElements(dayMasterElement);
  restraintElements.forEach(element => {
    switch (element) {
      case '木': dayMasterPower -= elements.wood; break;
      case '火': dayMasterPower -= elements.fire; break;
      case '土': dayMasterPower -= elements.earth; break;
      case '金': dayMasterPower -= elements.metal; break;
      case '水': dayMasterPower -= elements.water; break;
    }
  });

  // 计算强弱
  const totalElements = Object.values(elements).reduce((sum, count) => sum + count, 0);
  const score = Math.round((dayMasterPower / totalElements) * 100);
  
  let strength: 'strong' | 'weak' | 'balanced';
  let analysis: string;

  if (score > 60) {
    strength = 'strong';
    analysis = '日主偏强，宜泄耗，忌生扶';
  } else if (score < 40) {
    strength = 'weak';
    analysis = '日主偏弱，宜生扶，忌克泄';
  } else {
    strength = 'balanced';
    analysis = '日主中和，五行平衡';
  }

  return { strength, score, analysis };
}

/**
 * 获取生助五行
 */
function getSupportElements(element: string): string[] {
  const supportMap: Record<string, string[]> = {
    '木': ['水'],
    '火': ['木'],
    '土': ['火'],
    '金': ['土'],
    '水': ['金']
  };
  return supportMap[element] || [];
}

/**
 * 获取克制五行
 */
function getRestraintElements(element: string): string[] {
  const restraintMap: Record<string, string[]> = {
    '木': ['金'],
    '火': ['水'],
    '土': ['木'],
    '金': ['火'],
    '水': ['土']
  };
  return restraintMap[element] || [];
}

/**
 * 计算喜用神
 */
export function calculateFavorableElements(baziData: BaziData): {
  favorable: string[];
  unfavorable: string[];
  analysis: string;
} {
  const strength = analyzeBaziStrength(baziData);
  const dayMasterElement = baziData.day.element;
  
  let favorable: string[] = [];
  let unfavorable: string[] = [];
  let analysis: string = '';

  if (strength.strength === 'strong') {
    // 日主强，需要克泄耗
    favorable = getRestraintElements(dayMasterElement);
    unfavorable = getSupportElements(dayMasterElement);
    unfavorable.push(dayMasterElement);
    analysis = '日主偏强，喜克泄耗，忌生扶比劫';
  } else if (strength.strength === 'weak') {
    // 日主弱，需要生扶
    favorable = getSupportElements(dayMasterElement);
    favorable.push(dayMasterElement);
    unfavorable = getRestraintElements(dayMasterElement);
    analysis = '日主偏弱，喜生扶比劫，忌克泄耗';
  } else {
    // 日主中和，根据具体情况调节
    analysis = '日主中和，需要根据大运流年具体分析';
  }

  return {
    favorable: [...new Set(favorable)],
    unfavorable: [...new Set(unfavorable)],
    analysis
  };
}
