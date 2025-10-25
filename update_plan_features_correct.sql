-- Update merchant subscription plan features to match product specifications

-- StartUp Plan
UPDATE public.merchant_subscription_plans
SET features = ARRAY[
  '100 Points limit for distribution',
  '100 Transactions limit for distribution',
  '1 Email (Registered Signup Email) account can access',
  'Merchant Dashboard with Standard Analytics',
  'Email and Chat Support'
]::text[]
WHERE plan_name = 'StartUp';

-- Momentum Plan
UPDATE public.merchant_subscription_plans
SET features = ARRAY[
  '300 Points limit for distribution',
  '300 Transactions limit for distribution',
  '2 Email (Registered Signup Email) account can access',
  'Merchant Dashboard with Standard Analytics',
  'Email and Chat Support'
]::text[]
WHERE plan_name = 'Momentum';

-- Energizer Plan
UPDATE public.merchant_subscription_plans
SET features = ARRAY[
  '600 Points limit for distribution',
  '600 Transactions limit for distribution',
  '3 Email (Registered Signup Email) account can access',
  'Merchant Dashboard with Advanced Analytics',
  'Email and Chat Support'
]::text[]
WHERE plan_name = 'Energizer';

-- Cloud Plan
UPDATE public.merchant_subscription_plans
SET features = ARRAY[
  '1800 Points limit for distribution',
  '1800 Transactions limit for distribution',
  '5 Email (Registered Signup Email) account can access',
  'Merchant Dashboard with Advanced Analytics',
  'Priority Email and Chat Support 24/7'
]::text[]
WHERE plan_name = 'Cloud';

-- Super Plan
UPDATE public.merchant_subscription_plans
SET features = ARRAY[
  '4000 Points limit for distribution',
  '4000 Transactions limit for distribution',
  'Unlimited Email (Registered Signup Email) account can access',
  'Merchant Dashboard with Custom Analytics',
  'Dedicated Account Manager, Priority Email and Chat Support 24/7'
]::text[]
WHERE plan_name = 'Super';

-- Verify the updates
SELECT 
  plan_name,
  price,
  features
FROM public.merchant_subscription_plans
ORDER BY price ASC;
