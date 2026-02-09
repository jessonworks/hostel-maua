
import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus, TaskType } from './types.ts';
import { EMPLOYEES } from './constants.ts';
import { TaskCard } from './components/TaskCard.tsx';
import { ChecklistModal } from './components/ChecklistModal.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { openWhatsApp } from './utils/whatsapp.ts';
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
      setTasks(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar tarefas:', error);
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
      setPin('');
    } else {
      alert('PIN incorreto!');
      setPin('');
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
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white text-center">
        <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-black mb-4">Configuração Necessária</h1>
        <p className="text-slate-400 mb-8 max-w-md">
          O sistema foi carregado, mas as chaves do Supabase não foram encontradas.
        </p>
        <div className="bg-slate-800 p-6 rounded-2xl text-left w-full max-w-md border border-slate-700">
          <p className="text-xs font-bold text-indigo-400 uppercase mb-4">Ação necessária no Vercel:</p>
          <ol className="text-sm space-y-3 text-slate-300">
            <li>1. Vá em <b>Settings &gt; Environment Variables</b></li>
            <li>2. Adicione <b>VITE_SUPABASE_URL</b></li>
            <li>3. Adicione <b>VITE_SUPABASE_ANON_KEY</b></li>
            <li>4. Realize um novo <b>Deploy</b></li>
          </ol>
        </div>
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
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Gestão Operacional</p>
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
          <button onClick={handleLogin} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">ENTRAR</button>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return <Dashboard tasks={tasks} onBack={() => setView('home')} userRole={currentUser.role} currentUser={currentUser.name} />;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isAdminOrManager = currentUser.role === 'gerente' || currentUser.role === 'criador';
  const myTasks = tasks.filter(t => t.employee === currentUser.name || (!t.employee && isAdminOrManager));
  const completedTodayCount = tasks.filter(t => t.status === 'concluido' && t.completed_at?.startsWith(todayStr)).length;

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-white p-6 sticky top-0 z-30 border-b border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">MAUÁ HUB</h1>
          <p className="text-[10px] font-bold text-indigo-500 uppercase">
            {currentUser.role.toUpperCase()} • {currentUser.name}
          </p>
        </div>
        <button onClick={() => setCurrentUser(null)} className="p-3 bg-slate-50 rounded-xl text-slate-400">🚪</button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold">Sincronizando...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase">Status Global</p>
                <p className="text-3xl font-black text-indigo-600">{completedTodayCount} ✅</p>
              </div>
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100 text-white cursor-pointer active:scale-95 transition-transform" onClick={() => setView('dashboard')}>
                <p className="text-[10px] font-black opacity-60 uppercase">Métricas</p>
                <p className="text-xl font-black">Dashboard 📈</p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Tarefas do Dia</h2>
              <div className="space-y-1">
                {myTasks.filter(t => t.status !== 'concluido').map(task => (
                  <TaskCard key={task.id} task={task} onStart={handleStartTask} onFinish={() => { setActiveTask(task); setShowChecklist(true); }} currentUser={currentUser.name} />
                ))}
                {myTasks.filter(t => t.status !== 'concluido').length === 0 && (
                  <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                     <p className="text-slate-400 font-bold">Tudo limpo por aqui! 🎉</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around items-center z-40 pb-8">
        <button onClick={() => setView('home')} className={`p-2 text-2xl ${view === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>🏠</button>
        {isAdminOrManager && (
          <button onClick={() => setShowAdmin(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center -translate-y-4 active:scale-90 transition-transform text-2xl font-bold">＋</button>
        )}
        <button onClick={() => setView('dashboard')} className={`p-2 text-2xl ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>📊</button>
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
