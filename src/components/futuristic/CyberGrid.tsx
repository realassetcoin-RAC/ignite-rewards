import React from 'react';

interface CyberGridProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const CyberGrid: React.FC<CyberGridProps> = ({ 
  className = '', 
  intensity = 'medium' 
}) => {
  const intensityClasses = {
    low: 'opacity-10',
    medium: 'opacity-20',
    high: 'opacity-30'
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Grid pattern */}
      <div className={`
        absolute inset-0
        bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)]
        bg-[size:50px_50px]
        ${intensityClasses[intensity]}
      `}></div>
      
      {/* Animated grid lines */}
      <div className={`
        absolute inset-0
        bg-[linear-gradient(rgba(6,182,212,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.2)_1px,transparent_1px)]
        bg-[size:100px_100px]
        ${intensityClasses[intensity]}
        animate-pulse
      `}></div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/50"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-cyan-500/50"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-500/50"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-500/50"></div>
    </div>
  );
};

export default CyberGrid;
