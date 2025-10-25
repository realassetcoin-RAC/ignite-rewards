# Environment Setup Guide

## Required Environment Variables

This application requires environment variables to be configured before running. The environment variables are loaded from a `.env` file in the root directory.

### Creating Your .env File

If you don't have a `.env` file, you'll see this error:
```
Uncaught Error: Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### Quick Setup

Create a `.env` file in the root directory with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA

# Application Environment
VITE_APP_ENV=development
VITE_APP_DEBUG=false
VITE_ENABLE_DEBUG_PANEL=false
VITE_ENABLE_TEST_DATA=false
VITE_ENABLE_MOCK_AUTH=false

# Solana Configuration
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet

# Admin Configuration (Optional)
# VITE_ADMIN_EMAIL=admin@example.com
# VITE_ADMIN_PASSWORD=your_password_here
```

### Required Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (public key)

### Optional Variables

- `VITE_APP_ENV`: Application environment (development, uat, production)
- `VITE_APP_DEBUG`: Enable debug logging (true/false)
- `VITE_ENABLE_DEBUG_PANEL`: Show debug panel in UI (true/false)
- `VITE_ENABLE_TEST_DATA`: Enable test data generation (true/false)
- `VITE_ENABLE_MOCK_AUTH`: Enable mock authentication (true/false)
- `VITE_SOLANA_RPC_URL`: Solana RPC endpoint
- `VITE_SOLANA_NETWORK`: Solana network (devnet, testnet, mainnet-beta)

### After Creating .env File

1. **Restart your development server** - Environment variables are loaded at build/start time
2. Stop your current dev server (Ctrl+C)
3. Start it again:
   ```bash
   npm run dev
   # or
   bun dev
   ```

### Security Notes

⚠️ **Important**: The `.env` file is excluded from git (via `.gitignore`) to prevent sensitive credentials from being committed.

- Never commit `.env` files to version control
- The `VITE_SUPABASE_ANON_KEY` is the public anonymous key and is safe to use in client-side code
- Never put service role keys or private keys in the `.env` file for frontend applications

### Troubleshooting

If you still see environment variable errors after creating the `.env` file:

1. Make sure the `.env` file is in the **root directory** of the project
2. Make sure there are no syntax errors in the `.env` file
3. Make sure you've **restarted** your development server
4. Check that your `.env` file doesn't have a different extension (like `.env.txt`)
5. Verify the file encoding is UTF-8 (not UTF-16 or other encodings)

### Validating Your Setup

The application automatically validates environment variables on startup. If you see this error:
- `Missing required environment variables: ...` - Add the missing variables to your `.env` file
- `Supabase URL does not appear to be valid` - Check your VITE_SUPABASE_URL format
- `Supabase anon key does not appear to be a valid JWT token` - Check your VITE_SUPABASE_ANON_KEY format

### Environment Files by Stage

- `.env` - Local development (gitignored)
- `.env.local` - Local overrides (gitignored, highest priority)
- `.env.production` - Production build configuration (can be committed)
- `.env.example` - Template file showing required variables (committed to git)

