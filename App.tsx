
import React, { useState, useEffect, useMemo } from 'react';
import { Task, User, TaskStatus, TaskType } from './types.ts';
import { EMPLOYEES, MOTIVATIONAL_QUOTES } from './constants.ts';
import { TaskCard } from './components/TaskCard.tsx';
import { ChecklistModal } from './components/ChecklistModal.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { openWhatsApp, openAssignmentWhatsApp } from './utils/whatsapp.ts';
import { supabase, isSupabaseConfigured } from './lib/supabase.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [showChecklist, setShowChecklist] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Seleciona frase do dia baseada na data
  const dailyQuote = useMemo(() => {
    const day = new Date().getDate();
    return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
  }, []);

  // Login Persistente: Checa se há usuário salvo
  useEffect(() => {
    const savedPin = localStorage.getItem('maua_hub_session');
    if (savedPin) {
      const user = EMPLOYEES.find(u => u.pin === savedPin);
      if (user) setCurrentUser(user);
    }
  }, []);

  const loadTasks = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Cache local para suporte offline básico
      if (data) {
        setTasks(data);
        localStorage.setItem('maua_tasks_cache', JSON.stringify(data));
      }
    } catch (error: any) {
      console.error('Erro ao carregar tarefas:', error);
      // Fallback para cache se estiver offline
      const cached = localStorage.getItem('maua_tasks_cache');
      if (cached) setTasks(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    loadTasks();
    const channel = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogin = () => {
    const user = EMPLOYEES.find(u => u.pin === pin);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('maua_hub_session', pin); // Salva a sessão
      setPin('');
    } else {
      alert('PIN incorreto!');
      setPin('');
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair? Você precisará do PIN para entrar novamente.')) {
      localStorage.removeItem('maua_hub_session');
      setCurrentUser(null);
    }
  };

  const handleStartTask = async (task: Task) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'andamento', employee: currentUser.name, started_at: new Date().toISOString() })
      .eq('id', task.id);
    if (error) alert('Erro ao iniciar: ' + error.message);
    else {
      loadTasks();
      setActiveTask({ ...task, status: 'andamento', employee: currentUser.name });
      setShowChecklist(true);
    }
  };

  const handleUpdateProgress = async (updatedTask: Task) => {
    await supabase.from('tasks').update({ checklist: updatedTask.checklist }).eq('id', updatedTask.id);
  };

  const handleCompleteTask = async (task: Task) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'concluido', completed_at: new Date().toISOString() })
      .eq('id', task.id);
    if (error) alert('Erro ao finalizar: ' + error.message);
    else {
      loadTasks();
      setShowChecklist(false);
      setActiveTask(null);
      openWhatsApp({ ...task, status: 'concluido' }, currentUser.name);
    }
  };

  const handleAddTask = async (name: string, type: TaskType, employee: string, notes: string) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('tasks')
      .insert([{
        name,
        type,
        employee: employee || null,
        assigned_by: currentUser.name,
        notes,
        status: 'pendente',
        checklist: {}
      }]);

    if (error) {
      alert('Erro ao criar tarefa: ' + error.message);
    } else {
      await loadTasks();
      setShowAdmin(false);
      if (employee) {
        openAssignmentWhatsApp(name, employee, currentUser.name, notes);
      }
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white text-center">
        <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-black mb-4">Configuração Necessária</h1>
        <p className="text-slate-400 mb-8 max-w-md">As chaves do Supabase não foram encontradas.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="mb-12 text-center">
          <div className="w-24 h-24 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl">🏨</span>
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Hostel Mauá</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gestão Operacional</p>
        </div>
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-slate-800">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Acesso com PIN</label>
          <input 
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full text-4xl text-center tracking-[1rem] py-4 border-b-4 border-indigo-100 focus:border-indigo-500 focus:outline-none transition-colors font-black mb-8"
            maxLength={4}
            autoFocus
          />
          <button onClick={handleLogin} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">ENTRAR NO HUB</button>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return <Dashboard tasks={tasks} onBack={() => setView('home')} userRole={currentUser.role} currentUser={currentUser.name} />;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isAdminOrManager = currentUser.role === 'gerente' || currentUser.role === 'criador';
  
  const inProgressTasks = tasks.filter(t => t.status === 'andamento');
  const pendingTasks = tasks.filter(t => t.status === 'pendente');
  const completedToday = tasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(todayStr));
  const myActionableTasks = tasks.filter(t => t.employee === currentUser.name && t.status !== 'concluido');
  const myManagementTasks = tasks.filter(t => (isAdminOrManager && t.status !== 'concluido'));

  return (
    <div className="min-h-screen pb-32 bg-slate-50/50">
      <header className="bg-white p-6 sticky top-0 z-30 border-b border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">MAUÁ HUB</h1>
          <p className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            {currentUser.name} ({currentUser.role})
          </p>
        </div>
        <button onClick={handleLogout} className="p-3 bg-slate-50 rounded-xl text-slate-400 active:bg-red-50 active:text-red-500 transition-colors">🚪</button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Banner Motivacional */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-[0.2em]">Mensagem do Dia</p>
            <p className="text-lg font-extrabold leading-tight italic">"{dailyQuote}"</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12">✨</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando Dados...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Seu Progresso</p>
                <p className="text-3xl font-black text-indigo-600">{tasks.filter(t => t.employee === currentUser.name && t.status === 'concluido' && t.completed_at?.startsWith(todayStr)).length} <span className="text-lg text-slate-300">/ {completedToday.length} total</span></p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform flex flex-col justify-between" onClick={() => setView('dashboard')}>
                <p className="text-[10px] font-black text-slate-400 uppercase">Analítica</p>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-black text-slate-800">Métricas</p>
                  <span className="text-xl">📊</span>
                </div>
              </div>
            </div>

            {/* MINHAS TAREFAS - Prioridade Máxima */}
            {myActionableTasks.length > 0 && (
              <section className="bg-indigo-50/30 p-4 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                  <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Suas Próximas Atividades</h2>
                </div>
                <div className="space-y-2">
                  {myActionableTasks.map(task => (
                    <TaskCard key={task.id} task={task} onStart={handleStartTask} onFinish={() => { setActiveTask(task); setShowChecklist(true); }} currentUser={currentUser.name} />
                  ))}
                </div>
              </section>
            )}

            {/* MONITORAMENTO - Gestores */}
            {isAdminOrManager && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Monitoramento Geral</h2>
                </div>
                
                <div className="space-y-6">
                  {inProgressTasks.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                        Em Execução
                      </p>
                      {inProgressTasks.map(task => (
                        <TaskCard key={task.id} task={task} onStart={handleStartTask} onFinish={() => { setActiveTask(task); setShowChecklist(true); }} currentUser={currentUser.name} />
                      ))}
                    </div>
                  )}

                  {pendingTasks.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">⏳ Aguardando Início</p>
                      {pendingTasks.map(task => (
                        <TaskCard key={task.id} task={task} onStart={handleStartTask} onFinish={() => { setActiveTask(task); setShowChecklist(true); }} currentUser={currentUser.name} />
                      ))}
                    </div>
                  )}

                  {myManagementTasks.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold">Nenhuma tarefa ativa. Bom trabalho! 🎉</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {completedToday.length > 0 && (
              <section className="pt-4 opacity-70 grayscale-[0.5]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    Concluídos Hoje
                    <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full">{completedToday.length}</span>
                  </h2>
                </div>
                <div className="space-y-1">
                  {completedToday.map(task => (
                    <TaskCard key={task.id} task={task} onStart={handleStartTask} onFinish={() => {}} currentUser={currentUser.name} />
                  ))}
                </div>
              </section>
            )}

            {!isAdminOrManager && myActionableTasks.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                 <div className="text-6xl mb-4">🙌</div>
                 <h2 className="text-xl font-black text-slate-800">Missão Cumprida!</h2>
                 <p className="text-slate-400 font-medium max-w-xs mx-auto">Você não tem tarefas pendentes agora. Deus abençoe seu descanso!</p>
              </div>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around items-center z-40 pb-8">
        <button onClick={() => setView('home')} className={`p-4 text-2xl transition-all ${view === 'home' ? 'bg-indigo-50 text-indigo-600 rounded-2xl' : 'text-slate-300'}`}>🏠</button>
        {isAdminOrManager && (
          <button onClick={() => setShowAdmin(true)} className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center -translate-y-8 active:scale-90 transition-all text-3xl font-bold border-8 border-slate-50">＋</button>
        )}
        <button onClick={() => setView('dashboard')} className={`p-4 text-2xl transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600 rounded-2xl' : 'text-slate-300'}`}>📊</button>
      </nav>

      {showChecklist && activeTask && (
        <ChecklistModal task={activeTask} onClose={() => setShowChecklist(false)} onUpdate={handleUpdateProgress} onComplete={handleCompleteTask} />
      )}
      {showAdmin && (
        <AdminPanel onAddTask={handleAddTask} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
};

export default App;
