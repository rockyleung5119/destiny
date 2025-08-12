import React, { useState, useEffect } from 'react';
import { Alert, Button } from 'antd';
import { useLanguage } from '../hooks/useLanguage';

interface LanguageCheckerProps {
  content: string;
  expectedLanguage: string;
  onLanguageSwitch?: () => void;
}

const LanguageChecker: React.FC<LanguageCheckerProps> = ({ 
  content, 
  expectedLanguage, 
  onLanguageSwitch 
}) => {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [showAlert, setShowAlert] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');

  // 检测内容语言
  const detectContentLanguage = (text: string): string => {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
    const englishWords = text.match(/[a-zA-Z]+/g);
    const chineseCount = chineseChars ? chineseChars.length : 0;
    const englishWordCount = englishWords ? englishWords.length : 0;
    
    if (chineseCount > englishWordCount * 2) {
      return 'zh';
    } else if (englishWordCount > chineseCount * 2) {
      return 'en';
    } else {
      return 'mixed';
    }
  };

  useEffect(() => {
    if (content && content.length > 100) {
      const detected = detectContentLanguage(content);
      setDetectedLanguage(detected);
      
      // 如果检测到的语言与期望的语言不匹配，显示提示
      if (detected !== expectedLanguage && detected !== 'mixed') {
        setShowAlert(true);
      } else {
        setShowAlert(false);
      }
    }
  }, [content, expectedLanguage]);

  const handleLanguageSwitch = () => {
    if (detectedLanguage === 'zh') {
      changeLanguage('zh');
    } else if (detectedLanguage === 'en') {
      changeLanguage('en');
    }
    setShowAlert(false);
    if (onLanguageSwitch) {
      onLanguageSwitch();
    }
  };

  const getAlertMessage = () => {
    if (expectedLanguage === 'en' && detectedLanguage === 'zh') {
      return {
        message: 'Language Mismatch Detected',
        description: 'The content appears to be in Chinese, but you have selected English. Would you like to switch to Chinese for a better experience?',
        buttonText: 'Switch to Chinese'
      };
    } else if (expectedLanguage === 'zh' && detectedLanguage === 'en') {
      return {
        message: '检测到语言不匹配',
        description: '内容似乎是英文的，但您选择了中文。是否要切换到英文以获得更好的体验？',
        buttonText: '切换到英文'
      };
    }
    return null;
  };

  if (!showAlert) {
    return null;
  }

  const alertInfo = getAlertMessage();
  if (!alertInfo) {
    return null;
  }

  return (
    <Alert
      message={alertInfo.message}
      description={
        <div>
          <p>{alertInfo.description}</p>
          <Button 
            type="primary" 
            size="small" 
            onClick={handleLanguageSwitch}
            style={{ marginTop: 8 }}
          >
            {alertInfo.buttonText}
          </Button>
        </div>
      }
      type="info"
      showIcon
      closable
      onClose={() => setShowAlert(false)}
      style={{ marginBottom: 16 }}
    />
  );
};

export default LanguageChecker;
