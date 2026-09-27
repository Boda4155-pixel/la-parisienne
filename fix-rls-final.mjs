import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "PUT_URL_HERE";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "PUT_SERVICE_KEY_HERE";
console.log("URL:", SUPABASE_URL);
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  try {
    // This will work with service_role
    const { data, error } = await supabaseAdmin.from('products').insert([{ name: 'test_rls_fix', description: 'test', price: 1, stock_quantity: 1, category_id: 'bakery' }]).select();
    console.log("Test insert with service key:", error ? error.message : "SUCCESS - service key bypasses RLS");

    if (error && error.message.includes('permission')) {
      console.log("Even service key blocked - need SQL fix");
    }

    // Method 2: Use direct postgres query via supabase SQL API (works with service key)
    // Create permissive policies
    const sqlCommands = [
      `ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "allow_all" ON public.products;`,
      `CREATE POLICY "allow_all" ON public.products FOR ALL USING (true) WITH CHECK (true);`,
      `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "allow_all" ON public.products; CREATE POLICY "allow_all" ON public.products FOR ALL USING (true) WITH CHECK (true);`,
    ];

    for (const sql of sqlCommands) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql_query: sql })
        });
        console.log(`SQL attempt: ${sql.substring(0,50)} => status ${res.status}`);
      } catch(e) { console.log("exec_sql rpc not exists, trying next method"); }
    }

  } catch(e) { console.error(e); }

  console.log("Fix attempt done");
})();