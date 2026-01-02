// src/components/PromptModal.tsx

import React, { useState, useEffect } from 'react';
import { Edit, X, Save, Check, Copy } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: any;
  currentPrompt: string;
  onSave: (text: string) => void;
  colorClass: string;
  appendEquipment?: boolean;
  equipment?: any[];
  appendHistory?: boolean;
  history?: any[];
}

export function PromptModal({ 
    isOpen, 
    onClose, 
    title, 
    icon: Icon, 
    currentPrompt, 
    onSave, 
    colorClass, 
    appendEquipment = false, 
    equipment = [], 
    appendHistory = false, 
    history = [] 
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");

  // WICHTIGE ÄNDERUNG:
  // Wir laden den Text NUR, wenn das Fenster geöffnet wird (isOpen wechselt auf true).
  // Danach mischt sich dieser Effect nicht mehr ein, während du tippst.
  useEffect(() => {
    if (isOpen) {
        let finalPrompt = currentPrompt || ""; // Fallback falls leer

        // Equipment anhängen (nur für den Plan-Generator)
        if (appendEquipment && Array.isArray(equipment)) {
            let equipmentString = "\n\n=== MEIN VERFÜGBARES EQUIPMENT ===\n";
            equipment.forEach(cat => {
                if (cat.items && cat.items.length > 0) {
                    equipmentString += `- ${cat.category}: ${cat.items.join(', ')}\n`;
                }
            });
            finalPrompt += equipmentString;
        }

        // Verlauf anhängen (nur für den Plan-Generator)
        if (appendHistory && Array.isArray(history)) {
            let historyString = "\n\n=== MEIN TRAININGSVERLAUF (Letzte 4 Wochen) ===\n";
            
            const now = new Date();
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(now.getDate() - 28);

            const recentHistory = history.filter(entry => {
                if (!entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate >= fourWeeksAgo;
            });

            if (recentHistory.length === 0) {
                historyString += "Keine Workouts in den letzten 4 Wochen.\n";
            } else {
                recentHistory.forEach(entry => {
                    const date = new Date(entry.date).toLocaleDateString('de-DE');
                    historyString += `\n[${date}] ${entry.workoutTitle || "Training"} (${entry.type}):\n`;
                    if(entry.snapshot && entry.snapshot.exercises) {
                        entry.snapshot.exercises.forEach((ex: any) => {
                            const bestSet = ex.logs.reduce((acc: string, curr: any) => {
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
        
        setText(finalPrompt);
        setIsEditing(false); // Reset Edit-Modus beim Öffnen
    }
  }, [isOpen]); // Dieser Effect feuert nur noch bei Änderung der Sichtbarkeit

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
    // Beim Abbrechen setzen wir den Text auf den gespeicherten Wert zurück
    setText(currentPrompt);
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
             {/* Edit Button nur zeigen, wenn es kein generierter Prompt ist */}
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
                    <Save size={18} /> Speichern
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