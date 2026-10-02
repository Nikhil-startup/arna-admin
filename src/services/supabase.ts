import { createClient } from '@supabase/supabase-js';

// NOTE: All sensitive keys, secrets, and database credentials are kept strictly in backend (arna-backend).
// The frontend never stores or exposes secrets in client-side bundles.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zxsyrzputfsclarigazm.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-backend-guarded';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

