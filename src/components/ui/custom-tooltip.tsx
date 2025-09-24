import React from 'react';
import { HelpCircle } from 'lucide-react';

interface CustomTooltipProps {
  content: string;
  className?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ content, className = "" }) => {
  return (
    <div className={`relative group ${className}`}>
      <HelpCircle className="w-3 h-3 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 max-w-[200px]">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default CustomTooltip;






