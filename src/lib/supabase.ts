import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize with a default empty values if missing - will error when actually used
export let supabase: ReturnType<typeof createClient> | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing environment variables:');
    console.error('  VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('  VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    // Don't throw here - let the app load and fail gracefully when supabase is actually used
    console.warn('[Supabase] Supabase client will not be initialized. Features requiring Supabase will fail.');
} else {
    console.log('[Supabase] Initializing client with URL:', supabaseUrl);
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    });
}
