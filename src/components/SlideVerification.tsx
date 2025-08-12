import React, { useState, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronRight, Check, RotateCcw } from 'lucide-react';

interface SlideVerificationProps {
  onVerificationSuccess: () => void;
  onVerificationFailed?: () => void;
  disabled?: boolean;
  className?: string;
}

const SlideVerification: React.FC<SlideVerificationProps> = ({
  onVerificationSuccess,
  onVerificationFailed,
  disabled = false,
  className = ''
}) => {
  const { t } = useLanguage();
  const [slidePosition, setSlidePosition] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取最大滑动距离
  const getMaxSlideDistance = () => {
    if (containerRef.current) {
      return containerRef.current.offsetWidth - 48; // 48px是滑块宽度
    }
    return 250; // 默认值
  };

  // 处理滑动验证完成
  const handleSlideComplete = () => {
    const maxDistance = getMaxSlideDistance();
    const threshold = maxDistance * 0.85; // 85% 的距离即可

    if (slidePosition >= threshold) {
      // 验证成功
      setIsVerified(true);
      setSlidePosition(maxDistance);
      onVerificationSuccess();
    } else {
      // 验证失败，滑块回到起始位置
      setIsFailed(true);
      setSlidePosition(0);
      onVerificationFailed?.();

      // 2秒后清除失败状态
      setTimeout(() => {
        setIsFailed(false);
      }, 2000);
    }
  };

  // 简单的鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isVerified) return;

    e.preventDefault();
    setIsFailed(false);

    const startX = e.clientX;
    const startPosition = slidePosition;
    const maxDistance = getMaxSlideDistance();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newPosition = Math.max(0, Math.min(maxDistance, startPosition + deltaX));
      setSlidePosition(newPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      handleSlideComplete();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 简单的触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isVerified) return;

    e.preventDefault();
    setIsFailed(false);

    const startX = e.touches[0].clientX;
    const startPosition = slidePosition;
    const maxDistance = getMaxSlideDistance();

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length > 0) {
        const deltaX = moveEvent.touches[0].clientX - startX;
        const newPosition = Math.max(0, Math.min(maxDistance, startPosition + deltaX));
        setSlidePosition(newPosition);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      handleSlideComplete();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleReset = () => {
    setIsVerified(false);
    setIsFailed(false);
    setSlidePosition(0);
  };

  const getSliderIcon = () => {
    if (isVerified) {
      return <Check className="w-5 h-5 text-white" />;
    }
    return <ChevronRight className="w-5 h-5 text-white" />;
  };

  const getBackgroundColor = () => {
    if (isVerified) return 'bg-green-500';
    if (isFailed) return 'bg-red-500';
    return 'bg-gradient-to-r from-purple-500 to-blue-500';
  };

  const getSliderColor = () => {
    if (isVerified) return 'bg-green-600';
    if (isFailed) return 'bg-red-600';
    return 'bg-white';
  };

  const getTextColor = () => {
    if (isVerified) return 'text-white';
    if (isFailed) return 'text-white';
    return 'text-gray-600';
  };

  const getText = () => {
    if (isVerified) return t('slideVerificationSuccess');
    if (isFailed) return t('slideVerificationFailed');
    return t('slideToVerify');
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className={`relative h-12 rounded-lg overflow-hidden transition-all duration-300 ${getBackgroundColor()} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } select-none`}
        style={{ touchAction: 'none' }}
      >
        {/* 背景文字 */}
        <div className={`absolute inset-0 flex items-center justify-center text-sm font-medium transition-colors duration-300 ${getTextColor()}`}>
          {getText()}
        </div>

        {/* 滑动进度背景 */}
        <div
          className="absolute left-0 top-0 h-full bg-white bg-opacity-20 transition-all duration-300"
          style={{ width: `${(slidePosition / maxSlideDistance.current) * 100}%` }}
        />

        {/* 滑块 */}
        <div
          className={`absolute top-1 left-1 w-10 h-10 rounded-md shadow-lg flex items-center justify-center transition-all duration-200 ${getSliderColor()} ${
            disabled || isVerified ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
          } select-none`}
          style={{
            transform: `translateX(${slidePosition}px)`,
            transition: 'transform 0.2s ease-out'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {getSliderIcon()}
        </div>
      </div>

      {/* 重置按钮 */}
      {isVerified && (
        <button
          onClick={handleReset}
          className="absolute -right-12 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-200"
          title={t('resetVerification')}
        >
          <RotateCcw className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default SlideVerification;
