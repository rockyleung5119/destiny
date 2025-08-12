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
      analysisResult: 'Analysis Result',
      consultationQuestion: 'Consultation Question',

      // 算命结果相关
      baziAnalysisSummary: 'BaZi Analysis Summary',
      overallFortune: 'Overall Fortune',
      excellent: 'Excellent',
      metalType: 'Metal Type',
      dominantElement: 'Dominant Element',
      score: 'Score',

      // 运势类别
      careerFortune: 'Career Fortune',
      wealthFortune: 'Wealth Fortune',
      loveFortune: 'Love Fortune',
      healthFortune: 'Health Fortune',
      
      // 用户信息
      profile: 'Profile',
      birthInfo: 'Birth Information',
      name: 'Name',
      email: 'Email',
      gender: 'Gender',
      birthDate: 'Birth Date',
      birthTime: 'Birth Time',
      birthPlace: 'Birth Place',

      // 时间字段
      year: 'Year',
      month: 'Month',
      day: 'Day',
      hour: 'Hour',
      minute: 'Minute',
      hourFormat: 'Hour (0-23)',
      
      // 会员
      membership: 'Membership',
      upgrade: 'Upgrade',
      premium: 'Premium',
      membershipStatus: 'Membership Status',
      plan: 'Plan',
      status: 'Status',
      renewalDate: 'Renewal Date',
      usageLimit: 'Usage Limit',
      activeStatus: 'Active',
      expiredStatus: 'Expired',
      noExpiration: 'No Expiration',
      creditsRemaining: 'credits remaining',
      unlimitedUsage: 'Unlimited Usage',
      basicFortune: 'Basic Fortune',
      premiumDestiny: 'Premium Destiny',
      masterFortune: 'Master Fortune',
      paidMembership: 'Paid Membership',
      singleReading: 'Single Reading',
      monthlyPlan: 'Monthly Plan',
      yearlyPlan: 'Yearly Plan',
      customPlan: 'Custom Plan',
      
      // 错误信息
      networkError: 'Network error, please try again',
      serverError: 'Server error, please try again later',
      authRequired: 'Please login first',
      membershipRequired: 'Premium membership required',

      // 权限相关
      profileIncomplete: 'Profile Incomplete',
      profileIncompleteDesc: 'Please complete your birth information (year, month, day) in profile settings before using this service.',
      goToSettings: 'Go to Settings',

      // 个人设置相关
      memberSettings: 'Member Settings',
      memberSettingsDesc: 'Manage your profile and account settings',
      profileSettings: 'Profile Settings',
      profileInformation: 'Profile Information',
      importantNotice: 'Important Notice',
      importantNoticeDesc: 'Your birth information is crucial for accurate fortune telling. You can only update your profile once to maintain the integrity of your readings.',
      alreadyUsedUpdate: 'You have already used your one-time profile update.',
      fullName: 'Full Name',
      enterFullName: 'Enter your full name',
      emailAddress: 'Email Address',
      emailCannotBeChanged: 'Email cannot be changed',
      selectGender: 'Select Gender',
      male: 'Male',
      female: 'Female',
      birthDateTime: 'Birth Date & Time (Essential for Fortune Telling)',
      cityCountry: 'City, Country',
      timezoneEssential: 'Timezone (Essential for Accurate Fortune Telling)',
      selectTimezone: 'Select Timezone',
      updating: 'Updating...',
      profileAlreadyUpdated: 'Profile Already Updated',
      updateProfileOneTime: 'Update Profile (One Time Only)',
      backToHome: 'Back to Home',

      // 密码相关
      changePassword: 'Change Password',
      changePasswordDesc: 'Update your account password',
      currentPassword: 'Current Password',
      enterCurrentPassword: 'Enter current password',
      newPassword: 'New Password',
      enterNewPassword: 'Enter new password',
      confirmNewPassword: 'Confirm New Password',
      confirmNewPasswordPlaceholder: 'Confirm your new password',
      changingPassword: 'Changing Password...',

      // 消息
      failedToLoadProfile: 'Failed to load profile',
      unableToConnect: 'Unable to connect to server',
      profileCanOnlyBeUpdated: 'Profile can only be updated once',
      profileUpdatedSuccess: 'Profile updated successfully',
      failedToUpdateProfile: 'Failed to update profile',
      newPasswordsDoNotMatch: 'New passwords do not match',
      newPasswordMinLength: 'New password must be at least 6 characters',
      passwordChangedSuccessfully: 'Password changed successfully',
      failedToChangePassword: 'Failed to change password',

      // 删除账号相关
      deleteAccount: 'Delete Account',
      deleteAccountDesc: 'Permanently delete your account and all associated data',
      dangerZone: 'Danger Zone',
      deleteWarning1: 'This action cannot be undone',
      deleteWarning2: 'All your personal data will be permanently deleted',
      deleteWarning3: 'No refunds will be provided for any active memberships',
      deleteWarning4: 'You will lose access to all fortune telling services',
      beforeYouProceed: 'Before You Proceed',
      deleteStep1: 'Make sure you have downloaded any important data',
      deleteStep2: 'Cancel any active subscriptions if needed',
      deleteStep3: 'Understand that this action is irreversible',
      proceedToDelete: 'I Understand, Proceed to Delete',
      emailVerificationRequired: 'Email Verification Required',
      deleteEmailVerificationDesc: 'For security, we need to verify your email address before deleting your account.',
      currentEmail: 'Current Email',
      sendVerificationCode: 'Send Verification Code',
      sendingCode: 'Sending Code...',
      enterVerificationCode: 'Enter Verification Code',
      deleteCodeSentDesc: 'We have sent a 6-digit verification code to your email address.',
      verificationCode: 'Verification Code',
      enterSixDigitCode: 'Enter 6-digit code',
      back: 'Back',
      confirmDeleteAccount: 'Confirm Delete Account',
      deletingAccount: 'Deleting Account...',
      resendCode: 'Resend Code',
      deleteVerificationCodeSent: 'Verification code sent to your email',
      failedToSendDeleteCode: 'Failed to send verification code',
      pleaseEnterDeleteCode: 'Please enter the verification code',
      accountDeletedSuccessfully: 'Account deleted successfully. Redirecting...',
      failedToDeleteAccount: 'Failed to delete account'
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
      analysisResult: '分析结果',
      consultationQuestion: '咨询问题',

      // 算命结果相关
      baziAnalysisSummary: '八字分析总评',
      overallFortune: '整体运势',
      excellent: '优秀',
      metalType: '金型',
      dominantElement: '主导五行',
      score: '分',

      // 运势类别
      careerFortune: '事业运势',
      wealthFortune: '财运',
      loveFortune: '感情运势',
      healthFortune: '健康运势',
      
      // 用户信息
      profile: '个人资料',
      birthInfo: '生辰信息',
      name: '姓名',
      email: '邮箱',
      gender: '性别',
      birthDate: '出生日期',
      birthTime: '出生时辰',
      birthPlace: '出生地点',

      // 时间字段
      year: '年',
      month: '月',
      day: '日',
      hour: '时',
      minute: '分',
      hourFormat: '时 (0-23)',
      
      // 会员
      membership: '会员',
      upgrade: '升级',
      premium: '高级会员',
      membershipStatus: '会员状态',
      plan: '套餐',
      status: '状态',
      renewalDate: '续费日期',
      usageLimit: '使用限制',
      activeStatus: '有效',
      expiredStatus: '已过期',
      noExpiration: '无过期时间',
      creditsRemaining: '次剩余',
      unlimitedUsage: '无限使用',
      basicFortune: '基础运势',
      premiumDestiny: '高级命运',
      masterFortune: '大师运势',
      paidMembership: '付费会员',
      singleReading: '单次解读',
      monthlyPlan: '月度套餐',
      yearlyPlan: '年度套餐',
      customPlan: '自定义套餐',
      
      // 错误信息
      networkError: '网络错误，请重试',
      serverError: '服务器错误，请稍后重试',
      authRequired: '请先登录',
      membershipRequired: '需要高级会员',

      // 权限相关
      profileIncomplete: '资料不完整',
      profileIncompleteDesc: '请先在个人设置中完善您的出生信息（年、月、日），然后再使用此服务。',
      goToSettings: '前往设置',

      // 个人设置相关
      memberSettings: '会员设置',
      memberSettingsDesc: '管理您的个人资料和账户设置',
      profileSettings: '个人资料设置',
      profileInformation: '个人信息',
      importantNotice: '重要提醒',
      importantNoticeDesc: '您的出生信息对准确算命至关重要。为了保持算命结果的完整性，您只能更新一次个人资料。',
      alreadyUsedUpdate: '您已经使用过一次性资料更新机会。',
      fullName: '姓名',
      enterFullName: '请输入您的姓名',
      emailAddress: '邮箱地址',
      emailCannotBeChanged: '邮箱地址不能修改',
      selectGender: '请选择性别',
      male: '男',
      female: '女',
      birthDateTime: '出生日期时间（算命必需）',
      cityCountry: '城市，国家',
      timezoneEssential: '时区（准确算命必需）',
      selectTimezone: '请选择时区',
      updating: '更新中...',
      profileAlreadyUpdated: '资料已更新',
      updateProfileOneTime: '更新资料（仅限一次）',
      backToHome: '返回首页',

      // 密码相关
      changePassword: '修改密码',
      changePasswordDesc: '更新您的账户密码',
      currentPassword: '当前密码',
      enterCurrentPassword: '请输入当前密码',
      newPassword: '新密码',
      enterNewPassword: '请输入新密码',
      confirmNewPassword: '确认新密码',
      confirmNewPasswordPlaceholder: '请确认您的新密码',
      changingPassword: '修改密码中...',

      // 消息
      failedToLoadProfile: '加载个人资料失败',
      unableToConnect: '无法连接到服务器',
      profileCanOnlyBeUpdated: '个人资料只能更新一次',
      profileUpdatedSuccess: '个人资料更新成功',
      failedToUpdateProfile: '更新个人资料失败',
      newPasswordsDoNotMatch: '新密码不匹配',
      newPasswordMinLength: '新密码至少需要6个字符',
      passwordChangedSuccessfully: '密码修改成功',
      failedToChangePassword: '修改密码失败',

      // 删除账号相关
      deleteAccount: '删除账号',
      deleteAccountDesc: '永久删除您的账号和所有相关数据',
      dangerZone: '危险区域',
      deleteWarning1: '此操作无法撤销',
      deleteWarning2: '您的所有个人数据将被永久删除',
      deleteWarning3: '任何有效会员资格都不会退款',
      deleteWarning4: '您将失去所有算命服务的访问权限',
      beforeYouProceed: '在您继续之前',
      deleteStep1: '确保您已下载任何重要数据',
      deleteStep2: '如需要，请取消任何有效订阅',
      deleteStep3: '理解此操作是不可逆的',
      proceedToDelete: '我理解，继续删除',
      emailVerificationRequired: '需要邮箱验证',
      deleteEmailVerificationDesc: '为了安全起见，我们需要在删除您的账号前验证您的邮箱地址。',
      currentEmail: '当前邮箱',
      sendVerificationCode: '发送验证码',
      sendingCode: '发送中...',
      enterVerificationCode: '输入验证码',
      deleteCodeSentDesc: '我们已向您的邮箱发送了6位数验证码。',
      verificationCode: '验证码',
      enterSixDigitCode: '输入6位数验证码',
      back: '返回',
      confirmDeleteAccount: '确认删除账号',
      deletingAccount: '删除账号中...',
      resendCode: '重新发送验证码',
      deleteVerificationCodeSent: '验证码已发送到您的邮箱',
      failedToSendDeleteCode: '发送验证码失败',
      pleaseEnterDeleteCode: '请输入验证码',
      accountDeletedSuccessfully: '账号删除成功，正在跳转...',
      failedToDeleteAccount: '删除账号失败'
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
