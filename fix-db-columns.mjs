import { createClient } from '@supabase/supabase-js';
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars. Need EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log("URL:", SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const sqls = [
  "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 5",
  "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0",
  "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier TEXT",
  "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT"
];

async function main() {
  for (const sql of sqls) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      console.log(sql, error ? `Error: ${error.message}` : 'ok');
    } catch (e: any) {
      console.log(sql, `RPC failed: ${e.message}`);
    }
  }
  console.log("Fix attempt done");
}

main();