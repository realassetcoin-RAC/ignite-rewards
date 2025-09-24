# TypeScript Type Improvement Guide

## Overview
This guide helps improve TypeScript usage by replacing `any` types with proper type definitions for better type safety and code maintainability.

## Common `any` Type Replacements

### 1. API Response Types
```typescript
// Before:
const response: any = await fetch('/api/users');

// After:
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'merchant';
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

const response: ApiResponse<User[]> = await fetch('/api/users');
```

### 2. Event Handlers
```typescript
// Before:
const handleClick = (event: any) => {
  // ...
};

// After:
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};
```

### 3. Form Data
```typescript
// Before:
const handleSubmit = (data: any) => {
  // ...
};

// After:
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const handleSubmit = (data: FormData) => {
  // ...
};
```

### 4. Generic Functions
```typescript
// Before:
function processData(data: any): any {
  return data;
}

// After:
function processData<T>(data: T): T {
  return data;
}

// Or with constraints:
function processUserData<T extends { id: string }>(data: T): T {
  return data;
}
```

### 5. Component Props
```typescript
// Before:
interface ComponentProps {
  data: any;
  onAction: (value: any) => void;
}

// After:
interface UserData {
  id: string;
  name: string;
  email: string;
}

interface ComponentProps {
  data: UserData;
  onAction: (value: UserData) => void;
}
```

### 6. State Management
```typescript
// Before:
const [state, setState] = useState<any>({});

// After:
interface AppState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const [state, setState] = useState<AppState>({
  user: null,
  loading: false,
  error: null
});
```

### 7. API Error Handling
```typescript
// Before:
const handleError = (error: any) => {
  console.error(error);
};

// After:
interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

const handleError = (error: ApiError | Error) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error.message, error.code);
  }
};
```

### 8. Configuration Objects
```typescript
// Before:
const config: any = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// After:
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
}

const config: AppConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  debug: process.env.NODE_ENV === 'development'
};
```

## Type Guards and Assertions

### Type Guards
```typescript
// Before:
function processUser(user: any) {
  if (user.name && user.email) {
    // ...
  }
}

// After:
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj
  );
}

function processUser(user: unknown) {
  if (isUser(user)) {
    // TypeScript now knows user is of type User
    console.log(user.email); // Safe to access
  }
}
```

### Type Assertions
```typescript
// Before:
const data = response.data as any;

// After:
const data = response.data as User[];

// Or with type assertion function:
function assertIsUserArray(data: unknown): asserts data is User[] {
  if (!Array.isArray(data)) {
    throw new Error('Expected array of users');
  }
}
```

## Utility Types

### Partial and Required
```typescript
// Before:
interface UpdateUserRequest {
  id: string;
  name?: any;
  email?: any;
}

// After:
interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
}

// Or use utility types:
type UpdateUserRequest = Pick<User, 'id'> & Partial<Pick<User, 'name' | 'email'>>;
```

### Record and Mapped Types
```typescript
// Before:
const userRoles: any = {
  admin: 'Administrator',
  user: 'Regular User',
  merchant: 'Merchant'
};

// After:
type UserRole = 'admin' | 'user' | 'merchant';

const userRoles: Record<UserRole, string> = {
  admin: 'Administrator',
  user: 'Regular User',
  merchant: 'Merchant'
};
```

## Migration Strategy

### Phase 1: Critical Types
1. API response types
2. Component props
3. Event handlers
4. State management

### Phase 2: Utility Types
1. Configuration objects
2. Form data
3. Generic functions
4. Error handling

### Phase 3: Advanced Types
1. Type guards
2. Conditional types
3. Mapped types
4. Template literal types

## Tools and Helpers

### Type Checking Script
```bash
# Find all 'any' types in the codebase
npx tsc --noEmit --strict

# Find specific 'any' usage
grep -r "any" src/ --include="*.ts" --include="*.tsx"
```

### ESLint Rules
```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-member-access": "error",
  "@typescript-eslint/no-unsafe-call": "error"
}
```

## Benefits

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Improved autocomplete and refactoring
3. **Documentation**: Types serve as inline documentation
4. **Refactoring Safety**: Safer code changes
5. **Team Collaboration**: Clearer interfaces between components

## Common Patterns

### Union Types
```typescript
type Status = 'loading' | 'success' | 'error';
type Theme = 'light' | 'dark' | 'auto';
```

### Discriminated Unions
```typescript
type ApiResponse = 
  | { status: 'success'; data: User[] }
  | { status: 'error'; message: string };
```

### Generic Constraints
```typescript
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}
```
