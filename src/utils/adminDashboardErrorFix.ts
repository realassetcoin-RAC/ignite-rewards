// Admin Dashboard Error Fix Utilities
// This module provides enhanced error handling and debugging for admin dashboard

import { supabase } from "@/integrations/supabase/client";

// Enhanced error logging
export const logError = (context: string, error: any) => {
  console.error(`[Admin Dashboard - ${context}]:`, {
    message: error?.message || 'Unknown error',
    details: error?.details || error,
    timestamp: new Date().toISOString(),
    stack: error?.stack
  });
};

// Check if user has admin access
export const verifyAdminAccess = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logError('Auth Check', 'No authenticated user');
      return false;
    }

    // Check profile for admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logError('Profile Check', profileError);
      return false;
    }

    return profile?.role === 'admin';
  } catch (error) {
    logError('Admin Access Verification', error);
    return false;
  }
};

// Safe data fetching with detailed error logging
export const safeFetch = async <T>(
  query: Promise<any>,
  context: string,
  defaultValue: T
): Promise<T> => {
  try {
    const result = await query;
    
    if (result.error) {
      logError(context, result.error);
      
      // Check for common issues
      if (result.error.message?.includes('permission denied')) {
        console.warn(`[${context}]: Permission denied. Admin role may be required.`);
      } else if (result.error.message?.includes('relation') && result.error.message?.includes('does not exist')) {
        console.warn(`[${context}]: Table may not exist in database.`);
      }
      
      return defaultValue;
    }
    
    return result.data || defaultValue;
  } catch (error) {
    logError(context, error);
    return defaultValue;
  }
};

// Enhanced stats loading
export const loadAdminStats = async () => {
  const stats = {
    totalCards: 0,
    totalMerchants: 0,
    activeMerchants: 0,
    totalRevenue: 0,
    totalUsers: 0
  };

  try {
    // Load virtual cards count
    const cardsCount = await safeFetch(
      supabase.from('virtual_cards').select('*', { count: 'exact', head: true }),
      'Virtual Cards Count',
      { count: 0 }
    );
    stats.totalCards = cardsCount.count || 0;

    // Load total merchants
    const merchantsCount = await safeFetch(
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
      'Total Merchants Count',
      { count: 0 }
    );
    stats.totalMerchants = merchantsCount.count || 0;

    // Load active merchants
    const activeMerchantsCount = await safeFetch(
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      'Active Merchants Count',
      { count: 0 }
    );
    stats.activeMerchants = activeMerchantsCount.count || 0;

    // Load total users
    const usersCount = await safeFetch(
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      'Total Users Count',
      { count: 0 }
    );
    stats.totalUsers = usersCount.count || 0;

    return stats;
  } catch (error) {
    logError('Load Admin Stats', error);
    return stats;
  }
};

// Test database connectivity
export const testDatabaseConnection = async () => {
  console.log('[Admin Dashboard] Testing database connection...');
  
  try {
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logError('Auth Test', authError);
      return false;
    }
    console.log('[Admin Dashboard] Auth test passed:', user?.email);

    // Test basic query
    const { error: queryError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (queryError) {
      logError('Query Test', queryError);
      return false;
    }
    console.log('[Admin Dashboard] Database query test passed');

    return true;
  } catch (error) {
    logError('Database Connection Test', error);
    return false;
  }
};

// Debug function to check table existence and permissions
export const debugTables = async () => {
  const tables = ['merchant_subscription_plans', 'user_referrals', 'referral_campaigns', 'virtual_cards', 'merchants', 'profiles'];
  
  console.log('[Admin Dashboard] Checking table access...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    } catch (err) {
      console.error(`❌ ${table}: Failed to query`, err);
    }
  }
};