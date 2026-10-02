import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { user_id } = await req.json()
    if(!user_id) throw new Error('user_id required')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (error) throw error

    await supabaseAdmin.from('staff_members').delete().eq('id', user_id)

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" } 
    })
  } catch(e:any){
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { "Content-Type": "application/json" } })
  }
})