'use client';

import { ProgressCircle } from '@/components/ui/progress-circle';

interface LoadingSpinnerProps {
  size?: number
  strokeWidth?: number
  className?: string
  text?: string
  showText?: boolean
}

export default function LoadingSpinner({
  size = 32,
  strokeWidth = 3,
  className = "text-blue-500",
  text = "Loading...",
  showText = true
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <ProgressCircle 
          value={25} 
          size={size} 
          strokeWidth={strokeWidth} 
          className={`${className} animate-spin`} 
        />
        {showText && (
          <span className="text-xs text-muted-foreground">{text}</span>
        )}
      </div>
    </div>
  );
}
