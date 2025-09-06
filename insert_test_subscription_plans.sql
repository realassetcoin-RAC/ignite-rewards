-- Insert test subscription plans for merchant signup modal
-- This ensures there are plans available when testing the "Join as merchant" functionality

-- Insert default subscription plans if they don't exist
INSERT INTO public.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Starter', 'Perfect for small businesses getting started', 29.99, '["Up to 100 customers", "Basic analytics", "Email support", "Standard integration", "Mobile app access"]'::jsonb, 30, true),
  ('Professional', 'Advanced features for growing businesses', 99.99, '["Up to 1,000 customers", "Advanced analytics", "Priority support", "Custom branding", "API access", "Multi-location support"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 299.99, '["Unlimited customers", "Full analytics suite", "24/7 dedicated support", "White-label solution", "Advanced API", "Custom integrations", "Dedicated account manager"]'::jsonb, 30, true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features,
  trial_days = EXCLUDED.trial_days,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verify the plans were inserted
SELECT 
  name, 
  description, 
  price_monthly, 
  features, 
  trial_days, 
  is_active,
  created_at
FROM public.merchant_subscription_plans 
WHERE is_active = true 
ORDER BY price_monthly ASC;
