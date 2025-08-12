import React, { useState, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronRight, Check, RotateCcw } from 'lucide-react';

interface SimpleSlideVerificationProps {
  onVerificationSuccess: () => void;
  onVerificationFailed?: () => void;
  disabled?: boolean;
  className?: string;
}

const SimpleSlideVerification: React.FC<SimpleSlideVerificationProps> = ({
  onVerificationSuccess,
  onVerificationFailed,
  disabled = false,
  className = ''
}) => {
  const { t } = useLanguage();
  const [slidePosition, setSlidePosition] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取最大滑动距离
  const getMaxSlideDistance = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const sliderWidth = 48; // 48px是滑块宽度
      const padding = 8; // 左右边距
      const maxDistance = containerWidth - sliderWidth - padding;
      return Math.max(0, maxDistance);
    }
    return 250; // 默认值
  };

  // 处理滑动验证完成
  const handleSlideComplete = () => {
    setIsDragging(false);
    const maxDistance = getMaxSlideDistance();
    const threshold = maxDistance * 0.9; // 90% 的距离才能通过验证

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

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isVerified) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setIsFailed(false);

    const startX = e.clientX;
    const startPosition = slidePosition;
    const maxDistance = getMaxSlideDistance();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const newPosition = Math.max(0, Math.min(maxDistance, startPosition + deltaX));
      setSlidePosition(newPosition);
    };

    const handleMouseUp = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      handleSlideComplete();
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
  };

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isVerified) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setIsFailed(false);

    const startX = e.touches[0].clientX;
    const startPosition = slidePosition;
    const maxDistance = getMaxSlideDistance();

    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      if (moveEvent.touches.length > 0) {
        const deltaX = moveEvent.touches[0].clientX - startX;
        const newPosition = Math.max(0, Math.min(maxDistance, startPosition + deltaX));
        setSlidePosition(newPosition);
      }
    };

    const handleTouchEnd = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      handleSlideComplete();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
  };

  const handleReset = () => {
    setIsVerified(false);
    setIsFailed(false);
    setSlidePosition(0);
    setIsDragging(false);
  };

  const getTrackColor = () => {
    if (isVerified) return 'bg-green-500';
    if (isFailed) return 'bg-red-500';
    return 'bg-gray-300';
  };

  const getSliderColor = () => {
    if (isVerified) return 'bg-green-500';
    if (isFailed) return 'bg-red-500';
    return 'bg-white';
  };

  const getTextColor = () => {
    if (isVerified) return 'text-green-700';
    if (isFailed) return 'text-red-700';
    return 'text-gray-600';
  };

  const getText = () => {
    if (isVerified) return t('verificationSuccess');
    if (isFailed) return t('verificationFailed');
    return t('slideToVerify');
  };

  const getSliderIcon = () => {
    if (isVerified) return <Check className="w-5 h-5 text-white" />;
    if (isFailed) return <RotateCcw className="w-4 h-4 text-red-600" />;
    return <ChevronRight className="w-5 h-5 text-gray-600" />;
  };

  // 计算进度百分比
  const getProgress = () => {
    const maxDistance = getMaxSlideDistance();
    return maxDistance > 0 ? (slidePosition / maxDistance) * 100 : 0;
  };

  return (
    <div className={`relative ${className}`} style={{ userSelect: 'none' }}>
      <div
        ref={containerRef}
        className="relative w-full h-12 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden"
        style={{ userSelect: 'none' }}
      >
        {/* 进度轨道 */}
        <div
          className={`absolute left-0 top-0 h-full ${getTrackColor()} transition-all duration-300 rounded-lg`}
          style={{ width: `${Math.max(12, getProgress())}%` }}
        />

        {/* 文本 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-sm font-medium ${getTextColor()} transition-colors duration-300 select-none`}>
            {getText()}
          </span>
        </div>

        {/* 滑块 */}
        <div
          className={`absolute top-1 left-1 w-10 h-10 rounded-md shadow-lg flex items-center justify-center transition-all duration-200 ${getSliderColor()} ${
            isDragging ? 'scale-110 shadow-xl' : 'scale-100'
          } ${
            disabled || isVerified ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
          } select-none border border-gray-200 z-10`}
          style={{
            transform: `translateX(${slidePosition}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out, scale 0.2s ease-out',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          draggable={false}
        >
          {getSliderIcon()}
        </div>
      </div>

      {/* 重置按钮 */}
      {(isVerified || isFailed) && (
        <button
          onClick={handleReset}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {t('resetVerification')}
        </button>
      )}
    </div>
  );
};

export default SimpleSlideVerification;
