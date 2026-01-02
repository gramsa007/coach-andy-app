import React, { useState } from 'react';
import { ClipboardCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function PastePlanModal({ isOpen, onClose, onImport }: Props) {
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState<string | null>(null);

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
