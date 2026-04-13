
-- Product Variants
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name_bn TEXT NOT NULL,
  weight_value NUMERIC,
  weight_unit TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  stock_quantity INT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Product Reviews
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  rating INT DEFAULT 5,
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can create reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage reviews" ON public.product_reviews FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add missing columns to orders
ALTER TABLE public.orders ADD COLUMN steadfast_tracking_code TEXT;
ALTER TABLE public.orders ADD COLUMN steadfast_status TEXT;

-- Add missing column to incomplete_orders
ALTER TABLE public.incomplete_orders ADD COLUMN converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
