# Dependencies Report

## From `package.json`

### Production Dependencies

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `expo` | ~51.0.0 | ⚠️ Check | Must match Expo SDK 51; check compatibility with other libs |
| `expo-router` | ~3.5.0 | ✅ OK | File-based routing, Expo Router v3 |
| `expo-status-bar` | ~1.12.0 | ✅ OK | |
| `expo-image` | ^1.12.0 | ⚠️ Partial | Installed but not fully configured for cache/resize |
| `expo-notifications` | ❌ NOT INSTALLED | 🚫 Missing | Needed for push notifications |
| `expo-updates` | ❌ NOT INSTALLED | 🚫 Missing | Over-the-air updates |
| `expo-print` | ❌ NOT INSTALLED | 🚫 Missing | Receipt printing |
| `@supabase/supabase-js` | ^2.39.0 | ✅ OK | Official JS client |
| `zustand` | ^5.0.15 | ✅ OK | Lightweight state mgmt |
| `react` | 18.2.0 | ✅ OK | |
| `react-native` | 0.74.0 | ✅ OK | |
| `react-native-screens` | ❌ | Check | Required by expo-router tabs |
| `react-native-safe-area-context` | ❌ | Check | Required by tabs |
| `i18next` | ^23.0.0 | ✅ OK | Localization |
| `react-i18next` | ^14.0.0 | ✅ OK | |
| `lucide-react-native` | ^0.400.0 | ✅ OK | Icon library |
| `tailwindcss` | ^3.4.0 | ✅ OK | Via nativewind |
| `nativewind` | ^4.0.0 | ✅ OK | Tailwind for RN |
| `class-variance-authority` | ^0.7.0 | ✅ OK | |
| `clsx` | ^2.1.0 | ✅ OK | |
| `tailwind-merge` | ^2.3.0 | ✅ OK | |
| `@gorhom/bottom-sheet` | ^4.0.0 | ✅ OK | Bottom sheets |
| `react-native-gesture-handler` | ^2.14.0 | ✅ OK | |
| `react-native-reanimated` | ^3.10.0 | ✅ OK | |
| `react-native-svg` | ^14.0.0 | ✅ OK | |
| `expo-font` | ^12.0.0 | ✅ OK | |
| `expo-splash-screen` | ^0.27.0 | ✅ OK | |
| `expo-constants` | ~16.0.0 | ✅ OK | |
| `expo-linking` | ^6.3.0 | ✅ OK | Deep links |
| `expo-secure-store` | ^12.0.0 | ✅ OK | Token storage |
| `@react-navigation/native` | ^6.1.0 | ✅ OK | |
| `@react-navigation/stack` | ^6.3.0 | ✅ OK | |
| `stripe` | ^14.0.0 | ✅ Installed | But no actual integration |
| `react-native-maps` | ^1.7.0 | ✅ OK | Driver location map |
| `expo-location` | ^17.0.0 | ✅ OK | GPS |
| `axios` | ^1.6.0 | ✅ OK | HTTP client (used where?) |
| `date-fns` | ^3.0.0 | ✅ OK | Date formatting |
| `intl` | ^1.0.0 | ✅ OK | ICU polyfill |

### Dev Dependencies

| Package | Version | Status |
|---------|---------|--------|
| `@babel/core` | ^7.24.0 | ✅ OK |
| `@types/react` | ~18.2.0 | ✅ OK |
| `typescript` | ^5.3.0 | ✅ OK |
| `jest` | ^29.0.0 | ✅ OK |

## ⚠️ Concerns

1. **`expo-notifications` not installed** — push notifications not implemented
2. **`expo-updates` not installed** — no OTA updates
3. **`expo-print` not installed** — no receipt printing
4. **`stripe` installed but unused** — `PaymentInfoStripe` only shows UI, no actual Stripe SDK calls
5. **`axios` installed** — codebase uses Supabase client for all API; `axios` may be unused dead weight
6. **`@react-navigation/stack` installed** — expo-router uses its own navigator; may be unused
7. **No `eslint` in deps** — no linting configured (check `.eslintrc` existence)
8. **No `prettier`** — no formatting configured
9. **No testing framework** beyond Jest — no unit/integration tests found
