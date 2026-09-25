import { Category } from "../type";
import { supabase } from "./supabase";

// =========================================
// Categories
// =========================================

export const getCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, image_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

export type CategoryWithCount = Category & {
  productsCount: number;
};

export const getCategoriesWithCount = async (): Promise<
  CategoryWithCount[]
> => {
  const categoriesPromise = supabase
    .from("categories")
    .select("id, name, description, image_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const productsPromise = supabase
    .from("products")
    .select("category_id")
    .eq("is_active", true);

  const [categoriesResult, productsResult] = await Promise.all([
    categoriesPromise,
    productsPromise,
  ]);

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  if (productsResult.error) {
    throw productsResult.error;
  }

  const categories = categoriesResult.data;
  const products = productsResult.data;

  const countMap = products.reduce<Record<string, number>>((acc, product) => {
    if (product.category_id) {
      acc[product.category_id] = (acc[product.category_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  return categories.map((category) => ({
    ...category,
    productsCount: countMap[category.id] ?? 0,
  }));
};

// =========================================
// Products
// =========================================

type GetProductsParams = {
  categoryId?: string;
  query?: string;
  limit?: number;
};

export const getProducts = async ({
  categoryId,
  query,
  limit,
}: GetProductsParams = {}) => {
  let request = supabase
    .from("products")
    .select(
      "id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured, created_at",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (categoryId) {
    request = request.eq("category_id", categoryId);
  }

  if (query) {
    request = request.ilike("name", `%${query}%`);
  }

  if (limit) {
    request = request.limit(limit);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return data;
};

export const getFeaturedProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured",
    )
    .eq("is_active", true)
    .eq("is_featured", false)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }

  return data;
};

export const getProductById = async ({ id }: { id: string }) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured",
    )
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// =========================================
// Favorites
// =========================================

export const getFavorites = async ({ userId }: { userId: string }) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("id, product_id, products(*)")
    .eq("user_id", userId);
  if (error) {
    throw error;
  }

  return data;
};

export const isProductFavorite = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
};

export const addFavorite = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, product_id: productId });

  if (error) {
    throw error;
  }
};

export const removeFavorite = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    throw error;
  }
};

// =========================================
// Addresses
// =========================================

export const getAddresses = async ({ userId }: { userId: string }) => {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select(
      "id, label, full_name, phone, address_line, street, building_number, floor, apartment, city, area, notes, is_default, latitude, longitude, created_at",
    )
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

type AddAddressParams = {
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  street: string;
  buildingNumber?: string | null;
  floor?: string | null;
  apartment?: string | null;
  city?: string | null;
  area: string;
  notes?: string | null;
  latitude: number;
  longitude: number;
};

export const addAddress = async ({
  userId,
  label,
  fullName,
  phone,
  addressLine,
  street,
  buildingNumber,
  floor,
  apartment,
  city,
  area,
  notes,
  latitude,
  longitude,
}: AddAddressParams) => {
  const { error } = await supabase.from("customer_addresses").insert({
    user_id: userId,
    label,
    full_name: fullName,
    phone,
    address_line: addressLine,
    street,
    building_number: buildingNumber || null,
    floor: floor || null,
    apartment: apartment || null,
    city: city || "abo",
    area,
    notes: notes || null,
    latitude,
    longitude,
    is_default: false,
  });

  if (error) {
    throw error;
  }
};

export const deleteAddress = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

// =========================================
// Orders
// =========================================

type CreateOrderParams = {
  userId: string;
  addressId: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  couponCode?: string | null;
  couponId?: string | null;
  total: number;
  customerNote?: string | null;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
};

export const createOrder = async ({
  userId,
  addressId,
  paymentMethod,
  subtotal,
  deliveryFee,
  discountAmount = 0,
  couponCode,
  couponId,
  total,
  customerNote,
  items,
}: CreateOrderParams) => {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      address_id: addressId,
      payment_method: paymentMethod,
      status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      // coupon_code: couponCode || null,
      total,
      customer_note: customerNote || null,
    })
    .select("id")
    .single();

  if (orderError) {
    throw orderError;
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    line_total: item.unitPrice * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw itemsError;
  }

  if (couponId) {
    await incrementCouponUsage({ id: couponId });
  }

  return order;
};
export const getOrders = async ({ userId }: { userId: string }) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, subtotal, delivery_fee, discount_amount, driver_id, total, customer_note, created_at, address_id",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }

  return data;
};

export const getOrderById = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, subtotal, delivery_fee, discount_amount, coupon_code, driver_id, total, customer_note, created_at, address_id",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (orderError) {
    throw orderError;
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, product_id, product_name, unit_price, quantity, line_total")
    .eq("order_id", id);

  if (itemsError) {
    throw itemsError;
  }

  return { order, items };
};

// =========================================
// Cashier Queries
// =========================================

type PendingOrder = {
  id: string;
  status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  customer_note: string | null;
  created_at: string;
  address_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
};

export const getPendingOrders = async (): Promise<PendingOrder[]> => {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, subtotal, delivery_fee, discount_amount, total, customer_note, created_at, address_id",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw ordersError;
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  // Join with customer_addresses and profiles for customer info
  const ordersWithCustomers = await Promise.all(
    orders.map(async (order) => {
      let customerName: string | null = null;
      let customerPhone: string | null = null;
      let customerEmail: string | null = null;

      if (order.address_id) {
        const { data: address } = await supabase
          .from("customer_addresses")
          .select("user_id, phone")
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
        customerPhone = address?.phone ?? null;
      }

      return {
        ...order,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
      };
    }),
  );

  return ordersWithCustomers;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
): Promise<void> => {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    throw error;
  }
};

export const toggleProductActive = async (
  productId: string,
  isActive: boolean,
): Promise<void> => {
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) {
    throw error;
  }
};

export type TodayOrder = {
  id: string;
  status: string;
  payment_method: string;
  total: number;
  created_at: string;
};

export const getTodayOrders = async (): Promise<TodayOrder[]> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, payment_method, total, created_at")
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

// =========================================
// Coupons
// =========================================

export type CouponValidationResult =
  | {
      valid: true;
      discountAmount: number;
      coupon: { id: string; code: string };
    }
  | {
      valid: false;
      reason:
        "not_found" | "expired" | "inactive" | "limit_reached" | "min_order";
    };

export const validateCoupon = async ({
  code,
  orderTotal,
}: {
  code: string;
  orderTotal: number;
}): Promise<CouponValidationResult> => {
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error || !coupon) {
    return { valid: false, reason: "not_found" };
  }

  if (!coupon.is_active) {
    return { valid: false, reason: "inactive" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, reason: "expired" };
  }

  if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
    return { valid: false, reason: "limit_reached" };
  }

  if (orderTotal < (coupon.min_order_amount ?? 0)) {
    return { valid: false, reason: "min_order" };
  }

  let discountAmount =
    coupon.discount_type === "percentage"
      ? (orderTotal * coupon.discount_value) / 100
      : coupon.discount_value;

  if (coupon.max_discount) {
    discountAmount = Math.min(discountAmount, coupon.max_discount);
  }

  discountAmount = Math.min(discountAmount, orderTotal);

  return {
    valid: true,
    discountAmount: Math.round(discountAmount * 100) / 100,
    coupon: { id: coupon.id, code: coupon.code },
  };
};

export const incrementCouponUsage = async ({ id }: { id: string }) => {
  const { error } = await supabase.rpc("increment_coupon_usage", {
    coupon_id: id,
  });

  if (error) {
    console.error("Failed to increment coupon usage:", error);
  }
};

// =========================================
// Profile
// =========================================

type UpdateProfileParams = {
  userId: string;
  fullName: string;
  phone?: string | null;
};

export const updateProfile = async ({
  userId,
  fullName,
  phone,
}: UpdateProfileParams) => {
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
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

export const getAllDeliveryZones = async (): Promise<DeliveryOption[]> => {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, name, price, is_active");

  if (error) throw error;

  // Default zones if none configured
  if (!data || data.length === 0) {
    return [
      { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
      { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
      { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
    ];
  }

  // Build zones from database, keeping defaults as fallbacks
  const zones: Record<string, DeliveryOption> = {
    standard: { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
    express: { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
    pickup: { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
  };

  data.forEach((zone) => {
    if (zone.name && zone.price >= 0) {
      // Use zone name as key, fallback to defaults for missing fields
      const fee = zone.price ?? (zone.id === "standard" ? 30 : zone.id === "express" ? 50 : 0);
      zones[zone.id ?? `zone_${zone.id}`] = {
        id: zone.id ?? `zone_${zone.id}`,
        label: zone.name,
        time: "1 - 2 hours", // default time
        fee,
      };
    }
  });

  return Object.values(zones);
};

export const DELIVERY_OPTIONS = async (): Promise<DeliveryOption[]> => {
  try {
    return await getAllDeliveryZones();
  } catch {
    // Fallback to defaults if Supabase is unavailable
    return [
      { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
      { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
      { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
    ];
  }
};

// =========================================
// Driver Tracking
// =========================================

export const getDriverLocation = async ({ driverId }: { driverId: string }) => {
  const { data, error } = await supabase
    .from("driver_locations")
    .select("latitude, longitude, updated_at")
    .eq("driver_id", driverId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const subscribeToDriverLocation = (
  driverId: string,
  onUpdate: (location: { latitude: number; longitude: number }) => void,
) => {
  const channel = supabase
    .channel(`driver-location-${driverId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "driver_locations",
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        const row = payload.new as {
          latitude: number;
          longitude: number;
        };
        onUpdate({ latitude: row.latitude, longitude: row.longitude });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToOrderStatus = (
  orderId: string,
  onUpdate: (status: string) => void,
) => {
  const channel = supabase
    .channel(`order-status-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        onUpdate((payload.new as { status: string }).status);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getOrdersCount = async ({ userId }: { userId: string }) => {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

export const getFavoritesCount = async ({ userId }: { userId: string }) => {
  const { count, error } = await supabase
    .from("favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
};
