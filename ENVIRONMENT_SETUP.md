# Environment Setup Guide

This application supports multiple environments with automatic database switching:

## 🌍 Environments

### 1. **Development** (Local PostgreSQL)
- **Database**: Local PostgreSQL instance
- **Configuration**: `.env.local` with local database credentials
- **Features**: Debug mode, mock authentication, test data
- **Setup**: `node setup-environment.js development`

### 2. **UAT** (Supabase)
- **Database**: Supabase cloud database
- **Configuration**: `.env.local` with Supabase credentials
- **Features**: Production-like testing environment
- **Setup**: `node setup-environment.js uat`

### 3. **Production** (Supabase)
- **Database**: Supabase cloud database
- **Configuration**: `.env.local` with production Supabase credentials
- **Features**: Full production environment
- **Setup**: `node setup-environment.js production`

## 🔧 Quick Setup

### For Development (Local PostgreSQL):
```bash
# 1. Setup environment
node setup-environment.js development

# 2. Start development server
npm run dev
```

### For UAT (Supabase):
```bash
# 1. Setup environment
node setup-environment.js uat

# 2. Update Supabase credentials in .env.local
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# 3. Start development server
npm run dev
```

## 📁 Environment Files

- **`.env.local`**: Main environment configuration (auto-generated)
- **`src/config/environment.ts`**: Environment detection logic
- **`src/lib/databaseAdapter.ts`**: Database switching logic

## 🔄 Database Adapter

The application automatically switches between databases based on environment:

- **Development**: Uses local PostgreSQL with mock fallback
- **UAT/Production**: Uses Supabase client

## 🚀 Features by Environment

| Feature | Development | UAT | Production |
|---------|-------------|-----|------------|
| Local PostgreSQL | ✅ | ❌ | ❌ |
| Supabase | ❌ | ✅ | ✅ |
| Debug Mode | ✅ | ❌ | ❌ |
| Mock Auth | ✅ | ❌ | ❌ |
| Test Data | ✅ | ❌ | ❌ |
| Debug Panel | ✅ | ❌ | ❌ |

## 🛠️ Troubleshooting

### "supabase is not defined" errors:
1. Ensure `.env.local` is properly configured
2. Check that `VITE_APP_ENV=development` for local development
3. Restart the development server after environment changes

### Database connection issues:
1. **Local**: Ensure PostgreSQL is running and credentials are correct
2. **Supabase**: Verify URL and API key are valid

### Environment switching:
1. Run the appropriate setup script
2. Restart the development server
3. Clear browser cache if needed

## 📝 Notes

- The database adapter provides a Supabase-compatible interface
- Local development falls back to mock mode if PostgreSQL is unavailable
- Environment detection is automatic based on configuration
- All database operations are logged in development mode
