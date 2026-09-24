import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import type { AdminDeliveryZone } from "../lib/adminQueries";
import type { DeliveryOption } from "../lib/queries";
import type { StoreHour, SupportContact } from "../src/type";

export function useStoreHours() {
  const [storeHours, setStoreHours] = useState<StoreHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("store_hours")
          .select("*")
          .order("day_of_week", { ascending: true });
        if (error) throw error;
        if (!cancelled) setStoreHours(data ?? []);
      } catch {
        if (!cancelled) setStoreHours([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isOpenNow = storeHours.some(
    (h) => h.is_open && new Date().getDay() === h.day_of_week
  );

  return { data: storeHours, loading, isOpenNow };
}

export function useSupportContact() {
  const [contact, setContact] = useState<SupportContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("support_contacts")
          .select("*")
          .eq("is_primary", true)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setContact(data ?? null);
      } catch {
        if (!cancelled) setContact(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { data: contact, loading };
}

export function useStoreLocation() {
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "store_location")
          .maybeSingle();
        if (error) throw error;
        const value = data?.value as { address: string; latitude: number; longitude: number } | null;
        if (!cancelled) setLocation(value);
      } catch {
        if (!cancelled) setLocation(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { data: location, loading };
}

export function useStoreSettings() {
  const { i18n } = useTranslation();
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("delivery_zones")
          .select("id, name, name_en, name_fr, name_ar, price, is_active, created_at, updated_at")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          setOptions([
            { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
            { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
            { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
          ]);
        } else {
          const localized: DeliveryOption[] = data.map((zone: AdminDeliveryZone) => {
            // Resolve the label based on current locale, falling back to name
            const locale = i18n.language || "en";
            let label = zone.name;
            if (locale === "fr" && zone.name_fr) label = zone.name_fr;
            else if (locale === "ar" && zone.name_ar) label = zone.name_ar;
            else if (locale === "en" && zone.name_en) label = zone.name_en;

            return {
              id: zone.id,
              label,
              time: "1 - 2 hours",
              fee: zone.price ?? 30,
            };
          });
          setOptions(localized);
        }
      } catch {
        setOptions([
          { id: "standard", label: "Standard Delivery", time: "1 - 2 hours", fee: 30 },
          { id: "express", label: "Express Delivery", time: "30 - 60 min", fee: 50 },
          { id: "pickup", label: "Store Pickup", time: "Ready in 20 min", fee: 0 },
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [i18n.language]);

  return { data: options, loading };
}