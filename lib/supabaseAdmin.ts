import { createClient } from '@supabase/supabase-js';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const service = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || anon;
export const supabase = createClient(url, anon);
export const supabaseAdmin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });