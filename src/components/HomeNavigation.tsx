import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

interface HomeNavigationProps {
  className?: string;
  variant?: 'home' | 'back';
  showText?: boolean;
}

const HomeNavigation: React.FC<HomeNavigationProps> = ({ 
  className = '', 
  variant = 'home',
  showText = true 
}) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/');
  };

  const Icon = variant === 'home' ? Home : ArrowLeft;
  const text = variant === 'home' ? 'Home' : 'Back to Home';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleNavigation}
      className={`group bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 border-orange-500/30 hover:border-orange-500/50 text-white hover:text-white transform hover:scale-105 transition-all duration-300 ${className}`}
    >
      <Icon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
      {showText && text}
    </Button>
  );
};

export default HomeNavigation;
