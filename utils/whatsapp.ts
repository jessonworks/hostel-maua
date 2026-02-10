
import { Task } from '../types';
import { MANAGER_PHONE, CHECKLIST_ITEMS, EMPLOYEES } from '../constants';

export const openWhatsApp = (task: Task, employee: string) => {
  const dataHora = new Date().toLocaleString('pt-BR');
  
  const checklistText = CHECKLIST_ITEMS.map(item => `✓ ${item}`).join('\n');
  const notesText = task.notes ? `\n📝 Nota: ${task.notes}` : '';

  const mensagem = `✅ ${task.name} concluída
📅 ${dataHora}
👤 ${employee}${notesText}

📋 Checklist:
${checklistText}

🚀 Pronto para o próximo hóspede!`;

  const whatsappUrl = `https://wa.me/${MANAGER_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
  window.open(whatsappUrl, '_blank');
};

export const openAssignmentWhatsApp = (taskName: string, employeeName: string, managerName: string, notes?: string) => {
  const employee = EMPLOYEES.find(e => e.name === employeeName);
  if (!employee || !employee.phone) return;

  const notesText = notes ? `\n📝 Observação: ${notes}` : '';
  const mensagem = `🔔 Nova Tarefa Atribuída!
  
📍 Local: ${taskName}
👤 Atribuído por: ${managerName}${notesText}

Acesse o sistema para iniciar a limpeza assim que possível! 🏨`;

  const whatsappUrl = `https://wa.me/${employee.phone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
  window.open(whatsappUrl, '_blank');
};
