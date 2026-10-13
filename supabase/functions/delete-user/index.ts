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
 * Admin-only role verification — staff deletion is a security-sensitive
 * operation restricted to the 'admin' role. Supervisors are NOT permitted
 * to delete staff accounts.
 * Returns the authenticated user so the caller's id is available for
 * self-deletion prevention.
 */
async function verifyAdminWithJwt(
  supabaseAdmin: ReturnType<typeof createClient>,
  jwt: string
): Promise<User> {
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

  return user
}

Deno.serve(async (req) => {
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
    // Create admin client with service-role key (server-side only — not bundled in client)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Authenticate and authorize the caller ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: missing Bearer token')
    }
    const jwt = authHeader.replace('Bearer ', '')
    const caller = await verifyAdminWithJwt(supabaseAdmin, jwt)

    // ── Parse and validate the request body (single parse) ──
    const { user_id } = await req.json()

    if (!user_id || typeof user_id !== 'string') {
      throw new Error('Invalid input: user_id is required and must be a string')
    }

    if (!UUID_REGEX.test(user_id)) {
      throw new Error('Invalid input: user_id must be a valid UUID')
    }

    // ── Prevent self-deletion ──
    if (user_id === caller.id) {
      throw new Error('Forbidden: cannot delete your own account')
    }

    // ── Verify the target user is a staff member ──
    // Check staff_members table to confirm the user has a staff record.
    // We do NOT rely on profiles.role === 'customer' because staff may have
    // customer profiles from a prior account type. Instead we verify the
    // target actually exists in staff_members.
    const { data: targetStaff, error: targetError } = await supabaseAdmin
      .from('staff_members')
      .select('id, role, name, email, is_active')
      .eq('id', user_id)
      .single()

    if (targetError || !targetStaff) {
      throw new Error('Not found: user is not a staff member or does not exist')
    }

    // ── Deletion Strategy ──
    // The auth-user deletion (GoTrue API) and staff_members deletion (PostgREST
    // API) are separate HTTP calls to different Supabase services. They CANNOT
    // be made atomic via a Postgres RPC transaction — auth.users is managed by
    // the GoTrue identity service, not the PostgREST layer.
    //
    // Ordering: AUTH USER FIRST, then staff_members.
    //
    // Rationale: Deleting the auth user first is the security-critical step
    // — it immediately revokes the user's ability to authenticate. If the
    // auth-user deletion succeeds, the user is locked out regardless of what
    // happens to the staff_members row.
    //
    // Failure modes:
    //   1. Auth deletion FAILS → nothing was deleted → consistent, safe to retry
    //   2. Auth deletion succeeds, staff_members deletion FAILS → user is locked
    //      out (secure), but an orphaned staff record remains. We log the error
    //      and return success with a warning so the frontend can alert an admin
    //      to clean up the orphaned row manually via the admin UI.
    //      (The admin UI calls supabase.from('staff_members').select('*') which
    //      will show the orphaned row for manual removal.)
    //   3. Both succeed → clean state
    //
    // This ordering prevents the worst case: staff_members deleted while the
    // auth user still has live credentials (which would be a security risk if
    // the user could still authenticate).

    // Step 1: Delete the auth user (security-critical)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (deleteAuthError) {
      // Auth user deletion failed — nothing was deleted by us, so the state
      // is consistent. Return 400 so the caller can retry.
      throw deleteAuthError
    }

    // Step 2: Delete the staff_members record (data hygiene)
    // If this fails, the auth user is already deleted (secure).
    // Log the error and return success with a warning for manual cleanup.
    const { error: deleteStaffError } = await supabaseAdmin
      .from('staff_members')
      .delete()
      .eq('id', user_id)

    if (deleteStaffError) {
      // Log for observability — the auth user is already deleted, so this
      // is a data hygiene issue, not a security issue.
      console.error(
        `delete-user: Auth user ${user_id} was deleted, but staff_members ` +
        `record deletion failed: ${deleteStaffError.message}. ` +
        `Manual cleanup required via admin UI.`
      )
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Auth user deleted, but staff record could not be removed. ' +
            'Manual cleanup may be required via the admin staff management UI.',
        }),
        {
          headers: { ...allHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...allHeaders, 'Content-Type': 'application/json' }
    })
  } catch(e: any){
    const message = e.message
    // Return 403 for auth/authorization/not-found errors, 400 for input errors
    const isAuthError =
      message.startsWith('Unauthorized') ||
      message.startsWith('Forbidden') ||
      message.startsWith('Not found')
    const status = isAuthError ? 403 : 400
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...allHeaders, 'Content-Type': 'application/json' }
    })
  }
})
