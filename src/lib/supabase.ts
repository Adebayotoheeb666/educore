import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log warnings for missing environment variables but don't throw at module load time
// This allows the module to load for code-splitting and lazy loading to work properly
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing environment variables:');
    console.warn('  VITE_SUPABASE_URL:', !!supabaseUrl);
    console.warn('  VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
}

console.log('[Supabase] Initializing client with URL:', supabaseUrl);

// Create client with fallback values to allow module initialization
// The actual client will fail at runtime if credentials are missing, which is acceptable
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
