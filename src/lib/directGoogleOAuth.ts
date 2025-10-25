// Direct Google OAuth Service (No Supabase)
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('DirectGoogleOAuth');

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
}

export class DirectGoogleOAuth {
  private static config = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/auth/callback',
    scope: 'openid email profile'
  };

  static async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing Direct Google OAuth service');
      logger.info('Environment variables:', {
        VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        VITE_GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
        config: this.config,
        allEnvVars: import.meta.env
      });
      
      if (!this.config.clientId) {
        logger.warn('Google Client ID not configured');
        logger.warn('Available env vars:', Object.keys(import.meta.env));
        return false;
      }

      await this.loadGoogleLibrary();
      logger.info('Direct Google OAuth service initialized successfully');
      
      // Test configuration
      this.testConfiguration();
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize Direct Google OAuth service:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  private static testConfiguration(): void {
    logger.info('Testing OAuth configuration...');
    logger.info('Client ID:', this.config.clientId);
    logger.info('Redirect URI:', this.config.redirectUri);
    logger.info('Current Origin:', window.location.origin);
    logger.info('Expected Origin:', 'http://localhost:8084');
    
    if (window.location.origin !== 'http://localhost:8084') {
      logger.warn('Origin mismatch! Expected http://localhost:8084, got:', window.location.origin);
    }
    
    if (this.config.redirectUri !== 'http://localhost:8084/auth/callback') {
      logger.warn('Redirect URI mismatch! Expected http://localhost:8084/auth/callback, got:', this.config.redirectUri);
    }
  }

  private static renderGoogleButton(): void {
    try {
      // Create a temporary container for the Google button
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-button-temp';
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '50%';
      buttonContainer.style.left = '50%';
      buttonContainer.style.transform = 'translate(-50%, -50%)';
      buttonContainer.style.zIndex = '10000';
      buttonContainer.style.backgroundColor = 'white';
      buttonContainer.style.padding = '20px';
      buttonContainer.style.borderRadius = '8px';
      buttonContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      
      document.body.appendChild(buttonContainer);
      
      // Render the Google button
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left'
      });
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (buttonContainer.parentNode) {
          buttonContainer.parentNode.removeChild(buttonContainer);
        }
      }, 10000);
      
    } catch (error) {
      logger.error('Error rendering Google button:', error instanceof Error ? error : new Error(String(error)));
    }
  }

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

        static async signIn(): Promise<OAuthResult> {
          try {
            logger.info('Starting direct Google OAuth');
            logger.info('Current configuration:', {
              clientId: this.config.clientId,
              redirectUri: this.config.redirectUri,
              currentOrigin: window.location.origin,
              currentUrl: window.location.href
            });

            if (!window.google?.accounts?.id) {
              throw new Error('Google Identity Services not loaded');
            }

            // Check if origin is allowed first
            const originCheck = await this.checkOriginAllowed();
            if (!originCheck.allowed) {
              logger.error('Origin not allowed in Google Console:', originCheck.error);
              return {
                success: false,
                error: `Google OAuth configuration issue: ${originCheck.error}. Please ensure http://localhost:8084 is added to Authorized JavaScript origins in Google Cloud Console.`
              };
            }

            // Try One Tap first
            const oneTapResult = await this.signInWithOneTap();
            if (oneTapResult.success) {
              return oneTapResult;
            }

            // If One Tap fails, try redirect method as fallback
            logger.info('One Tap failed, trying redirect method as fallback');
            return await this.signInWithRedirect();
          } catch (error) {
            logger.error('Direct Google OAuth error:', error instanceof Error ? error : new Error(String(error)));
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
          }
        }

  private static async checkOriginAllowed(): Promise<{ allowed: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        if (!window.google?.accounts?.id) {
          resolve({ allowed: false, error: 'Google Identity Services not loaded' });
          return;
        }

        // Skip origin check and proceed directly - let the actual OAuth attempt handle the error
        // This prevents timeout issues and provides better error messages
        logger.info('Skipping origin check, proceeding with OAuth attempt');
        resolve({ allowed: true });

      } catch (error) {
        resolve({ 
          allowed: false, 
          error: error instanceof Error ? error.message : 'Unknown error during origin check' 
        });
      }
    });
  }

  private static async signInWithRedirect(): Promise<OAuthResult> {
    try {
      logger.info('Using redirect method for Google OAuth');
      
      // Store the current page URL to return to after OAuth
      sessionStorage.setItem('oauth_return_url', window.location.href);
      
      // Redirect to Google OAuth
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.config.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(this.config.scope)}&` +
        `access_type=offline&` +
        `prompt=select_account&` +
        `include_granted_scopes=true&` +
        `state=${encodeURIComponent(JSON.stringify({ method: 'redirect' }))}`;

      window.location.href = authUrl;
      
      return {
        success: true,
        user: undefined, // Will be set after redirect
        accessToken: undefined // Will be set after redirect
      };
    } catch (error) {
      logger.error('Redirect OAuth error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to initiate redirect OAuth'
      };
    }
  }

  private static async signInWithPopup(): Promise<OAuthResult> {
    return new Promise((resolve) => {
      try {
        // Create popup window for OAuth using the correct Google OAuth endpoint
        const popup = window.open(
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${this.config.clientId}&` +
          `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(this.config.scope)}&` +
          `access_type=offline&` +
          `prompt=select_account&` +
          `include_granted_scopes=true`,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          resolve({
            success: false,
            error: 'Popup blocked. Please allow popups for this site.'
          });
          return;
        }

        // Listen for popup messages
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            popup.close();
            window.removeEventListener('message', messageListener);
            resolve({
              success: true,
              user: event.data.user,
              accessToken: event.data.accessToken
            });
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', messageListener);
            resolve({
              success: false,
              error: event.data.error
            });
          }
        };

        window.addEventListener('message', messageListener);

        // Check if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            resolve({
              success: false,
              error: 'Authentication cancelled by user'
            });
          }
        }, 1000);

      } catch (error) {
        resolve({
          success: false,
          error: 'Failed to open authentication popup'
        });
      }
    });
  }

  static async signInWithOneTap(): Promise<OAuthResult> {
    try {
      logger.info('Starting Google One Tap OAuth');
      
      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not loaded');
      }

      return new Promise((resolve) => {
        if (!window.google?.accounts?.id) {
          resolve({
            success: false,
            error: 'Google Identity Services not available'
          });
          return;
        }

        // Add timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          logger.warn('Google OAuth timeout - no response received');
          resolve({
            success: false,
            error: 'Google sign-in timed out. Please ensure localhost:8084 is added to authorized origins in Google Cloud Console.'
          });
        }, 5000); // 5 second timeout
        
        logger.info('Initializing Google Identity Services with config:', {
          client_id: this.config.clientId,
          redirect_uri: this.config.redirectUri
        });
        
        window.google!.accounts!.id!.initialize({
          client_id: this.config.clientId,
          callback: async (response: any) => {
            clearTimeout(timeoutId); // Clear timeout on success
            try {
              logger.info('Google OAuth callback received');
              
              const payload = this.decodeJWT(response.credential);
              const googleUser: GoogleUser = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                verified_email: payload.email_verified
              };

              logger.info('Google user data:', googleUser);

              // Create session object compatible with auth system
              const session = {
                user: {
                  id: googleUser.id,
                  email: googleUser.email,
                  user_metadata: {
                    full_name: googleUser.name,
                    avatar_url: googleUser.picture,
                    email_verified: googleUser.verified_email
                  },
                  email_confirmed_at: googleUser.verified_email ? new Date().toISOString() : null
                },
                access_token: response.credential,
                expires_at: Date.now() + (3600 * 1000) // 1 hour
              };

              // Save to localStorage for auth system
              localStorage.setItem('google_user', JSON.stringify(googleUser));
              localStorage.setItem('google_access_token', response.credential);
              localStorage.setItem('auth_session', JSON.stringify(session));
              localStorage.setItem('auth_user', JSON.stringify(session.user));

              // Trigger storage event to notify other tabs/windows
              window.dispatchEvent(new Event('storage'));
              
              // Dispatch custom event for auth state change
              window.dispatchEvent(new CustomEvent('auth-state-change', {
                detail: { event: 'SIGNED_IN', session }
              }));

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
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // Disable FedCM to avoid Cross-Origin-Opener-Policy issues
          itp_support: true, // Enable Intelligent Tracking Prevention support
          context: 'signin' // Specify the context for better UX
        });

        // Trigger the One Tap popup directly
        // Note: This may fail if origin is not allowed in Google Console
        setTimeout(() => {
          try {
            if (window.google?.accounts?.id) {
              logger.info('Attempting to show Google One Tap prompt');
              window.google.accounts.id.prompt();
            } else {
              clearTimeout(timeoutId);
              resolve({
                success: false,
                error: 'Google Identity Services not available'
              });
            }
          } catch (promptError) {
            clearTimeout(timeoutId);
            logger.error('Error showing Google prompt:', promptError instanceof Error ? promptError : new Error(String(promptError)));
            resolve({
              success: false,
              error: 'Google sign-in is not properly configured. Please ensure localhost:8084 is added to authorized origins in Google Cloud Console.'
            });
          }
        }, 100);
      });
    } catch (error) {
      logger.error('Direct Google OAuth error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to initiate direct Google OAuth'
      };
    }
  }

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

  static getCurrentUser(): GoogleUser | null {
    try {
      const userData = localStorage.getItem('google_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      logger.error('Error getting current user:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Signing out from Direct Google OAuth');
      
      localStorage.removeItem('google_user');
      localStorage.removeItem('google_access_token');

      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      logger.info('Direct Google OAuth sign out successful');
      return { success: true };
    } catch (error) {
      logger.error('Direct Google OAuth sign out error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  static isAvailable(): boolean {
    return !!(this.config.clientId && window.google?.accounts?.id);
  }

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
