# Priority TODO List

## 🔴 CRITICAL — Must fix before production

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| C1 | Add server-side price validation in checkout | `lib/queries.ts` → `createOrder`, `checkout.tsx` | Recalculate subtotal from `order_items` on server; reject mismatch |
| C2 | Implement stock decrement with race-condition guard | `lib/queries.ts` → `createOrder`, `adminQueries.ts` → `updateProductStock` | Use `UPDATE products SET stock = stock - x WHERE id = ? AND stock >= x` |
| C3 | Move `supabaseAdmin` off client bundle | `lib/supabaseAdmin.ts`, all `adminQueries.ts` calls | Create Cloud Function / Supabase Edge Function for admin operations |
| C4 | Fix `supabaseAdmin` fallback to anon key | `lib/supabaseAdmin.ts` | Throw error if service role key missing; never silently fall back |
| C5 | Add role guard to `(cashier)/_layout.tsx` | `src/app/(cashier)/_layout.tsx` | Redirect non-cashiers to `/` |
| C6 | Implement real Stripe payment | `src/app/checkout.tsx`, `PaymentInfoStripe` | Create PaymentIntent server-side, confirm with `stripe.confirmPayment` |
| C7 | Enable Supabase RLS on all tables | Supabase Dashboard | `profiles`, `orders`, `products`, `customer_addresses`, `favorites` |
| C8 | Remove `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from client | `.env`, `lib/supabaseAdmin.ts` | Service role key must never be in Expo client bundle |

## 🟠 IMPORTANT — Should fix this sprint

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| I1 | Add offline queue for orders | New: `lib/offlineQueue.ts` | Store orders in AsyncStorage, sync on reconnect |
| I2 | Add global error boundary | `src/app/_layout.tsx` | Catch JS errors, show fallback UI |
| I3 | Add pagination to admin lists | `lib/adminQueries.ts` | `getAdminOrders`, `getCustomers`, `getProducts` — cursor-based |
| I4 | Add pull-to-refresh to all lists | All `*Page.tsx` | `RefreshControl` on ScrollViews |
| I5 | Add loading skeletons | All screens replacing `ActivityIndicator` | Shimmer placeholders |
| I6 | Implement wallet payment | `src/app/checkout.tsx` | `// TODO: handle wallet payment` |
| I7 | Add deep link config | `app.json` | `expo.org/la-parisienne` scheme for push notification routing |
| I8 | Add Egyptian VAT (14%) to checkout | `checkout.tsx` | `finalTotal = totalPrice + deliveryFee - discountAmount + tax` |
| I9 | Configure `expo-image` cache/resize | All `<Image>` components | Use `expo-image` `cachePolicy`, `resizeMode` |
| I10 | Add cashier layout role guard | `src/app/(cashier)/_layout.tsx` | Prevent customers from accessing cashier screens |

## 🟡 NICE TO HAVE — Backlog

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| N1 | Add thermal printer receipt | New: `lib/printer.ts` | `expo-print` + ESC/POS commands |
| N2 | Add push notifications | New: `lib/notifications.ts` | `expo-notifications` + FCM + `notifications` table |
| N3 | Add Sentry crash reporting | `_layout.tsx`, `lib/supabase.ts` | `@sentry/react-native` |
| N4 | Add analytics | New: `lib/analytics.ts` | Mixpanel / Amplitude / Firebase |
| N5 | Add biometric auth | `store/auth.store.ts` | Face ID / fingerprint for cashier |
| N6 | Dark mode support | `tailwind.config.js`, all screens | `color-scheme` media query |
| N7 | Full RTL for customer tabs | `(taps)/_layout.tsx`, all tabs | `I18nManager.forceRTL(true)` for ar |
| N8 | Refund UI | New: `src/app/(admin)/refunds/` | Table exists, no screen |
| N9 | Delivery app screens | New: `(delivery)/` group | `delivery` role has no UI |
| N10 | OTA updates | `app.json` + `expo-updates` | `expo-updates` configuration |
| N11 | Multi-store selector | `src/app/(cashier)/profile.tsx` | `stores` table exists, no selector |
| N12 | Invoice PDF generation | New: `lib/pdf.ts` | `expo-print` + PDF document |
| N13 | Remove unused deps | `package.json` | `axios`, `@react-navigation/stack` appear unused |
| N14 | Add ESLint + Prettier | `.eslintrc.js`, `.prettierrc` | No linting/formatting currently |
| N15 | Add unit tests | `__tests__/` | No tests exist; Jest is installed but no specs |
