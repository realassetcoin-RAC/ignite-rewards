# PostgreSQL Setup Guide for Ignite Rewards

## Prerequisites
- Windows 10
- Administrator privileges

## Step 1: Install PostgreSQL

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 16.x Windows x86-64 installer

2. **Install PostgreSQL:**
   - Run the installer as Administrator
   - **Important Settings:**
     - Password: Choose a strong password (e.g., `postgres123!`)
     - Port: 5432 (default)
     - Locale: Default
     - Install pgAdmin 4: ✅ Yes
     - Install Stack Builder: ✅ Yes

3. **Verify Installation:**
   - PostgreSQL service should start automatically
   - pgAdmin 4 available at: `http://localhost/pgadmin4`
   - Default login: `postgres` / `[your password]`

## Step 2: Setup Database

### Option A: Using pgAdmin 4 (GUI)
1. Open pgAdmin 4 in your browser: `http://localhost/pgadmin4`
2. Login with `postgres` / `[your password]`
3. Right-click "Databases" → "Create" → "Database"
4. Name: `ignite_rewards`
5. Click "Save"

### Option B: Using Command Line
1. Open Command Prompt as Administrator
2. Navigate to PostgreSQL bin directory:
   ```cmd
   cd "C:\Program Files\PostgreSQL\16\bin"
   ```
3. Create database:
   ```cmd
   createdb -U postgres ignite_rewards
   ```

## Step 3: Run Setup Scripts

### Using pgAdmin 4:
1. In pgAdmin 4, expand "ignite_rewards" database
2. Right-click "ignite_rewards" → "Query Tool"
3. Copy and paste the contents of `setup_local_database.sql`
4. Click "Execute" (F5)
5. Repeat for `run_migrations.sql`

### Using Command Line:
```cmd
cd "C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -d ignite_rewards -f "D:\RAC Rewards Repo\ignite-rewards\setup_local_database.sql"
psql -U postgres -d ignite_rewards -f "D:\RAC Rewards Repo\ignite-rewards\run_migrations.sql"
```

## Step 4: Verify Setup

Run this query in pgAdmin 4 or psql to verify everything is working:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if admin user exists
SELECT * FROM auth.users WHERE role = 'admin';

-- Check if NFT types were created
SELECT * FROM public.nft_types;

-- Check if subscription plans exist
SELECT * FROM public.merchant_subscription_plans;
```

## Step 5: Configure Your Application

### Database Connection String:
```
postgresql://postgres:postgres123!@localhost:5432/ignite_rewards
```

### Environment Variables:
```env
DATABASE_URL=postgresql://postgres:postgres123!@localhost:5432/ignite_rewards
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ignite_rewards
DB_USER=postgres
DB_PASSWORD=postgres123!
```

## Step 6: Test Connection

### Using Node.js/JavaScript:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ignite_rewards',
  password: 'postgres123!',
  port: 5432,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connected successfully:', res.rows[0]);
  }
  pool.end();
});
```

### Using Python:
```python
import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        database="ignite_rewards",
        user="postgres",
        password="postgres123!"
    )
    print("Connected successfully!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
```

## Troubleshooting

### Common Issues:

1. **"psql is not recognized"**
   - Add PostgreSQL bin directory to PATH:
     - `C:\Program Files\PostgreSQL\16\bin`

2. **"Connection refused"**
   - Check if PostgreSQL service is running:
     - Services → PostgreSQL 16 → Start

3. **"Authentication failed"**
   - Verify password in `pg_hba.conf`
   - Reset password if needed

4. **"Database does not exist"**
   - Create database first:
     ```sql
     CREATE DATABASE ignite_rewards;
     ```

### Useful Commands:

```cmd
# Check PostgreSQL version
psql --version

# Connect to database
psql -U postgres -d ignite_rewards

# List all databases
psql -U postgres -l

# Backup database
pg_dump -U postgres ignite_rewards > backup.sql

# Restore database
psql -U postgres ignite_rewards < backup.sql
```

## Next Steps

1. **Run Additional Migrations:**
   - Apply any remaining SQL files from your project
   - Check for any custom migrations in `supabase/migrations/`

2. **Setup Test Data:**
   - Insert sample merchants, users, and transactions
   - Test your application's database operations

3. **Configure Application:**
   - Update your app's database connection settings
   - Test API endpoints that interact with the database

4. **Setup Development Environment:**
   - Configure your IDE to connect to the database
   - Set up database debugging tools

## Security Notes

- Change default passwords in production
- Configure firewall rules for database access
- Use SSL connections in production
- Regularly backup your database
- Monitor database performance and logs
