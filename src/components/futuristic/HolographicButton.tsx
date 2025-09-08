import React from 'react';
import { Button } from '@/components/ui/button';

interface HolographicButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
  disabled?: boolean;
}

const HolographicButton: React.FC<HolographicButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false
}) => {
  const variants = {
    primary: 'from-pink-500 via-purple-500 to-indigo-500',
    secondary: 'from-cyan-400 via-blue-500 to-purple-500',
    accent: 'from-yellow-400 via-orange-500 to-red-500'
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden bg-gradient-to-r ${variants[variant]}
        text-white font-semibold px-6 py-3 rounded-lg
        transform transition-all duration-300 hover:scale-105
        hover:shadow-2xl hover:shadow-white/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
      
      {/* Holographic effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      
      <span className="relative z-10">{children}</span>
    </Button>
  );
};

export default HolographicButton;
