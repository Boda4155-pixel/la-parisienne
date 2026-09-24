-- Migration: Add localized name columns to delivery_zones table
-- Run this in Supabase SQL editor to enable multi-language zone names

-- Add localized name columns
ALTER TABLE public.delivery_zones
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_fr TEXT,
  ADD COLUMN IF NOT EXISTS name_ar TEXT;

-- Backfill existing data: copy current 'name' into name_en as default for backward compatibility
UPDATE public.delivery_zones
SET name_en = name
WHERE name_en IS NULL AND name IS NOT NULL;

-- Create indexes for efficient lookups in customer app
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name_en ON public.delivery_zones(name_en);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name_fr ON public.delivery_zones(name_fr);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name_ar ON public.delivery_zones(name_ar);

-- Comment on the table for clarity
COMMENT ON TABLE public.delivery_zones IS 'Delivery zones with localized names (EN/FR/AR) and price';

-- ===========================================
-- USAGE NOTES:
-- ===========================================
-- Admin Settings page will allow entering name_en, name_fr, name_ar for each zone
-- Customer checkout will display the zone name matching the current i18n locale:
--   - locale 'en' -> name_en
--   - locale 'fr' -> name_fr
--   - locale 'ar' -> name_ar
-- Fallback to name (original) if localized name is missing
-- ===========================================