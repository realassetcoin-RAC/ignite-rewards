-- Create custom types for the application
CREATE TYPE app_role AS ENUM ('customer', 'admin', 'merchant');
CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
CREATE TYPE card_type AS ENUM ('standard', 'premium', 'enterprise');
CREATE TYPE pricing_type AS ENUM ('free', 'one_time', 'subscription');
CREATE TYPE subscription_plan AS ENUM ('basic', 'standard', 'premium', 'enterprise');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merchants table
CREATE TABLE public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  subscription_plan subscription_plan,
  status merchant_status DEFAULT 'pending',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  monthly_fee NUMERIC,
  annual_fee NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create virtual_cards table
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_name TEXT NOT NULL,
  card_type card_type NOT NULL,
  subscription_plan subscription_plan,
  pricing_type pricing_type DEFAULT 'free',
  one_time_fee NUMERIC DEFAULT 0,
  monthly_fee NUMERIC DEFAULT 0,
  annual_fee NUMERIC DEFAULT 0,
  description TEXT,
  features JSONB,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merchant_subscriptions table
CREATE TABLE public.merchant_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  amount NUMERIC,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merchant_cards table (junction table)
CREATE TABLE public.merchant_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.virtual_cards(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for merchants
CREATE POLICY "Merchants can view their own data" ON public.merchants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Merchants can update their own data" ON public.merchants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all merchants" ON public.merchants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for virtual_cards
CREATE POLICY "Everyone can view active virtual cards" ON public.virtual_cards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all virtual cards" ON public.virtual_cards
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for merchant_subscriptions
CREATE POLICY "Merchants can view their own subscriptions" ON public.merchant_subscriptions
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all subscriptions" ON public.merchant_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for merchant_cards
CREATE POLICY "Merchants can view their assigned cards" ON public.merchant_cards
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all merchant cards" ON public.merchant_cards
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_virtual_cards_updated_at
  BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for testing (optional)
INSERT INTO public.virtual_cards (card_name, card_type, pricing_type, description) VALUES
  ('Basic RAC Card', 'standard', 'free', 'Entry-level virtual card with basic features'),
  ('Premium RAC Card', 'premium', 'subscription', 'Advanced virtual card with premium features'),
  ('Enterprise RAC Card', 'enterprise', 'subscription', 'Full-featured enterprise virtual card');