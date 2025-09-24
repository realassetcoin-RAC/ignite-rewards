import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Check, 
  Sparkles, 
  Zap, 
  Sun, 
  Rainbow,
  Monitor
} from 'lucide-react';

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const themeIcons = {
    'modern-dark': <Monitor className="h-4 w-4" />,
    'futuristic-neon': <Zap className="h-4 w-4" />,
    'cyberpunk': <Sparkles className="h-4 w-4" />,
    'minimal-light': <Sun className="h-4 w-4" />,
    'holographic': <Rainbow className="h-4 w-4" />
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300"
      >
        <Palette className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
        Themes
      </Button>

      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)}></div>
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-80 z-[9999]">
            <Card className="bg-black/95 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Choose Your Theme</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(themes).map(([key, theme]) => (
                <div
                  key={key}
                  onClick={() => {
                    setTheme(key as any);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-105 ${
                    currentTheme === key
                      ? 'border-white/40 bg-white/10'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 bg-gradient-to-br ${theme.accent} rounded-lg text-white`}>
                        {themeIcons[key as keyof typeof themeIcons]}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium">{theme.name}</h4>
                          {currentTheme === key && (
                            <Check className="h-4 w-4 text-green-400" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{theme.description}</p>
                      </div>
                    </div>
                    {currentTheme === key && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;
