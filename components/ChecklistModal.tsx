
import React, { useState, useEffect } from 'react';
import { CHECKLIST_ITEMS } from '../constants';
import { Task } from '../types';

interface ChecklistModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onComplete: (task: Task) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ task, onClose, onUpdate, onComplete }) => {
  const [items, setItems] = useState<Record<string, boolean>>(
    CHECKLIST_ITEMS.reduce((acc, item) => ({ 
      ...acc, 
      [item]: task.checklist?.[item] || false 
    }), {})
  );

  const toggleItem = (item: string) => {
    const newItems = { ...items, [item]: !items[item] };
    setItems(newItems);
    // Salva progresso no banco via callback
    onUpdate({ ...task, checklist: newItems });
  };

  const allChecked = Object.values(items).every(v => v);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              🛠️ Processo: {task.name}
            </h2>
            <p className="text-slate-500 text-sm">Marque os itens conforme executa</p>
          </div>
          <button onClick={onClose} className="text-slate-400 p-2">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="mb-4 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
            <p className="text-xs font-black text-indigo-400 uppercase mb-1">Nota da tarefa:</p>
            <p className="text-sm text-slate-700 font-bold">{task.notes || 'Sem observações extras.'}</p>
          </div>

          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item}
              className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                items[item] 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-inner' 
                  : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={items[item]}
                onChange={() => toggleItem(item)}
                className="w-6 h-6 rounded-md border-slate-300 text-emerald-500 focus:ring-emerald-500 mr-4"
              />
              <span className={items[item] ? 'font-bold line-through opacity-50' : 'font-semibold'}>
                {item}
              </span>
            </label>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Progresso</span>
            <span className="text-xs font-black text-emerald-500">
              {Object.values(items).filter(Boolean).length} / {CHECKLIST_ITEMS.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
             <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${(Object.values(items).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%` }}
             />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-bold rounded-xl active:scale-95 transition-transform"
            >
              Sair e Salvar
            </button>
            <button
              disabled={!allChecked}
              onClick={() => {
                if (confirm('Finalizar tarefa e enviar relatório para o gerente?')) {
                  onComplete({ ...task, checklist: items });
                }
              }}
              className={`flex-[2] py-4 rounded-xl font-extrabold shadow-lg transition-all active:scale-95 touch-target ${
                allChecked 
                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              FINALIZAR ✅
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
