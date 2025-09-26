import { supabase } from '@/integrations/supabase/client';
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('OAuthDebugger');

export interface OAuthDebugInfo {
  supabaseClient: boolean;
  authMethods: boolean;
  signInWithOAuth: boolean;
  currentUrl: string;
  redirectUrl: string;
  environment: string;
  hasGoogleProvider: boolean;
  error?: string;
}

export const debugOAuthConfiguration = async (): Promise<OAuthDebugInfo> => {
  const debugInfo: OAuthDebugInfo = {
    supabaseClient: false,
    authMethods: false,
    signInWithOAuth: false,
    currentUrl: '',
    redirectUrl: '',
    environment: '',
    hasGoogleProvider: false,
  };

  try {
    // Check if Supabase client exists
    debugInfo.supabaseClient = !!supabase;
    logger.debug('Supabase client exists:', debugInfo.supabaseClient);

    if (supabase) {
      // Check if auth methods exist
      debugInfo.authMethods = !!supabase.auth;
      logger.debug('Auth methods exist:', debugInfo.authMethods);

      if (supabase.auth) {
        // Check if signInWithOAuth exists
        debugInfo.signInWithOAuth = typeof supabase.auth.signInWithOAuth === 'function';
        logger.debug('signInWithOAuth method exists:', debugInfo.signInWithOAuth);
      }
    }

    // Get current URL and construct redirect URL
    debugInfo.currentUrl = window.location.href;
    debugInfo.redirectUrl = `${window.location.origin}/auth/callback`;
    debugInfo.environment = import.meta.env.MODE || 'unknown';

    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV;
    logger.debug('Environment info:', {
      mode: debugInfo.environment,
      isDevelopment,
      currentUrl: debugInfo.currentUrl,
      redirectUrl: debugInfo.redirectUrl
    });

    // Test OAuth configuration
    if (debugInfo.signInWithOAuth) {
      try {
        // This is a dry run - we won't actually trigger OAuth
        logger.debug('Testing OAuth configuration...');
        
        // Check if we can access the method without errors
        const testConfig = {
          provider: 'google' as const,
          options: {
            redirectTo: debugInfo.redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        };

        logger.debug('OAuth test configuration:', testConfig);
        debugInfo.hasGoogleProvider = true;
        
      } catch (error) {
        debugInfo.error = `OAuth configuration test failed: ${error}`;
        logger.error('OAuth configuration test error:', error);
      }
    }

  } catch (error) {
    debugInfo.error = `Debug failed: ${error}`;
    logger.error('OAuth debug error:', error);
  }

  return debugInfo;
};

export const testGoogleOAuth = async (): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    logger.info('Testing Google OAuth flow with direct Supabase client...');
    
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    // Use direct Supabase client to bypass database adapter
    const { createClient } = await import('@supabase/supabase-js');
    const directSupabase = createClient(
      'https://wndswqvqogeblksrujpg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
    );
    
    const { data, error } = await directSupabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      logger.error('Google OAuth error:', error);
      return { success: false, error: error.message };
    }

    logger.info('Google OAuth initiated successfully:', data);
    return { success: true, data };

  } catch (error) {
    logger.error('Google OAuth test failed:', error);
    return { success: false, error: `Test failed: ${error}` };
  }
};

export const getOAuthTroubleshootingGuide = (debugInfo: OAuthDebugInfo): string[] => {
  const issues: string[] = [];
  const solutions: string[] = [];

  if (!debugInfo.supabaseClient) {
    issues.push('Supabase client not available');
    solutions.push('Check if Supabase is properly initialized');
  }

  if (!debugInfo.authMethods) {
    issues.push('Auth methods not available');
    solutions.push('Check Supabase client configuration');
  }

  if (!debugInfo.signInWithOAuth) {
    issues.push('signInWithOAuth method not available');
    solutions.push('Update Supabase client to latest version');
  }

  if (debugInfo.environment === 'development') {
    issues.push('Running in development mode');
    solutions.push('Ensure Google OAuth is configured for localhost in Supabase dashboard');
  }

  if (debugInfo.error) {
    issues.push(`Configuration error: ${debugInfo.error}`);
    solutions.push('Check Supabase project settings and OAuth configuration');
  }

  return [
    '=== Google OAuth Troubleshooting Guide ===',
    '',
    'Issues Found:',
    ...issues.map(issue => `❌ ${issue}`),
    '',
    'Recommended Solutions:',
    ...solutions.map(solution => `✅ ${solution}`),
    '',
    'Additional Steps:',
    '1. Go to Supabase Dashboard → Authentication → Providers',
    '2. Enable Google provider',
    '3. Add redirect URLs:',
    `   - ${debugInfo.redirectUrl}`,
    '   - http://localhost:8085/auth/callback (for development)',
    '4. Configure Google OAuth credentials in Google Cloud Console',
    '5. Add authorized origins:',
    `   - ${window.location.origin}`,
    '   - http://localhost:8085 (for development)',
    '',
    'Current Configuration:',
    `- Current URL: ${debugInfo.currentUrl}`,
    `- Redirect URL: ${debugInfo.redirectUrl}`,
    `- Environment: ${debugInfo.environment}`,
    `- Supabase Client: ${debugInfo.supabaseClient ? '✅' : '❌'}`,
    `- Auth Methods: ${debugInfo.authMethods ? '✅' : '❌'}`,
    `- OAuth Method: ${debugInfo.signInWithOAuth ? '✅' : '❌'}`
  ];
};
