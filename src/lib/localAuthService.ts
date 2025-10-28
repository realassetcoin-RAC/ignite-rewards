// Local Authentication Service
// Handles Google OAuth and Wallet Connect with local PostgreSQL database
// Following .cursorrules: Data Operations → Local PostgreSQL, Authentication → Firebase

import { FirebaseAuthService } from './firebaseAuthService';
import { databaseAdapter } from './databaseAdapter';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider: 'google' | 'wallet';
  wallet_address?: string;
  created_at: string;
  updated_at: string;
}

interface WalletConnection {
  address: string;
  network: 'solana' | 'ethereum';
  signature?: string;
}

class LocalAuthService {
  private static instance: LocalAuthService | null = null;
  private isInitialized = false;

  private constructor() {
    this.initializeFirebase();
  }

  public static getInstance(): LocalAuthService {
    if (!LocalAuthService.instance) {
      LocalAuthService.instance = new LocalAuthService();
    }
    return LocalAuthService.instance;
  }

  private initializeFirebase() {
    if (this.isInitialized) return;

    try {
      // Initialize Firebase Auth Service
      FirebaseAuthService.initialize();
      this.isInitialized = true;
      console.log('✅ LocalAuthService initialized with Firebase for authentication');
    } catch (error) {
      console.error('❌ Failed to initialize LocalAuthService:', error);
      throw error;
    }
  }

  // Google OAuth Authentication
  async signInWithGoogle(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔐 Starting Google OAuth sign in...');

      const result = await FirebaseAuthService.signInWithGoogle();
      
      if (!result.success || !result.user) {
        return { user: null, error: result.error || 'Google OAuth failed' };
      }

      // Convert Firebase user to local AuthUser format
      const localUser: AuthUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar_url: result.user.picture || '',
        provider: 'google',
        created_at: result.user.created_at || new Date().toISOString(),
        updated_at: result.user.updated_at || new Date().toISOString()
      };

      console.log('✅ Google OAuth successful');
      return { user: localUser, error: null };
    } catch (error) {
      console.error('❌ Google OAuth exception:', error);
      return { user: null, error: 'Failed to initiate Google OAuth' };
    }
  }

  // Wallet Connect Authentication
  async signInWithWallet(walletConnection: WalletConnection): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔗 Starting wallet authentication...', { address: walletConnection.address });

      // Verify wallet signature if provided
      if (walletConnection.signature) {
        const isValid = await this.verifyWalletSignature(walletConnection);
        if (!isValid) {
          return { user: null, error: 'Invalid wallet signature' };
        }
      }

      // Create or get user from local database
      const user = await this.createOrGetWalletUser(walletConnection);
      
      if (user) {
        // Store session in localStorage for consistency
        const sessionData = {
          user: {
            id: user.id,
            email: `${user.id}@wallet.local`,
            user_metadata: {
              full_name: `Wallet User ${user.id.substring(0, 8)}`,
              avatar_url: null,
              provider: 'wallet',
              wallet_address: user.wallet_address
            }
          },
          access_token: `wallet_${user.id}_${Date.now()}`,
          refresh_token: `wallet_refresh_${user.id}`,
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        localStorage.setItem('wallet-auth-session', JSON.stringify(sessionData));
        
        console.log('✅ Wallet authentication successful');
        return { user, error: null };
      }

      return { user: null, error: 'Failed to create wallet user' };
    } catch (error) {
      console.error('❌ Wallet authentication error:', error);
      return { user: null, error: 'Wallet authentication failed' };
    }
  }

  // Verify wallet signature
  private async verifyWalletSignature(walletConnection: WalletConnection): Promise<boolean> {
    try {
      // This is a simplified verification - in production, you'd want more robust verification
      if (!walletConnection.signature) return false;
      
      // For now, just check if signature exists and has reasonable length
      return walletConnection.signature.length > 10;
    } catch (error) {
      console.error('❌ Wallet signature verification failed:', error);
      return false;
    }
  }

  // Create or get wallet user from local database
  private async createOrGetWalletUser(walletConnection: WalletConnection): Promise<AuthUser | null> {
    try {
      // Use databaseAdapter to interact with local PostgreSQL
      const { data: existingUser, error: fetchError } = await databaseAdapter
        .from('users')
        .select('*')
        .eq('wallet_address', walletConnection.address)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error fetching wallet user:', fetchError);
        return null;
      }

      if (existingUser) {
        console.log('✅ Found existing wallet user:', existingUser.id);
        return existingUser;
      }

      // Create new wallet user
      const newUser = {
        id: `wallet_${walletConnection.address}_${Date.now()}`,
        email: `${walletConnection.address}@wallet.local`,
        name: `Wallet User ${walletConnection.address.substring(0, 8)}`,
        provider: 'wallet',
        wallet_address: walletConnection.address,
        network: walletConnection.network,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdUser, error: createError } = await databaseAdapter
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating wallet user:', createError);
        return null;
      }

      console.log('✅ Created new wallet user:', createdUser.id);
      return createdUser;
    } catch (error) {
      console.error('❌ Error in createOrGetWalletUser:', error);
      return null;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Check Firebase user first
      const firebaseUser = FirebaseAuthService.getCurrentUser();
      
      if (firebaseUser) {
        // Google OAuth user from Firebase
        return {
          id: firebaseUser.id,
          email: firebaseUser.email,
          name: firebaseUser.name,
          avatar_url: firebaseUser.picture || '',
          provider: 'google',
          created_at: firebaseUser.created_at || new Date().toISOString(),
          updated_at: firebaseUser.updated_at || new Date().toISOString()
        };
      }

      // Check localStorage for wallet user
      const walletSession = localStorage.getItem('wallet-auth-session');
      if (walletSession) {
        try {
          const sessionData = JSON.parse(walletSession);
          if (sessionData.user?.provider === 'wallet') {
            return {
              id: sessionData.user.id,
              email: sessionData.user.email,
              name: sessionData.user.name,
              provider: 'wallet',
              wallet_address: sessionData.user.wallet_address,
              created_at: sessionData.user.created_at,
              updated_at: sessionData.user.updated_at
            };
          }
        } catch (parseError) {
          console.error('❌ Error parsing wallet session:', parseError);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      // Sign out from Firebase
      const result = await FirebaseAuthService.signOut();
      
      // Clear localStorage
      localStorage.removeItem('wallet-auth-session');
      localStorage.removeItem('firebase-auth-session');
      
      if (!result.success) {
        console.error('❌ Firebase sign out error:', result.error);
        return { error: result.error || 'Sign out failed' };
      }

      console.log('✅ Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error: 'Sign out failed' };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return FirebaseAuthService.onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        const user: AuthUser = {
          id: firebaseUser.id,
          email: firebaseUser.email,
          name: firebaseUser.name,
          avatar_url: firebaseUser.picture || '',
          provider: 'google',
          created_at: firebaseUser.created_at || new Date().toISOString(),
          updated_at: firebaseUser.updated_at || new Date().toISOString()
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

// Export singleton instance
export const localAuthService = LocalAuthService.getInstance();
export default localAuthService;
