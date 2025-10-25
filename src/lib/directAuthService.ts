// Direct Authentication Service (No Supabase)
import { createModuleLogger } from '@/utils/consoleReplacer';
import { DirectGoogleOAuth, GoogleUser } from './directGoogleOAuth';

const logger = createModuleLogger('DirectAuthService');

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'admin' | 'merchant' | 'customer';
  loyalty_number?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export class DirectAuthService {
  private static currentUser: AuthUser | null = null;

  static async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing Direct Authentication Service');
      
      const googleOAuthReady = await DirectGoogleOAuth.initialize();
      if (!googleOAuthReady) {
        logger.warn('Google OAuth not available, but continuing with direct auth');
      }

      await this.checkExistingSession();
      
      logger.info('Direct Authentication Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Direct Authentication Service:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  private static async checkExistingSession(): Promise<void> {
    try {
      const googleUser = DirectGoogleOAuth.getCurrentUser();
      if (googleUser) {
        const authUser = await this.convertGoogleUserToAuthUser(googleUser);
        if (authUser) {
          this.currentUser = authUser;
          logger.info('Existing session found for user:', authUser.email);
        }
      }
    } catch (error) {
      logger.error('Error checking existing session:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private static async convertGoogleUserToAuthUser(googleUser: GoogleUser): Promise<AuthUser | null> {
    try {
      const authUser: AuthUser = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        role: 'customer',
        loyalty_number: this.generateLoyaltyNumber(googleUser.email),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return authUser;
    } catch (error) {
      logger.error('Error converting Google user to AuthUser:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  private static generateLoyaltyNumber(email: string): string {
    const initial = email.charAt(0).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return initial + timestamp;
  }

  static async signInWithGoogle(): Promise<AuthResult> {
    try {
      logger.info('Starting Google sign in');
      
      const result = await DirectGoogleOAuth.signIn();
      
      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Google sign in failed'
        };
      }

      const authUser = await this.convertGoogleUserToAuthUser(result.user);
      if (!authUser) {
        return {
          success: false,
          error: 'Failed to create user profile'
        };
      }

      this.currentUser = authUser;
      logger.info('Google sign in successful for user:', authUser.email);
      
      return {
        success: true,
        user: authUser
      };
    } catch (error) {
      logger.error('Google sign in error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Google sign in failed'
      };
    }
  }

  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Signing out user');
      
      await DirectGoogleOAuth.signOut();
      this.currentUser = null;
      
      logger.info('Sign out successful');
      return { success: true };
    } catch (error) {
      logger.error('Sign out error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Sign out failed'
      };
    }
  }

  static getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  static isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  static hasRole(role: 'admin' | 'merchant' | 'customer'): boolean {
    return this.currentUser?.role === role;
  }

  static getLoyaltyNumber(): string | null {
    return this.currentUser?.loyalty_number || null;
  }

  static async updateUserProfile(updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUser) {
        return {
          success: false,
          error: 'No authenticated user'
        };
      }

      this.currentUser = {
        ...this.currentUser,
        ...updates,
        updated_at: new Date().toISOString()
      };

      logger.info('User profile updated');
      
      return { success: true };
    } catch (error) {
      logger.error('Error updating user profile:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  static getAuthStatus(): {
    isAuthenticated: boolean;
    user: AuthUser | null;
    hasGoogleOAuth: boolean;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser,
      hasGoogleOAuth: DirectGoogleOAuth.isAvailable()
    };
  }
}
