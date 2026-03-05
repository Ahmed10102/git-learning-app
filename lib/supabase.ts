import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
