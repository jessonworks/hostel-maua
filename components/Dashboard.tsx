
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Task } from '../types';
import { DAILY_GOAL } from '../constants';

interface DashboardProps {
  tasks: Task[];
  onBack: () => void;
  isManager: boolean;
  currentUser: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, onBack, isManager, currentUser }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Filtra dados com base no perfil
  const filteredTasks = isManager ? tasks : tasks.filter(t => t.employee === currentUser);
  const completedToday = filteredTasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(today));
  
  // Estatísticas de Funcionários
  const employeeStats = tasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(today)).reduce((acc, t) => {
    if (t.employee) {
      acc[t.employee] = (acc[t.employee] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const barData = [
    { day: 'S', tasks: 12 }, { day: 'T', tasks: 15 }, { day: 'Q', tasks: 8 }, 
    { day: 'Q', tasks: 18 }, { day: 'S', tasks: 20 }, { day: 'S', tasks: 22 }, 
    { day: 'Hoje', tasks: completedToday.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Performance</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 text-white">
          <p className="text-[10px] font-black uppercase opacity-60">Concluídas</p>
          <p className="text-4xl font-black">{completedToday.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400">Tempo Médio</p>
          <p className="text-2xl font-black text-slate-600">22<span className="text-sm font-bold">m</span></p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Tendência Semanal</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
              <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isManager && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Ranking da Equipe</h3>
          <div className="space-y-6">
            {/* Fix: Explicitly type sort parameters to ensure TypeScript identifies them as numbers for the subtraction operation */}
            {Object.entries(employeeStats).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([name, count], idx) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                    #{idx + 1}
                  </div>
                  <span className="font-bold text-slate-700">{name}</span>
                </div>
                <div className="text-right">
                   <p className="text-lg font-black text-slate-800">{count} <span className="text-[10px] text-slate-400">quartos</span></p>
                   <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      {/* Fix: Ensure count is treated as a number for division by DAILY_GOAL */}
                      <div className="h-full bg-emerald-400" style={{ width: `${(Number(count) / DAILY_GOAL) * 100}%` }} />
                   </div>
                </div>
              </div>
            ))}
            {Object.keys(employeeStats).length === 0 && <p className="text-slate-400 text-center text-sm py-4">Nenhum dado hoje.</p>}
          </div>
        </div>
      )}
    </div>
  );
};
