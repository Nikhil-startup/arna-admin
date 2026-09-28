import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zxsyrzputfsclarigazm.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_3wAFaiAeBRNvaq4_3bJYww_Iz__v_tf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
