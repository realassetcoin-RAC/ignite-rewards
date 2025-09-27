# RAC Rewards Platform - Application Stack & Development Guidelines

## 📋 **Table of Contents**
1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Development Guidelines](#development-guidelines)
4. [Security Best Practices](#security-best-practices)
5. [Code Standards](#code-standards)
6. [Database Guidelines](#database-guidelines)
7. [API Design](#api-design)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Guidelines](#deployment-guidelines)
10. [Performance Optimization](#performance-optimization)

---

## 🛠️ **Technology Stack**

### **Frontend**
- **Framework**: React 18+ with TypeScript
- **Meta Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS 3+
- **UI Components**: Shadcn/ui + Radix UI
- **State Management**: React Context + useState/useReducer
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns
- **QR Codes**: qrcode library

### **Backend**
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL 15+
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions
- **API**: RESTful APIs with Supabase

### **Web3 Integration**
- **Wallet Connection**: Phantom, Solflare, Backpack (Solana wallets)
- **Blockchain**: Solana (Primary blockchain)
- **Smart Contracts**: Anchor Framework (Rust)
- **NFT Standards**: Metaplex NFT Standard, SPL Token
- **Minting**: Candy Machine v3
- **Token Standards**: SPL Token (Solana's native standard)
- **DEX Integration**: Jupiter (Solana DEX aggregator)

### **Development Tools**
- **Package Manager**: Bun (preferred) or npm
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged
- **Environment**: dotenv for environment variables

### **Deployment**
- **Frontend**: Vercel (preferred) or Netlify
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Sentry

---

## 📁 **Project Structure**

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── admin/                    # Admin dashboard
│   ├── merchant/                 # Merchant dashboard
│   ├── user/                     # User dashboard
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components (Shadcn)
│   ├── forms/                    # Form components
│   ├── admin/                    # Admin-specific components
│   ├── merchant/                 # Merchant-specific components
│   ├── user/                     # User-specific components
│   └── common/                   # Shared components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client configuration
│   ├── utils.ts                  # General utilities
│   ├── validations.ts            # Zod schemas
│   └── constants.ts              # Application constants
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── styles/                       # Additional styles
└── integrations/                 # External service integrations
    ├── supabase/
    ├── web3/
    └── payment/
```

### **Component Organization**

```typescript
// Component file structure
components/
├── ComponentName/
│   ├── index.tsx                 # Main component
│   ├── ComponentName.types.ts    # Type definitions
│   ├── ComponentName.styles.ts   # Styled components (if needed)
│   └── ComponentName.test.tsx    # Unit tests
```

### **File Naming Conventions**
- **Components**: PascalCase (e.g., `UserDashboard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useUserData.ts`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Types**: PascalCase with 'Types' suffix (e.g., `UserTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

---

## 📝 **Development Guidelines**

### **Code Organization**

#### **Component Structure**
```typescript
// 1. Imports (external libraries first, then internal)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// 2. Type definitions
interface ComponentProps {
  userId: string;
  onUpdate: (data: any) => void;
}

// 3. Component implementation
export const ComponentName: React.FC<ComponentProps> = ({
  userId,
  onUpdate
}) => {
  // 4. State declarations
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [userId]);

  // 6. Event handlers
  const handleSubmit = async () => {
    // Handler logic
  };

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

#### **Custom Hooks**
```typescript
// hooks/useUserData.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserData = (userId: string) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setUser(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return { user, loading, error };
};
```

### **Error Handling**

#### **Component Error Boundaries**
```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### **API Error Handling**
```typescript
// lib/api.ts
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.code === 'PGRST116') {
    return 'No data found';
  }
  
  if (error.code === '23505') {
    return 'Duplicate entry';
  }
  
  return error.message || 'An unexpected error occurred';
};
```

---

## 🔒 **Security Best Practices**

### **Authentication & Authorization**

#### **Row Level Security (RLS)**
```sql
-- Example RLS policy
CREATE POLICY "Users can view their own data" ON public.user_data
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON public.user_data
FOR UPDATE USING (auth.uid() = user_id);
```

#### **Input Validation**
```typescript
// lib/validations.ts
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(18, 'Must be at least 18 years old')
});

export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};
```

#### **SQL Injection Prevention**
```typescript
// Always use parameterized queries
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId) // Safe parameterized query
  .single();

// Never do this:
// .select(`* FROM users WHERE id = '${userId}'`) // Vulnerable to SQL injection
```

### **Data Protection**

#### **Sensitive Data Encryption**
```typescript
// lib/encryption.ts
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

#### **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_encryption_key
```

---

## 🎨 **Code Standards**

### **TypeScript Guidelines**

#### **Strict Type Checking**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### **Type Definitions**
```typescript
// types/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  avatar_url?: string;
  bio?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}
```

### **React Best Practices**

#### **Component Props**
```typescript
// Use interfaces for props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Use default props
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}) => {
  // Component implementation
};
```

#### **State Management**
```typescript
// Use useState for simple state
const [count, setCount] = useState(0);

// Use useReducer for complex state
const [state, dispatch] = useReducer(reducer, initialState);

// Use custom hooks for shared logic
const { user, loading, error } = useUserData(userId);
```

---

## 🗄️ **Database Guidelines**

### **Schema Design**

#### **Table Naming**
```sql
-- Use snake_case for table names
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Column Naming**
```sql
-- Use snake_case for column names
-- Use descriptive names
-- Include timestamps for audit trails
CREATE TABLE public.asset_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    asset_initiative_id UUID NOT NULL,
    investment_amount NUMERIC(18, 8) NOT NULL,
    currency_type TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes and Performance**

#### **Index Strategy**
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_asset_investments_user_id ON public.asset_investments(user_id);
CREATE INDEX idx_asset_investments_status ON public.asset_investments(status);
CREATE INDEX idx_asset_investments_created_at ON public.asset_investments(created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_user_investments_user_status ON public.asset_investments(user_id, status);
```

#### **Query Optimization**
```typescript
// Use select to limit returned columns
const { data } = await supabase
  .from('users')
  .select('id, name, email') // Only select needed columns
  .eq('active', true);

// Use pagination for large datasets
const { data } = await supabase
  .from('transactions')
  .select('*')
  .range(0, 49) // First 50 records
  .order('created_at', { ascending: false });
```

---

## 🔌 **API Design**

### **RESTful API Standards**

#### **Endpoint Naming**
```typescript
// Use nouns, not verbs
GET    /api/users              // Get all users
GET    /api/users/:id          // Get specific user
POST   /api/users              // Create user
PUT    /api/users/:id          // Update user
DELETE /api/users/:id          // Delete user

// Use query parameters for filtering
GET    /api/investments?user_id=123&status=active
```

#### **Response Format**
```typescript
// Success response
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User created successfully"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### **Error Handling**

#### **HTTP Status Codes**
```typescript
// Use appropriate status codes
200 OK          // Successful GET, PUT, PATCH
201 Created     // Successful POST
204 No Content  // Successful DELETE
400 Bad Request // Client error
401 Unauthorized // Authentication required
403 Forbidden   // Insufficient permissions
404 Not Found   // Resource not found
500 Internal Server Error // Server error
```

---

## 🧪 **Testing Strategy**

### **Unit Testing**
```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### **Integration Testing**
```typescript
// tests/integration/user-flow.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserDashboard } from '@/components/UserDashboard';

describe('User Investment Flow', () => {
  it('allows user to invest in asset initiative', async () => {
    render(<UserDashboard userId="test-user" />);
    
    // Find and click invest button
    const investButton = screen.getByText('Invest Now');
    fireEvent.click(investButton);
    
    // Fill investment form
    const amountInput = screen.getByLabelText('Investment Amount');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    // Submit form
    const submitButton = screen.getByText('Confirm Investment');
    fireEvent.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Investment successful')).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 **Deployment Guidelines**

### **Environment Configuration**

#### **Environment Variables**
```bash
# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Staging
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
```

#### **Build Configuration**
```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### **Performance Optimization**

#### **Code Splitting**
```typescript
// Use dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

#### **Image Optimization**
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/user-avatar.jpg"
  alt="User Avatar"
  width={100}
  height={100}
  priority // For above-the-fold images
/>
```

---

## 📊 **Performance Monitoring**

### **Core Web Vitals**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### **Monitoring Tools**
```typescript
// lib/analytics.ts
export const trackEvent = (eventName: string, properties?: any) => {
  if (typeof window !== 'undefined') {
    // Track with analytics service
    analytics.track(eventName, properties);
  }
};

// Usage in components
const handleInvestment = async () => {
  try {
    await executeInvestment();
    trackEvent('investment_completed', {
      amount: investmentAmount,
      currency: selectedCurrency,
      asset_initiative: selectedInitiative.id
    });
  } catch (error) {
    trackEvent('investment_failed', {
      error: error.message,
      amount: investmentAmount
    });
  }
};
```

---

## 🔄 **Development Workflow**

### **Git Workflow**
```bash
# Feature branch workflow
git checkout -b feature/new-investment-flow
git add .
git commit -m "feat: add Web3 investment interface"
git push origin feature/new-investment-flow

# Create pull request
# Code review
# Merge to main
```

### **Commit Message Convention**
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

---

*This document serves as the comprehensive development guide for the RAC Rewards Platform. All developers should follow these guidelines to ensure code quality, security, and maintainability.*
