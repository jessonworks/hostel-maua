
import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onStart: (task: Task) => void;
  onFinish: (task: Task) => void;
  currentUser: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStart, onFinish, currentUser }) => {
  const [elapsed, setElapsed] = useState<string>('00:00');
  const isMine = task.employee === currentUser;

  useEffect(() => {
    let interval: number;
    if (task.status === 'andamento' && task.started_at) {
      interval = window.setInterval(() => {
        const start = new Date(task.started_at!).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [task.status, task.started_at]);

  const getStatusColor = () => {
    switch (task.status) {
      case 'pendente': return 'bg-slate-100 text-slate-600';
      case 'andamento': return 'bg-amber-100 text-amber-600 animate-pulse';
      case 'concluido': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className={`p-4 mb-3 rounded-xl border transition-all ${task.status === 'andamento' ? 'border-amber-400 shadow-lg ring-2 ring-amber-100' : 'border-slate-200'} bg-white`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            {task.type === 'quarto' ? '🛏️' : '🧹'} {task.name}
          </h3>
          <p className="text-sm text-slate-500">
            {task.employee ? `Atribuído a: ${task.employee}` : 'Aguardando atribuição'}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor()}`}>
            {task.status === 'andamento' ? 'Em Limpeza' : task.status}
          </span>
          {task.status === 'andamento' && (
            <span className="text-amber-600 font-black text-sm mt-1">⏱️ {elapsed}</span>
          )}
        </div>
      </div>

      {task.notes && (
        <div className="mt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
          <p className="text-xs font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
            Nota do Gerente:
          </p>
          <p className="text-sm text-slate-600 italic">"{task.notes}"</p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {task.status === 'pendente' && (
          <button
            onClick={() => onStart(task)}
            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform touch-target shadow-md"
          >
            ▶️ Iniciar Limpeza
          </button>
        )}
        {task.status === 'andamento' && isMine && (
          <button
            onClick={() => onFinish(task)}
            className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform touch-target shadow-md flex items-center justify-center gap-2"
          >
            📋 Abrir Checklist
          </button>
        )}
        {task.status === 'concluido' && (
          <div className="text-center w-full text-emerald-600 text-sm font-bold flex items-center justify-center gap-1 bg-emerald-50 py-2 rounded-lg">
             ✅ Concluído em {task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        )}
      </div>
    </div>
  );
};
