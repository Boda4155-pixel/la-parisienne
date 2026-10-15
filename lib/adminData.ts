import { supabase } from "./supabase";

// ===========================================
// Types
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

export type CreateStoreHourInput = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open?: boolean;
};

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

export type CreateDeliveryZoneInput = {
  name: string;
  name_en: string | null;
  name_fr: string | null;
  name_ar: string | null;
  price: number;
  is_active?: boolean;
};

export type AdminSupportContact = {
  id: string;
  phone: string;
  label: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSupportContactInput = {
  phone: string;
  label?: string | null;
  is_primary?: boolean;
};

export type LowStockProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
  category_id: string | null;
  is_active: boolean;
};

export type RecentOrder = {
  id: string;
  status: string;
  payment_method: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
};

// ===========================================
// Store Hours (CRUD via anon client — RLS-protected)
// ===========================================

export const getAllStoreHours = async (): Promise<AdminStoreHour[]> => {
  const { data, error } = await supabase
    .from("store_hours")
    .select("*")
    .order("day_of_week", { ascending: true });

  if (error) throw error;
  return data ?? [];
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

export const updateStoreHour = async (id: string, input: Partial<CreateStoreHourInput>): Promise<AdminStoreHour> => {
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

// ===========================================
// Delivery Zones (CRUD via anon client — RLS-protected)
// ===========================================

export const getAllDeliveryZones = async (): Promise<AdminDeliveryZone[]> => {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
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

export const updateDeliveryZone = async (id: string, input: Partial<CreateDeliveryZoneInput>): Promise<AdminDeliveryZone> => {
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

// ===========================================
// Support Contacts (CRUD via anon client — RLS-protected)
// ===========================================

export const getAllSupportContacts = async (): Promise<AdminSupportContact[]> => {
  const { data, error } = await supabase
    .from("support_contacts")
    .select("*")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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

export const updateSupportContact = async (id: string, input: Partial<CreateSupportContactInput>): Promise<AdminSupportContact> => {
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
