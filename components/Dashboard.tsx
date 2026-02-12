
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

  const tasksToday = tasks.filter(t => t.created_at?.startsWith(today) || t.completed_at?.startsWith(today));
  const completedTodayGlobal = tasksToday.filter(t => t.status === 'concluido');
  
  const totalCreated = tasks.length;
  const totalCompleted = tasks.filter(t => t.status === 'concluido').length;
  const globalEfficiency = tasksToday.length > 0 ? Math.round((completedTodayGlobal.length / tasksToday.length) * 100) : 0;

  // Auditoria Dinâmica: Produção por funcionário hoje
  const employeePerformance = EMPLOYEES.filter(e => e.role === 'funcionario').map(emp => {
    const empTasksToday = tasks.filter(t => t.employee === emp.name && (t.status !== 'concluido' || t.completed_at?.startsWith(today)));
    const empCompletedToday = empTasksToday.filter(t => t.status === 'concluido').length;
    const totalAssignedToday = empTasksToday.length;

    return {
      name: emp.name,
      completed: empCompletedToday,
      total: totalAssignedToday,
      efficiency: totalAssignedToday > 0 ? Math.round((empCompletedToday / totalAssignedToday) * 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Resumo Visual Superior */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
           <div>
             <span className="text-2xl mb-2 block">🎯</span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Geral</p>
           </div>
           <div>
             <p className="text-3xl font-black text-slate-900">{globalEfficiency}%</p>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">do Hostel pronto hoje</p>
           </div>
           <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
             <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${globalEfficiency}%` }}></div>
           </div>
        </div>

        <div className="bg-[#1E293B] p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between h-40">
           <div>
             <span className="text-2xl mb-2 block">✅</span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Concluído</p>
           </div>
           <div>
             <p className="text-4xl font-black">{completedTodayGlobal.length}</p>
             <p className="text-[9px] font-bold opacity-60 uppercase">Tarefas finalizadas hoje</p>
           </div>
        </div>
      </div>

      {/* Seção de Equipe */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            Produção da Equipe
          </h3>
          <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">EM TEMPO REAL</span>
        </div>

        <div className="space-y-8">
          {employeePerformance.map((emp) => (
            <div key={emp.name} className="group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs ${emp.efficiency === 100 ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                    {emp.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800 leading-none">{emp.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{emp.completed} / {emp.total} TAREFAS</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${emp.efficiency === 100 ? 'text-emerald-500' : 'text-slate-800'}`}>
                    {emp.efficiency}%
                  </p>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${emp.efficiency === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]'}`} 
                  style={{ width: `${emp.efficiency}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas Administrativas */}
      {isAdmin && (
        <div className="bg-[#1E293B] p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-black text-indigo-400 uppercase text-[10px] tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="text-sm">📈</span>
              Métricas do Gestor
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                 <p className="text-[8px] font-black text-white/40 uppercase mb-1">Histórico Total</p>
                 <p className="text-2xl font-black">{totalCreated}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                 <p className="text-[8px] font-black text-white/40 uppercase mb-1">Taxa Geral</p>
                 <p className="text-2xl font-black">{Math.round((totalCompleted/totalCreated)*100 || 0)}%</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px]"></div>
        </div>
      )}

      {/* Rodapé de Motivação */}
      <div className="bg-indigo-50 p-6 rounded-[2.5rem] text-center border-2 border-indigo-100">
         <p className="text-indigo-900 text-[10px] font-black uppercase tracking-widest">Rumo ao 100%!</p>
         <p className="text-indigo-400 text-[9px] mt-1 font-bold italic">Cada quarto limpo é um cliente satisfeito.</p>
      </div>
    </div>
  );
};
