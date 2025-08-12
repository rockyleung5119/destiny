import React, { useState, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronRight, Check, RotateCcw } from 'lucide-react';

interface SimpleWorkingSliderProps {
  onVerificationSuccess: () => void;
  onVerificationFailed?: () => void;
  disabled?: boolean;
  className?: string;
}

const SimpleWorkingSlider: React.FC<SimpleWorkingSliderProps> = ({
  onVerificationSuccess,
  onVerificationFailed,
  disabled = false,
  className = ''
}) => {
  const { t } = useLanguage();
  const [position, setPosition] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取容器宽度
  const getContainerWidth = () => {
    return containerRef.current ? containerRef.current.offsetWidth - 48 : 300;
  };

  // 处理验证
  const checkSuccess = (pos: number) => {
    const maxWidth = getContainerWidth();
    const threshold = maxWidth * 0.7; // 降低到70%
    console.log('验证检查 - 当前位置:', pos, '最大宽度:', maxWidth, '阈值:', threshold);

    if (pos >= threshold) {
      console.log('验证成功！');
      setIsVerified(true);
      setPosition(maxWidth);
      onVerificationSuccess();
    } else {
      console.log('验证失败，位置不足');
      setIsFailed(true);
      setPosition(0);
      onVerificationFailed?.();
      setTimeout(() => setIsFailed(false), 2000);
    }
  };



  // 鼠标按下
  const onMouseDown = (e: any) => {
    if (disabled || isVerified) return;

    console.log('鼠标按下');
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    setIsFailed(false);

    const startX = e.clientX || e.touches?.[0]?.clientX;
    const startPos = position;
    const maxWidth = getContainerWidth();
    let currentPos = startPos; // 跟踪当前位置

    const onMove = (moveEvent: any) => {
      moveEvent.preventDefault();
      const currentX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX;
      const diff = currentX - startX;
      const newPos = Math.max(0, Math.min(maxWidth, startPos + diff));
      currentPos = newPos; // 更新当前位置
      console.log('移动到:', newPos);
      setPosition(newPos);
    };

    const onEnd = () => {
      console.log('鼠标松开，最终位置:', currentPos, '最大宽度:', maxWidth);
      setDragging(false);
      checkSuccess(currentPos); // 使用当前实际位置

      // 清理事件监听器
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    // 添加事件监听器
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
  };

  // 重置
  const reset = () => {
    setIsVerified(false);
    setIsFailed(false);
    setPosition(0);
    setDragging(false);
  };

  // 获取样式
  const getSliderBg = () => {
    if (isVerified) return 'bg-green-500';
    if (isFailed) return 'bg-red-500';
    return 'bg-white';
  };

  const getTrackBg = () => {
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
    if (isVerified) return <Check className="w-4 h-4 text-white" />;
    if (isFailed) return <RotateCcw className="w-4 h-4 text-white" />;
    return <ChevronRight className="w-4 h-4 text-gray-600" />;
  };

  const getProgress = () => {
    const maxWidth = getContainerWidth();
    return maxWidth > 0 ? (position / maxWidth) * 100 : 0;
  };

  return (
    <div className={`w-full ${className}`}>
      <div 
        ref={containerRef}
        className="relative w-full h-12 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden"
      >
        {/* 进度条 */}
        <div 
          className={`absolute left-0 top-0 h-full ${getTrackBg()} transition-all duration-200 rounded-lg`}
          style={{ width: `${Math.max(12, getProgress())}%` }}
        />
        
        {/* 文字 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-medium text-gray-700 select-none">
            {getText()}
          </span>
        </div>
        
        {/* 滑块 */}
        <div
          className={`absolute top-1 left-1 w-10 h-10 rounded-md shadow-lg flex items-center justify-center border border-gray-200 cursor-grab active:cursor-grabbing select-none ${getSliderBg()} ${
            dragging ? 'scale-110' : 'scale-100'
          } transition-all duration-200`}
          style={{
            transform: `translateX(${position}px)`,
            zIndex: 10,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'auto'
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
          title="拖拽验证"
        >
          {getIcon()}
        </div>
      </div>
      
      {/* 重置按钮 */}
      {(isVerified || isFailed) && (
        <button
          onClick={reset}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {t('resetVerification')}
        </button>
      )}
    </div>
  );
};

export default SimpleWorkingSlider;
