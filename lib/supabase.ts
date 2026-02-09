
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // Tenta Vite
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}

  try {
    // Tenta Node/Vercel
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  
  return '';
};

// Fallbacks diretos com as chaves fornecidas
const DEFAULT_URL = 'https://atbqrpxnpjmiwiohcobp.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnFycHhucGptaXdpb2hjb2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTgxODcsImV4cCI6MjA4NjIzNDE4N30.TFUoxbtxVohk_EZCppRbaXrqMeHrhDIIWjizzUnZjeE';

const supabaseUrl = (getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || DEFAULT_URL).trim();
const supabaseAnonKey = (getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || DEFAULT_KEY).trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;

console.log('🔌 Conexão Supabase:', isSupabaseConfigured ? 'OK' : 'FALHA');
