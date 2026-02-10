
import { User } from './types';

export const MANAGER_PHONE = '+5521983584197';

export const EMPLOYEES: User[] = [
  { name: 'Joao', role: 'funcionario', pin: '1111', phone: '+559198168754' },
  { name: 'Rose', role: 'funcionario', pin: '2222', phone: '+5521986284676' },
  { name: 'Jeff', role: 'gerente', pin: '0000' },
  { name: 'Jesson', role: 'criador', pin: '9999' },
];

export const ROOMS = [
  '101', '102', '103', '104',
  '201', '202', '203', '204', '205',
  '301', '302', '303', '304', '305', '306'
];

export const AREAS = ['Cozinha', 'Recepção', 'Escadas', 'Laje'];

export const CHECKLIST_ITEMS = [
  'Trocar roupa de cama',
  'Limpar banheiro completo',
  'Aspirar/varrer o chão',
  'Tirar lixo',
  'Reabastecer amenities',
  'Verificar AC/Ventilador',
  'Limpar superfícies e móveis',
  'Organizar o quarto'
];

export const DAILY_GOAL = 8;
