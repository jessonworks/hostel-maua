
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
  // Fix: Define isAdmin based on userRole to resolve the missing name error
  const isAdmin = isCreator || isManager;
  const today = new Date().toISOString().split('T')[0];

  const visibleTasks = (isCreator || isManager) ? tasks : tasks.filter(t => t.employee === currentUser);
  const completedTodayGlobal = tasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(today));
  
  const totalCreated = tasks.length;
  const totalCompleted = tasks.filter(t => t.status === 'concluido').length;
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // Auditoria Dinâmica: Meta baseada no que foi atribuído hoje
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
    <div className="min-h-screen bg-white rounded-[3rem] p-8 pb-32 shadow-sm border border-slate-100">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl shadow-sm text-slate-600 border border-slate-100">⬅️</button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analítica</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            Visão: {userRole.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-[#1E293B] p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <p className="text-[9px] font-black uppercase opacity-50 tracking-widest mb-1">Global Hoje</p>
          <p className="text-4xl font-black">{completedTodayGlobal.length}</p>
          <div className="absolute -right-2 -bottom-2 text-5xl opacity-10">✅</div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Eficiência</p>
          <p className="text-4xl font-black text-indigo-600">{completionRate}%</p>
        </div>
      </div>

      <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mb-8">
        <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] mb-8 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
          Produção Individual (Hoje)
        </h3>
        <div className="space-y-10">
          {employeePerformance.map((emp) => (
            <div key={emp.name} className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-black text-lg text-slate-800">{emp.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {emp.completed} de {emp.total} tarefas concluídas
                  </p>
                </div>
                <p className={`text-sm font-black ${emp.efficiency === 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                  {emp.efficiency}%
                </p>
              </div>
              <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-slate-200 p-1 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${emp.efficiency === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${emp.efficiency}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCreator && (
        <div className="bg-[#1E293B] p-8 rounded-[3rem] shadow-2xl text-white">
          <h3 className="font-black text-indigo-400 uppercase text-[10px] tracking-[0.2em] mb-6">Métricas de Gestão</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="font-bold text-sm">Total Histórico</span>
              <span className="bg-white/10 px-4 py-1 rounded-full text-xs font-black">{totalCreated} tasks</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="font-bold text-sm">Tasks em Aberto</span>
              <span className="bg-amber-500/20 text-amber-500 px-4 py-1 rounded-full text-xs font-black">
                {tasks.filter(t => t.status !== 'concluido').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
         <div className="bg-indigo-50 p-8 rounded-[3rem] text-center border-2 border-indigo-100">
           <p className="text-indigo-900 text-sm font-black uppercase tracking-widest">Bom trabalho!</p>
           <p className="text-indigo-600 text-xs mt-2 font-bold italic">Você é peça fundamental na nossa engrenagem.</p>
         </div>
      )}
    </div>
  );
};
