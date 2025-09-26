'use client';

import { ProgressCircle } from '@/components/ui/progress-circle';

interface PageLoaderProps {
  message?: string
  size?: number
  className?: string
}

export default function PageLoader({
  message = "Loading...",
  size = 48,
  className = "text-blue-500"
}: PageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg shadow-lg border">
        <ProgressCircle 
          value={25} 
          size={size} 
          strokeWidth={4} 
          className={`${className} animate-spin`} 
        />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">Please wait while we process your request</p>
        </div>
      </div>
    </div>
  );
}
