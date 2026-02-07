-- ============================================
-- Products, Customers, Orders tables setup
-- ============================================
-- Usage:
-- 1) Open Supabase Dashboard
-- 2) SQL Editor -> New query
-- 3) Paste this file and Run
-- ============================================

-- Products table
DO $$
BEGIN
  CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_kr TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT NOT NULL,
  damage INTEGER NOT NULL,
  fire_rate INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pistol', 'explosive', 'melee', 'blade', 'launcher', 'crossbow')),
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  lore TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'products table already exists, skipping create.';
END $$;

CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Customers table
DO $$
BEGIN
  CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'customers table already exists, skipping create.';
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Orders table
DO $$
BEGIN
  CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'orders table already exists, skipping create.';
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- updated_at auto-update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies for products (public read)
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  USING (true);

-- Policies for customers (owner-only)
DROP POLICY IF EXISTS "Users can view their own customer profile" ON customers;
CREATE POLICY "Users can view their own customer profile"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own customer profile" ON customers;
CREATE POLICY "Users can insert their own customer profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own customer profile" ON customers;
CREATE POLICY "Users can update their own customer profile"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for orders (owner-only)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Done
-- ============================================

