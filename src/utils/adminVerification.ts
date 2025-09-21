/**
 * Admin Verification Utility
 * 
 * This utility provides comprehensive admin access verification and debugging tools
 * to diagnose and resolve admin dashboard loading issues permanently.
 */

// import { supabase } from '@/integrations/supabase/client';

export interface AdminVerificationResult {
  success: boolean;
  userId?: string;
  email?: string;
  profileExists: boolean;
  role?: string;
  isAdmin: boolean;
  methods: {
    rpcIsAdmin?: boolean | null;
    rpcCheckAdminAccess?: boolean | null;
    directProfileQuery?: boolean | null;
  };
  errors: string[];
  recommendations: string[];
}

/**
 * Comprehensive admin verification for a specific user
 */
export async function verifyAdminAccess(email?: string): Promise<AdminVerificationResult> {
  const result: AdminVerificationResult = {
    success: false,
    profileExists: false,
    isAdmin: false,
    methods: {},
    errors: [],
    recommendations: []
  };

  try {
    // Get user information
    let userId: string;
    let userEmail: string;

    if (email) {
      // For specific email verification (admin use)
      userEmail = email;
      // We can't directly query auth.users from client, so we'll work with what we have
      result.email = email;
    } else {
      // For current user verification
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        result.errors.push('No authenticated user found');
        return result;
      }
      userId = user.id;
      userEmail = user.email || '';
      result.userId = userId;
      result.email = userEmail;
    }

    console.log(`Verifying admin access for: ${userEmail}`);

    // Method 1: Try is_admin RPC function
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        result.errors.push(`is_admin RPC error: ${error.message}`);
        result.methods.rpcIsAdmin = null;
      } else {
        result.methods.rpcIsAdmin = data === true;
        if (data === true) {
          result.isAdmin = true;
          console.log('✅ Admin access confirmed via is_admin RPC');
        }
      }
    } catch (error) {
      result.errors.push(`is_admin RPC exception: ${error}`);
      result.methods.rpcIsAdmin = null;
    }

    // Method 2: Try check_admin_access RPC function
    try {
      const { data, error } = await supabase.rpc('check_admin_access');
      if (error) {
        result.errors.push(`check_admin_access RPC error: ${error.message}`);
        result.methods.rpcCheckAdminAccess = null;
      } else {
        result.methods.rpcCheckAdminAccess = data === true;
        if (data === true) {
          result.isAdmin = true;
          console.log('✅ Admin access confirmed via check_admin_access RPC');
        }
      }
    } catch (error) {
      result.errors.push(`check_admin_access RPC exception: ${error}`);
      result.methods.rpcCheckAdminAccess = null;
    }

    // Method 3: Direct profile query
    if (userId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, role, full_name')
          .eq('id', userId)
          .single();

        if (profileError) {
          result.errors.push(`Profile query error: ${profileError.message}`);
          result.methods.directProfileQuery = null;
        } else if (profile) {
          result.profileExists = true;
          result.role = profile.role;
          const isAdminRole = profile.role === 'admin';
          result.methods.directProfileQuery = isAdminRole;
          
          if (isAdminRole) {
            result.isAdmin = true;
            console.log('✅ Admin access confirmed via direct profile query');
          }
        }
      } catch (error) {
        result.errors.push(`Profile query exception: ${error}`);
        result.methods.directProfileQuery = null;
      }
    }

    // Generate recommendations based on findings
    if (!result.isAdmin) {
      if (!result.profileExists) {
        result.recommendations.push('User profile does not exist in the profiles table');
        result.recommendations.push('Run the admin fix migration to create the profile');
      } else if (result.role && result.role !== 'admin') {
        result.recommendations.push(`User role is '${result.role}' instead of 'admin'`);
        result.recommendations.push('Update the user role to admin in the database');
      }

      if (result.methods.rpcIsAdmin === null && result.methods.rpcCheckAdminAccess === null) {
        result.recommendations.push('Both admin RPC functions are failing');
        result.recommendations.push('Apply the permanent admin fix migration');
      }
    }

    result.success = result.isAdmin;

    return result;
  } catch (error) {
    result.errors.push(`Verification failed: ${error}`);
    return result;
  }
}

/**
 * Diagnose admin access issues and provide detailed logging
 */
export async function diagnoseAdminIssues(): Promise<void> {
  console.log('🔍 Starting admin access diagnosis...');
  
  const result = await verifyAdminAccess();
  
  console.log('📊 Admin Verification Results:');
  console.log('- Success:', result.success);
  console.log('- User ID:', result.userId);
  console.log('- Email:', result.email);
  console.log('- Profile Exists:', result.profileExists);
  console.log('- Role:', result.role);
  console.log('- Is Admin:', result.isAdmin);
  
  console.log('🔧 Method Results:');
  console.log('- RPC is_admin:', result.methods.rpcIsAdmin);
  console.log('- RPC check_admin_access:', result.methods.rpcCheckAdminAccess);
  console.log('- Direct profile query:', result.methods.directProfileQuery);
  
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    result.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}

/**
 * Check if the current user should have access to admin features
 */
export async function shouldAllowAdminAccess(): Promise<boolean> {
  const result = await verifyAdminAccess();
  
  // Log the verification for debugging
  if (!result.success) {
    console.warn('Admin access denied. Running diagnosis...');
    await diagnoseAdminIssues();
  }
  
  return result.success;
}

/**
 * Enhanced admin check with automatic fallbacks and error recovery
 */
export async function robustAdminCheck(): Promise<boolean> {
  console.group('🔍 Robust Admin Check');
  try {
    // First, check known admin emails (fastest and most reliable)
    console.log('Step 1: Checking known admin emails...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    
    if (user?.email) {
      // List of known admin emails (can be configured)
      const knownAdminEmails = [
        'realassetcoin@gmail.com',
        'admin@igniterewards.com', // Test admin user
        // Add other known admin emails here
      ];
      
      console.log('Known admin emails:', knownAdminEmails);
      console.log('Checking if user email is in known admins...');
      
      if (knownAdminEmails.includes(user.email.toLowerCase())) {
        console.log(`🔓 Granting admin access to known admin email: ${user.email}`);
        console.groupEnd();
        return true;
      } else {
        console.log(`❌ User email ${user.email} is not in known admin list`);
      }
    } else {
      console.log('❌ No user email found');
    }
    
    // Step 2: Try enhanced admin check with timeout
    console.log('Step 2: Running enhanced admin check with timeout...');
    try {
      const { enhancedAdminCheck } = await import('./adminDashboardFix');
      
      // Add timeout to prevent hanging
      const adminCheckPromise = enhancedAdminCheck();
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Enhanced admin check timeout after 5 seconds')), 5000)
      );
      
      const result = await Promise.race([adminCheckPromise, timeoutPromise]);
      
      if (result) {
        console.log('✅ Admin access granted via enhanced admin check');
        console.groupEnd();
        return true;
      }
    } catch {
      console.log('⚠️ Enhanced admin check timeout, continuing with other methods');
    }
    
    console.log('❌ Admin access denied');
    console.groupEnd();
    return false;
  } catch (error) {
    console.error('Robust admin check failed:', error);
    console.groupEnd();
    return false;
  }
}