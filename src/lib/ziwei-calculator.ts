import { solarToLunar } from './lunar-calendar';
import { ZiweiData, BirthInfo } from '@/types';
import { ZIWEI_MAIN_STARS, TWELVE_PALACES } from './constants';

// 紫微斗数主星
const MAIN_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'
];

// 辅星
const AUXILIARY_STARS = [
  '左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马',
  '擎羊', '陀罗', '火星', '铃星', '天空', '地劫', '台辅', '封诰'
];

// 四化星
const FOUR_TRANSFORMS = ['化禄', '化权', '化科', '化忌'];

// 十二宫位
const PALACES = [
  '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
  '迁移宫', '奴仆宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
];

// 地支对应的宫位序号
const BRANCH_TO_PALACE: Record<string, number> = {
  '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
  '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11
};

// 紫微星安星表
const ZIWEI_POSITIONS: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
  11: 10, 12: 11, 13: 0, 14: 1, 15: 2, 16: 3, 17: 4
};

// 天府星安星表
const TIANFU_POSITIONS: Record<number, number> = {
  1: 4, 2: 3, 3: 2, 4: 1, 5: 0, 6: 11, 7: 10, 8: 9, 9: 8,
  10: 7, 11: 6, 0: 5
};

// 主星亮度表
const STAR_BRIGHTNESS: Record<string, Record<number, string>> = {
  '紫微': { 0: '旺', 1: '利', 2: '得', 3: '平', 4: '不', 5: '陷', 6: '旺', 7: '利', 8: '得', 9: '平', 10: '不', 11: '陷' },
  '天机': { 0: '利', 1: '旺', 2: '不', 3: '陷', 4: '平', 5: '得', 6: '利', 7: '旺', 8: '不', 9: '陷', 10: '平', 11: '得' },
  '太阳': { 0: '陷', 1: '不', 2: '平', 3: '得', 4: '利', 5: '旺', 6: '旺', 7: '利', 8: '得', 9: '平', 10: '不', 11: '陷' },
  '武曲': { 0: '得', 1: '平', 2: '不', 3: '陷', 4: '旺', 5: '利', 6: '得', 7: '平', 8: '不', 9: '陷', 10: '旺', 11: '利' },
  '天同': { 0: '利', 1: '旺', 2: '陷', 3: '不', 4: '平', 5: '得', 6: '利', 7: '旺', 8: '陷', 9: '不', 10: '平', 11: '得' },
  '廉贞': { 0: '平', 1: '得', 2: '利', 3: '旺', 4: '陷', 5: '不', 6: '平', 7: '得', 8: '利', 9: '旺', 10: '陷', 11: '不' }
};

/**
 * 计算紫微斗数命盘
 */
export function calculateZiwei(birthInfo: BirthInfo): ZiweiData {
  const { birthDate } = birthInfo;
  const lunarDate = solarToLunar(birthDate);
  
  // 计算命宫位置
  const lifePalacePosition = calculateLifePalace(lunarDate.month, lunarDate.day, birthDate.getHours());
  
  // 安排主星
  const mainStars = arrangeMainStars(lunarDate.day, lifePalacePosition);
  
  // 安排辅星
  const auxiliaryStars = arrangeAuxiliaryStars(lunarDate.year, lunarDate.month, lunarDate.day, birthDate.getHours());
  
  // 计算四化
  const fourTransforms = calculateFourTransforms(lunarDate.yearGanZhi[0]);
  
  // 构建十二宫位
  const palaces = buildPalaces(lifePalacePosition, mainStars, auxiliaryStars, fourTransforms);
  
  // 计算大限
  const majorPeriods = calculateMajorPeriods(lifePalacePosition, birthInfo.gender === 'male');

  return {
    lifePlace: {
      palace: PALACES[lifePalacePosition],
      mainStars: palaces[PALACES[lifePalacePosition]]?.stars.filter(star => MAIN_STARS.includes(star)) || [],
      auxiliaryStars: palaces[PALACES[lifePalacePosition]]?.stars.filter(star => AUXILIARY_STARS.includes(star)) || [],
      fourTransforms: palaces[PALACES[lifePalacePosition]]?.stars.filter(star => FOUR_TRANSFORMS.includes(star)) || []
    },
    palaces,
    majorPeriods
  };
}

/**
 * 计算命宫位置
 */
function calculateLifePalace(month: number, day: number, hour: number): number {
  // 根据出生月份确定寅宫位置
  const yinPosition = (month + 1) % 12;
  
  // 根据出生日期确定命宫
  const dayPosition = (yinPosition + day - 1) % 12;
  
  // 根据出生时辰调整
  const hourBranch = Math.floor((hour + 1) / 2) % 12;
  const lifePalace = (dayPosition - hourBranch + 12) % 12;
  
  return lifePalace;
}

/**
 * 安排主星
 */
function arrangeMainStars(day: number, lifePalacePosition: number): Record<string, number[]> {
  const stars: Record<string, number[]> = {};
  
  // 计算紫微星位置
  const ziweiPosition = ZIWEI_POSITIONS[day] || 0;
  const adjustedZiweiPosition = (ziweiPosition + lifePalacePosition) % 12;
  
  if (!stars[PALACES[adjustedZiweiPosition]]) {
    stars[PALACES[adjustedZiweiPosition]] = [];
  }
  stars[PALACES[adjustedZiweiPosition]].push(0); // 紫微星索引
  
  // 计算天府星位置
  const tianfuPosition = TIANFU_POSITIONS[adjustedZiweiPosition];
  if (!stars[PALACES[tianfuPosition]]) {
    stars[PALACES[tianfuPosition]] = [];
  }
  stars[PALACES[tianfuPosition]].push(6); // 天府星索引
  
  // 安排其他主星（简化版本）
  const starPositions = [
    { star: 1, offset: 1 },  // 天机
    { star: 2, offset: 5 },  // 太阳
    { star: 3, offset: 3 },  // 武曲
    { star: 4, offset: 4 },  // 天同
    { star: 5, offset: 8 },  // 廉贞
    { star: 7, offset: 7 },  // 太阴
    { star: 8, offset: 2 },  // 贪狼
    { star: 9, offset: 9 },  // 巨门
    { star: 10, offset: 6 }, // 天相
    { star: 11, offset: 10 }, // 天梁
    { star: 12, offset: 11 }, // 七杀
    { star: 13, offset: 1 }   // 破军
  ];
  
  starPositions.forEach(({ star, offset }) => {
    const position = (adjustedZiweiPosition + offset) % 12;
    const palace = PALACES[position];
    if (!stars[palace]) {
      stars[palace] = [];
    }
    stars[palace].push(star);
  });
  
  return stars;
}

/**
 * 安排辅星
 */
function arrangeAuxiliaryStars(year: number, month: number, day: number, hour: number): Record<string, number[]> {
  const stars: Record<string, number[]> = {};
  
  // 左辅右弼
  const leftAuxPosition = (month - 1) % 12;
  const rightAuxPosition = (12 - month + 1) % 12;
  
  if (!stars[PALACES[leftAuxPosition]]) stars[PALACES[leftAuxPosition]] = [];
  if (!stars[PALACES[rightAuxPosition]]) stars[PALACES[rightAuxPosition]] = [];
  
  stars[PALACES[leftAuxPosition]].push(0); // 左辅
  stars[PALACES[rightAuxPosition]].push(1); // 右弼
  
  // 文昌文曲
  const wenchangPosition = (hour + 9) % 12;
  const wenquPosition = (hour + 3) % 12;
  
  if (!stars[PALACES[wenchangPosition]]) stars[PALACES[wenchangPosition]] = [];
  if (!stars[PALACES[wenquPosition]]) stars[PALACES[wenquPosition]] = [];
  
  stars[PALACES[wenchangPosition]].push(2); // 文昌
  stars[PALACES[wenquPosition]].push(3); // 文曲
  
  return stars;
}

/**
 * 计算四化星
 */
function calculateFourTransforms(yearStem: string): Record<string, string[]> {
  const transforms: Record<string, string[]> = {
    '化禄': [], '化权': [], '化科': [], '化忌': []
  };
  
  // 根据年干确定四化星（简化版本）
  const transformMap: Record<string, Record<string, string>> = {
    '甲': { '廉贞': '化禄', '破军': '化权', '武曲': '化科', '太阳': '化忌' },
    '乙': { '天机': '化禄', '天梁': '化权', '紫微': '化科', '太阴': '化忌' },
    '丙': { '天同': '化禄', '天机': '化权', '文昌': '化科', '廉贞': '化忌' },
    '丁': { '太阴': '化禄', '天同': '化权', '天机': '化科', '巨门': '化忌' },
    '戊': { '贪狼': '化禄', '太阴': '化权', '右弼': '化科', '天机': '化忌' },
    '己': { '武曲': '化禄', '贪狼': '化权', '天梁': '化科', '文曲': '化忌' },
    '庚': { '太阳': '化禄', '武曲': '化权', '太阴': '化科', '天同': '化忌' },
    '辛': { '巨门': '化禄', '太阳': '化权', '文曲': '化科', '文昌': '化忌' },
    '壬': { '天梁': '化禄', '紫微': '化权', '左辅': '化科', '武曲': '化忌' },
    '癸': { '破军': '化禄', '巨门': '化权', '太阴': '化科', '贪狼': '化忌' }
  };
  
  const yearTransforms = transformMap[yearStem] || {};
  
  Object.entries(yearTransforms).forEach(([star, transform]) => {
    if (transforms[transform]) {
      transforms[transform].push(star);
    }
  });
  
  return transforms;
}

/**
 * 构建十二宫位
 */
function buildPalaces(
  lifePalacePosition: number,
  mainStars: Record<string, number[]>,
  auxiliaryStars: Record<string, number[]>,
  fourTransforms: Record<string, string[]>
): Record<string, { stars: string[]; brightness: string; analysis: string }> {
  const palaces: Record<string, { stars: string[]; brightness: string; analysis: string }> = {};
  
  PALACES.forEach((palace, index) => {
    const stars: string[] = [];
    
    // 添加主星
    if (mainStars[palace]) {
      mainStars[palace].forEach(starIndex => {
        stars.push(MAIN_STARS[starIndex]);
      });
    }
    
    // 添加辅星
    if (auxiliaryStars[palace]) {
      auxiliaryStars[palace].forEach(starIndex => {
        stars.push(AUXILIARY_STARS[starIndex]);
      });
    }
    
    // 添加四化星
    Object.entries(fourTransforms).forEach(([transform, transformStars]) => {
      transformStars.forEach(star => {
        if (stars.includes(star)) {
          stars.push(transform);
        }
      });
    });
    
    // 计算星曜亮度
    const brightness = calculateStarBrightness(stars, index);
    
    // 生成宫位分析
    const analysis = generatePalaceAnalysis(palace, stars);
    
    palaces[palace] = {
      stars,
      brightness,
      analysis
    };
  });
  
  return palaces;
}

/**
 * 计算星曜亮度
 */
function calculateStarBrightness(stars: string[], position: number): string {
  if (stars.length === 0) return '平';
  
  const mainStar = stars.find(star => MAIN_STARS.includes(star));
  if (!mainStar) return '平';
  
  const brightness = STAR_BRIGHTNESS[mainStar];
  return brightness ? brightness[position] || '平' : '平';
}

/**
 * 生成宫位分析
 */
function generatePalaceAnalysis(palace: string, stars: string[]): string {
  if (stars.length === 0) {
    return `${palace}无主星，需借对宫星曜来看`;
  }
  
  const mainStars = stars.filter(star => MAIN_STARS.includes(star));
  const auxiliaryStars = stars.filter(star => AUXILIARY_STARS.includes(star));
  const transforms = stars.filter(star => FOUR_TRANSFORMS.includes(star));
  
  let analysis = `${palace}有`;
  
  if (mainStars.length > 0) {
    analysis += `主星${mainStars.join('、')}`;
  }
  
  if (auxiliaryStars.length > 0) {
    analysis += `，辅星${auxiliaryStars.join('、')}`;
  }
  
  if (transforms.length > 0) {
    analysis += `，四化${transforms.join('、')}`;
  }
  
  return analysis;
}

/**
 * 计算大限
 */
function calculateMajorPeriods(lifePalacePosition: number, isMale: boolean): Array<{
  age: number;
  palace: string;
  stars: string[];
  fortune: string;
}> {
  const periods: Array<{
    age: number;
    palace: string;
    stars: string[];
    fortune: string;
  }> = [];
  
  // 大限起始宫位
  let startPalace = isMale ? lifePalacePosition : (lifePalacePosition + 11) % 12;
  const direction = isMale ? 1 : -1;
  
  for (let i = 0; i < 12; i++) {
    const age = 4 + i * 10; // 4-13, 14-23, 24-33, ...
    const palaceIndex = (startPalace + i * direction + 12) % 12;
    const palace = PALACES[palaceIndex];
    
    periods.push({
      age,
      palace,
      stars: [], // 这里应该根据实际星曜分布填充
      fortune: '平' // 简化的运势评估
    });
  }
  
  return periods;
}
