import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Sparkles, 
  Zap, 
  Mountain, 
  Waves, 
  Star,
  Check
} from 'lucide-react';

export type BackgroundType = 'cosmic' | 'aurora' | 'mountain' | 'ocean' | 'neon-grid' | 'particle-field' | 'geometric' | 'minimal' | 'real-space';

interface BackgroundSelectorProps {
  currentBackground: BackgroundType;
  onBackgroundChange: (background: BackgroundType) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ 
  currentBackground, 
  onBackgroundChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const backgrounds = {
    cosmic: {
      name: 'Cosmic',
      description: 'Deep space with stars and nebula',
      icon: <Star className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900'
    },
    aurora: {
      name: 'Aurora',
      description: 'Northern lights effect',
      icon: <Sparkles className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900'
    },
    mountain: {
      name: 'Mountain',
      description: 'Mountain landscape silhouette',
      icon: <Mountain className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-slate-800 via-gray-900 to-slate-800'
    },
    ocean: {
      name: 'Ocean',
      description: 'Deep ocean waves',
      icon: <Waves className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900'
    },
    'neon-grid': {
      name: 'Neon Grid',
      description: 'Cyberpunk grid pattern',
      icon: <Zap className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-black via-gray-900 to-black'
    },
    'particle-field': {
      name: 'Particle Field',
      description: 'Floating particles and light',
      icon: <Sparkles className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900'
    },
    geometric: {
      name: 'Geometric',
      description: 'Modern geometric patterns',
      icon: <Image className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
    },
    minimal: {
      name: 'Minimal',
      description: 'Clean and simple',
      icon: <Image className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    },
    'real-space': {
      name: 'Real Space',
      description: 'Actual NASA space images',
      icon: <Star className="h-4 w-4" />,
      preview: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900'
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300"
      >
        <Image className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
        Background
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
                  <Image className="h-5 w-5" />
                  <span>Choose Background</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(backgrounds).map(([key, background]) => (
                  <div
                    key={key}
                    onClick={() => {
                      onBackgroundChange(key as BackgroundType);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-105 ${
                      currentBackground === key
                        ? 'border-white/40 bg-white/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${background.preview} rounded-lg flex items-center justify-center text-white`}>
                          {background.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-medium">{background.name}</h4>
                            {currentBackground === key && (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{background.description}</p>
                        </div>
                      </div>
                      {currentBackground === key && (
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

export default BackgroundSelector;
