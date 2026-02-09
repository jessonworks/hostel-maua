
import { createClient } from '@supabase/supabase-js';

// No ambiente de produção (Vercel), estas variáveis devem ser configuradas.
// Caso contrário, o console avisará o desenvolvedor.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ ATENÇÃO: Chaves do Supabase não encontradas. Verifique as Variáveis de Ambiente no Vercel/Local.\n' +
    'O sistema não conseguirá salvar dados até que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY sejam configuradas.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
