import React, { useEffect, useState } from 'react';

interface DataStreamProps {
  data: string[];
  speed?: number;
  className?: string;
}

const DataStream: React.FC<DataStreamProps> = ({ 
  data, 
  speed = 1000, 
  className = '' 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedData, setDisplayedData] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, speed);

    return () => clearInterval(interval);
  }, [data.length, speed]);

  useEffect(() => {
    setDisplayedData(prev => {
      const newData = [...prev, data[currentIndex]];
      return newData.slice(-5); // Keep only last 5 items
    });
  }, [currentIndex, data]);

  return (
    <div className={`font-mono text-sm space-y-1 ${className}`}>
      {displayedData.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className={`
            text-cyan-400 opacity-${100 - (index * 20)}
            transition-all duration-500
            ${index === displayedData.length - 1 ? 'animate-pulse' : ''}
          `}
        >
          <span className="text-green-400">$</span> {item}
        </div>
      ))}
    </div>
  );
};

export default DataStream;
