import React from 'react';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function ExitDialog({ isOpen, onSave, onDiscard, onCancel }: Props) {
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
            <Save size={18} /> Speichern & Verlassen
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
