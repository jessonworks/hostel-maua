
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
  const activeChecklist = useMemo(() => {
    if (task.type === 'quarto') return CHECKLISTS_BY_AREA['Quarto'];
    
    const areaMatch = Object.keys(CHECKLISTS_BY_AREA).find(area => 
      task.name.toLowerCase().includes(area.toLowerCase())
    );
    
    return areaMatch ? CHECKLISTS_BY_AREA[areaMatch] : CHECKLISTS_BY_AREA['Quarto'];
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
  const totalCount = activeChecklist.length;
  // Permite finalizar se pelo menos metade estiver pronto ou se a lista for vazia (bug safety)
  const canFinish = totalCount === 0 || completedCount === totalCount;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300">
        
        {/* Header do Modal */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🧺</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {task.name}
              </h2>
            </div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md inline-block">
              Checklist Operacional
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all">✕</button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-8 overflow-y-auto space-y-4 flex-1">
          {task.notes && (
            <div className="mb-6 bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex gap-4">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Nota de Direcionamento:</p>
                <p className="text-sm text-slate-700 font-bold italic leading-relaxed">"{task.notes}"</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {activeChecklist.map((item) => (
              <label
                key={item}
                className={`flex items-center p-5 rounded-[1.8rem] border-2 transition-all cursor-pointer ${
                  items[item] 
                    ? 'bg-emerald-50 border-emerald-500/20 text-emerald-900' 
                    : 'bg-white border-slate-100 text-slate-600 active:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg border-2 mr-4 flex items-center justify-center transition-all ${items[item] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                  {items[item] && <span className="font-bold">✓</span>}
                </div>
                <input
                  type="checkbox"
                  checked={items[item]}
                  onChange={() => toggleItem(item)}
                  className="hidden"
                />
                <span className={`text-sm font-black tracking-tight ${items[item] ? 'line-through opacity-40' : ''}`}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Rodapé do Modal com Ações */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso da Etapa</span>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${canFinish ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
              {completedCount} de {totalCount} concluídos
            </span>
          </div>
          
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
             <div 
              className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 100}%` }}
             />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-500 font-black rounded-3xl active:scale-95 transition-transform uppercase text-xs tracking-widest"
            >
              Pausar
            </button>
            <button
              onClick={() => {
                if (!canFinish) {
                  if(!confirm('O checklist não está completo. Deseja finalizar assim mesmo?')) return;
                }
                onComplete({ ...task, checklist: items });
              }}
              className={`flex-[2] py-5 rounded-3xl font-black shadow-2xl transition-all active:scale-95 uppercase text-xs tracking-[0.2em] ${
                canFinish 
                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                  : 'bg-indigo-600 text-white shadow-indigo-200'
              }`}
            >
              {canFinish ? 'Finalizar ✅' : 'Concluir mesmo assim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
