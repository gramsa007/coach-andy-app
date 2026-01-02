// src/components/EquipmentModal.tsx

import React, { useState, useEffect } from 'react';
import { Package, Edit, X, CheckCircle2, Trash2, Plus, Save } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    equipment: any[];
    onSave: (eq: any[]) => void;
}

export function EquipmentModal({ isOpen, onClose, equipment, onSave }: Props) {
  // Wir starten mit einem leeren Array, um Fehler beim ersten Render zu vermeiden
  const [localEquipment, setLocalEquipment] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newItems, setNewItems] = useState<Record<number, string>>({}); 
  const [newCategoryName, setNewCategoryName] = useState("");

  // WICHTIG: Hier erstellen wir eine "Deep Copy" (eine echte Kopie),
  // damit wir nicht versehentlich die schreibgeschützte Standard-Datei bearbeiten.
  useEffect(() => {
    if (equipment) {
        setLocalEquipment(JSON.parse(JSON.stringify(equipment)));
    }
  }, [equipment, isOpen]);

  if (!isOpen) return null;

  const handleDeleteItem = (catIndex: number, itemIndex: number) => {
    // Sicheres Löschen ohne Mutation des Originals
    const updated = localEquipment.map((cat, cIdx) => {
        if (cIdx !== catIndex) return cat;
        return {
            ...cat,
            items: cat.items.filter((_: any, iIdx: number) => iIdx !== itemIndex)
        };
    });
    setLocalEquipment(updated);
  };

  const handleAddItem = (catIndex: number) => {
    const text = newItems[catIndex];
    if (!text || text.trim() === "") return;

    // Sicheres Hinzufügen
    const updated = localEquipment.map((cat, cIdx) => {
        if (cIdx !== catIndex) return cat;
        return {
            ...cat,
            items: [...cat.items, text.trim()]
        };
    });

    setLocalEquipment(updated);
    setNewItems({ ...newItems, [catIndex]: "" }); 
  };

  const handleAddCategory = () => {
      if(!newCategoryName.trim()) return;
      // Neue Kategorie hinzufügen
      const updated = [...localEquipment, { category: newCategoryName.trim(), items: [] }];
      setLocalEquipment(updated);
      setNewCategoryName("");
  }

  const handleDeleteCategory = (catIndex: number) => {
      if(confirm("Ganze Kategorie löschen?")) {
          const updated = localEquipment.filter((_, idx) => idx !== catIndex);
          setLocalEquipment(updated);
      }
  }

  const handleSave = () => {
    onSave(localEquipment);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Zurücksetzen auf die originalen Props (wieder als Kopie)
    setLocalEquipment(JSON.parse(JSON.stringify(equipment)));
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
                    {section.items.map((item: string, i: number) => (
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
                    <Save size={18} /> Speichern
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