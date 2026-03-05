import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — only created on first use, never during SSR prerender
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null; // SSR / prerender — skip
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // env vars missing — fail gracefully
  if (!_client) _client = createClient(url, key);
  return _client;
}

// Generate or retrieve a stable session ID for this browser
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('git-academy-session-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('git-academy-session-id', id);
  }
  return id;
}
