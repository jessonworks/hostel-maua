
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, User, Message, TaskType } from './types.ts';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [view, setView] = useState<'home' | 'chat' | 'dashboard'>('home');
  const [showChecklist, setShowChecklist] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNotification, setNewNotification] = useState<string | null>(null);
  
  const tasksRef = useRef<Task[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const fullDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Auto-scroll chat
  useEffect(() => {
    if (view === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  useEffect(() => {
    const savedPin = localStorage.getItem('maua_hub_session');
    if (savedPin) {
      const user = EMPLOYEES.find(u => u.pin === savedPin);
      if (user) setCurrentUser(user);
    }
  }, []);

  const loadTasks = async (isUpdate = false) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (data) {
        if (isUpdate && currentUser) {
          const newTasks = data.filter(t => t.employee === currentUser.name && t.status === 'pendente' && !tasksRef.current.find(oldT => oldT.id === t.id));
          if (newTasks.length > 0) triggerInternalNotification(`🔔 Nova tarefa: ${newTasks[0].name}`);
        }
        setTasks(data);
        tasksRef.current = data;
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMessages = async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
    if (data) setMessages(data);
  };

  const triggerInternalNotification = (msg: string) => {
    setNewNotification(msg);
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    setTimeout(() => setNewNotification(null), 5000);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    loadTasks();
    loadMessages();
    
    const taskSub = supabase.channel('tasks_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks(true)).subscribe();
    const chatSub = supabase.channel('chat_rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadMessages()).subscribe();

    return () => { 
      supabase.removeChannel(taskSub); 
      supabase.removeChannel(chatSub);
    };
  }, [currentUser]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentUser) return;
    const { error } = await supabase.from('messages').insert([{ user_name: currentUser.name, content: chatInput.trim() }]);
    if (!error) setChatInput('');
  };

  const handleLogin = () => {
    const user = EMPLOYEES.find(u => u.pin === pin);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('maua_hub_session', pin);
      setPin('');
    } else {
      alert('PIN incorreto!');
      setPin('');
    }
  };

  const handleLogout = () => {
    if (confirm('Sair do sistema?')) {
      localStorage.removeItem('maua_hub_session');
      setCurrentUser(null);
    }
  };

  const handleStartTask = async (task: Task) => {
    if (!currentUser) return;
    await supabase.from('tasks').update({ status: 'andamento', employee: currentUser.name, started_at: new Date().toISOString() }).eq('id', task.id);
    await loadTasks();
    setActiveTask({ ...task, status: 'andamento', employee: currentUser.name });
    setShowChecklist(true);
  };

  const handleCompleteTask = async (task: Task) => {
    if (!currentUser) return;
    await supabase.from('tasks').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', task.id);
    await loadTasks();
    setShowChecklist(false);
    setActiveTask(null);
    openWhatsApp({ ...task, status: 'concluido' }, currentUser.name);
  };

  const handleAddTask = async (name: string, type: TaskType, employee: string, notes: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('tasks').insert([{ name, type, employee: employee || null, assigned_by: currentUser.name, notes, status: 'pendente', checklist: {} }]);
    if (!error) {
      await loadTasks();
      setShowAdmin(false);
      if (employee) openAssignmentWhatsApp(name, employee, currentUser.name, notes);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="mb-12 text-center">
          <div className="w-24 h-24 bg-indigo-500 rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏨</span>
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Hostel Mauá</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Hub de Operações</p>
        </div>
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-slate-800">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Digite seu PIN</label>
          <input type="password" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-4xl text-center tracking-[1rem] py-4 border-b-4 border-slate-100 focus:border-indigo-500 focus:outline-none transition-colors font-black mb-8" maxLength={4} autoFocus />
          <button onClick={handleLogin} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">ACESSAR PAINEL</button>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'gerente' || currentUser.role === 'criador';
  const myTodayTasks = tasks.filter(t => t.employee === currentUser.name && (t.status !== 'concluido' || t.completed_at?.startsWith(todayStr)));
  const myCompletedToday = myTodayTasks.filter(t => t.status === 'concluido').length;
  const totalMyTasks = myTodayTasks.length;

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      {newNotification && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-bounce">
          <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-white/20 backdrop-blur-md">
            <span className="font-black text-sm">{newNotification}</span>
            <button onClick={() => setNewNotification(null)} className="text-xl">✕</button>
          </div>
        </div>
      )}

      <header className="bg-white p-6 sticky top-0 z-30 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">MAUÁ HUB</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              {currentUser.name} • {currentUser.role}
            </p>
          </div>
          <button onClick={handleLogout} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:bg-red-50 active:text-red-500 transition-colors">🚪</button>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-xl">
           <span className="text-lg">📅</span>
           <p className="text-xs font-black text-indigo-900 uppercase tracking-widest opacity-80">{fullDate}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {view === 'home' && (
          <>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-800 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-[9px] font-black uppercase opacity-60 mb-2 tracking-widest">Bom dia com Fé</p>
                 <p className="text-xl font-extrabold italic leading-tight">"{MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length]}"</p>
               </div>
               <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 rotate-12">🙏</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Suas Tarefas</p>
                  <p className="text-3xl font-black text-indigo-600">{myCompletedToday} <span className="text-sm text-slate-300">/ {totalMyTasks}</span></p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${totalMyTasks > 0 ? (myCompletedToday / totalMyTasks) * 100 : 0}%` }}></div>
                  </div>
               </div>
               <div className="bg-emerald-500 p-6 rounded-3xl shadow-lg shadow-emerald-100 text-white flex flex-col justify-between" onClick={() => setView('dashboard')}>
                  <p className="text-[10px] font-black opacity-60 uppercase">Métricas</p>
                  <div className="flex justify-between items-end">
                    <p className="text-lg font-black">Global</p>
                    <span className="text-2xl">📊</span>
                  </div>
               </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                Tarefas do Turno
              </h2>
              {tasks.filter(t => t.employee === currentUser.name && t.status !== 'concluido').map(t => (
                <TaskCard key={t.id} task={t} onStart={handleStartTask} onFinish={() => { setActiveTask(t); setShowChecklist(true); }} currentUser={currentUser.name} />
              ))}
              {isAdmin && tasks.filter(t => t.employee !== currentUser.name && t.status !== 'concluido').length > 0 && (
                <div className="mt-8 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Monitoramento Equipe</p>
                  {tasks.filter(t => t.employee !== currentUser.name && t.status !== 'concluido').map(t => (
                    <TaskCard key={t.id} task={t} onStart={handleStartTask} onFinish={() => {}} currentUser={currentUser.name} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {view === 'chat' && (
          <div className="bg-white rounded-3xl shadow-xl flex flex-col h-[70vh] border border-slate-100 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
                <span className="text-xl">💬</span>
                <p className="font-black text-slate-800 uppercase text-xs tracking-widest">Mural da Equipe</p>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.user_name === currentUser.name ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{m.user_name} • {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm font-bold shadow-sm ${m.user_name === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
             </div>
             <div className="p-4 border-t flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Aviso rápido..." className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={handleSendMessage} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-transform">🚀</button>
             </div>
          </div>
        )}

        {view === 'dashboard' && <Dashboard tasks={tasks} onBack={() => setView('home')} userRole={currentUser.role} currentUser={currentUser.name} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 flex justify-around items-center z-40 pb-8">
        <button onClick={() => setView('home')} className={`p-4 flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <span className="text-2xl">🏠</span>
          <span className="text-[9px] font-black uppercase">Home</span>
        </button>
        {isAdmin && (
          <button onClick={() => setShowAdmin(true)} className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center -translate-y-8 active:scale-90 transition-all text-3xl font-bold border-8 border-slate-50">＋</button>
        )}
        <button onClick={() => setView('chat')} className={`p-4 flex flex-col items-center gap-1 transition-all ${view === 'chat' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <span className="text-2xl">💬</span>
          <span className="text-[9px] font-black uppercase">Chat</span>
        </button>
        <button onClick={() => setView('dashboard')} className={`p-4 flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <span className="text-2xl">📊</span>
          <span className="text-[9px] font-black uppercase">Stats</span>
        </button>
      </nav>

      {showChecklist && activeTask && <ChecklistModal task={activeTask} onClose={() => setShowChecklist(false)} onUpdate={loadTasks} onComplete={handleCompleteTask} />}
      {showAdmin && <AdminPanel onAddTask={handleAddTask} onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;
