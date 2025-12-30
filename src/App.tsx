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

const SaveIcon = Save;

// --- STANDARDS & PROMPTS ---
const DEFAULT_SYSTEM_PROMPT = `Du bist Coach Andy, ein erfahrener Hyrox- und Fitness-Coach. Deine Philosophie: 1. Hyrox besteht zu 50% aus Laufen und zu 50% aus funktionaler Kraft. 2. Konsistenz schlägt Intensität. 3. Form geht immer vor Gewicht.`;
const DEFAULT_WARMUP_PROMPT = `Erstelle ein spezifisches Warm-up (5-10 Min) für das Workout (RAMP-Struktur).`;
const DEFAULT_COOLDOWN_PROMPT = `Erstelle ein Cool Down (5-10 Min) zur Regeneration.`;
const DEFAULT_PLAN_PROMPT = `Erstelle einen neuen 4-Wochen-Trainingsplan als JSON für meine App.`;

const DEFAULT_EQUIPMENT = [
  { category: 'Langhantel', items: ['Olympia-Stange', 'Gewichte bis 100kg'] },
  { category: 'Kettlebells', items: ['8 kg', '12 kg', '16 kg'] },
  { category: 'Sonstiges', items: ['Klimmzugstange', 'Laufschuhe'] }
];

const prepareData = (workouts) => workouts.map(w => ({
  ...w,
  exercises: w.exercises.map(ex => ({
    ...ex,
    logs: ex.logs || Array.from({ length: ex.sets }).map(() => ({ weight: '', reps: '', completed: false }))
  }))
}));

const rawWorkouts = [
  { id: 1, week: 1, title: 'Tag 1: Kraft Basis', type: 'strength', duration: '60 Min', focus: 'Grundkraft', color: 'border-blue-500 text-blue-600', badgeColor: 'bg-blue-100 text-blue-700', exercises: [{ name: 'Kniebeugen', sets: 3, reps: '10', rpe: '8' }] }
];

// --- HILFSKOMPONENTEN ---

function WorkoutTimer({ initialTime = 0 }) {
  const [seconds, setSeconds] = useState(initialTime);
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const format = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  return <div className="bg-white/20 px-3 py-1 rounded-full font-mono text-white text-sm border border-white/10">{format(seconds)}</div>;
}

// --- MODALE ---

function PromptModal({ isOpen, onClose, title, icon: Icon, currentPrompt, onSave, colorClass }) {
  const [text, setText] = useState(currentPrompt);
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className={`p-6 text-white flex justify-between items-center ${colorClass}`}>
          <h3 className="font-bold flex items-center gap-2"><Icon size={20}/> {title}</h3>
          <button onClick={onClose}><X/></button>
        </div>
        <div className="p-6 bg-gray-50"><textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-64 p-4 rounded-xl border font-mono text-sm"/></div>
        <div className="p-4 border-t flex gap-2">
           <button onClick={handleCopy} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2">{copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'Kopiert' : 'Kopieren'}</button>
           <button onClick={() => { onSave(text); onClose(); }} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">Speichern</button>
        </div>
      </div>
    </div>
  );
}

function EquipmentModal({ isOpen, onClose, equipment, onSave }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Package className="text-blue-600"/> Equipment Editor</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">{equipment.map((c, i) => <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100"><h4 className="font-bold text-sm text-slate-800">{c.category}</h4><p className="text-xs text-gray-500 mt-1">{c.items.join(', ')}</p></div>)}</div>
        <button onClick={onClose} className="w-full mt-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">Fertig</button>
      </div>
    </div>
  );
}

function PastePlanModal({ isOpen, onClose, onImport }) {
  const [jsonText, setJsonText] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-900">Plan einfügen</h3><button onClick={onClose}><X size={24} /></button></div>
        <textarea className="w-full h-64 p-4 rounded-xl border font-mono text-xs mb-4" value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder='[...] hinterlege hier den JSON Code' />
        <button onClick={() => { try { onImport(JSON.parse(jsonText)); onClose(); } catch(e) { alert("Fehler beim JSON Import"); } }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Laden</button>
      </div>
    </div>
  );
}

// --- HAUPT APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState('training');
  const [activeWeek, setActiveWeek] = useState(1);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('coachAndyData')) || prepareData(rawWorkouts));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('coachAndyHistory')) || []);
  const [equipment, setEquipment] = useState(() => JSON.parse(localStorage.getItem('coachAndyEquipment')) || DEFAULT_EQUIPMENT);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [showPastePlanModal, setShowPastePlanModal] = useState(false);

  const saveWorkout = () => {
    const entry = { id: Date.now(), title: activeWorkout.title, date: new Date().toISOString(), week: activeWorkout.week, type: activeWorkout.type, snapshot: activeWorkout };
    const newHistory = [entry, ...history];
    setHistory(newHistory);
    localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));
    setActiveWorkout(null);
    setActiveTab('history');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({data, history, equipment})], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'coach-andy-backup.json'; a.click();
  };

  const handlePasteImport = (importedData) => {
    const prepared = prepareData(importedData);
    setData(prepared);
    localStorage.setItem('coachAndyData', JSON.stringify(prepared));
    alert("Neuer Plan erfolgreich geladen!");
  };

  // --- RENDER INHALT (SMARTPHONE-CONTENT) ---
  const renderAppContent = () => {
    if (activeWorkout) return (
      <div className="flex-1 bg-slate-50 relative flex flex-col h-full overflow-hidden">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-lg shrink-0 z-10">
          <button onClick={() => setActiveWorkout(null)} className="p-2 bg-white/10 rounded-xl"><ArrowLeft/></button>
          <h2 className="font-bold text-lg">{activeWorkout.title}</h2>
          <WorkoutTimer />
        </div>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
          {activeWorkout.exercises.map((ex, exIdx) => (
            <div key={exIdx} className="bg-white p-5 rounded-[2.5rem] border shadow-sm">
              <h3 className="font-bold mb-4 text-slate-800 text-lg flex justify-between">{ex.name} <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">RPE {ex.rpe}</span></h3>
              <div className="space-y-3">
                {ex.logs.map((log, sIdx) => (
                  <div key={sIdx} className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-300 border border-slate-100">{sIdx+1}</div>
                    <input type="number" placeholder="kg" className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center font-black focus:border-blue-500 outline-none" value={log.weight} onChange={(e) => { const d = {...activeWorkout}; d.exercises[exIdx].logs[sIdx].weight = e.target.value; setActiveWorkout(d); }} />
                    <input type="text" placeholder="reps" className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center font-black focus:border-blue-500 outline-none" value={log.reps} onChange={(e) => { const d = {...activeWorkout}; d.exercises[exIdx].logs[sIdx].reps = e.target.value; setActiveWorkout(d); }} />
                    <button onClick={() => { const d = {...activeWorkout}; d.exercises[exIdx].logs[sIdx].completed = !log.completed; setActiveWorkout(d); }} className={`p-3 rounded-2xl border transition-all ${log.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-200'}`}><Check strokeWidth={3} size={24}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={saveWorkout} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-2xl mt-8 flex items-center justify-center gap-3 active:scale-95 transition-transform"><SaveIcon size={24}/> TRAINING ABSCHLIESSEN</button>
        </div>
      </div>
    );

    return (
      <div className="flex-1 bg-slate-50 relative flex flex-col h-full overflow-hidden">
        <PromptModal isOpen={activeModal === 'system'} onClose={() => setActiveModal(null)} title="Coach Andy Philosophie" icon={FileText} currentPrompt={DEFAULT_SYSTEM_PROMPT} onSave={() => {}} colorClass="bg-blue-600" />
        <PromptModal isOpen={activeModal === 'plan'} onClose={() => setActiveModal(null)} title="KI Plan Generator" icon={Sparkles} currentPrompt={DEFAULT_PLAN_PROMPT} onSave={() => {}} colorClass="bg-indigo-600" />
        <EquipmentModal isOpen={activeModal === 'equipment'} onClose={() => setActiveModal(null)} equipment={equipment} onSave={setEquipment} />
        <PastePlanModal isOpen={showPastePlanModal} onClose={() => setShowPastePlanModal(false)} onImport={handlePasteImport} />

        {activeTab === 'training' && (
          <div className="flex flex-col h-full">
            <header className="bg-white p-6 border-b shadow-sm shrink-0 z-10 rounded-b-[2rem]">
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">Andy <Dumbbell className="text-blue-600" size={32}/></h1>
              <div className="mt-8 flex gap-2">{[1, 2, 3, 4].map(w => (
                <button key={w} onClick={() => setActiveWeek(w)} className={`flex-1 py-3 rounded-2xl font-black transition-all ${activeWeek === w ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-300'}`}>W{w}</button>
              ))}</div>
            </header>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-32">
              {data.filter(w => w.week === activeWeek).map(w => (
                <div key={w.id} onClick={() => setActiveWorkout(JSON.parse(JSON.stringify(w)))} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex justify-between items-center group active:scale-95 transition-all cursor-pointer">
                  <div className="flex-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${w.badgeColor}`}>{w.type}</span>
                    <h3 className="text-xl font-bold mt-2 text-slate-800">{w.title}</h3>
                    <div className="flex gap-4 mt-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Clock size={12}/> {w.duration}</span>
                      <span className="flex items-center gap-1"><Target size={12}/> {w.focus}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6 flex-1 overflow-y-auto pb-32">
            <h1 className="text-3xl font-black mb-8 text-slate-900">Verlauf</h1>
            <div className="space-y-4">
              {history.map(h => (
                <div key={h.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 flex justify-between items-center shadow-sm active:scale-95 transition-transform">
                  <div>
                    <h4 className="font-bold text-slate-800">{h.title}</h4>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] font-black text-slate-300 uppercase">{new Date(h.date).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase">Woche {h.week}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24}/></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-32">
            <h1 className="text-3xl font-black mb-4">Einstellungen</h1>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <Cloud className="absolute -right-12 -bottom-12 w-48 h-48 opacity-5" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><Database className="text-blue-400"/> KI & Daten</h3>
                <p className="text-xs text-slate-400 mb-8 leading-relaxed">Verwalte deine Prompts, dein Equipment und erstelle Backups.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setActiveModal('system')} className="bg-white/10 hover:bg-white/20 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-3 transition-colors"><FileText className="text-blue-400" size={24}/> Philosophie</button>
                  <button onClick={() => setActiveModal('plan')} className="bg-white/10 hover:bg-white/20 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-3 transition-colors"><Sparkles className="text-indigo-400" size={24}/> Plan Generator</button>
                  <button onClick={() => setActiveModal('equipment')} className="bg-white/10 hover:bg-white/20 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-3 transition-colors col-span-2"><Package className="text-emerald-400" size={24}/> Equipment Editor</button>
                  <button onClick={exportData} className="bg-blue-600 hover:bg-blue-500 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-3 transition-colors"><Download size={24}/> Backup</button>
                  <button onClick={() => setShowPastePlanModal(true)} className="bg-emerald-600 hover:bg-emerald-500 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-3 transition-colors"><ClipboardCheck size={24}/> Plan Import</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="absolute bottom-8 left-6 right-6 bg-white/90 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-2 flex justify-between z-50">
          {[
            { id: 'profile', icon: UserCircle, label: 'Profil' },
            { id: 'training', icon: Dumbbell, label: 'Training' },
            { id: 'history', icon: History, label: 'Verlauf' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab === item.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-300 hover:text-slate-500'}`}>
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2}/>
              <span className="text-[10px] font-black mt-2 uppercase tracking-[0.1em]">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  // --- FINALER RETURN (SMARTPHONE RAHMEN) ---
  return (
    <div className="min-h-screen bg-slate-200 md:flex md:justify-center md:items-center md:py-8 font-sans">
      <div className="w-full h-full min-h-screen md:min-h-[850px] md:max-h-[90vh] md:w-[420px] bg-slate-50 md:rounded-[3rem] md:shadow-2xl md:border-4 md:border-slate-900 relative overflow-hidden flex flex-col">
        {renderAppContent()}
      </div>
    </div>
  );
}
