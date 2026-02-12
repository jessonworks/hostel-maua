
import React from 'react';
import { Task } from '../types';
import { EMPLOYEES } from '../constants';

interface DashboardProps {
  tasks: Task[];
  onBack: () => void;
  userRole: 'gerente' | 'funcionario' | 'criador';
  currentUser: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, onBack, userRole, currentUser }) => {
  const isCreator = userRole === 'criador';
  const isManager = userRole === 'gerente';
  const isAdmin = isCreator || isManager;
  const today = new Date().toISOString().split('T')[0];

  const tasksPending = tasks.filter(t => t.status !== 'concluido');
  const tasksInDev = tasks.filter(t => t.status === 'andamento');
  const tasksCompletedToday = tasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(today));

  return (
    <div className="space-y-6 pb-10">
      {/* Quadro de Status Operacional */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <span className="text-2xl mb-2 block">🧹</span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Execução</p>
           </div>
           <div className="mt-4">
             <p className="text-3xl font-black text-amber-500">{tasksInDev.length}</p>
             <p className="text-[9px] font-bold text-slate-400 uppercase">Sendo limpos agora</p>
           </div>
        </div>

        <div className="bg-[#1E293B] p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
           <div>
             <span className="text-2xl mb-2 block">✅</span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prontos Hoje</p>
           </div>
           <div className="mt-4">
             <p className="text-4xl font-black">{tasksCompletedToday.length}</p>
             <p className="text-[9px] font-bold opacity-60 uppercase">Finalizados com sucesso</p>
           </div>
        </div>
      </div>

      {/* Quem está onde? */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            Quem está na ativa?
          </h3>
        </div>

        <div className="space-y-6">
          {EMPLOYEES.filter(e => e.role === 'funcionario').map((emp) => {
            const currentTask = tasks.find(t => t.employee === emp.name && t.status === 'andamento');
            return (
              <div key={emp.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${currentTask ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                    {emp.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800 leading-none">{emp.name}</p>
                    <p className={`text-[9px] font-bold uppercase mt-1 ${currentTask ? 'text-amber-500' : 'text-slate-400'}`}>
                      {currentTask ? `Trabalhando no ${currentTask.name}` : 'Aguardando Direcionamento'}
                    </p>
                  </div>
                </div>
                {currentTask && (
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Próximas Atividades */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] mb-6 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
          Próximas Tarefas
        </h3>
        
        {tasksPending.filter(t => t.status === 'pendente').length === 0 ? (
          <p className="text-xs text-slate-400 font-bold italic text-center py-4">Nenhuma tarefa na fila.</p>
        ) : (
          <div className="space-y-3">
            {tasksPending.filter(t => t.status === 'pendente').map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <span className="text-lg">📍</span>
                   <p className="font-black text-xs text-slate-700 uppercase">{t.name}</p>
                 </div>
                 <span className="text-[8px] font-black bg-white px-2 py-1 rounded-md text-slate-400 border border-slate-100">
                    DIRECIONADO PARA {t.employee?.toUpperCase()}
                 </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Área Administrativa */}
      {isAdmin && (
        <div className="bg-[#1E293B] p-8 rounded-[3rem] shadow-2xl text-white">
          <h3 className="font-black text-indigo-400 uppercase text-[10px] tracking-[0.2em] mb-6">Controle de Fluxo</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
              <p className="text-[2rem] font-black leading-none mb-1">{tasksPending.length}</p>
              <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">Aguardando</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
              <p className="text-[2rem] font-black leading-none mb-1">{tasks.length}</p>
              <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">Total Criado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
