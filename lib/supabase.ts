
import { createClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env em vez de process.env
// O Vite só expõe variáveis que começam com VITE_ por padrão.
// Tentamos ler ambos para garantir compatibilidade com o que você já configurou na Vercel.

const getEnv = (name: string) => {
  try {
    // @ts-ignore - Fallback para diferentes ambientes de build
    return import.meta.env[name] || import.meta.env[`VITE_${name.replace('NEXT_PUBLIC_', '')}`] || "";
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.warn(
    '⚠️ CONFIGURAÇÃO NECESSÁRIA:\n' +
    'As chaves do Supabase não foram detectadas corretamente.\n' +
    'Na Vercel, certifique-se de que as chaves comecem com VITE_:\n' +
    '1. VITE_SUPABASE_URL\n' +
    '2. VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
