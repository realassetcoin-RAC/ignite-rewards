import React, { useState, useEffect } from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Navigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Network, 
  Shield, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import NeonCard from '@/components/futuristic/NeonCard';
import HolographicButton from '@/components/futuristic/HolographicButton';
import DataStream from '@/components/futuristic/DataStream';
import CyberGrid from '@/components/futuristic/CyberGrid';

const FuturisticDashboard = () => {
  const { user, loading } = useSecureAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  const systemData = [
    'Initializing neural networks...',
    'Loading quantum processors...',
    'Syncing blockchain data...',
    'Analyzing user patterns...',
    'Optimizing reward algorithms...',
    'Connecting to merchant APIs...',
    'Updating loyalty protocols...',
    'Calculating point distributions...'
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-r-pink-500/40 rounded-full animate-spin animation-delay-150"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <CyberGrid intensity="medium" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl rotate-45 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg rotate-12 animate-float-slow pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/30 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    PointBridge
                  </h1>
                  <p className="text-sm text-cyan-300 font-mono">NEURAL NETWORK v2.1</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 font-mono">ONLINE</span>
                <span className="text-white font-mono">{user?.email}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="group bg-black/40 backdrop-blur-sm hover:bg-black/60 border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 hover:text-white transform hover:scale-105 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-mono">EXIT</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-6 py-8 space-y-8">
        {/* System Status */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          <NeonCard title="SYSTEM STATUS" glowColor="green">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-mono">CPU</span>
                <span className="text-white font-mono">87%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '87%'}}></div>
              </div>
            </div>
          </NeonCard>

          <NeonCard title="NEURAL NET" glowColor="cyan">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-mono">ACTIVE</span>
                <span className="text-white font-mono">12.5K</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
          </NeonCard>

          <NeonCard title="BLOCKCHAIN" glowColor="purple">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-mono">SYNC</span>
                <span className="text-white font-mono">99.8%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '99.8%'}}></div>
              </div>
            </div>
          </NeonCard>

          <NeonCard title="SECURITY" glowColor="yellow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-mono">SHIELD</span>
                <span className="text-white font-mono">MAX</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
          </NeonCard>
        </div>

        {/* Main Dashboard Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          {/* Data Stream */}
          <NeonCard title="SYSTEM LOG" glowColor="cyan" className="lg:col-span-1">
            <DataStream data={systemData} speed={2000} />
          </NeonCard>

          {/* User Stats */}
          <NeonCard title="USER PROFILE" glowColor="pink" className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-mono">1,250</div>
                <div className="text-cyan-400 text-sm font-mono">POINTS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-mono">12</div>
                <div className="text-pink-400 text-sm font-mono">REFERRALS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-mono">8</div>
                <div className="text-purple-400 text-sm font-mono">REWARDS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-mono">GOLD</div>
                <div className="text-yellow-400 text-sm font-mono">LEVEL</div>
              </div>
            </div>
          </NeonCard>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-wrap gap-4 justify-center ${
          isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          <HolographicButton variant="primary">
            <Zap className="mr-2 h-4 w-4" />
            ACTIVATE REWARDS
          </HolographicButton>
          <HolographicButton variant="secondary">
            <Network className="mr-2 h-4 w-4" />
            CONNECT MERCHANTS
          </HolographicButton>
          <HolographicButton variant="accent">
            <Shield className="mr-2 h-4 w-4" />
            SECURE WALLET
          </HolographicButton>
        </div>

        {/* Advanced Analytics */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
        }`}>
          <NeonCard title="QUANTUM ANALYTICS" glowColor="purple">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-mono">PATTERN RECOGNITION</span>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  ACTIVE
                </Badge>
              </div>
              <div className="text-white font-mono text-sm">
                Analyzing user behavior patterns across 1,247 merchants...
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{width: '65%'}}></div>
              </div>
            </div>
          </NeonCard>

          <NeonCard title="NEURAL REWARDS" glowColor="green">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-mono">AI OPTIMIZATION</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  LEARNING
                </Badge>
              </div>
              <div className="text-white font-mono text-sm">
                Machine learning algorithms optimizing reward distribution...
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full animate-pulse" style={{width: '82%'}}></div>
              </div>
            </div>
          </NeonCard>
        </div>
      </main>
    </div>
  );
};

export default FuturisticDashboard;
