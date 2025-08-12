// 安全的页面导航工具函数

/**
 * 安全地刷新页面
 * @param delay 延迟时间（毫秒）
 */
export const safeReload = (delay: number = 0): void => {
  const performReload = () => {
    try {
      console.log('🔄 正在刷新页面...');
      
      // 方法1: 尝试使用 location.reload()
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
        return;
      }
      
      // 方法2: 如果 reload 失败，尝试重定向到当前页面
      if (typeof window !== 'undefined') {
        window.location.href = window.location.href;
        return;
      }
      
      // 方法3: 如果都失败了，尝试重定向到根路径
      if (typeof window !== 'undefined') {
        window.location.href = window.location.origin || '/';
        return;
      }
      
      console.error('❌ 所有页面刷新方法都失败了');
    } catch (error) {
      console.error('❌ 页面刷新失败:', error);
      
      // 最后的备用方案：尝试重定向到根路径
      try {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } catch (fallbackError) {
        console.error('❌ 备用刷新方案也失败了:', fallbackError);
      }
    }
  };

  if (delay > 0) {
    console.log(`⏱️ ${delay}ms 后刷新页面...`);
    setTimeout(performReload, delay);
  } else {
    performReload();
  }
};

/**
 * 安全地导航到指定URL
 * @param url 目标URL
 * @param delay 延迟时间（毫秒）
 */
export const safeNavigate = (url: string, delay: number = 0): void => {
  const performNavigation = () => {
    try {
      console.log(`🧭 正在导航到: ${url}`);
      
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = url;
        return;
      }
      
      console.error('❌ 导航失败: window.location 不可用');
    } catch (error) {
      console.error('❌ 导航失败:', error);
    }
  };

  if (delay > 0) {
    console.log(`⏱️ ${delay}ms 后导航到: ${url}`);
    setTimeout(performNavigation, delay);
  } else {
    performNavigation();
  }
};

/**
 * 检查当前环境是否支持页面导航
 */
export const isNavigationSupported = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.location !== 'undefined' &&
           typeof window.location.href === 'string';
  } catch {
    return false;
  }
};

/**
 * 获取当前页面URL信息
 */
export const getCurrentPageInfo = () => {
  try {
    if (!isNavigationSupported()) {
      return null;
    }
    
    return {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    };
  } catch (error) {
    console.error('❌ 获取页面信息失败:', error);
    return null;
  }
};
