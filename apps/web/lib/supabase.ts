import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://alwcpunozmheencsybgc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_I4HWc_WIcYjJC3i5aqOtoQ_oOcKejvv';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLIC_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

