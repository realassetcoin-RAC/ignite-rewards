import React, { useState, useEffect } from 'react';

interface AdvancedSpaceBackgroundProps {
  className?: string;
  autoRotate?: boolean;
  rotationInterval?: number;
}

const AdvancedSpaceBackground: React.FC<AdvancedSpaceBackgroundProps> = ({ 
  className = '',
  autoRotate = true,
  rotationInterval = 30000
}) => {
  // Curated high-quality space images from Unsplash (free to use)
  const spaceImages = [
    {
      url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      name: 'Nebula Galaxy',
      description: 'Colorful nebula with stars'
    },
    {
      url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      name: 'Deep Space',
      description: 'Deep space with distant galaxies'
    },
    {
      url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      name: 'Starry Night',
      description: 'Starry night sky'
    },
    {
      url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      name: 'Cosmic Dust',
      description: 'Cosmic dust and gas clouds'
    },
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      name: 'Aurora Space',
      description: 'Aurora-like space phenomenon'
    },
    {
      url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      name: 'Galaxy Cluster',
      description: 'Distant galaxy cluster'
    }
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Preload images
  useEffect(() => {
    const preloadImages = spaceImages.map(img => {
      const image = new Image();
      image.src = img.url;
      return image;
    });

    Promise.all(preloadImages.map(img => 
      new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      })
    )).then(() => {
      setIsLoading(false);
    });
  }, []);

  // Auto-rotate images
  useEffect(() => {
    if (!autoRotate || isLoading) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % spaceImages.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval, isLoading, spaceImages.length]);

  if (isLoading) {
    return (
      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm">Loading space background...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Main space background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-2000 ease-in-out"
        style={{
          backgroundImage: `url(${spaceImages[currentImageIndex].url})`,
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* Animated stars overlay */}
      <div className="absolute inset-0">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      {/* Shooting stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-20 bg-gradient-to-b from-white to-transparent animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              transform: 'rotate(45deg)',
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Subtle nebula effect overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(147,51,234,0.4),transparent_60%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.3),transparent_60%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_70%)]"></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/60 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AdvancedSpaceBackground;
