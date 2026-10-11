---
name: security-audit-verification-report
description: Focused verification of findings C1-C6 and H1-H4 from Phase 5 security audit of La Parisienne application
metadata:
  type: project
---

# La Parisienne — Security Audit Verification Report (C1–C6, H1–H4)

**Scope:** Read-only verification of source files in `C:\Users\abdel\la-parisienne\`
**Date:** 2026-10-12
**Status:** All 10 findings CONFIRMED from repository source code

---

## Critical Findings

### C1 — Unauthenticated Edge Function (`admin-api`) — CONFIRMED

**Source files verified:**
- `supabase/functions/admin-api/index.ts:1-41`
- `supabase/config.toml`

**Vulnerable code path:**
```ts
// supabase/functions/admin-api/index.ts, lines 1-7
import { serve } from "https://deno.land/x/sift@0.5.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", ... };

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,  // ← service-role key, no auth guard
  );
```

**Dispatch mechanism (lines 13–41):**
```ts
if (action === "create-product") {
  return await supabaseAdmin.from("products").insert(payload);
}
if (action === "delete-order") {
  return await supabaseAdmin.from("orders").delete().eq("id", payload.id);
}
if (action === "create-coupon") ...
if (action === "delete-user") ...
```
The Edge Function body dispatches actions (including product creation, order deletion, coupon creation, user deletion) with `supabaseAdmin` — a client authenticated with the **service-role key** that bypasses ALL RLS policies.

**Config (`supabase/config.toml` lines 2-5):**
```toml
[functions.admin-api]
verify_jwt = false
```
The `verify_jwt = false` setting means even the function-level JWT verification is disabled.

**Affected operations:**
- `create-product` — inserts product with service-role (bypasses RLS)
- `delete-order` — deletes ANY order by ID (bypasses RLS, no auth check)
- `create-coupon` — creates coupon with service-role
- `delete-user` — deletes auth user + staff_members with service-role

**Existing protections:** None. CORS is `*` (open to all origins). No auth header check, no JWT verification, no role check.

**Requires live verification:** Whether the `SUPABASE_SERVICE_ROLE_KEY` env var is set in the deployed Edge Function (the `!` non-null assertion means deployment would fail if unset, but if set, the key is active). Also requires verifying whether `verify_jwt = false` is the current deployed config.

---

### C2 — Unauthenticated `delete-user` Edge Function — CONFIRMED

**Source file verified:** `supabase/functions/delete-user/index.ts:1-24`

**Vulnerable code path:**
```ts
serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,  // ← service-role key
  );
  // No req.user check, no auth header validation
  const { user_id } = await req.json();
  // Deletes auth user
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
  // Deletes staff record
  await supabaseAdmin.from("staff_members").delete().eq("id", user_id);
});
```

**Affected operations:**
- Deletes ANY auth user account (via `supabaseAdmin.auth.admin.deleteUser`)
- Deletes ANY staff_members record

**Existing protections:** None. The `user_id` is read directly from the request body with no auth verification. No check that the caller is an admin.

**Requires live verification:** Whether `[functions.delete-user]` exists in deployed `config.toml` (not present in the repo version I read). Whether the function is publicly accessible via the Supabase dashboard.

---

### C3 — Service-Role Key Bundled in Client-Side Bundle — CONFIRMED

**Source file verified:** `lib/supabaseAdmin.ts:1-7`

**Vulnerable code path:**
```ts
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Line 3: service-role key with fallback chain
const service = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_SERVICE_ROLE_KEY 
  || anon;  // ← falls back to anon key if env var not set

export const supabase = supabase;
export const supabaseAdmin = createClient(supabaseUrl, service, { /* ... */ });
```

**The `requireAdmin()` guard at lines 9–17** IS properly implemented and IS called by centralized functions (lines 24, 53, 88, 98, 104, 111, 118, 128). However, grep confirms **NO screen in `src/app/` imports from `lib/adminQueries`** — the only imports are:
- `components/admin/RecentOrdersTable.tsx` — type-only import (`type { RecentOrder }`)
- `components/admin/LowStockProducts.tsx` — type-only import (`type { LowStockProduct }`)
- `hooks/useStoreSettings.ts` — type-only import (`type { AdminDeliveryZone }`)

All type imports; no runtime function calls. The `requireAdmin()` guard is **dead code** — unreachable from any active UI path. All screens call `supabase.from()` directly.

**Existing protections:** None that reach the client bundle. The warning at line 5-7 (`"⚠️ admin queries imported on client - security risk!"`) fires only if someone imports the module on the client.

**Requires live verification:** Whether `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is set in the build environment. If set, the service-role key is embedded in the client bundle. The `.env` file is tracked in git (not just `.env.local`), increasing exposure risk.

**Key correction from summary:** The earlier summary described `requireAdmin()` as "non-blocking." This was WRONG. The function is properly implemented (throws on non-admin). The actual vulnerability is that **no screen calls it** — all screens bypass it entirely.

---

### C4 — Cart Price Manipulation + No Order Items Sent to RPC — CONFIRMED

**Source files verified:**
- `store/cart.store.ts` — `getTotalPrice()` method
- `src/app/checkout.tsx` — `create_secure_order` RPC call
- `lib/queries.ts` — `createSecureOrder` function

**Vulnerable code path (cart store, lines 85-94):**
```ts
getTotalPrice: () => {
  let total = 0;
  for (const item of items) {
    total += (item.price || 0) * item.quantity;
    if (item.customizations) {
      for (const c of item.customizations) total += c.price || 0;
    }
  }
  return Math.round(total * 100) / 100;
},
```
Pure client-side computation. Cart items store `price` directly from `products.price` (read from Supabase at `home.tsx:101`). If the product price changes after add-to-cart, the stale client-side price is used. If the client is modified (e.g., via debugger or a modified app build), any price can be submitted.

**Vulnerable code path (checkout.tsx, lines 131-133):**
```ts
await supabase.rpc("create_secure_order", {
  p_address_id: null,
  p_street,
  p_building,
  p_apartment,
  p_floor,
  p_phone,
  p_notes,
  p_lat,
  p_lng,
  p_payment_method,
  p_delivery_address_text,
});
```

**Critical finding:** The RPC call sends **NO items, NO prices, NO subtotal, NO delivery_fee, NO discount_amount, NO total**. The server-side `create_secure_order` function definition is **NOT in the repository** (no `.sql` migration or function file found). The checkout screen computes `subtotal` and `fee` client-side (lines 120-121) and displays them, but these values are never sent to the RPC. The server must re-derive pricing from the cart contents — but it has no cart contents.

**Affected operation:** Order creation with arbitrary pricing. If the server-side RPC doesn't re-validate prices against the products table, a customer can manipulate the order total.

**Existing protections:** The client calls a server-side RPC (`create_secure_order`), which is the correct pattern. However, since no items/prices are sent, the server must look them up from somewhere — likely session state or a separate cart table. **Requires live verification:** The PostgreSQL function definition for `create_secure_order` (not in repo) — must verify it reconstructs prices server-side from the cart_items table or equivalent.

---

### C5 — Coupon Validation Client-Side with No Usage Increment — CONFIRMED

**Source file verified:** `lib/queries.ts:229-240` (`validateCoupon`)

**Vulnerable code path:**
```ts
export const validateCoupon = async (code: string, subtotal: number) => {
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("code, discount_type, discount_value, min_order_value, times_used, usage_limit")
    .eq("code", code)
    .single();

  // ... validation logic (client-side computation)
  const discount = coupon.discount_type === "percentage"
    ? (subtotal * coupon.discount_value / 100)
    : coupon.discount_value;

  return { valid: true, discount, ... };
};
```

**Critical findings:**
1. The function reads `times_used` and `usage_limit` but **NEVER increments `times_used`** after a successful validation. This means:
   - A coupon with `usage_limit: 1` can be used infinitely
   - No server-side enforcement of usage limits
2. The discount is computed entirely client-side based on the `subtotal` parameter — which is itself a client-computed value from the cart store (C4).
3. **No call site found:** `validateCoupon` is NOT imported or called anywhere in `src/app/` (grep returned zero results for `validateCoupon` in src). The function exists as dead code — `checkout.tsx` does NOT call it. There is no coupon validation in the checkout flow at all.

**Affected operations:**
- Coupon overuse (no `times_used` increment)
- Arbitrary discount application (client controls the `subtotal` parameter)
- Coupon bypass (checkout.tsx doesn't call validateCoupon at all)

**Existing protections:** None active. The function is not wired into checkout.

**Requires live verification:** The Supabase RLS policies on the `coupons` table — whether the client can `UPDATE` the `times_used` field (which would be needed for proper enforcement). Also the deployed version of the `validateCoupon` function — whether the repo version matches production.

---

### C6 — Delivery Fee Computed Client-Side, Not Sent to RPC — CONFIRMED

**Source files verified:**
- `src/app/checkout.tsx:13` (DELIVERY_FEES map) and `lines 120-121` (fee computation)
- `store/cart.store.ts:18` (hardcoded delivery fee in cart.tsx)
- `hooks/useStoreSettings.ts` (the centralized delivery zone settings hook)

**Vulnerable code path (checkout.tsx):**
```ts
const DELIVERY_FEES = {
  "Downtown": 30, "Garden City": 30, "Zamalek": 35, 
  "Maadi": 40, "Nasr City": 25, "Heliopolis": 30, 
  "New Cairo": 45, "6th October": 50,
};
const fee = subtotal >= FREE_LIMIT 
  ? 0 
  : (DELIVERY_FEES[selected?.city || selected?.area || "Cairo"] ?? 50);
const total = subtotal + fee;
```

And `checkout.tsx:131-133` confirms that `fee`, `subtotal`, and `total` are **NEVER sent** to the `create_secure_order` RPC.

**Existing protections:** The `useStoreSettings` hook (`hooks/useStoreSettings.ts:93-147`) fetches delivery fees from the `delivery_zones` table (the correct server-driven approach), but `checkout.tsx` does NOT use this hook — it uses a hardcoded `DELIVERY_FEES` map. This is inconsistent and means delivery fees are entirely client-controlled.

**Requires live verification:** Whether the server-side `create_secure_order` RPC has its own delivery fee logic (e.g., from a `delivery_zones` table or `store_fees` table). Since the RPC definition is not in the repo, this must be verified in the Supabase dashboard.

**Additional divergence:** `customer/cart.tsx:18` hardcodes `const deliveryFee = 25` — a different value from both the checkout map and the `useStoreSettings` hook. Three different delivery fee sources with no reconciliation.

---

## High Findings

### H1 — Client-Side RBAC with No Server-Side Enforcement — CONFIRMED (STRANGER-LOOP)

**Source files verified:**
- `src/app/_layout.tsx:14-20` (`getRouteByRole`)
- `src/app/_layout.tsx:53-83` (RBAC in `useEffect`)
- `lib/adminQueries.ts:9-17` (`requireAdmin()`)

**Vulnerable code path:**
```ts
// _layout.tsx, lines 14-20
const getRouteByRole = (role?: string | null) => {
  const r = role?.toLowerCase().trim() || "";
  if (r === 'admin') return '/(admin)/dashboard' as const;
  if (r === 'cashier') return '/(cashier)' as const;
  if (r === 'driver') return '/(driver)' as const;
  return '/(customer)/home' as const;
};
```

```ts
// _layout.tsx, lines 53-83 — RBAC in useEffect (post-render)
useEffect(() => {
  if (!currentGroup) return;
  if (!currentGroup.startsWith("(")) return;  // ← skips non-group routes
  if (!isAuthenticated) {
    if (!inAuthGroup) router.replace("/(auth)/login");
    return;
  }
  // Role-based redirects AFTER render
  const role = profile.role?.toLowerCase().trim() || "";
  if (inAuthGroup) router.replace(getRouteByRole(role));
  if (role === "admin" && currentGroup !== "(admin)") router.replace("/(admin)/dashboard");
  ...
}, [fontsLoaded, isLoading, isAuthenticated, profile, segments, router]);
```

**Key nuances:**
1. The RBAC in `_layout.tsx` is **client-side only** — it relies on `profile.role` from the auth store. Since `role` comes from the `profiles` table (readable by the anon key via the Supabase client), a user could modify their client-side auth store state to claim any role.
2. The redirect logic has **race condition**: it fires in `useEffect` (post-render), meaning screens briefly render before the redirect. More critically, the guard only fires when `currentGroup.startsWith("(")` — routes NOT in a group (like `favorite`, `payment-methods`, `addresses`) are left unprotected.
3. The `requireAdmin()` function in `adminQueries.ts` IS properly implemented but is **dead code** — grep confirms zero runtime imports from `adminQueries` in `src/app/`. All admin screens call `supabase.from()` directly.

**Evidence from grep:** Zero matches for `requireAdmin` or `supabaseAdmin` in `src/app/`. All admin screens use the anon client directly:
- `admin/dashboard.tsx:14` — `supabase.from('orders')` (bypasses `getDashboardStats`)
- `admin/orders.tsx:24` — `supabase.from('orders')` (bypasses `getAdminOrders`)
- `admin/products.tsx:24-25` — `supabase.from('products')` (bypasses `getAllProducts`)
- `admin/users.tsx:19` — `supabase.from('staff_members')` (bypasses `getCustomers`)
- `admin/delivery-zones.tsx:24` — `supabase.from('delivery_zones')` (bypasses `getAllDeliveryZones`)

**Existing protections:** The `_layout.tsx` client-side redirect is the ONLY protection. It is NOT enforced server-side. The role is read from `profiles.role` which is set during `signUp` or `staff_members.insert()` — both client-driven.

**Requires live verification:** The Supabase RLS policies. The critical question is whether RLS on tables like `orders`, `staff_members`, `store_settings`, `support_contacts`, `opening_hours`, `customer_feedback`, etc. enforces role-based access. If RLS is `true` for `customer` role on these tables (permissive), any user can read/modify admin data.

---

### H2 — Order IDOR via `getOrderById` (No Ownership Check) — CONFIRMED

**Source files verified:**
- `lib/queries.ts:181-184` (`getOrderById` signature)
- `src/app/order/[id].tsx:31-35` (screen call site)
- `src/app/order/track/[id].tsx:33-38` (screen call site)

**Vulnerable code path:**
```ts
// lib/queries.ts, line 181
export const getOrderById = async ({ id }: { id: string }) => {
  // Line 183-184: NO userId parameter, NO ownership filter
  const { data, error } = await supabase
    .from("orders")
    .select(`...`)
    .eq("id", id)  // ← queries by ID only, no user_id filter
    .single();
  return { data, error };
};
```

**Critical nuance:** The function signature is `{ id: string }` — it does NOT accept a `userId` parameter at all. Both screens pass `userId` in the params object:
- `order/[id].tsx:34`: `params: { id: id!, userId: user?.id ?? "" }` — `userId` is passed but silently ignored (destructured only `{ id }`)
- `order/track/[id].tsx:35`: `params: { id: id! }` — does NOT pass userId, and explicitly relies on RLS (line 33 comment: "مبقيناش بنبعت userId - الـ RLS هيتأكد ان الاوردر بتاع اليوزر ده بس" = "We didn't send userId - RLS will verify")

JavaScript destructuring means `{ id }` silently drops `userId` from the params object. The resulting query has NO ownership filter.

**Affected operation:** Any authenticated user can read ANY order by ID. The `orders` table also contains `customer_address` and `customer_phone` PII (which `tracking.tsx` line 55-57 reads).

**Existing protections:** The `order/track/[id].tsx` screen's comment indicates intent to rely on RLS. The `order/[id].tsx` screen attempts to pass `userId` but the function signature doesn't accept it.

**Requires live verification:** The Supabase RLS policy on the `orders` table. If the policy allows `SELECT` for the `authenticated` role without a `user_id` filter, the IDOR is exploitable. Must verify the exact RLS policy rules.

**Key correction from summary:** The summary described `getOrderById` as accepting `{ id, userId }` where `userId` is ignored. The actual code accepts only `{ id }` — even worse, because it means the function signature itself doesn't even acknowledge the concept of user ownership. The screens pass `userId` in the params object, but JavaScript silently drops it.

---

### H3 — Driver Order IDOR (Accept Any Order, Mark Any Delivered) — CONFIRMED

**Source files verified:**
- `src/app/(driver)/index.tsx:15-23`
- `src/app/(driver)/orders.tsx:83-93` (acceptOrder, markDelivered)
- `src/app/(driver)/tracking.tsx:19, 33`

**Vulnerable code paths:**
```ts
// driver/index.tsx, line 15
const {data} = await supabase.from('orders')
  .select('*')
  .eq('status','pending')
  .is('driver_id',null)
  .limit(1)
  .maybeSingle();

// driver/index.tsx, line 23
await supabase.from('orders').update({driver_id:user?.id,status:'out_for_delivery'}).eq('id',order.id);

// driver/orders.tsx, lines 85-91
const { error } = await supabase.from('orders')
  .update({ driver_id: user?.id, status: 'out_for_delivery' })
  .eq('id', orderId);  // ← ANY orderId, no driver_id check

const { error } = await supabase.from('orders')
  .update({ status: 'delivered' })
  .eq('id', orderId);  // ← ANY orderId, no ownership check

// driver/tracking.tsx, line 19
const {data} = await supabase.from('orders').select('*').eq('id',id).maybeSingle();
// ← any order by ID, no driver_id filter
```

**Affected operations:**
- Driver A can accept an order assigned to Driver B (by intercepting the `pending` pool before B does)
- Driver A can mark Delivery as "delivered" on an order they never picked up
- Driver A can view ANY order's `customer_address` and `customer_phone` PII

**Existing protections:** None at the application level. The `driver_id` field is set on `accept()` but there's no pre-flight check that the order is unassigned or that the current driver is the assigned driver before allowing status changes. `driver/wallet.tsx:14` correctly filters by `driver_id` (the only driver screen that does), but sums `order.total` which is the client-computed value (unreliable).

**Requires live verification:** The Supabase RLS policy on `orders` table — specifically whether `UPDATE` is restricted to `auth.uid() = driver_id` for drivers, and whether `SELECT` is filtered.

---

### H4 — Chat Conversation IDOR — CONFIRMED

**Source files verified:**
- `src/app/(customer)/orders.tsx:36-61` (CustomerChatBox)
- `src/app/(driver)/orders.tsx:14-34` (DriverChatBox)
- `src/app/(admin)/orders.tsx:40-47` (AdminChatBox)
- `src/app/(cashier)/drivers.tsx:17-37` (CashierChatBox)

**Vulnerable code path (customer/orders.tsx, lines 36-38):**
```ts
let { data: conv } = await supabase
  .from("chat_conversations")
  .select("*")
  .eq("order_id", orderId)
  .eq("type", chatType)  // ← 'cashier' or 'delivery'
  .maybeSingle();
if (!conv) {
  const { data: nc } = await supabase
    .from("chat_conversations")
    .insert([{ order_id: orderId, type: chatType }])  // ← no user_id, no ownership check
    .select().single();
}
```

**Critical findings:**
- **No `user_id` field** is stored on `chat_conversations` — only `order_id` and `type`
- **No ownership verification**: When creating or joining a chat conversation, the app does NOT verify that the current user owns the order referenced by `order_id`
- **No participant authorization**: The `sender_role` field on `chat_messages` is hardcoded client-side (`"customer"` in customer screen, `"delivery"` in driver screen, `"cashier"` in admin/cashier screens). There is no server-side verification that the sender actually holds that role.
- **Realtime subscriptions are scoped per-conversation** (e.g., `filter: conversation_id=eq.${conv.id}`), so message content isn't leaked — but the conversation creation/query has no ownership boundary.

**Affected operations:**
- Any user can create/join a chat conversation for ANY order ID (they just need to know/guess an order ID)
- Any user can impersonate any speaker role (customer, cashier, delivery) by using the appropriate screen
- A malicious cashier could join a customer's chat. A malicious driver could join a cashier's chat.

**Existing protections:** The chat subscription filter is properly scoped per-conversation. However, since conversation creation has no ownership check, this scoping is insufficient.

**Requires live verification:** The Supabase RLS policy on `chat_conversations` and `chat_messages` tables. Must verify:
1. Whether `SELECT` on `chat_conversations` is restricted by role or order ownership
2. Whether `INSERT` on `chat_conversations` validates the order belongs to the calling user's role
3. Whether `INSERT` on `chat_messages` validates the `sender_role` against the user's actual role

---

## Summary: Confirmed vs. Assumption

| Finding | Status | Evidence Source | Requires Live Verification |
|---------|--------|----------------|---------------------------|
| C1 | ✅ CONFIRMED | Edge Function source + config.toml | Service role key in env, deployed config |
| C2 | ✅ CONFIRMED | Edge Function source | `[functions.delete-user]` config, public accessibility |
| C3 | ✅ CONFIRMED | supabaseAdmin.ts, grep of src/app | `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` env var |
| C4 | ✅ CONFIRMED | checkout.tsx, cart.store.ts, queries.ts | `create_secure_order` RPC definition |
| C5 | ✅ CONFIRMED | queries.ts (validateCoupon), grep of checkout.tsx | RLS on coupons table |
| C6 | ✅ CONFIRMED | checkout.tsx (DELIVERY_FEES), cart.tsx (hardcoded 25) | Server-side fee logic in RPC |
| H1 | ✅ CONFIRMED | _layout.tsx RBAC, grep of adminQueries | RLS policies on admin tables |
| H2 | ✅ CONFIRMED | queries.ts getOrderById, order/[id].tsx | RLS policy on orders table |
| H3 | ✅ CONFIRMED | driver screens (index, orders, tracking) | RLS on orders for driver role |
| H4 | ✅ CONFIRMED | Chat components across all roles | RLS on chat_conversations/chat_messages |
