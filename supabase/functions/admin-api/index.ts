import { serve } from "std/http/server.ts"
import { createClient } from "supabase"
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { action, payload } = await req.json()

    let result;
    if (action === 'create-product') {
      result = await supabaseAdmin.from('products').insert(payload).select()
    } else if (action === 'delete-order') {
      result = await supabaseAdmin.from('orders').delete().eq('id', payload.id)
    } else {
      throw new Error('Invalid action')
    }

    if (result.error) throw result.error

    return new Response(JSON.stringify(result.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})