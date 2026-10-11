import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Публичный клиент (anon). На сервере — только чтение товаров; в браузере — админка под RLS. */
export function publicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

let browser: SupabaseClient | null = null;
export function browserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  browser ??= createClient(url, anonKey);
  return browser;
}

/** Серверный клиент с service role. Только в route handlers, никогда в клиентском коде. */
export function serviceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
