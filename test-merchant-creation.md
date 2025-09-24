# Merchant Creation Test Guide

## Issues Fixed

1. **User ID Generation**: Fixed the issue where `crypto.randomUUID()` was used to generate a user_id that didn't exist in the auth.users table. Now the system properly creates a user account first using `supabase.auth.admin.createUser()`.

2. **Subscription Plan Mapping**: Fixed the mismatch between subscription plan names in the form (e.g., "Starter", "Growth") and the database enum values (e.g., "basic", "standard"). Added proper mapping functions.

3. **Error Handling**: Added comprehensive error handling with proper user feedback and cleanup of failed operations.

4. **Validation**: Added form validation for required fields and email format.

## How to Test

1. **Start the application**:
   ```bash
   bun run dev
   ```

2. **Navigate to Admin Dashboard**:
   - Go to `http://localhost:5173/admin`
   - Login with admin credentials

3. **Test Merchant Creation**:
   - Click on the "Merchants" tab
   - Click "Add New Merchant" button
   - Fill in the form with:
     - Business Name: "Test Business"
     - Business Type: "Retail"
     - Contact Email: "test@example.com" (use a unique email)
     - Phone: "+1-555-123-4567"
     - City: "New York"
     - Country: "USA"
     - Status: "pending"
     - Subscription Plan: Select any plan (e.g., "Starter")
     - Subscription Start Date: Today's date
     - Free Trial: "1 Month"
   - Click "Create Merchant"

4. **Expected Results**:
   - A user account should be created with the provided email
   - A merchant record should be created in the database
   - Success message should be displayed
   - The merchant should appear in the merchants list

5. **Test Error Handling**:
   - Try creating a merchant with an existing email
   - Try creating a merchant with invalid email format
   - Try creating a merchant without required fields

## Database Changes

The system now properly:
- Creates user accounts in `auth.users` table
- Creates merchant records in `merchants` table with proper foreign key relationships
- Maps subscription plan names to enum values correctly
- Handles cleanup if merchant creation fails

## Notes

- The system creates a temporary password "TempPassword123!" for new merchant accounts
- In production, you should implement a proper password generation and notification system
- The user account is created with `email_confirm: true` to skip email verification
- If merchant creation fails, the user account is automatically cleaned up
