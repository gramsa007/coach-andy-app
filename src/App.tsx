import React, { useState, useEffect } from 'react';
import {
  Dumbbell, ArrowLeft, Save, Timer, Flame, Settings, Download, Upload,
  UserCircle, FileJson, Trash2, History, PlayCircle, CheckCircle2,
  CheckSquare, AlertTriangle, X, CalendarDays, Cloud, Database,
  RefreshCw, Clock, Target, ChevronRight, FileText, Copy, Check,
  Edit, RotateCcw, Package, Plus, Minus, Zap, Wind, Sparkles, ClipboardCheck
} from 'lucide-react';

// WICHTIG: Definiert SaveIcon für den gesamten Code
const SaveIcon = Save;

// --- PROMPTS & STANDARDS ---
const DEFAULT_SYSTEM_PROMPT = `Du bist Coach Andy, ein erfahrener Hyrox- und Fitness-Coach. Deine Philosophie: 1. Hyrox besteht zu 50% aus Laufen und zu 50% aus funktionaler Kraft. 2. Konsistenz schlägt Intensität. 3. Form geht immer vor Gewicht.`;
const DEFAULT_WARMUP_PROMPT = `Erstelle ein spezifisches 5-10 min Warm-up für das Workout (RAMP-Struktur).`;
const DEFAULT_COOLDOWN_PROMPT = `Erstelle ein 5-10 min Cool-down (Fokus: Parasympathikus & Mobility).`;

const prepareData = (workouts) => {
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((ex) => ({
      ...ex,
      logs: ex.logs || Array.from({ length: ex.sets }).map(() => ({ weight: '', reps: '', completed: false })),
    })),
  }));
};

const rawWorkouts = [
  {
    id: 1, week: 1, title: 'Tag 1: Kraft & Basis', type: 'strength', duration: '60 Min', focus: 'Ganzkörper-Kraftaufbau',
    color: 'border-blue-500 text-blue-600', badgeColor: 'bg-blue-100 text-blue-700',
    exercises: [
      { name: 'Kniebeugen', sets: 4, reps: '8-10', rpe: '8', note: 'Fokus auf Tiefe' },
      { name: 'Bankdrücken', sets: 3, reps: '10', rpe: '8', note: 'Kontrolliert ablassen' }
    ],
  }
];

// --- KOMPONENTEN ---

function WorkoutTimer({ initialTime = 0 }) {
  const [seconds, setSeconds] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    let interval = null;
    if (isActive) interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <div onClick={() => setIsActive(!isActive)} className="bg-white/20 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 cursor-pointer">
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`} />
      <span className="font-mono font-bold text-white">{formatTime(seconds)}</span>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('training');
  const [activeWeek, setActiveWeek] = useState(1);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('coachAndyData')) || prepareData(rawWorkouts));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('coachAndyHistory')) || []);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWarmup, setIsWarmup] = useState(false);

  const startWorkout = (workout) => {
    setActiveWorkout(JSON.parse(JSON.stringify(workout)));
    setIsWarmup(true);
  };

  const completeSet = (exIdx, setIdx) => {
    const newData = { ...activeWorkout };
    newData.exercises[exIdx].logs[setIdx].completed = !newData.exercises[exIdx].logs[setIdx].completed;
    setActiveWorkout(newData);
  };

  const finishWorkout = () => {
    const entry = { id: Date.now(), title: activeWorkout.title, date: new Date().toISOString() };
    const newHistory = [entry, ...history];
    setHistory(newHistory);
    localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));
    setActiveWorkout(null);
    setIsWarmup(false);
    setActiveTab('history');
  };

  // --- RENDERING ---

  if (activeWorkout) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-lg">
          <button onClick={() => setActiveWorkout(null)}><ArrowLeft /></button>
          <h2 className="font-bold">{activeWorkout.title}</h2>
          <WorkoutTimer />
        </div>
        <div className="p-4 space-y-4">
          {activeWorkout.exercises.map((ex, exIdx) => (
            <div key={exIdx} className="bg-white p-4 rounded-3xl shadow-sm border">
              <h3 className="font-bold mb-3">{ex.name} <span className="text-xs text-gray-400">RPE {ex.rpe}</span></h3>
              <div className="space-y-2">
                {ex.logs.map((log, sIdx) => (
                  <div key={sIdx} className="flex gap-2 items-center">
                    <input type="number" placeholder="kg" className="w-full p-2 bg-gray-50 rounded-xl border text-center" />
                    <input type="number" placeholder="reps" className="w-full p-2 bg-gray-50 rounded-xl border text-center" />
                    <button onClick={() => completeSet(exIdx, sIdx)} className={`p-2 rounded-xl border ${log.completed ? 'bg-emerald-500 text-white' : 'bg-gray-50'}`}><Check size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={finishWorkout} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-bold shadow-xl">Training abschließen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {activeTab === 'training' && (
        <>
          <header className="bg-white p-6 border-b">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">Coach Andy <Dumbbell className="text-blue-600" /></h1>
            <div className="mt-6 flex gap-2 overflow-x-auto">
              {[1, 2, 3, 4].map(w => (
                <button key={w} onClick={() => setActiveWeek(w)} className={`px-5 py-2 rounded-2xl font-bold transition-all ${activeWeek === w ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>Woche {w}</button>
              ))}
            </div>
          </header>
          <div className="p-4 space-y-4">
            {data.filter(w => w.week === activeWeek).map(w => (
              <div key={w.id} onClick={() => startWorkout(w)} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center group active:scale-95 transition-transform">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${w.badgeColor}`}>{w.type}</span>
                  <h3 className="text-lg font-bold mt-2 text-slate-900">{w.title}</h3>
                  <div className="flex gap-3 mt-1 text-gray-400 text-xs font-medium">
                    <span className="flex items-center gap-1"><Clock size={12}/> {w.duration}</span>
                    <span className="flex items-center gap-1"><Target size={12}/> {w.focus}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors"><ChevronRight className="text-slate-300 group-hover:text-blue-600" /></div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="p-6">
          <h1 className="text-2xl font-black mb-6">Verlauf</h1>
          <div className="space-y-4">
            {history.map(h => (
              <div key={h.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex justify-between items-center">
                <div><h4 className="font-bold">{h.title}</h4><p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</p></div>
                <CheckCircle2 className="text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="p-6 space-y-4">
          <h1 className="text-2xl font-black mb-6">Profil & Einstellungen</h1>
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black">AG</div>
               <div><h3 className="font-bold">Andreas Grams</h3><p className="text-xs text-slate-400">Hyrox Athlet</p></div>
             </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem] p-2 flex justify-between z-50">
        {[
          { id: 'profile', icon: UserCircle, label: 'Profil' },
          { id: 'training', icon: Dumbbell, label: 'Training' },
          { id: 'history', icon: History, label: 'Verlauf' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex flex-col items-center py-3 rounded-[2rem] transition-all ${activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
            <item.icon size={20} />
            <span className="text-[10px] font-bold mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
