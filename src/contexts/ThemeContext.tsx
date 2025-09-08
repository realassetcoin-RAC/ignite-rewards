import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'modern-dark' | 'futuristic-neon' | 'cyberpunk' | 'minimal-light' | 'holographic';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Record<Theme, ThemeConfig>;
}

interface ThemeConfig {
  name: string;
  description: string;
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
  border: string;
  shadow: string;
  gradient: string;
  iconStyle: string;
}

const themes: Record<Theme, ThemeConfig> = {
  'modern-dark': {
    name: 'Modern Dark',
    description: 'Elegant dark theme with glass morphism',
    background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    cardBackground: 'bg-white/5 backdrop-blur-xl border-white/10',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    accent: 'from-purple-500 to-pink-500',
    accentSecondary: 'from-blue-500 to-cyan-500',
    border: 'border-white/10',
    shadow: 'shadow-purple-500/25',
    gradient: 'bg-gradient-to-r from-white via-purple-200 to-blue-200',
    iconStyle: 'rounded-xl shadow-lg'
  },
  'futuristic-neon': {
    name: 'Futuristic Neon',
    description: 'Cyberpunk-inspired with neon accents',
    background: 'bg-gradient-to-br from-black via-gray-900 to-black',
    cardBackground: 'bg-black/40 backdrop-blur-xl border-cyan-500/30',
    textPrimary: 'text-cyan-100',
    textSecondary: 'text-gray-400',
    accent: 'from-cyan-400 to-blue-500',
    accentSecondary: 'from-pink-500 to-purple-500',
    border: 'border-cyan-500/30',
    shadow: 'shadow-cyan-500/50',
    gradient: 'bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400',
    iconStyle: 'rounded-lg shadow-lg shadow-cyan-500/25'
  },
  'cyberpunk': {
    name: 'Cyberpunk',
    description: 'High-tech with electric vibes',
    background: 'bg-gradient-to-br from-gray-900 via-purple-900 to-black',
    cardBackground: 'bg-purple-900/20 backdrop-blur-xl border-purple-500/40',
    textPrimary: 'text-purple-100',
    textSecondary: 'text-purple-300',
    accent: 'from-purple-500 to-pink-500',
    accentSecondary: 'from-yellow-400 to-orange-500',
    border: 'border-purple-500/40',
    shadow: 'shadow-purple-500/40',
    gradient: 'bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400',
    iconStyle: 'rounded-lg shadow-lg shadow-purple-500/30'
  },
  'minimal-light': {
    name: 'Minimal Light',
    description: 'Clean and minimal light theme',
    background: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
    cardBackground: 'bg-white/80 backdrop-blur-xl border-gray-200/50',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    accent: 'from-blue-500 to-indigo-500',
    accentSecondary: 'from-emerald-500 to-teal-500',
    border: 'border-gray-200/50',
    shadow: 'shadow-gray-500/20',
    gradient: 'bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600',
    iconStyle: 'rounded-lg shadow-lg'
  },
  'holographic': {
    name: 'Holographic',
    description: 'Iridescent and futuristic',
    background: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
    cardBackground: 'bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border-white/20',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-200',
    accent: 'from-pink-500 via-purple-500 to-indigo-500',
    accentSecondary: 'from-cyan-400 via-blue-500 to-purple-500',
    border: 'border-white/20',
    shadow: 'shadow-white/20',
    gradient: 'bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400',
    iconStyle: 'rounded-xl shadow-lg shadow-white/20'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('modern-dark');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('user-theme') as Theme;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('user-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
