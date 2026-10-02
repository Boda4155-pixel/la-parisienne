# Bugs & Security Report

## 1. Security Issues

| # | Severity | Issue | Location | Detail |
|---|----------|-------|----------|--------|
| S1 | 🔴 CRITICAL | `supabaseAdmin` falls back to anon key | `lib/supabaseAdmin.ts` | If `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is missing, admin operations (delete products, update stock, manage staff) run with **anon privileges** — any compromised client can perform admin actions |
| S2 | 🔴 CRITICAL | Client-side price manipulation | `store/cart.store.ts` | Cart total computed client-side (`basePrice + customizationPrice × qty`); malicious user can modify Zustand store or React Native devtools to undercharge |
| S3 | 🟠 HIGH | Cashier layout has no role guard | `src/app/(cashier)/_layout.tsx` | Any authenticated user (including customers) can access `/(cashier)` routes; only the root `_layout.tsx` redirects by role |
| S4 | 🟠 HIGH | Role permissions exist but unused | `lib/adminQueries.ts` → `getRolePermissions` | `role_permissions` table and `updateRolePermissions()` exist but no UI enforces them — all admins see all menu items |
| S5 | 🟡 MEDIUM | Service role key in client bundle | `lib/supabaseAdmin.ts` | `supabaseAdmin` is imported in client components (`adminQueries.ts` called from screens) — service role key shipped to Expo client |
| S6 | 🟡 MEDIUM | No RLS policies mentioned | Supabase dashboard | Cannot verify from code; if RLS is disabled on `orders`, `profiles`, or `products` tables, any anon user can read/write |
| S7 | 🟡 MEDIUM | Coupon `incrementCouponUsage` via admin RPC | `lib/adminQueries.ts` | `increment_coupon_usage` is a server-side RPC, good — but `validateCoupon` runs client-side, allowing race conditions on `usage_limit` |
| S8 | 🟡 MEDIUM | No input sanitization | All forms | No XSS/SQL injection protection visible; user inputs (name, address, note) passed directly to Supabase |

## 2. Logic Bugs

| # | Severity | Bug | Location | Detail |
|---|----------|-----|----------|--------|
| B1 | 🔴 CRITICAL | Cart total not validated server-side | `store/cart.store.ts` + `checkout.tsx` | `getTotalPrice()` is pure client math; checkout sends `subtotal` from cart to Supabase — user can tamper with cart store to set `subtotal` lower than actual |
| B2 | 🟠 HIGH | Stock not decremented on order creation | `lib/queries.ts` → `createOrder` | If `createOrder` does not call `updateProductStock`, overselling is possible — multiple concurrent orders can sell same item |
| B3 | 🟠 HIGH | Tax not calculated | `checkout.tsx` | `finalTotal = totalPrice + deliveryFee - discountAmount` — no tax applied, but Egyptian VAT (14%) may be required by law |
| B4 | 🟡 MEDIUM | `deliveryFee` hardcoded or from zone? | `checkout.tsx` | Unclear if delivery fee is from `delivery_zones` table or hardcoded; if hardcoded, zones are unused |
| B5 | 🟡 MEDIUM | `coupon.discount` applied before or after delivery? | `checkout.tsx` | `discountAmount` applied to `totalPrice` (items only) — discount on delivery fee is ambiguous |
| B6 | 🟡 MEDIUM | Switch toggle in menu.tsx no rollback | `src/app/(cashier)/menu.tsx:24` | If Supabase update fails, local state already flipped — inconsistent UI vs DB |
| B7 | 🟡 MEDIUM | `stock` can go negative | `src/app/(cashier)/menu.tsx:27` | `Math.max(0, ...)` prevents negative display, but no guard against concurrent stock decrements |
| B8 | 🟢 LOW | Hardcoded Arabic strings | Multiple cashier screens | `menu.tsx`, `profile.tsx` have hardcoded `'قائمتي'`, `'البروفايل'` — not using i18n keys |
| B9 | 🟢 LOW | `href: null` on `orders` tab | `src/app/(cashier)/_layout.tsx:31` | `<Tabs.Screen name="orders" options={{ href: null }} />` — hidden tab still in navigator, potential confusion |

## 3. TODOs / FIXMEs Found

- `src/app/profile/settings.tsx:76` — `TODO: Edge Function ~ service role` (unimplemented Edge Function for role elevation)
- `lib/adminQueries.ts` — multiple `// TODO:` comments for pagination, filters
- `src/app/checkout.tsx` — `// TODO: handle wallet payment` (wallet payment not implemented)
- `src/app/order/track/[id].tsx` — `// TODO: handle location permission denied`
