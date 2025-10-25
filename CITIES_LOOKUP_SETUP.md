# Cities Lookup Table Setup

This document explains how to set up the cities lookup table for the merchant signup form.

## Overview

The cities lookup table replaces the external API Ninjas service with a local Supabase database table containing comprehensive city and country data. This provides:

- **Faster response times** - No external API calls
- **Better reliability** - No dependency on external services
- **Cost savings** - No API usage fees
- **Customizable data** - You can add/modify cities as needed

## Database Structure

### `cities_lookup` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `city_name` | VARCHAR(255) | Name of the city |
| `country_name` | VARCHAR(255) | Name of the country |
| `country_code` | VARCHAR(3) | ISO country code |
| `state_province` | VARCHAR(255) | State or province |
| `population` | BIGINT | City population |
| `is_capital` | BOOLEAN | Whether the city is a capital |
| `latitude` | DECIMAL(10,8) | Latitude coordinate |
| `longitude` | DECIMAL(11,8) | Longitude coordinate |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Record update time |

### `search_cities` Function

A PostgreSQL function that searches cities by:
- City name (exact match gets priority)
- Country name
- State/province name

Returns results ordered by relevance and population.

## Setup Instructions

### Option 1: Using Supabase CLI (Recommended)

1. **Ensure you're in your project root directory**
   ```bash
   cd D:\RAC Rewards Repo\ignite-rewards
   ```

2. **Run the setup script**
   
   **For Windows:**
   ```cmd
   setup_cities_lookup.bat
   ```
   
   **For Linux/Mac:**
   ```bash
   chmod +x setup_cities_lookup.sh
   ./setup_cities_lookup.sh
   ```

### Option 2: Manual Setup

1. **Open Supabase Dashboard**
   - Go to your project at https://supabase.com/dashboard
   - Navigate to SQL Editor

2. **Run the SQL Script**
   - Copy the contents of `apply_cities_lookup.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

### Option 3: Using Supabase CLI Commands

```bash
# Link to your project (if not already linked)
supabase link --project-ref wndswqvqogeblksrujpg

# Apply the migration
supabase db push
```

## Data Included

The cities lookup table includes **100+ major cities** from:

- **North America**: US, Canada, Mexico
- **Europe**: UK, France, Germany, Spain, Italy, Netherlands, etc.
- **Asia**: Japan, China, India, South Korea, Thailand, Singapore, etc.
- **Oceania**: Australia, New Zealand
- **South America**: Brazil, Argentina, Peru, Colombia, Chile, etc.
- **Africa**: Egypt, Nigeria, South Africa, Kenya, Morocco, etc.

## How It Works

1. **User types in city field** (minimum 2 characters)
2. **Form calls `search_cities` function** via Supabase RPC
3. **Function searches** city name, country, and state/province
4. **Results are returned** ordered by relevance and population
5. **User selects from dropdown** suggestions
6. **Form populates** both city and country fields

## Customization

### Adding More Cities

To add more cities, insert into the `cities_lookup` table:

```sql
INSERT INTO cities_lookup (city_name, country_name, country_code, state_province, population, is_capital, latitude, longitude) 
VALUES 
('Your City', 'Your Country', 'COU', 'State/Province', 100000, false, 40.7128, -74.0060);
```

### Modifying Search Behavior

Edit the `search_cities` function to change:
- Search criteria
- Result ordering
- Return fields
- Limit count

## Benefits

✅ **No API Key Required** - No need for VITE_API_NINJAS_KEY  
✅ **Faster Performance** - Local database queries  
✅ **Better Reliability** - No external service dependencies  
✅ **Cost Effective** - No API usage fees  
✅ **Customizable** - Add/modify cities as needed  
✅ **Offline Capable** - Works without internet (for database queries)  

## Troubleshooting

### Common Issues

1. **"Function search_cities does not exist"**
   - Ensure the SQL script ran completely
   - Check that the function was created in the `public` schema

2. **"Permission denied for table cities_lookup"**
   - Verify RLS policies are set correctly
   - Check that `anon` and `authenticated` roles have SELECT permission

3. **No search results**
   - Verify data was inserted into the table
   - Check the search function is working: `SELECT * FROM search_cities('New York', 5);`

### Verification Queries

```sql
-- Check if table exists
SELECT COUNT(*) FROM cities_lookup;

-- Test search function
SELECT * FROM search_cities('New York', 5);

-- Check permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'cities_lookup';
```

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your database connection
3. Ensure all SQL scripts ran successfully
4. Check the browser console for any JavaScript errors

