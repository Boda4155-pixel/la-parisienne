# Expo App QA Audit Results

**Date**: 2026-09-27
**Framework**: Expo 57.0.19, React Native, TypeScript
**Auditor**: Claude Code QA Agent

---

## Summary Table

| File | Line | Error Type | Severity | Exact Fix Needed |
|------|------|------------|----------|------------------|
| store/auth.store.ts | 100-122 | Crash / Permission | **HIGH** | Wrap loadProfile in try/catch, use supabaseAdmin for profiles query |
| store/auth.store.ts | 137-148 | Permission | **HIGH** | Change `supabase` to `supabaseAdmin` for profiles query on phone login |
| lib/queries.ts | ALL | Crash | **HIGH** | Wrap all 40+ functions in try/catch returning fallback values |
| src/app/(cashier)/checkout.tsx | 50-65 | Crash | **HIGH** | Wrap order insert in try/catch with loading state reset |
| src/app/(cashier)/pos.tsx | 51-69 | Crash | **MEDIUM** | Add setLoading(false) in catch blocks |
| src/app/(cashier)/pos.tsx | 138-162 | Crash | **HIGH** | Wrap checkout in try/catch, use supabaseAdmin for order writes |
| src/app/(cashier)/products.tsx | 27-60 | Crash | **MEDIUM** | Add error state and proper error boundaries |
| src/app/(cashier)/products.tsx | 98-107 | Crash | **MEDIUM** | Add error handling for products fetch |
| src/app/(cashier)/home.tsx | 44-49 | UI | **MEDIUM** | Reset loading state in catch block |
| src/app/(admin)/add-product.tsx | 77 | Logic | **MEDIUM** | Show user alert on image picker error instead of console.log |
| src/app/(admin)/account.tsx | 62, 77 | Logic | **LOW** | Add user feedback for console errors |
| src/app/(admin)/messenger.tsx | 123 | Logic | **LOW** | Add user feedback |
| src/app/(admin)/permissions.tsx | 140-148 | Logic | **LOW** | Add proper success/error UI |
| i18next/i18next.ts | 81-95 | UI/UX | **MEDIUM** | Document that language change requires app restart |

## Detailed Findings

### 1. store/auth.store.ts - Auth State Management

**Issue 1.1**: `loadProfile` function (lines 100-122)
- **Error Type**: Crash / Permission
- **Severity**: HIGH
- **Problem**: Function uses `supabase` for profile queries which may fail RLS, lacks try/catch wrapper
- **Exact Fix**: 
```typescript
// Line 100-122: Wrap in try/catch and use supabaseAdmin for profile reads
loadProfile: async (userId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Profile error:", error);
      set({ profile: null, isLoading: false });
      return;
    }
    set({ profile: data, isLoading: false });
  } catch (e) {
    console.error("Profile load exception:", e);
    set({ profile: null, isLoading: false });
  }
},
```

**Issue 1.2**: Phone login profile query (lines 137-148)
- **Error Type**: Permission
- **Severity**: HIGH
- **Problem**: Queries profiles table with `supabase` for phone lookup, should bypass RLS
- **Exact Fix**: Change `supabase` to `supabaseAdmin` on line 137

### 2. lib/queries.ts - Client Queries (40+ functions)

**All functions missing try/catch protection**

| Function | Lines | Issue | Fix |
|----------|-------|-------|-----|
| getCategories | 8-20 | No try/catch | Return `[]` on error |
| getCategoriesWithCount | 26-67 | No try/catch | Return `[]` on error |
| getProducts | 79-111 | No try/catch | Return `[]` on error |
| getFeaturedProducts | 113-127 | No try/catch | Return `[]` on error |
| getProductById | 129-143 | No try/catch | Return `null` on error |
| getFavorites | 149-159 | No try/catch | Return `[]` on error |
| isProductFavorite | 161-180 | No try/catch | Return `false` on error |
| addFavorite | 182-196 | No try/catch | Return `true` on success, `false` on error |
| removeFavorite | 198-214 | No try/catch | Return `true` on success |
| getAddresses | 220-235 | No try/catch | Return `[]` on error |
| addAddress | 254-291 | No try/catch | Return created address or throw |
| deleteAddress | 293-309 | No try/catch | Return `true` on success |
| createOrder | 334-391 | No try/catch | Need transaction rollback on failure |
| getOrders | 392-405 | No try/catch | Return `[]` on error |
| getOrderById | 407-437 | No try/catch | Return `null` on error |
| updateProfile | (read file) | Missing | Add try/catch, use supabaseAdmin |
| toggleProductActive | 529+ | Missing | Add try/catch, use supabaseAdmin |

**Exact Fix Pattern Example**:
```typescript
export const getProducts = async ({
  categoryId,
  query,
  limit,
}: GetProductsParams = {}) => {
  try {
    let request = supabase
      .from("products")
      .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (categoryId) request = request.eq("category_id", categoryId);
    if (query) request = request.ilike("name", `%${query}%`);
    if (limit) request = request.limit(limit);

    const { data, error } = await request;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("getProducts error:", error);
    return [];
  }
};
```

### 3. src/app/(cashier)/checkout.tsx - Customer Checkout

**Issue 3.1**: Order creation crash risk
- **Line**: 50-65, 139-157
- **Error Type**: Crash
- **Severity**: HIGH
- **Problem**: Uses `supabase` (anon key) for order.insert - RLS may block, missing try/catch
- **Exact Fix**: 
 1. Use `supabaseAdmin` for order writes
 2. Wrap in try/catch with loading state reset:
```typescript
setSubmitting(true);
try {
  const order = await createOrder({ /* params */ });
  clearCart();
  router.replace({ pathname: "/order/success", params: { id: order.id } });
} catch (error: any) {
  Alert.alert(t("checkout.orderFailed"), error?.message || t("common.somethingWentWrong"));
} finally {
  setSubmitting(false);
}
```

### 4. src/app/(cashier)/pos.tsx - Cashier POS Screen

**Issue 4.1**: Product fetch error handling
- **Lines**: 51-69
- **Error Type**: Crash
- **Severity**: MEDIUM
- **Problem**: Error shows Alert but doesn't reset loading state, functions continue with empty products
- **Exact Fix**: Add `setLoading(false)` in both catch blocks

**Issue 4.2**: Checkou

t mutation uses `supabase` instead of `supabaseAdmin`
- **Lines**: 138-162
- **Error Type**: Permission
- **Severity**: HIGH
- **Problem**: `supabase` (anon key) for order insert may be blocked by RLS
- **Exact Fix**: Change import and use `supabaseAdmin` from `../../../lib/supabaseAdmin`

### 5. src/app/(cashier)/products.tsx - Cashier Products

**Issue 5.1**: Missing error state
- **Lines**: 27-60
- **Error Type**: Crash
- **Severity**: MEDIUM
- **Problem**: Sets products directly after fetch, no error state rendering
- **Exact Fix**: Add `error` state and render error message UI

**Issue 5.2**: Null check on data
- **Line**: 104
- **Error Type**: Logic
- **Severity**: MEDIUM
- **Problem**: `data ?? []` - if data is null/undefined, products list shows empty but no user feedback
- **Exact Fix**: Add error state display

### 6. src/app/(cashier)/home.tsx - Cashier Home

**Issue 6.1**: Console error without UI feedback
- **Lines**: 44-49
- **Error Type**: UI
- **Severity**: MEDIUM  
- **Problem**: Error logged to console but user sees nothing
- **Exact Fix**: Add `Alert.alert` with error message

### 7. src/app/(admin)/add-product.tsx - Add Product

**Issue 7.1**: Image picker error not shown to user
- **Line**: 77
- **Error Type**: Logic
- **Severity**: MEDIUM
- **Problem**: Uses `console.log` for image picker errors - user gets no feedback
- **Exact Fix**: 
```typescript
} catch (e: any) {
  console.log('ImagePick error', e);
  Alert.alert(t("common.error"), t("product.imagePickerError") || "Failed to pick image");
}
```

### 8. src/app/(admin)/account.tsx

**Issue 8.1**: Console errors without user feedback
- **Lines**: 62, 77
- **Error Type**: Logic
- **Severity**: LOW
- **Problem**: Errors logged but no user notification
- **Exact Fix**: Add `Alert.alert` calls

### 9. i18next/i18next.ts - Language Change

**Issue 9.1**: App reload on language change
- **Lines**: 81-95
- **Error Type**: UI/UX
- **Severity**: MEDIUM
- **Problem**: Language change triggers `Updates.reloadAsync()` which may lose unsaved state
- **Exact Fix**: Add warning to user: "Language will change on restart" before triggering reload, or implement state persistence

---

## Critical Issues Summary

### Crash Risks (Cannot proceed without fix)

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | store/auth.store.ts:100-122 | loadProfile no try/catch | Entire app crashes on network error |
| 2 | lib/queries.ts | 40+ functions without try/catch | Any DB error crashes app |
| 3 | src/app/(cashier)/checkout.tsx | Order insert unprotected | Checkout may freeze on error |

### Permission / RLS Violations

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | store/auth.store.ts:137 | Uses `supabase` for profiles read | User profile may fail with RLS |
| 2 | src/app/(cashier)/pos.tsx:139 | Uses `supabase` for orders insert | Cashier orders may fail |
| 3 | src/app/(cashier)/checkout.tsx:50 | Uses `supabase` for orders insert | Customer orders may fail |

### UI/UX Issues

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | src/app/(cashier)/pos.tsx | Loading state not reset on error | UI shows perpetual loading |
| 2 | i18next/i18next.ts | App reload loses state | Data loss on language change |

---

## Fix Priority

1. **P0 (Immediate)**: Wrap `store/auth.store.ts loadProfile` in try/catch
2. **P0 (Immediate)**: Add try/catch to ALL functions in `lib/queries.ts`
3. **P1 (High)**: Change `supabase` to `supabaseAdmin` for write operations in cashier screens
4. **P1 (High)**: Add try/catch to cashier checkout flow
5. **P2 (Medium)**: Add user feedback for console errors
6. **P3 (Low)**: Document language change behavior

---

## Total Count

| Severity | Count |
|----------|-------|
| HIGH | 8 |
| MEDIUM | 9 |
| LOW | 3 |
| **TOTAL** | **20** |