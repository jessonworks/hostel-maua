
import { createClient } from '@supabase/supabase-js';

/**
 * Tenta obter as credenciais de várias fontes:
 * 1. process.env (Injetado pelo ambiente de execução/build)
 * 2. import.meta.env (Padrão Vite)
 * 3. window (Variáveis globais)
 */
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (e) {}
  
  if (typeof window !== 'undefined' && (window as any)[key]) {
    return (window as any)[key];
  }
  return '';
};

// Prioridade: VITE_ > NEXT_PUBLIC_ > NOMES PUROS > FALLBACK MANUAL
const supabaseUrl = (
  getEnv('VITE_SUPABASE_URL') || 
  getEnv('NEXT_PUBLIC_SUPABASE_URL') || 
  getEnv('SUPABASE_URL') ||
  'https://atbqrpxnpjmiwiohcobp.supabase.co'
).trim();

const supabaseAnonKey = (
  getEnv('VITE_SUPABASE_ANON_KEY') || 
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  getEnv('SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnFycHhucGptaXdpb2hjb2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTgxODcsImV4cCI6MjA4NjIzNDE4N30.TFUoxbtxVohk_EZCppRbaXrqMeHrhDIIWjizzUnZjeE'
).trim();

// Verificação de validade
const isValid = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;

if (!isValid) {
  console.error('❌ Supabase: Credenciais não encontradas ou inválidas.');
} else {
  console.log('✅ Supabase: Configurado com sucesso.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = isValid;
