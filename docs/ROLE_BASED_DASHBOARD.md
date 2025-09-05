# Role-Based Dashboard Routing

This document explains how the role-based dashboard routing system works in the application.

## Overview

The application now supports automatic redirection to the appropriate dashboard based on the user's role when they click "My Dashboard" in the navigation menu.

## User Roles

The system supports three user roles defined in the database:

- **`admin`** - System administrators
- **`merchant`** - Business merchants 
- **`customer`** - Regular users (default role)

## Dashboard Routing

When a user clicks "My Dashboard", they are redirected to `/dashboard` which uses the `RoleBasedDashboard` component to determine the appropriate dashboard:

### Admin Users
- **Route**: `/admin-panel`
- **Component**: `AdminPanel`
- **Access**: Full system administration capabilities

### Merchant Users  
- **Route**: `/merchant`
- **Component**: `MerchantDashboard`
- **Access**: Merchant-specific features like transaction management, business analytics

### Customer/User
- **Route**: `/user` 
- **Component**: `UserDashboard`
- **Access**: User-specific features like loyalty cards, points, referrals

## Implementation Details

### Components

1. **`RoleBasedDashboard`** (`/src/components/RoleBasedDashboard.tsx`)
   - Main routing component that checks user role
   - Redirects to appropriate dashboard based on `profile.role`
   - Handles loading states and authentication checks

2. **Updated Navigation Components**
   - `EnhancedHeroSection.tsx` - Updated "My Dashboard" link to use `/dashboard`
   - `HeroSection.tsx` - Updated "My Dashboard" link to use `/dashboard`

### Routes

```typescript
// New role-based route
<Route path="/dashboard" element={<RoleBasedDashboard />} />

// Existing specific routes (kept for backward compatibility)
<Route path="/user" element={<UserDashboard />} />
<Route path="/admin-panel" element={<AdminPanel />} />
<Route path="/merchant" element={<MerchantDashboard />} />
```

### Authentication Integration

The system uses the existing `useSecureAuth` hook which provides:
- `user` - Current authenticated user
- `profile` - User profile with role information
- `loading` - Authentication state
- `isAdmin` - Boolean flag for admin status

## Usage

Users simply click "My Dashboard" from any navigation menu, and they will be automatically redirected to the dashboard appropriate for their role:

1. **Admin users** → Admin Panel with full system controls
2. **Merchant users** → Merchant Dashboard with business tools  
3. **Regular users** → User Dashboard with personal features

## Backward Compatibility

- Direct links to specific dashboards (`/user`, `/admin-panel`, `/merchant`) still work
- Existing bookmarks and direct navigation remain functional
- The `/dashboard` route provides the new smart routing behavior

## Security

- All dashboard routes are protected by authentication
- Role-based access is enforced at the component level
- Database-level role checking ensures proper authorization