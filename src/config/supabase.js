import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
}

const clearLegacyPersistentAuth = () => {
  if (typeof window === 'undefined') return;

  try {
    const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
    window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
    window.localStorage.removeItem('supabase.auth.token');
  } catch (error) {
    console.warn('Unable to clear legacy auth storage:', error);
  }
};

clearLegacyPersistentAuth();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: 'taskray-auth-session',
  },
});
