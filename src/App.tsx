// src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, ArrowLeft, Save, Flame, Download, Upload, UserCircle, Trash2, History,
  CheckCircle2, CheckSquare, CalendarDays, Cloud, Database, Clock, Target, ChevronRight,
  FileText, Zap, Wind, Sparkles, ClipboardCheck, Package, Volume2, Trophy, AlertTriangle,
  Eye, X, BarChart3, FileSpreadsheet
} from 'lucide-react';

// Imports from new file structure
import { playBeep } from './utils/audio';
import { prepareData, formatTime, formatDate } from './utils/helpers';
import { 
    DEFAULT_SYSTEM_PROMPT, 
    DEFAULT_WARMUP_PROMPT, 
    DEFAULT_COOLDOWN_PROMPT, 
    DEFAULT_PLAN_PROMPT, 
    DEFAULT_EQUIPMENT, 
    rawWorkouts 
} from './utils/constants';

import { WorkoutTimer } from './components/WorkoutTimer';
import { WarmupScreen } from './components/WarmupScreen';
import { CooldownScreen } from './components/CooldownScreen';
import { PastePlanModal } from './components/PastePlanModal';
import { ExitDialog } from './components/ExitDialog';
import { PromptModal } from './components/PromptModal';
import { EquipmentModal } from './components/EquipmentModal';

// --- HELPER FUNCTIONS ---

const getStaticWarmup = (focus: string) => {
  const focusLower = focus?.toLowerCase() || "";
  if (focusLower.includes("leg") || focusLower.includes("bein") || focusLower.includes("unterkörper")) {
    return `🔥 BEIN-FOKUS WARM-UP (RAMP)\n\n1. PULS (2 Min)\n• 1 Min Joggen auf der Stelle\n• 1 Min Jumping Jacks\n\n2. MOBILISIERUNG (2 Min)\n• 10x Leg Swings (vor/zurück pro Bein)\n• 10x Leg Swings (seitlich pro Bein)\n• 10x Tiefe Hocke (Deep Squat Hold)\n\n3. AKTIVIERUNG (1 Min)\n• 20x Glute Bridges\n• 10x Bodyweight Lunges`;
  }
  if (focusLower.includes("push") || focusLower.includes("pull") || focusLower.includes("upper") || focusLower.includes("oberkörper")) {
    return `🔥 OBERKÖRPER WARM-UP (RAMP)\n\n1. PULS (2 Min)\n• 1 Min Seilspringen\n• 1 Min Armkreisen\n\n2. MOBILISIERUNG (2 Min)\n• 10x Wall Slides\n• 10x Cat-Cow Stretch\n• 10x Thoracic Rotation\n\n3. AKTIVIERUNG (1 Min)\n• 10x Band Pull-Aparts\n• 10x Scapular Push Ups`;
  }
  return `🔥 GENERAL WARM-UP (RAMP)\n\n1. RAISE (2 Min)\n• 30sek High Knees\n• 30sek Butt Kicks\n• 1 Min Hampelmann\n\n2. MOBILIZE (2 Min)\n• 10x World's Greatest Stretch\n• 10x Raupengang\n\n3. ACTIVATE (1 Min)\n• 15x Air Squats\n• 10x Plank zu Downward Dog`;
};

const getStaticCooldown = (focus: string) => {
  const focusLower = focus?.toLowerCase() || "";
  if (focusLower.includes("leg") || focusLower.includes("bein") || focusLower.includes("unterkörper")) {
    return `❄️ BEIN-FOKUS COOL DOWN\n\n1. HÜFTE & GESÄSS (2 Min)\n• Pigeon Pose (Taube)\n• Couch Stretch\n\n2. OBERSCHENKEL (2 Min)\n• Standing Quad Stretch\n• Seated Hamstring Stretch\n\n3. RELAX (1 Min)\n• Legs Up The Wall`;
  }
  if (focusLower.includes("push") || focusLower.includes("pull") || focusLower.includes("upper") || focusLower.includes("oberkörper")) {
    return `❄️ OBERKÖRPER COOL DOWN\n\n1. BRUST & SCHULTERN (2 Min)\n• Doorway Stretch\n• Cross-Body Shoulder Stretch\n\n2. RÜCKEN (2 Min)\n• Child's Pose\n• Lat Stretch\n\n3. NACKEN (1 Min)\n• Sanftes Nacken-Neigen`;
  }
  return `❄️ GENERAL COOL DOWN\n\n1. POSTERIOR CHAIN (2 Min)\n• Standing Forward Fold\n• Downward Dog\n\n2. SPINE & HIPS (2 Min)\n• Spinal Twist im Liegen\n\n3. ATMEN (1 Min)\n• Corpse Pose (Savasana)`;
};

function App() {
  const [activeTab, setActiveTab] = useState('training');
  const [activeWeek, setActiveWeek] = useState(1);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<any>(null);

  // States
  const [currentWarmupRoutine, setCurrentWarmupRoutine] = useState("");
  const [currentCooldownRoutine, setCurrentCooldownRoutine] = useState("");

  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('coachAndyData');
    if (savedData) return JSON.parse(savedData);
    return prepareData(rawWorkouts);
  });

  // --- HIER WURDE DER FEHLER BEHOBEN ---
  const visibleWorkouts = data.filter((workout: any) => workout.week === activeWeek);
  
  const [history, setHistory] = useState<any[]>(() => {
    const savedHistory = localStorage.getItem('coachAndyHistory');
    if (savedHistory) return JSON.parse(savedHistory);
    return [];
  });

  // --- DIESE FUNKTION FEHLTE VORHER ---
  const isWorkoutCompleted = (workoutId: number) => {
    return history.some((entry: any) => entry.workoutId === workoutId);
  };
  // ------------------------------------

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

  const [activeWorkoutData, setActiveWorkoutData] = useState<any>(null);
  
  const [isWarmupActive, setIsWarmupActive] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false); 
  const [elapsedWarmupTime, setElapsedWarmupTime] = useState(0); 
  
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null); 
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showPastePlanModal, setShowPastePlanModal] = useState(false); 
  
  const [activePromptModal, setActivePromptModal] = useState<string | null>(null); 

  const [restSeconds, setRestSeconds] = useState(0); 
  const [isRestActive, setIsRestActive] = useState(false);
  const [activeRestContext, setActiveRestContext] = useState({ exerciseIndex: -1, setIndex: -1 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedActiveState = localStorage.getItem('coachAndyActiveState');
    if (savedActiveState && !activeWorkoutData) {
        try {
            const parsedState = JSON.parse(savedActiveState);
            if (confirm("Ein abgebrochenes Workout wurde gefunden. Möchtest du es fortsetzen?")) {
                setActiveWorkoutData(parsedState);
                setSelectedWorkoutId(parsedState.id);
                
                const specificWarmup = getStaticWarmup(parsedState.focus);
                setCurrentWarmupRoutine(specificWarmup);
                const specificCooldown = getStaticCooldown(parsedState.focus);
                setCurrentCooldownRoutine(specificCooldown);

                setIsWarmupActive(false); 
            } else {
                localStorage.removeItem('coachAndyActiveState');
            }
        } catch (e) {
            console.error("Fehler beim Laden des Active States", e);
        }
    }
  }, []);

  useEffect(() => {
    if (activeWorkoutData) {
        localStorage.setItem('coachAndyActiveState', JSON.stringify(activeWorkoutData));
    } else {
        localStorage.removeItem('coachAndyActiveState');
    }
  }, [activeWorkoutData]);

  useEffect(() => {
    let interval: any = null;
    if (isRestActive) {
      interval = setInterval(() => {
        setRestSeconds((s) => {
            const next = s + 1;
            if (next > 0 && next % 30 === 0) {
                playBeep(600, 'sine', 0.1, 0.05); 
            }
            return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestActive]);

  const getStats = () => {
    const total = history.length;
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(now.setDate(diff));
    monday.setHours(0,0,0,0);
    const thisWeek = history.filter((h: any) => new Date(h.date) >= monday).length;
    return { total, thisWeek };
  };

  const handleCSVExport = () => {
      if (history.length === 0) {
          alert("Keine Daten zum Exportieren.");
          return;
      }
      let csvContent = "Datum,Woche,Workout Name,Typ,Uebung,Satz,Gewicht (kg),Wiederholungen\n";
      history.forEach(entry => {
          const date = new Date(entry.date).toLocaleDateString();
          const workoutName = entry.workoutTitle.replace(/,/g, ""); 
          if (entry.snapshot && entry.snapshot.exercises) {
              entry.snapshot.exercises.forEach((ex: any) => {
                  const exName = ex.name.replace(/,/g, "");
                  ex.logs.forEach((log: any, index: number) => {
                      if(log.weight && log.reps) {
                        csvContent += `${date},${entry.week},${workoutName},${entry.type},${exName},${index + 1},${log.weight},${log.reps}\n`;
                      }
                  });
              });
          }
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `coach_andy_export_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const calculateVolume = (snapshot: any) => {
      if (!snapshot || !snapshot.exercises) return 0;
      let vol = 0;
      snapshot.exercises.forEach((ex: any) => {
          ex.logs.forEach((log: any) => {
              const w = parseFloat(log.weight) || 0;
              const r = parseFloat(log.reps) || 0;
              if (log.completed) vol += w * r;
          });
      });
      return vol;
  };

  const getLastWorkoutsVolume = () => {
      const last5 = history.slice(0, 5).reverse(); 
      if (last5.length === 0) return [];
      const volumes = last5.map(h => ({
          date: new Date(h.date).toLocaleDateString(undefined, {weekday: 'short'}),
          volume: calculateVolume(h.snapshot),
          id: h.id
      }));
      const maxVol = Math.max(...volumes.map(v => v.volume));
      return volumes.map(v => ({...v, height: maxVol > 0 ? (v.volume / maxVol) * 100 : 0 }));
  };

  const chartData = getLastWorkoutsVolume();

  const handleSaveSystemPrompt = (newText: string) => { setSystemPrompt(newText); localStorage.setItem('coachAndyPrompt', newText); };
  const handleSaveWarmupPrompt = (newText: string) => { setWarmupPrompt(newText); localStorage.setItem('coachAndyWarmupPrompt', newText); };
  const handleSaveCooldownPrompt = (newText: string) => { setCooldownPrompt(newText); localStorage.setItem('coachAndyCooldownPrompt', newText); };
  const handleSavePlanPrompt = (newText: string) => { setPlanPrompt(newText); localStorage.setItem('coachAndyPlanPrompt', newText); };
  const handleSaveEquipment = (newEquipment: any[]) => { setEquipment(newEquipment); localStorage.setItem('coachAndyEquipment', JSON.stringify(newEquipment)); };

  const startWorkout = (id: number) => {
    setPreviewWorkout(null);
    const originalWorkout = data.find((w: any) => w.id === id);
    if (originalWorkout) {
      setActiveWorkoutData(JSON.parse(JSON.stringify(originalWorkout)));
      setSelectedWorkoutId(id);

      const specificWarmup = getStaticWarmup(originalWorkout.focus);
      setCurrentWarmupRoutine(specificWarmup); 
      const specificCooldown = getStaticCooldown(originalWorkout.focus);
      setCurrentCooldownRoutine(specificCooldown);

      setIsWarmupActive(true);
      setIsCooldownActive(false); 
      setElapsedWarmupTime(0); 
      setIsRestActive(false);
      playBeep(0, 'sine', 0.001, 0); 
    }
  };

  const handleInputChange = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    if (!activeWorkoutData) return;
    const newWorkoutData = { ...activeWorkoutData };
    newWorkoutData.exercises[exerciseIndex].logs[setIndex][field] = value;
    setActiveWorkoutData(newWorkoutData);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
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

  const saveToGlobalState = (workoutData: any) => {
    const newData = data.map((w: any) => w.id === workoutData.id ? workoutData : w);
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
      workoutTitle: activeWorkoutData.title,
      date: new Date().toISOString(),
      week: activeWorkoutData.week,
      type: activeWorkoutData.type,
      snapshot: activeWorkoutData 
    };
    const newHistory = [newHistoryEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));
    localStorage.removeItem('coachAndyActiveState');
    setIsCooldownActive(false);
    setSelectedWorkoutId(null);
    setActiveWorkoutData(null);
    setActiveTab('training'); 
  }

  const handleBackRequest = () => setShowExitDialog(true);
  const handleExitSave = () => { if (activeWorkoutData) saveToGlobalState(activeWorkoutData); setShowExitDialog(false); setSelectedWorkoutId(null); setActiveWorkoutData(null); setIsRestActive(false); setIsWarmupActive(false); setIsCooldownActive(false); localStorage.removeItem('coachAndyActiveState'); };
  const handleExitDiscard = () => { setShowExitDialog(false); setSelectedWorkoutId(null); setActiveWorkoutData(null); setIsRestActive(false); setIsWarmupActive(false); setIsCooldownActive(false); localStorage.removeItem('coachAndyActiveState'); };
  const handleExitCancel = () => setShowExitDialog(false);

  const handleDeleteHistoryEntry = (e: any, entryId: number) => {
    e.stopPropagation(); 
    if (confirm("Diesen Eintrag wirklich löschen? Das Workout wird zurückgesetzt.")) {
      const entryToDelete = history.find((entry: any) => entry.id === entryId);
      const newHistory = history.filter((entry: any) => entry.id !== entryId);
      setHistory(newHistory);
      localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));
      if (entryToDelete) {
         const workoutId = entryToDelete.workoutId;
         const newData = data.map((w: any) => {
            if (w.id === workoutId) {
                return {
                    ...w,
                    exercises: w.exercises.map((ex: any) => ({
                        ...ex,
                        logs: Array.from({ length: ex.sets }).map(() => ({ weight: '', reps: '', completed: false }))
                    }))
                };
            }
            return w;
         });
         setData(newData);
         localStorage.setItem('coachAndyData', JSON.stringify(newData));
      }
      if (selectedHistoryEntry && selectedHistoryEntry.id === entryId) setSelectedHistoryEntry(null);
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

  const handleImport = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const importedJson = JSON.parse(result);
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

  const handlePasteImport = (importedData: any) => {
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

  const handleClearPlan = () => {
      if(confirm("Nur den aktuellen Plan löschen? Dein Verlauf bleibt erhalten.")) {
          setData([]);
          localStorage.removeItem('coachAndyData');
          alert("Plan gelöscht. Erstelle oder importiere einen neuen.");
      }
  }

  const ExitDialogComponent = (
    <ExitDialog 
        isOpen={showExitDialog} 
        onSave={handleExitSave} 
        onDiscard={handleExitDiscard} 
        onCancel={handleExitCancel} 
    />
  );

  // --- VIEWS ---
  if (selectedWorkoutId && activeWorkoutData && isWarmupActive) {
      return (
          <>
            {ExitDialogComponent}
            <WarmupScreen 
                prompt={currentWarmupRoutine} 
                onComplete={(elapsed) => { setElapsedWarmupTime(elapsed); setIsWarmupActive(false); }}
                onBack={handleBackRequest}
            />
          </>
      )
  }

  if (selectedWorkoutId && activeWorkoutData && isCooldownActive) {
      return (
          <>
            {ExitDialogComponent}
            <CooldownScreen prompt={currentCooldownRoutine} onComplete={handleFinalizeWorkout} />
          </>
      )
  }

  if (selectedWorkoutId && activeWorkoutData) {
    return (
      <div className="min-h-screen bg-neutral-900 flex justify-center font-sans">
        <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">
          {ExitDialogComponent}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2 px-4 sticky top-0 z-10 shadow-lg">
            <div className="flex justify-between items-center">
              <button onClick={handleBackRequest} className="flex items-center gap-1 text-blue-200 hover:text-white transition-colors">
                <ArrowLeft size={18} /><span className="text-xs font-medium">Zurück</span>
              </button>
              <WorkoutTimer transparent={true} initialTime={elapsedWarmupTime} />
            </div>
            <div className="mt-1"><h1 className="text-lg font-bold leading-tight">{activeWorkoutData.title}</h1><p className="text-blue-200 text-[10px] flex items-center gap-1"><Flame size={10} /> {activeWorkoutData.focus}</p></div>
          </div>
          <div className="p-4 space-y-3 max-w-md mx-auto">
            {activeWorkoutData.exercises.map((ex: any, exerciseIndex: number) => (
              <div key={exerciseIndex} className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100">
                <div className="mb-2 border-b border-gray-100 pb-2">
                  <div className="flex justify-between items-start"><h3 className="font-bold text-base text-gray-800 leading-tight">{ex.name}</h3><span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">RPE {ex.rpe}</span></div>
                  {ex.note && (<p className="text-[10px] text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded">💡 {ex.note}</p>)}
                </div>
                <div className="space-y-2">
                  {ex.logs.map((log: any, setIndex: number) => {
                    const isCompleted = log.completed;
                    const showRestTimerHere = isRestActive && activeRestContext.exerciseIndex === exerciseIndex && activeRestContext.setIndex === setIndex;
                    return (
                      <div key={setIndex}>
                        <div className={`flex items-center gap-2 p-1.5 rounded-2xl transition-all border ${isCompleted ? 'bg-white border-emerald-100' : 'bg-white border-transparent'}`}>
                          <div className="w-6 flex-shrink-0 flex items-center justify-center"><span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${isCompleted ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'}`}>{setIndex + 1}</span></div>
                          <div className="flex-1"><input type="number" placeholder="kg" value={log.weight} onChange={(e) => handleInputChange(exerciseIndex, setIndex, 'weight', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-base outline-none transition-all ${isCompleted ? 'bg-transparent border-transparent font-bold text-gray-800' : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white font-bold text-gray-900'}`} disabled={isCompleted} /></div>
                          <div className="flex-1"><input type="text" placeholder={ex.reps} value={log.reps} onChange={(e) => handleInputChange(exerciseIndex, setIndex, 'reps', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-base outline-none transition-all ${isCompleted ? 'bg-transparent border-transparent font-bold text-gray-800' : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white font-bold text-gray-900'}`} disabled={isCompleted} /></div>
                          <button onClick={() => toggleSetComplete(exerciseIndex, setIndex)} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ease-out ${isCompleted ? 'bg-emerald-500 shadow-md shadow-emerald-200 scale-100' : 'bg-gray-50 hover:bg-gray-100 active:scale-95'}`}><CheckCircle2 size={20} className={`transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-gray-300'}`} strokeWidth={isCompleted ? 2.5 : 2} /></button>
                        </div>
                        {showRestTimerHere && (<div className="mt-1 mb-2 mx-1 bg-blue-50 border border-blue-100 rounded-lg p-2 flex items-center justify-center gap-2 animate-in slide-in-from-top-1 fade-in shadow-sm"><span className="text-[10px] font-bold uppercase tracking-wide text-blue-700 flex items-center gap-1"><Volume2 size={10} className="animate-pulse"/> Pause</span><span className="text-base font-mono font-bold text-blue-800">{formatTime(restSeconds)}</span></div>)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <button onClick={handleFinishWorkout} className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-950 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6 mb-6"><Save size={18} /> Training beenden</button>
          </div>
        </div>
      </div>
    );
  }

  // --- HAUPTANSICHT (Responsive Wrapper) ---
  return (
    <div className="min-h-screen bg-neutral-900 flex justify-center font-sans">
      
      <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">
        
        {/* MODALS */}
        <PromptModal isOpen={activePromptModal === 'system'} onClose={() => setActivePromptModal(null)} title="Coach Philosophie" icon={FileText} colorClass="bg-gradient-to-r from-blue-600 to-indigo-700" currentPrompt={systemPrompt} onSave={handleSaveSystemPrompt} />
        <PromptModal isOpen={activePromptModal === 'warmup'} onClose={() => setActivePromptModal(null)} title="Warm-up Prompt" icon={Zap} colorClass="bg-gradient-to-r from-orange-500 to-red-600" currentPrompt={warmupPrompt} onSave={handleSaveWarmupPrompt} />
        <PromptModal isOpen={activePromptModal === 'cooldown'} onClose={() => setActivePromptModal(null)} title="Cool Down Prompt" icon={Wind} colorClass="bg-gradient-to-r from-teal-500 to-cyan-600" currentPrompt={cooldownPrompt} onSave={handleSaveCooldownPrompt} />
        <PromptModal isOpen={activePromptModal === 'plan'} onClose={() => setActivePromptModal(null)} title="Plan erstellen" icon={Sparkles} colorClass="bg-gradient-to-r from-blue-600 to-indigo-600" currentPrompt={planPrompt} onSave={handleSavePlanPrompt} appendEquipment={true} equipment={equipment} appendHistory={true} history={history} />
        <EquipmentModal isOpen={showEquipmentModal} onClose={() => setShowEquipmentModal(false)} equipment={equipment} onSave={handleSaveEquipment} />
        <PastePlanModal isOpen={showPastePlanModal} onClose={() => setShowPastePlanModal(false)} onImport={handlePasteImport} />
        
        {previewWorkout && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                  <div className={`p-5 rounded-t-3xl text-white bg-gradient-to-r from-gray-800 to-gray-900 flex justify-between items-start shrink-0`}>
                      <div><h2 className="text-xl font-bold">{previewWorkout.title}</h2><div className="flex gap-2 mt-1"><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10}/> {previewWorkout.duration}</span><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Flame size={10}/> {previewWorkout.focus}</span></div></div>
                      <button onClick={() => setPreviewWorkout(null)} className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
                  </div>
                  <div className="p-4 overflow-y-auto space-y-3"><p className="text-sm text-gray-500 mb-2 font-medium">Übungsübersicht:</p>{previewWorkout.exercises.map((ex: any, idx: number) => (<div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100"><div><h4 className="font-bold text-gray-800 text-sm">{ex.name}</h4><p className="text-xs text-gray-400 mt-0.5">RPE {ex.rpe}</p></div><div className="text-right"><span className="font-mono font-bold text-blue-600 text-sm">{ex.sets} x {ex.reps}</span></div></div>))}</div>
                  <div className="p-4 border-t border-gray-100 shrink-0 flex gap-3"><button onClick={() => setPreviewWorkout(null)} className="flex-1 py-3 text-gray-500 font-bold text-sm">Schließen</button><button onClick={() => startWorkout(previewWorkout.id)} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"><Dumbbell size={16} /> Jetzt starten</button></div>
              </div>
           </div>
        )}

        <div className="pb-24 min-h-screen">
          
          {activeTab === 'profile' && (
            <>
              <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 pb-12 text-white shadow-lg">
                 <div className="flex justify-between items-center"><div><h1 className="text-3xl font-black tracking-tighter text-white">Coach Andy 2026</h1></div></div>
              </header>
              <div className="p-6 -mt-8 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                     <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 flex flex-col justify-center items-center"><Trophy className="text-yellow-500 mb-2 drop-shadow-sm" size={28} /><span className="text-3xl font-black text-gray-900 leading-none">{getStats().total}</span><span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Total</span></div>
                     <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 flex flex-col justify-center items-center"><CalendarDays className="text-emerald-500 mb-2 drop-shadow-sm" size={28} /><span className="text-3xl font-black text-gray-900 leading-none">{getStats().thisWeek}</span><span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Woche</span></div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden text-white shadow-xl flex items-center justify-between">
                   <Cloud className="absolute -left-4 -bottom-4 text-white opacity-5 w-32 h-32" />
                   <div className="relative z-10"><div className="flex items-center gap-2 mb-1"><Database size={20} className="text-blue-400" /><h3 className="font-bold text-lg">Cloud Sync</h3></div><p className="text-xs text-gray-400">Backup & Restore</p></div>
                   <div className="relative z-10 flex gap-2"><button onClick={handleExport} className="p-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50" title="Backup Datei erstellen"><Download size={20} /></button><div className="relative"><input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors border border-gray-600" title="Datei importieren"><Upload size={20} /></button></div><button onClick={() => setShowPastePlanModal(true)} className="p-3 bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/50" title="Plan Text einfügen"><ClipboardCheck size={20} /></button></div>
                </div>
                <div onClick={() => setActivePromptModal('plan')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Sparkles size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Neuer 4-Wochen-Plan</h3><p className="text-xs text-gray-500">Erstelle einen neuen Plan mit KI</p></div></div><div className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-xl shadow-md"><ChevronRight size={20} /></div></div>
                <div onClick={() => setShowEquipmentModal(true)} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><Package size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Mein Equipment</h3><p className="text-xs text-gray-500">Verfügbares Trainingsgerät</p></div></div><ChevronRight className="text-gray-300" /></div>
                <div onClick={() => setActivePromptModal('system')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><FileText size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Coach Philosophie</h3><p className="text-xs text-gray-500">Identität & Regeln definieren</p></div></div><ChevronRight className="text-gray-300" /></div>
                <div onClick={() => setActivePromptModal('warmup')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-orange-100 text-orange-600 p-2 rounded-xl"><Zap size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Warm-up Prompt</h3><p className="text-xs text-gray-500">Aufwärm-Routine anpassen</p></div></div><ChevronRight className="text-gray-300" /></div>
                <div onClick={() => setActivePromptModal('cooldown')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-teal-100 text-teal-600 p-2 rounded-xl"><Wind size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Cool Down Prompt</h3><p className="text-xs text-gray-500">Regeneration anpassen</p></div></div><ChevronRight className="text-gray-300" /></div>
                <div className="pt-6 pb-4 flex flex-col gap-3 items-center border-t border-gray-200 mt-4"><button onClick={handleClearPlan} className="text-orange-400 text-xs font-bold flex items-center gap-1 hover:text-orange-600 transition-colors"><AlertTriangle size={12} /> Nur Plan löschen (Verlauf behalten)</button><button onClick={handleReset} className="text-red-400 text-xs font-bold flex items-center gap-1 hover:text-red-600 transition-colors"><Trash2 size={12} /> Alles zurücksetzen (Hard Reset)</button></div>
              </div>
            </>
          )}

          {activeTab === 'training' && (
            <>
              <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 pb-6 shadow-lg text-white">
                <div className="flex justify-between items-start mb-6"><div><h1 className="text-2xl font-black flex items-center gap-2 text-white">Coach Andy <Dumbbell className="text-blue-200 fill-current" size={24} /></h1><p className="text-blue-200 text-xs font-bold tracking-widest mt-1 uppercase">Periodisierung V1.0</p></div></div>
                <div className="flex gap-2 bg-blue-800/30 p-1 rounded-xl backdrop-blur-sm">{[1, 2, 3, 4].map((week) => (<button key={week} onClick={() => setActiveWeek(week)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeWeek === week ? 'bg-white text-blue-700 shadow-md' : 'text-blue-100 hover:bg-white/10'}`}>W{week}</button>))}</div>
              </header>
              <main className="p-4 space-y-4 -mt-2">
                {visibleWorkouts.length > 0 ? (visibleWorkouts.map((workout: any) => { const isCompleted = isWorkoutCompleted(workout.id); return (<div key={workout.id} className={`relative overflow-hidden group p-5 rounded-2xl shadow-sm border transition-all ${isCompleted ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100 hover:shadow-md'} border-l-4 ${workout.color}`}><div className="flex justify-between items-start"><div className="flex-1 cursor-pointer" onClick={() => startWorkout(workout.id)}><div className="flex gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1"><Clock size={10} /> {workout.duration}</span><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 ${workout.badgeColor || 'bg-blue-100 text-blue-700'}`}><Target size={10} /> {workout.type}</span></div><h3 className={`text-xl font-bold mb-1 ${isCompleted ? 'text-blue-900' : 'text-gray-900'}`}>{workout.title}</h3><p className="text-xs text-gray-500 line-clamp-1">{workout.focus}</p></div><div className="flex flex-col items-end gap-2 ml-4"><button onClick={(e) => { e.stopPropagation(); setPreviewWorkout(workout); }} className="bg-white border border-gray-200 text-gray-500 p-2 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm" title="Vorschau ansehen"><Eye size={20} /></button>{isCompleted && (<div className="text-emerald-500 p-1"><CheckSquare size={20} /></div>)}</div></div></div>); })) : (<div className="text-center py-10 text-gray-400"><p>Keine Workouts für Woche {activeWeek}.</p></div>)}
              </main>
            </>
          )}

          {activeTab === 'history' && !selectedHistoryEntry && (
            <div className="pb-0">
              <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 pb-12 text-white shadow-lg">
                <div className="flex justify-between items-center mb-1">
                  <div><h1 className="text-2xl font-black flex items-center gap-2">Verlauf <History className="text-blue-300" size={24} /></h1><p className="text-blue-100 text-sm font-medium mt-1">Deine Trainings-Historie</p></div>
                  <button onClick={handleCSVExport} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors" title="Export als CSV Tabelle"><FileSpreadsheet size={24} /></button>
                </div>
              </header>

              <div className="p-4 -mt-8 space-y-4">
                {history.length > 0 && (
                    <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100">
                        <div className="flex items-center gap-2 mb-4 text-gray-800"><BarChart3 size={20} className="text-blue-600" /><h3 className="font-bold text-sm">Volume Load (Letzte Workouts)</h3></div>
                        <div className="flex items-end justify-between h-32 gap-2 px-2">{chartData.map((d: any, i: number) => (<div key={i} className="flex flex-col items-center gap-1 w-full group"><div className="relative w-full flex items-end justify-center h-24 bg-gray-50 rounded-lg overflow-hidden"><div className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-600" style={{ height: `${d.height}%` }}></div></div><span className="text-[10px] text-gray-400 font-bold uppercase">{d.date}</span></div>))}</div>
                    </div>
                )}
                {history.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 bg-white rounded-3xl shadow-sm border border-gray-100"><CalendarDays size={48} className="mx-auto mb-4 text-gray-200" strokeWidth={1} /><p>Noch kein Training abgeschlossen.</p></div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry: any) => (
                      <div key={entry.id} onClick={() => setSelectedHistoryEntry(entry)} className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-emerald-500 border-y border-r border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]">
                        <div>
                          <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Abgeschlossen</span><span className="text-[10px] font-bold text-gray-400">{formatDate(entry.date)}</span></div>
                          <h3 className="font-bold text-gray-900 text-lg">{entry.workoutTitle}</h3><p className="text-xs text-gray-500 mt-1">Woche {entry.week} • {entry.type}</p>
                        </div>
                        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><ArrowLeft size={16} className="text-gray-300 rotate-180" /></div><button onClick={(e) => handleDeleteHistoryEntry(e, entry.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"><Trash2 size={20} /></button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'history' && selectedHistoryEntry && (
              <div className="bg-gray-50">
                <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
                  <button onClick={() => setSelectedHistoryEntry(null)} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors mb-2"><ArrowLeft size={20} /> <span className="text-sm font-medium">Zurück</span></button>
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{formatDate(selectedHistoryEntry.date)}</p><h1 className="text-2xl font-black text-gray-900">{selectedHistoryEntry.snapshot?.title || selectedHistoryEntry.workoutTitle}</h1></div>
                </div>
                <div className="p-4 space-y-4">
                    {selectedHistoryEntry.snapshot?.exercises.map((ex: any, i: number) => (
                        <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 opacity-90">
                            <h3 className="font-bold text-lg text-gray-800 border-b border-gray-100 pb-2 mb-2">{ex.name}</h3>
                            <div className="space-y-2">{ex.logs.map((log: any, j: number) => (<div key={j} className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-lg"><span>Satz {j+1}</span><span className="font-bold">{log.weight}kg x {log.reps}</span></div>))}</div>
                        </div>
                    ))}
                </div>
              </div>
          )}
        </div>

        {/* BOTTOM NAV: Fixiert, aber innerhalb der max-w-md Begrenzung zentriert */}
        <div className="fixed bottom-0 w-full max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-2 pb-6 flex justify-between items-center text-xs font-medium z-20 left-0 right-0">
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'profile' ? 'text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}><UserCircle className="w-6 h-6" /><span>Profil</span></button>
          <button onClick={() => setActiveTab('training')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'training' ? 'text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}><Dumbbell className="w-6 h-6" /><span>Training</span></button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'history' ? 'text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}><History className="w-6 h-6" /><span>Verlauf</span></button>
        </div>

      </div>
    </div>
  );
}

export default App;