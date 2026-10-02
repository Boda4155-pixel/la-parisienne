# Missing for Production Report

## 🔴 CRITICAL (must-have before launch)

| # | Missing Item | Detail |
|---|-------------|--------|
| 1 | **Server-side price validation** | Checkout must re-calculate subtotal server-side from `order_items` before inserting order; current flow trusts client `cart.getTotalPrice()` |
| 2 | **Stock decrement with optimistic locking** | `updateProductStock` must use Supabase `select + update` with `stock_quantity` check or use database triggers to prevent overselling |
| 3 | **Stripe actual integration** | `PaymentInfoStripe` only displays card icon; no `stripe.confirmPayment`, no PaymentIntent creation, no webhook handler |
| 4 | **Supabase RLS policies** | Cannot confirm RLS is enabled; all tables should have policies restricting `anon` to own rows, `service_role` to admin only |
| 5 | **Env variable protection** | `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` must NOT be in client bundle; admin queries should run via Cloud Function or backend |
| 6 | **Role guard on `/(cashier)`** | Add `(cashier)/_layout.tsx` guard redirecting non-cashiers to `/` |

## 🟠 IMPORTANT (should-have)

| # | Missing Item | Detail |
|---|-------------|--------|
| 7 | **Offline queue** | Orders created offline should queue locally (AsyncStorage) and sync when connectivity returns |
| 8 | **Error boundary** | No global error boundary; crashes in one screen can take down entire app |
| 9 | **Loading skeletons** | Many screens use raw `ActivityIndicator`; no shimmer/skeleton placeholders |
| 10 | **Pull-to-refresh** | Lists lack `RefreshControl`; only manual reload buttons |
| 11 | **Pagination** | `getAdminOrders`, `getCustomers`, `getProducts` all fetch all rows — will break at scale |
| 12 | **Image caching / optimization** | `expo-image` installed but not configured; no resize, no cache headers on Supabase Storage |
| 13 | **Egyptian phone validation** | `utils/validation.ts` exists but not applied on all auth/signup screens |
| 14 | **Deep link handling** | No `app.json` deep link config for `la-parisienne://` — push notifications cannot open specific order |
| 15 | ** APK / AAB signing config** | No `android.keystore` or EAS credentials mentioned |

## 🟡 NICE TO HAVE

| # | Missing Item | Detail |
|---|-------------|--------|
| 16 | **Thermal printer SDK** | `expo-print` or `escpos-commands` for receipt printing |
| 17 | **FCM / Expo Push Notifications** | `expo-notifications` + FCM token registration + `notifications` table |
| 18 | **Sentry / Crashlytics** | No error monitoring; `console.error` everywhere |
| 19 | **Analytics** | No Mixpanel/Amplitude/Firebase Analytics |
| 20 | **Biometric auth** | Face ID / fingerprint for cashier app |
| 21 | **Dark mode** | No `color-scheme` support |
| 22 | **RTL full support** | Admin has some RTL; customer tabs do not |
| 23 | **Refund UI** | `refund_requests` table exists but no screen |
| 24 | **Delivery app** | `delivery` role has no dedicated screens |
| 25 | **App versioning / updates** | No `expo-updates` or forced-update flow |
| 26 | **Multi-store support** | `stores` table exists but no store selector UI |
| 27 | **Invoice PDF** | No receipt PDF generation |
