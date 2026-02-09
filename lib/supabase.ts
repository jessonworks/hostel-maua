
import { createClient } from '@supabase/supabase-js';

// No Vite, as variáveis de ambiente são acessadas via import.meta.env
// E devem obrigatoriamente começar com VITE_ para serem expostas ao navegador.

// Use type casting to handle environment variables safely and avoid TypeScript errors on import.meta
// Fallback to process.env if available for broader environment support
const env = (import.meta as any).env || (typeof process !== 'undefined' ? process.env : undefined) || {};

const supabaseUrl = (env.VITE_SUPABASE_URL || 
                    env.NEXT_PUBLIC_SUPABASE_URL || 
                    '').trim();

const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || 
                        env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        '').trim();

// Verificação de segurança para não quebrar o app se as chaves forem inválidas
const isValidConfig = supabaseUrl && 
                     supabaseAnonKey && 
                     !supabaseUrl.includes('placeholder') &&
                     supabaseUrl.startsWith('https://');

if (!isValidConfig) {
  console.warn(
    '⚠️ CONFIGURAÇÃO DO SUPABASE PENDENTE:\n' +
    'As variáveis de ambiente não foram detectadas ou são inválidas.\n' +
    'Certifique-se de adicioná-las na Vercel:\n' +
    '1. VITE_SUPABASE_URL\n' +
    '2. VITE_SUPABASE_ANON_KEY'
  );
}

// Inicializa o cliente. Se os dados forem inválidos, o cliente é criado com placeholders 
// para evitar erros de referência, mas falhará nas requisições de forma tratada.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseConfigured = isValidConfig;
