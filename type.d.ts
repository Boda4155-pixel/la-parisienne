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
