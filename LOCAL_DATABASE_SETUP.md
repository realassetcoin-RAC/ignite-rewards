# Local PostgreSQL Database Setup Guide

## Prerequisites
- PostgreSQL 16 or 17 installed and running
- Node.js installed
- Access to PostgreSQL command line tools

## Step 1: Create Local Environment Configuration

Create a `.env.local` file in your project root with the following content:

```env
# Local PostgreSQL Database Configuration
LOCAL_DB_URL=postgresql://postgres:your_password@localhost:5432/rac_rewards
LOCAL_DB_KEY=local-development-key

# Supabase Configuration (for production)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/rac_rewards

# Application Configuration
NODE_ENV=development
VITE_APP_ENV=local
```

**Important:** Replace `your_password` with your actual PostgreSQL password.

## Step 2: Set Up the Database

### Option A: Using the PowerShell Script (Recommended)
```powershell
.\setup_local_db.ps1
```

### Option B: Using the Batch Script
```cmd
setup_local_db.bat
```

### Option C: Manual Setup
```bash
# Create the database
createdb rac_rewards

# Run the setup script
psql -d rac_rewards -f src/sql/setup_local_database.sql
```

## Step 3: Verify the Setup

Run the verification script:
```bash
node src/scripts/verifyLocalDatabase.js
```

## Step 4: Update Your Application Configuration

Update your Supabase client configuration to use the local database:

1. **For development**, update your `.env.local` to point to local PostgreSQL
2. **For production**, keep your Supabase configuration

## Database Schema

The setup script creates the following tables:
- `referral_campaigns` - Referral campaign management
- `user_wallets` - User wallet information
- `point_release_delays` - 30-day point release system
- `loyalty_networks` - Third-party loyalty integrations
- `asset_initiatives` - Asset/initiative selection
- `merchant_custom_nfts` - Custom NFT management
- `discount_codes` - Discount code management
- `admin_feature_controls` - Feature control system
- `loyalty_otp_codes` - OTP management
- `email_notifications` - Email notification system
- `ecommerce_webhooks` - Ecommerce integration

## Default Data

The setup includes default data for:
- 1 Referral Campaign
- 3 Loyalty Networks (Starbucks, McDonald's, Subway)
- 4 Asset Initiatives (Environment, Education, Healthcare, Community)
- 5 Feature Controls (Discount codes, Custom NFTs, Analytics, Email, API)

## Troubleshooting

### PostgreSQL Not Found
If you get "psql not found" error:
1. Add PostgreSQL bin directory to your PATH
2. Default location: `C:\Program Files\PostgreSQL\16\bin\`

### Permission Denied
If you get permission errors:
1. Make sure PostgreSQL service is running
2. Check your PostgreSQL user permissions
3. Verify your password in the connection string

### Database Already Exists
If the database already exists:
1. Drop it: `dropdb rac_rewards`
2. Recreate it: `createdb rac_rewards`
3. Run the setup script again

## Next Steps

After successful setup:
1. Start your development server: `npm run dev`
2. Test the application with local database
3. All features should work with local PostgreSQL

## Production Deployment

For production:
1. Use your Supabase configuration
2. Run the same SQL scripts in Supabase dashboard
3. Update environment variables for production
