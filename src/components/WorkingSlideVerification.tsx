import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronRight, Check, RotateCcw } from 'lucide-react';

interface WorkingSlideVerificationProps {
  onVerificationSuccess: () => void;
  onVerificationFailed?: () => void;
  disabled?: boolean;
  className?: string;
}

const WorkingSlideVerification: React.FC<WorkingSlideVerificationProps> = ({
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

  // 获取最大滑动距离
  const getMaxDistance = () => {
    if (containerRef.current && sliderRef.current) {
      return containerRef.current.offsetWidth - sliderRef.current.offsetWidth - 4;
    }
    return 250;
  };

  // 处理验证完成
  const checkVerification = (position: number) => {
    const maxDistance = getMaxDistance();
    const threshold = maxDistance * 0.85;
    
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

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isVerified) return;

    console.log('Mouse down - starting drag');
    e.preventDefault();
    setIsDragging(true);
    setIsFailed(false);

    const startX = e.clientX;
    const startPos = slidePosition;
    const maxDist = getMaxDistance();
    let currentPos = startPos;

    console.log('Start X:', startX, 'Start Pos:', startPos, 'Max Dist:', maxDist);

    const onMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - startX;
      const newPos = Math.max(0, Math.min(maxDist, startPos + deltaX));
      currentPos = newPos;
      console.log('Moving to:', newPos);
      setSlidePosition(newPos);
    };

    const onMouseUp = () => {
      console.log('Mouse up - ending drag at position:', currentPos);
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      checkVerification(currentPos);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isVerified) return;

    e.preventDefault();
    setIsDragging(true);
    setIsFailed(false);

    const startX = e.touches[0].clientX;
    const startPos = slidePosition;
    const maxDist = getMaxDistance();
    let currentPos = startPos;

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const deltaX = event.touches[0].clientX - startX;
        const newPos = Math.max(0, Math.min(maxDist, startPos + deltaX));
        currentPos = newPos;
        setSlidePosition(newPos);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      checkVerification(currentPos);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  };

  // 重置
  const handleReset = () => {
    setIsVerified(false);
    setIsFailed(false);
    setSlidePosition(0);
    setIsDragging(false);
  };

  // 获取样式
  const getSliderColor = () => {
    if (isVerified) return 'bg-green-500';
    if (isFailed) return 'bg-red-500';
    return 'bg-white';
  };

  const getTrackColor = () => {
    if (isVerified) return 'bg-green-500';
    if (isFailed) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getText = () => {
    if (isVerified) return t('verificationSuccess');
    if (isFailed) return t('verificationFailed');
    return t('slideToVerify');
  };

  const getIcon = () => {
    if (isVerified) return <Check className="w-5 h-5 text-white" />;
    if (isFailed) return <RotateCcw className="w-4 h-4 text-red-600" />;
    return <ChevronRight className="w-5 h-5 text-gray-600" />;
  };

  const getProgress = () => {
    const maxDistance = getMaxDistance();
    return maxDistance > 0 ? (slidePosition / maxDistance) * 100 : 0;
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef}
        className="relative w-full h-12 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden"
      >
        {/* 进度轨道 */}
        <div 
          className={`absolute left-0 top-0 h-full ${getTrackColor()} transition-all duration-300 rounded-lg`}
          style={{ width: `${Math.max(12, getProgress())}%` }}
        />
        
        {/* 文本 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-medium text-gray-600 select-none">
            {getText()}
          </span>
        </div>
        
        {/* 滑块 */}
        <div
          ref={sliderRef}
          className={`absolute top-1 left-1 w-10 h-10 rounded-md shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing ${getSliderColor()} border border-gray-200 select-none`}
          style={{ 
            transform: `translateX(${slidePosition}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
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

export default WorkingSlideVerification;
