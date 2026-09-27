import { supabase, supabaseAdmin } from "./supabaseAdmin";

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
  try {
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
      supabaseAdmin
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
  } catch (e: any) {
    console.error('getDashboardStats error:', e.message);
    return { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, averageOrderValue: 0, pendingOrders: 0, lowStockCount: 0 };
  }
};

// ===========================================
// Sales by Date (last 30 days)
// ===========================================

export type SalesByDate = {
  date: string;
  revenue: number;
};

export const getSalesByDate = async (): Promise<SalesByDate[]> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("orders")
      .select("created_at, total")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("status", "delivered")
      .order("created_at", { ascending: true });

    if (error) { console.error('getSalesByDate error:', error.message); return []; }

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
  } catch (e: any) { console.error('getSalesByDate exception:', e.message); return []; }
};

// ===========================================
// Orders by Status
// ===========================================

export type OrderStatusCount = {
  status: string;
  count: number;
};

export const getOrdersByStatus = async (): Promise<OrderStatusCount[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("status")
      .order("status");

    if (error) { console.error('getOrdersByStatus error:', error.message); return []; }

    const statusMap = new Map<string, number>();
    data?.forEach((order) => {
      const current = statusMap.get(order.status) ?? 0;
      statusMap.set(order.status, current + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  } catch (e: any) { console.error('getOrdersByStatus exception:', e.message); return []; }
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
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("payment_method, total")
      .eq("status", "delivered")
      .order("payment_method");

    if (error) { console.error('getSalesByPaymentMethod error:', error.message); return []; }

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
  } catch (e: any) { console.error('getSalesByPaymentMethod exception:', e.message); return []; }
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
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, line_total")
      .order("quantity", { ascending: false })
      .limit(limit * 2);

    if (error) { console.error('getTopProducts error:', error.message); return []; }

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
  } catch (e: any) { console.error('getTopProducts exception:', e.message); return []; }
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
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, payment_method, total, created_at, address_id")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) { console.error('getRecentOrders error:', error.message); return []; }

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
          const { data: profile } = await supabaseAdmin
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
  } catch (e: any) { console.error('getRecentOrders exception:', e.message); return []; }
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
  try {
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
            const { data: profile } = await supabaseAdmin
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
          const { data: driver } = await supabaseAdmin
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
  } catch (e: any) { console.error('getAdminOrders exception:', e.message); return []; }
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

export async function getProducts(
  search: string = "",
  categoryFilter: CategoryFilter = "all",
  lowStockOnly: boolean = false
): Promise<InventoryProduct[]> {
  try {
    // Try with safe columns first, NEVER select reorder_point directly
    let { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, stock_quantity, category_id, image_url, is_active, is_featured')
      .order('name', { ascending: true });

    // Apply category filter using proper SDK chaining
    const catName = CATEGORY_MAP[categoryFilter];
    let filteredData = data ?? [];
    if (catName) {
      filteredData = filteredData.filter((p: any) => p.category_id === catName);
    }

    // Apply search filter client-side if needed
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase();
      filteredData = filteredData.filter((p: any) =>
        p.name?.toLowerCase().includes(searchLower) ||
        (p.description?.toLowerCase().includes(searchLower) || false)
      );
    }

    if (error) {
      // If still fails, try minimal columns without reorder_point/image_url
      if (error.message?.includes('reorder_point') || error.message?.includes('image_url')) {
        const retry = await supabase.from('products').select('id, name, description, price, category_id, is_active, is_featured').order('name', { ascending: true });
        if (retry.error) throw retry.error;
        filteredData = retry.data as any ?? [];
      } else {
        throw error;
      }
    }

    // Map the data to InventoryProduct, providing defaults for missing fields
    let products: InventoryProduct[] = (filteredData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      price: p.price ?? 0,
      stock_quantity: p.stock_quantity ?? p.stock ?? 0,
      reorder_point: p.reorder_point ?? 5,
      category_id: p.category_id ?? null,
      image_url: p.image_url ?? '',
      is_active: p.is_active ?? false,
      is_featured: p.is_featured ?? false,
    }));

    // Apply low stock filter
    if (lowStockOnly) {
      products = products.filter((p) => (p.reorder_point ?? 5) >= p.stock_quantity);
    }

    return products;
  } catch (e: any) {
    console.error('Supabase Get Products Error:', e.message);
    return [];
  }
}

export const updateProductStock = async (
  productId: string,
  newStock: number
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
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
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, price, category_id, is_active")
      .lt("stock_quantity", threshold)
      .eq("is_active", true)
      .order("stock_quantity", { ascending: true });

    if (error) { console.error('getLowStockProducts error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getLowStockProducts exception:', e.message); return []; }
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
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, image_url, sort_order, is_active")
      .order("sort_order", { ascending: true });

    if (error) { console.error('getAllCategories error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getAllCategories exception:', e.message); return []; }
};

export const getCategoryById = async (id: string): Promise<AdminCategory | null> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, image_url, sort_order, is_active")
      .eq("id", id)
      .single();

    if (error) { console.error('getCategoryById error:', error.message); return null; }

    return data;
  } catch (e: any) { console.error('getCategoryById exception:', e.message); return null; }
};

export type CreateCategoryInput = {
  name: string;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export const createCategory = async (input: CreateCategoryInput): Promise<AdminCategory> => {
  try {
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

    if (error) { console.error('createCategory error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('createCategory exception:', e.message); throw e; }
};

export const updateCategory = async (id: string, input: UpdateCategoryInput): Promise<AdminCategory> => {
  try {
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

    if (error) { console.error('updateCategory error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('updateCategory exception:', e.message); throw e; }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) { console.error('deleteCategory error:', error.message); throw error; }
  } catch (e: any) { console.error('deleteCategory exception:', e.message); throw e; }
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
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
      .order("created_at", { ascending: false });

    if (error) { console.error('getAllProducts error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getAllProducts exception:', e.message); return []; }
};

export const getProductById = async (id: string): Promise<AdminProduct | null> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
      .eq("id", id)
      .single();

    if (error) { console.error('getProductById error:', error.message); return null; }

    return data;
  } catch (e: any) { console.error('getProductById exception:', e.message); return null; }
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

export type UpdateProductInput = Partial<CreateProductInput>;

export const createProduct = async (input: CreateProductInput): Promise<AdminProduct> => {
  try {
    const { data, error } = await supabaseAdmin
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

    if (error) { console.error('createProduct error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('createProduct exception:', e.message); throw e; }
};

export const updateProduct = async (id: string, input: UpdateProductInput): Promise<AdminProduct> => {
  try {
    const { data, error } = await supabaseAdmin
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

    if (error) { console.error('updateProduct error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('updateProduct exception:', e.message); throw e; }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);

    if (error) { console.error('deleteProduct error:', error.message); throw error; }
  } catch (e: any) { console.error('deleteProduct exception:', e.message); throw e; }
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
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, role, is_active, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (error) { console.error('getCustomers error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getCustomers exception:', e.message); return []; }
};

export const getCustomerById = async (id: string): Promise<AdminCustomer | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, role, is_active, created_at")
      .eq("id", id)
      .single();

    if (error) { console.error('getCustomerById error:', error.message); return null; }

    return data;
  } catch (e: any) { console.error('getCustomerById exception:', e.message); return null; }
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
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, role, is_active, created_at")
      .eq("id", id)
      .single();

    if (profileError) { console.error('getCustomerWithOrders profile error:', profileError.message); return null; }
    if (!profile) return null;

    // Get orders for this customer via addresses
    const { data: addresses, error: addrError } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("user_id", id);

    if (addrError) { console.error('getCustomerWithOrders addresses error:', addrError.message); return null; }

    const addressIds = addresses?.map((a) => a.id) ?? [];

    if (addressIds.length === 0) {
      return { ...profile, orders: [] };
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, total, created_at")
      .in("address_id", addressIds)
      .order("created_at", { ascending: false });

    if (ordersError) { console.error('getCustomerWithOrders orders error:', ordersError.message); return null; }

    return {
      ...profile,
      orders: orders ?? [],
    };
  } catch (e: any) { console.error('getCustomerWithOrders exception:', e.message); return null; }
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
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { console.error('getAllCoupons error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getAllCoupons exception:', e.message); return []; }
};

export const getCouponById = async (id: string): Promise<AdminCoupon | null> => {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) { console.error('getCouponById error:', error.message); return null; }

    return data;
  } catch (e: any) { console.error('getCouponById exception:', e.message); return null; }
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
  try {
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

    if (error) { console.error('createCoupon error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('createCoupon exception:', e.message); throw e; }
};

export type UpdateCouponInput = Partial<CreateCouponInput>;

export const updateCoupon = async (id: string, input: UpdateCouponInput): Promise<AdminCoupon> => {
  try {
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

    if (error) { console.error('updateCoupon error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('updateCoupon exception:', e.message); throw e; }
};

export const deleteCoupon = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) { console.error('deleteCoupon error:', error.message); throw error; }
  } catch (e: any) { console.error('deleteCoupon exception:', e.message); throw e; }
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
  try {
    const { data, error } = await supabase
      .from("store_hours")
      .select("*")
      .order("day_of_week", { ascending: true });

    if (error) { console.error('getAllStoreHours error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getAllStoreHours exception:', e.message); return []; }
};

export type CreateStoreHourInput = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open?: boolean;
};

export const createStoreHour = async (input: CreateStoreHourInput): Promise<AdminStoreHour> => {
  try {
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

    if (error) { console.error('createStoreHour error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('createStoreHour exception:', e.message); throw e; }
};

export type UpdateStoreHourInput = Partial<CreateStoreHourInput>;

export const updateStoreHour = async (id: string, input: UpdateStoreHourInput): Promise<AdminStoreHour> => {
  try {
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

    if (error) { console.error('updateStoreHour error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('updateStoreHour exception:', e.message); throw e; }
};

export const deleteStoreHour = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("store_hours").delete().eq("id", id);

    if (error) { console.error('deleteStoreHour error:', error.message); throw error; }
  } catch (e: any) { console.error('deleteStoreHour exception:', e.message); throw e; }
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
  try {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .order("name", { ascending: true });

    if (error) { console.error('getAllDeliveryZones error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getAllDeliveryZones exception:', e.message); return []; }
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
  try {
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

    if (error) { console.error('createDeliveryZone error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('createDeliveryZone exception:', e.message); throw e; }
};

export type UpdateDeliveryZoneInput = Partial<CreateDeliveryZoneInput>;

export const updateDeliveryZone = async (id: string, input: UpdateDeliveryZoneInput): Promise<AdminDeliveryZone> => {
  try {
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

    if (error) { console.error('updateDeliveryZone error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('updateDeliveryZone exception:', e.message); throw e; }
};

export const deleteDeliveryZone = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);

    if (error) { console.error('deleteDeliveryZone error:', error.message); throw error; }
  } catch (e: any) { console.error('deleteDeliveryZone exception:', e.message); throw e; }
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
  try {
    // ── Today's orders ──
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    let todayOrdersData: any[] = [];
    try {
      const { data, error } = await supabase.from("orders").select("id, status, total, branch_id").gte("created_at", startOfDay.toISOString());
      if (!error && data) todayOrdersData = data;
    } catch (e: any) { console.warn('Today orders query failed:', e.message); }

    const dailyRevenue = todayOrdersData.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.total ?? 0), 0);
    const todayOrdersCount = todayOrdersData.length;
    const cancelledOrdersCount = todayOrdersData.filter((o) => o.status === "cancelled").length;

    // ── Weekly Revenue ──
    let weeklyOrdersData: any[] = [];
    try {
      const { data, error } = await supabase.from("orders").select("status, total").gte("created_at", startOfWeek.toISOString());
      if (!error && data) weeklyOrdersData = data;
    } catch (e: any) { console.warn('Weekly orders query failed:', e.message); }
    const weeklyRevenue = weeklyOrdersData.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.total ?? 0), 0);

    // ── Low Stock Count ──
    let lowStockCount = 0;
    try {
      const { count, error } = await supabaseAdmin.from("products").select("*", { count: "exact", head: true }).lt("stock_quantity", 5);
      if (!error) lowStockCount = count ?? 0;
    } catch (e: any) { console.warn('Low stock count failed:', e.message); }

    // ── Refund Requests ──
    let refundRequests = 0;
    try {
      const { count, error } = await supabaseAdmin.from('refund_requests').select('*', { count: 'exact', head: true });
      if (!error) refundRequests = count ?? 0;
      else {
        const alt = await supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true });
        if (!alt.error) refundRequests = alt.count ?? 0;
      }
    } catch { refundRequests = 0; }

    // ── Branch Comparison ──
    let branchComparison: BranchComparisonItem[] = [];
    try {
      const branchMap = new Map<string, number>();
      todayOrdersData.forEach((o: any) => {
        if (o.branch_id) branchMap.set(o.branch_id, (branchMap.get(o.branch_id) ?? 0) + 1);
      });
      const totalBranchOrders = Array.from(branchMap.values()).reduce((a, b) => a + b, 0);
      if (totalBranchOrders > 0) {
        const branchIds = Array.from(branchMap.keys());
        let branchesData: any[] = [];
        try {
          const { data, error } = await supabase.from("branches").select("id, name").in("id", branchIds);
          if (!error && data) branchesData = data;
        } catch (e: any) { console.warn('Branches query failed:', e.message); }
        if (branchesData.length > 0) {
          branchComparison = branchIds.map((id) => {
            const branch = branchesData.find((b: any) => b.id === id);
            const count = branchMap.get(id) ?? 0;
            return { branch_id: id, branch_name: branch?.name ?? null, order_count: count, percentage: Math.round((count / totalBranchOrders) * 100) };
          }).sort((a, b) => b.order_count - a.order_count);
        }
      }
    } catch { branchComparison = []; }

    return {
      dailyRevenue,
      weeklyRevenue,
      todayOrders: todayOrdersCount,
      cancelledOrders: cancelledOrdersCount,
      lowStockCount,
      refundRequests,
      branchComparison,
    };
  } catch (e: any) {
    console.error('getDashboardMetrics final catch:', e.message);
    return {
      dailyRevenue: 0,
      weeklyRevenue: 0,
      todayOrders: 0,
      cancelledOrders: 0,
      lowStockCount: 0,
      refundRequests: 0,
      branchComparison: [],
    };
  }
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
  try {
    // 1. Fetch profiles with allowed roles
    let query = supabaseAdmin
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
  } catch (e: any) { console.error('getStaffMembers exception:', e.message); return []; }
};

export const updateStaffRole = async (
  staffId: string,
  newRole: StaffRole
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
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
    const { data: profileData, error: profileError } = await supabaseAdmin
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
  try {
    const { data, error } = await supabase
      .from("support_contacts")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) { console.error('getAllSupportContacts error:', error.message); return []; }

    return data ?? [];
  } catch (e: any) { console.error('getAllSupportContacts exception:', e.message); return []; }
};

export type CreateSupportContactInput = {
  phone: string;
  label?: string | null;
  is_primary?: boolean;
};

export const createSupportContact = async (input: CreateSupportContactInput): Promise<AdminSupportContact> => {
  try {
    const { data, error } = await supabase
      .from("support_contacts")
      .insert({
        phone: input.phone,
        label: input.label ?? null,
        is_primary: input.is_primary ?? false,
      })
      .select("*")
      .single();

    if (error) { console.error('createSupportContact error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('createSupportContact exception:', e.message); throw e; }
};

export type UpdateSupportContactInput = Partial<CreateSupportContactInput>;

export const updateSupportContact = async (id: string, input: UpdateSupportContactInput): Promise<AdminSupportContact> => {
  try {
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

    if (error) { console.error('updateSupportContact error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('updateSupportContact exception:', e.message); throw e; }
};

export const deleteSupportContact = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("support_contacts").delete().eq("id", id);

    if (error) { console.error('deleteSupportContact error:', error.message); throw error; }
  } catch (e: any) { console.error('deleteSupportContact exception:', e.message); throw e; }
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
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "store_location")
      .maybeSingle();

    if (error) { console.error('getStoreLocation error:', error.message); return { address: "", latitude: 0, longitude: 0, updated_at: "" }; }

    return (data?.value as StoreLocation) ?? {
      address: "",
      latitude: 0,
      longitude: 0,
      updated_at: "",
    };
  } catch (e: any) { console.error('getStoreLocation exception:', e.message); return { address: "", latitude: 0, longitude: 0, updated_at: "" }; }
};

export const updateStoreLocation = async (input: Partial<StoreLocation>): Promise<StoreLocation> => {
  const location: StoreLocation = {
    address: input.address ?? "",
    latitude: input.latitude ?? 0,
    longitude: input.longitude ?? 0,
    updated_at: "",
  };

  try {
    const { data, error } = await supabase
      .from("app_settings")
      .upsert({
        key: "store_location",
        value: location,
      }, { onConflict: "key" })
      .select("value")
      .single();

    if (error) { console.error('updateStoreLocation error:', error.message); throw error; }

    return data.value as StoreLocation;
  } catch (e: any) { console.error('updateStoreLocation exception:', e.message); throw e; }
};

export const getAppSetting = async <T = any>(key: string): Promise<T | null> => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) { console.error('getAppSetting error:', error.message); return null; }

    return data?.value ?? null;
  } catch (e: any) { console.error('getAppSetting exception:', e.message); return null; }
};

export const setAppSetting = async <T = any>(key: string, value: T): Promise<AppSetting> => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .upsert({
        key,
        value,
      }, { onConflict: "key" })
      .select("key, value, updated_at")
      .single();

    if (error) { console.error('setAppSetting error:', error.message); throw error; }

    return data;
  } catch (e: any) { console.error('setAppSetting exception:', e.message); throw e; }
};

export const getAppLanguage = async (): Promise<string> => {
  const language = await getAppSetting<string>("app_language");
  return language ?? "en";
};

export const setAppLanguage = async (language: string): Promise<void> => {
  await setAppSetting("app_language", language);
};