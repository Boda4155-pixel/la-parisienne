# Features Status Report

| Feature | Screen Path | Status | Notes |
|---------|-------------|--------|-------|
| Auth & Role Selection | `src/app/(auth)/sign-in.tsx`, `sign-up.tsx` | ✅ Done | Email + password, phone login supported, role-based redirect after login |
| Menu / Categories | `src/app/(taps)/index.tsx`, `categories.tsx`, `category/[id].tsx` | ✅ Done | Categories with count, featured products, search |
| Cart | `src/app/(taps)/cart.tsx` | ✅ Done | Zustand store, add/remove/increase/decrease, customizations support |
| Checkout | `src/app/checkout.tsx` | ✅ Done | 3-step (address → delivery → payment), coupon validation, Stripe payment info display |
| Order Lifecycle | `src/app/order/[id].tsx`, `order/track/[id].tsx` | ✅ Done | Status tracking, driver location map, realtime updates |
| Payment Gateway | `src/app/checkout.tsx` | ⚠️ Partial | Cash & card shown; card opens Stripe `PaymentInfoStripe` component but **no actual Stripe integration** — `wallet` is "coming soon" |
| Admin Dashboard | `src/app/(admin)/dashboard.tsx` | ✅ Done | Revenue, orders, customers, low stock, branch comparison |
| Admin Products CRUD | `src/app/(admin)/products/`, `add-product.tsx` | ✅ Done | Create, read, update, delete with search & category filter |
| Admin Categories CRUD | `src/app/(admin)/categories/` | ✅ Done | Full CRUD |
| Admin Coupons | `src/app/(admin)/coupons/` | ✅ Done | Create, read, update, delete with validation |
| Admin Customers | `src/app/(admin)/customers/` | ✅ Done | List, view with orders |
| Admin Staff / Roles | `src/app/(admin)/staff.tsx` | ✅ Done | Create staff, assign roles, toggle active |
| Admin Delivery Zones | `src/app/(admin)/settings/delivery-zones/` | ✅ Done | CRUD |
| Admin Store Hours | `src/app/(admin)/settings/store-hours/` | ✅ Done | CRUD |
| Admin Analytics | `src/app/(admin)/analytics.tsx`, `revenue.tsx` | ✅ Done | Sales by date, payment method, top products, peak hours |
| Cashier POS | `src/app/(cashier)/index.tsx` | ⚠️ Partial | Order list with status tabs, but **no invoice printing**, no payment confirmation flow |
| Cashier Menu/Products | `src/app/(cashier)/menu.tsx` | ✅ Done | Toggle availability, stock adjust |
| Cashier Stats | `src/app/(cashier)/stats.tsx` | ✅ Done | Sales totals, weekly chart |
| Cashier Drivers | `src/app/(cashier)/drivers.tsx` | ⚠️ Partial | Drivers list, but no assignment flow |
| Cashier Profile | `src/app/(cashier)/profile.tsx` | ✅ Done | Store settings, GPS, language |
| Delivery App | ❌ NOT FOUND | 🚫 Not Started | No dedicated delivery role screens; driver features are embedded in admin fleet |
| Live Location | `src/app/order/track/[id].tsx` | ✅ Done | MapView with driver marker, realtime subscription |
| Push Notifications | ❌ NOT FOUND | 🚫 Not Started | No FCM / Expo Push Notifications setup |
| Order Realtime | `lib/queries.ts` → `subscribeToOrderStatus` | ✅ Done | Supabase channel on `orders` table |
| Offline Handling | ❌ NOT FOUND | 🚫 Not Started | No offline queue, no async storage persistence for cart/orders |
| Printer SDK | ❌ NOT FOUND | 🚫 Not Started | No thermal printer integration |
| Multi-language | `i18next/` + `useTranslation` | ✅ Done | ar, en, fr — but some hardcoded Arabic strings remain in cashier screens |
| RTL Support | `AdminLayout.tsx`, `I18nManager` | ✅ Done | Some RTL layout handling in admin |
| Image Optimization | `expo-image` | ⚠️ Partial | `expo-image` installed but no explicit optimization (resize, cache headers) |
| Loading States | Varies by screen | ⚠️ Partial | Some screens have skeletons, others just ActivityIndicator |
| Empty States | Most lists | ✅ Done | `ListEmptyComponent` with friendly messages |
| Error Handling | Varies | ⚠️ Partial | Console.error everywhere, but user-facing error messages inconsistent |
| Search | `src/app/(taps)/search.tsx` | ✅ Done | Product search by name with category filter |
| Favorites | `src/app/(taps)/favorite.tsx` | ✅ Done | Toggle favorite, count in profile |
| Address Management | `src/app/address/` | ✅ Done | Add, list, default address |
| Coupons (Customer) | `src/app/checkout.tsx` | ✅ Done | Apply coupon, validation, discount |
| Stock Management | `src/app/(admin)/inventory.tsx` | ✅ Done | Restock, toggle availability, low stock filter |
| Role Permissions | `lib/adminQueries.ts` → `getRolePermissions` | ⚠️ Partial | Table/function exists but **UI does not enforce granular permissions** — all admins see all menus |
| Delivery Fleet | `src/app/(admin)/fleet.tsx` | ⚠️ Partial | Assign driver, view orders, but no live tracking for delivery app |
| Support Contacts | `src/app/(admin)/settings/support-contacts/` | ✅ Done | CRUD |
| Store Location | `src/app/(admin)/settings/store-location.tsx` | ✅ Done | Map picker, save coordinates |
| App Language | `src/app/(admin)/settings/language.tsx` | ✅ Done | Store setting + app restart |
| Refunds | ❌ NOT FOUND | 🚫 Not Started | `refund_requests`/`refunds` table referenced in queries but no UI |
| Messenger/Broadcast | `src/app/(admin)/messenger.tsx` | ✅ Done | Send notifications to users/roles |
