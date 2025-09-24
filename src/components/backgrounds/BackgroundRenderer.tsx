import React from 'react';
import { BackgroundType } from './BackgroundSelector';
import SpaceBackground from './SpaceBackground';
import AdvancedSpaceBackground from './AdvancedSpaceBackground';

interface BackgroundRendererProps {
  backgroundType: BackgroundType;
  className?: string;
}

const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({ 
  backgroundType, 
  className = '' 
}) => {
  // const _cosmicBackground = () => (
  //   <>
  //     {/* Deep space gradient */}
  //     <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
  //     
  //     {/* Nebula effects */}
  //     <div className="absolute inset-0 opacity-40">
  //       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(147,51,234,0.4),transparent_60%)]"></div>
  //       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.3),transparent_60%)]"></div>
  //       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_70%)]"></div>
  //     </div>
  //     
  //     {/* Stars */}
  //     <div className="absolute inset-0">
  //       {Array.from({ length: 100 }).map((_, i) => (
  //         <div
  //           key={i}
  //           className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
  //           style={{
  //             left: `${Math.random() * 100}%`,
  //             top: `${Math.random() * 100}%`,
  //             animationDelay: `${Math.random() * 3}s`,
  //             animationDuration: `${2 + Math.random() * 2}s`
  //           }}
  //         />
  //       ))}
  //     </div>
  //     
  //     {/* Large stars */}
  //     <div className="absolute inset-0">
  //       {Array.from({ length: 20 }).map((_, i) => (
  //         <div
  //           key={i}
  //           className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
  //           style={{
  //             left: `${Math.random() * 100}%`,
  //             top: `${Math.random() * 100}%`,
  //             animationDelay: `${Math.random() * 4}s`,
  //             animationDuration: `${3 + Math.random() * 2}s`
  //           }}
  //         />
  //       ))}
  //     </div>
  //   </>
  // );

  const renderAuroraBackground = () => (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900"></div>
      
      {/* Aurora effects */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_30%,rgba(16,185,129,0.3)_50%,transparent_70%)] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(-45deg,transparent_20%,rgba(6,182,212,0.4)_50%,transparent_80%)] animate-pulse animation-delay-1000"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_40%,rgba(34,197,94,0.2)_60%,transparent_80%)] animate-pulse animation-delay-2000"></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </>
  );

  const renderMountainBackground = () => (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-gray-900 to-slate-800"></div>
      
      {/* Mountain silhouettes */}
      <div className="absolute bottom-0 left-0 w-full h-1/3">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-slate-700 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-slate-600 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-500 to-transparent"></div>
      </div>
      
      {/* Mist effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/10 to-transparent"></div>
      </div>
      
      {/* Floating clouds */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full animate-float-slow"
            style={{
              width: `${60 + Math.random() * 40}px`,
              height: `${30 + Math.random() * 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${20 + Math.random() * 40}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </>
  );

  const renderOceanBackground = () => (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900"></div>
      
      {/* Wave effects */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 opacity-40">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-blue-600/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-indigo-500/20 to-transparent"></div>
      </div>
      
      {/* Water reflections */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_40%,rgba(59,130,246,0.3)_50%,transparent_60%)] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(0deg,transparent_30%,rgba(99,102,241,0.2)_50%,transparent_70%)] animate-pulse animation-delay-1000"></div>
      </div>
      
      {/* Bubbles */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </>
  );

  const renderNeonGridBackground = () => (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[size:100px_100px] animate-pulse"></div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/50"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-cyan-500/50"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-500/50"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-500/50"></div>
      
      {/* Floating neon elements */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-cyan-500/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </>
  );

  const renderParticleFieldBackground = () => (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900"></div>
      
      {/* Particle field */}
      <div className="absolute inset-0">
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${1 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      {/* Large particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      {/* Energy waves */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.3),transparent_50%)] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.2),transparent_60%)] animate-pulse animation-delay-2000"></div>
      </div>
    </>
  );

  const renderGeometricBackground = () => (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      
      {/* Geometric shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl rotate-45 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg rotate-12 animate-float-slow pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full animate-float-delayed-2 pointer-events-none"></div>
      
      {/* Mesh background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
    </>
  );

  const renderMinimalBackground = () => (
    <>
      {/* Clean gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
      
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_50%)]"></div>
      </div>
    </>
  );

  const renderBackground = () => {
    switch (backgroundType) {
      case 'cosmic':
        return <AdvancedSpaceBackground className={className} />;
      case 'real-space':
        return <SpaceBackground className={className} />;
      case 'aurora':
        return renderAuroraBackground();
      case 'mountain':
        return renderMountainBackground();
      case 'ocean':
        return renderOceanBackground();
      case 'neon-grid':
        return renderNeonGridBackground();
      case 'particle-field':
        return renderParticleFieldBackground();
      case 'geometric':
        return renderGeometricBackground();
      case 'minimal':
        return renderMinimalBackground();
      default:
        return <AdvancedSpaceBackground className={className} />;
    }
  };

  return (
    <div className={`absolute inset-0 ${className}`}>
      {renderBackground()}
    </div>
  );
};

export default BackgroundRenderer;
