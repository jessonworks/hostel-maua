
import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus, TaskType } from './types';
import { EMPLOYEES } from './constants';
import { TaskCard } from './components/TaskCard';
import { ChecklistModal } from './components/ChecklistModal';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { openWhatsApp } from './utils/whatsapp';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [showChecklist, setShowChecklist] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Simulação de carregamento do Supabase
  useEffect(() => {
    const saved = localStorage.getItem('maua_tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('maua_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleLogin = () => {
    const user = EMPLOYEES.find(u => u.pin === pin);
    if (user) {
      setCurrentUser(user);
      setPin('');
    } else {
      alert('PIN incorreto!');
      setPin('');
    }
  };

  const handleStartTask = (task: Task) => {
    if (!currentUser) return;
    const updatedTask: Task = { 
      ...task, 
      status: 'andamento', 
      employee: currentUser.name, 
      started_at: new Date().toISOString() 
    };
    
    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    setActiveTask(updatedTask);
    setShowChecklist(true); // Abre o guia de processo imediatamente
  };

  const handleUpdateProgress = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setActiveTask(updatedTask);
  };

  const handleCompleteTask = (task: Task) => {
    if (!currentUser) return;
    const completedTask = { 
      ...task, 
      status: 'concluido' as TaskStatus, 
      completed_at: new Date().toISOString() 
    };
    
    setTasks(prev => prev.map(t => t.id === task.id ? completedTask : t));
    setShowChecklist(false);
    setActiveTask(null);
    openWhatsApp(completedTask, currentUser.name);
  };

  const handleAddTask = (name: string, type: TaskType, employee: string, notes: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      employee,
      notes,
      status: 'pendente',
      checklist: {},
      started_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setShowAdmin(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white">
        <div className="mb-12 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
            <span className="text-4xl font-bold">🏨</span>
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Hostel Mauá</h1>
          <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-xs">Gestão Operacional</p>
        </div>

        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-slate-800">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Acesso com PIN</label>
          <input 
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full text-4xl text-center tracking-[1rem] py-4 border-b-4 border-indigo-100 focus:border-indigo-500 focus:outline-none transition-colors font-black mb-8"
            maxLength={4}
            autoFocus
          />
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
          >
            ENTRAR NO SISTEMA
          </button>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return <Dashboard tasks={tasks} onBack={() => setView('home')} isManager={currentUser.role === 'gerente'} currentUser={currentUser.name} />;
  }

  const today = new Date().toISOString().split('T')[0];
  const myTasks = tasks.filter(t => t.employee === currentUser.name || (!t.employee && currentUser.role === 'gerente'));
  const completedToday = tasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(today)).length;
  const myCompletedToday = tasks.filter(t => t.employee === currentUser.name && t.status === 'concluido' && t.completed_at?.startsWith(today)).length;

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-white p-6 sticky top-0 z-30 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">MAUÁ HUB</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
              {currentUser.role === 'gerente' ? 'Painel de Gestão' : 'Operação Limpeza'} • {currentUser.name}
            </p>
          </div>
          <button onClick={() => setCurrentUser(null)} className="p-3 bg-slate-50 rounded-xl text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m4 4H7" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase">Minhas de Hoje</p>
            <p className="text-3xl font-black text-emerald-500">{myCompletedToday}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" onClick={() => setView('dashboard')}>
            <p className="text-[10px] font-black text-slate-400 uppercase">Total Equipe</p>
            <p className="text-3xl font-black text-indigo-600">{completedToday} ✅</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
            Tarefas Ativas
          </h2>
          <div className="space-y-1">
            {myTasks.filter(t => t.status !== 'concluido').map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStart={handleStartTask} 
                onFinish={() => { setActiveTask(task); setShowChecklist(true); }} 
                currentUser={currentUser.name}
              />
            ))}
            {myTasks.filter(t => t.status !== 'concluido').length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                 <p className="text-slate-400 font-bold">Tudo limpo por aqui! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Histórico Simples */}
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 opacity-50">Concluídas Hoje</h2>
          {myTasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(today)).map(task => (
             <TaskCard key={task.id} task={task} onStart={() => {}} onFinish={() => {}} currentUser={currentUser.name} />
          ))}
        </div>
      </main>

      {/* Navegação Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around items-center z-40 pb-8">
        <button onClick={() => setView('home')} className={`p-2 flex flex-col items-center ${view === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
           <span className="text-[10px] font-bold">Home</span>
        </button>
        
        {currentUser.role === 'gerente' && (
          <button 
            onClick={() => setShowAdmin(true)}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center active:scale-90 transition-transform -translate-y-4"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        )}

        <button onClick={() => setView('dashboard')} className={`p-2 flex flex-col items-center ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
           <span className="text-[10px] font-bold">Produtividade</span>
        </button>
      </nav>

      {showChecklist && activeTask && (
        <ChecklistModal 
          task={activeTask} 
          onClose={() => { setShowChecklist(false); setActiveTask(null); }}
          onUpdate={handleUpdateProgress}
          onComplete={handleCompleteTask}
        />
      )}

      {showAdmin && (
        <AdminPanel onAddTask={handleAddTask} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
};

export default App;
