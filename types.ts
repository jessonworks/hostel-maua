
export type TaskStatus = 'pendente' | 'andamento' | 'concluido';
export type TaskType = 'quarto' | 'area';

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  employee: string | null;
  assigned_by: string | null;
  status: TaskStatus;
  checklist: Record<string, boolean>;
  notes?: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface User {
  name: string;
  role: 'gerente' | 'funcionario' | 'criador';
  pin: string;
  phone?: string;
}

export interface Message {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface ProductivityStats {
  employee: string;
  tasks_completed: number;
  avg_time_minutes: number;
  date: string;
}
