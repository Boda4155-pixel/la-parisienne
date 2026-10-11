import { Category } from "../type";
import { supabase } from "./supabase";

// =========================================
// Categories
// =========================================
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
     .from("categories")
     .select("id, name, description, image_url, sort_order, is_active")
     .eq("is_active", true)
     .order("sort_order", { ascending: true });
    if (error) throw error;
    return { data: data as Category[], error: null };
  } catch (err) {
    console.error("getCategories exception:", err);
    return { data: [] as Category[], error: err };
  }
};

export type CategoryWithCount = Category & { productsCount: number };

export const getCategoriesWithCount = async () => {
  try {
    const [catRes, prodRes] = await Promise.all([
      supabase.from("categories").select("id, name, description, image_url, sort_order, is_active").eq("is_active", true).order("sort_order"),
      supabase.from("products").select("category_id").eq("is_active", true)
    ]);
    if (catRes.error) throw catRes.error;
    if (prodRes.error) throw prodRes.error;

    const countMap = prodRes.data.reduce<Record<string, number>>((acc, p) => {
      if (p.category_id) acc[p.category_id] = (acc[p.category_id]?? 0) + 1;
      return acc;
    }, {});

    return {
      data: catRes.data.map(c => ({...c, productsCount: countMap[c.id]?? 0 })),
      error: null,
    };
  } catch (err) {
    return { data: [] as CategoryWithCount[], error: err };
  }
};

// =========================================
// Products
// =========================================
type GetProductsParams = { categoryId?: string; query?: string; limit?: number; };

export const getProducts = async ({ categoryId, query, limit }: GetProductsParams = {}) => {
  try {
    let q = supabase.from("products")
     .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured, created_at")
     .eq("is_active", true).order("created_at", { ascending: false });
    if (categoryId) q = q.eq("category_id", categoryId);
    if (query) q = q.ilike("name", `%${query}%`);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const getFeaturedProducts = async () => {
  const { data, error } = await supabase.from("products")
   .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
   .eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false });
  return { data, error };
};

export const getProductById = async ({ id }: { id: string }) => {
  const { data, error } = await supabase.from("products")
   .select("id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured")
   .eq("id", id).single();
  return { data, error };
};

// =========================================
// Favorites
// =========================================
export const getFavorites = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };
  const { data, error } = await supabase.from("favorites").select("id, product_id, products(*)").eq("user_id", user.id);
  return { data, error };
};

export const isProductFavorite = async ({ productId }: { productId: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: false, error: null };
  const { data, error } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
  if (error) throw error;
  return { data:!!data, error: null };
};

export const addFavorite = async ({ productId }: { productId: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { error } = await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
  if (error) throw error;
  return { success: true, error: null };
};

export const removeFavorite = async ({ productId }: { productId: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
  if (error) throw error;
  return { success: true, error: null };
};

// =========================================
// Delivery Options
// =========================================

export type DeliveryOption = {
  id: string;
  label: string;
  time: string;
  fee: number;
};

// =========================================
// Addresses
// =========================================
export const getAddresses = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };
  const { data, error } = await supabase.from("customer_addresses")
   .select("id, label, full_name, phone, address_line, street, building_number, floor, apartment, city, area, notes, is_default, latitude, longitude, created_at")
   .eq("user_id", user.id).order("is_default", { ascending: false });
  return { data, error };
};

type AddAddressParams = {
  label: string; fullName: string; phone: string; addressLine: string;
  street: string; buildingNumber?: string | null; floor?: string | null;
  apartment?: string | null; city?: string | null; area: string;
  notes?: string | null; latitude: number; longitude: number;
};

export const addAddress = async (params: AddAddressParams) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { error } = await supabase.from("customer_addresses").insert({
    user_id: user.id, label: params.label, full_name: params.fullName,
    phone: params.phone, address_line: params.addressLine, street: params.street,
    building_number: params.buildingNumber || null, floor: params.floor || null,
    apartment: params.apartment || null, city: params.city || "Cairo", area: params.area,
    notes: params.notes || null, latitude: params.latitude, longitude: params.longitude,
    is_default: false,
  });
  if (error) throw error;
  return { success: true, error: null };
};

export const deleteAddress = async ({ id }: { id: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { error } = await supabase.from("customer_addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  return { success: true, error: null };
};

// =========================================
// Orders - SECURE VERSION
// =========================================
export const getOrders = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };
  const { data, error } = await supabase.from("orders")
   .select("id, status, payment_method, subtotal, delivery_fee, discount_amount, total, customer_note, created_at, address_id")
   .eq("user_id", user.id).order("created_at", { ascending: false });
  return { data, error };
};

export const getOrderById = async ({ id }: { id: string }) => {
  const { data: order, error: orderError } = await supabase.from("orders")
   .select("id, status, payment_method, subtotal, delivery_fee, discount_amount, total, customer_note, created_at, address_id, driver_id, profiles!orders_driver_id_fkey(full_name, phone)")
   .eq("id", id).single();
  if (orderError) throw orderError;

  const { data: items, error: itemsError } = await supabase.from("order_items")
   .select("id, product_id, product_name, unit_price, quantity, line_total").eq("order_id", id);
  if (itemsError) throw itemsError;

  return { order, items, error: null };
};

export const createSecureOrder = async (params: {
  address_id: string;
  payment_method: string;
  customer_note?: string;
  coupon_code?: string;
  items: { product_id: string; quantity: number }[];
}) => {
  const { data, error } = await supabase.rpc('create_secure_order', {
    p_address_id: params.address_id,
    p_payment_method: params.payment_method,
    p_customer_note: params.customer_note || null,
    p_coupon_code: params.coupon_code || null,
    p_items: params.items
  });
  if (error) throw error;
  return data;
};

export const getOrdersCount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: 0, error: null };
  const { count, error } = await supabase.from("orders").select("id", { count: 'exact', head: true }).eq("user_id", user.id);
  return { data: count?? 0, error };
};

export const getFavoritesCount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: 0, error: null };
  const { count, error } = await supabase.from("favorites").select("id", { count: 'exact', head: true }).eq("user_id", user.id);
  return { data: count?? 0, error };
};

// =========================================
// Coupons, Delivery, Tracking
// =========================================
export const validateCoupon = async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
  const { data: coupon, error } = await supabase.from("coupons").select("*").eq("code", code.trim().toUpperCase()).eq("is_active", true).maybeSingle();
  if (error ||!coupon) return { valid: false as const, reason: "not_found" as const };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { valid: false as const, reason: "expired" as const };
  if (coupon.usage_limit!== null && coupon.times_used >= coupon.usage_limit) return { valid: false as const, reason: "limit_reached" as const };
  if (orderTotal < (coupon.min_order_amount?? 0)) return { valid: false as const, reason: "min_order" as const };

  let discount = coupon.discount_type === "percentage"? (orderTotal * coupon.discount_value) / 100 : coupon.discount_value;
  if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  discount = Math.min(discount, orderTotal);
  return { valid: true as const, discountAmount: Math.round(discount * 100) / 100, coupon: { id: coupon.id, code: coupon.code } };
};

export const getAllDeliveryZones = async () => {
  const { data, error } = await supabase.from("delivery_zones").select("id, name, price, is_active").eq("is_active", true);
  if (error ||!data?.length) {
    return { data: [{ id: "standard", label: "Standard", time: "1-2h", fee: 30 }], error: null };
  }
  return { data: data.map(z => ({ id: z.id, label: z.name, time: "1-2 hours", fee: z.price })), error: null };
};

export const subscribeToOrderStatus = (orderId: string, cb: (status: string) => void) => {
  const channel = supabase.channel(`order-status-${orderId}`)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
      cb((payload.new as any).status);
    }).subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const subscribeToDriverLocation = (driverId: string, cb: (loc: any) => void) => {
  const channel = supabase.channel(`driver-${driverId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driverId}` }, (payload) => {
      const loc = payload.new as any;
      if (loc?.latitude && loc?.longitude) cb({ latitude: loc.latitude, longitude: loc.longitude });
    }).subscribe();
  return () => { supabase.removeChannel(channel); };
};

// =========================================
// NEW - Profile / Notifications / Support / Payment
// =========================================

export const getNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };
  const { data, error } = await supabase
   .from('notifications')
   .select('*')
   .eq('user_id', user.id)
   .order('created_at', { ascending: false });
  if (error) throw error;
  return { data: data || [], error: null };
}

export const markNotificationRead = async ({ id }: { id: string }) => {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
  return { success: true, error: null };
}

// overload for direct call markNotificationRead(id)
export const markNotificationReadById = async (id: string) => {
  return markNotificationRead({ id });
}

export const createSupportTicket = async (subject: string, message: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    customer_id: user.id,
    subject,
    description: message,
    message,
    category: 'general',
    priority: 'medium',
    status: 'open'
  });
  if (error) throw error;
  return { success: true, error: null };
}

export const getPaymentMethods = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };
  const { data, error } = await supabase.from('payment_methods').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) throw error;
  return { data: data || [], error: null };
}

export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { data, error };
}

export const updateProfile = async ({ full_name }: { full_name: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { error } = await supabase.from('profiles').update({ full_name }).eq('id', user.id);
  if (error) throw error;
  return { success: true, error: null };
}