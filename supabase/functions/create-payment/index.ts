import { serve } from "std/http/server.ts"
import { createClient } from "supabase"
import type { User } from "supabase"

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'https://cdiorocrwimhkowwfegd.supabase.co,http://localhost:8081,http://localhost:19006').split(',');

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
    };
  }
  return { 'Access-Control-Allow-Origin': '' };
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Authenticate the caller via JWT and confirm they are a valid user.
 * Unlike admin-api (which requires role=admin), payment creation is open to
 * any authenticated user — the ownership check on the order prevents
 * unauthorized payments.
 */
async function verifyUserWithJwt(
  supabaseAdmin: ReturnType<typeof createClient>,
  jwt: string
): Promise<User> {
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
  if (userError || !user) {
    throw new Error('Unauthorized')
  }
  return user
}

function validateOrderId(id: any): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new Error('Invalid payload: order id must be a valid UUID')
  }
  return id
}

function validateAmount(amount: any): number {
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    throw new Error('Invalid payload: amount must be a positive number')
  }
  return amount
}

function sanitizeSupabaseError(err: any): Error {
  if (err && typeof err === 'object' && 'code' in err) {
    return new Error('Database operation failed')
  }
  if (err instanceof Error) return err
  return new Error(String(err))
}

serve(async (req: Request) => {
  // CORS: validate origin against allowlist (no wildcard)
  const originHeaders = getCorsHeaders(req);
  const allHeaders = { ...corsHeaders, ...originHeaders };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: allHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      headers: { ...allHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    // Create admin client with service-role key (server-side only)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Authenticate the caller BEFORE any DB operation ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: missing Bearer token')
    }
    const jwt = authHeader.replace('Bearer ', '')
    const user = await verifyUserWithJwt(supabaseAdmin, jwt)

    // ── Parse request body exactly once ──
    const body = await req.json()
    if (!body || typeof body !== 'object' || !('order_id' in body) || !('amount' in body)) {
      throw new Error('Invalid request: missing "order_id" or "amount" field')
    }

    const { order_id, amount } = body
    const orderId = validateOrderId(order_id)
    const validatedAmount = validateAmount(amount)

    // ── IDOR prevention: verify the order belongs to this user ──
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single()

    if (orderError) throw sanitizeSupabaseError(orderError)
    if (!order) throw new Error('Order not found')
    if (order.user_id !== user.id) {
      throw new Error('Forbidden: order does not belong to authenticated user')
    }

    // ── Create payment record ──
    const { data: payment, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: user.id,
        amount: validatedAmount,
        status: 'pending',
      })
      .select()

    if (insertError) throw sanitizeSupabaseError(insertError)

    return new Response(JSON.stringify(payment), {
      headers: { ...allHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const error = sanitizeSupabaseError(err)
    const message = error.message
    const isAuthError = message.startsWith('Unauthorized') || message.startsWith('Forbidden')
    const status = isAuthError ? 403 : 400
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...allHeaders, 'Content-Type': 'application/json' },
      status,
    })
  }
})
