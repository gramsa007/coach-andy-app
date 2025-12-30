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
  Save as SaveIcon,
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
  ClipboardCheck
} from 'lucide-react';

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

// --- ANGEPASSTER PLAN PROMPT (MIT CODE-BLOCK ZWANG) ---
const DEFAULT_PLAN_PROMPT = `Erstelle einen neuen 4-Wochen-Trainingsplan (3-4 Einheiten pro Woche) für Hyrox/Functional Fitness.

WICHTIGE ANWEISUNG FÜR DAS OUTPUT-FORMAT:
Bitte verpacke die Antwort IMMER in einen Markdown-Code-Block (Start mit \`\`\`json und Ende mit \`\`\`).
Dadurch erhalte ich einen "Kopieren"-Button.

Der Inhalt des Code-Blocks muss ein valides JSON-Array sein mit exakt dieser Struktur:
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
]

ANWEISUNG ZUR PROGRESSION:
Analysiere meinen Trainingsverlauf der letzten 4 Wochen (siehe unten).
- Wenn ich mich bei Übungen gesteigert habe, erhöhe leicht das Volumen oder die Intensität.
- Wenn ich stagniert habe, variiere den Reiz.
- Berücksichtige strikt mein verfügbares Equipment (siehe unten).`;

// --- EQUIPMENT LISTE ---
const DEFAULT_EQUIPMENT = [
  { category: 'Langhantel', items: ['Olympia-Stange', 'Gewichte bis 100kg', 'Power Rack'] },
  { category: 'Kettlebells', items: ['4 kg', '6 kg', '8 kg', '12 kg'] },
  { category: 'Bodyweight & Sonstiges', items: ['Klimmzugstange', 'Therabänder (div. Stärken)', 'Laufschuhe'] }
];

// --- HILFSFUNKTION: Daten vorbereiten ---
const prepareData = (workouts) => {
  return workouts.map(workout => ({
    ...workout,
    exercises: workout.exercises.map(ex => ({
      ...ex,
      logs: ex.logs || Array.from({ length: ex.sets }).map(() => ({
        weight: '',
        reps: '',
        completed: false
      }))
    }))
  }));
};

// --- INITIALE DATEN ---
const rawWorkouts = [
  {
    id: 1,
    week: 1,
    title: 'Tag 1: KB Kraft',
    type: 'strength',
    duration: '45-60 Min',
    focus: 'Ganzkörper & Basis',
    color: 'border-blue-500 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    exercises: [
      { name: 'Goblet Squats (KB)', sets: 3, reps: '10-12', rpe: '8', note: 'Nimm die 8er oder 12er' },
      { name: 'Schulterdrücken', sets: 3, reps: '8-10', rpe: '8', note: 'Pro Seite (4er oder 6er)' },
      { name: 'Einarmiges Rudern', sets: 3, reps: '10-12', rpe: '8', note: 'Abstützen auf Stuhl' },
      { name: 'Rumanian Deadlift', sets: 3, reps: '12-15', rpe: '7', note: 'Beide Hände an die 12er' },
      { name: 'Floor Press', sets: 3, reps: '10-12', rpe: '8', note: 'Rückenlage am Boden' },
    ],
  },
  {
    id: 2,
    week: 1,
    title: 'Tag 2: Ausdauer Zirkel',
    type: 'circuit',
    duration: '30-40 Min',
    focus: 'Herz-Kreislauf',
    color: 'border-orange-500 text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700',
    exercises: [
      { name: 'KB Swings', sets: 3, reps: '20', rpe: 'Explosiv', note: 'Hüft-Einsatz! (12er)' },
      { name: 'Thruster', sets: 3, reps: '10', rpe: 'Hoch', note: 'Squat + Drücken' },
      { name: 'Burpees', sets: 3, reps: '10', rpe: 'Pace', note: 'Ohne Gewicht' },
      { name: 'Mountain Climbers', sets: 3, reps: '30sek', rpe: 'Schnell', note: 'Am Boden' },
    ],
  },
  {
    id: 3,
    week: 1,
    title: 'Tag 3: Core & Grip',
    type: 'assistance',
    duration: '30 Min',
    focus: 'Stabilität',
    color: 'border-teal-500 text-teal-600',
    badgeColor: 'bg-teal-100 text-teal-700',
    exercises: [
      { name: 'Farmers Carry', sets: 3, reps: '40m', rpe: '7', note: 'Pro Seite laufen' },
      { name: 'Russian Twists', sets: 3, reps: '20', rpe: '9', note: 'Füße hoch wenn möglich' },
      { name: 'Plank Pull-Through', sets: 3, reps: '12', rpe: '8', note: 'KB durchziehen' },
      { name: 'Halo', sets: 3, reps: '10', rpe: '7', note: 'Um den Kopf kreisen' },
    ],
  },
  {
    id: 4,
    week: 2,
    title: 'Tag 1: Kraft Steigerung',
    type: 'strength',
    duration: '50-60 Min',
    focus: 'Mehr Gewicht',
    color: 'border-red-500 text-red-600',
    badgeColor: 'bg-red-100 text-red-700',
    exercises: [
      { name: 'Goblet Squats (Schwer)', sets: 4, reps: '8', rpe: '9', note: 'Versuch die 16er!' },
      { name: 'Push Press', sets: 4, reps: '6-8', rpe: '9', note: 'Mit Beinschwung' },
    ],
  }
];

// --- TIMER KOMPONENTE ---
function WorkoutTimer({ transparent = false, initialTime = 0 }) {
  const [seconds, setSeconds] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setSeconds(initialTime);
  }, [initialTime]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds) => {
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

// --- WARMUP SCREEN ---
function WarmupScreen({ prompt, onComplete, onBack }) {
  const WARMUP_DURATION = 300; 
  const [timeLeft, setTimeLeft] = useState(WARMUP_DURATION); 

  const handleFinish = () => {
      const elapsed = WARMUP_DURATION - timeLeft;
      onComplete(elapsed);
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish(); 
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (totalSeconds) => {
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
                    <div className="text-7xl font-black text-gray-800 font-mono tracking-tighter">
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

// --- COOLDOWN SCREEN ---
function CooldownScreen({ prompt, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(300); 

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (totalSeconds) => {
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
                    <div className="text-7xl font-black text-gray-800 font-mono tracking-tighter">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <button 
                    onClick={onComplete}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <SaveIcon size={20} />
                    Cool Down beenden & Speichern
                </button>
            </div>
        </div>
    </div>
  );
}

// --- PASTE PLAN MODAL ---
function PastePlanModal({ isOpen, onClose, onImport }) {
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleImport = () => {
        try {
            // Bereinige den Text von Markdown-Code-Blöcken
            let cleanedText = jsonText.trim();
            if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.substring(7);
            } else if (cleanedText.startsWith("```")) {
                cleanedText = cleanedText.substring(3);
            }
            if (cleanedText.endsWith("```")) {
                cleanedText = cleanedText.substring(0, cleanedText.length - 3);
            }
            
            const parsed = JSON.parse(cleanedText.trim());
            
            if (Array.isArray(parsed)) {
                onImport(parsed);
                setJsonText("");
                setError(null);
                onClose();
            } else {
                setError("Format-Fehler: Es muss eine Liste von Workouts sein (startet mit '[').");
            }
        } catch (e) {
            setError("Ungültiges JSON. Bitte kopiere nur den Code-Bereich (beginnt mit '[').");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 relative overflow-hidden">
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ClipboardCheck size={20} className="text-blue-400"/> Plan einfügen
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 bg-gray-50 flex-1 flex flex-col gap-4">
                    <p className="text-sm text-gray-600">Füge hier den JSON-Code ein, den die KI erstellt hat:</p>
                    <textarea 
                        className="w-full flex-1 p-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-xs"
                        placeholder='[ { "id": 1, "title": "..." } ]'
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                    />
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <button 
                        onClick={handleImport}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Plan laden & anwenden
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- CONFIRMATION MODAL ---
function ExitDialog({ isOpen, onSave, onDiscard, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Training verlassen?</h3>
          <p className="text-gray-500 text-sm mt-1">
            Möchtest du deine Fortschritte speichern oder verwerfen?
          </p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <SaveIcon size={18} /> Speichern & Verlassen
          </button>
          
          <button 
            onClick={onDiscard}
            className="w-full bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={18} /> Verwerfen
          </button>
          
          <button 
            onClick={onCancel}
            className="w-full text-gray-400 font-medium py-2 hover:text-gray-600 transition-colors text-sm"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

// --- PROMPT MODAL (EDITABLE + DYNAMIC APPEND) ---
function PromptModal({ isOpen, onClose, title, icon: Icon, currentPrompt, onSave, colorClass, appendEquipment = false, equipment = [], appendHistory = false, history = [] }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(currentPrompt);

  useEffect(() => {
    let finalPrompt = currentPrompt;

    if (isOpen) {
        if (appendEquipment) {
            let equipmentString = "\n\n=== MEIN VERFÜGBARES EQUIPMENT ===\n";
            equipment.forEach(cat => {
                equipmentString += `- ${cat.category}: ${cat.items.join(', ')}\n`;
            });
            finalPrompt += equipmentString;
        }

        if (appendHistory) {
            let historyString = "\n\n=== MEIN TRAININGSVERLAUF (Letzte 4 Wochen) ===\n";
            
            const now = new Date();
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(now.getDate() - 28);

            const recentHistory = history.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= fourWeeksAgo;
            });

            if (recentHistory.length === 0) {
                historyString += "Keine Workouts in den letzten 4 Wochen.\n";
            } else {
                recentHistory.forEach(entry => {
                    const date = new Date(entry.date).toLocaleDateString('de-DE');
                    historyString += `\n[${date}] ${entry.workoutTitle} (${entry.type}):\n`;
                    if(entry.snapshot && entry.snapshot.exercises) {
                        entry.snapshot.exercises.forEach(ex => {
                            const bestSet = ex.logs.reduce((acc, curr) => {
                                 if(curr.weight && curr.reps) return `${curr.weight}kg x ${curr.reps}`;
                                 if(curr.reps) return `${curr.reps} Wdh`;
                                 return acc;
                            }, "-");
                            if(bestSet !== "-") {
                                historyString += `- ${ex.name}: ${bestSet}\n`;
                            }
                        });
                    }
                });
            }
            finalPrompt += historyString;
        }
    }
    
    setText(finalPrompt);
  }, [currentPrompt, appendEquipment, equipment, appendHistory, history, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (appendEquipment || appendHistory) {
        alert("Dies ist ein generierter Prompt inkl. Historie. Bitte kopiere ihn für ChatGPT. Änderungen hier werden nicht als Vorlage gespeichert.");
    } else {
        onSave(text);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        <div className={`p-6 flex justify-between items-center text-white shrink-0 ${colorClass}`}>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Icon size={20} /> {title}
          </h3>
          <div className="flex items-center gap-2">
             {(!appendEquipment && !appendHistory) && !isEditing && (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    title="Bearbeiten"
                >
                    <Edit size={20} />
                </button>
             )}
             <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
             </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {isEditing ? (
             <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none font-mono text-sm text-gray-800"
                placeholder="Gebe hier deinen Text ein..."
             />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                {text}
                </pre>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
          {isEditing ? (
            <>
                <button 
                    onClick={handleCancelEdit}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    Abbrechen
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-1 py-3 rounded-xl font-bold bg-gray-900 hover:bg-black text-white transition-colors flex items-center justify-center gap-2"
                >
                    <SaveIcon size={18} /> Speichern
                </button>
            </>
          ) : (
            <button 
                onClick={handleCopy}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                {copied ? <><Check size={18} /> Kopiert!</> : <><Copy size={18} /> Text kopieren</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// --- EQUIPMENT MODAL (EDITABLE) ---
function EquipmentModal({ isOpen, onClose, equipment, onSave }) {
  const [localEquipment, setLocalEquipment] = useState(equipment);
  const [isEditing, setIsEditing] = useState(false);
  const [newItems, setNewItems] = useState({}); 
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    setLocalEquipment(equipment);
  }, [equipment]);

  if (!isOpen) return null;

  const handleDeleteItem = (catIndex, itemIndex) => {
    const updated = [...localEquipment];
    updated[catIndex].items.splice(itemIndex, 1);
    setLocalEquipment(updated);
  };

  const handleAddItem = (catIndex) => {
    const text = newItems[catIndex];
    if (!text || text.trim() === "") return;

    const updated = [...localEquipment];
    updated[catIndex].items.push(text.trim());
    setLocalEquipment(updated);
    setNewItems({ ...newItems, [catIndex]: "" }); 
  };

  const handleAddCategory = () => {
      if(!newCategoryName.trim()) return;
      const updated = [...localEquipment, { category: newCategoryName.trim(), items: [] }];
      setLocalEquipment(updated);
      setNewCategoryName("");
  }

  const handleDeleteCategory = (catIndex) => {
      if(confirm("Ganze Kategorie löschen?")) {
          const updated = [...localEquipment];
          updated.splice(catIndex, 1);
          setLocalEquipment(updated);
      }
  }

  const handleSave = () => {
    onSave(localEquipment);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalEquipment(equipment); 
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Package size={20} /> Mein Equipment
          </h3>
          <div className="flex items-center gap-2">
             {!isEditing && (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    title="Bearbeiten"
                >
                    <Edit size={20} />
                </button>
             )}
             <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-4">
          {localEquipment.map((section, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-500" />
                        {section.category}
                    </h4>
                    {isEditing && (
                        <button onClick={() => handleDeleteCategory(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                    {section.items.map((item, i) => (
                        <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${isEditing ? 'bg-red-50 text-red-700 pr-1' : 'bg-blue-50 text-blue-700'}`}>
                            {item}
                            {isEditing && (
                                <button 
                                    onClick={() => handleDeleteItem(idx, i)}
                                    className="p-0.5 hover:bg-red-200 rounded-full ml-1"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </span>
                    ))}
                    {section.items.length === 0 && !isEditing && <span className="text-xs text-gray-400 italic">Keine Items</span>}
                </div>

                {isEditing && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
                        <input 
                            type="text" 
                            placeholder="Neues Item..." 
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                            value={newItems[idx] || ""}
                            onChange={(e) => setNewItems({ ...newItems, [idx]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(idx)}
                        />
                        <button 
                            onClick={() => handleAddItem(idx)}
                            className="bg-blue-600 text-white p-1 rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                )}
            </div>
          ))}

          {isEditing && (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 flex gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder="Neue Kategorie..." 
                    className="flex-1 text-sm bg-transparent outline-none font-bold text-gray-600"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                  >
                      + HINZUFÜGEN
                  </button>
              </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
          {isEditing ? (
            <>
                <button 
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    Abbrechen
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                >
                    <SaveIcon size={18} /> Speichern
                </button>
            </>
          ) : (
            <button 
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
                Schließen
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// --- CLOUD MODAL ---
function CloudModal({ isOpen, onClose, onExport, onImport, fileInputRef }) {
  // Dieses Modal wird hier nur noch als unsichtbarer "Helper" für die File-Refs gebraucht
  return (
      <div className="hidden">
          <input type="file" accept=".json" ref={fileInputRef} onChange={onImport} className="hidden" />
      </div>
  )
}

// --- HAUPT APP ---
function App() {
  const [activeTab, setActiveTab] = useState('training');
  const [activeWeek, setActiveWeek] = useState(1);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('coachAndyData');
    if (savedData) return JSON.parse(savedData);
    return prepareData(rawWorkouts);
  });

  const [systemPrompt, setSystemPrompt] = useState(() => {
      const saved = localStorage.getItem('coachAndyPrompt');
      return saved || DEFAULT_SYSTEM_PROMPT;
  });

  const [warmupPrompt, setWarmupPrompt] = useState(() => {
      const saved = localStorage.getItem('coachAndyWarmupPrompt');
      return saved || DEFAULT_WARMUP_PROMPT;
  });

  const [cooldownPrompt, setCooldownPrompt] = useState(() => {
      const saved = localStorage.getItem('coachAndyCooldownPrompt');
      return saved || DEFAULT_COOLDOWN_PROMPT;
  });

  const [planPrompt, setPlanPrompt] = useState(() => {
      const saved = localStorage.getItem('coachAndyPlanPrompt');
      return saved || DEFAULT_PLAN_PROMPT;
  });

  const [equipment, setEquipment] = useState(() => {
      const savedEq = localStorage.getItem('coachAndyEquipment');
      return savedEq ? JSON.parse(savedEq) : DEFAULT_EQUIPMENT;
  });

  const [activeWorkoutData, setActiveWorkoutData] = useState(null);
  
  // WORKOUT PHASES
  const [isWarmupActive, setIsWarmupActive] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false); 
  const [elapsedWarmupTime, setElapsedWarmupTime] = useState(0); 
  
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null); 
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showPastePlanModal, setShowPastePlanModal] = useState(false); 
  
  const [activePromptModal, setActivePromptModal] = useState(null); 

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('coachAndyHistory');
    if (savedHistory) return JSON.parse(savedHistory);
    return [];
  });

  const [restSeconds, setRestSeconds] = useState(0); 
  const [isRestActive, setIsRestActive] = useState(false);
  const [activeRestContext, setActiveRestContext] = useState({ exerciseIndex: -1, setIndex: -1 });

  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isRestActive) {
      interval = setInterval(() => {
        setRestSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestActive]);

  const handleSaveSystemPrompt = (newText) => {
      setSystemPrompt(newText);
      localStorage.setItem('coachAndyPrompt', newText);
  };

  const handleSaveWarmupPrompt = (newText) => {
      setWarmupPrompt(newText);
      localStorage.setItem('coachAndyWarmupPrompt', newText);
  };

  const handleSaveCooldownPrompt = (newText) => {
      setCooldownPrompt(newText);
      localStorage.setItem('coachAndyCooldownPrompt', newText);
  };

  const handleSavePlanPrompt = (newText) => {
      setPlanPrompt(newText);
      localStorage.setItem('coachAndyPlanPrompt', newText);
  };

  const handleSaveEquipment = (newEquipment) => {
      setEquipment(newEquipment);
      localStorage.setItem('coachAndyEquipment', JSON.stringify(newEquipment));
  };

  const startWorkout = (id) => {
    const originalWorkout = data.find(w => w.id === id);
    if (originalWorkout) {
      setActiveWorkoutData(JSON.parse(JSON.stringify(originalWorkout)));
      setSelectedWorkoutId(id);
      setIsWarmupActive(true);
      setIsCooldownActive(false); 
      setElapsedWarmupTime(0); 
      setIsRestActive(false);
    }
  };

  const visibleWorkouts = data.filter(workout => workout.week === activeWeek);

  const handleInputChange = (exerciseIndex, setIndex, field, value) => {
    if (!activeWorkoutData) return;
    
    const newWorkoutData = { ...activeWorkoutData };
    newWorkoutData.exercises[exerciseIndex].logs[setIndex][field] = value;
    setActiveWorkoutData(newWorkoutData);
  };

  const toggleSetComplete = (exerciseIndex, setIndex) => {
    if (!activeWorkoutData) return;
    
    const newWorkoutData = { ...activeWorkoutData };
    const currentStatus = newWorkoutData.exercises[exerciseIndex].logs[setIndex].completed;
    const newStatus = !currentStatus;
    
    newWorkoutData.exercises[exerciseIndex].logs[setIndex].completed = newStatus;
    setActiveWorkoutData(newWorkoutData);

    if (newStatus === true) {
      setRestSeconds(0);
      setIsRestActive(true);
      setActiveRestContext({ exerciseIndex, setIndex });
    }
  };

  const saveToGlobalState = (workoutData) => {
    const newData = data.map(w => w.id === workoutData.id ? workoutData : w);
    setData(newData);
    localStorage.setItem('coachAndyData', JSON.stringify(newData));
    return newData;
  };

  const handleFinishWorkout = () => {
    if (!activeWorkoutData) return;
    setIsRestActive(false);
    setIsCooldownActive(true);
  };

  const handleFinalizeWorkout = () => {
    if (!activeWorkoutData) return;

    saveToGlobalState(activeWorkoutData);
    
    const newHistoryEntry = {
      id: Date.now(),
      workoutId: activeWorkoutData.id,
      date: new Date().toISOString(),
      workoutTitle: activeWorkoutData.title,
      week: activeWorkoutData.week,
      type: activeWorkoutData.type,
      snapshot: activeWorkoutData 
    };
    
    const newHistory = [newHistoryEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));

    setIsCooldownActive(false);
    setSelectedWorkoutId(null);
    setActiveWorkoutData(null);
    setActiveTab('training'); 
  }

  const handleBackRequest = () => {
    setShowExitDialog(true);
  };

  const handleExitSave = () => {
    if (activeWorkoutData) {
      saveToGlobalState(activeWorkoutData);
    }
    setShowExitDialog(false);
    setSelectedWorkoutId(null);
    setActiveWorkoutData(null);
    setIsRestActive(false);
    setIsWarmupActive(false);
    setIsCooldownActive(false);
  };

  const handleExitDiscard = () => {
    setShowExitDialog(false);
    setSelectedWorkoutId(null);
    setActiveWorkoutData(null);
    setIsRestActive(false);
    setIsWarmupActive(false);
    setIsCooldownActive(false);
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
  };

  const handleDeleteHistoryEntry = (e, entryId) => {
    e.stopPropagation(); 
    if (confirm("Diesen Eintrag wirklich löschen? Das Workout wird zurückgesetzt.")) {
      const entryToDelete = history.find(entry => entry.id === entryId);
      const newHistory = history.filter(entry => entry.id !== entryId);
      setHistory(newHistory);
      localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));

      if (entryToDelete) {
         const workoutId = entryToDelete.workoutId;
         const newData = data.map(w => {
            if (w.id === workoutId) {
                return {
                    ...w,
                    exercises: w.exercises.map(ex => ({
                        ...ex,
                        logs: Array.from({ length: ex.sets }).map(() => ({
                            weight: '', 
                            reps: '',   
                            completed: false
                        }))
                    }))
                };
            }
            return w;
         });
         setData(newData);
         localStorage.setItem('coachAndyData', JSON.stringify(newData));
      }

      if (selectedHistoryEntry && selectedHistoryEntry.id === entryId) {
        setSelectedHistoryEntry(null);
      }
    }
  };

  const handleExport = () => {
    const exportObject = { data, history, systemPrompt, warmupPrompt, cooldownPrompt, planPrompt, equipment }; 
    const dataStr = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coach-andy-full-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedJson = JSON.parse(e.target.result);
        if (importedJson.data && importedJson.history) {
           setData(importedJson.data);
           setHistory(importedJson.history);
           if (importedJson.systemPrompt) setSystemPrompt(importedJson.systemPrompt); 
           if (importedJson.warmupPrompt) setWarmupPrompt(importedJson.warmupPrompt); 
           if (importedJson.cooldownPrompt) setCooldownPrompt(importedJson.cooldownPrompt); 
           if (importedJson.planPrompt) setPlanPrompt(importedJson.planPrompt); 
           if (importedJson.equipment) setEquipment(importedJson.equipment);
           
           localStorage.setItem('coachAndyData', JSON.stringify(importedJson.data));
           localStorage.setItem('coachAndyHistory', JSON.stringify(importedJson.history));
           
           if(importedJson.systemPrompt) localStorage.setItem('coachAndyPrompt', importedJson.systemPrompt);
           if(importedJson.warmupPrompt) localStorage.setItem('coachAndyWarmupPrompt', importedJson.warmupPrompt);
           if(importedJson.cooldownPrompt) localStorage.setItem('coachAndyCooldownPrompt', importedJson.cooldownPrompt);
           if(importedJson.planPrompt) localStorage.setItem('coachAndyPlanPrompt', importedJson.planPrompt);
           if(importedJson.equipment) localStorage.setItem('coachAndyEquipment', JSON.stringify(importedJson.equipment));
        } else if (Array.isArray(importedJson)) {
           setData(prepareData(importedJson));
           localStorage.setItem('coachAndyData', JSON.stringify(importedJson));
        }
        alert("Backup erfolgreich geladen!");
      } catch (error) {
        alert("Fehler beim Laden der Datei.");
      }
    };
    reader.readAsText(file);
  };

  // --- NEUE FUNKTION: JSON PASTE IMPORT ---
  const handlePasteImport = (importedData) => {
      const prepared = prepareData(importedData);
      setData(prepared);
      localStorage.setItem('coachAndyData', JSON.stringify(prepared));
      alert("Neuer Plan erfolgreich geladen!");
  };

  const handleReset = () => {
    if (confirm("Alles zurücksetzen? Alle Daten und der Verlauf werden gelöscht.")) {
      setData(prepareData(rawWorkouts));
      setHistory([]);
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setWarmupPrompt(DEFAULT_WARMUP_PROMPT);
      setCooldownPrompt(DEFAULT_COOLDOWN_PROMPT);
      setPlanPrompt(DEFAULT_PLAN_PROMPT);
      setEquipment(DEFAULT_EQUIPMENT);
      localStorage.clear();
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  const isWorkoutCompleted = (workoutId) => {
    return history.some(entry => entry.workoutId === workoutId);
  };

  // --- CONFIRMATION DIALOG ---
  const ExitDialogComponent = (
    <ExitDialog 
        isOpen={showExitDialog} 
        onSave={handleExitSave} 
        onDiscard={handleExitDiscard} 
        onCancel={handleExitCancel} 
    />
  );

  // --- VIEW: WARMUP ---
  if (selectedWorkoutId && activeWorkoutData && isWarmupActive) {
      return (
          <>
            {ExitDialogComponent}
            <WarmupScreen 
                prompt={warmupPrompt}
                onComplete={(elapsed) => {
                    setElapsedWarmupTime(elapsed);
                    setIsWarmupActive(false);
                }}
                onBack={handleBackRequest}
            />
          </>
      )
  }

  // --- VIEW: COOLDOWN ---
  if (selectedWorkoutId && activeWorkoutData && isCooldownActive) {
      return (
          <>
            {ExitDialogComponent}
            <CooldownScreen 
                prompt={cooldownPrompt}
                onComplete={handleFinalizeWorkout}
            />
          </>
      )
  }

  // --- VIEW: WORKOUT ---
  if (selectedWorkoutId && activeWorkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
        {ExitDialogComponent}

        {/* HEADER WORKOUT (COMPACT) */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2 px-4 sticky top-0 z-10 shadow-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackRequest} 
              className="flex items-center gap-1 text-blue-200 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-xs font-medium">Zurück</span>
            </button>
            <WorkoutTimer transparent={true} initialTime={elapsedWarmupTime} />
          </div>
          <div className="mt-1">
              <h1 className="text-lg font-bold leading-tight">{activeWorkoutData.title}</h1>
              <p className="text-blue-200 text-[10px] flex items-center gap-1">
                <Flame size={10} /> {activeWorkoutData.focus}
              </p>
          </div>
        </div>

        <div className="p-4 space-y-3 max-w-md mx-auto">
          {activeWorkoutData.exercises.map((ex, exerciseIndex) => (
            <div key={exerciseIndex} className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100">
              <div className="mb-2 border-b border-gray-100 pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-gray-800 leading-tight">{ex.name}</h3>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">RPE {ex.rpe}</span>
                </div>
                {ex.note && (
                  <p className="text-[10px] text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded">
                    💡 {ex.note}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                {ex.logs.map((log, setIndex) => {
                  const isCompleted = log.completed;
                  const showRestTimerHere = isRestActive && 
                                            activeRestContext.exerciseIndex === exerciseIndex && 
                                            activeRestContext.setIndex === setIndex;

                  return (
                    <div key={setIndex}>
                      <div className={`flex items-center gap-2 p-1.5 rounded-2xl transition-all border ${
                          isCompleted ? 'bg-white border-emerald-100' : 'bg-white border-transparent'
                        }`}>
                        
                        <div className="w-6 flex-shrink-0 flex items-center justify-center">
                          <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                            isCompleted ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'
                          }`}>
                            {setIndex + 1}
                          </span>
                        </div>

                        <div className="flex-1">
                          <input type="number" placeholder="kg" value={log.weight} onChange={(e) => handleInputChange(exerciseIndex, setIndex, 'weight', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-base outline-none transition-all ${isCompleted ? 'bg-transparent border-transparent font-bold text-gray-800' : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white font-bold text-gray-900'}`} disabled={isCompleted} />
                        </div>
                        <div className="flex-1">
                          <input type="text" placeholder={ex.reps} value={log.reps} onChange={(e) => handleInputChange(exerciseIndex, setIndex, 'reps', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-base outline-none transition-all ${isCompleted ? 'bg-transparent border-transparent font-bold text-gray-800' : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white font-bold text-gray-900'}`} disabled={isCompleted} />
                        </div>
                        
                        <button 
                          onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                          className={`
                            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ease-out
                            ${isCompleted 
                              ? 'bg-emerald-500 shadow-md shadow-emerald-200 scale-100' 
                              : 'bg-gray-50 hover:bg-gray-100 active:scale-95'
                            }
                          `}
                        >
                          <CheckCircle2 
                            size={20} 
                            className={`transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-gray-300'}`} 
                            strokeWidth={isCompleted ? 2.5 : 2}
                          />
                        </button>

                      </div>
                      
                      {showRestTimerHere && (
                        <div className="mt-1 mb-2 mx-1 bg-blue-50 border border-blue-100 rounded-lg p-2 flex items-center justify-center gap-2 animate-in slide-in-from-top-1 fade-in shadow-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Pause</span>
                          <span className="text-base font-mono font-bold text-blue-800">{formatTime(restSeconds)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={handleFinishWorkout} className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-950 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6 mb-6">
            <Save size={18} /> Training beenden
          </button>
        </div>
      </div>
    );
  }

  // --- HAUPTANSICHT ---
  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* MODALS */}
      <PromptModal 
        isOpen={activePromptModal === 'system'} 
        onClose={() => setActivePromptModal(null)}
        title="Coach Philosophie / Prinzipien"
        icon={FileText}
        colorClass="bg-gradient-to-r from-blue-600 to-indigo-700"
        currentPrompt={systemPrompt}
        onSave={handleSaveSystemPrompt}
      />
      <PromptModal 
        isOpen={activePromptModal === 'warmup'} 
        onClose={() => setActivePromptModal(null)}
        title="Warm-up Prompt"
        icon={Zap}
        colorClass="bg-gradient-to-r from-orange-500 to-red-600"
        currentPrompt={warmupPrompt}
        onSave={handleSaveWarmupPrompt}
      />
      <PromptModal 
        isOpen={activePromptModal === 'cooldown'} 
        onClose={() => setActivePromptModal(null)}
        title="Cool Down Prompt"
        icon={Wind}
        colorClass="bg-gradient-to-r from-teal-500 to-cyan-600"
        currentPrompt={cooldownPrompt}
        onSave={handleSaveCooldownPrompt}
      />
      <PromptModal 
        isOpen={activePromptModal === 'plan'} 
        onClose={() => setActivePromptModal(null)}
        title="Plan erstellen (Prompt)"
        icon={Sparkles}
        colorClass="bg-gradient-to-r from-blue-600 to-indigo-600"
        currentPrompt={planPrompt}
        onSave={handleSavePlanPrompt}
        appendEquipment={true}
        equipment={equipment}
        appendHistory={true}
        history={history}
      />
      <EquipmentModal 
        isOpen={showEquipmentModal} 
        onClose={() => setShowEquipmentModal(false)}
        equipment={equipment} 
        onSave={handleSaveEquipment} 
      />
      <PastePlanModal 
        isOpen={showPastePlanModal}
        onClose={() => setShowPastePlanModal(false)}
        onImport={handlePasteImport}
      />
      <CloudModal
        isOpen={false} // Modal wird nicht direkt gerendert, da Buttons jetzt inline
        onClose={() => {}}
        onExport={handleExport}
        onImport={handleImport}
        fileInputRef={fileInputRef}
      />

      {/* --- PROFIL TAB --- */}
      {activeTab === 'profile' && (
        <>
          <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 pb-12 text-white shadow-lg">
             <div className="flex justify-between items-center">
                 <div>
                    {/* Header Text */}
                    <h1 className="text-3xl font-black tracking-tighter text-white">
                        Coach Andy 2026
                    </h1>
                 </div>
             </div>
          </header>

          <div className="p-6 -mt-8 space-y-2">
            
            {/* CLOUD SYNC CARD (Dark Style, Direct Actions) */}
            <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden text-white shadow-xl flex items-center justify-between">
               <Cloud className="absolute -left-4 -bottom-4 text-white opacity-5 w-32 h-32" />
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                      <Database size={20} className="text-blue-400" />
                      <h3 className="font-bold text-lg">Cloud Sync</h3>
                  </div>
                  <p className="text-xs text-gray-400">Backup & Restore</p>
               </div>
               <div className="relative z-10 flex gap-2">
                  <button onClick={handleExport} className="p-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50" title="Backup Datei erstellen"><Download size={20} /></button>
                  <div className="relative">
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                    <button onClick={() => fileInputRef.current.click()} className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors border border-gray-600" title="Datei importieren"><Upload size={20} /></button>
                  </div>
                  <button onClick={() => setShowPastePlanModal(true)} className="p-3 bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/50" title="Plan Text einfügen"><ClipboardCheck size={20} /></button>
               </div>
            </div>

            {/* NEW PLAN GENERATOR BUTTON */}
            <div 
              onClick={() => setActivePromptModal('plan')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                     <Sparkles size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-lg text-gray-900">Neuer 4-Wochen-Plan</h3>
                     <p className="text-xs text-gray-500">Erstelle einen neuen Plan mit KI</p>
                  </div>
               </div>
               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-xl shadow-md">
                  <ChevronRight size={20} />
               </div>
            </div>

            {/* EQUIPMENT CARD */}
            <div 
              onClick={() => setShowEquipmentModal(true)}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Mein Equipment</h3>
                    <p className="text-xs text-gray-500">Verfügbares Trainingsgerät</p>
                  </div>
               </div>
               <ChevronRight className="text-gray-300" />
            </div>

            {/* SYSTEM PROMPT CARD */}
            <div 
              onClick={() => setActivePromptModal('system')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Coach Philosophie / Prinzipien</h3>
                    <p className="text-xs text-gray-500">Identität & Regeln definieren</p>
                  </div>
               </div>
               <ChevronRight className="text-gray-300" />
            </div>

            {/* WARMUP PROMPT CARD */}
            <div 
              onClick={() => setActivePromptModal('warmup')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Warm-up Prompt</h3>
                    <p className="text-xs text-gray-500">Aufwärm-Routine anpassen</p>
                  </div>
               </div>
               <ChevronRight className="text-gray-300" />
            </div>

            {/* COOLDOWN PROMPT CARD */}
            <div 
              onClick={() => setActivePromptModal('cooldown')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-teal-100 text-teal-600 p-2 rounded-xl">
                    <Wind size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Cool Down Prompt</h3>
                    <p className="text-xs text-gray-500">Regeneration anpassen</p>
                  </div>
               </div>
               <ChevronRight className="text-gray-300" />
            </div>

            {/* HARD RESET BUTTON */}
            <div className="pt-4 flex justify-center">
                <button 
                    onClick={handleReset}
                    className="text-red-400 text-xs font-bold flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                    <Trash2 size={12} /> Alles zurücksetzen (Hard Reset)
                </button>
            </div>

          </div>
        </>
      )}

      {/* TRAINING ANSICHT & VERLAUF bleiben unverändert */}
      {/* ... (Hier folgen die anderen Views, die schon korrekt waren) */}
      {activeTab === 'training' && (
        <>
          <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 pb-6 shadow-lg text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-black flex items-center gap-2 text-white">
                  Coach Andy <Dumbbell className="text-blue-200 fill-current" size={24} />
                </h1>
                <p className="text-blue-200 text-xs font-bold tracking-widest mt-1 uppercase">Periodisierung V1.0</p>
              </div>
            </div>
            
            <div className="flex gap-2 bg-blue-800/30 p-1 rounded-xl backdrop-blur-sm">
              {[1, 2, 3, 4].map((week) => (
                <button
                  key={week}
                  onClick={() => setActiveWeek(week)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeWeek === week 
                    ? 'bg-white text-blue-700 shadow-md' 
                    : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  W{week}
                </button>
              ))}
            </div>
          </header>

          <main className="p-4 space-y-4 -mt-2">
            {visibleWorkouts.length > 0 ? (
              visibleWorkouts.map((workout) => {
                const isCompleted = isWorkoutCompleted(workout.id);
                return (
                  <div
                    key={workout.id}
                    onClick={() => startWorkout(workout.id)}
                    className={`
                        relative overflow-hidden group p-5 rounded-2xl shadow-sm border transition-all cursor-pointer active:scale-[0.98]
                        ${isCompleted 
                            ? 'bg-blue-50/50 border-blue-200' 
                            : 'bg-white border-gray-100 hover:shadow-md' 
                        }
                        border-l-4 ${workout.color}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1">
                                <Clock size={10} /> {workout.duration}
                            </span>
                             <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 ${workout.badgeColor || 'bg-blue-100 text-blue-700'}`}>
                                <Target size={10} /> {workout.type}
                            </span>
                        </div>
                        
                        <h3 className={`text-xl font-bold mb-1 ${isCompleted ? 'text-blue-900' : 'text-gray-900'}`}>
                          {workout.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{workout.focus}</p>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4 self-center">
                        {isCompleted ? (
                          <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full shadow-sm">
                             <CheckSquare size={24} />
                          </div>
                        ) : (
                          <div className="bg-blue-50 text-blue-600 p-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ChevronRight size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-400"><p>Keine Workouts für Woche {activeWeek}.</p></div>
            )}
          </main>
        </>
      )}

      {activeTab === 'history' && !selectedHistoryEntry && (
        <div className="pb-24">
          <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 pb-12 text-white shadow-lg">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h1 className="text-2xl font-black flex items-center gap-2">
                  Verlauf <History className="text-blue-300" size={24} />
                </h1>
                <p className="text-blue-100 text-sm font-medium mt-1">Deine Trainings-Historie</p>
              </div>
            </div>
          </header>

          <div className="p-4 -mt-8 space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white rounded-3xl shadow-sm border border-gray-100">
                 <CalendarDays size={48} className="mx-auto mb-4 text-gray-200" strokeWidth={1} />
                 <p>Noch kein Training abgeschlossen.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div 
                    key={entry.id} 
                    onClick={() => setSelectedHistoryEntry(entry)} 
                    className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-emerald-500 border-y border-r border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> Abgeschlossen
                         </span>
                         <span className="text-[10px] font-bold text-gray-400">{formatDate(entry.date)}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{entry.workoutTitle}</h3>
                      <p className="text-xs text-gray-500 mt-1">Woche {entry.week} • {entry.type}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                          <ArrowLeft size={16} className="text-gray-300 rotate-180" />
                      </div>

                      <button 
                        onClick={(e) => handleDeleteHistoryEntry(e, entry.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'history' && selectedHistoryEntry && (
          <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
              <button onClick={() => setSelectedHistoryEntry(null)} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors mb-2">
                <ArrowLeft size={20} /> <span className="text-sm font-medium">Zurück</span>
              </button>
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{formatDate(selectedHistoryEntry.date)}</p>
                  <h1 className="text-2xl font-black text-gray-900">{selectedHistoryEntry.snapshot?.title || selectedHistoryEntry.workoutTitle}</h1>
              </div>
            </div>
            <div className="p-4 space-y-4 max-w-md mx-auto">
                {selectedHistoryEntry.snapshot?.exercises.map((ex, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 opacity-90">
                        <h3 className="font-bold text-lg text-gray-800 border-b border-gray-100 pb-2 mb-2">{ex.name}</h3>
                        <div className="space-y-2">
                            {ex.logs.map((log, j) => (
                                <div key={j} className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                    <span>Satz {j+1}</span>
                                    <span className="font-bold">{log.weight}kg x {log.reps}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 py-2 pb-6 flex justify-between items-center text-xs font-medium z-20">
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'profile' ? 'text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}><UserCircle className="w-6 h-6" /><span>Profil</span></button>
        <button onClick={() => setActiveTab('training')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'training' ? 'text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}><Dumbbell className="w-6 h-6" /><span>Training</span></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'history' ? 'text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}><History className="w-6 h-6" /><span>Verlauf</span></button>
      </div>
    </div>
  );
}

export default App;
