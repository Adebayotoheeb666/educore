import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing environment variables:');
    console.error('  VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('  VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('[Supabase] Initializing client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
