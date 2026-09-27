import { Category } from "../type";
import { supabaseAdmin } from "./supabaseAdmin";

// =========================================
// Categories
// =========================================

export const getCategories = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id, name, description, image_url, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("getCategories error:", error);
      return { data: [] as Category[], error };
    }

    return { data, error: null };
  } catch (err) {
    console.error("getCategories exception:", err);
    return { data: [] as Category[], error: { message: "Something went wrong" } };
  }
};

export type CategoryWithCount = Category & {
  productsCount: number;
};

export const getCategoriesWithCount = async (): Promise<
  { data: CategoryWithCount[]; error: any }
> => {
  try {
    const categoriesPromise = supabaseAdmin
      .from("categories")
      .select("id, name, description, image_url, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const productsPromise = supabaseAdmin
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

    return {
      data: categories.map((category) => ({
        ...category,
        productsCount: countMap[category.id] ?? 0,
      })),
      error: null,
    };
  } catch (err) {
    console.error("getCategoriesWithCount exception:", err);
    return { data: [] as CategoryWithCount[], error: { message: "Something went wrong" } };
  }
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
  try {
    let request = supabaseAdmin
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

    return { data: data as any, error: null };
  } catch (err: any) {
    console.error("getProducts exception:", err);
    return { data: null, error: err };
  }
};

export const getFeaturedProducts = async () => {
  try {
    const { data, error } = await supabaseAdmin
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

    return { data: data as any, error: null };
  } catch (err: any) {
    console.error("getFeaturedProducts exception:", err);
    return { data: null, error: err };
  }
};

export const getProductById = async ({ id }: { id: string }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, category_id, name, description, image_url, price, stock_quantity, is_active, is_featured",
      )
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return { data: data as any, error: null };
  } catch (err: any) {
    console.error("getProductById exception:", err);
    return { data: null, error: err };
  }
};

// =========================================
// Favorites
// =========================================

export const getFavorites = async ({ userId }: { userId: string }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("favorites")
      .select("id, product_id, products(*)")
      .eq("user_id", userId);
    if (error) {
      throw error;
    }

    return { data: data as any, error: null };
  } catch (err: any) {
    console.error("getFavorites exception:", err);
    return { data: null, error: err };
  }
};

export const isProductFavorite = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data: !!data, error: null };
  } catch (err: any) {
    console.error("isProductFavorite exception:", err);
    return { data: false, error: err };
  }
};

export const addFavorite = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  try {
    const { error } = await supabaseAdmin
      .from("favorites")
      .insert({ user_id: userId, product_id: productId });

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("addFavorite exception:", err);
    return { success: false, error: err };
  }
};

export const removeFavorite = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  try {
    const { error } = await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("removeFavorite exception:", err);
    return { success: false, error: err };
  }
};

// =========================================
// Addresses
// =========================================

export const getAddresses = async ({ userId }: { userId: string }) => {
  try {
    const { data, error } = await supabaseAdmin
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

    return { data: data as any, error: null };
  } catch (err: any) {
    console.error("getAddresses exception:", err);
    return { data: null, error: err };
  }
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
  try {
    const { error } = await supabaseAdmin.from("customer_addresses").insert({
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

    return { success: true, error: null, data: { userId, label, fullName, phone, addressLine, street, buildingNumber, floor, apartment, city, area, notes, latitude, longitude } };
  } catch (err: any) {
    console.error("addAddress exception:", err);
    return { success: false, error: err };
  }
};

export const deleteAddress = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  try {
    const { error } = await supabaseAdmin
      .from("customer_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("deleteAddress exception:", err);
    return { success: false, error: err };
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
  try {
    // Insert order
    const { data: order, error: orderError } = await supabaseAdmin
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

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.unitPrice * item.quantity,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order we just created
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    // Increment coupon usage
    if (couponId) {
      // Note: incrementCouponUsage would need to be updated to use supabaseAdmin too
      // For now, we'll just continue without it
    }

    return { success: true, error: null, data: { order, itemsError: null } };
  } catch (err: any) {
    console.error("createOrder exception:", err);
    return { success: false, error: err, data: null };
  }
};
export const getOrders = async ({ userId }: { userId: string }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, status, payment_method, subtotal, delivery_fee, discount_amount, driver_id, total, customer_note, created_at, address_id",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }

    return { data: data as any, error: null };
  } catch (err: any) {
    console.error("getOrders exception:", err);
    return { data: null, error: err };
  }
};

export const getOrderById = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
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

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("id, product_id, product_name, unit_price, quantity, line_total")
      .eq("order_id", id);

    if (itemsError) {
      throw itemsError;
    }

    return { order, items, error: null };
  } catch (err: any) {
    console.error("getOrderById exception:", err);
    return { order: null, items: null, error: err };
  }
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

export const getPendingOrders = async (): Promise<{
  data: PendingOrder[];
  error: any;
}> => {
  try {
    const { data: orders, error: ordersError } = await supabaseAdmin
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
      return { data: [], error: null };
    }

    // Join with customer_addresses and profiles for customer info
    const ordersWithCustomers = await Promise.all(
      orders.map(async (order) => {
        let customerName: string | null = null;
        let customerPhone: string | null = null;
        let customerEmail: string | null = null;

        if (order.address_id) {
          const { data: address } = await supabaseAdmin
            .from("customer_addresses")
            .select("user_id, phone")
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

    return { data: ordersWithCustomers, error: null };
  } catch (err: any) {
    console.error("getPendingOrders exception:", err);
    return { data: [], error: err };
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      throw error;
    }
  } catch (err: any) {
    console.error("updateOrderStatus exception:", err);
    throw err;
  }
};

export const toggleProductActive = async (
  productId: string,
  isActive: boolean,
): Promise<{ success: boolean; error: any }> => {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: isActive })
      .eq("id", productId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("toggleProductActive exception:", err);
    return { success: false, error: err };
  }
};

export type TodayOrder = {
  id: string;
  status: string;
  payment_method: string;
  total: number;
  created_at: string;
};

export const getTodayOrders = async (): Promise<{
  data: TodayOrder[];
  error: any;
}> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_method, total, created_at")
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error };
    }

    return { data: data ?? [], error: null };
  } catch (err: any) {
    console.error("getTodayOrders exception:", err);
    return { data: [], error: err };
  }
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
  try {
    const { data: coupon, error } = await supabaseAdmin
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
  } catch (err: any) {
    console.error("validateCoupon exception:", err);
    return { valid: false, reason: "not_found" };
  }
};

export const incrementCouponUsage = async ({ id }: { id: string }) => {
  try {
    const { error } = await supabaseAdmin.rpc("increment_coupon_usage", {
      coupon_id: id,
    });

    if (error) {
      console.error("Failed to increment coupon usage:", error);
    }
  } catch (err: any) {
    console.error("incrementCouponUsage exception:", err);
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
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
      })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("updateProfile exception:", err);
    return { success: false, error: err };
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

export const getAllDeliveryZones = async (): Promise<{
  data: DeliveryOption[];
  error: any;
}> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("delivery_zones")
      .select("id, name, price, is_active");

    if (error) {
      throw error;
    }

    // Default zones if none configured
    if (!data || data.length === 0) {
      return {
        data: [
          { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
          { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
          { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
        ],
        error: null,
      };
    }

    // Build zones from database, keeping defaults as fallbacks
    const zones: Record<string, DeliveryOption> = {
      standard: { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
      express: { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
      pickup: { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
    };

    data.forEach((zone) => {
      if (zone.name && zone.price >= 0) {
        const fee = zone.price ?? (zone.id === "standard" ? 30 : zone.id === "express" ? 50 : 0);
        zones[zone.id ?? `zone_${zone.id}`] = {
          id: zone.id ?? `zone_${zone.id}`,
          label: zone.name,
          time: "1 - 2 hours",
          fee,
        };
      }
    });

    return {
      data: Object.values(zones),
      error: null,
    };
  } catch (err: any) {
    console.error("getAllDeliveryZones exception:", err);
    return {
      data: [
        { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
        { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
        { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
      ],
      error: err,
    };
  }
};

export const DELIVERY_OPTIONS = async (): Promise<{
  data: DeliveryOption[];
  error: any;
}> => {
  try {
    const result = await getAllDeliveryZones();
    return result;
  } catch {
    return {
      data: [
        { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
        { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
        { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
      ],
      error: null,
    };
  }
};

// =========================================
// Driver Tracking
// =========================================

export const getDriverLocation = async ({ driverId }: { driverId: string }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("driver_locations")
      .select("latitude, longitude, updated_at")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data: data as any, error: null };
  } catch (err: any) {
    console.error("getDriverLocation exception:", err);
    return { data: null, error: err };
  }
};

export const subscribeToDriverLocation = (
  driverId: string,
  onUpdate: (location: { latitude: number; longitude: number }) => void,
) => {
  const channel = supabaseAdmin
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
    supabaseAdmin.removeChannel(channel);
  };
};

export const subscribeToOrderStatus = (
  orderId: string,
  onUpdate: (status: string) => void,
) => {
  const channel = supabaseAdmin
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
    supabaseAdmin.removeChannel(channel);
  };
};

export const getOrdersCount = async ({ userId }: { userId: string }) => {
  try {
    const { count, error } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return { data: count ?? 0, error: null };
  } catch (err: any) {
    console.error("getOrdersCount exception:", err);
    return { data: 0, error: err };
  }
};

export const getFavoritesCount = async ({ userId }: { userId: string }) => {
  try {
    const { count, error } = await supabaseAdmin
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return { data: count ?? 0, error: null };
  } catch (err: any) {
    console.error("getFavoritesCount exception:", err);
    return { data: 0, error: err };
  }
};
