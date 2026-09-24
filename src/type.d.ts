import { ImageSourcePropType } from "react-native";

// =========================================
// Data Models (Supabase)
// =========================================

export type Category = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean;
};

export type Product = {
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

export type Address = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_line: string;
  street: string | null;
  building_number: string | null;
  floor: string | null;
  apartment: string | null;
  city: string | null;
  area: string;
  notes: string | null;
  is_default: boolean;
  latitude: number;
  longitude: number;
};

export type Order = {
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
};

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

// =========================================
// Admin Models (Supabase)
// =========================================

export type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
};

export type Review = {
  id: string;
  order_id: string | null;
  product_id: string | null;
  customer_id: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status: string;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
};

export type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  pendingOrders: number;
  lowStockCount: number;
};

export type DashboardOrder = Order & {
  customer_name: string | null;
  customer_email: string | null;
};

export type DashboardProduct = Product & {
  units_sold: number;
  revenue: number;
};

// =========================================
// Cart
// =========================================

export type CartCustomization = {
  id: string;
  name: string;
  price: number;
  type: string;
};

export type CartItemType = {
  id: string; // product id
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  customizations?: CartCustomization[];
};

export type CartStore = {
  items: CartItemType[];
  addItem: (item: Omit<CartItemType, "quantity">) => void;
  removeItem: (id: string, customizations?: CartCustomization[]) => void;
  increaseQty: (id: string, customizations?: CartCustomization[]) => void;
  decreaseQty: (id: string, customizations?: CartCustomization[]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

// =========================================
// UI Component Props
// =========================================

export type TabBarIconProps = {
  focused: boolean;
  icon: LucideIcon;
  title: string;
};

export type PaymentInfoStripeProps = {
  label: string;
  value: string;
  labelStyle?: string;
  valueStyle?: string;
};

// =========================================
// Settings Models (Step 3)
// =========================================

export type StoreHour = {
  id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  open_time: string;
  close_time: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
};

export type DeliveryZone = {
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

export type SupportContact = {
  id: string;
  phone: string;
  label: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomButtonProps = {
  onPress?: () => void;
  title?: string;
  style?: string;
  leftIcon?: React.ReactNode;
  textStyle?: string;
  isLoading?: boolean;
};

export type CustomHeaderProps = {
  title?: string;
};

export type CustomInputProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  label: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
};

export type ProfileFieldProps = {
  label: string;
  value: string;
  icon: ImageSourcePropType;
};