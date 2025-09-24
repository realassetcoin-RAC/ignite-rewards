# JSONB Features Field Structure and Usage

## Overview
The `features` field in the `merchant_subscription_plans` table is a **JSONB** (JSON Binary) field that stores an array of strings representing the features included in each subscription plan.

## Database Schema
```sql
features JSONB DEFAULT '[]'::jsonb
```

## Data Structure

### 1. **Storage Format (JSONB)**
The features are stored as a JSON array of strings:

```json
[
  "Basic loyalty program setup",
  "Up to 100 monthly points", 
  "100 transactions per month",
  "Email support",
  "Basic analytics"
]
```

### 2. **Example Data for Each Plan**

#### StartUp Plan (Plan 1)
```json
[
  "Basic loyalty program setup",
  "Up to 100 monthly points",
  "100 transactions per month", 
  "Email support",
  "Basic analytics"
]
```

#### Momentum Plan (Plan 2) - Popular
```json
[
  "Advanced loyalty program features",
  "Up to 300 monthly points",
  "300 transactions per month",
  "Priority email support", 
  "Advanced analytics",
  "Custom branding",
  "API access"
]
```

#### Energizer Plan (Plan 3)
```json
[
  "Premium loyalty program features",
  "Up to 600 monthly points",
  "600 transactions per month",
  "Phone & email support",
  "Premium analytics", 
  "Full branding customization",
  "Full API access",
  "Multi-location support",
  "Advanced reporting"
]
```

#### Cloud9 Plan (Plan 4)
```json
[
  "Enterprise loyalty program features",
  "Up to 1800 monthly points", 
  "1800 transactions per month",
  "Dedicated account manager",
  "Enterprise analytics",
  "White-label solution",
  "Full API & webhook access",
  "Unlimited locations",
  "Advanced reporting & insights",
  "Custom integrations",
  "24/7 priority support"
]
```

#### Super Plan (Plan 5)
```json
[
  "Unlimited loyalty program features",
  "Up to 4000 monthly points",
  "4000 transactions per month", 
  "Dedicated success team",
  "Enterprise-grade analytics",
  "Complete white-label solution",
  "Unlimited API access",
  "Global multi-location support",
  "Advanced AI insights",
  "Custom development",
  "Unlimited integrations",
  "24/7 dedicated support",
  "SLA guarantee"
]
```

## Code Implementation

### 1. **Database Insert/Update**
```javascript
// When saving to database
const planData = {
  name: "StartUp",
  features: JSON.stringify([
    "Basic loyalty program setup",
    "Up to 100 monthly points",
    "100 transactions per month",
    "Email support", 
    "Basic analytics"
  ])
};

// Direct SQL insert
INSERT INTO merchant_subscription_plans (name, features) 
VALUES ('StartUp', '["Basic loyalty program setup", "Up to 100 monthly points"]'::jsonb);
```

### 2. **Frontend Processing**
```javascript
// In SubscriptionPlanManager.tsx
const updatePlan = async (plan) => {
  const planData = {
    // ... other fields
    features: plan.features ? JSON.stringify(plan.features) : "[]",
    // ... other fields
  };
  
  await supabase
    .from('merchant_subscription_plans')
    .update(planData)
    .eq('id', plan.id);
};
```

### 3. **Data Conversion in MerchantSignupModal**
```javascript
// Converting features from database to display format
const convertedPlans = data.map((plan) => {
  let featuresArray = [];
  
  if (plan.features && typeof plan.features === 'object') {
    // Handle object format (legacy)
    featuresArray = Object.entries(plan.features)
      .filter(([key, value]) => value === true)
      .map(([key, value]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  } else if (Array.isArray(plan.features)) {
    // Handle array format (current)
    featuresArray = plan.features;
  }
  
  return {
    ...plan,
    features: featuresArray
  };
});
```

### 4. **UI Rendering**
```jsx
// In MerchantDashboard.tsx
{merchant.subscription_plan.features && 
 Array.isArray(merchant.subscription_plan.features) && 
 merchant.subscription_plan.features.length > 0 && (
  <div className="pt-2">
    <h4 className="text-sm font-medium mb-2">Plan Features</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {merchant.subscription_plan.features.map((feature, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <span className="text-sm text-muted-foreground">{feature}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

### 5. **Subscription Plans Display**
```jsx
// In SubscriptionPlans.tsx
<ul className="space-y-1">
  {plan.features.slice(0, 4).map((feature, index) => (
    <li key={index} className="flex items-center text-sm text-muted-foreground">
      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
      <span>{feature}</span>
    </li>
  ))}
  {plan.features.length > 4 && (
    <li className="text-xs text-muted-foreground">
      +{plan.features.length - 4} more features
    </li>
  )}
</ul>
```

## Benefits of JSONB

### 1. **Flexibility**
- Can store variable number of features per plan
- Easy to add/remove features without schema changes
- Supports complex nested data if needed in future

### 2. **Performance**
- JSONB is indexed and optimized for queries
- Faster than storing as separate table with joins
- Supports JSON operators for filtering

### 3. **Query Capabilities**
```sql
-- Find plans with specific features
SELECT * FROM merchant_subscription_plans 
WHERE features @> '["API access"]';

-- Find plans with multiple features
SELECT * FROM merchant_subscription_plans 
WHERE features @> '["API access", "Custom branding"]';

-- Count features per plan
SELECT name, jsonb_array_length(features) as feature_count 
FROM merchant_subscription_plans;
```

### 4. **Type Safety**
- PostgreSQL validates JSON structure
- Prevents invalid data insertion
- Maintains data integrity

## Current Usage Patterns

1. **Admin Interface**: Features are edited as JSON array strings
2. **Merchant Signup**: Features are displayed as bullet points
3. **Dashboard**: Features are shown in plan overview
4. **Subscription Management**: Features are listed for comparison

The JSONB approach provides a clean, flexible, and performant way to store and manage subscription plan features while maintaining type safety and query capabilities.
