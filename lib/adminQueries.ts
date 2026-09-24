import { supabase } from "./supabase";

// ===========================================
// Dashboard Stats
// ===========================================

export type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  pendingOrders: number;
  lowStockCount: number;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [ordersResult, productsResult, usersResult] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status", { count: "exact", head: true })
      .eq("status", "delivered")
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .lt("stock_quantity", 10),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),
  ]);

  const deliveredOrders = ordersResult.data ?? [];
  const lowStockCount = productsResult.count ?? 0;
  const totalCustomers = usersResult.count ?? 0;

  // Get total revenue from all delivered orders
  const { data: revenueData } = await supabase
    .from("orders")
    .select("total")
    .eq("status", "delivered");

  const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;

  // Get total orders count
  const { count: totalOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  // Get pending orders count
  const { count: pendingOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    totalRevenue,
    totalOrders: totalOrdersCount ?? 0,
    totalCustomers,
    averageOrderValue: totalRevenue > 0 && deliveredOrders.length > 0
      ? totalRevenue / deliveredOrders.length
      : 0,
    pendingOrders: pendingOrdersCount ?? 0,
    lowStockCount,
  };
};

// ===========================================
// Sales by Date (last 30 days)
// ===========================================

export type SalesByDate = {
  date: string;
  revenue: number;
};

export const getSalesByDate = async (): Promise<SalesByDate[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("orders")
    .select("created_at, total")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .eq("status", "delivered")
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Group by date
  const dateMap = new Map<string, number>();
  data?.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split("T")[0];
    const current = dateMap.get(date) ?? 0;
    dateMap.set(date, current + (order.total ?? 0));
  });

  return Array.from(dateMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// ===========================================
// Orders by Status
// ===========================================

export type OrderStatusCount = {
  status: string;
  count: number;
};

export const getOrdersByStatus = async (): Promise<OrderStatusCount[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .order("status");

  if (error) throw error;

  const statusMap = new Map<string, number>();
  data?.forEach((order) => {
    const current = statusMap.get(order.status) ?? 0;
    statusMap.set(order.status, current + 1);
  });

  return Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));
};

// ===========================================
// Sales by Payment Method
// ===========================================

export type PaymentMethodSales = {
  method: string;
  count: number;
  revenue: number;
};

export const getSalesByPaymentMethod = async (): Promise<PaymentMethodSales[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("payment_method, total")
    .eq("status", "delivered")
    .order("payment_method");

  if (error) throw error;

  const methodMap = new Map<string, { count: number; revenue: number }>();
  data?.forEach((order) => {
    const method = order.payment_method;
    const current = methodMap.get(method) ?? { count: 0, revenue: 0 };
    methodMap.set(method, {
      count: current.count + 1,
      revenue: current.revenue + (order.total ?? 0),
    });
  });

  return Array.from(methodMap.entries()).map(([method, data]) => ({
    method,
    ...data,
  }));
};

// ===========================================
// Top Products
// ===========================================

export type TopProduct = {
  id: string;
  name: string;
  units_sold: number;
  revenue: number;
};

export const getTopProducts = async (limit = 5): Promise<TopProduct[]> => {
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, line_total")
    .order("quantity", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  // Aggregate by product
  const productMap = new Map<string, { name: string; units: number; revenue: number }>();
  data?.forEach((item) => {
    const current = productMap.get(item.product_id) ?? { name: "", units: 0, revenue: 0 };
    productMap.set(item.product_id, {
      name: item.product_name,
      units: current.units + item.quantity,
      revenue: current.revenue + (item.line_total ?? 0),
    });
  });

  return Array.from(productMap.entries())
    .map(([id, info]) => ({ id, ...info, units_sold: info.units, revenue: info.revenue }))
    .sort((a, b) => b.units_sold - a.units_sold)
    .slice(0, limit);
};

// ===========================================
// Recent Orders
// ===========================================

export type RecentOrder = {
  id: string;
  status: string;
  payment_method: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
};

export const getRecentOrders = async (limit = 10): Promise<RecentOrder[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, payment_method, total, created_at, address_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Join with profiles for customer info
  const ordersWithCustomers = await Promise.all(
    data.map(async (order) => {
      const { data: address } = await supabase
        .from("customer_addresses")
        .select("user_id")
        .eq("id", order.address_id)
        .single();

      let customerName: string | null = null;
      let customerEmail: string | null = null;

      if (address?.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", address.user_id)
          .single();
        customerName = profile?.full_name ?? null;
        customerEmail = profile?.email ?? null;
      }

      return {
        ...order,
        customer_name: customerName,
        customer_email: customerEmail,
      };
    })
  );

  return ordersWithCustomers;
};

// ===========================================
// Low Stock Products
// ===========================================

export type LowStockProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
  category_id: string | null;
  is_active: boolean;
};

export const getLowStockProducts = async (threshold = 10): Promise<LowStockProduct[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, stock_quantity, price, category_id, is_active")
    .lt("stock_quantity", threshold)
    .eq("is_active", true)
    .order("stock_quantity", { ascending: true });

  if (error) throw error;

  return data ?? [];
};

// ===========================================
// Categories (Admin CRUD)
// ===========================================

export type AdminCategory = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean;
};

export const getAllCategories = async (): Promise<AdminCategory[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, image_url, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data ?? [];
};

export const getCategoryById = async (id: string): Promise<AdminCategory | null> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, image_url, sort_order, is_active")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
};

export type CreateCategoryInput = {
  name: string;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
};

export const createCategory = async (input: CreateCategoryInput): Promise<AdminCategory> => {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: input.name,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select("id, name, description, image_url, sort_order, is_active")
    .single();

  if (error) throw error;

  return data;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export const updateCategory = async (id: string, input: UpdateCategoryInput): Promise<AdminCategory> => {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      description: input.description,
      image_url: input.image_url,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .eq("id", id)
    .select("id, name, description, image_url, sort_order, is_active")
    .single();

  if (error) throw error;

  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw error;
};

// ===========================================
// Products (Admin CRUD)
// ===========================================

export type AdminProduct = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
};

export const getAllProducts = async (): Promise<AdminProduct[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
};

export const getProductById = async (id: string): Promise<AdminProduct | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
};

export type CreateProductInput = {
  category_id: string | null;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  stock_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
};

export const createProduct = async (input: CreateProductInput): Promise<AdminProduct> => {
  const { data, error } = await supabase
    .from("products")
    .insert({
      category_id: input.category_id,
      name: input.name,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      price: input.price,
      stock_quantity: input.stock_quantity ?? 0,
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
    })
    .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
    .single();

  if (error) throw error;

  return data;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export const updateProduct = async (id: string, input: UpdateProductInput): Promise<AdminProduct> => {
  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: input.category_id,
      name: input.name,
      description: input.description,
      image_url: input.image_url,
      price: input.price,
      stock_quantity: input.stock_quantity,
      is_active: input.is_active,
      is_featured: input.is_featured,
    })
    .eq("id", id)
    .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
    .single();

  if (error) throw error;

  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw error;
};

// ===========================================
// Customers (Admin Read)
// ===========================================

export type AdminCustomer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

export const getCustomers = async (): Promise<AdminCustomer[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
};

export const getCustomerById = async (id: string): Promise<AdminCustomer | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
};

export type CustomerWithOrders = AdminCustomer & {
  orders: Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
  }>;
};

export const getCustomerWithOrders = async (id: string): Promise<CustomerWithOrders | null> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .eq("id", id)
    .single();

  if (profileError) throw profileError;
  if (!profile) return null;

  // Get orders for this customer via addresses
  const { data: addresses, error: addrError } = await supabase
    .from("customer_addresses")
    .select("id")
    .eq("user_id", id);

  if (addrError) throw addrError;

  const addressIds = addresses?.map((a) => a.id) ?? [];

  if (addressIds.length === 0) {
    return { ...profile, orders: [] };
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .in("address_id", addressIds)
    .order("created_at", { ascending: false });

  if (ordersError) throw ordersError;

  return {
    ...profile,
    orders: orders ?? [],
  };
};

// ===========================================
// Coupons (Admin CRUD)
// ===========================================

export type AdminCoupon = {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  is_active: boolean;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  times_used: number;
  min_order_amount: number;
  expires_at: string | null;
  created_at: string;
};

export const getAllCoupons = async (): Promise<AdminCoupon[]> => {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
};

export const getCouponById = async (id: string): Promise<AdminCoupon | null> => {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
};

export type CreateCouponInput = {
  code: string;
  name?: string | null;
  description?: string | null;
  is_active?: boolean;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  min_order_amount?: number;
  expires_at?: string | null;
};

export const createCoupon = async (input: CreateCouponInput): Promise<AdminCoupon> => {
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: input.code.trim().toUpperCase(),
      name: input.name ?? null,
      description: input.description ?? null,
      is_active: input.is_active ?? true,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      max_discount: input.max_discount ?? null,
      usage_limit: input.usage_limit ?? null,
      times_used: 0,
      min_order_amount: input.min_order_amount ?? 0,
      expires_at: input.expires_at ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export type UpdateCouponInput = Partial<CreateCouponInput>;

export const updateCoupon = async (id: string, input: UpdateCouponInput): Promise<AdminCoupon> => {
  const { data, error } = await supabase
    .from("coupons")
    .update({
      code: input.code?.trim().toUpperCase(),
      name: input.name,
      description: input.description,
      is_active: input.is_active,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      max_discount: input.max_discount,
      usage_limit: input.usage_limit,
      min_order_amount: input.min_order_amount,
      expires_at: input.expires_at,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export const deleteCoupon = async (id: string): Promise<void> => {
  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) throw error;
};

// ===========================================
// Store Hours (Admin CRUD)
// ===========================================

export type AdminStoreHour = {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
};

export const getAllStoreHours = async (): Promise<AdminStoreHour[]> => {
  const { data, error } = await supabase
    .from("store_hours")
    .select("*")
    .order("day_of_week", { ascending: true });

  if (error) throw error;

  return data ?? [];
};

export type CreateStoreHourInput = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open?: boolean;
};

export const createStoreHour = async (input: CreateStoreHourInput): Promise<AdminStoreHour> => {
  const { data, error } = await supabase
    .from("store_hours")
    .insert({
      day_of_week: input.day_of_week,
      open_time: input.open_time,
      close_time: input.close_time,
      is_open: input.is_open ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export type UpdateStoreHourInput = Partial<CreateStoreHourInput>;

export const updateStoreHour = async (id: string, input: UpdateStoreHourInput): Promise<AdminStoreHour> => {
  const { data, error } = await supabase
    .from("store_hours")
    .update({
      day_of_week: input.day_of_week,
      open_time: input.open_time,
      close_time: input.close_time,
      is_open: input.is_open,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export const deleteStoreHour = async (id: string): Promise<void> => {
  const { error } = await supabase.from("store_hours").delete().eq("id", id);

  if (error) throw error;
};

// ===========================================
// Delivery Zones (Admin CRUD)
// ===========================================

export type AdminDeliveryZone = {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  name_ar: string | null;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const getAllDeliveryZones = async (): Promise<AdminDeliveryZone[]> => {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
};

export type CreateDeliveryZoneInput = {
  name: string;
  name_en: string | null;
  name_fr: string | null;
  name_ar: string | null;
  price: number;
  is_active?: boolean;
};

export const createDeliveryZone = async (input: CreateDeliveryZoneInput): Promise<AdminDeliveryZone> => {
  const { data, error } = await supabase
    .from("delivery_zones")
    .insert({
      name: input.name,
      name_en: input.name_en,
      name_fr: input.name_fr,
      name_ar: input.name_ar,
      price: input.price,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export type UpdateDeliveryZoneInput = Partial<CreateDeliveryZoneInput>;

export const updateDeliveryZone = async (id: string, input: UpdateDeliveryZoneInput): Promise<AdminDeliveryZone> => {
  const { data, error } = await supabase
    .from("delivery_zones")
    .update({
      name: input.name,
      name_en: input.name_en,
      name_fr: input.name_fr,
      name_ar: input.name_ar,
      price: input.price,
      is_active: input.is_active,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export const deleteDeliveryZone = async (id: string): Promise<void> => {
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);

  if (error) throw error;
};

// ===========================================
// Support Contacts (Admin CRUD)
// ===========================================

export type AdminSupportContact = {
  id: string;
  phone: string;
  label: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export const getAllSupportContacts = async (): Promise<AdminSupportContact[]> => {
  const { data, error } = await supabase
    .from("support_contacts")
    .select("*")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
};

export type CreateSupportContactInput = {
  phone: string;
  label?: string | null;
  is_primary?: boolean;
};

export const createSupportContact = async (input: CreateSupportContactInput): Promise<AdminSupportContact> => {
  const { data, error } = await supabase
    .from("support_contacts")
    .insert({
      phone: input.phone,
      label: input.label ?? null,
      is_primary: input.is_primary ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export type UpdateSupportContactInput = Partial<CreateSupportContactInput>;

export const updateSupportContact = async (id: string, input: UpdateSupportContactInput): Promise<AdminSupportContact> => {
  const { data, error } = await supabase
    .from("support_contacts")
    .update({
      phone: input.phone,
      label: input.label,
      is_primary: input.is_primary,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export const deleteSupportContact = async (id: string): Promise<void> => {
  const { error } = await supabase.from("support_contacts").delete().eq("id", id);

  if (error) throw error;
};

// ===========================================
// Store Location & App Settings
// ===========================================

export type StoreLocation = {
  address: string;
  latitude: number;
  longitude: number;
  updated_at: string;
};

export type AppSetting = {
  key: string;
  value: any;
  updated_at: string;
};

export const getStoreLocation = async (): Promise<StoreLocation> => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "store_location")
    .maybeSingle();

  if (error) throw error;

  return (data?.value as StoreLocation) ?? {
    address: "",
    latitude: 0,
    longitude: 0,
    updated_at: "",
  };
};

export const updateStoreLocation = async (input: Partial<StoreLocation>): Promise<StoreLocation> => {
  const location: StoreLocation = {
    address: input.address ?? "",
    latitude: input.latitude ?? 0,
    longitude: input.longitude ?? 0,
    updated_at: "",
  };

  const { data, error } = await supabase
    .from("app_settings")
    .upsert({
      key: "store_location",
      value: location,
    }, { onConflict: "key" })
    .select("value")
    .single();

  if (error) throw error;

  return data.value as StoreLocation;
};

export const getAppSetting = async <T = any>(key: string): Promise<T | null> => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;

  return data?.value ?? null;
};

export const setAppSetting = async <T = any>(key: string, value: T): Promise<AppSetting> => {
  const { data, error } = await supabase
    .from("app_settings")
    .upsert({
      key,
      value,
    }, { onConflict: "key" })
    .select("key, value, updated_at")
    .single();

  if (error) throw error;

  return data;
};

export const getAppLanguage = async (): Promise<string> => {
  const language = await getAppSetting<string>("app_language");
  return language ?? "en";
};

export const setAppLanguage = async (language: string): Promise<void> => {
  await setAppSetting("app_language", language);
};