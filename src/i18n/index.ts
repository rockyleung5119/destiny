import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 语言资源
const resources = {
  en: {
    translation: {
      // 通用
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      
      // 导航
      home: 'Home',
      services: 'Services',
      about: 'About',
      contact: 'Contact',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      
      // 服务
      bazi: 'BaZi Analysis',
      daily: 'Daily Fortune',
      tarot: 'Tarot Reading',
      lucky: 'Lucky Items',
      
      // 分析相关
      analysis: 'Analysis',
      result: 'Result',
      generating: 'Generating analysis...',
      
      // 用户信息
      profile: 'Profile',
      birthInfo: 'Birth Information',
      name: 'Name',
      email: 'Email',
      gender: 'Gender',
      birthDate: 'Birth Date',
      birthTime: 'Birth Time',
      birthPlace: 'Birth Place',
      
      // 会员
      membership: 'Membership',
      upgrade: 'Upgrade',
      premium: 'Premium',
      
      // 错误信息
      networkError: 'Network error, please try again',
      serverError: 'Server error, please try again later',
      authRequired: 'Please login first',
      membershipRequired: 'Premium membership required'
    }
  },
  zh: {
    translation: {
      // 通用
      loading: '加载中...',
      error: '错误',
      success: '成功',
      cancel: '取消',
      confirm: '确认',
      close: '关闭',
      
      // 导航
      home: '首页',
      services: '服务',
      about: '关于',
      contact: '联系',
      login: '登录',
      register: '注册',
      logout: '退出',
      
      // 服务
      bazi: '八字精算',
      daily: '每日运势',
      tarot: '塔罗占卜',
      lucky: '幸运物品',
      
      // 分析相关
      analysis: '分析',
      result: '结果',
      generating: '正在生成分析...',
      
      // 用户信息
      profile: '个人资料',
      birthInfo: '生辰信息',
      name: '姓名',
      email: '邮箱',
      gender: '性别',
      birthDate: '出生日期',
      birthTime: '出生时辰',
      birthPlace: '出生地点',
      
      // 会员
      membership: '会员',
      upgrade: '升级',
      premium: '高级会员',
      
      // 错误信息
      networkError: '网络错误，请重试',
      serverError: '服务器错误，请稍后重试',
      authRequired: '请先登录',
      membershipRequired: '需要高级会员'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // 默认语言
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
