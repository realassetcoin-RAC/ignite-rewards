import { databaseAdapter } from './databaseAdapter';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { environment } from '@/config/environment';
import { FirebaseAuthService } from './firebaseAuthService';

const logger = createModuleLogger('GoogleOAuthService');

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface OAuthResult {
  success: boolean;
  user?: GoogleUser;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
}

export class GoogleOAuthService {
  private static config: GoogleOAuthConfig = {
    clientId: environment.oauth.google.clientId,
    redirectUri: environment.oauth.google.redirectUri,
    scope: 'openid email profile'
  };

  /**
   * Initialize Google OAuth with proper configuration
   */
  static async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing Google OAuth service');
      
      // Check if we have the required configuration
      if (!this.config.clientId) {
        logger.warn('Google Client ID not configured, using Supabase OAuth fallback');
        return false;
      }

      // Load Google Identity Services library
      await this.loadGoogleLibrary();
      
      logger.info('Google OAuth service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Google OAuth service:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Load Google Identity Services library dynamically
   */
  private static async loadGoogleLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        logger.info('Google Identity Services library loaded');
        resolve();
      };
      
      script.onerror = () => {
        logger.error('Failed to load Google Identity Services library');
        reject(new Error('Failed to load Google library'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Sign in with Google using Supabase OAuth (recommended approach)
   */
  static async signInWithSupabase(): Promise<OAuthResult> {
    try {
      logger.info('Starting Google OAuth via Supabase');
      
      const { data, error } = await databaseAdapter.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.config.redirectUri,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        logger.error('Supabase Google OAuth error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info('Google OAuth initiated successfully via Supabase');
      return {
        success: true,
        accessToken: data?.url
      };
    } catch (error) {
      logger.error('Google OAuth exception:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to initiate Google OAuth'
      };
    }
  }

  /**
   * Sign in with Google using Firebase (recommended method)
   */
  static async signInWithFirebase(): Promise<OAuthResult> {
    try {
      logger.info('Starting Firebase Google OAuth');
      
      const result = await FirebaseAuthService.signInWithGoogle();
      
      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Firebase Google OAuth failed'
        };
      }

      // Convert Firebase user to GoogleUser format
      const googleUser: GoogleUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        picture: result.user.picture || '',
        verified_email: result.user.email_verified || false
      };

      logger.info('Firebase Google OAuth successful');
      return {
        success: true,
        user: googleUser,
        accessToken: 'firebase-token' // Firebase handles token management internally
      };
    } catch (error: unknown) {
      logger.error('Firebase Google OAuth error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Firebase Google OAuth failed'
      };
    }
  }

  /**
   * Sign in with Google using direct Google Identity Services (fallback)
   */
  static async signInWithGoogle(): Promise<OAuthResult> {
    try {
      logger.info('Starting direct Google OAuth');
      
      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not loaded');
      }

      return new Promise((resolve) => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
          client_id: this.config.clientId,
          callback: async (response: any) => {
            try {
              logger.info('Google OAuth callback received');
              
              // Decode the JWT token
              const payload = this.decodeJWT(response.credential);
              const googleUser: GoogleUser = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                verified_email: payload.email_verified
              };

              logger.info('Google user data:', googleUser);

              // Create or update user in Supabase
              const { error: authError } = await databaseAdapter.supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce: 'random-nonce'
              });

              if (authError) {
                logger.error('Supabase auth error:', authError);
                resolve({
                  success: false,
                  error: authError.message
                });
                return;
              }

              logger.info('Google OAuth successful via direct method');
              resolve({
                success: true,
                user: googleUser,
                accessToken: response.credential
              });
            } catch (error) {
              logger.error('Error processing Google OAuth callback:', error instanceof Error ? error : new Error(String(error)));
              resolve({
                success: false,
                error: 'Failed to process Google OAuth response'
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render the Google Sign-In button
        if (window.google?.accounts?.id) {
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular'
            }
          );

          // Don't call prompt() - it creates duplicate UI
          // The button is already rendered via renderButton()
        }
        }
      });
    } catch (error) {
      logger.error('Direct Google OAuth error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to initiate direct Google OAuth'
      };
    }
  }

  /**
   * Decode JWT token to extract user information
   */
  private static decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const base64Url = parts[1];
      if (!base64Url) {
        throw new Error('Missing JWT payload');
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      logger.error('Failed to decode JWT token:', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Handle OAuth callback and process user session
   */
  static async handleCallback(): Promise<OAuthResult> {
    try {
      logger.info('Handling OAuth callback');
      
      const { data: { session }, error } = await databaseAdapter.supabase.auth.getSession();
      
      if (error) {
        logger.error('Error getting session:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!session?.user) {
        logger.warn('No session found in callback');
        return {
          success: false,
          error: 'No active session found'
        };
      }

      logger.info('OAuth callback successful, user:', session.user.email);
      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          picture: session.user.user_metadata?.avatar_url,
          verified_email: session.user.email_confirmed_at ? true : false
        }
      };
    } catch (error) {
      logger.error('OAuth callback error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to process OAuth callback'
      };
    }
  }

  /**
   * Sign out from Google OAuth
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Signing out from Google OAuth');
      
      // Sign out from Supabase
      const { error } = await databaseAdapter.supabase.auth.signOut();
      
      if (error) {
        logger.error('Supabase sign out error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Sign out from Google if available
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      logger.info('Google OAuth sign out successful');
      return { success: true };
    } catch (error) {
      logger.error('Google OAuth sign out error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  /**
   * Check if Google OAuth is available
   */
  static isAvailable(): boolean {
    return !!(this.config.clientId && window.google?.accounts?.id);
  }

  /**
   * Get OAuth configuration status
   */
  static getConfigStatus(): {
    hasClientId: boolean;
    hasGoogleLibrary: boolean;
    redirectUri: string;
  } {
    return {
      hasClientId: !!this.config.clientId,
      hasGoogleLibrary: !!window.google?.accounts?.id,
      redirectUri: this.config.redirectUri
    };
  }
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
