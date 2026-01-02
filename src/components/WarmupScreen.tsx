import React, { useState, useEffect } from 'react';
import { ArrowLeft, Flame, Zap, Dumbbell } from 'lucide-react';
import { playBeep } from '../utils/audio';

interface Props {
  prompt: string;
  onComplete: (elapsed: number) => void;
  onBack: () => void;
}

export function WarmupScreen({ prompt, onComplete, onBack }: Props) {
  const WARMUP_DURATION = 300; 
  const [timeLeft, setTimeLeft] = useState(WARMUP_DURATION); 

  const handleFinish = () => {
      const elapsed = WARMUP_DURATION - timeLeft;
      onComplete(elapsed);
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      playBeep(880, 'square', 0.5); // Finaler Sound
      handleFinish(); 
      return;
    }

    // Countdown Sounds (bei 3, 2, 1)
    if (timeLeft <= 3 && timeLeft > 0) {
        playBeep(440, 'sine', 0.2);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4 sticky top-0 z-10 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <button onClick={onBack} className="flex items-center gap-1 text-orange-100 hover:text-white transition-colors">
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Zurück</span>
            </button>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-mono text-xs font-bold text-white tracking-widest border border-white/10">
               WARM-UP
            </span>
          </div>
          <h1 className="text-xl font-black mt-1">Aufwärmen</h1>
          <p className="text-orange-100 text-[10px] flex items-center gap-1">
            <Flame size={10} /> Mach dich bereit
          </p>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 shadow-sm mb-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-orange-600">
                    <Zap size={24} fill="currentColor" />
                    <h3 className="font-bold text-lg">Deine Routine</h3>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {prompt}
                </div>
            </div>

            <div>
                <div className="text-center mb-8">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Restzeit</p>
                    <div className={`text-7xl font-black font-mono tracking-tighter transition-colors duration-300 ${timeLeft <= 3 ? 'text-red-500 scale-110' : 'text-gray-800'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <button 
                    onClick={handleFinish}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Dumbbell size={20} />
                    Warm-up beenden & Workout starten
                </button>
            </div>
        </div>
    </div>
  );
}
