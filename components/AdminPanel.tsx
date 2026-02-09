
import React, { useState } from 'react';
import { ROOMS, AREAS, EMPLOYEES } from '../constants';
import { TaskType } from '../types';

interface AdminPanelProps {
  onAddTask: (name: string, type: TaskType, employee: string, notes: string) => Promise<void>;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onAddTask, onClose }) => {
  const [type, setType] = useState<TaskType>('quarto');
  const [name, setName] = useState(ROOMS[0]);
  const [employee, setEmployee] = useState(EMPLOYEES[0].name);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const taskName = type === 'quarto' ? `Quarto ${name}` : name;
      await onAddTask(taskName, type, employee, notes);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-800">⚙️ Atribuir Tarefa</h2>
          <button onClick={onClose} className="p-2 text-slate-400">✕</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo</label>
            <div className="flex gap-2">
              <button 
                onClick={() => { setType('quarto'); setName(ROOMS[0]); }}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'quarto' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}
              >
                Quarto
              </button>
              <button 
                onClick={() => { setType('area'); setName(AREAS[0]); }}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'area' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}
              >
                Área Comum
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Local</label>
            <select 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(type === 'quarto' ? ROOMS : AREAS).map(n => (
                <option key={n} value={n}>{type === 'quarto' ? `Quarto ${n}` : n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Funcionário</label>
            <select 
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {EMPLOYEES.filter(e => e.role !== 'gerente').map(e => (
                <option key={e.name} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nota / Observação (Opcional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Caprichar no banheiro."
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 text-white font-black rounded-xl shadow-lg active:scale-95 transition-transform mt-4 ${
              isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 shadow-indigo-100'
            }`}
          >
            {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
};
