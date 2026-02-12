
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
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newNotification, setNewNotification] = useState<string | null>(null);
  
  const tasksRef = useRef<Task[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const fullDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    if (view === 'chat') {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
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
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    } catch (e) { console.error(e); }
  };

  const triggerInternalNotification = (msg: string) => {
    setNewNotification(msg);
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    setTimeout(() => setNewNotification(null), 5000);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;
    loadTasks();
    loadMessages();
    
    const taskSub = supabase.channel('tasks_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks(true))
      .subscribe();
      
    const chatSub = supabase.channel('chat_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadMessages())
      .subscribe();

    return () => { 
      supabase.removeChannel(taskSub); 
      supabase.removeChannel(chatSub);
    };
  }, [currentUser]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentUser || sendingMessage) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase.from('messages').insert([{ 
        user_name: currentUser.name, 
        content: chatInput.trim(),
        created_at: new Date().toISOString()
      }]);
      if (!error) {
        setChatInput('');
        loadMessages();
      } else {
        alert("Erro ao enviar: " + error.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMessage(false);
    }
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
    const { error } = await supabase.from('tasks').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', task.id);
    if (error) {
      alert("Erro ao concluir: " + error.message);
      return;
    }
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
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-white">
        <div className="mb-12 text-center">
          <div className="w-28 h-28 bg-indigo-600 rounded-[2.5rem] shadow-[0_0_50px_rgba(79,70,229,0.3)] flex items-center justify-center mx-auto mb-8">
            <span className="text-5xl">🏨</span>
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter italic">MAUÁ HUB</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Sistema de Gestão Interna</p>
        </div>
        <div className="w-full max-sm bg-white rounded-[3rem] p-10 shadow-2xl text-slate-800">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Acesso via PIN Individual</label>
          <input type="password" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full text-5xl text-center tracking-[1rem] py-4 border-b-4 border-slate-100 focus:border-indigo-600 focus:outline-none transition-all font-black mb-10 text-indigo-600" maxLength={4} autoFocus />
          <button onClick={handleLogin} className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-200 active:scale-95 transition-all uppercase tracking-widest text-sm">Entrar no Turno</button>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'gerente' || currentUser.role === 'criador';
  const myTodayTasks = tasks.filter(t => t.employee === currentUser.name && (t.status !== 'concluido' || t.completed_at?.startsWith(todayStr)));

  return (
    <div className={`min-h-screen bg-[#F8FAFC] ${view === 'chat' ? 'h-screen flex flex-col pb-24 overflow-hidden' : 'pb-36'}`}>
      {/* Toast Notification */}
      {newNotification && (
        <div className="fixed top-6 left-4 right-4 z-[100] animate-bounce">
          <div className="bg-[#1E293B] text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between border-2 border-indigo-500/30 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">📢</span>
              <span className="font-bold text-sm">{newNotification}</span>
            </div>
            <button onClick={() => setNewNotification(null)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full">✕</button>
          </div>
        </div>
      )}

      {/* Header Compacto condicional */}
      {view === 'home' ? (
        <header className="bg-white p-6 sticky top-0 z-30 border-b border-slate-100 shadow-sm animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">M</div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-none">MAUÁ HUB</h1>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                  {currentUser.name} • <span className="text-slate-400">{currentUser.role === 'criador' ? 'ADMIN' : currentUser.role.toUpperCase()}</span>
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 active:bg-red-50 active:text-red-500 transition-all border border-slate-100">🚪</button>
          </div>
          <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-2">
               <span className="text-sm">🗓️</span>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{fullDate}</p>
             </div>
             <div className="flex items-center gap-1">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[9px] font-black text-emerald-600 uppercase">Online</span>
             </div>
          </div>
        </header>
      ) : (
        /* Header minimalista para Chat/Dash */
        <header className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <button onClick={() => setView('home')} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500">🏠</button>
             <h2 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                {view === 'chat' ? 'Mural da Equipe' : 'Visão Geral do Hotel'}
             </h2>
          </div>
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black">
             {currentUser.name[0]}
          </div>
        </header>
      )}

      <main className={`max-w-2xl mx-auto p-4 ${view === 'chat' ? 'flex-1 overflow-hidden p-0' : 'space-y-6'}`}>
        {view === 'home' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                   <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">Café com Fé</span>
                 </div>
                 <p className="text-xl font-black italic leading-tight tracking-tight drop-shadow-sm">"{MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length]}"</p>
               </div>
               <div className="absolute -right-8 -bottom-8 text-[12rem] opacity-10 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">🙏</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atividades</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl">📝</span>
                    <p className="text-2xl font-black text-indigo-600">{tasks.filter(t => t.status !== 'concluido').length}</p>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Pendentes no total</p>
               </div>
               <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between active:scale-95 transition-all" onClick={() => setView('dashboard')}>
                  <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Painel Geral</p>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xl font-black leading-none">STATUS</p>
                    <span className="text-2xl">🏨</span>
                  </div>
               </div>
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                  Minhas Atribuições
                </h2>
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{tasks.filter(t => t.employee === currentUser.name && t.status !== 'concluido').length} PARA MIM</span>
              </div>
              
              {tasks.filter(t => t.employee === currentUser.name && t.status !== 'concluido').length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 p-12 rounded-[3rem] text-center">
                  <span className="text-5xl block mb-4">✨</span>
                  <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Tudo em ordem!</p>
                  <p className="text-slate-300 text-xs mt-2 font-bold italic">Nenhuma tarefa pendente para você.</p>
                </div>
              ) : (
                tasks.filter(t => t.employee === currentUser.name && t.status !== 'concluido').map(t => (
                  <TaskCard key={t.id} task={t} onStart={handleStartTask} onFinish={() => { setActiveTask(t); setShowChecklist(true); }} currentUser={currentUser.name} />
                ))
              )}
            </section>
          </div>
        )}

        {view === 'chat' && (
          <div className="h-full flex flex-col bg-white animate-in slide-in-from-right-4 duration-500">
             <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <span className="text-4xl mb-4">🏝️</span>
                    <p className="font-black text-[10px] uppercase tracking-widest">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.user_name === currentUser.name ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <span className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 mr-1">
                        {m.user_name} • {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                      <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm font-bold shadow-sm leading-relaxed ${
                        m.user_name === currentUser.name 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-700 rounded-tl-none'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
             </div>
             
             <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-40">
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                  <input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                    placeholder="Mande um recado..." 
                    className="flex-1 bg-transparent px-4 py-2 font-bold text-sm outline-none placeholder:text-slate-300" 
                  />
                  <button 
                    onClick={handleSendMessage} 
                    disabled={sendingMessage || !chatInput.trim()}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-lg ${
                      sendingMessage || !chatInput.trim() ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {sendingMessage ? '...' : '🚀'}
                  </button>
                </div>
             </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="animate-in slide-in-from-left-4 duration-500">
            <Dashboard tasks={tasks} onBack={() => setView('home')} userRole={currentUser.role} currentUser={currentUser.name} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-[100] pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <button onClick={() => setView('home')} className={`p-3 flex flex-col items-center gap-1 transition-all rounded-2xl flex-1 ${view === 'home' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <span className="text-xl">🏠</span>
          <span className="text-[7px] font-black uppercase tracking-widest">Início</span>
        </button>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAdmin(true)} 
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center -translate-y-8 active:scale-90 transition-all text-2xl font-bold border-4 border-white"
          >
            ＋
          </button>
        )}

        <button onClick={() => setView('chat')} className={`p-3 flex flex-col items-center gap-1 transition-all rounded-2xl flex-1 relative ${view === 'chat' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <span className="text-xl">💬</span>
          <span className="text-[7px] font-black uppercase tracking-widest">Mural</span>
          <span className="absolute top-2 right-1/4 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
        </button>

        <button onClick={() => setView('dashboard')} className={`p-3 flex flex-col items-center gap-1 transition-all rounded-2xl flex-1 ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-300'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[7px] font-black uppercase tracking-widest">Quadro</span>
        </button>
      </nav>

      {showChecklist && activeTask && (
        <ChecklistModal 
          task={activeTask} 
          onClose={() => setShowChecklist(false)} 
          onUpdate={async (updatedTask) => {
             // Sincroniza checklist parcial
             await supabase.from('tasks').update({ checklist: updatedTask.checklist }).eq('id', updatedTask.id);
             loadTasks();
          }} 
          onComplete={handleCompleteTask} 
        />
      )}
      {showAdmin && <AdminPanel onAddTask={handleAddTask} onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;
