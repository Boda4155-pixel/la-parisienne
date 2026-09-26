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
// Global Orders (Admin)
// ===========================================

export type AdminOrder = {
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
  customer_name: string | null;
  customer_email: string | null;
  branch_name: string | null;
};

export type OrderStatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export const getAdminOrders = async (
  statusFilter: OrderStatusFilter = "all",
  search: string = ""
): Promise<AdminOrder[]> => {
  let query = supabase
    .from("orders")
    .select("id, status, payment_method, subtotal, delivery_fee, discount_amount, coupon_code, total, customer_note, created_at, address_id, driver_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase Admin Orders Error:", error.message, error);
    return [];
  }

  const orders = data ?? [];

  // Join customer + branch info per order (safe, best-effort)
  const enriched = await Promise.all(
    orders.map(async (order) => {
      let customerName: string | null = null;
      let customerEmail: string | null = null;
      let branchName: string | null = null;

      try {
        const { data: address } = await supabase
          .from("customer_addresses")
          .select("user_id")
          .eq("id", order.address_id)
          .maybeSingle();

        if (address?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", address.user_id)
            .maybeSingle();
          customerName = profile?.full_name ?? null;
          customerEmail = profile?.email ?? null;
        }
      } catch (err: any) {
        console.error("Supabase Order Customer Join Exception:", err?.message ?? err);
      }

      try {
        const { data: driver } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", order.driver_id)
          .maybeSingle();
        if (driver?.full_name) {
          branchName = driver.full_name;
        }
      } catch (err: any) {
        console.error("Supabase Order Driver Join Exception:", err?.message ?? err);
      }

      return {
        ...order,
        customer_name: customerName,
        customer_email: customerEmail,
        branch_name: branchName,
      };
    })
  );

  // Client-side search fallback (order ID or customer name)
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    return enriched.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.customer_email ?? "").toLowerCase().includes(q)
    );
  }

  return enriched;
};

export const updateOrderStatus = async (
  orderId: string,
  newStatus: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Supabase Order Status Update Error:", error.message, error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("Supabase Order Status Update Exception:", err?.message ?? err);
    return false;
  }
};

// ===========================================
// Inventory & Product Management (Admin)
// ===========================================

export type InventoryProduct = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  reorder_point: number | null;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
};

export type CategoryFilter = "all" | "bakery" | "cookies" | "sandwiches" | "drinks" | "other";

const CATEGORY_MAP: Record<CategoryFilter, string | null> = {
  all: null,
  bakery: "bakery",
  cookies: "cookies",
  sandwiches: "sandwiches",
  drinks: "drinks",
  other: null,
};

export const getProducts = async (
  search: string = "",
  categoryFilter: CategoryFilter = "all",
  lowStockOnly: boolean = false
): Promise<InventoryProduct[]> => {
  try {
    let query = supabase
      .from("products")
      .select(
        "id, name, price, stock_quantity, reorder_point, category_id, image_url, is_active, is_featured"
      )
      .order("name", { ascending: true });

    // Apply category filter using proper SDK chaining
    const catName = CATEGORY_MAP[categoryFilter];
    if (catName) {
      query = query.ilike("category_id", `%${catName}%`);
    }

    // Apply search filter
    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Get Products Error:", error.message, error);
      return [];
    }

    let products = (data ?? []) as InventoryProduct[];

    // Client-side low stock filter
    if (lowStockOnly) {
      products = products.filter((p) => p.stock_quantity <= (p.reorder_point ?? 5));
    }

    return products;
  } catch (err: any) {
    console.error("Supabase Get Products Exception:", err?.message ?? err);
    return [];
  }
};

export const updateProductStock = async (
  productId: string,
  newStock: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", productId);

    if (error) {
      console.error("Supabase Update Stock Error:", error.message, error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("Supabase Update Stock Exception:", err?.message ?? err);
    return false;
  }
};

export const toggleProductAvailability = async (
  productId: string,
  isAvailable: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("products")
      .update({ is_active: isAvailable })
      .eq("id", productId);

    if (error) {
      console.error("Supabase Toggle Availability Error:", error.message, error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("Supabase Toggle Availability Exception:", err?.message ?? err);
    return false;
  }
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
// Dashboard Metrics (Daily/Weekly/Alerts)
// ===========================================

export type BranchComparisonItem = {
  branch_id: string;
  branch_name: string | null;
  order_count: number;
  percentage: number;
};

export type DashboardMetrics = {
  dailyRevenue: number;
  weeklyRevenue: number;
  todayOrders: number;
  cancelledOrders: number;
  lowStockCount: number;
  refundRequests: number;
  branchComparison: BranchComparisonItem[];
};

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const now = new Date();

  // Start of today (midnight local time)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Start of current week (Monday)
  const startOfWeek = new Date(now);
  const dayOfWeek = startOfWeek.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // ── Today's orders (shared for revenue, counts, branch comparison) ──
  let todayOrdersData: Array<{
    id: string;
    status: string;
    total: number;
    branch_id?: string;
  }> = [];

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, total, branch_id")
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      console.error("Supabase Today Orders Error:", error.message, error);
    } else {
      todayOrdersData = data ?? [];
    }
  } catch (err: any) {
    console.error("Supabase Today Orders Exception:", err.message ?? err);
  }

  // Daily revenue: SUM(total) where status != 'cancelled'
  const dailyRevenue = todayOrdersData
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  // Today's order count
  const todayOrdersCount = todayOrdersData.length;

  // Cancelled orders today
  const cancelledOrdersCount = todayOrdersData.filter(
    (o) => o.status === "cancelled"
  ).length;

  // ── Weekly Revenue (independent query) ──
  let weeklyRevenue = 0;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("status, total")
      .gte("created_at", startOfWeek.toISOString());

    if (error) {
      console.error("Supabase Weekly Revenue Error:", error.message, error);
    } else {
      weeklyRevenue = (data ?? [])
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total ?? 0), 0);
    }
  } catch (err: any) {
    console.error("Supabase Weekly Revenue Exception:", err.message ?? err);
  }

  // ── Low Stock Count ──
  let lowStockCount = 0;
  try {
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .lt("stock_quantity", 5);

    if (error) {
      console.error("Supabase Low Stock Error:", error.message, error);
    } else {
      lowStockCount = count ?? 0;
    }
  } catch (err: any) {
    console.error("Supabase Low Stock Exception:", err.message ?? err);
  }

  // ── Refund Requests ──
  let refundRequests = 0;
  try {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "refund_requested");

    if (error) {
      console.error("Supabase Refund Requests Error:", error.message, error);
    } else {
      refundRequests = count ?? 0;
    }
  } catch (err: any) {
    console.error("Supabase Refund Requests Exception:", err.message ?? err);
  }

  // ── Branch Comparison ──
  let branchComparison: BranchComparisonItem[] = [];
  try {
    const branchMap = new Map<string, number>();
    todayOrdersData.forEach((o) => {
      if (o.branch_id) {
        branchMap.set(o.branch_id, (branchMap.get(o.branch_id) ?? 0) + 1);
      }
    });

    const totalBranchOrders = Array.from(branchMap.values()).reduce(
      (a, b) => a + b,
      0
    );

    if (totalBranchOrders > 0) {
      const branchIds = Array.from(branchMap.keys());
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("id, name")
        .in("id", branchIds);

      if (branchesError) {
        console.error("Supabase Branches Error:", branchesError.message, branchesError);
      } else {
        const branchNameMap = new Map<string, string | null>();
        branchesData?.forEach((b) => branchNameMap.set(b.id, b.name ?? null));

        branchComparison = Array.from(branchMap.entries())
          .map(([branch_id, count]) => ({
            branch_id,
            branch_name: branchNameMap.get(branch_id) ?? null,
            order_count: count,
            percentage: Math.round((count / totalBranchOrders) * 100),
          }))
          .sort((a, b) => b.order_count - a.order_count);
      }
    }
  } catch (err: any) {
    console.error("Supabase Branch Comparison Exception:", err.message ?? err);
    branchComparison = [];
  }

  return {
    dailyRevenue,
    weeklyRevenue,
    todayOrders: todayOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    lowStockCount,
    refundRequests,
    branchComparison,
  };
};

// ===========================================
// Staff Management (Admin)
// ===========================================

export type StaffRole = "cashier" | "supervisor" | "admin" | "delivery" | "customer";

export type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
  // Stats (optional, added after enrichment)
  todayOrders?: number;
  todayRevenue?: number;
  lastActive?: string | null;
};

export const getStaffMembers = async (
  search: string = "",
  roleFilter: StaffRole | "all" = "all"
): Promise<StaffMember[]> => {
  // 1. Fetch profiles with allowed roles
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .in("role", ["cashier", "supervisor", "admin", "delivery"])
    .order("created_at", { ascending: false });

  if (roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  const { data: profiles, error: profilesError } = await query;

  if (profilesError) {
    console.error("Supabase Staff Profiles Error:", profilesError.message, profilesError);
    return [];
  }

  const staffList = (profiles ?? []) as StaffMember[];

  // 2. For each staff, try to compute today's orders & revenue (best-effort)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const enriched = await Promise.all(
    staffList.map(async (staff) => {
      let todayOrders = 0;
      let todayRevenue = 0;
      let lastActive: string | null = null;

      try {
        // Try common column names for cashier attribution
        const possibleColumns = ["cashier_id", "handled_by", "staff_id", "user_id"];
        for (const col of possibleColumns) {
          const { data, error } = await supabase
            .from("orders")
            .select("id, total, created_at")
            .eq(col, staff.id)
            .gte("created_at", todayStart.toISOString());

          if (!error && data && data.length > 0) {
            todayOrders = data.length;
            todayRevenue = data.reduce((sum, o) => sum + (o.total ?? 0), 0);
            lastActive = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at ?? null;
            break; // found working column
          }
        }
      } catch (err: any) {
        console.error(`Supabase Staff Stats Exception for ${staff.id}:`, err?.message ?? err);
      }

      return {
        ...staff,
        todayOrders,
        todayRevenue,
        lastActive,
      };
    })
  );

  // 3. Client-side search fallback
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    return enriched.filter(
      (s) =>
        (s.full_name ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.role ?? "").toLowerCase().includes(q)
    );
  }

  return enriched;
};

export const updateStaffRole = async (
  staffId: string,
  newRole: StaffRole
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", staffId);

    if (error) {
      console.error("Supabase Update Staff Role Error:", error.message, error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("Supabase Update Staff Role Exception:", err?.message ?? err);
    return false;
  }
};

export const toggleStaffActive = async (
  staffId: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", staffId);

    if (error) {
      console.error("Supabase Toggle Staff Active Error:", error.message, error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("Supabase Toggle Staff Active Exception:", err?.message ?? err);
    return false;
  }
};

// ===========================================
// Create Staff Member (Admin)
// ===========================================

export type CreateStaffInput = {
  full_name: string;
  phone: string;
  role: StaffRole;
  password: string;
};

export const createStaff = async (
  input: CreateStaffInput
): Promise<StaffMember | null> => {
  try {
    // 1. Create auth user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${input.phone}@staff.local`,
      password: input.password,
      options: {
        data: {
          full_name: input.full_name,
          phone: input.phone,
          role: input.role,
        },
      },
    });

    if (authError) {
      console.error("Supabase Auth Signup Error:", authError.message, authError);
      return null;
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.error("Supabase Auth Signup: no user returned");
      return null;
    }

    // 2. Insert/update profile row
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: input.full_name,
          phone: input.phone,
          role: input.role,
          is_active: true,
        },
        { onConflict: "id" }
      )
      .select("id, full_name, email, phone, role, is_active, created_at")
      .single();

    if (profileError) {
      console.error("Supabase Create Staff Profile Error:", profileError.message, profileError);
      return null;
    }

    return (profileData ?? null) as StaffMember | null;
  } catch (err: any) {
    console.error("Supabase Create Staff Exception:", err?.message ?? err);
    return null;
  }
};

// ===========================================
// Advanced Analytics
// ===========================================

export type SalesAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByPeriod: { period: string; revenue: number; orders: number }[];
};

export type TopProductAnalytics = {
  id: string;
  name: string;
  quantitySold: number;
  revenue: number;
  category: string | null;
};

export type PeakHourAnalytics = {
  hour: number;
  hourLabel: string;
  orderCount: number;
  revenue: number;
};

export type TimeFrame = "day" | "week" | "month";

export const getSalesAnalytics = async (
  timeFrame: TimeFrame = "week"
): Promise<SalesAnalytics> => {
  const fallback: SalesAnalytics = {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    revenueByPeriod: [],
  };

  try {
    // Calculate date range based on time frame
    const now = new Date();
    const startDate = new Date();
    if (timeFrame === "day") {
      startDate.setDate(now.getDate() - 1);
    } else if (timeFrame === "week") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, total, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (ordersError) {
      console.error("Supabase Sales Analytics Error:", ordersError.message, ordersError);
      return fallback;
    }

    const orders = ordersData ?? [];
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group revenue by period
    const grouped: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((o) => {
      const date = new Date(o.created_at);
      let period: string;
      if (timeFrame === "day") {
        period = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      } else if (timeFrame === "week") {
        period = date.toLocaleDateString("en-US", { weekday: "short" });
      } else {
        period = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      if (!grouped[period]) {
        grouped[period] = { revenue: 0, orders: 0 };
      }
      grouped[period].revenue += o.total ?? 0;
      grouped[period].orders += 1;
    });

    const revenueByPeriod = Object.entries(grouped).map(([period, val]) => ({
      period,
      revenue: val.revenue,
      orders: val.orders,
    }));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByPeriod,
    };
  } catch (err: any) {
    console.error("Supabase Sales Analytics Exception:", err?.message ?? err);
    return fallback;
  }
};

export const getTopSellingProducts = async (
  limit = 5
): Promise<TopProductAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        product_id,
        quantity,
        unit_price,
        products:product_id ( name, category_id, categories:category_id ( name ) )
      `)
      .order("quantity", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase Top Selling Products Error:", error.message, error);
      return [];
    }

    const items = data ?? [];
    const aggregated = new Map<string, TopProductAnalytics>();
    items.forEach((item: any) => {
      const pid = item.product_id ?? "unknown";
      const existing = aggregated.get(pid);
      const name = item.products?.name ?? "Unknown Product";
      const category = item.products?.categories?.name ?? item.products?.category_id ?? null;
      const revenue = (item.quantity ?? 0) * (item.unit_price ?? 0);
      if (existing) {
        existing.quantitySold += item.quantity ?? 0;
        existing.revenue += revenue;
      } else {
        aggregated.set(pid, {
          id: pid,
          name,
          quantitySold: item.quantity ?? 0,
          revenue,
          category,
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  } catch (err: any) {
    console.error("Supabase Top Selling Products Exception:", err?.message ?? err);
    return [];
  }
};

export const getRolePermissions = async (role: 'cashier' | 'supervisor' | 'admin'): Promise<{ [key: string]: boolean }> => {
  const defaultPermissions: { [key: string]: boolean } = {
    "process-orders": false,
    "cancel-orders": false,
    "refund-orders": false,
    "manage-products-stock": false,
    "view-analytics-reports": false,
    "edit-staff-roles": false,
  };

  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission_key, is_enabled")
      .eq("role", role);

    if (error) {
      console.error("Supabase Role Permissions Error:", error.message, error);
      return defaultPermissions;
    }

    if (!data || data.length === 0) {
      console.warn(`No role permissions found for role: ${role}`);
      return defaultPermissions;
    }

    const permissions: { [key: string]: boolean } = { ...defaultPermissions };
    data.forEach((row: any) => {
      const key = row.permission_key ?? "";
      if (key in permissions) {
        permissions[key] = row.is_enabled ?? false;
      }
    });

    return permissions;
  } catch (err: any) {
    console.error("Supabase Role Permissions Exception:", err?.message ?? err);
    return defaultPermissions;
  }
};

export const updateRolePermissions = async (
  role: string,
  permissionKeys: string[]
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("role_permissions")
      .upsert(
        permissionKeys.map((key) => ({
          role,
          permission_key: key,
          is_enabled: true,
        })),
        { onConflict: "role,permission_key" }
      );

    if (error) {
      console.error("Supabase Update Role Permissions Error:", error.message, error);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Supabase Update Role Permissions Exception:", err?.message ?? err);
    return false;
  }
};

export const getPeakHoursData = async (): Promise<PeakHourAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, total, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error("Supabase Peak Hours Error:", error.message, error);
      return [];
    }

    const orders = data ?? [];
    const hourMap = new Map<number, { orderCount: number; revenue: number }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { orderCount: 0, revenue: 0 });
    }

    orders.forEach((o) => {
      const hour = new Date(o.created_at).getHours();
      const entry = hourMap.get(hour);
      if (entry) {
        entry.orderCount += 1;
        entry.revenue += o.total ?? 0;
      }
    });

    return Array.from(hourMap.entries()).map(([hour, val]) => ({
      hour,
      hourLabel: `${hour}:00`,
      orderCount: val.orderCount,
      revenue: val.revenue,
    }));
  } catch (err: any) {
    console.error("Supabase Peak Hours Exception:", err?.message ?? err);
    return [];
  }
};

export type DriverStatus = "active" | "idle" | "delayed";

export interface Driver {
  id: string;
  full_name: string;
  status: DriverStatus;
  current_location_text: string;
  assigned_orders_count: number;
}

export const getDeliveryDrivers = async (): Promise<Driver[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, status, current_location_text, assigned_orders_count")
      .eq("role", "delivery")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Supabase Delivery Drivers Error:", error.message, error);
      return [];
    }

    return data ?? [];
  } catch (err: any) {
    console.error("Supabase Delivery Drivers Exception:", err?.message ?? err);
    return [];
  }
};

export interface FleetOrder {
  id: string;
  status: string;
  customer_address?: string | null;
  driver_id: string | null;
  total: number;
  created_at: string;
}

export const getFleetOrders = async (): Promise<FleetOrder[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, created_at, total, driver_id")
      .in("status", ["preparing", "out_for_delivery"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Fleet Orders Error:", error.message, error);
      return [];
    }

    return data ?? [];
  } catch (err: any) {
    console.error("Supabase Fleet Orders Exception:", err?.message ?? err);
    return [];
  }
};

export const assignDriverToOrder = async (
  orderId: string,
  driverId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        driver_id: driverId,
        status: "out_for_delivery",
      })
      .eq("id", orderId);

    if (error) {
      console.error("Supabase Assign Driver Error:", error.message, error);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Supabase Assign Driver Exception:", err?.message ?? err);
    return false;
  }
};

// ===========================================
// Admin Messenger & Broadcast Alerts
// ===========================================

export type TargetType = "all" | "role" | "branch" | "user";

export interface BroadcastRecord {
  id: string;
  title: string;
  body: string;
  target_type: TargetType;
  created_at: string;
  read_count: number;
}

const MAX_MESSAGE_LENGTH = 500;

export const sendAdminNotification = async (
  targetType: TargetType,
  targetValue: string,
  title: string,
  body: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("notifications").insert({
      title,
      body,
      target_type: targetType,
      target_value: targetValue,
      created_by: null, // Will be set by RLS or trigger
    });

    if (error) {
      console.error("Supabase Send Notification Error:", error.message, error);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Supabase Send Notification Exception:", err?.message ?? err);
    return false;
  }
};

export const getRecentBroadcasts = async (): Promise<BroadcastRecord[]> => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, target_type, created_at, read_count")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase Recent Broadcasts Error:", error.message, error);
      return [];
    }

    return data ?? [];
  } catch (err: any) {
    console.error("Supabase Recent Broadcasts Exception:", err?.message ?? err);
    return [];
  }
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