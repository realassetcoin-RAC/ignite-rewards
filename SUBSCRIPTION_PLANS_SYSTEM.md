# Merchant Subscription Plans System

## Overview

This document describes the comprehensive subscription plans system for merchants, including validity dates, yearly pricing, and admin management capabilities.

## Features Implemented

### 1. Database Schema Updates

**New Columns Added to `merchant_subscription_plans` table:**
- `price_yearly` - Yearly subscription price
- `monthly_points` - Number of points allocated per month
- `monthly_transactions` - Number of transactions allowed per month
- `valid_from` - Plan becomes available from this date (NULL = immediate)
- `valid_until` - Plan expires after this date (NULL = no expiration)
- `popular` - Whether this plan is marked as popular/recommended
- `plan_number` - Display order number for the plan

### 2. Subscription Plans Available

Based on the provided table, the following 5 plans have been implemented:

| Plan # | Name | Monthly Price | Yearly Price | Monthly Points | Monthly Transactions |
|--------|------|---------------|--------------|----------------|---------------------|
| 1 | StartUp | $20 | $150 | 100 | 100 |
| 2 | Momentum Plan | $50 | $500 | 300 | 300 |
| 3 | Energizer Plan | $100 | $1000 | 600 | 600 |
| 4 | Cloud9 Plan | $250 | $2500 | 1800 | 1800 |
| 5 | Super Plan | $500 | $5000 | 4000 | 4000 |

### 3. Validity Date System

**How it works:**
- Plans with `valid_from` set to a future date will not be displayed until that date
- Plans with `valid_until` set to a past date will not be displayed after expiration
- Plans with both fields NULL are always available
- The system automatically filters out expired or not-yet-available plans

**Database Functions:**
- `get_valid_subscription_plans()` - Returns only currently valid plans
- `is_plan_valid(plan_id)` - Checks if a specific plan is currently valid

### 4. Updated Merchant Signup Modal

**New Features:**
- Billing period toggle (Monthly/Yearly)
- Displays both monthly and yearly pricing
- Shows monthly points and transactions allocation
- Automatically filters plans by validity dates
- Shows savings percentage for yearly billing

**UI Improvements:**
- Clean billing period selector with "Save 25%" badge for yearly
- Enhanced plan cards showing all relevant information
- Responsive design for mobile and desktop

### 5. Admin Management Interface

**Enhanced SubscriptionPlanManager:**
- Create new subscription plans with all fields
- Edit existing plans including validity dates
- Set yearly pricing and monthly allocations
- Mark plans as popular/recommended
- Set plan display order
- Manage validity periods

**Admin Features:**
- Comprehensive form with all new fields
- Date/time pickers for validity periods
- Real-time validation
- Bulk operations support

## Database Migration

### Files Created:
1. `supabase/migrations/20250115000003_add_subscription_plan_validity_dates.sql`
2. `insert_merchant_subscription_plans.sql`
3. `apply_subscription_plans_migration.sql`

### Migration Steps:
1. Add new columns to existing table
2. Create indexes for performance
3. Update RLS policies for validity filtering
4. Create helper functions
5. Insert the 5 subscription plans

## Security & Access Control

### Row Level Security (RLS) Policies:
- **Public Access**: Anyone can view active, valid plans
- **Admin Access**: Admins can view, create, update, and delete all plans
- **Validity Filtering**: Expired or future plans are automatically hidden

### Function Security:
- All functions use `SECURITY DEFINER` for controlled access
- Proper permissions granted to authenticated and anonymous users

## Usage Instructions

### For Merchants:
1. Click "Sign up as Merchant" on the home page
2. Choose between Monthly or Yearly billing
3. Select from available subscription plans
4. Plans are automatically filtered by validity dates
5. Complete business information and sign up

### For Admins:
1. Access the Admin Dashboard
2. Navigate to "Subscription Plans" section
3. Create new plans or edit existing ones
4. Set validity dates to control plan availability
5. Mark plans as popular for highlighting
6. Set yearly pricing and monthly allocations

## Testing

### Test Script:
- `test_subscription_plans.js` - Comprehensive test script
- Tests table structure, functions, and data integrity
- Verifies validity date filtering
- Checks pricing and allocation display

### Manual Testing:
1. Apply the migration SQL to your database
2. Run the test script to verify functionality
3. Test the merchant signup flow
4. Test admin plan management
5. Verify validity date filtering works correctly

## Future Enhancements

### Potential Improvements:
1. **Plan Templates**: Pre-defined plan templates for quick creation
2. **Bulk Operations**: Import/export plans via CSV
3. **Analytics**: Track plan popularity and conversion rates
4. **A/B Testing**: Test different plan configurations
5. **Dynamic Pricing**: Time-based pricing adjustments
6. **Plan Upgrades**: Allow merchants to upgrade/downgrade plans
7. **Usage Tracking**: Monitor actual usage vs. allocated limits

### Integration Points:
1. **Payment Processing**: Integrate with Stripe for subscription billing
2. **Email Notifications**: Notify merchants of plan changes
3. **Usage Monitoring**: Track points and transaction usage
4. **Reporting**: Generate plan performance reports

## Troubleshooting

### Common Issues:
1. **Migration Errors**: Ensure database permissions are correct
2. **Function Not Found**: Run the migration SQL manually
3. **RLS Policy Issues**: Check user roles and permissions
4. **Date Formatting**: Ensure proper timezone handling

### Support:
- Check database logs for detailed error messages
- Verify RLS policies are correctly applied
- Test with different user roles (admin, merchant, anonymous)
- Use the test script to identify specific issues

## Conclusion

The subscription plans system provides a comprehensive solution for managing merchant subscriptions with:
- ✅ Validity date management
- ✅ Yearly pricing options
- ✅ Monthly points and transaction limits
- ✅ Admin management interface
- ✅ Automatic plan filtering
- ✅ Security and access control
- ✅ Responsive user interface

The system is ready for production use and can be easily extended with additional features as needed.
