# Architecture Report — La Parisienne

## 1. Folder Structure

```
C:\Users\abdel\la-parisienne\
├── src/app/
│   ├── (admin)/              → Admin panel (dashboard, orders, inventory, settings…)
│   ├── (auth)/               → Sign-in, sign-up, forgot-password, reset-password
│   ├── (cashier)/            → Cashier POS (legacy + new)
│   ├── (taps)/               → Customer-facing app (menu, cart, orders, profile)
│   ├── address/              → Address management
│   ├── category/[id]/        → Category detail
│   ├── checkout.tsx          → Checkout flow
│   ├── order/[id].tsx        → Order detail
│   ├── order/success.tsx     → Order confirmation
│   ├── order/track/[id].tsx  → Live tracking
│   ├── product/[id].tsx      → Product detail
│   ├── profile/              → Edit profile, settings
│   ├── _layout.tsx           → Root layout with auth routing
│   └── (tabs)/               → (legacy) customer tab layout — mostly deleted
├── src/components/
│   ├── admin/                → AdminLayout, AdminSidebar, AdminMoreTrigger, Charts…
│   ├── cashier/              → CashierTabBar
│   ├── CartButton, CartItem, CategoryCard, CheckoutStepper…
│   └── ProfileRow, SearchBar, CustomInput, CustomButton…
├── lib/
│   ├── supabase.ts           → Client Supabase instance (anon key)
│   ├── supabaseAdmin.ts      → Admin Supabase instance (service role fallback)
│   ├── queries.ts            → Customer-facing queries (orders, favorites, addresses…)
│   └── adminQueries.ts       → Admin queries (CRUD, analytics, staff, coupons…)
├── store/
│   ├── auth.store.ts         → Zustand auth store (user, session, profile, sign-in/out)
│   ├── cart.store.ts         → Zustand cart store (items, add/remove, total price)
│   └── admin.store.ts        → Zustand admin UI store (sidebar, date range, refresh)
├── hooks/
│   ├── useSupabaseQuery.ts   → Generic query hook (loading, error, refetch)
│   └── useStoreSettings.ts   → Store hours, support contacts, location, delivery zones
├── components/               → Shared UI components (global)
├── constants/                → Images, static data
├── i18next/                  → i18n (ar, en, fr)
└── utils/validation.ts       → Egyptian phone validator
```

## 2. State Management

- **Zustand** (`zustand ^5.0.15`) is the only state management library used.
- Three stores:
  - `useAuthStore` — user, session, profile, auth actions
  - `useCartStore` — cart items, quantities, total price (client-side only, no persistence)
  - `useAdminStore` — admin UI state (sidebar collapse, date range, refresh trigger)
- No Bloc, Provider, Redux, or Riverpod.
- Server state is fetched inline via `useSupabaseQuery` hook (no React Query/SWR).

## 3. Backend

- **Supabase** (PostgreSQL + Auth + Realtime + Storage)
- Two client instances:
  - `supabase` (anon key) — for user-scoped reads/writes
  - `supabaseAdmin` (service role key) — for admin/server-side operations
- **⚠️ SECURITY ISSUE**: `supabaseAdmin.ts` falls back to the anon key if `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is missing. This means admin operations could run with anon privileges in production misconfiguration.
- No custom backend (no Node.js, no Firebase Cloud Functions).
- Real-time via Supabase channels (`postgres_changes`).
- Storage used for store images (`store-images` bucket).

## 4. Role-Based Routing

Implemented in `src/app/_layout.tsx` root layout:

```typescript
// After auth initializes:
if (profile?.role === "admin")     → router.replace("/dashboard")     // (admin) group
if (profile?.role === "cashier")   → router.replace("/(cashier)/home") // (cashier) group
else                                → router.replace("/")               // (taps) customer group
```

Each group has its own `_layout.tsx` that guards access:
- `(admin)/_layout.tsx` — redirects non-admins to `/`
- `(cashier)/_layout.tsx` — no guard (any authenticated user can access)
- `(taps)/_layout.tsx` — no guard (customer-facing)

**Roles** stored in `profiles.role` column: `customer`, `admin`, `cashier`, `delivery`.

**⚠️ Issue**: The cashier layout does NOT guard against non-cashier roles. Any authenticated user (including customers) can access `/(cashier)` routes.

## 5. App Flow (Login → Order Completion)

```
1. Sign-In / Sign-Up  →  supabase.auth.signInWithPassword / signUp
2. Profile loaded     →  supabase.from("profiles").select("*").eq(id)
3. Role redirect      →  _layout.tsx routes to (admin), (cashier), or (taps)
4. Customer:          →  (tabs) Home → Categories → Product → Add to Cart → Checkout
5. Checkout:          →  Address → Delivery → Payment → Place Order
6. Order created:     →  createOrder() → inserts orders + order_items
7. Success screen     →  /order/success?id={orderId}
8. Tracking:          →  /order/track/[id] → subscribes to driver location + status
```

**Admin flow:**
```
Dashboard → Orders (filter/status) → Accept/Reject → Update status → Realtime update
```

**Cashier flow:**
```
Home (pending orders) → Accept/Reject/Deliver → Status update → Realtime sync
```
