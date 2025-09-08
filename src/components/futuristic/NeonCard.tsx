import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NeonCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'pink' | 'purple' | 'yellow' | 'green';
}

const NeonCard: React.FC<NeonCardProps> = ({ 
  title, 
  children, 
  className = '', 
  glowColor = 'cyan' 
}) => {
  const glowClasses = {
    cyan: 'shadow-cyan-500/50 border-cyan-500/30',
    pink: 'shadow-pink-500/50 border-pink-500/30',
    purple: 'shadow-purple-500/50 border-purple-500/30',
    yellow: 'shadow-yellow-500/50 border-yellow-500/30',
    green: 'shadow-green-500/50 border-green-500/30'
  };

  return (
    <Card className={`
      bg-black/40 backdrop-blur-xl border-2 ${glowClasses[glowColor]}
      hover:shadow-2xl transition-all duration-500 hover:scale-105
      relative overflow-hidden group
      ${className}
    `}>
      {/* Animated border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
      
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${glowColor === 'cyan' ? 'from-cyan-500/20 to-blue-500/20' : 
        glowColor === 'pink' ? 'from-pink-500/20 to-purple-500/20' :
        glowColor === 'purple' ? 'from-purple-500/20 to-indigo-500/20' :
        glowColor === 'yellow' ? 'from-yellow-500/20 to-orange-500/20' :
        'from-green-500/20 to-emerald-500/20'
      } rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-cyan-100 font-mono text-lg tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {children}
      </CardContent>
    </Card>
  );
};

export default NeonCard;
