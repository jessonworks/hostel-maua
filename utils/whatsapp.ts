
import { Task } from '../types';
import { MANAGER_PHONE, CHECKLIST_ITEMS } from '../constants';

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
