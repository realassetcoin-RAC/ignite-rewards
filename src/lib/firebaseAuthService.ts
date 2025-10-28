import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from './firebaseConfig';
import { signInWithPhoneNumber, PhoneAuthProvider, RecaptchaVerifier, signInWithCredential } from 'firebase/auth';
import { databaseAdapter } from './databaseAdapter';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'customer' | 'merchant' | 'admin';
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser | null;
  error?: string;
}

export class FirebaseAuthService {
  private static currentUser: AuthUser | null = null;
  private static authStateListeners: ((user: AuthUser | null) => void)[] = [];
  private static isInitialized = false;

  /**
   * Initialize Firebase Auth service
   */
  static initialize(): void {
    if (this.isInitialized) return;

    // Listen for auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.currentUser = await this.convertFirebaseUserToAuthUser(firebaseUser);
        console.log('✅ Firebase user authenticated:', this.currentUser.email);
      } else {
        this.currentUser = null;
        console.log('🔓 Firebase user signed out');
      }
      this.notifyAuthStateListeners(this.currentUser);
    });

    this.isInitialized = true;
    console.log('🔥 Firebase Auth Service initialized');
  }

  /**
   * Sign in with Google using Firebase
   */
  static async signInWithGoogle(): Promise<AuthResult> {
    try {
      console.log('🔐 Starting Firebase Google sign in...');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = await this.convertFirebaseUserToAuthUser(result.user);
      
      // Create or update user in local PostgreSQL database
      await this.createOrUpdateUserInDatabase(user);
      
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
      
      console.log('✅ Firebase Google sign in successful:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Firebase Google sign in error:', error);
      return { 
        success: false, 
        user: null, 
        error: error instanceof Error ? error.message : 'Google sign in failed' 
      };
    }
  }

  /**
   * Sign in with email and password using Firebase
   */
  static async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Starting Firebase email sign in...');
      
      const { signInWithEmailAndPassword: firebaseSignIn } = await import('firebase/auth');
      const result = await firebaseSignIn(auth, email, password);
      const user = await this.convertFirebaseUserToAuthUser(result.user);
      
      // Create or update user in local PostgreSQL database
      await this.createOrUpdateUserInDatabase(user);
      
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
      
      console.log('✅ Firebase email sign in successful:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Firebase email sign in error:', error);
      return { 
        success: false, 
        user: null, 
        error: error instanceof Error ? error.message : 'Email sign in failed' 
      };
    }
  }

  /**
   * Sign up with email and password using Firebase
   */
  static async signUpWithEmailAndPassword(email: string, password: string, userData?: Partial<AuthUser>): Promise<AuthResult> {
    try {
      console.log('🔐 Starting Firebase email sign up...');
      
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile if name is provided
      if (userData?.name) {
        await updateProfile(result.user, {
          displayName: userData.name
        });
      }
      
      const user = await this.convertFirebaseUserToAuthUser(result.user, userData);
      
      // Create user in local PostgreSQL database
      await this.createOrUpdateUserInDatabase(user);
      
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
      
      console.log('✅ Firebase email sign up successful:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Firebase email sign up error:', error);
      return { 
        success: false, 
        user: null, 
        error: error instanceof Error ? error.message : 'Email sign up failed' 
      };
    }
  }

  /**
   * Sign out from Firebase
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔓 Starting Firebase sign out...');
      
      await signOut(auth);
      this.currentUser = null;
      this.notifyAuthStateListeners(null);
      
      console.log('✅ Firebase sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Firebase sign out error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Send OTP to phone number
   */
  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string; verificationId?: string }> {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      
      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      
      console.log('✅ OTP sent successfully');
      return {
        success: true,
        verificationId: confirmationResult.verificationId
      };
    } catch (error) {
      console.error('❌ OTP send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP'
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(verificationId: string, code: string): Promise<AuthResult> {
    try {
      console.log('🔐 Verifying OTP code...');
      
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);
      
      const user = await this.convertFirebaseUserToAuthUser(result.user);
      await this.createOrUpdateUserInDatabase(user);
      
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
      
      console.log('✅ OTP verification successful');
      return { success: true, user };
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      return {
        success: false,
        user: null,
        error: error instanceof Error ? error.message : 'OTP verification failed'
      };
    }
  }

  /**
   * Listen for authentication state changes
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Convert Firebase User to AuthUser
   */
  private static async convertFirebaseUserToAuthUser(firebaseUser: User, additionalData?: Partial<AuthUser>): Promise<AuthUser> {
    // Try to get user role from local database
    let role: 'customer' | 'merchant' | 'admin' = 'customer';
    
    try {
      // Query local database for user role
      const { data: profile } = await databaseAdapter
        .from('profiles')
        .select('role')
        .eq('id', firebaseUser.uid)
        .single();
      
      if (profile?.role) {
        role = profile.role as 'customer' | 'merchant' | 'admin';
      }
    } catch {
      console.warn('Could not fetch user role from database, defaulting to customer');
    }

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || additionalData?.name || '',
      picture: firebaseUser.photoURL || '',
      role: additionalData?.role || role,
      email_verified: firebaseUser.emailVerified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Create or update user in local PostgreSQL database
   */
  private static async createOrUpdateUserInDatabase(user: AuthUser): Promise<void> {
    try {
      // Check if user exists
      const { data: existingUser } = await databaseAdapter
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingUser) {
        // Update existing user
        await databaseAdapter
          .from('profiles')
          .update({
            email: user.email,
            full_name: user.name,
            avatar_url: user.picture,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } else {
        // Create new user
        await databaseAdapter
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.name,
            avatar_url: user.picture,
            role: user.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error creating/updating user in database:', error);
      // Don't throw error to prevent auth failure
    }
  }

  /**
   * Notify all auth state listeners
   */
  private static notifyAuthStateListeners(user: AuthUser | null): void {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }
}
