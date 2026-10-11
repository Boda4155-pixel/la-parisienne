import { supabase, supabaseAdmin } from "./supabaseAdmin";

// ده لازم يشتغل Server-side فقط! متعملوش import في موبايل
const isServer = typeof window === 'undefined';
if (!isServer) {
  console.warn("⚠️ admin queries imported on client - security risk!");
}

async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not auth");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
    throw new Error("Not admin");
  }
  return user;
}

// ===========================================
// Dashboard Stats - نسخة محسنة query واحدة بدل 5
// ===========================================

export const getDashboardStats = async () => {
  await requireAdmin();
  try {
    const { data: orders } = await supabase.from("orders").select("total, status");
    const { count: lowStock } = await supabase.from("products").select("id", { count: 'exact', head: true }).lt("stock_quantity", 10).eq("is_active", true);
    const { count: customers } = await supabaseAdmin.from("profiles").select("id", { count: 'exact', head: true }).eq("role", "customer");
    
    const delivered = orders?.filter(o => o.status === 'delivered') ?? [];
    const totalRevenue = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
    const pending = orders?.filter(o => o.status === 'pending').length ?? 0;

    return {
      totalRevenue,
      totalOrders: orders?.length ?? 0,
      totalCustomers: customers ?? 0,
      averageOrderValue: delivered.length ? totalRevenue / delivered.length : 0,
      pendingOrders: pending,
      lowStockCount: lowStock ?? 0,
    };
  } catch (e: any) {
    console.error(e);
    return { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, averageOrderValue: 0, pendingOrders: 0, lowStockCount: 0 };
  }
};

// ===========================================
// Admin Orders - JOIN مرة واحدة بدل loop
// ===========================================

export const getAdminOrders = async (statusFilter: string = "all", search = "") => {
  await requireAdmin();
  let query = supabase.from("orders")
    .select(`
      id, status, payment_method, subtotal, delivery_fee, discount_amount, total, customer_note, created_at, address_id, driver_id,
      customer_addresses!inner(user_id, phone),
      profiles!customer_addresses_user_id_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false }).limit(100);

  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }

  let enriched = (data as any[]).map(o => ({
    ...o,
    customer_name: o.profiles?.full_name ?? null,
    customer_email: o.profiles?.email ?? null,
    customer_phone: o.customer_addresses?.phone ?? null,
  }));

  if (search.trim()) {
    const q = search.toLowerCase();
    enriched = enriched.filter(o => 
      o.id.toLowerCase().includes(q) || 
      (o.customer_name ?? "").toLowerCase().includes(q)
    );
  }
  return enriched;
};

export const updateOrderStatus = async (orderId: string, newStatus: string) => {
  await requireAdmin();
  const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  return !error;
};

// ===========================================
// Products - كله supabase عادي مع RLS
// ===========================================

export const getAllProducts = async () => {
  await requireAdmin();
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  return data ?? [];
};

export const createProduct = async (input: any) => {
  await requireAdmin();
  const { data, error } = await supabase.from("products").insert(input).select().single();
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, input: any) => {
  await requireAdmin();
  const { data, error } = await supabase.from("products").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
};

// ... باقي الفايلات نفس الفكرة: استخدم requireAdmin() + supabase

// ⚠️ دول لازم يتنقلوا Edge Functions لو هتستخدمهم من الموبايل
export const getCustomers = async () => {
  await requireAdmin();
  const { data } = await supabaseAdmin.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false });
  return data ?? [];
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

export const updateStoreHour = async (id: string, input: Partial<CreateStoreHourInput>): Promise<AdminStoreHour> => {
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

export const updateDeliveryZone = async (id: string, input: Partial<CreateDeliveryZoneInput>): Promise<AdminDeliveryZone> => {
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

export const updateSupportContact = async (id: string, input: Partial<CreateSupportContactInput>): Promise<AdminSupportContact> => {
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