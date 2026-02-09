
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
      case 'pendente': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'andamento': return 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse';
      case 'concluido': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-gray-100 border-transparent';
    }
  };

  return (
    <div className={`p-5 mb-4 rounded-2xl border-2 transition-all ${task.status === 'andamento' ? 'shadow-xl scale-[1.02] bg-white z-10' : 'bg-white shadow-sm'} ${getStatusColor().split(' ')[2]}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{task.type === 'quarto' ? '🛏️' : '🧹'}</span>
            <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">
              {task.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor()}`}>
              {task.status === 'andamento' ? '⚡ EM LIMPEZA' : task.status}
            </span>
            {task.employee && (
              <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-black border border-indigo-100 uppercase">
                👤 {task.employee}
              </span>
            )}
          </div>
        </div>
        
        {task.status === 'andamento' && (
          <div className="text-right">
            <p className="text-[10px] font-black text-amber-400 uppercase leading-none mb-1">Duração</p>
            <span className="text-2xl font-black text-amber-500 tabular-nums">{elapsed}</span>
          </div>
        )}
      </div>

      {task.notes && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Instrução:</p>
          <p className="text-sm text-slate-600 italic">"{task.notes}"</p>
        </div>
      )}

      <div className="flex gap-2 mt-5">
        {task.status === 'pendente' && isMine && (
          <button
            onClick={() => onStart(task)}
            className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl active:scale-95 transition-transform shadow-lg shadow-indigo-100"
          >
            🚀 INICIAR AGORA
          </button>
        )}
        {task.status === 'andamento' && isMine && (
          <button
            onClick={() => onFinish(task)}
            className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-xl active:scale-95 transition-transform shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
          >
            📋 FINALIZAR CHECKLIST
          </button>
        )}
        {!isMine && task.status !== 'concluido' && (
           <div className="flex-1 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status do Gestor</p>
             <p className="text-xs font-bold text-slate-600">
               {task.status === 'andamento' ? `Em execução por ${task.employee}` : `Aguardando ${task.employee}`}
             </p>
           </div>
        )}
        {task.status === 'concluido' && (
          <div className="text-center w-full text-emerald-600 text-sm font-black flex flex-col items-center justify-center gap-1 bg-emerald-50/50 py-3 rounded-xl border border-emerald-100">
             <span>✅ CONCLUÍDO</span>
             <span className="text-[10px] opacity-70">
               Finalizado às {task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} por {task.employee}
             </span>
          </div>
        )}
      </div>
    </div>
  );
};
