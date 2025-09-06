# Manual Test Guide for user_loyalty_cards Fix

## 🧪 How to Test the Fix

### Option 1: Browser Test (Recommended)

1. **Open the test file**: Open `test_loyalty_cards_browser.html` in your browser
2. **Update credentials**: Edit the file and replace:
   - `YOUR_SUPABASE_URL` with your actual Supabase URL
   - `YOUR_SUPABASE_ANON_KEY` with your actual anon key
3. **Run tests**: Click "Run Tests" button
4. **Check results**: Review the test results and summary

### Option 2: Node.js Test

1. **Install dependencies** (if not already installed):
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Update credentials** in `test_user_loyalty_cards_fix.js`:
   ```javascript
   const SUPABASE_URL = 'your-actual-supabase-url';
   const SUPABASE_ANON_KEY = 'your-actual-anon-key';
   ```

3. **Run the test**:
   ```bash
   node test_user_loyalty_cards_fix.js
   ```

### Option 3: Manual Frontend Test

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Navigate to loyalty card creation**:
   - Go to the dashboard
   - Click on "Add Virtual Card" or navigate to loyalty card section

3. **Test card creation**:
   - Fill in your details (full name required)
   - Click "Create Card"
   - Verify the card is created successfully
   - Check browser console for any errors

4. **Test card loading**:
   - Refresh the page
   - Verify your card loads correctly
   - Check that all card details are displayed

## 🔍 What to Look For

### ✅ Success Indicators:
- Card creation completes without errors
- Loyalty number is generated and displayed
- Card information is saved and retrievable
- No console errors during the process
- Success toast notification appears

### ❌ Failure Indicators:
- "Error failed to save virtual card" message
- Page reloads during card creation
- Console errors about permissions or schema issues
- Card not loading after creation
- Database connection errors

## 🛠️ Troubleshooting

### If Tests Fail:

1. **Apply the database migration**:
   - Copy the SQL from `supabase/migrations/20250115_final_user_loyalty_cards_fix.sql`
   - Run it in your Supabase dashboard SQL editor

2. **Check Supabase configuration**:
   - Verify your URL and anon key are correct
   - Check that RLS policies are enabled
   - Ensure the `user_loyalty_cards` table exists

3. **Check browser console**:
   - Look for specific error messages
   - Check network tab for failed requests
   - Verify authentication status

### Common Issues:

1. **Permission Denied (42501)**:
   - This is expected if RLS is properly configured
   - The frontend should handle this gracefully
   - Users should still get their loyalty number

2. **Schema Not Found**:
   - Apply the database migration
   - Check that both `api` and `public` schemas are accessible

3. **Function Not Found**:
   - The migration creates the required functions
   - Verify the migration was applied successfully

## 📊 Expected Test Results

### Before Fix:
- ❌ Card creation fails
- ❌ Schema confusion errors
- ❌ Permission denied errors
- ❌ Function signature mismatches

### After Fix:
- ✅ Card creation succeeds
- ✅ Unified schema access
- ✅ Proper error handling
- ✅ Consistent function behavior

## 🎯 Success Criteria

The fix is working correctly if:

1. **All tests pass** in the browser test
2. **Card creation works** in the frontend
3. **No console errors** during normal operation
4. **Data persists** after page refresh
5. **Both schemas work** (api and public)

## 📞 Support

If you encounter issues:

1. **Check the test results** for specific error messages
2. **Review the console logs** for detailed error information
3. **Verify the migration** was applied correctly
4. **Test with different user accounts** to isolate issues

The fix is comprehensive and should resolve all identified issues with the `user_loyalty_cards` table.

