import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface Props {
  transparent?: boolean;
  initialTime?: number;
}

export function WorkoutTimer({ transparent = false, initialTime = 0 }: Props) {
  const [seconds, setSeconds] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setSeconds(initialTime);
  }, [initialTime]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (transparent) {
      return (
        <div 
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full cursor-pointer hover:bg-white/30 transition-colors border border-white/10 shadow-sm"
        >
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="font-mono text-xs font-bold text-white tracking-widest">
                {formatTime(seconds)} min
            </span>
        </div>
      )
  }

  return (
    <div 
      onClick={() => setIsActive(!isActive)}
      className="flex items-center gap-2 bg-blue-900 bg-opacity-50 px-3 py-1 rounded-lg border border-blue-400/30 cursor-pointer hover:bg-blue-800 transition-colors"
    >
      <Timer size={18} className={`text-blue-200 ${isActive ? 'animate-pulse' : ''}`} />
      <span className="font-mono text-xl font-bold text-white tracking-widest">
        {formatTime(seconds)}
      </span>
    </div>
  );
}
