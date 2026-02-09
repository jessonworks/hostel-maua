
import { User } from './types';

export const MANAGER_PHONE = '+5521983584197';

export const EMPLOYEES: User[] = [
  { name: 'João', role: 'funcionario', pin: '1111' },
  { name: 'Rose', role: 'funcionario', pin: '2222' },
  { name: 'Jefferson', role: 'funcionario', pin: '3333' },
  { name: 'Gerente', role: 'gerente', pin: '0000' },
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
