
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Task } from '../types';
import { DAILY_GOAL, EMPLOYEES } from '../constants';

interface DashboardProps {
  tasks: Task[];
  onBack: () => void;
  userRole: 'gerente' | 'funcionario' | 'criador';
  currentUser: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, onBack, userRole, currentUser }) => {
  const isCreator = userRole === 'criador';
  const isManager = userRole === 'gerente';
  const today = new Date().toISOString().split('T')[0];

  // 1. Filtrar tarefas conforme permissão
  const visibleTasks = (isCreator || isManager) ? tasks : tasks.filter(t => t.employee === currentUser);
  const completedToday = visibleTasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(today));
  
  // 2. Métricas de Eficiência Global (Para Jesson/Jeff)
  const totalCreated = tasks.length;
  const totalCompleted = tasks.filter(t => t.status === 'concluido').length;
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // 3. Performance por Funcionário (Auditoria do Jesson)
  const employeePerformance = EMPLOYEES.filter(e => e.role === 'funcionario').map(emp => {
    const empTasks = tasks.filter(t => t.employee === emp.name && t.status === 'concluido');
    const todayTasks = empTasks.filter(t => t.completed_at?.startsWith(today)).length;
    return {
      name: emp.name,
      total: empTasks.length,
      today: todayTasks,
      efficiency: Math.min(Math.round((todayTasks / DAILY_GOAL) * 100), 100)
    };
  });

  // 4. Auditoria de Atribuição (Quem está trabalhando mais na gestão?)
  const assignmentStats = tasks.reduce((acc, t) => {
    if (t.assigned_by) acc[t.assigned_by] = (acc[t.assigned_by] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm text-slate-600">⬅️</button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Analítica</h1>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
            Modo: {userRole === 'criador' ? 'SISTEMA / JESSON' : userRole.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Cartões de Métricas Jesson Mode */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-white">
          <p className="text-[10px] font-black uppercase opacity-60">Taxa Conclusão</p>
          <p className="text-3xl font-black">{completionRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Total Criadas</p>
          <p className="text-3xl font-black text-slate-800">{totalCreated}</p>
        </div>
        {isCreator && (
          <>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400">Hoje Global</p>
              <p className="text-3xl font-black text-emerald-500">{completedToday.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400">Em Aberto</p>
              <p className="text-3xl font-black text-amber-500">{tasks.filter(t => t.status !== 'concluido').length}</p>
            </div>
          </>
        )}
      </div>

      {/* Auditoria de Atividades por Funcionário */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Desempenho da Equipe</h3>
        <div className="space-y-6">
          {employeePerformance.map((emp) => (
            <div key={emp.name} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold text-slate-800">{emp.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Meta: {emp.today}/{DAILY_GOAL} hoje</p>
                </div>
                <p className="text-sm font-black text-indigo-600">{emp.total} total</p>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${emp.efficiency >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${emp.efficiency}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auditoria de Gestão (Quem atribuiu) - Visão exclusiva Jesson */}
      {isCreator && (
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white mb-8">
          <h3 className="font-black text-indigo-400 uppercase text-[10px] tracking-widest mb-4">Fluxo de Gestão (Quem Atribui)</h3>
          <div className="space-y-4">
            {Object.entries(assignmentStats).map(([name, count]) => (
              <div key={name} className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-bold text-sm">{name}</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-black">{count} atribuições</span>
              </div>
            ))}
            {Object.keys(assignmentStats).length === 0 && <p className="text-white/40 text-xs italic">Nenhuma atribuição registrada.</p>}
          </div>
        </div>
      )}

      {!isCreator && !isManager && (
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <p className="text-center text-slate-400 text-sm font-bold">Você concluiu {completedToday.length} tarefas hoje. Continue assim!</p>
         </div>
      )}
    </div>
  );
};
