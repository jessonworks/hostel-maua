
import { createClient } from '@supabase/supabase-js';

// Environment variables must be accessed via process.env in this environment.
// This change fixes the TypeScript error where import.meta.env was not recognized.

const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    '';

const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ CONFIGURAÇÃO DO SUPABASE AUSENTE:\n' +
    'As variáveis de ambiente não foram detectadas.\n' +
    'Certifique-se de adicioná-las no ambiente:\n' +
    '1. VITE_SUPABASE_URL\n' +
    '2. VITE_SUPABASE_ANON_KEY'
  );
}

// Inicializa o cliente com fallback para evitar erro fatal imediato
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
