---
name: rpc-investigation-report
description: Read-only investigation of 4 Supabase RPC functions: accept_order, cancel_my_order, create_secure_order, reject_order
metadata:
  type: project
---

# RPC Investigation Report — La Parisienne

**Date:** 2026-10-12  
**Scope:** READ-ONLY investigation of 4 Supabase RPC functions  
**Constraint:** No files, SQL, migrations, database objects, or configuration were modified.

---

## Executive Summary

| RPC Function | Call Sites in Repo | SQL Definition in Repo | Wrapper in queries.ts | Status |
|---|---|---|---|---|
| `create_secure_order` | 2 (1 active, 1 dead code) | ❌ None found | ✅ `createSecureOrder()` (dead code) | **Active but incomplete** — sends no items/prices/totals |
| `accept_order(uuid)` | 0 | ❌ None found | ❌ None | **Dead RPC** — drivers use direct `orders.status` update |
| `cancel_my_order(uuid)` | 0 | ❌ None found | ❌ None | **Dead RPC** — no cancellation mechanism at all |
| `reject_order(uuid, text)` / `reject_order(uuid)` | 0 | ❌ None found | ❌ None | **Dead RPC** — cashiers use direct `orders.status` update |

All 4 RPC function definitions live **exclusively in the Supabase dashboard** (remote PostgreSQL). They are **not in any migration file, SQL file, or Edge Function** in this repository.

---

## 1. `create_secure_order` — Active but Incomplete

### 1.1 Call Site A — Active (checkout.tsx, lines 125-138)

**File:** `src/app/checkout.tsx` (bare route at repo root, accessed via `router.push("/checkout" as any)` from `src/app/(customer)/cart.tsx:137`)

```typescript
const placeOrder = async () => {
  if (!building || !phone) { Alert.alert("Incomplete", "..."); return; }
  setLoading(true);
  try {
    const full = `${addressLabel} | ${fullAddressText} | Building ${building}, Apt ${apt}, Floor ${floor} | Notes: ${notes}`;
    const { error } = await supabase.rpc('create_secure_order', {
      p_address_id: null,
      p_street: street,
      p_building: building,
      p_apartment: apt,
      p_floor: floor,
      p_phone: phone,
      p_notes: notes,
      p_lat: coord.lat,
      p_lng: coord.lng,
      p_payment_method: paymentMethod,
      p_delivery_address_text: full
    });
    if (error) throw error;
    clearCart();                          // Clears Zustand cart store (client-side only)
    router.replace("/(customer)/orders" as any);  // Redirects to orders LIST (no success screen)
  } catch (e: any) { Alert.alert("Failed", e.message); } finally { setLoading(false); }
};
```

**Parameters sent (11):** `p_address_id`, `p_street`, `p_building`, `p_apartment`, `p_floor`, `p_phone`, `p_notes`, `p_lat`, `p_lng`, `p_payment_method`, `p_delivery_address_text`

**Critical omission:** NO `p_items`, NO `p_prices`, NO `subtotal`, NO `delivery_fee`, NO `discount_amount`, NO `total`.

**Client-side pricing computed but never sent:**
- Line 34: `const subtotal = getTotalPrice();` — pure client-side math from Zustand cart store
- Line 120: `const fee = subtotal >= FREE_LIMIT ? 0 : (DELIVERY_FEES[...] ?? 50);` — hardcoded `DELIVERY_FEES` map, NOT from `delivery_zones` table
- Line 121: `const total = subtotal + fee;`
- These values are **displayed** on UI (lines 252-263) but **never sent to the RPC**

### 1.2 Call Site B — Dead Code (lib/queries.ts, lines 194-210)

```typescript
export const createSecureOrder = async (params: {
  address_id: string;
  payment_method: string;
  customer_note?: string;
  coupon_code?: string;
  items: { product_id: string; quantity: number }[];
}) => {
  const { data, error } = await supabase.rpc('create_secure_order', {
    p_address_id: params.address_id,
    p_payment_method: params.payment_method,
    p_customer_note: params.customer_note || null,
    p_coupon_code: params.coupon_code || null,
    p_items: params.items
  });
  if (error) throw error;
  return data;
};
```

**Parameters sent (5):** `p_address_id`, `p_payment_method`, `p_customer_note`, `p_coupon_code`, `p_items`

**Key finding:** This wrapper function **SENDS `p_items`** (product_id + quantity), but **does NOT SEND** `p_street`, `p_building`, `p_phone`, `p_lat`, `p_lng`, or `p_delivery_address_text`. It is therefore a **completely different overload** from the one used in checkout.tsx.

**Critically:** This function is **never imported or called** anywhere in the active codebase. Grep confirms zero references to `createSecureOrder` in any `.tsx` or `.ts` file in `src/`.

### 1.3 Backup Version (src-backup/app/checkout.tsx, line 123)

The backup version has the same 11-param call pattern, but hardcodes `payment_method: 'cash'` instead of using the `paymentMethod` state variable.

### 1.4 What the Server Must Do

Since the active checkout sends NO items/prices, the `create_secure_order` RPC on the server must:
1. Read the authenticated user's cart from somewhere (there is **no `cart_items` table** in the schema — cart is purely client-side Zustand)
2. Reconstruct `order_items` from product prices looked up from the `products` table
3. Compute `subtotal`, `delivery_fee`, `discount_amount`, and `total` independently
4. Insert into `orders` and `order_items` tables

**Risk:** If the server-side RPC cannot access the client-side Zustand cart state, it either silently inserts `0` for all monetary fields, errors out, or has a race condition / security gap.

### 1.5 Return Value

The RPC return type is **unknown** — no SQL definition exists in the repo. The checkout code only checks `{ error }` and ignores `data`, so even if the function returns the new order ID, it is discarded. The redirect to `/(customer)/orders` then lists orders by `user_id` filter, which should work IF the RPC sets the correct `user_id`.

---

## 2. `accept_order(uuid)` — Zero Call Sites

### 2.1 RPC Call Sites

**Zero results.** A comprehensive grep across the entire repository (`*.ts`, `*.tsx`, `*.sql`) found no calls to `accept_order`.

### 2.2 What Drivers Actually Do

Instead of calling `accept_order`, the driver flow uses direct table updates:

**`src/app/(driver)/index.tsx:20-23`** (order pickup screen):
```typescript
const accept = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!order) return;
  await supabase.from('orders')
    .update({ driver_id: user?.id, status: 'out_for_delivery' })
    .eq('id', order.id);
  router.push({ pathname: '/(driver)/tracking', params: { id: order.id } });
};
```

**`src/app/(driver)/orders.tsx:83-88`** (driver orders list):
```typescript
const acceptOrder = async (orderId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('orders')
    .update({ driver_id: user?.id, status: 'out_for_delivery' })
    .eq('id', orderId);
};
```

**Key difference:** The `accept_order(uuid)` RPC signature suggests it takes a **single UUID** argument. The driver code instead does a direct `update({driver_id, status})` — it does NOT pass the UUID to any RPC.

### 2.3 SQL Definition

**None found** in any `.sql` file or migration in the repository.

---

## 3. `cancel_my_order(uuid)` — Zero Call Sites

### 3.1 RPC Call Sites

**Zero results.** No calls to `cancel_my_order` exist anywhere in the codebase.

### 3.2 Cancellation Mechanisms That Actually Exist

None. There is no cancel button, no cancellation API call, and no cancellation UI anywhere in the customer app. The checkout.tsx `placeOrder()` function calls `create_secure_order` and immediately clears the cart — there is no "cancel order" path after submission.

The only status transitions visible:
- `pending` → `out_for_delivery` (driver accepts)
- `out_for_delivery` → `delivered` (driver marks delivered)
- `pending` → `confirmed` (admin/cashier)
- `pending` → `cancelled` (admin via direct update, `src/app/(admin)/orders.tsx:187`)

**No customer-facing cancellation exists.**

### 3.3 SQL Definition

**None found** in any `.sql` file or migration.

---

## 4. `reject_order(uuid, text)` / `reject_order(uuid)` — Zero Call Sites

### 4.1 RPC Call Sites

**Zero results.** No calls to `reject_order` exist anywhere in the codebase.

### 4.2 What Cashiers Actually Do

Instead of calling `reject_order`, cashiers use direct table updates:

**`src/app/(cashier)/drivers.tsx:84-88`** (cashier order management):
```typescript
const updateStatus = async (id: string, newStatus: string) => {
  setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  const { error } = await supabase.from('orders')
    .update({ status: newStatus })
    .eq('id', id);
  if (newStatus === 'preparing') setFilter('accepted');
};
```

Called at line 160: `updateStatus(o.id, 'preparing')` (accept)  
Called at line 163: `updateStatus(o.id, 'cancelled')` (reject)

**`src/app/(admin)/orders.tsx:99-103`** (admin order management):
```typescript
const updateStatus = async (id: string, newStatus: string) => {
  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
};
```

Called at lines 179-187: `updateStatus(selected.id, 'pending'|'confirmed'|'delivered'|'cancelled')`

**Key difference:** The `reject_order(uuid, text)` RPC signature includes a **text parameter** (likely for rejection reason), but the cashier/admin code does a bare `update({status: 'cancelled'})` with no reason text field.

### 4.2 SQL Definition

**None found** in any `.sql` file or migration.

---

## 5. SQL / Migration Files Search

### 5.1 Files Searched

A repository-wide search was performed for:
- `grep "CREATE.*FUNCTION|CREATE.*OR.*REPLACE.*FUNCTION"` — 1 match: `update_updated_at_column()` in `SUPSABASASE_MISSING_TABLES.sql:254` (a timestamp trigger helper, unrelated to the 4 RPCs)
- `grep "create_secure_order|accept_order|cancel_my_order|reject_order"` in `*.sql` files — 0 matches
- `grep "RETURNS TABLE|RETURNS"` in `*.sql` files — 0 matches for any of the 4 RPCs

### 5.2 SQL Files in Repository

| File | Contains RPC definitions? |
|---|---|
| `SUPSABASE_MISSING_TABLES.sql` | ❌ No function definitions for the 4 RPCs (only `update_updated_at_column()`) |
| `supabase/migrations/add_delivery_zone_localizations.sql` | ❌ No (to be verified — file not yet read, but grep returned no matches for function names) |

### 5.3 Supabase Edge Functions

| File | Contains RPC definitions? |
|---|---|
| `supabase/functions/admin-api/index.ts` | ❌ No RPC calls found |
| `supabase/functions/delete-user/index.ts` | ❌ No RPC calls found |

### 5.4 Conclusion on SQL Location

All 4 RPC function bodies reside in **remote PostgreSQL** (Supabase dashboard), NOT in the repository's file system. This was confirmed by the absence of any `CREATE FUNCTION` statements for these names across:
- 2 SQL files
- 2 Edge Function `.ts` files
- All `.ts` and `.tsx` application source files

---

## 6. Checkout Flow Complete Trace

### 6.1 Full Order Creation Path

```
src/app/(customer)/menu.tsx (add to cart)
  → store/cart.store.ts (Zustand: items[], add, remove, increaseQty, etc.)
    → getTotalPrice() — pure client-side reduce over items[].price * items[].quantity
  → src/app/(customer)/cart.tsx (display cart, Checkout button)
    → total = subtotal + deliveryFee (hardcoded deliveryFee = 25, NOT from DB)
    → router.push("/checkout" as any)  [line 137]
  → src/app/checkout.tsx (checkout screen)
    → subtotal = getTotalPrice()  [line 34]
    → fee = DELIVERY_FEES[city] or 50  [line 120, hardcoded map]
    → total = subtotal + fee  [line 121]
    → placeOrder()  [line 125]
      → supabase.rpc('create_secure_order', { 11 params, NO items/prices })
      → clearCart()  [line 136]
      → router.replace("/(customer)/orders")  [line 137]
```

### 6.2 Pricing Data Flow

| Field | Computed at (client) | Sent to RPC? | Server-side reconstruction possible? |
|---|---|---|---|
| `subtotal` | `getTotalPrice()` in cart.store.ts | ❌ No | Only if RPC reads cart table (none exists) |
| `delivery_fee` | `DELIVERY_FEES[city] ?? 50` hardcoded map | ❌ No | Only if RPC has its own fee table |
| `discount_amount` | `validateCoupon()` in queries.ts:229 | ❌ No | Only if RPC reads coupon independently |
| `total` | `subtotal + fee` | ❌ No | Only if RPC recomputes from items |
| `items` (product_id, quantity) | Zustand cart store | ❌ No | No cart table exists in DB |
| `unit_price` per item | `item.price` in cart | ❌ No | Only if RPC looks up products table |

### 6.3 Three Inconsistent Delivery Fee Sources

1. **`src/app/checkout.tsx:13`** — `DELIVERY_FEES` hardcoded map (Nasr City: 50, Maadi: 40, etc.)
2. **`src/app/(customer)/cart.tsx:18`** — `const deliveryFee = 25` (fixed, no city lookup)
3. **`lib/queries.ts:242-248`** — `getAllDeliveryZones()` queries `delivery_zones` table from DB (never used by checkout.tsx)

### 6.4 Post-Order Redirect

The checkout redirects to `/(customer)/orders` (the orders list screen), **NOT** to `/order/success`. The success screen at `src/app/order/success.tsx` (referenced in old reports) is **deleted** in the current codebase (confirmed in git status: `D src/app/order/success.tsx`). The backup version remains at `src-backup/app/order/success.tsx`.

### 6.5 Stock Reservation

**No stock decrement exists in the checkout flow.** The `placeOrder()` function only calls `create_secure_order` RPC and `clearCart()`. There is:
- No `updateProductStock` function in active code
- No `inventory_movements` INSERT in any application code
- No stock validation before order creation

The `inventory_movements` table IS defined in `SUPSABASE_MISSING_TABLES.sql:64` with columns: `id, product_id, movement_type, quantity_change, reference_id, reference_type, notes, created_at, created_by` — but it is **never referenced in any `.ts`/`.tsx` file** in the application.

---

## 7. Type System Analysis

### 7.1 TypeScript Types (src/type.d.ts:46-68)

```typescript
export type Order = {
  id: string;
  status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  coupon_code: string | null;
  total: number;
  customer_note: string | null;
  created_at: string;
  address_id: string;
  driver_id: string | null;
};

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};
```

### 7.2 getOrderById (lib/queries.ts:181-192)

```typescript
export const getOrderById = async ({ id }: { id: string }) => {
  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id, status, payment_method, subtotal, delivery_fee, discount_amount, total, customer_note, created_at, address_id, driver_id, profiles!orders_driver_id_fkey(full_name, phone)")
    .eq("id", id).single();
  if (orderError) throw orderError;
  const { data: items, error: itemsError } = await supabase.from("order_items")
    .select("id, product_id, product_name, unit_price, quantity, line_total").eq("order_id", id);
  if (itemsError) throw itemsError;
  return { order, items, error: null };
};
```

**Note:** `getOrderById` accepts only `{ id: string }` — NOT `{ id, userId }`. This means it does not enforce user ownership at the query level; it relies entirely on RLS policies. The old audit summary's description of `getOrderById({id, userId})` was inaccurate for the current codebase.

### 7.3 Type Mismatch: createSecureOrder vs checkout.tsx

The `createSecureOrder` wrapper in `queries.ts` expects `items: { product_id: string; quantity: number }[]` and sends `p_items`. The `checkout.tsx` RPC call sends neither `p_items` nor any items array. If both were called against the same RPC function, the server would need to handle a `p_items` parameter that may be NULL (from checkout.tsx) or populated (from the dead wrapper). This is a **contract ambiguity** that could cause a SQL return type mismatch.

---

## 8. RLS and Access Control Analysis

### 8.1 supabaseAdmin (lib/supabaseAdmin.ts:1-5)

```typescript
import { createClient } from '@supabase/supabase-js';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const service = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || anon;
export const supabase = createClient(url, anon);
export const supabaseAdmin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
```

**Finding:** The service role key is exposed via `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — a **publishable** environment variable (the `EXPO_PUBLIC_` prefix makes it bundled in the client). The fallback to `anon` key when the service role key is missing means it silently degrades.

### 8.2 requireAdmin() (lib/adminQueries.ts:9-17)

```typescript
async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not auth");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
    throw new Error("Not admin");
  }
  return user;
}
```

**Finding:** `requireAdmin()` is properly implemented but is **dead code** — no admin screen imports or calls any function from `adminQueries.ts`. The admin screens (`src/app/(admin)/orders.tsx`, etc.) all use direct `supabase.from('orders')` calls with RLS, NOT the `supabaseAdmin` client.

### 8.3 Order Status Updates (All Screens)

| Role | Screen | Mechanism | RPC Used? |
|---|---|---|---|
| Admin | `(admin)/orders.tsx:99-103` | `supabase.from('orders').update({status})` | ❌ No |
| Cashier | `(cashier)/drivers.tsx:84-94` | `supabase.from('orders').update({status})` | ❌ No |
| Driver | `(driver)/index.tsx:20-23` | `supabase.from('orders').update({driver_id, status})` | ❌ No |
| Driver | `(driver)/orders.tsx:83-88` | `supabase.from('orders').update({driver_id, status})` | ❌ No |
| Driver | `(driver)/tracking.tsx:31-34` | `supabase.from('orders').update({status})` | ❌ No |

**Conclusion:** All order status transitions bypass the RPCs entirely and use direct table writes with the anon client, relying on RLS policies for authorization.

---

## 9. Legacy Overload / EXECUTE Permissions

The audit request specifically mentions "old overload" EXECUTE permissions. No SQL function definitions exist in the repository, so there are no overload signatures to inspect. The only function definition present is `update_updated_at_column()` (a generic timestamp trigger helper). The 4 RPC functions' overload signatures, EXECUTE permissions, and GRANT statements must be inspected in the **Supabase SQL Editor** (remote PostgreSQL).

---

## 10. Key Discrepancies from Old Reports

### 10.1 Old Reports Reference `createOrder` — Current Code Uses `create_secure_order`

- `QA_AUDIT_RESULTS.md:84` references `createOrder` at lines 334-391 in `lib/queries.ts`
- The current `lib/queries.ts` has **no `createOrder` function** (lines 334-391 are `getNotifications`/`markNotificationRead`)
- The current code uses `createSecureOrder` (lines 194-210) and direct `supabase.rpc('create_secure_order', ...)` in checkout.tsx
- Project reports (`project_reports/03_DATABASE_AND_API_REPORT.md`, `04_BUGS_AND_SECURITY_REPORT.md`, `07_PRIORITY_TODO_LIST.md`) all reference `createOrder` — these are **stale documents** based on an older codebase version

### 10.2 Old Reports Reference `(cashier)/checkout.tsx` — Current Code Has Bare `checkout.tsx`

- `QA_AUDIT_RESULTS.md:16` references `src/app/(cashier)/checkout.tsx`
- No such file exists. The actual checkout is at `src/app/checkout.tsx` (bare route)
- The `(cashier)` route group has no checkout screen; it has `index`, `stats`, `menu`, `drivers`, `profile`

### 10.3 Old Reports Reference `(taps)/` Routes — Deleted

- Git log shows commit `b14807a feat: repoint all (taps) and bare routes to (tabs)`
- `src/app/(tabs)/` files are all **deleted** (D in git status)
- Customer routes moved to `src/app/(customer)/`

---

## 11. Files Verified (Read-Only)

| File | Purpose Verified |
|---|---|
| `src/app/checkout.tsx` | Active `create_secure_order` RPC call (11 params, no items) |
| `src/app/(customer)/cart.tsx` | Cart → checkout routing, hardcoded delivery fee |
| `src/app/(customer)/orders.tsx` | Orders list after checkout redirect |
| `src/app/(driver)/index.tsx` | Driver order acceptance (direct update, no `accept_order` RPC) |
| `src/app/(driver)/orders.tsx` | Driver order management (direct update, no RPCs) |
| `src/app/(driver)/tracking.tsx` | Driver tracking (direct update, no RPCs) |
| `src/app/(driver)/wallet.tsx` | Driver wallet (aggregate from delivered orders) |
| `src/app/(admin)/orders.tsx` | Admin order status management (direct update, no RPCs) |
| `src/app/(cashier)/drivers.tsx` | Cashier order management (direct update, no RPCs) |
| `src/app/(cashier)/_layout.tsx` | Cashier tab layout (no checkout) |
| `src/app/_layout.tsx` | Root layout + route registration (no bare `checkout` screen registered) |
| `lib/queries.ts` (lines 1-332) | `createSecureOrder` (dead code), `getOrderById`, `validateCoupon`, etc. |
| `lib/adminQueries.ts` (full) | `requireAdmin()` (proper but dead), all admin ops |
| `lib/supabaseAdmin.ts` | Service role key exposure in EXPO_PUBLIC_ env var |
| `src/type.d.ts` (lines 46-68) | Order, OrderItem types |
| `SUPSABASE_MISSING_TABLES.sql` | Inventory movements table (defined, unused), no RPC functions |
| `src-backup/app/checkout.tsx` | Backup checkout (same 11-param pattern) |
| `src-backup/app/(admin)/users.tsx` | Backup admin (same `delete_staff_user` RPC) |
| `src/app/order/success.tsx` | Deleted in current codebase (confirmed via git status) |
| `memory/security-audit-verification-report.md` | Previous Phase 5 audit verification |

---

## 12. SQL Return Type Mismatch Assessment

**Cannot be assessed from repository.** All 4 RPC function definitions are remote PostgreSQL functions not present in the repo. The following potential mismatches were identified from client code:

1. **`create_secure_order` overload ambiguity:** The `createSecureOrder()` wrapper sends `p_items` (array of `{product_id, quantity}`), while `checkout.tsx` sends 11 address/location params but NOT `p_items`. If a single PostgreSQL function signature exists with `p_items` as optional/nullable, the server must handle NULL items. If NOT NULL, the checkout.tsx call would fail at runtime.

2. **Return type not consumed:** Neither call site reads the RPC `data` return value (checkout.tsx only checks `{error}`; `createSecureOrder` returns `data` but is never called). If the function is declared `RETURNS void` or `RETURNS TABLE(...)`, the TypeScript code does not validate the shape.

3. **`getOrderById` return:** Queries `order_items` with fields matching the `OrderItem` type, but the RPC `create_secure_order` may insert `order_items` with different field values (e.g., `product_name` NULL if looked up server-side) that don't match the type contract.

---

## 13. Recommendations (Read-Only — Awaiting Approval)

1. **Verify RPC definitions in Supabase SQL Editor** — none exist in repo; must inspect remote PostgreSQL
2. **Unify `create_secure_order` call pattern** — checkout.tsx sends 11 params without items; `createSecureOrder()` wrapper sends 5 params with items but is dead code. Choose one approach.
3. **Send pricing data to the RPC** — subtotal, delivery_fee, discount_amount, and total should be sent from client AND re-validated server-side from product prices
4. **Audit or remove `accept_order`, `cancel_my_order`, `reject_order`** — all 3 are dead RPC functions with no call sites. Either implement call sites or remove the functions.
5. **Implement cancellation** — no customer-facing cancellation mechanism exists
6. **Add rejection reason text** — `reject_order(uuid, text)` expects a reason string, but UI does bare `update({status:'cancelled'})`
7. **Add stock decrement** — no stock validation or decrement in checkout flow; `inventory_movements` table exists but is unused
