import dayjs from 'dayjs';

// 农历数据表 (1900-2100年)
// 每个数字代表一年的农历信息，包含闰月和每月天数
const LUNAR_DATA = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
];

// 天干
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const HEAVENLY_STEMS_EN = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];

// 地支
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const EARTHLY_BRANCHES_EN = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];

// 生肖
const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const ZODIAC_ANIMALS_EN = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

// 农历月份名称
const LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_MONTHS_EN = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

// 农历日期名称
const LUNAR_DAYS = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  zodiac: string;
  yearGanZhiEn: string;
  monthGanZhiEn: string;
  dayGanZhiEn: string;
  hourGanZhiEn: string;
  zodiacEn: string;
  lunarMonthName: string;
  lunarDayName: string;
  lunarMonthNameEn: string;
  solarTerm?: string;
}

export interface SolarDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * 获取农历年的天数
 */
function getLunarYearDays(year: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_DATA[year - 1900] & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

/**
 * 获取农历年闰月的天数
 */
function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return (LUNAR_DATA[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

/**
 * 获取农历年的闰月月份
 */
function getLeapMonth(year: number): number {
  return LUNAR_DATA[year - 1900] & 0xf;
}

/**
 * 获取农历月的天数
 */
function getLunarMonthDays(year: number, month: number): number {
  return (LUNAR_DATA[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

/**
 * 计算干支
 */
function getGanZhi(num: number): { gan: string; zhi: string; ganEn: string; zhiEn: string } {
  const ganIndex = (num - 1) % 10;
  const zhiIndex = (num - 1) % 12;
  
  return {
    gan: HEAVENLY_STEMS[ganIndex],
    zhi: EARTHLY_BRANCHES[zhiIndex],
    ganEn: HEAVENLY_STEMS_EN[ganIndex],
    zhiEn: EARTHLY_BRANCHES_EN[zhiIndex]
  };
}

/**
 * 计算年干支
 */
function getYearGanZhi(year: number): { ganZhi: string; ganZhiEn: string } {
  const yearGZ = getGanZhi(year - 3);
  return {
    ganZhi: yearGZ.gan + yearGZ.zhi,
    ganZhiEn: yearGZ.ganEn + yearGZ.zhiEn
  };
}

/**
 * 计算月干支
 */
function getMonthGanZhi(year: number, month: number): { ganZhi: string; ganZhiEn: string } {
  const yearGan = (year - 4) % 10;
  const monthGan = (yearGan * 2 + month) % 10;
  const monthZhi = (month + 1) % 12;
  
  return {
    ganZhi: HEAVENLY_STEMS[monthGan] + EARTHLY_BRANCHES[monthZhi],
    ganZhiEn: HEAVENLY_STEMS_EN[monthGan] + EARTHLY_BRANCHES_EN[monthZhi]
  };
}

/**
 * 计算日干支
 */
function getDayGanZhi(date: Date): { ganZhi: string; ganZhiEn: string } {
  const baseDate = new Date(1900, 0, 31); // 1900年1月31日为甲子日
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
  const dayGZ = getGanZhi(diffDays + 1);
  
  return {
    ganZhi: dayGZ.gan + dayGZ.zhi,
    ganZhiEn: dayGZ.ganEn + dayGZ.zhiEn
  };
}

/**
 * 计算时干支
 */
function getHourGanZhi(date: Date): { ganZhi: string; ganZhiEn: string } {
  const hour = date.getHours();
  const zhiIndex = Math.floor((hour + 1) / 2) % 12;
  
  // 时干根据日干推算
  const dayGZ = getDayGanZhi(date);
  const dayGanIndex = HEAVENLY_STEMS.indexOf(dayGZ.ganZhi[0]);
  const hourGanIndex = (dayGanIndex * 2 + zhiIndex) % 10;
  
  return {
    ganZhi: HEAVENLY_STEMS[hourGanIndex] + EARTHLY_BRANCHES[zhiIndex],
    ganZhiEn: HEAVENLY_STEMS_EN[hourGanIndex] + EARTHLY_BRANCHES_EN[zhiIndex]
  };
}

/**
 * 阳历转农历
 */
export function solarToLunar(date: Date): LunarDate {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (year < 1900 || year > 2100) {
    throw new Error('Year must be between 1900 and 2100');
  }

  // 计算与1900年1月31日的天数差
  const baseDate = new Date(1900, 0, 31);
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
  
  let lunarYear = 1900;
  let lunarMonth = 1;
  let lunarDay = 1;
  let isLeapMonth = false;
  
  // 计算农历年
  let daysInYear = 0;
  while (lunarYear < 2100) {
    daysInYear = getLunarYearDays(lunarYear);
    if (diffDays < daysInYear) break;
    lunarYear++;
  }
  
  // 计算农历月
  let remainingDays = diffDays - daysInYear;
  const leapMonth = getLeapMonth(lunarYear);
  let daysInMonth = 0;
  
  for (let i = 1; i <= 12; i++) {
    daysInMonth = getLunarMonthDays(lunarYear, i);
    if (remainingDays < daysInMonth) {
      lunarMonth = i;
      break;
    }
    remainingDays -= daysInMonth;
    
    // 处理闰月
    if (i === leapMonth) {
      daysInMonth = getLeapMonthDays(lunarYear);
      if (remainingDays < daysInMonth) {
        lunarMonth = i;
        isLeapMonth = true;
        break;
      }
      remainingDays -= daysInMonth;
    }
  }
  
  lunarDay = remainingDays + 1;
  
  // 计算干支
  const yearGZ = getYearGanZhi(lunarYear);
  const monthGZ = getMonthGanZhi(lunarYear, lunarMonth);
  const dayGZ = getDayGanZhi(date);
  const hourGZ = getHourGanZhi(date);
  
  // 生肖
  const zodiacIndex = (lunarYear - 4) % 12;
  
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeapMonth,
    yearGanZhi: yearGZ.ganZhi,
    monthGanZhi: monthGZ.ganZhi,
    dayGanZhi: dayGZ.ganZhi,
    hourGanZhi: hourGZ.ganZhi,
    zodiac: ZODIAC_ANIMALS[zodiacIndex],
    yearGanZhiEn: yearGZ.ganZhiEn,
    monthGanZhiEn: monthGZ.ganZhiEn,
    dayGanZhiEn: dayGZ.ganZhiEn,
    hourGanZhiEn: hourGZ.ganZhiEn,
    zodiacEn: ZODIAC_ANIMALS_EN[zodiacIndex],
    lunarMonthName: (isLeapMonth ? '闰' : '') + LUNAR_MONTHS[lunarMonth - 1],
    lunarDayName: LUNAR_DAYS[lunarDay],
    lunarMonthNameEn: (isLeapMonth ? 'Leap ' : '') + LUNAR_MONTHS_EN[lunarMonth - 1]
  };
}

/**
 * 农历转阳历
 */
export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean = false): Date {
  if (lunarYear < 1900 || lunarYear > 2100) {
    throw new Error('Year must be between 1900 and 2100');
  }

  let totalDays = 0;
  
  // 计算从1900年到指定年份的总天数
  for (let year = 1900; year < lunarYear; year++) {
    totalDays += getLunarYearDays(year);
  }
  
  // 计算指定年份中从1月到指定月份的天数
  const leapMonth = getLeapMonth(lunarYear);
  for (let month = 1; month < lunarMonth; month++) {
    totalDays += getLunarMonthDays(lunarYear, month);
    if (month === leapMonth) {
      totalDays += getLeapMonthDays(lunarYear);
    }
  }
  
  // 如果是闰月
  if (isLeapMonth && lunarMonth === leapMonth) {
    totalDays += getLunarMonthDays(lunarYear, lunarMonth);
  }
  
  // 加上指定的天数
  totalDays += lunarDay - 1;
  
  // 1900年1月31日为基准日期
  const baseDate = new Date(1900, 0, 31);
  const resultDate = new Date(baseDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
  
  return resultDate;
}
