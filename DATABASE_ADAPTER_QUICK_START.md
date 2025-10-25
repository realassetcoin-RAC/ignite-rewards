# 🚀 Database Adapter - Quick Start Guide

## ✅ **What Changed**

All database connections now use **ONE single client** through `databaseAdapter.ts`.

---

## 📋 **How to Use Database in Your Code**

### **Option 1: Standard Import (Recommended)**

```typescript
import { supabase } from '@/integrations/supabase/client';

// Use it normally
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

### **Option 2: Direct Adapter Import**

```typescript
import { databaseAdapter } from '@/lib/databaseAdapter';

// Use the adapter
const { data, error } = await databaseAdapter.supabase
  .from('profiles')
  .select('*');

// Or use direct methods
const result = await databaseAdapter.from('profiles').select('*');
```

### **Option 3: Named Export**

```typescript
import { supabase } from '@/lib/databaseAdapter';

// Same as Option 1, just different import path
const { data } = await supabase.from('profiles').select('*');
```

---

## ⚡ **Quick Examples**

### Query Data
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data: users, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(10);
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert({ 
    full_name: 'John Doe',
    email: 'john@example.com'
  });
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ full_name: 'Jane Doe' })
  .eq('id', userId);
```

### Delete Data
```typescript
const { error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', userId);
```

### Authentication
```typescript
const { data: { user }, error } = await supabase.auth.getUser();

const { data, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Storage
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file);
```

### RPC (Database Functions)
```typescript
const { data, error } = await supabase
  .rpc('my_function', { 
    param1: 'value1' 
  });
```

---

## ❌ **What NOT to Do**

### Don't Import from Old Clients
```typescript
// ❌ DON'T DO THIS
import { supabase } from '@/lib/smartSupabaseClient';
import { supabase } from '@/lib/localSupabaseClient';
import { cloudClient } from '@/lib/supabaseDebugClient';
```

### Don't Create Your Own Client
```typescript
// ❌ DON'T DO THIS
import { createClient } from '@supabase/supabase-js';
const myClient = createClient(url, key);
```

---

## 🔧 **Configuration**

### Environment Variables (env.local)

```env
# Supabase Cloud Configuration
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Settings
VITE_APP_ENV=development
VITE_APP_DEBUG=true
```

**That's it!** The DatabaseAdapter handles everything else.

---

## 🐛 **Troubleshooting**

### Problem: Getting "client is null" errors

**Solution:**
```typescript
// Check if client is initialized
import { databaseAdapter } from '@/lib/databaseAdapter';
console.log('Client ready:', !!databaseAdapter.supabaseClient);
```

### Problem: Connection timeouts

**Solution:**
1. Check `env.local` has correct Supabase URL
2. Verify internet connection
3. Check browser console for errors

### Problem: Old imports not working

**Solution:**
```typescript
// Replace this:
import { supabase } from '@/lib/oldClient';

// With this:
import { supabase } from '@/integrations/supabase/client';
```

---

## 📊 **Benefits**

| Before | After |
|--------|-------|
| 6+ different clients | 1 single client ✅ |
| Duplicate connections | 1 connection instance ✅ |
| Inconsistent behavior | Consistent everywhere ✅ |
| Hard to debug | Easy to monitor ✅ |
| Slow & unstable | Fast & reliable ✅ |

---

## 🎯 **Key Takeaways**

1. **Always import from**: `@/integrations/supabase/client`
2. **Never create** your own Supabase client
3. **Use the adapter** for all database operations
4. **Check env.local** if you have connection issues

---

## 📚 **More Information**

- Full documentation: `DATABASE_ADAPTER_CONSOLIDATION.md`
- Stability fixes: `DATABASE_CONNECTION_STABILITY_FIX.md`
- Adapter source: `src/lib/databaseAdapter.ts`

---

**Last Updated**: September 30, 2025
**Status**: ✅ Active

