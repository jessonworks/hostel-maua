
import { User } from './types';

export const MANAGER_PHONE = '+5521983584197';

export const EMPLOYEES: User[] = [
  { name: 'Joao', role: 'funcionario', pin: '1111', phone: '+559198168754' },
  { name: 'Rose', role: 'funcionario', pin: '2222', phone: '+5521986284676' },
  { name: 'Jeff', role: 'gerente', pin: '0000' },
  { name: 'Jesson', role: 'criador', pin: '9999' },
];

export const MOTIVATIONAL_QUOTES = [
  "Bom dia! Que Deus ilumine seus passos e abençoe seu trabalho hoje. 🙏",
  "Tudo posso naquele que me fortalece. Uma ótima jornada a todos! ✨",
  "O trabalho dignifica o homem. Faça o seu melhor e colha os frutos! 💪",
  "Sua dedicação é o que faz o Hostel Mauá ser um lar para nossos hóspedes. Gratidão! 🏠",
  "Comece o dia com um sorriso e o resto florescerá. Fé no caminho! 🌸",
  "Grandes vitórias são feitas de pequenos esforços diários. Vamos pra cima! 🚀",
  "Que a paz de Deus esteja no seu coração durante cada tarefa de hoje. ✨",
  "Você é capaz de coisas incríveis. Acredite no seu potencial! 🌟"
];

export const ROOMS = [
  '101', '102', '103', '104',
  '201', '202', '203', '204', '205',
  '301', '302', '303', '304', '305', '306'
];

export const AREAS = ['Cozinha', 'Recepção', 'Escadas', 'Laje'];

export const CHECKLISTS_BY_AREA: Record<string, string[]> = {
  'Quarto': [
    'Trocar roupa de cama e toalhas',
    'Limpar banheiro completo (box, vaso, pia)',
    'Aspirar e varrer o chão',
    'Tirar lixo e repor sacos',
    'Reabastecer amenities (papel, sabonete)',
    'Limpar espelhos e vidros',
    'Verificar AC / Ventilador / Luzes',
    'Organizar móveis e conferir frigobar'
  ],
  'Cozinha': [
    'Limpar fogão e bancadas',
    'Organizar geladeira (descartar itens vencidos)',
    'Lavar louça pendente e organizar armários',
    'Tirar lixo orgânico e reciclável',
    'Varrer e passar pano no piso'
  ],
  'Recepção': [
    'Limpar balcão e computador',
    'Organizar pastas e chaves',
    'Limpar vidros da fachada',
    'Verificar material de escritório',
    'Varrer a entrada principal'
  ],
  'Escadas': [
    'Varrer todos os degraus',
    'Passar pano úmido com desinfetante',
    'Limpar corrimãos',
    'Retirar teias de aranha dos cantos'
  ],
  'Laje': [
    'Organizar mesas, cadeiras e pufes',
    'Esvaziar cinzeiros e lixeiras',
    'Verificar plantas (regar se necessário)',
    'Varrer toda a área aberta',
    'Limpar superfícies da churrasqueira/bar'
  ]
};

// Fix for error in utils/whatsapp.ts: Provide default checklist items
export const CHECKLIST_ITEMS = CHECKLISTS_BY_AREA['Quarto'];

// Fix for error in components/Dashboard.tsx: Define daily completion goal
export const DAILY_GOAL = 8;
