
import React, { useState, useMemo } from 'react';
import { CHECKLISTS_BY_AREA } from '../constants';
import { Task } from '../types';

interface ChecklistModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onComplete: (task: Task) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ task, onClose, onUpdate, onComplete }) => {
  // Determina qual lista usar baseado no nome da tarefa ou tipo
  const activeChecklist = useMemo(() => {
    if (task.type === 'quarto') return CHECKLISTS_BY_AREA['Quarto'];
    
    const areaName = Object.keys(CHECKLISTS_BY_AREA).find(area => 
      task.name.toLowerCase().includes(area.toLowerCase())
    );
    
    return areaName ? CHECKLISTS_BY_AREA[areaName] : CHECKLISTS_BY_AREA['Quarto'];
  }, [task.name, task.type]);

  const [items, setItems] = useState<Record<string, boolean>>(
    activeChecklist.reduce((acc, item) => ({ 
      ...acc, 
      [item]: task.checklist?.[item] || false 
    }), {})
  );

  const toggleItem = (item: string) => {
    const newItems = { ...items, [item]: !items[item] };
    setItems(newItems);
    onUpdate({ ...task, checklist: newItems });
  };

  const completedCount = Object.values(items).filter(Boolean).length;
  const allChecked = completedCount === activeChecklist.length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              🛠️ {task.name}
            </h2>
            <p className="text-slate-50 text-[10px] bg-indigo-600 inline-block px-2 py-0.5 rounded-full font-bold uppercase tracking-widest mt-1">
              Checklist Específico
            </p>
          </div>
          <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {task.notes && (
            <div className="mb-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-600 uppercase mb-1 tracking-widest">Instruções do Gestor:</p>
              <p className="text-sm text-slate-700 font-bold italic">"{task.notes}"</p>
            </div>
          )}

          {activeChecklist.map((item) => (
            <label
              key={item}
              className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                items[item] 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-inner' 
                  : 'bg-white border-slate-100 text-slate-600 shadow-sm'
              }`}
            >
              <input
                type="checkbox"
                checked={items[item]}
                onChange={() => toggleItem(item)}
                className="w-6 h-6 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500 mr-4"
              />
              <span className={items[item] ? 'font-bold line-through opacity-50' : 'font-bold'}>
                {item}
              </span>
            </label>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Progresso da Limpeza</span>
            <span className="text-xs font-black text-emerald-500 bg-emerald-100 px-3 py-1 rounded-full">
              {completedCount} / {activeChecklist.length}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
             <div 
              className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              style={{ width: `${(completedCount / activeChecklist.length) * 100}%` }}
             />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-500 font-black rounded-2xl active:scale-95 transition-transform"
            >
              SALVAR PARCIAL
            </button>
            <button
              disabled={!allChecked}
              onClick={() => {
                if (confirm('Deseja finalizar esta tarefa e avisar o gerente?')) {
                  onComplete({ ...task, checklist: items });
                }
              }}
              className={`flex-[2] py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 ${
                allChecked 
                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed'
              }`}
            >
              CONCLUIR TAREFA ✅
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
