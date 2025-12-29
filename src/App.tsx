import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  ArrowLeft,
  Save,
  Timer,
  Flame,
  Settings,
  Download,
  Upload,
  UserCircle,
  FileJson,
  Trash2,
  History,
  PlayCircle,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  X,
  CalendarDays,
  Cloud,
  Database,
  RefreshCw,
  Clock,
  Target,
  ChevronRight,
  FileText,
  Copy,
  Check,
  Edit,
  RotateCcw,
  Package,
  Plus,
  Minus,
  Zap,
  Wind,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';

// WICHTIG: Definiert SaveIcon für den gesamten Code
const SaveIcon = Save;

// --- STANDARD PROMPTS ---
const DEFAULT_SYSTEM_PROMPT = `Du bist Coach Andy, ein erfahrener Hyrox- und Fitness-Coach.
Deine Philosophie:
1. Hyrox besteht zu 50% aus Laufen und zu 50% aus funktionaler Kraft.
2. Konsistenz schlägt Intensität.
3. Form geht immer vor Gewicht.

Deine Aufgaben:
- Erstelle progressive Trainingspläne (Kraft, Ausdauer, Hyrox-Sim).
- Motiviere den Athleten, aber achte auf Verletzungsprävention.
- Nutze RPE (Rate of Perceived Exertion) zur Steuerung der Intensität.
- Wenn der Athlet Equipment-Einschränkungen hat (z.B. nur Kettlebells), passe den Plan kreativ an.`;

const DEFAULT_WARMUP_PROMPT = `Du bist Coach Andy. Deine Aufgabe ist es, ein spezifisches Warm-up (5-10 Minuten) für das anstehende Workout zu erstellen.

Deine Philosophie fürs Aufwärmen:
1. "Warm-up to perform": Wir wärmen uns auf, um Leistung zu bringen.
2. Dynamik vor Statik: Keine langen Halteübungen.
3. Spezifität: Bereite genau die Gelenke und Muskeln vor.

Struktur (RAMP): Raise, Activate, Mobilize, Potentiate.`;

const DEFAULT_COOLDOWN_PROMPT = `Du bist Coach Andy. Deine Aufgabe ist es, ein Cool Down (5-10 Minuten) zu erstellen, um den Körper herunterzufahren.

Deine Philosophie fürs Cool Down:
1. Parasympathikus aktivieren: Atmung beruhigen, Stress abbauen.
2. Statisches Dehnen: Jetzt ist die Zeit für längere Dehnübungen (30-60sek halten).
3. Mobility: Fokus auf die Muskelgruppen, die gerade trainiert wurden.`;

const DEFAULT_PLAN_PROMPT = `Erstelle einen neuen 4-Wochen-Trainingsplan (3-4 Einheiten pro Woche) für Hyrox/Functional Fitness.

WICHTIG: Antworte NUR mit validem JSON Code (kein Text davor oder danach), der exakt diese Struktur hat, damit meine App ihn lesen kann:

[
  {
    "id": 1,
    "week": 1,
    "title": "Titel des Workouts",
    "type": "strength" | "circuit" | "endurance",
    "duration": "60 Min",
    "focus": "Kurze Beschreibung",
    "color": "border-blue-500 text-blue-600",
    "badgeColor": "bg-blue-100 text-blue-700",
    "exercises": [
      { "name": "Übungsname", "sets": 3, "reps": "10-12", "rpe": "8", "note": "Hinweis" }
    ]
  }
]`;

const DEFAULT_EQUIPMENT = [
  { category: 'Langhantel', items: ['Olympia-Stange', 'Gewichte bis 100kg', 'Power Rack'] },
  { category: 'Kettlebells', items: ['4 kg', '6 kg', '8 kg', '12 kg'] },
  { category: 'Bodyweight & Sonstiges', items: ['Klimmzugstange', 'Therabänder', 'Laufschuhe'] },
];

const prepareData = (workouts) => {
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((ex) => ({
      ...ex,
      logs: ex.logs || Array.from({ length: ex.sets }).map(() => ({
        weight: '', reps: '', completed: false,
      })),
    })),
  }));
};

const rawWorkouts = [
  {
    id: 1, week: 1, title: 'Tag 1: KB Kraft', type: 'strength', duration: '45-60 Min', focus: 'Ganzkörper & Basis',
    color: 'border-blue-500 text-blue-600', badgeColor: 'bg-blue-100 text-blue-700',
    exercises: [
      { name: 'Goblet Squats (KB)', sets: 3, reps: '10-12', rpe: '8', note: 'Nimm die 8er oder 12er' },
      { name: 'Schulterdrücken', sets: 3, reps: '8-10', rpe: '8', note: 'Pro Seite' },
    ],
  }
];

function WorkoutTimer({ transparent = false, initialTime = 0 }) {
  const [seconds, setSeconds] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => { setSeconds(initialTime); }, [initialTime]);
  useEffect(() => {
    let interval = null;
    if (isActive) { interval = setInterval(() => { setSeconds((s) => s + 1); }, 1000); }
    return () => clearInterval(interval);
  }, [isActive]);
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <div onClick={() => setIsActive(!isActive)} className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer ${transparent ? 'bg-white/20 border border-white/10' : 'bg-blue-900/50 border border-blue-400/30'}`}>
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`}></div>
      <span className="font-mono text-sm font-bold text-white tracking-widest">{formatTime(seconds)}</span>
    </div>
  );
}

function WarmupScreen({ prompt, onComplete, onBack }) {
  const [timeLeft, setTimeLeft] = useState(300);
  useEffect(() => {
    if (timeLeft <= 0) { onComplete(300); return; }
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4 shadow-lg">
        <button onClick={onBack} className="flex items-center gap-1 text-orange-100 mb-2"><ArrowLeft size={20} /> Zurück</button>
        <h1 className="text-xl font-black">Aufwärmen</h1>
      </div>
      <div className="flex-1 p-6 flex flex-col">
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 mb-6 flex-1 overflow-y-auto font-medium">{prompt}</div>
        <div className="text-center mb-8"><div className="text-7xl font-black text-gray-800 font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div></div>
        <button onClick={() => onComplete(300 - timeLeft)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl">Start Workout</button>
      </div>
    </div>
  );
}

function CooldownScreen({ prompt, onComplete }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 shadow-lg"><h1 className="text-xl font-black">Cool-down</h1></div>
      <div className="flex-1 p-6 flex flex-col">
        <div className="bg-teal-50 border border-teal-100 rounded-3xl p-6 mb-6 flex-1 overflow-y-auto font-medium">{prompt}</div>
        <button onClick={onComplete} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"><SaveIcon size={20} /> Speichern</button>
      </div>
    </div>
  );
}

function PastePlanModal({ isOpen, onClose, onImport }) {
  const [jsonText, setJsonText] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-900">Plan einfügen</h3><button onClick={onClose}><X size={24} /></button></div>
        <textarea className="w-full h-64 p-4 rounded-xl border font-mono text-xs mb-4" value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder='[...] hinterlege hier den JSON Code' />
        <button onClick={() => { onImport(JSON.parse(jsonText)); onClose(); }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Laden</button>
      </div>
    </div>
  );
}

function ExitDialog({ isOpen, onSave, onDiscard, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <h3 className="text-lg font-bold mb-4">Training verlassen?</h3>
        <button onClick={onSave} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mb-2">Speichern & Beenden</button>
        <button onClick={onDiscard} className="w-full border-2 border-red-100 text-red-600 font-bold py-3 rounded-xl mb-2">Verwerfen</button>
        <button onClick={onCancel} className="text-gray-400 text-sm">Abbrechen</button>
      </div>
    </div>
  );
}

function PromptModal({ isOpen, onClose, title, icon: Icon, currentPrompt, onSave, colorClass }) {
  const [text, setText] = useState(currentPrompt);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className={`p-6 text-white flex justify-between items-center ${colorClass}`}><h3 className="font-bold flex items-center gap-2"><Icon size={20} /> {title}</h3><button onClick={onClose}><X size={24} /></button></div>
        <div className="p-6 bg-gray-50"><textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-64 p-4 rounded-xl border font-mono text-sm" /></div>
        <div className="p-4 border-t flex gap-2"><button onClick={() => { onSave(text); onClose(); }} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">Speichern</button></div>
      </div>
    </div>
  );
}

function EquipmentModal({ isOpen, onClose, equipment, onSave }) {
  const [local, setLocal] = useState(equipment);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Package size={20} /> Equipment</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">{local.map((cat, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl"><h4 className="font-bold mb-2">{cat.category}</h4><div className="flex flex-wrap gap-2">{cat.items.join(', ')}</div></div>
        ))}</div>
        <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-4">Schließen</button>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('training');
  const [activeWeek, setActiveWeek] = useState(1);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('coachAndyData')) || prepareData(rawWorkouts));
  const [systemPrompt, setSystemPrompt] = useState(localStorage.getItem('coachAndyPrompt') || DEFAULT_SYSTEM_PROMPT);
  const [warmupPrompt, setWarmupPrompt] = useState(localStorage.getItem('coachAndyWarmupPrompt') || DEFAULT_WARMUP_PROMPT);
  const [cooldownPrompt, setCooldownPrompt] = useState(localStorage.getItem('coachAndyCooldownPrompt') || DEFAULT_COOLDOWN_PROMPT);
  const [planPrompt, setPlanPrompt] = useState(localStorage.getItem('coachAndyPlanPrompt') || DEFAULT_PLAN_PROMPT);
  const [equipment, setEquipment] = useState(() => JSON.parse(localStorage.getItem('coachAndyEquipment')) || DEFAULT_EQUIPMENT);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('coachAndyHistory')) || []);

  const [activeWorkoutData, setActiveWorkoutData] = useState(null);
  const [isWarmupActive, setIsWarmupActive] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showPastePlanModal, setShowPastePlanModal] = useState(false);
  const [activePromptModal, setActivePromptModal] = useState(null);

  const startWorkout = (id) => {
    const workout = data.find(w => w.id === id);
    if (workout) { setActiveWorkoutData(JSON.parse(JSON.stringify(workout))); setIsWarmupActive(true); }
  };

  const toggleSetComplete = (exIdx, setIdx) => {
    const newData = { ...activeWorkoutData };
    newData.exercises[exIdx].logs[setIdx].completed = !newData.exercises[exIdx].logs[setIdx].completed;
    setActiveWorkoutData(newData);
  };

  const handleFinalizeWorkout = () => {
    const newHistory = [{ id: Date.now(), workoutTitle: activeWorkoutData.title, date: new Date().toISOString(), week: activeWorkoutData.week, type: activeWorkoutData.type, snapshot: activeWorkoutData }, ...history];
    setHistory(newHistory);
    localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));
    setIsCooldownActive(false); setActiveWorkoutData(null); setActiveTab('training');
  };

  if (activeWorkoutData && isWarmupActive) return <WarmupScreen prompt={warmupPrompt} onComplete={() => setIsWarmupActive(false)} onBack={() => setActiveWorkoutData(null)} />;
  if (activeWorkoutData && isCooldownActive) return <CooldownScreen prompt={cooldownPrompt} onComplete={handleFinalizeWorkout} />;
  
  if (activeWorkoutData) return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ExitDialog isOpen={showExitDialog} onSave={() => { setIsCooldownActive(true); setShowExitDialog(false); }} onDiscard={() => { setActiveWorkoutData(null); setShowExitDialog(false); }} onCancel={() => setShowExitDialog(false)} />
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sticky top-0 z-10 shadow-lg flex justify-between items-center">
        <button onClick={() => setShowExitDialog(true)} className="flex items-center gap-1 text-blue-200"><ArrowLeft size={20} /> Beenden</button>
        <WorkoutTimer transparent={true} />
      </div>
      <div className="p-4 space-y-4">{activeWorkoutData.exercises.map((ex, exIdx) => (
        <div key={exIdx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">{ex.name} <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">RPE {ex.rpe}</span></h3>
          <div className="space-y-3">{ex.logs.map((log, setIdx) => (
            <div key={setIdx} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-[10px] font-bold flex items-center justify-center">{setIdx + 1}</span>
              <input type="number" placeholder="kg" value={log.weight} onChange={(e) => { const d = { ...activeWorkoutData }; d.exercises[exIdx].logs[setIdx].weight = e.target.value; setActiveWorkoutData(d); }} className="w-20 p-2 border rounded-xl" />
              <input type="text" placeholder="wdh" value={log.reps} onChange={(e) => { const d = { ...activeWorkoutData }; d.exercises[exIdx].logs[setIdx].reps = e.target.value; setActiveWorkoutData(d); }} className="w-20 p-2 border rounded-xl" />
              <button onClick={() => toggleSetComplete(exIdx, setIdx)} className={`flex-1 p-2 rounded-xl border ${log.completed ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-300'}`}><Check size={20} className="mx-auto" /></button>
            </div>
          ))}</div>
        </div>
      ))}<button onClick={() => setIsCooldownActive(true)} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><SaveIcon size={20} /> Training beenden</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PromptModal isOpen={activePromptModal === 'system'} onClose={() => setActivePromptModal(null)} title="Philosophie" icon={FileText} currentPrompt={systemPrompt} onSave={setSystemPrompt} colorClass="bg-blue-600" />
      <PromptModal isOpen={activePromptModal === 'warmup'} onClose={() => setActivePromptModal(null)} title="Warm-up" icon={Zap} currentPrompt={warmupPrompt} onSave={setWarmupPrompt} colorClass="bg-orange-500" />
      <PromptModal isOpen={activePromptModal === 'cooldown'} onClose={() => setActivePromptModal(null)} title="Cool-down" icon={Wind} currentPrompt={cooldownPrompt} onSave={setCooldownPrompt} colorClass="bg-teal-500" />
      <EquipmentModal isOpen={showEquipmentModal} onClose={() => setShowEquipmentModal(false)} equipment={equipment} onSave={setEquipment} />
      <PastePlanModal isOpen={showPastePlanModal} onClose={() => setShowPastePlanModal(false)} onImport={(d) => { setData(prepareData(d)); localStorage.setItem('coachAndyData', JSON.stringify(d)); }} />

      {activeTab === 'training' && (
        <><header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 shadow-lg text-white">
          <h1 className="text-2xl font-black mb-6">Coach Andy <Dumbbell className="inline" size={24} /></h1>
          <div className="flex gap-2 bg-blue-800/30 p-1 rounded-xl">{[1, 2, 3, 4].map(w => (
            <button key={w} onClick={() => setActiveWeek(w)} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeWeek === w ? 'bg-white text-blue-700' : 'text-blue-100'}`}>W{w}</button>
          ))}</div>
        </header>
        <main className="p-4 space-y-4">{data.filter(w => w.week === activeWeek).map(workout => (
          <div key={workout.id} onClick={() => startWorkout(workout.id)} className={`p-5 rounded-2xl bg-white border-l-4 ${workout.color} shadow-sm cursor-pointer active:scale-95 transition-all`}>
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold">{workout.title}</h3><ChevronRight className="text-gray-300" /></div>
            <p className="text-xs text-gray-500">{workout.focus}</p>
          </div>
        ))}</main></>
      )}

      {activeTab === 'profile' && (
        <div className="p-6 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-6 text-white flex justify-between items-center shadow-xl">
            <div><h3 className="font-bold text-lg">Cloud Sync</h3><p className="text-xs text-gray-400">Backup & Restore</p></div>
            <div className="flex gap-2">
              <button onClick={() => setShowPastePlanModal(true)} className="p-3 bg-emerald-600 rounded-xl"><ClipboardCheck size={20} /></button>
            </div>
          </div>
          <div onClick={() => setShowEquipmentModal(true)} className="bg-white p-6 rounded-3xl shadow-sm flex justify-between items-center cursor-pointer">
            <div className="flex items-center gap-3"><Package className="text-indigo-600" /> <h3 className="font-bold">Equipment</h3></div><ChevronRight className="text-gray-300" />
          </div>
          <div onClick={() => setActivePromptModal('system')} className="bg-white p-6 rounded-3xl shadow-sm flex justify-between items-center cursor-pointer">
            <div className="flex items-center gap-3"><FileText className="text-blue-600" /> <h3 className="font-bold">Philosophie</h3></div><ChevronRight className="text-gray-300" />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-6 space-y-4"><h1 className="text-2xl font-black mb-4">Verlauf</h1>
          {history.map((entry, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
              <div className="flex justify-between items-center mb-1"><h3 className="font-bold">{entry.workoutTitle}</h3><span className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</span></div>
              <p className="text-xs text-gray-500">Woche {entry.week} • {entry.type}</p>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 w-full bg-white border-t p-4 flex justify-around text-xs font-medium z-20 shadow-2xl">
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-800' : 'text-gray-400'}`}><UserCircle />Profil</button>
        <button onClick={() => setActiveTab('training')} className={`flex flex-col items-center gap-1 ${activeTab === 'training' ? 'text-blue-800' : 'text-gray-400'}`}><Dumbbell />Training</button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-blue-800' : 'text-gray-400'}`}><History />Verlauf</button>
      </div>
    </div>
  );
}

export default App;
