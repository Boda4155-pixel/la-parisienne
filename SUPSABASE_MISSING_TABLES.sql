-- ===========================================
-- MISSING TABLES FOR ADMIN PANEL
-- Run these migrations in Supabase SQL editor
-- ===========================================

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. REVIEWS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- ===========================================
-- 2. PAYMENTS TABLE (detailed payment records)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    method TEXT NOT NULL, -- cash, card, wallet
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    transaction_id TEXT, -- external payment gateway ID
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- ===========================================
-- 3. STAFF ROLES TABLE (alternative approach: extend profiles)
-- Instead of separate tables, we can keep using profiles with role field
-- But ensure we have proper indexes for staff queries
-- ===========================================

-- Indexes for staff role queries (cashier, delivery, admin)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON public.profiles(role) WHERE is_active = TRUE;

-- ===========================================
-- 4. INVENTORY MOVEMENTS TRACKING (for low stock alerts)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'stock_in', 'stock_out', 'adjustment', 'sale', 'return'
    quantity_change INTEGER NOT NULL, -- positive for in, negative for out
    reference_id UUID, -- could be order_id, purchase_id, etc.
    reference_type TEXT, -- 'order', 'purchase', 'adjustment'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes for inventory movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON public.inventory_movements(movement_type);

-- ===========================================
-- 5. DISCOUNT RULES (alternative to coupons for more complex promotions)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.discount_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    applies_to TEXT[], -- array of product_ids or category_ids or 'all'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for discount_rules
CREATE INDEX IF NOT EXISTS idx_discount_rules_active ON public.discount_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_rules_dates ON public.discount_rules(starts_at, ends_at);

-- ===========================================
-- 6. SETTINGS TABLE (for app-wide configuration)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes for settings
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- ===========================================
-- 7. STORE_HOURS TABLE (NEW - Step 3)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.store_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, ..., 6=Saturday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(day_of_week)
);

-- Indexes for store_hours
CREATE INDEX IF NOT EXISTS idx_store_hours_day_of_week ON public.store_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_store_hours_is_open ON public.store_hours(is_open);

-- ===========================================
-- 8. DELIVERY_ZONES TABLE (NEW - Step 3)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- Legacy fallback name
    name_en TEXT, -- English name
    name_fr TEXT, -- French name
    name_ar TEXT, -- Arabic name
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for delivery_zones
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name ON public.delivery_zones(name);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name_en ON public.delivery_zones(name_en);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name_fr ON public.delivery_zones(name_fr);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name_ar ON public.delivery_zones(name_ar);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_is_active ON public.delivery_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_price ON public.delivery_zones(price);

-- ===========================================
-- 9. SUPPORT_CONTACTS TABLE (NEW - Step 3)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.support_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    label TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one primary support contact
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_contacts_primary ON public.support_contacts(is_primary) WHERE is_primary = TRUE;

-- Indexes for support_contacts
CREATE INDEX IF NOT EXISTS idx_support_contacts_phone ON public.support_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_support_contacts_is_primary ON public.support_contacts(is_primary);

-- ===========================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================
-- Enable RLS on all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 11. BASIC POLICIES (adjust as needed for your security model)
-- ===========================================

-- Reviews: customers can read approved reviews, admins can manage all
CREATE POLICY "Reviews are viewable by approved status" ON public.reviews
    FOR SELECT USING (is_approved = true OR auth.role() = 'service_role' OR (auth.uid() = customer_id));

CREATE POLICY "Reviews can be inserted by authenticated users" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Reviews can be updated by admins" ON public.reviews
    FOR UPDATE USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Payments: admins can read all, others cannot access directly
CREATE POLICY "Payments accessible by admins only" ON public.payments
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Inventory movements: admins can read all
CREATE POLICY "Inventory movements readable by admins" ON public.inventory_movements
    FOR SELECT USING (auth.role() = 'service_role');

-- Discount rules: admins can manage all
CREATE POLICY "Discount rules manageable by admins" ON public.discount_rules
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- App settings: admins can manage all
CREATE POLICY "App settings manageable by admins" ON public.app_settings
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Store hours: public read for customer-facing app, admins manage
CREATE POLICY "Store hours are viewable by everyone" ON public.store_hours
    FOR SELECT USING (true);

CREATE POLICY "Store hours manageable by admins" ON public.store_hours
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Delivery zones: public read for customer-facing app, admins manage
CREATE POLICY "Delivery zones are viewable by everyone" ON public.delivery_zones
    FOR SELECT USING (true);

CREATE POLICY "Delivery zones manageable by admins" ON public.delivery_zones
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Support contacts: public read for customer-facing app, admins manage
CREATE POLICY "Support contacts are viewable by everyone" ON public.support_contacts
    FOR SELECT USING (true);

CREATE POLICY "Support contacts manageable by admins" ON public.support_contacts
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- 12. UPDATE TRIGGERS for updated_at columns
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY['reviews', 'payments', 'inventory_movements', 'discount_rules', 'app_settings', 'store_hours', 'delivery_zones', 'support_contacts'];
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- ===========================================
-- 13. SAMPLE DATA FOR TESTING (optional)
-- ===========================================
-- Insert a sample review
INSERT INTO public.reviews (order_id, product_id, customer_id, rating, comment, is_approved)
SELECT
    o.id,
    p.id,
    o.user_id,
    5,
    'Excellent product! Highly recommended.',
    true
FROM public.orders o
JOIN public.order_items oi ON o.id = oi.order_id
JOIN public.products p ON oi.product_id = p.id
WHERE o.status = 'delivered'
LIMIT 1;

-- Insert a sample payment
INSERT INTO public.payments (order_id, method, amount, status, transaction_id, paid_at)
SELECT
    id,
    'card',
    total,
    'completed',
    'txn_' || id::text,
    created_at
FROM public.orders
WHERE status = 'delivered'
LIMIT 1;

-- Insert default store hours: Monday-Friday 9AM-8PM, Saturday 10AM-6PM, Sunday Closed
INSERT INTO public.store_hours (day_of_week, open_time, close_time, is_open) VALUES
(1, '09:00', '20:00', true),   -- Monday
(2, '09:00', '20:00', true),   -- Tuesday
(3, '09:00', '20:00', true),   -- Wednesday
(4, '09:00', '20:00', true),   -- Thursday
(5, '09:00', '20:00', true),   -- Friday
(6, '10:00', '18:00', true),   -- Saturday
(0, '09:00', '20:00', true);   -- Sunday (all days open by default)

-- Default delivery zones (prices in EGP) with localized names
INSERT INTO public.delivery_zones (name, name_en, name_fr, name_ar, price, is_active) VALUES
('Standard Zone', 'Standard Zone', 'Zone Standard', 'المنطقة القياسية', 30.00, true);

-- Default support contact
INSERT INTO public.support_contacts (phone, label, is_primary) VALUES
('+201001234567', 'Support Line', true);

COMMIT;