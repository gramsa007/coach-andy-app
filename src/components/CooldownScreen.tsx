import React, { useState, useEffect } from 'react';
import { CheckCircle2, Wind, Save } from 'lucide-react';
import { playBeep } from '../utils/audio';

interface Props {
  prompt: string;
  onComplete: () => void;
}

export function CooldownScreen({ prompt, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(300); 

  useEffect(() => {
    if (timeLeft <= 0) {
        playBeep(880, 'square', 0.5);
        return;
    }

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
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 sticky top-0 z-10 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1 text-teal-100">
               <CheckCircle2 size={20} />
               <span className="text-sm font-medium">Workout geschafft!</span>
            </div>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-mono text-xs font-bold text-white tracking-widest border border-white/10">
               COOL-DOWN
            </span>
          </div>
          <h1 className="text-xl font-black mt-1">Regeneration</h1>
          <p className="text-teal-100 text-[10px] flex items-center gap-1">
            <Wind size={10} /> Fahre das System runter
          </p>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm mb-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-teal-600">
                    <Wind size={24} fill="currentColor" />
                    <h3 className="font-bold text-lg">Deine Routine</h3>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {prompt}
                </div>
            </div>

            <div>
                <div className="text-center mb-8">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Restzeit</p>
                    <div className={`text-7xl font-black font-mono tracking-tighter transition-colors duration-300 ${timeLeft <= 3 ? 'text-teal-500 scale-110' : 'text-gray-800'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <button 
                    onClick={onComplete}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    Cool Down beenden & Speichern
                </button>
            </div>
        </div>
    </div>
  );
}
