import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronRight, Check, RotateCcw } from 'lucide-react';

interface BasicSlideVerificationProps {
  onVerificationSuccess: () => void;
  onVerificationFailed?: () => void;
  disabled?: boolean;
  className?: string;
}

const BasicSlideVerification: React.FC<BasicSlideVerificationProps> = ({
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    startX: number;
    startPosition: number;
    maxDistance: number;
  } | null>(null);

  // 获取最大滑动距离
  const getMaxDistance = () => {
    if (containerRef.current && sliderRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const sliderWidth = sliderRef.current.offsetWidth;
      return Math.max(0, containerWidth - sliderWidth - 8);
    }
    return 300;
  };

  // 处理验证
  const handleVerification = (position: number) => {
    const maxDistance = getMaxDistance();
    const threshold = maxDistance * 0.8;
    
    if (position >= threshold) {
      setIsVerified(true);
      setSlidePosition(maxDistance);
      onVerificationSuccess();
    } else {
      setIsFailed(true);
      setSlidePosition(0);
      onVerificationFailed?.();
      setTimeout(() => setIsFailed(false), 2000);
    }
  };

  // 开始拖拽
  const startDrag = (clientX: number) => {
    if (disabled || isVerified) return false;
    
    const maxDistance = getMaxDistance();
    dragDataRef.current = {
      startX: clientX,
      startPosition: slidePosition,
      maxDistance
    };
    
    setIsDragging(true);
    setIsFailed(false);
    return true;
  };

  // 更新拖拽位置
  const updateDrag = (clientX: number) => {
    if (!dragDataRef.current || !isDragging) return;
    
    const { startX, startPosition, maxDistance } = dragDataRef.current;
    const deltaX = clientX - startX;
    const newPosition = Math.max(0, Math.min(maxDistance, startPosition + deltaX));
    setSlidePosition(newPosition);
  };

  // 结束拖拽
  const endDrag = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    handleVerification(slidePosition);
    dragDataRef.current = null;
  };

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!startDrag(e.clientX)) return;
    
    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      updateDrag(event.clientX);
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      endDrag();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!startDrag(e.touches[0].clientX)) return;
    
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        updateDrag(event.touches[0].clientX);
      }
    };
    
    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      endDrag();
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  // 重置
  const handleReset = () => {
    setIsVerified(false);
    setIsFailed(false);
    setSlidePosition(0);
    setIsDragging(false);
    dragDataRef.current = null;
  };

  // 样式函数
  const getSliderColor = () => {
    if (isVerified) return 'bg-green-500 text-white';
    if (isFailed) return 'bg-red-500 text-white';
    return 'bg-white text-gray-600';
  };

  const getTrackColor = () => {
    if (isVerified) return 'bg-green-400';
    if (isFailed) return 'bg-red-400';
    return 'bg-blue-400';
  };

  const getText = () => {
    if (isVerified) return t('verificationSuccess');
    if (isFailed) return t('verificationFailed');
    return t('slideToVerify');
  };

  const getIcon = () => {
    if (isVerified) return <Check className="w-4 h-4" />;
    if (isFailed) return <RotateCcw className="w-4 h-4" />;
    return <ChevronRight className="w-4 h-4" />;
  };

  const getProgress = () => {
    const maxDistance = getMaxDistance();
    return maxDistance > 0 ? (slidePosition / maxDistance) * 100 : 0;
  };

  return (
    <div className={`relative select-none ${className}`}>
      <div 
        ref={containerRef}
        className="relative w-full h-12 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden"
        style={{ userSelect: 'none' }}
      >
        {/* 进度轨道 */}
        <div 
          className={`absolute left-0 top-0 h-full ${getTrackColor()} transition-all duration-300 rounded-lg`}
          style={{ width: `${Math.max(10, getProgress())}%` }}
        />
        
        {/* 文本 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-sm font-medium text-gray-700 select-none">
            {getText()}
          </span>
        </div>
        
        {/* 滑块 */}
        <div
          ref={sliderRef}
          className={`absolute top-1 left-1 w-10 h-10 rounded-md shadow-lg flex items-center justify-center border border-gray-300 transition-all duration-200 z-20 ${getSliderColor()} ${
            isDragging ? 'scale-110 shadow-xl' : 'scale-100'
          } ${
            disabled || isVerified ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ 
            transform: `translateX(${slidePosition}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out, scale 0.2s ease-out',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          draggable={false}
        >
          {getIcon()}
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

export default BasicSlideVerification;
