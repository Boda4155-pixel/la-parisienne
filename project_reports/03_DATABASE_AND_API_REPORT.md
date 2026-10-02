# Database & API Report

## 1. Database Collections (Supabase Tables)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User accounts & roles | id, full_name, email, phone, role, is_active, created_at |
| `categories` | Product categories | id, name, description, image_url, sort_order, is_active |
| `products` | Menu items | id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured, created_at |
| `orders` | Customer orders | id, user_id, address_id, payment_method, status, subtotal, delivery_fee, discount_amount, coupon_code, total, customer_note, driver_id, created_at |
| `order_items` | Line items per order | id, order_id, product_id, product_name, unit_price, quantity, line_total |
| `customer_addresses` | Delivery addresses | id, user_id, label, full_name, phone, address_line, street, building_number, floor, apartment, city, area, notes, is_default, latitude, longitude |
| `favorites` | User favorites | id, user_id, product_id |
| `delivery_zones` | Delivery fee zones | id, name, name_en, name_fr, name_ar, price, is_active |
| `coupons` | Discount coupons | id, code, name, description, is_active, discount_type, discount_value, max_discount, usage_limit, times_used, min_order_amount, expires_at |
| `stores` | Store config (cashier) | id, name, address, phone, cuisine, description, min_order, delivery_fee, work_hours, auto_accept, free_delivery, latitude, longitude, rating, years_in_business, language, logo_url, cover_url |
| `app_settings` | Key-value app settings | key, value |
| `store_hours` | Opening hours per day | id, day_of_week, open_time, close_time, is_open |
| `support_contacts` | Support phone numbers | id, phone, label, is_primary |
| `role_permissions` | Role-based permissions | role, permission_key, is_enabled |
| `driver_locations` | Live driver GPS | id, driver_id, latitude, longitude, updated_at |
| `notifications` | Push/broadcast notifications | id, title, body, target_type, target_value, created_by, read_count |
| `branches` | Store branches (referenced but may not exist) | id, name |

## 2. Full Models

### Order Model
```typescript
{
  id: string;
  status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled" | "out_for_delivery" | "delivered";
  payment_method: "cash" | "card" | "wallet";
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  coupon_code: string | null;
  total: number;
  customer_note: string | null;
  created_at: string;
  address_id: string;
  driver_id: string | null;
  // From order_items join: items[]
}
```

### User (Profile) Model
```typescript
{
  id: string;           // Supabase Auth user ID
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "customer" | "admin" | "cashier" | "delivery" | "supervisor";
  is_active: boolean;
  created_at: string;
}
```

### Product Model
```typescript
{
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}
```

## 3. API Endpoints / Functions

### Supabase Queries (Client-side, anon key)
- `getCategories()`, `getCategoriesWithCount()`
- `getProducts()`, `getFeaturedProducts()`, `getProductById()`
- `getFavorites()`, `isProductFavorite()`, `addFavorite()`, `removeFavorite()`
- `getAddresses()`, `addAddress()`, `deleteAddress()`
- `getOrders()`, `getOrderById()`
- `getPendingOrders()`, `updateOrderStatus()`, `getTodayOrders()` (cashier)
- `validateCoupon()`, `incrementCouponUsage()`
- `updateProfile()`
- `getAllDeliveryZones()`, `DELIVERY_OPTIONS()`
- `getDriverLocation()`, `subscribeToDriverLocation()`, `subscribeToOrderStatus()`
- `getOrdersCount()`, `getFavoritesCount()`

### Supabase Admin Queries (service role key)
- `getDashboardStats()`, `getSalesByDate()`, `getOrdersByStatus()`, `getSalesByPaymentMethod()`
- `getTopProducts()`, `getRecentOrders()`, `getAdminOrders()`
- `getProducts()`, `updateProductStock()`, `toggleProductAvailability()`
- `getAllCategories()`, `getCategoryById()`, `createCategory()`, `updateCategory()`, `deleteCategory()`
- `getAllProducts()`, `getProductById()`, `createProduct()`, `updateProduct()`, `deleteProduct()`
- `getCustomers()`, `getCustomerWithOrders()`
- `getAllCoupons()`, `createCoupon()`, `updateCoupon()`, `deleteCoupon()`
- `getAllStoreHours()`, `createStoreHour()`, `updateStoreHour()`, `deleteStoreHour()`
- `getAllDeliveryZones()`, `createDeliveryZone()`, `updateDeliveryZone()`, `deleteDeliveryZone()`
- `getDashboardMetrics()`, `getSalesAnalytics()`, `getTopSellingProducts()`, `getRolePermissions()`, `updateRolePermissions()`, `getPeakHoursData()`
- `getDeliveryDrivers()`, `getFleetOrders()`, `assignDriverToOrder()`
- `sendAdminNotification()`, `getRecentBroadcasts()`
- `getAllSupportContacts()`, `createSupportContact()`, `updateSupportContact()`, `deleteSupportContact()`
- `getStoreLocation()`, `updateStoreLocation()`, `getAppSetting()`, `setAppSetting()`, `getAppLanguage()`, `setAppLanguage()`
- `getStaffMembers()`, `updateStaffRole()`, `toggleStaffActive()`, `createStaff()`

### RPCs
- `increment_coupon_usage` — called via `supabaseAdmin.rpc()` in `incrementCouponUsage()`

### Auth (Supabase Auth)
- `signInWithPassword()`, `signUp()`, `signOut()`, `resetPasswordForEmail()`, `updateUser()`

## 4. NOT FOUND
- No custom REST API (no Express/Fastify server)
- No Firebase Cloud Functions
- No Stripe/Payment Intent server-side creation
- No webhook handlers
