-- Create enum types for card and subscription management
CREATE TYPE public.card_type AS ENUM ('rewards', 'loyalty', 'membership', 'gift');
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
CREATE TYPE public.pricing_type AS ENUM ('free', 'one_time', 'subscription');
CREATE TYPE public.merchant_status AS ENUM ('active', 'suspended', 'pending', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('admin', 'merchant', 'customer');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role app_role DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create virtual cards table
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_name TEXT NOT NULL,
  card_type card_type NOT NULL,
  description TEXT,
  image_url TEXT,
  subscription_plan subscription_plan,
  pricing_type pricing_type NOT NULL DEFAULT 'free',
  one_time_fee DECIMAL(10,2) DEFAULT 0,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  annual_fee DECIMAL(10,2) DEFAULT 0,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  monthly_fee DECIMAL(10,2),
  annual_fee DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create merchant subscriptions tracking table
CREATE TABLE public.merchant_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  amount DECIMAL(10,2),
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create card assignments to merchants table
CREATE TABLE public.merchant_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.virtual_cards(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(merchant_id, card_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_cards ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for virtual_cards
CREATE POLICY "Admins can manage all virtual cards" ON public.virtual_cards
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active virtual cards" ON public.virtual_cards
  FOR SELECT USING (is_active = true);

-- RLS Policies for merchants
CREATE POLICY "Admins can manage all merchants" ON public.merchants
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view their own data" ON public.merchants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Merchants can update their own data" ON public.merchants
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for merchant_subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON public.merchant_subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view their own subscriptions" ON public.merchant_subscriptions
  FOR SELECT USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for merchant_cards
CREATE POLICY "Admins can manage all merchant cards" ON public.merchant_cards
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view their assigned cards" ON public.merchant_cards
  FOR SELECT USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = auth.uid()
    )
  );

-- Create function to update timestamps
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

CREATE TRIGGER update_virtual_cards_updated_at
  BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();