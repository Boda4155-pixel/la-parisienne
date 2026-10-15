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

/**
 * Role-based authorization for admin API actions.
 * Returns the authenticated user and profile role so the handler can
 * enforce per-action permission requirements.
 *
 * Role semantics:
 * - admin: Full access — all actions including product creation and order deletion
 */
async function verifyAdminWithJwt(
  supabaseAdmin: ReturnType<typeof createClient>,
  jwt: string
): Promise<{ user: User; role: string }> {
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Unauthorized: profile not found')
  }

  if (profile.role !== 'admin') {
    throw new Error('Forbidden: admin role required')
  }

  return { user, role: profile.role }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ALLOWED_PRODUCT_FIELDS = new Set([
  'name',
  'description',
  'price',
  'stock_quantity',
  'category_id',
  'category',
  'is_active',
  'is_available',
  'image_url',
  'sort_order',
])

interface CreateProductPayload {
  name: string
  description?: string | null
  price: number
  stock_quantity?: number
  category_id?: string | null
  is_active?: boolean
  is_available?: boolean
  image_url?: string | null
}

function validateProductPayload(payload: any): CreateProductPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: expected object')
  }

  // Whitelist: only copy allowed fields, ignore everything else
  const cleaned: any = {}
  for (const key of ALLOWED_PRODUCT_FIELDS) {
    if (key in payload) {
      cleaned[key] = payload[key]
    }
  }

  if (!cleaned.name || typeof cleaned.name !== 'string' || cleaned.name.trim() === '') {
    throw new Error('Invalid payload: name is required and must be a non-empty string')
  }

  if (typeof cleaned.price !== 'number' || !isFinite(cleaned.price) || cleaned.price < 0) {
    throw new Error('Invalid payload: price must be a non-negative number')
  }

  if (cleaned.stock_quantity !== undefined) {
    if (typeof cleaned.stock_quantity !== 'number' || !Number.isInteger(cleaned.stock_quantity) || cleaned.stock_quantity < 0) {
      throw new Error('Invalid payload: stock_quantity must be a non-negative integer')
    }
  }

  if (cleaned.is_active !== undefined && typeof cleaned.is_active !== 'boolean') {
    throw new Error('Invalid payload: is_active must be a boolean')
  }

  if (cleaned.is_available !== undefined && typeof cleaned.is_available !== 'boolean') {
    throw new Error('Invalid payload: is_available must be a boolean')
  }

  if (cleaned.category_id !== undefined && cleaned.category_id !== null) {
    if (typeof cleaned.category_id !== 'string' || !UUID_REGEX.test(cleaned.category_id)) {
      throw new Error('Invalid payload: category_id must be a valid UUID or null')
    }
  }

  // description and image_url: must be string or null (not objects, arrays, etc.)
  if (cleaned.description !== undefined && cleaned.description !== null) {
    if (typeof cleaned.description !== 'string') {
      throw new Error('Invalid payload: description must be a string or null')
    }
    if (cleaned.description.length > 500) {
      throw new Error('Invalid payload: description must not exceed 500 characters')
    }
  }

  if (cleaned.image_url !== undefined && cleaned.image_url !== null) {
    if (typeof cleaned.image_url !== 'string') {
      throw new Error('Invalid payload: image_url must be a string or null')
    }
  }

  return cleaned as CreateProductPayload
}

function validateOrderId(id: any): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new Error('Invalid payload: order id must be a valid UUID')
  }
  return id
}

function validateProductId(id: any): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new Error('Invalid payload: product id must be a valid UUID')
  }
  return id
}

/**
 * Sanitize Supabase errors so internal details (column names, constraint
 * names, internal UUIDs) are not leaked to the caller.
 */
function sanitizeSupabaseError(err: any): Error {
  if (err && typeof err === 'object' && 'code' in err) {
    // PostgrestError — return a generic message without internal details
    return new Error('Database operation failed')
  }
  if (err instanceof Error) return err
  return new Error(String(err))
}

serve(async (req: Request) => {
  // CORS: validate origin against allowlist (no wildcard)
  const originHeaders = getCorsHeaders(req);
  const allHeaders = { ...corsHeaders, ...originHeaders };

  // Handle CORS preflight (must come before POST-only enforcement)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: allHeaders })
  }

  // Only allow POST — reject GET, PUT, DELETE, etc.
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

    // ── Authenticate and authorize the caller BEFORE any DB operation ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: missing Bearer token')
    }
    const jwt = authHeader.replace('Bearer ', '')
    const { role: callerRole } = await verifyAdminWithJwt(supabaseAdmin, jwt)

    // ── Parse request body exactly once ──
    const body = await req.json()
    if (!body || typeof body !== 'object' || !('action' in body)) {
      throw new Error('Invalid request: missing "action" field')
    }

    const { action, payload } = body

    // Whitelist allowed actions
    const ALLOWED_ACTIONS = new Set([
      'create-product',
      'update-product',
      'delete-product',
      'reorder-products',
      'toggle-product-availability',
      'delete-order',
    ])
    if (!ALLOWED_ACTIONS.has(action)) {
      throw new Error(`Invalid action: "${action}". Allowed: ${[...ALLOWED_ACTIONS].join(', ')}`)
    }

    // ── Role-based authorization per action ──
    // All product and order management actions require admin role (already
    // enforced by verifyAdminWithJwt; this is a defense-in-depth check).
    if (callerRole !== 'admin') {
      throw new Error('Forbidden: admin role required')
    }

    let result: any

    if (action === 'create-product') {
      // Validate and sanitize payload before any DB write
      const validatedPayload = validateProductPayload(payload)
      result = await supabaseAdmin
        .from('products')
        .insert(validatedPayload)
        .select()
    } else if (action === 'update-product') {
      // Validate payload structure and product ID before any DB operation
      if (!payload || typeof payload !== 'object' || !('id' in payload)) {
        throw new Error('Invalid payload: missing "id" field')
      }
      const productId = validateProductId(payload.id)
      const validatedPayload = validateProductPayload(payload)
      result = await supabaseAdmin
        .from('products')
        .update(validatedPayload)
        .eq('id', productId)
        .select()
    } else if (action === 'delete-product') {
      // Validate payload structure before any DB operation
      if (!payload || typeof payload !== 'object' || !('id' in payload)) {
        throw new Error('Invalid payload: missing "id" field')
      }
      const productId = validateProductId(payload.id)
      result = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId)
    } else if (action === 'reorder-products') {
      // Batch update: validate each item, then update sort_order in order
      if (!payload || typeof payload !== 'object' || !Array.isArray(payload.items)) {
        throw new Error('Invalid payload: missing "items" array')
      }
      const updates: Array<{ id: string; sort_order: number }> = []
      for (const item of payload.items) {
        const productId = validateProductId(item.id)
        if (typeof item.sort_order !== 'number' || !Number.isInteger(item.sort_order) || item.sort_order < 0) {
          throw new Error('Invalid payload: sort_order must be a non-negative integer')
        }
        updates.push({ id: productId, sort_order: item.sort_order })
      }
      for (const { id, sort_order } of updates) {
        const r = await supabaseAdmin
          .from('products')
          .update({ sort_order })
          .eq('id', id)
        if (r.error) throw sanitizeSupabaseError(r.error)
      }
      result = { data: updates }
    } else if (action === 'toggle-product-availability') {
      // Security: toggle is handled server-side to prevent client from
      // setting an arbitrary value. The server reads current value and flips it.
      if (!payload || typeof payload !== 'object' || !('id' in payload)) {
        throw new Error('Invalid payload: missing "id" field')
      }
      const productId = validateProductId(payload.id)
      const { data: current, error: fetchErr } = await supabaseAdmin
        .from('products')
        .select('is_available, is_active')
        .eq('id', productId)
        .single()
      if (fetchErr) throw sanitizeSupabaseError(fetchErr)
      if (!current) throw new Error('Product not found')
      const newVal = !(current.is_available ?? current.is_active ?? true)
      result = await supabaseAdmin
        .from('products')
        .update({ is_available: newVal, is_active: newVal })
        .eq('id', productId)
        .select()
    } else if (action === 'delete-order') {
      // Validate payload structure before any DB operation
      if (!payload || typeof payload !== 'object' || !('id' in payload)) {
        throw new Error('Invalid payload: missing "id" field')
      }
      const orderId = validateOrderId(payload.id)
      result = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', orderId)
    }

    if (result.error) throw sanitizeSupabaseError(result.error)

    return new Response(JSON.stringify(result.data), {
      headers: { ...allHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const error = sanitizeSupabaseError(err)
    const message = error.message
    // Auth/authorization errors → 403, validation errors → 400
    const isAuthError =
      message.startsWith('Unauthorized') ||
      message.startsWith('Forbidden')
    const status = isAuthError ? 403 : 400
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...allHeaders, 'Content-Type': 'application/json' },
      status,
    })
  }
})
