import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global reference for Supabase Client
let supabaseClient: SupabaseClient | null = null;

/**
 * Retorna true si las variables de entorno de Supabase están configuradas.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key && url.startsWith('http'));
}

/**
 * Retorna la instancia activa del cliente Supabase.
 * Si no hay credenciales, retorna null sin lanzar excepciones catastróficas.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false }
      });
      console.log('✅ Cliente Supabase inicializado con éxito:', url);
    } catch (err) {
      console.warn('⚠️ No se pudo inicializar Supabase Client:', err);
      supabaseClient = null;
    }
  } else {
    console.log('ℹ️ Supabase no configurado en .env. Se usará la capa de emulación vectorial en memoria.');
  }

  return supabaseClient;
}
